import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ServiceLevel } from '../../../generated/client';
import { PartyDto } from './party.dto';

export class CreateShipmentDto {
  @ValidateNested()
  @Type(() => PartyDto)
  sender!: PartyDto;

  @ValidateNested()
  @Type(() => PartyDto)
  recipient!: PartyDto;

  @IsOptional()
  @IsEnum(ServiceLevel)
  service?: ServiceLevel;

  @IsInt()
  @Min(0)
  @Max(2_000_000, { message: 'weightGrams must not exceed 2,000,000 (2,000 kg).' })
  weightGrams!: number;

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
  @Length(3, 3, { message: 'currency must be a 3-letter ISO code.' })
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
