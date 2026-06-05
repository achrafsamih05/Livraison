import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('hashes a password to an argon2id digest', async () => {
    const hash = await service.hash('S3cur3-Pass!');
    expect(hash).toMatch(/^\$argon2id\$/);
  });

  it('produces different hashes for the same input (random salt)', async () => {
    const a = await service.hash('same-password');
    const b = await service.hash('same-password');
    expect(a).not.toEqual(b);
  });

  it('verifies a correct password', async () => {
    const hash = await service.hash('correct-horse');
    await expect(service.verify(hash, 'correct-horse')).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await service.hash('correct-horse');
    await expect(service.verify(hash, 'wrong-horse')).resolves.toBe(false);
  });

  it('returns false for a malformed hash instead of throwing', async () => {
    await expect(service.verify('not-a-hash', 'whatever')).resolves.toBe(false);
  });
});
