import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RoleName, type Tenant } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

/**
 * Tenant administration. Restricted to platform SUPER_ADMIN since tenants are
 * a cross-cutting platform construct, not a per-tenant resource.
 */
@Controller({ path: 'tenants', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.SUPER_ADMIN)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTenantDto): Promise<Tenant> {
    return this.tenantService.create(dto);
  }

  @Get()
  findAll(): Promise<Tenant[]> {
    return this.tenantService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Tenant> {
    return this.tenantService.findById(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTenantDto): Promise<Tenant> {
    return this.tenantService.update(id, dto);
  }

  @Delete(':id')
  archive(@Param('id', ParseUUIDPipe) id: string): Promise<Tenant> {
    return this.tenantService.archive(id);
  }
}
