import { IsJWT } from 'class-validator';

export class RefreshDto {
  @IsJWT({ message: 'A valid refresh token is required.' })
  refreshToken!: string;
}
