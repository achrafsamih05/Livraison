import { loadConfiguration } from './configuration';

const VALID_ENV: NodeJS.ProcessEnv = {
  APP_ENV: 'test',
  HTTP_PORT: '3001',
  DATABASE_URL: 'postgresql://u:p@localhost:5432/identity',
  REDIS_URL: 'redis://localhost:6379',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
};

describe('loadConfiguration', () => {
  it('parses a valid environment into a typed config', () => {
    const config = loadConfiguration(VALID_ENV);
    expect(config.env).toBe('test');
    expect(config.httpPort).toBe(3001);
    expect(config.jwt.accessTtl).toBe(900);
    expect(config.jwt.issuer).toBe('livraison-identity');
  });

  it('throws when a required variable is missing', () => {
    const env = { ...VALID_ENV };
    delete env.DATABASE_URL;
    expect(() => loadConfiguration(env)).toThrow(/DATABASE_URL/);
  });

  it('throws when a secret is too short', () => {
    expect(() => loadConfiguration({ ...VALID_ENV, JWT_ACCESS_SECRET: 'short' })).toThrow(
      /JWT_ACCESS_SECRET must be at least 32/,
    );
  });

  it('rejects a non-positive port', () => {
    expect(() => loadConfiguration({ ...VALID_ENV, HTTP_PORT: '-1' })).toThrow(/HTTP_PORT/);
  });

  it('applies defaults for optional values', () => {
    const config = loadConfiguration(VALID_ENV);
    expect(config.jwt.refreshTtl).toBe(2592000);
    expect(config.logLevel).toBe('info');
  });
});
