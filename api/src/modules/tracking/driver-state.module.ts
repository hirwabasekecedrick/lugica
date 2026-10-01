import { Module } from '@nestjs/common';
import { DriverLiveStateStore } from './driver-live-state.store.js';

/**
 * Standalone home for `DriverLiveStateStore`.
 *
 * Both `LocationsModule` (REST ping) and `TrackingModule` (WebSocket) depend on
 * the store, while `TrackingModule` also imports `LocationsModule`. Keeping the
 * store in its own module makes the graph a DAG: Locations -> Store <- Tracking,
 * with no Locations <-> Tracking cycle.
 */
@Module({
  providers: [DriverLiveStateStore],
  exports: [DriverLiveStateStore],
})
export class DriverStateModule {}