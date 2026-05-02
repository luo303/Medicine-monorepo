import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import configload, { getEnvFilePaths } from './configuration';
// import { APP_FILTER } from '@nestjs/core';
// import { HttpExceptionFilter } from './filters/http-exception.filter';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from './interceptor/transform.interceptor';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BasicModule } from './module/basic/basic.module';
import { AiModule } from './module/ai/ai.module';
import { KnowledgeModule } from './module/knowledge/knowledge.module';

import { basic } from '../ormconfig';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: getEnvFilePaths(),
      load: [configload],
    }),
    TypeOrmModule.forRoot(basic),
    BasicModule,
    UserModule,
    AuthModule,
    AiModule,
    KnowledgeModule,
  ],
  controllers: [],
  providers: [
    // {
    //   provide: APP_FILTER,
    //   useClass: HttpExceptionFilter,
    // },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
