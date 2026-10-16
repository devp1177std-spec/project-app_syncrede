import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiResponse } from '@social/types';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
        errorCode = exception.name.replace(/Exception$/, '').toUpperCase() || 'HTTP_ERROR';
      } else if (typeof res === 'object' && res !== null) {
        const errorObj = res as Record<string, unknown>;
        const errorStr = typeof errorObj.error === 'string' ? errorObj.error : '';
        message = typeof errorObj.message === 'string' ? errorObj.message : exception.message;
        errorCode =
          errorStr.replace(/\s+/g, '_').toUpperCase() ||
          exception.name.replace(/Exception$/, '').toUpperCase();

        if (Array.isArray(errorObj.message)) {
          details = errorObj.message;
          message = 'Validation failed';
          errorCode = 'VALIDATION_ERROR';
        } else if (errorObj.details) {
          details = errorObj.details;
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        'Unhandled exception on ' + (request ? request.method + ' ' + request.url : '') + ': ' + exception.message,
        exception.stack,
      );
      message = exception.message;
    } else {
      this.logger.error('Unknown exception: ' + JSON.stringify(exception));
    }

    const errorPayload: ApiResponse = {
      success: false,
      error: {
        code: errorCode,
        message,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    response.status(status).json(errorPayload);
  }
}
