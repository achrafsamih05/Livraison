import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { UserService, type SafeUser } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-status.dto';

/**
 * User administration, scoped to the authenticated principal's tenant.
 * The tenant is taken from the verified token, never from client input, so a
 * caller cannot operate across tenant boundaries.
 */
@Controller({ path: 'users', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  private tenantOf(user: AuthenticatedUser | undefined): string {
    if (user === undefined) {
      throw new UnauthorizedException();
    }
    return user.tenantId;
  }

  @Post()
  @Roles(RoleName.TENANT_ADMIN, RoleName.MANAGER)
  create(
    @CurrentUser() actor: AuthenticatedUser | undefined,
    @Body() dto: CreateUserDto,
  ): Promise<SafeUser> {
    return this.userService.create(this.tenantOf(actor), dto);
  }

  @Get()
  @Roles(RoleName.TENANT_ADMIN, RoleName.MANAGER, RoleName.SUPPORT)
  findAll(@CurrentUser() actor: AuthenticatedUser | undefined): Promise<SafeUser[]> {
    return this.userService.findAll(this.tenantOf(actor));
  }

  @Get('me')
  me(@CurrentUser() actor: AuthenticatedUser | undefined): Promise<SafeUser> {
    const principal = actor;
    if (principal === undefined) {
      throw new UnauthorizedException();
    }
    return this.userService.findById(principal.tenantId, principal.userId);
  }

  @Get(':id')
  @Roles(RoleName.TENANT_ADMIN, RoleName.MANAGER, RoleName.SUPPORT)
  findOne(
    @CurrentUser() actor: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SafeUser> {
    return this.userService.findById(this.tenantOf(actor), id);
  }

  @Patch(':id')
  @Roles(RoleName.TENANT_ADMIN, RoleName.MANAGER)
  update(
    @CurrentUser() actor: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<SafeUser> {
    return this.userService.update(this.tenantOf(actor), id, dto);
  }

  @Patch(':id/status')
  @Roles(RoleName.TENANT_ADMIN)
  setStatus(
    @CurrentUser() actor: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
  ): Promise<SafeUser> {
    return this.userService.setStatus(this.tenantOf(actor), id, dto.status);
  }

  @Delete(':id')
  @Roles(RoleName.TENANT_ADMIN)
  remove(
    @CurrentUser() actor: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SafeUser> {
    return this.userService.remove(this.tenantOf(actor), id);
  }
}
