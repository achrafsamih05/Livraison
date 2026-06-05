import type { RoleName } from '@prisma/client';

export class AuthTokensDto {
  accessToken!: string;
  refreshToken!: string;
  tokenType = 'Bearer';
  expiresIn!: number;
}

export class AuthUserDto {
  id!: string;
  tenantId!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  roles!: RoleName[];
}

export class AuthResultDto {
  user!: AuthUserDto;
  tokens!: AuthTokensDto;
}
