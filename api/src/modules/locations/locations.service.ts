import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../redis/redis.service.js';
import { LocationPingDto } from './dto/location-ping.dto.js';

/** TTL for driver location in Redis (seconds) */
const LOCATION_TTL_SECONDS = 60;

@Injectable()
export class LocationsService {
  private readonly logger = new Logger(LocationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async ping(driverId: string, dto: LocationPingDto) {
    const locationData = {
      driverId,
      latitude: dto.latitude,
      longitude: dto.longitude,
      accuracy: dto.accuracy ?? null,
      deliveryId: dto.deliveryId ?? null,
      recordedAt: new Date().toISOString(),
    };

    // Write to Redis (latest location with short TTL)
    const redisKey = `driver:location:${driverId}`;
    await this.redis.setWithTTL(redisKey, locationData, LOCATION_TTL_SECONDS);

    // Insert into Postgres for persistence
    const driverLocation = await this.prisma.driverLocation.create({
      data: {
        driverId,
        deliveryId: dto.deliveryId ?? null,
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracy: dto.accuracy ?? null,
      },
    });

    this.logger.debug(
      `Location ping from driver ${driverId}: lat=${dto.latitude}, lng=${dto.longitude}`,
    );

    return {
      id: driverLocation.id,
      recordedAt: driverLocation.recordedAt,
    };
  }
}
