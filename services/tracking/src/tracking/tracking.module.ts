import { Module } from '@nestjs/common';
import { TrackingController } from './tracking.controller';
import { PublicTrackingController } from './public-tracking.controller';
import { TrackingService } from './tracking.service';
import { TrackingEventsBus } from './tracking-events.bus';

@Module({
  controllers: [TrackingController, PublicTrackingController],
  providers: [TrackingService, TrackingEventsBus],
  exports: [TrackingService],
})
export class TrackingModule {}
