import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Injectable } from '@nestjs/common';
import { Document } from '@langchain/core/documents';
import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory';
import { OllamaEmbeddings } from '@langchain/ollama';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { decodeKnowledgeTextBuffer } from './knowledge-text.util';

interface DocumentLocation {
  pageNumber?: number;
}

@Injectable()
export class KnowledgeService {
  private vectorStore: MemoryVectorStore;
  private embeddings: OllamaEmbeddings;
  private splitter: RecursiveCharacterTextSplitter;
  private files: Map<string, FileInfo> = new Map();

  constructor() {
    this.embeddings = new OllamaEmbeddings({
      model: 'nomic-embed-text-v2-moe:latest',
      baseUrl: 'http://localhost:11434',
    });

    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });

    this.vectorStore = new MemoryVectorStore(this.embeddings);
  }

  async processFile(file: Express.Multer.File): Promise<{
    success: boolean;
    chunks: number;
    filename: string;
  }> {
    try {
      console.log(`[knowledge] Start processing file: ${file.originalname}`);

      const docs = await this.loadDocuments(file);
      if (docs.length === 0 || docs.every((doc) => !doc.pageContent.trim())) {
        throw new Error('文件内容为空，或暂时无法解析出可用文本');
      }

      const splitDocs = await this.splitter.splitDocuments(docs);
      const fileId = Date.now().toString();

      splitDocs.forEach((doc, index) => {
        doc.metadata = {
          ...doc.metadata,
          fileId,
          filename: file.originalname,
          chunkIndex: index,
        };
      });

      console.log(
        `[knowledge] File split into ${splitDocs.length} chunks: ${file.originalname}`,
      );

      await this.vectorStore.addDocuments(splitDocs);

      this.files.set(fileId, {
        id: fileId,
        filename: file.originalname,
        originalName: file.originalname,
        size: file.size,
        chunks: splitDocs.length,
        uploadTime: new Date(),
      });

      console.log(
        `[knowledge] File processed successfully: ${file.originalname}`,
      );

      return {
        success: true,
        chunks: splitDocs.length,
        filename: file.originalname,
      };
    } catch (error) {
      console.error('[knowledge] Failed to process file:', error);
      const message = error instanceof Error ? error.message : '未知错误';
      throw new Error(`文件处理失败：${message}`);
    }
  }

  async query(
    question: string,
    topK: number = 3,
  ): Promise<{
    answer: string;
    sources: Document[];
  }> {
    console.log(`[knowledge] Search question: ${question}`);

    const relevantDocs = await this.vectorStore.similaritySearch(
      question,
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

        return `[来源：${String(doc.metadata.filename ?? '未知来源')}${pageInfo}]\n${doc.pageContent}`;
      })
      .join('\n\n');

    console.log(`[knowledge] Found ${relevantDocs.length} relevant chunks`);

    return {
      answer: context,
      sources: relevantDocs,
    };
  }

  getFileList() {
    return Array.from(this.files.values());
  }

  clearKnowledgeBase() {
    this.vectorStore = new MemoryVectorStore(this.embeddings);
    this.files.clear();
    console.log('[knowledge] Knowledge base cleared');
  }

  private async loadDocuments(file: Express.Multer.File): Promise<Document[]> {
    const ext = path.extname(file.originalname).toLowerCase();

    switch (ext) {
      case '.txt':
      case '.md':
        return this.loadTextDocuments(file, ext);
      case '.pdf':
        return new PDFLoader(file.path).load();
      case '.docx':
        return new DocxLoader(file.path).load();
      default:
        throw new Error(`不支持的文件类型：${ext}`);
    }
  }

  private async loadTextDocuments(
    file: Express.Multer.File,
    ext: string,
  ): Promise<Document[]> {
    const buffer = await fs.readFile(file.path);
    const { text, encoding } = decodeKnowledgeTextBuffer(buffer);

    if (!text.trim()) {
      throw new Error('文件内容为空，或编码无法识别');
    }

    console.log(
      `[knowledge] Decoded text file with ${encoding}: ${file.originalname}`,
    );

    return [
      new Document({
        pageContent: text,
        metadata: {
          source: file.path,
          fileType: ext,
          sourceEncoding: encoding,
        },
      }),
    ];
  }
}

export interface FileInfo {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  chunks: number;
  uploadTime: Date;
}
