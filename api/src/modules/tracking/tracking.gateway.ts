import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, UseFilters } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { Role } from '@prisma/client';
import { TrackingService } from './tracking.service.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';
import { WsExceptionFilter } from './filters/ws-exception.filter.js';

/** Payload shape the driver client sends for a location update. */
interface LocationUpdatePayload {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  deliveryId?: string | null;
}

/** Payload shape for starting tracking. */
interface StartTrackingPayload {
  deliveryId?: string | null;
}

@WebSocketGateway({
  cors: {
    origin: '*', // tightened by the CORS config in main.ts for production
    credentials: true,
  },
  namespace: '/',
  transports: ['websocket', 'polling'],
})
@UseFilters(new WsExceptionFilter())
export class TrackingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TrackingGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly trackingService: TrackingService,
  ) {}

  // ─── Connection Lifecycle ─────────────────────────────────────────────────

  async handleConnection(client: Socket): Promise<void> {
    try {
      const user = this.authenticateSocket(client);
      client.data.user = user;

      if (user.role === Role.ADMIN) {
        await client.join('admins');
        // Send current driver states immediately
        const drivers =
          await this.trackingService.getAllActiveDrivers();
        client.emit('driversUpdate', drivers);
        this.logger.log(
          `Admin ${user.email} connected (${client.id})`,
        );
      } else if (user.role === Role.DRIVER) {
        await client.join(`driver:${user.sub}`);
        this.logger.log(
          `Driver ${user.email} connected (${client.id})`,
        );
      } else {
        // CLIENT role — they can watch their own deliveries
        await client.join(`client:${user.sub}`);
        this.logger.log(
          `Client ${user.email} connected (${client.id})`,
        );
      }
    } catch {
      this.logger.warn(
        `Rejected unauthenticated socket ${client.id}`,
      );
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const user = client.data.user as JwtPayload | undefined;
    if (user) {
      this.logger.log(`${user.email} disconnected (${client.id})`);
    }
  }

  // ─── Driver Events ────────────────────────────────────────────────────────

  @SubscribeMessage('tracking:start')
  async handleStartTracking(
    @ConnectedSocket() client: Socket,
    @MessageBody() _payload: StartTrackingPayload,
  ): Promise<{ ok: boolean }> {
    const user = this.getUser(client);

    if (user.role !== Role.DRIVER) {
      client.emit('error', {
        message: 'Only drivers can start tracking',
      });
      return { ok: false };
    }

    try {
      const state = await this.trackingService.startTracking(
        user.sub,
      );
      this.broadcastToAdmins();
      client.emit('trackingState', state);
      return { ok: true };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to start tracking';
      client.emit('error', { message });
      return { ok: false };
    }
  }

  @SubscribeMessage('tracking:stop')
  async handleStopTracking(
    @ConnectedSocket() client: Socket,
  ): Promise<{ ok: boolean }> {
    const user = this.getUser(client);

    if (user.role !== Role.DRIVER) {
      client.emit('error', {
        message: 'Only drivers can stop tracking',
      });
      return { ok: false };
    }

    try {
      await this.trackingService.stopTracking(user.sub);
      this.broadcastToAdmins();
      return { ok: true };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to stop tracking';
      client.emit('error', { message });
      return { ok: false };
    }
  }

  @SubscribeMessage('locationUpdate')
  async handleLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: LocationUpdatePayload,
  ): Promise<{ ok: boolean }> {
    const user = this.getUser(client);

    if (user.role !== Role.DRIVER) {
      client.emit('error', {
        message: 'Only drivers can send location updates',
      });
      return { ok: false };
    }

    if (
      typeof payload?.latitude !== 'number' ||
      typeof payload?.longitude !== 'number'
    ) {
      client.emit('error', { message: 'Invalid location payload' });
      return { ok: false };
    }

    try {
      const state = await this.trackingService.handleLocationUpdate(
        user.sub,
        payload.latitude,
        payload.longitude,
        payload.accuracy ?? null,
        payload.deliveryId ?? null,
      );

      // Broadcast updated driver list to all admins
      this.broadcastToAdmins();

      // Notify the specific client watching this delivery
      if (state?.activeDeliveryId) {
        this.server
          .to(`delivery:${state.activeDeliveryId}`)
          .emit('deliveryLocationUpdate', {
            deliveryId: state.activeDeliveryId,
            driverId: user.sub,
            latitude: payload.latitude,
            longitude: payload.longitude,
            accuracy: payload.accuracy ?? null,
            timestamp: new Date().toISOString(),
          });
      }

      return { ok: true };
    } catch (error) {
      this.logger.error(
        `Location update failed for driver ${user.sub}`,
        error instanceof Error ? error.stack : error,
      );
      client.emit('error', {
        message: 'Failed to process location update',
      });
      return { ok: false };
    }
  }

  // ─── Client / Admin Events ────────────────────────────────────────────────

  /**
   * A client subscribes to live updates for a specific delivery.
   * They join a room keyed by the delivery ID.
   *
   * Authorization is enforced here rather than trusted from the client: the
   * room carries the driver's live position, so an unchecked join would let any
   * authenticated user watch any delivery — including one belonging to another
   * customer. The check is the same `assertDeliveryAccess` the REST trail and
   * summary endpoints use, so the three cannot drift apart.
   */
  @SubscribeMessage('delivery:watch')
  async handleWatchDelivery(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { deliveryId: string },
  ): Promise<{ ok: boolean }> {
    if (!payload?.deliveryId) {
      client.emit('error', { message: 'deliveryId is required' });
      return { ok: false };
    }

    const user = this.getUser(client);

    try {
      await this.trackingService.assertDeliveryAccess(payload.deliveryId, {
        sub: user.sub,
        role: user.role,
      });
    } catch {
      // Deliberately does not distinguish "not found" from "not yours": a
      // distinct message would confirm the existence of other customers'
      // deliveries to anyone who can authenticate.
      client.emit('error', { message: 'Not authorised to watch this delivery' });
      return { ok: false };
    }

    await client.join(`delivery:${payload.deliveryId}`);
    this.logger.debug(
      `Socket ${client.id} watching delivery ${payload.deliveryId}`,
    );
    return { ok: true };
  }

  /**
   * Admin explicitly requests the current driver list.
   */
  @SubscribeMessage('drivers:list')
  async handleDriversList(
    @ConnectedSocket() client: Socket,
  ): Promise<{ ok: boolean }> {
    const user = this.getUser(client);

    if (user.role !== Role.ADMIN) {
      client.emit('error', { message: 'Admin access required' });
      return { ok: false };
    }

    const drivers =
      await this.trackingService.getAllActiveDrivers();
    client.emit('driversUpdate', drivers);
    return { ok: true };
  }

  // ─── Public Helper (used by DeliveriesService to push status changes) ─────

  /**
   * Broadcast a delivery status change to relevant rooms.
   * Called from the deliveries service after a status transition.
   */
  emitDeliveryStatusChange(
    deliveryId: string,
    status: string,
    driverId: string | null,
    clientId: string,
  ): void {
    const payload = { deliveryId, status, driverId, clientId };

    // Notify admins
    this.server.to('admins').emit('deliveryStatusChanged', payload);

    // Notify the client who owns this delivery
    this.server
      .to(`client:${clientId}`)
      .emit('deliveryStatusChanged', payload);

    // Notify the assigned driver
    if (driverId) {
      this.server
        .to(`driver:${driverId}`)
        .emit('deliveryStatusChanged', payload);
    }

    // Notify anyone watching this specific delivery
    this.server
      .to(`delivery:${deliveryId}`)
      .emit('deliveryStatusChanged', payload);
  }

  // ─── Internal Helpers ─────────────────────────────────────────────────────

  private authenticateSocket(client: Socket): JwtPayload {
    const token =
      (client.handshake.auth?.token as string) ??
      (client.handshake.headers?.authorization?.replace(
        'Bearer ',
        '',
      ) as string | undefined);

    if (!token) {
      throw new Error('No authentication token provided');
    }

    return this.jwtService.verify<JwtPayload>(token);
  }

  private getUser(client: Socket): JwtPayload {
    const user = client.data.user as JwtPayload | undefined;
    if (!user) {
      throw new Error('Socket is not authenticated');
    }
    return user;
  }

  private broadcastToAdmins(): void {
    // Fire-and-forget: fetch latest state and push it
    void this.trackingService
      .getAllActiveDrivers()
      .then((drivers) => {
        this.server.to('admins').emit('driversUpdate', drivers);
      })
      .catch((err: unknown) => {
        this.logger.error('Failed to broadcast drivers update', err);
      });
  }
}
