import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsLatitude,
  IsLongitude,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { EventSource, TrackingEventType } from '../../../generated/client';

export class CreateEventDto {
  @IsUUID()
  shipmentId!: string;

  @Matches(/^[A-Z0-9]{6,30}$/i, { message: 'trackingNumber has an invalid format.' })
  trackingNumber!: string;

  @IsEnum(TrackingEventType)
  type!: TrackingEventType;

  @IsOptional()
  @IsEnum(EventSource)
  source?: EventSource;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  /** Defaults to now if omitted; useful for backfilling device-buffered events. */
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;
}
