import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { LocationsService } from './locations.service.js';
import { LocationPingDto } from './dto/location-ping.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

@ApiTags('Locations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post('ping')
  @Roles(Role.DRIVER)
  // Stricter rate limit for location pings — drivers send frequent GPS updates
  @Throttle({ default: { ttl: 1000, limit: 5 } })
  @ApiOperation({
    summary: 'Send location ping (driver only)',
    description:
      'Records the driver\'s current GPS position. Writes to Redis (short TTL for real-time access) and Postgres (permanent storage). Rate-limited to 5 requests per second.',
  })
  @ApiCreatedResponse({
    description: 'Location recorded',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'loc-uuid-123' },
        recordedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing access token' })
  @ApiForbiddenResponse({ description: 'Driver role required' })
  async ping(
    @Body() dto: LocationPingDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.locationsService.ping(currentUser.sub, dto);
  }
}
