import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import type { Shipment, ShipmentStatusHistory } from '../../generated/client';
import { ActorId, TenantId } from '../common/tenant.decorator';
import { ShipmentService } from './shipment.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { CancelShipmentDto, TransitionStatusDto } from './dto/transition-status.dto';
import { ListShipmentsDto } from './dto/list-shipments.dto';

/**
 * Shipment API. All routes are tenant-scoped via the resolved tenant context.
 *
 *  POST   /api/v1/shipments                 Create
 *  GET    /api/v1/shipments                 List (filter by status, paginate)
 *  GET    /api/v1/shipments/:id             Get by id
 *  GET    /api/v1/shipments/tracking/:tn    Get by tracking number
 *  PATCH  /api/v1/shipments/:id             Update (pre-pickup only)
 *  PATCH  /api/v1/shipments/:id/status      Transition status (workflow-enforced)
 *  POST   /api/v1/shipments/:id/cancel      Cancel (pre-pickup only)
 *  GET    /api/v1/shipments/:id/history     Status history
 */
@Controller({ path: 'shipments', version: '1' })
export class ShipmentController {
  constructor(private readonly shipmentService: ShipmentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @TenantId() tenantId: string,
    @ActorId() actorId: string | undefined,
    @Body() dto: CreateShipmentDto,
  ): Promise<Shipment> {
    return this.shipmentService.create(tenantId, dto, actorId);
  }

  @Get()
  list(
    @TenantId() tenantId: string,
    @Query() query: ListShipmentsDto,
  ): Promise<{ items: Shipment[]; total: number; limit: number; offset: number }> {
    return this.shipmentService.list(tenantId, query);
  }

  @Get('tracking/:trackingNumber')
  findByTrackingNumber(
    @TenantId() tenantId: string,
    @Param('trackingNumber') trackingNumber: string,
  ): Promise<Shipment> {
    return this.shipmentService.findByTrackingNumber(tenantId, trackingNumber);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id', ParseUUIDPipe) id: string): Promise<Shipment> {
    return this.shipmentService.findById(tenantId, id);
  }

  @Get(':id/history')
  history(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ShipmentStatusHistory[]> {
    return this.shipmentService.history(tenantId, id);
  }

  @Patch(':id')
  update(
    @TenantId() tenantId: string,
    @ActorId() actorId: string | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShipmentDto,
  ): Promise<Shipment> {
    return this.shipmentService.update(tenantId, id, dto, actorId);
  }

  @Patch(':id/status')
  transition(
    @TenantId() tenantId: string,
    @ActorId() actorId: string | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionStatusDto,
  ): Promise<Shipment> {
    return this.shipmentService.transition(tenantId, id, dto.status, dto.reason, actorId);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @TenantId() tenantId: string,
    @ActorId() actorId: string | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelShipmentDto,
  ): Promise<Shipment> {
    return this.shipmentService.cancel(tenantId, id, dto.reason, actorId);
  }
}
