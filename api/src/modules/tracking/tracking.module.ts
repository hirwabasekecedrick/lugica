import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { TrackingGateway } from './tracking.gateway.js';
import { TrackingService } from './tracking.service.js';
import { TrackingController } from './tracking.controller.js';
import { LocationsModule } from '../locations/locations.module.js';
import { DeliveriesModule } from '../deliveries/deliveries.module.js';

@Module({
  imports: [
    LocationsModule,
    forwardRef(() => DeliveriesModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.accessSecret'),
        signOptions: {
          expiresIn: configService.get<string>(
            'jwt.accessExpiration',
            '15m',
          ) as StringValue,
        },
      }),
    }),
  ],
  controllers: [TrackingController],
  providers: [TrackingGateway, TrackingService],
  exports: [TrackingService, TrackingGateway],
})
export class TrackingModule {}
