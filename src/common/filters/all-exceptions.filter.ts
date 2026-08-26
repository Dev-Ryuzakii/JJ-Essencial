import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Logs the underlying cause of every unhandled error.
 *
 * Services throw `new Error(supabaseError.message)`, which Nest's default
 * handler renders as a bare "Internal server error" with the message
 * discarded. That leaves 500s undiagnosable from the outside, so log the
 * real message and stack here.
 *
 * The message is echoed back to the client only outside production, since
 * database errors can disclose schema details.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof Error ? exception.message : String(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.originalUrl} -> ${status}: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    if (exception instanceof HttpException) {
      return response.status(status).json(exception.getResponse());
    }

    const isProduction = process.env.NODE_ENV === 'production';

    response.status(status).json({
      statusCode: status,
      message: isProduction ? 'Internal server error' : message,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
    });
  }
}
