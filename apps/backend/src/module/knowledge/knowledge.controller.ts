import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { CurrentUser } from '@/auth/current-user.decorator';
import { AuthUser } from '@/auth/auth.types';
import { normalizeUploadedFilename } from './knowledge-filename.util';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeUserContext, KnowledgeVisibility } from './knowledge.types';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (_req, file, callback) => {
        const allowedTypes = ['.txt', '.md', '.pdf', '.docx'];
        const ext = extname(file.originalname).toLowerCase();

        if (allowedTypes.includes(ext)) {
          callback(null, true);
          return;
        }

        callback(new BadRequestException(`不支持的文件类型：${ext}`), false);
      },
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  async uploadFile(
    @CurrentUser() user: AuthUser | undefined,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('visibility') visibility: string | undefined,
  ) {
    if (!user) {
      throw new BadRequestException('未识别到当前登录用户');
    }

    if (!file) {
      throw new BadRequestException('未上传文件');
    }

    file.originalname = normalizeUploadedFilename(file.originalname);

    const result = await this.knowledgeService.processFile(
      file,
      this.toKnowledgeUser(user),
      this.parseVisibility(visibility),
    );

    return {
      data: result,
      message: '文件处理成功',
    };
  }

  @Get('files')
  async getFileList(@CurrentUser() user: AuthUser | undefined) {
    if (!user) {
      throw new BadRequestException('未识别到当前登录用户');
    }

    const files = await this.knowledgeService.listFiles(
      this.toKnowledgeUser(user),
    );

    return {
      data: files,
      message: '获取知识库文件列表成功',
    };
  }

  @Delete('files/:id')
  async deleteFile(
    @CurrentUser() user: AuthUser | undefined,
    @Param('id') id: string,
  ) {
    if (!user) {
      throw new BadRequestException('未识别到当前登录用户');
    }

    await this.knowledgeService.removeFile(id, this.toKnowledgeUser(user));

    return {
      data: null,
      message: '知识库文件删除成功',
    };
  }

  @Delete('files')
  async clearOwnFiles(
    @CurrentUser() user: AuthUser | undefined,
    @Query('visibility') visibility?: string,
  ) {
    if (!user) {
      throw new BadRequestException('未识别到当前登录用户');
    }

    const deletedCount = await this.knowledgeService.removeOwnFiles(
      this.toKnowledgeUser(user),
      visibility ? this.parseVisibility(visibility) : undefined,
    );

    return {
      data: {
        deletedCount,
      },
      message: '已清空当前用户的知识库文件',
    };
  }

  private parseVisibility(visibility: string | undefined): KnowledgeVisibility {
    if (!visibility) {
      return KnowledgeVisibility.PRIVATE;
    }

    if (visibility === KnowledgeVisibility.PRIVATE) {
      return KnowledgeVisibility.PRIVATE;
    }

    if (visibility === KnowledgeVisibility.PUBLIC) {
      return KnowledgeVisibility.PUBLIC;
    }

    throw new BadRequestException('visibility 只能是 private 或 public');
  }

  private toKnowledgeUser(user: AuthUser): KnowledgeUserContext {
    return {
      userId: Number(user.sub),
      username: user.username,
    };
  }
}
