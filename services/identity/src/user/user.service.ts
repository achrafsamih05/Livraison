import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type User, type UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from '../auth/password.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export type SafeUser = Omit<User, 'passwordHash'>;

const SAFE_USER_SELECT = {
  id: true,
  tenantId: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  status: true,
  roles: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

/**
 * All operations are scoped by tenantId. Every query includes the tenant in
 * its WHERE clause so a caller from tenant A can never read or mutate tenant
 * B's users, even with a guessed id (defense-in-depth alongside DB RLS).
 */
@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
  ) {}

  async create(tenantId: string, dto: CreateUserDto): Promise<SafeUser> {
    const passwordHash = await this.passwords.hash(dto.password);
    try {
      return await this.prisma.user.create({
        data: {
          tenantId,
          email: dto.email.toLowerCase(),
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone ?? null,
          roles: dto.roles ?? [],
        },
        select: SAFE_USER_SELECT,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A user with this email already exists in this tenant.');
      }
      throw error;
    }
  }

  async findAll(tenantId: string): Promise<SafeUser[]> {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: SAFE_USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(tenantId: string, id: string): Promise<SafeUser> {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: SAFE_USER_SELECT,
    });
    if (user === null) {
      throw new NotFoundException('User not found.');
    }
    return user;
  }

  async update(tenantId: string, id: string, dto: UpdateUserDto): Promise<SafeUser> {
    await this.assertExists(tenantId, id);
    await this.prisma.user.updateMany({
      where: { id, tenantId },
      data: {
        ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
        ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.roles !== undefined ? { roles: dto.roles } : {}),
      },
    });
    return this.findById(tenantId, id);
  }

  async setStatus(tenantId: string, id: string, status: UserStatus): Promise<SafeUser> {
    await this.assertExists(tenantId, id);
    await this.prisma.user.updateMany({
      where: { id, tenantId },
      data: { status },
    });
    return this.findById(tenantId, id);
  }

  async remove(tenantId: string, id: string): Promise<SafeUser> {
    const user = await this.findById(tenantId, id);
    await this.prisma.user.deleteMany({ where: { id, tenantId } });
    return user;
  }

  private async assertExists(tenantId: string, id: string): Promise<void> {
    const count = await this.prisma.user.count({ where: { id, tenantId } });
    if (count === 0) {
      throw new NotFoundException('User not found.');
    }
  }
}
