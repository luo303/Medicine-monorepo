import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

type HttpExceptionResponse = string | { message?: string | string[] };

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const httpResponse = exception.getResponse() as HttpExceptionResponse;
    let message = 'Unknown error';
    if (typeof httpResponse === 'string') {
      message = httpResponse;
    } else if (httpResponse?.message) {
      message = Array.isArray(httpResponse.message)
        ? httpResponse.message.join(', ')
        : httpResponse.message;
    }
    response.status(status).json({
      code: status,
      message: message,
      data: null,
    });
  }
}
