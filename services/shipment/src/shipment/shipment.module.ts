import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ShipmentController } from './shipment.controller';
import { ShipmentService, type TrackingNumberConfig } from './shipment.service';

@Module({
  controllers: [ShipmentController],
  providers: [
    {
      provide: ShipmentService,
      useFactory: (prisma: PrismaService): ShipmentService => {
        const config: TrackingNumberConfig = {
          prefix: process.env.AWB_PREFIX ?? 'LV',
          country: process.env.AWB_COUNTRY ?? 'SA',
        };
        return new ShipmentService(prisma, config);
      },
      inject: [PrismaService],
    },
  ],
  exports: [ShipmentService],
})
export class ShipmentModule {}
