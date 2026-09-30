import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { TrackingService } from './tracking.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

@ApiTags('Tracking')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get('drivers')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'List all currently active drivers (admin only)',
    description:
      'Returns the live state of all drivers that are actively tracking. ' +
      'Data is read from Redis for real-time performance. ' +
      'For live push updates, connect to the WebSocket and listen for `driversUpdate` events.',
  })
  @ApiOkResponse({
    description: 'List of active driver states',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          driverId: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string', nullable: true },
          vehiclePlateNumber: { type: 'string', nullable: true },
          activeDeliveryId: { type: 'string', nullable: true },
          trackingStatus: {
            type: 'string',
            enum: ['available', 'on_delivery', 'offline'],
          },
          lastLatitude: { type: 'number', nullable: true },
          lastLongitude: { type: 'number', nullable: true },
          lastAccuracy: { type: 'number', nullable: true },
          lastSeenAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
          },
          trackingStartedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing access token',
  })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  async getActiveDrivers() {
    return this.trackingService.getAllActiveDrivers();
  }

  @Get('drivers/:driverId')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Get live state of a specific driver (admin only)',
    description:
      'Returns the current tracking state for a single driver from Redis.',
  })
  @ApiOkResponse({ description: 'Driver live state' })
  @ApiNotFoundResponse({ description: 'Driver not currently tracking' })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing access token',
  })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  async getDriverState(@Param('driverId') driverId: string) {
    const state = await this.trackingService.getDriverState(driverId);
    if (!state) {
      return { message: 'Driver is not currently tracking' };
    }
    return state;
  }

  @Get('deliveries/:deliveryId/trail')
  @ApiOperation({
    summary: 'Get GPS trail for a delivery (role-aware)',
    description:
      'Returns all GPS location points recorded during this delivery, ordered chronologically. ' +
      'Admin: any delivery. Driver: only their assigned deliveries. Client: only their own deliveries.',
  })
  @ApiOkResponse({
    description: 'Array of GPS trail points',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          latitude: { type: 'number' },
          longitude: { type: 'number' },
          accuracy: { type: 'number', nullable: true },
          recordedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing access token',
  })
  @ApiForbiddenResponse({
    description: 'Access denied to this delivery',
  })
  @ApiNotFoundResponse({ description: 'Delivery not found' })
  async getDeliveryTrail(
    @Param('deliveryId') deliveryId: string,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.trackingService.getDeliveryTrailForUser(
      deliveryId,
      currentUser,
    );
  }

  @Get('me')
  @Roles(Role.DRIVER)
  @ApiOperation({
    summary: 'Get own tracking state (driver only)',
    description:
      'Returns the current tracking state for the authenticated driver.',
  })
  @ApiOkResponse({ description: 'Driver live state' })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing access token',
  })
  @ApiForbiddenResponse({ description: 'Driver role required' })
  async getMyState(@CurrentUser() currentUser: JwtPayload) {
    const state = await this.trackingService.getDriverState(
      currentUser.sub,
    );
    if (!state) {
      return {
        trackingStatus: 'offline',
        message: 'Not currently tracking',
      };
    }
    return state;
  }
}
