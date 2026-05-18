import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Document } from '@langchain/core/documents';
import { OllamaEmbeddings } from '@langchain/ollama';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import { decodeKnowledgeTextBuffer } from './knowledge-text.util';
import { KnowledgeChunk } from './entities/knowledge-chunk.entity';
import { KnowledgeFile } from './entities/knowledge-file.entity';
import {
  KNOWLEDGE_DB_CONNECTION,
  KnowledgeUserContext,
  KnowledgeVisibility,
} from './knowledge.types';

interface DocumentLocation {
  pageNumber?: number;
}

export interface KnowledgeFileListItem {
  id: string;
  name: string;
  size: number;
  mimeType: string | null;
  chunks: number;
  visibility: KnowledgeVisibility;
  uploadedAt: Date;
  ownerUsername: string;
  isOwner: boolean;
}

export interface KnowledgeUploadResult {
  id: string;
  chunks: number;
  filename: string;
  visibility: KnowledgeVisibility;
}

@Injectable()
export class KnowledgeService {
  private readonly embeddings: OllamaEmbeddings;
  private readonly splitter: RecursiveCharacterTextSplitter;

  constructor(
    @InjectRepository(KnowledgeFile, KNOWLEDGE_DB_CONNECTION)
    private readonly knowledgeFileRepository: Repository<KnowledgeFile>,
    @InjectDataSource(KNOWLEDGE_DB_CONNECTION)
    private readonly knowledgeDataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    this.embeddings = new OllamaEmbeddings({
      model:
        this.configService.get<string>('AI.EMBEDDING_MODEL') ??
        'nomic-embed-text-v2-moe:latest',
      baseUrl:
        this.configService.get<string>('AI.OLLAMA_BASE_URL') ??
        'http://127.0.0.1:11434',
    });

    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });
  }

  async processFile(
    file: Express.Multer.File,
    owner: KnowledgeUserContext,
    visibility: KnowledgeVisibility,
  ): Promise<KnowledgeUploadResult> {
    const docs = await this.loadDocuments(file);

    if (docs.length === 0 || docs.every((doc) => !doc.pageContent.trim())) {
      throw new BadRequestException('文件内容为空，或暂时无法解析出可用文本');
    }

    const splitDocs = await this.splitter.splitDocuments(docs);

    if (splitDocs.length === 0) {
      throw new BadRequestException('文件切分后未生成可用片段');
    }

    const chunkContents = splitDocs.map((doc) => doc.pageContent);
    const embeddings = await this.embeddings.embedDocuments(chunkContents);

    const savedFile = await this.knowledgeDataSource.transaction(
      async (manager) => {
        const knowledgeFile = manager.create(KnowledgeFile, {
          ownerUserId: owner.userId,
          ownerUsername: owner.username,
          visibility,
          originalName: file.originalname,
          mimeType: file.mimetype || null,
          size: file.size,
          chunkCount: splitDocs.length,
        });

        const persistedFile = await manager.save(KnowledgeFile, knowledgeFile);

        const chunks = splitDocs.map((doc, index) =>
          manager.create(KnowledgeChunk, {
            fileId: persistedFile.id,
            chunkIndex: index,
            content: doc.pageContent,
            metadata: this.normalizeMetadata(doc.metadata),
            embedding: embeddings[index],
          }),
        );

        await manager.save(KnowledgeChunk, chunks);
        return persistedFile;
      },
    );

    return {
      id: savedFile.id,
      chunks: splitDocs.length,
      filename: file.originalname,
      visibility,
    };
  }

  async listFiles(
    user: KnowledgeUserContext,
  ): Promise<KnowledgeFileListItem[]> {
    const files = await this.knowledgeFileRepository.find({
      where: [
        { ownerUserId: user.userId },
        { visibility: KnowledgeVisibility.PUBLIC },
      ],
      order: {
        createdAt: 'DESC',
      },
    });

    return files.map((file) => ({
      id: file.id,
      name: file.originalName,
      size: Number(file.size),
      mimeType: file.mimeType,
      chunks: file.chunkCount,
      visibility: file.visibility,
      uploadedAt: file.createdAt,
      ownerUsername: file.ownerUsername,
      isOwner: file.ownerUserId === user.userId,
    }));
  }

  async removeFile(id: string, user: KnowledgeUserContext): Promise<void> {
    const file = await this.knowledgeFileRepository.findOne({ where: { id } });

    if (!file) {
      throw new NotFoundException('知识库文件不存在');
    }

    if (file.ownerUserId !== user.userId) {
      throw new ForbiddenException('只能删除自己上传的知识库文件');
    }

    await this.knowledgeFileRepository.remove(file);
  }

  async removeOwnFiles(
    user: KnowledgeUserContext,
    visibility?: KnowledgeVisibility,
  ): Promise<number> {
    const deleteBuilder = this.knowledgeFileRepository
      .createQueryBuilder()
      .delete()
      .from(KnowledgeFile)
      .where('owner_user_id = :userId', { userId: user.userId });

    if (visibility) {
      deleteBuilder.andWhere('visibility = :visibility', { visibility });
    }

    const result = await deleteBuilder.execute();
    return result.affected ?? 0;
  }

  async query(
    question: string,
    user: KnowledgeUserContext,
    topK: number = 3,
  ): Promise<{
    answer: string;
    sources: Document[];
  }> {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      return {
        answer: '请先提供要检索的问题。',
        sources: [],
      };
    }

    const queryEmbedding = await this.embeddings.embedQuery(trimmedQuestion);
    const relevantDocs = await this.searchRelevantChunks(
      user,
      this.toVectorLiteral(queryEmbedding),
      topK,
    );

    if (relevantDocs.length === 0) {
      return {
        answer: '抱歉，知识库中没有找到相关信息。',
        sources: [],
      };
    }

    const context = relevantDocs
      .map((doc) => {
        const loc = doc.metadata.loc as DocumentLocation | undefined;
        const pageInfo =
          typeof loc?.pageNumber === 'number' ? ` 第 ${loc.pageNumber} 页` : '';
        const visibilityLabel =
          doc.metadata.visibility === KnowledgeVisibility.PUBLIC
            ? '公开'
            : '私人';

        return `[来源：${String(doc.metadata.filename ?? '未知来源')} / ${visibilityLabel}${pageInfo}]\n${doc.pageContent}`;
      })
      .join('\n\n');

    return {
      answer: context,
      sources: relevantDocs,
    };
  }

  private async searchRelevantChunks(
    user: KnowledgeUserContext,
    vectorLiteral: string,
    topK: number,
  ): Promise<Document[]> {
    const rows = await this.knowledgeDataSource.query(
      `
        SELECT
          chunk.content AS content,
          chunk.metadata AS metadata,
          file.original_name AS filename,
          file.owner_username AS owner_username,
          file.visibility AS visibility,
          chunk.embedding <=> $2::vector AS distance
        FROM knowledge_chunk chunk
        INNER JOIN knowledge_file file ON file.id = chunk.file_id
        WHERE file.owner_user_id = $1 OR file.visibility = $3
        ORDER BY chunk.embedding <=> $2::vector ASC
        LIMIT $4
      `,
      [user.userId, vectorLiteral, KnowledgeVisibility.PUBLIC, topK],
    );

    return rows.map((row: Record<string, unknown>) => {
      const metadata = this.parseMetadata(row.metadata);

      return new Document({
        pageContent: String(row.content ?? ''),
        metadata: {
          ...metadata,
          filename: String(row.filename ?? '未知来源'),
          ownerUsername: String(row.owner_username ?? ''),
          visibility: String(row.visibility ?? KnowledgeVisibility.PRIVATE),
          distance: Number(row.distance ?? 0),
        },
      });
    });
  }

  private async loadDocuments(file: Express.Multer.File): Promise<Document[]> {
    const lowerCaseName = file.originalname.toLowerCase();

    if (lowerCaseName.endsWith('.txt') || lowerCaseName.endsWith('.md')) {
      return this.loadTextDocuments(file);
    }

    if (lowerCaseName.endsWith('.pdf')) {
      const parsed = await pdfParse(file.buffer);

      return [
        new Document({
          pageContent: parsed.text,
          metadata: {
            fileType: '.pdf',
            pageCount: parsed.numpages,
          },
        }),
      ];
    }

    if (lowerCaseName.endsWith('.docx')) {
      const parsed = await mammoth.extractRawText({ buffer: file.buffer });

      return [
        new Document({
          pageContent: parsed.value,
          metadata: {
            fileType: '.docx',
          },
        }),
      ];
    }

    throw new BadRequestException('不支持的文件类型');
  }

  private loadTextDocuments(file: Express.Multer.File): Document[] {
    const { text, encoding } = decodeKnowledgeTextBuffer(file.buffer);

    if (!text.trim()) {
      throw new BadRequestException('文件内容为空，或编码无法识别');
    }

    return [
      new Document({
        pageContent: text,
        metadata: {
          fileType: file.originalname.toLowerCase().endsWith('.md')
            ? '.md'
            : '.txt',
          sourceEncoding: encoding,
        },
      }),
    ];
  }

  private normalizeMetadata(
    metadata: Record<string, unknown> | undefined,
  ): Record<string, unknown> {
    if (!metadata) {
      return {};
    }

    return JSON.parse(JSON.stringify(metadata)) as Record<string, unknown>;
  }

  private parseMetadata(metadata: unknown): Record<string, unknown> {
    if (!metadata) {
      return {};
    }

    if (typeof metadata === 'string') {
      try {
        return JSON.parse(metadata) as Record<string, unknown>;
      } catch {
        return {};
      }
    }

    if (typeof metadata === 'object') {
      return metadata as Record<string, unknown>;
    }

    return {};
  }

  private toVectorLiteral(embedding: number[]): string {
    return `[${embedding
      .map((value) => (Number.isFinite(value) ? value : 0))
      .join(',')}]`;
  }
}
