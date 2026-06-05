import {
  ArrayUnique,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { RoleName } from '@prisma/client';

export class CreateUserDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters.' })
  @MaxLength(256)
  @Matches(/[A-Z]/, { message: 'Password must contain an uppercase letter.' })
  @Matches(/[a-z]/, { message: 'Password must contain a lowercase letter.' })
  @Matches(/[0-9]/, { message: 'Password must contain a digit.' })
  password!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(RoleName, { each: true })
  roles?: RoleName[];
}
