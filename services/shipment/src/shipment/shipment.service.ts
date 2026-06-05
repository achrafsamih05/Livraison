import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  Prisma,
  ShipmentStatus,
  type Shipment,
  type ShipmentStatusHistory,
} from '../../generated/client';
import { PrismaService } from '../prisma/prisma.service';
import { ShipmentStatusWorkflow } from './shipment-status.workflow';
import { generateTrackingNumber } from './tracking-number.generator';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';

export interface TrackingNumberConfig {
  prefix: string;
  country: string;
}

const MAX_TRACKING_RETRIES = 5;

@Injectable()
export class ShipmentService {
  private readonly logger = new Logger(ShipmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly trackingConfig: TrackingNumberConfig = { prefix: 'LV', country: 'SA' },
  ) {}

  /**
   * Creates a shipment in CREATED state, allocating a unique tracking number
   * (retrying on the rare collision) and recording the initial history entry
   * atomically with the shipment row.
   */
  async create(tenantId: string, dto: CreateShipmentDto, actorId?: string): Promise<Shipment> {
    const data = this.toCreateData(tenantId, dto, actorId);

    for (let attempt = 1; attempt <= MAX_TRACKING_RETRIES; attempt += 1) {
      const trackingNumber = generateTrackingNumber(this.trackingConfig);
      try {
        return await this.prisma.shipment.create({
          data: {
            ...data,
            trackingNumber,
            history: {
              create: {
                tenantId,
                fromStatus: null,
                toStatus: ShipmentStatus.CREATED,
                reason: 'Shipment created',
                actorId: actorId ?? null,
              },
            },
          },
        });
      } catch (error) {
        if (this.isUniqueViolation(error)) {
          this.logger.warn(`Tracking number collision on attempt ${attempt}; retrying`);
          continue;
        }
        throw error;
      }
    }
    throw new ConflictException('Unable to allocate a unique tracking number.');
  }

  async findById(tenantId: string, id: string): Promise<Shipment> {
    const shipment = await this.prisma.shipment.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (shipment === null) {
      throw new NotFoundException('Shipment not found.');
    }
    return shipment;
  }

  async findByTrackingNumber(tenantId: string, trackingNumber: string): Promise<Shipment> {
    const shipment = await this.prisma.shipment.findFirst({
      where: { trackingNumber, tenantId, deletedAt: null },
    });
    if (shipment === null) {
      throw new NotFoundException('Shipment not found.');
    }
    return shipment;
  }

  async list(
    tenantId: string,
    params: { status?: ShipmentStatus; limit?: number; offset?: number },
  ): Promise<{ items: Shipment[]; total: number; limit: number; offset: number }> {
    const limit = params.limit ?? 50;
    const offset = params.offset ?? 0;
    const where: Prisma.ShipmentWhereInput = {
      tenantId,
      deletedAt: null,
      ...(params.status !== undefined ? { status: params.status } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.shipment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.shipment.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  /**
   * Updates mutable fields. Allowed only while the shipment is in an editable
   * (pre-pickup) state; otherwise rejected to protect in-network shipments.
   */
  async update(
    tenantId: string,
    id: string,
    dto: UpdateShipmentDto,
    actorId?: string,
  ): Promise<Shipment> {
    const shipment = await this.findById(tenantId, id);
    if (!ShipmentStatusWorkflow.isEditable(shipment.status)) {
      throw new UnprocessableEntityException(
        `Shipment cannot be edited in status ${shipment.status}.`,
      );
    }

    const data = this.toUpdateData(dto, actorId);
    await this.prisma.shipment.updateMany({ where: { id, tenantId }, data });
    return this.findById(tenantId, id);
  }

  /**
   * Transitions status, enforcing the state machine and appending an immutable
   * history record in the same transaction (exactly-once status history).
   */
  async transition(
    tenantId: string,
    id: string,
    to: ShipmentStatus,
    reason?: string,
    actorId?: string,
  ): Promise<Shipment> {
    const shipment = await this.findById(tenantId, id);
    return this.applyTransition(shipment, to, reason, actorId);
  }

  /**
   * Cancels a shipment if its current status permits cancellation.
   */
  async cancel(tenantId: string, id: string, reason?: string, actorId?: string): Promise<Shipment> {
    const shipment = await this.findById(tenantId, id);
    if (!ShipmentStatusWorkflow.isCancellable(shipment.status)) {
      throw new UnprocessableEntityException(
        `Shipment cannot be cancelled in status ${shipment.status}.`,
      );
    }
    return this.applyTransition(
      shipment,
      ShipmentStatus.CANCELLED,
      reason ?? 'Cancelled by request',
      actorId,
    );
  }

  async history(tenantId: string, id: string): Promise<ShipmentStatusHistory[]> {
    await this.findById(tenantId, id);
    return this.prisma.shipmentStatusHistory.findMany({
      where: { tenantId, shipmentId: id },
      orderBy: { occurredAt: 'asc' },
    });
  }

  // --- internals -----------------------------------------------------------

  private async applyTransition(
    shipment: Shipment,
    to: ShipmentStatus,
    reason: string | undefined,
    actorId: string | undefined,
  ): Promise<Shipment> {
    const from = shipment.status;
    if (from === to) {
      throw new UnprocessableEntityException(`Shipment is already in status ${to}.`);
    }
    if (!ShipmentStatusWorkflow.canTransition(from, to)) {
      throw new UnprocessableEntityException(`Illegal status transition from ${from} to ${to}.`);
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.shipment.update({
        where: { id: shipment.id },
        data: { status: to, updatedBy: actorId ?? null },
      }),
      this.prisma.shipmentStatusHistory.create({
        data: {
          tenantId: shipment.tenantId,
          shipmentId: shipment.id,
          fromStatus: from,
          toStatus: to,
          reason: reason ?? null,
          actorId: actorId ?? null,
        },
      }),
    ]);

    return updated;
  }

  private toCreateData(
    tenantId: string,
    dto: CreateShipmentDto,
    actorId?: string,
  ): Omit<Prisma.ShipmentUncheckedCreateInput, 'trackingNumber' | 'history'> {
    return {
      tenantId,
      status: ShipmentStatus.CREATED,
      service: dto.service ?? undefined,
      senderName: dto.sender.name,
      senderPhone: dto.sender.phone,
      senderLine1: dto.sender.line1,
      senderCity: dto.sender.city,
      senderCountry: dto.sender.country.toUpperCase(),
      recipientName: dto.recipient.name,
      recipientPhone: dto.recipient.phone,
      recipientLine1: dto.recipient.line1,
      recipientCity: dto.recipient.city,
      recipientCountry: dto.recipient.country.toUpperCase(),
      weightGrams: dto.weightGrams,
      codAmount: new Prisma.Decimal(dto.codAmount ?? 0),
      declaredValue: new Prisma.Decimal(dto.declaredValue ?? 0),
      currency: (dto.currency ?? 'SAR').toUpperCase(),
      reference: dto.reference ?? null,
      notes: dto.notes ?? null,
      createdBy: actorId ?? null,
    };
  }

  private toUpdateData(dto: UpdateShipmentDto, actorId?: string): Prisma.ShipmentUpdateInput {
    const data: Prisma.ShipmentUpdateInput = { updatedBy: actorId ?? null };
    if (dto.sender !== undefined) {
      data.senderName = dto.sender.name;
      data.senderPhone = dto.sender.phone;
      data.senderLine1 = dto.sender.line1;
      data.senderCity = dto.sender.city;
      data.senderCountry = dto.sender.country.toUpperCase();
    }
    if (dto.recipient !== undefined) {
      data.recipientName = dto.recipient.name;
      data.recipientPhone = dto.recipient.phone;
      data.recipientLine1 = dto.recipient.line1;
      data.recipientCity = dto.recipient.city;
      data.recipientCountry = dto.recipient.country.toUpperCase();
    }
    if (dto.service !== undefined) {
      data.service = dto.service;
    }
    if (dto.weightGrams !== undefined) {
      data.weightGrams = dto.weightGrams;
    }
    if (dto.codAmount !== undefined) {
      data.codAmount = new Prisma.Decimal(dto.codAmount);
    }
    if (dto.declaredValue !== undefined) {
      data.declaredValue = new Prisma.Decimal(dto.declaredValue);
    }
    if (dto.reference !== undefined) {
      data.reference = dto.reference;
    }
    if (dto.notes !== undefined) {
      data.notes = dto.notes;
    }
    return data;
  }

  private isUniqueViolation(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }
}
