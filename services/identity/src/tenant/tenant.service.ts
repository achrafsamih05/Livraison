import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type Tenant } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTenantDto): Promise<Tenant> {
    try {
      return await this.prisma.tenant.create({
        data: {
          slug: dto.slug,
          name: dto.name,
          config: (dto.config ?? {}) as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A tenant with this slug already exists.');
      }
      throw error;
    }
  }

  async findAll(): Promise<Tenant[]> {
    return this.prisma.tenant.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findById(id: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (tenant === null) {
      throw new NotFoundException('Tenant not found.');
    }
    return tenant;
  }

  async findBySlug(slug: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (tenant === null) {
      throw new NotFoundException('Tenant not found.');
    }
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    await this.findById(id);
    return this.prisma.tenant.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.config !== undefined ? { config: dto.config as Prisma.InputJsonValue } : {}),
      },
    });
  }

  /**
   * Soft-archive a tenant. Archiving (not deleting) preserves audit and
   * financial history; cascading hard-deletes are intentionally not exposed.
   */
  async archive(id: string): Promise<Tenant> {
    await this.findById(id);
    return this.prisma.tenant.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }
}
