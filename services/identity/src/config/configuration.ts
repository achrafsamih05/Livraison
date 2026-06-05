export interface AppConfig {
  env: 'dev' | 'staging' | 'prod' | 'test';
  httpPort: number;
  logLevel: string;
  databaseUrl: string;
  redisUrl: string;
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessTtl: number;
    refreshTtl: number;
    issuer: string;
    audience: string;
  };
}

const REQUIRED_SECRET_LENGTH = 32;

/**
 * Validates and normalizes process environment into a typed AppConfig.
 * Throws synchronously at boot if a required variable is missing or invalid,
 * so the service fails fast instead of starting in a broken state.
 */
export function loadConfiguration(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const errors: string[] = [];

  const requireString = (key: string): string => {
    const value = env[key];
    if (value === undefined || value.trim() === '') {
      errors.push(`Missing required environment variable: ${key}`);
      return '';
    }
    return value;
  };

  const requireSecret = (key: string): string => {
    const value = requireString(key);
    if (value !== '' && value.length < REQUIRED_SECRET_LENGTH) {
      errors.push(`${key} must be at least ${REQUIRED_SECRET_LENGTH} characters`);
    }
    return value;
  };

  const parseInteger = (key: string, fallback: number): number => {
    const raw = env[key];
    if (raw === undefined || raw.trim() === '') {
      return fallback;
    }
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      errors.push(`${key} must be a positive integer`);
      return fallback;
    }
    return parsed;
  };

  const appEnv = (env.APP_ENV ?? 'dev') as AppConfig['env'];

  const config: AppConfig = {
    env: appEnv,
    httpPort: parseInteger('HTTP_PORT', 3001),
    logLevel: env.LOG_LEVEL ?? 'info',
    databaseUrl: requireString('DATABASE_URL'),
    redisUrl: requireString('REDIS_URL'),
    jwt: {
      accessSecret: requireSecret('JWT_ACCESS_SECRET'),
      refreshSecret: requireSecret('JWT_REFRESH_SECRET'),
      accessTtl: parseInteger('JWT_ACCESS_TTL', 900),
      refreshTtl: parseInteger('JWT_REFRESH_TTL', 2592000),
      issuer: env.JWT_ISSUER ?? 'livraison-identity',
      audience: env.JWT_AUDIENCE ?? 'livraison-platform',
    },
  };

  if (errors.length > 0) {
    throw new Error(`Invalid configuration:\n - ${errors.join('\n - ')}`);
  }

  return config;
}

export const CONFIG_TOKEN = Symbol('APP_CONFIG');
