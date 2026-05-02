import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { Document } from '@langchain/core/documents';
import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory';
import { OllamaEmbeddings } from '@langchain/ollama';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { TextLoader } from '@langchain/classic/document_loaders/fs/text';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';

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
    // 初始化 Embeddings（与现有 searchDocsTool 保持一致）
    this.embeddings = new OllamaEmbeddings({
      model: 'nomic-embed-text-v2-moe:latest',
      baseUrl: 'http://localhost:11434',
    });

    // 初始化文本分割器
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });

    // 初始化向量存储
    this.vectorStore = new MemoryVectorStore(this.embeddings);
  }

  /**
   * 处理上传的文件
   */
  async processFile(file: Express.Multer.File): Promise<{
    success: boolean;
    chunks: number;
    filename: string;
  }> {
    try {
      console.log(`📄 开始处理文件：${file.originalname}`);

      // 1. 使用 LangChain Loader 加载并解析文件
      const loader = this.createLoader(file);
      const docs = await loader.load();

      console.log(`✅ 文件加载成功，文档数：${docs.length}`);

      // 2. 文本分割
      const splitDocs = await this.splitter.splitDocuments(docs);

      // 3. 添加元数据
      const fileId = Date.now().toString();
      splitDocs.forEach((doc, index) => {
        doc.metadata = {
          ...doc.metadata,
          fileId,
          filename: file.originalname,
          chunkIndex: index,
        };
      });

      console.log(`📊 分割为 ${splitDocs.length} 个文本块`);

      // 4. 添加到向量存储
      await this.vectorStore.addDocuments(splitDocs);

      // 5. 记录文件信息
      this.files.set(fileId, {
        id: fileId,
        filename: file.originalname,
        originalName: file.originalname,
        size: file.size,
        chunks: splitDocs.length,
        uploadTime: new Date(),
      });

      console.log(`✅ 文件处理完成：${file.originalname}`);

      return {
        success: true,
        chunks: splitDocs.length,
        filename: file.originalname,
      };
    } catch (error) {
      console.error('❌ 文件处理失败:', error);
      const message = error instanceof Error ? error.message : '未知错误';
      throw new Error(`文件处理失败：${message}`);
    }
  }

  /**
   * 创建对应的 Loader
   */
  private createLoader(file: Express.Multer.File) {
    const ext = path.extname(file.originalname).toLowerCase();

    switch (ext) {
      case '.txt':
        return new TextLoader(file.path);

      case '.md':
        return new TextLoader(file.path);

      case '.pdf':
        return new PDFLoader(file.path);

      case '.docx':
        return new DocxLoader(file.path);

      default:
        throw new Error(`不支持的文件类型：${ext}`);
    }
  }

  /**
   * 知识库问答（供 AI 工具调用）
   */
  async query(
    question: string,
    topK: number = 3,
  ): Promise<{
    answer: string;
    sources: Document[];
  }> {
    console.log(`🔍 检索知识库："${question}"`);

    // 相似度搜索
    const relevantDocs = await this.vectorStore.similaritySearch(
      question,
      topK,
    );

    if (relevantDocs.length === 0) {
      return {
        answer: '抱歉，知识库中没有相关信息',
        sources: [],
      };
    }

    // 构建上下文
    const context = relevantDocs
      .map((doc) => {
        const loc = doc.metadata.loc as DocumentLocation | undefined;
        const pageInfo =
          typeof loc?.pageNumber === 'number' ? ` 第${loc.pageNumber}页` : '';
        return `[来源：${String(doc.metadata.filename ?? '未知来源')}${pageInfo}]\n${doc.pageContent}`;
      })
      .join('\n\n');

    console.log(`✅ 找到 ${relevantDocs.length} 个相关文档`);

    return {
      answer: context,
      sources: relevantDocs,
    };
  }

  /**
   * 获取文件列表
   */
  getFileList() {
    return Array.from(this.files.values());
  }

  /**
   * 清空知识库
   */
  clearKnowledgeBase() {
    this.vectorStore = new MemoryVectorStore(this.embeddings);
    this.files.clear();
    console.log('🗑️ 知识库已清空');
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
