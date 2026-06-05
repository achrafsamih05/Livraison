import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ShipmentStatus } from '../../../generated/client';

export class TransitionStatusDto {
  @IsEnum(ShipmentStatus)
  status!: ShipmentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class CancelShipmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
