import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import type { AuthResultDto } from './dto/auth-response.dto';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Headers('x-tenant') tenantSlug: string | undefined,
    @Body() dto: LoginDto,
    @Req() req: Request,
  ): Promise<AuthResultDto> {
    if (tenantSlug === undefined || tenantSlug.trim() === '') {
      throw new BadRequestException('Missing X-Tenant header.');
    }
    return this.authService.login(tenantSlug, dto.email, dto.password, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto, @Req() req: Request): Promise<AuthResultDto> {
    return this.authService.refresh(dto.refreshToken, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { refreshToken?: string },
  ): Promise<void> {
    if (user === undefined) {
      throw new UnauthorizedException();
    }
    const accessToken = (authorization ?? '').replace(/^Bearer\s+/i, '');
    await this.authService.logout(user.userId, accessToken, body.refreshToken);
  }
}
