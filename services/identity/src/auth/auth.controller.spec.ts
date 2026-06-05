import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import type { AuthService } from './auth.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

describe('AuthController', () => {
  let service: jest.Mocked<Pick<AuthService, 'login' | 'refresh' | 'logout'>>;
  let controller: AuthController;

  const req = { headers: { 'user-agent': 'jest' }, ip: '127.0.0.1' } as never;

  beforeEach(() => {
    service = {
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
    };
    controller = new AuthController(service as unknown as AuthService);
  });

  it('requires the X-Tenant header on login', async () => {
    await expect(
      controller.login(undefined, { email: 'a@b.com', password: 'x' }, req),
    ).rejects.toThrow(BadRequestException);
  });

  it('passes tenant slug and context to the service on login', async () => {
    service.login.mockResolvedValue({ user: {}, tokens: {} } as never);
    await controller.login('acme', { email: 'a@b.com', password: 'secret' }, req);
    expect(service.login).toHaveBeenCalledWith('acme', 'a@b.com', 'secret', {
      userAgent: 'jest',
      ipAddress: '127.0.0.1',
    });
  });

  it('delegates refresh to the service', async () => {
    service.refresh.mockResolvedValue({ user: {}, tokens: {} } as never);
    await controller.refresh({ refreshToken: 'rt' }, req);
    expect(service.refresh).toHaveBeenCalledWith('rt', {
      userAgent: 'jest',
      ipAddress: '127.0.0.1',
    });
  });

  it('strips the Bearer prefix and revokes on logout', async () => {
    const user: AuthenticatedUser = {
      userId: 'u1',
      tenantId: 't1',
      email: 'u@example.com',
      roles: [],
    };
    service.logout.mockResolvedValue();
    await controller.logout(user, 'Bearer abc.def.ghi', { refreshToken: 'rt' });
    expect(service.logout).toHaveBeenCalledWith('u1', 'abc.def.ghi', 'rt');
  });

  it('rejects logout without an authenticated principal', async () => {
    await expect(controller.logout(undefined, 'Bearer x', {})).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
