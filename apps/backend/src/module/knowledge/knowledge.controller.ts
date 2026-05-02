import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { KnowledgeService } from './knowledge.service';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  /**
   * 上传文件到知识库
   */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/knowledge',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        const allowedTypes = ['.txt', '.md', '.pdf', '.docx'];
        const ext = extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
          callback(null, true);
        } else {
          callback(new Error(`不支持的文件类型：${ext}`), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File): Promise<{
    success: boolean;
    message: string;
    data?: {
      success: boolean;
      chunks: number;
      filename: string;
    };
  }> {
    if (!file) {
      return { success: false, message: '未上传文件' };
    }

    console.log(`📥 接收到文件：${file.originalname}`);

    const result = await this.knowledgeService.processFile(file);

    return {
      success: true,
      message: '文件处理成功',
      data: result,
    };
  }

  /**
   * 获取文件列表
   */
  @Get('files')
  getFileList(): {
    success: boolean;
    data: Array<{
      id: string;
      filename: string;
      originalName: string;
      size: number;
      chunks: number;
      uploadTime: Date;
    }>;
    message: string;
  } {
    const files = this.knowledgeService.getFileList();
    return {
      success: true,
      data: files,
      message: '获取文件列表成功',
    };
  }

  /**
   * 清空知识库
   */
  @Post('clear')
  clearKnowledgeBase(): {
    success: boolean;
    message: string;
    data: null;
  } {
    this.knowledgeService.clearKnowledgeBase();
    return {
      success: true,
      message: '知识库已清空',
      data: null,
    };
  }
}
