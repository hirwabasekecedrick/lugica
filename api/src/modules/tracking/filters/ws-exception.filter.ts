import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

/**
 * Catches all exceptions thrown inside WebSocket handlers and
 * emits a clean `error` event back to the client instead of
 * crashing the socket connection.
 */
@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const client = host.switchToWs().getClient<Socket>();

    let message = 'Internal server error';

    if (exception instanceof WsException) {
      const error = exception.getError();
      message =
        typeof error === 'string'
          ? error
          : (error as { message?: string })?.message ?? message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(
      `WebSocket error for ${client.id}: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    client.emit('error', { message });
  }
}
