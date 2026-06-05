import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { TrackingModule } from './tracking/tracking.module';
import { HealthModule } from './health/health.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

@Module({
  imports: [PrismaModule, TrackingModule, HealthModule],
  providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule {}
