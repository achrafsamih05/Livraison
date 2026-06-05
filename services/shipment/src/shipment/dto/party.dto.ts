import { IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';

/** Sender or recipient party details. */
export class PartyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name!: string;

  @Matches(/^\+?[0-9]{7,15}$/, { message: 'phone must be 7-15 digits, optional leading +.' })
  phone!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  line1!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  city!: string;

  @IsString()
  @Length(2, 2, { message: 'country must be a 2-letter ISO code.' })
  country!: string;
}
