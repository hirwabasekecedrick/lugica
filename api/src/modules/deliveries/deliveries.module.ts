import { Module, forwardRef } from '@nestjs/common';
import { DeliveriesController } from './deliveries.controller.js';
import { DeliveriesService } from './deliveries.service.js';
import { LocationsModule } from '../locations/locations.module.js';
import { TrackingModule } from '../tracking/tracking.module.js';

@Module({
  // LocationsModule is imported for LocationsService, which finalises a
  // delivery's accumulated distance on a terminal status transition.
  // TrackingModule stays a forwardRef: it reaches back into DeliveriesService to
  // broadcast status changes, so the two genuinely are mutually dependent.
  // LocationsModule itself imports only DriverStateModule, so adding it here
  // introduces no new cycle.
  imports: [LocationsModule, forwardRef(() => TrackingModule)],
  controllers: [DeliveriesController],
  providers: [DeliveriesService],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}