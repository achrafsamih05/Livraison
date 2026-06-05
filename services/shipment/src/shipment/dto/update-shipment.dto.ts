import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ServiceLevel } from '../../../generated/client';
import { PartyDto } from './party.dto';

/**
 * Editable fields prior to pickup. All optional; only provided fields change.
 * Tracking number, tenant, and status are never editable here.
 */
export class UpdateShipmentDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => PartyDto)
  sender?: PartyDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PartyDto)
  recipient?: PartyDto;

  @IsOptional()
  @IsEnum(ServiceLevel)
  service?: ServiceLevel;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2_000_000)
  weightGrams?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  codAmount?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  declaredValue?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
