import { envSchema, EnvConfig } from '@social/validation';

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const formattedErrors = result.error.errors
      .map((err) => err.path.join('.') + ': ' + err.message)
      .join(', ');
    throw new Error('Environment validation failed: ' + formattedErrors);
  }

  return result.data;
}
