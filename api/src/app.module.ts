import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module.js';
import { RedisModule } from './redis/redis.module.js';
import {
  databaseConfig,
  jwtConfig,
  redisConfig,
  throttleConfig,
} from './config/configuration.js';
import { validate } from './config/env.validation.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { VehiclesModule } from './modules/vehicles/vehicles.module.js';
import { DeliveriesModule } from './modules/deliveries/deliveries.module.js';
import { LocationsModule } from './modules/locations/locations.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      load: [databaseConfig, jwtConfig, redisConfig, throttleConfig],
    }),
    ThrottlerModule.forRootAsync({
      imports: [],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('throttle.ttl', 60000),
          limit: configService.get<number>('throttle.limit', 100),
          // NOTE: The location-ping endpoint (POST /locations/ping) has
          // a stricter rate limit applied via @Throttle() decorator:
          // { default: { ttl: 1000, limit: 5 } }
        },
      ],
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    VehiclesModule,
    DeliveriesModule,
    LocationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
