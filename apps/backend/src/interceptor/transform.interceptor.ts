import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import type { ApiResponse } from '@medicine/shared';
import { Response as ExpressResponse } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
interface RawResponse<T> {
  code?: number;
  success?: boolean;
  data?: T;
  message?: string;
}
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  RawResponse<T> | T | undefined,
  ApiResponse<unknown> | RawResponse<T> | T | undefined
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<unknown> | RawResponse<T> | T | undefined> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<ExpressResponse>();

    return next.handle().pipe(
      map((data: RawResponse<T> | T | undefined) => {
        if (response.headersSent || response.writableEnded) {
          return data;
        }

        if (data === undefined || data === null) {
          return {
            code: response.statusCode || HttpStatus.OK,
            data: null,
            message: '请求成功',
          };
        }

        if (typeof data === 'object' && data !== null) {
          const rawData = data as RawResponse<T>;
          if ('data' in rawData || 'message' in rawData || 'code' in rawData) {
            return {
              code: rawData.code ?? response.statusCode ?? HttpStatus.OK,
              data: rawData.data ?? null,
              message: rawData.message ?? '请求成功',
            };
          }
        }

        return {
          code: response.statusCode || HttpStatus.OK,
          data,
          message: '请求成功',
        };
      }),
    );
  }
}
