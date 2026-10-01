import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { ExecutionContext } from '@nestjs/common';

/**
 * Throttler guard that ignores WebSocket execution contexts.
 *
 * `ThrottlerGuard` is registered as an `APP_GUARD`, so it also wraps every
 * `@SubscribeMessage` handler on `TrackingGateway`. Its `handleRequest` ends in
 * `setResponseHeader`, which calls `.header()` on the response the guard
 * extracted via `context.switchToHttp()` — `undefined` in a WS context, so it
 * throws before the handler body ever runs:
 *
 *   [WsExceptionFilter] WebSocket error: Cannot read properties of undefined (reading 'header')
 *       at ThrottlerGuard.setResponseHeader (throttler.guard.ts:267:20)
 *
 * `WsExceptionFilter` swallows the throw and emits an `error` event, which made
 * `tracking:start` and `tracking:stop` fail silently while `locationUpdate` (no
 * response header to set) appeared to work. See docs/API-GAPS.md #23.
 *
 * Overriding `canActivate` rather than `handleRequest` is deliberate: in
 * @nestjs/throttler 6.7 `handleRequest` receives only a props object and no
 * execution context, so there is nowhere left to branch on context type.
 *
 * Rate limiting a socket handler needs a different key strategy anyway — there
 * is no response object to attach the remaining-allowance headers to. Returning
 * true here means WS messages are not throttled; the driver socket is already
 * authenticated at handshake, and the HTTP fallback (`POST /locations/ping`)
 * keeps its own explicit `@Throttle` at 5 req/s.
 */
@Injectable()
export class WsAwareThrottlerGuard extends ThrottlerGuard {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    // 'http' for REST, 'ws' for the Socket.IO gateway, 'rpc' for microservices.
    if (context.getType() !== 'http') {
      return true;
    }
    return super.canActivate(context);
  }
}