import { Module, forwardRef } from '@nestjs/common';
import { DeliveriesController } from './deliveries.controller.js';
import { DeliveriesService } from './deliveries.service.js';
import { TrackingModule } from '../tracking/tracking.module.js';

@Module({
  imports: [forwardRef(() => TrackingModule)],
  controllers: [DeliveriesController],
  providers: [DeliveriesService],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}
