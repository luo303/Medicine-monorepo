import * as fs from 'fs';
import * as path from 'path';
import * as yml from 'js-yaml';

import type { config as AppConfig } from '../contain';

const envName = process.env.NODE_ENV || 'development';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const mergeConfig = (
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> => {
  const merged = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const currentValue = merged[key];

    merged[key] =
      isRecord(currentValue) && isRecord(value)
        ? mergeConfig(currentValue, value)
        : value;
  }

  return merged;
};

const resolveBackendRoot = () => {
  const candidates = [
    process.cwd(),
    path.resolve(__dirname, '..'),
    path.resolve(__dirname, '../..'),
  ];

  const backendRoot = candidates.find((candidate) => {
    return (
      fs.existsSync(path.join(candidate, 'package.json')) &&
      fs.existsSync(path.join(candidate, 'config'))
    );
  });

  if (!backendRoot) {
    throw new Error(
      'Unable to locate backend root directory for config files.',
    );
  }

  return backendRoot;
};

const backendRoot = resolveBackendRoot();
const configDir = path.join(backendRoot, 'config');

const readYamlFile = (filename: string): Record<string, unknown> => {
  const filePath = path.join(configDir, filename);

  if (!fs.existsSync(filePath)) {
    return {};
  }

  const parsed = yml.load(fs.readFileSync(filePath, 'utf-8'));
  return isRecord(parsed) ? parsed : {};
};

const assertDatabaseConfig = (rawConfig: Record<string, unknown>) => {
  const dbConfig = rawConfig.DB;

  if (!isRecord(dbConfig)) {
    throw new Error(`Database config is missing for NODE_ENV=${envName}.`);
  }

  const requiredKeys = [
    'type',
    'host',
    'port',
    'username',
    'password',
    'database',
  ] as const;

  const missingKeys = requiredKeys.filter((key) => {
    const value = dbConfig[key];
    return value === undefined || value === null || value === '';
  });

  if (missingKeys.length > 0) {
    throw new Error(
      `Database config is incomplete for NODE_ENV=${envName}. Missing keys: ${missingKeys.join(', ')}`,
    );
  }
};

const assertKnowledgeDatabaseConfig = (rawConfig: Record<string, unknown>) => {
  const dbConfig = rawConfig.KNOWLEDGE_DB;

  if (!isRecord(dbConfig)) {
    throw new Error(
      `Knowledge database config is missing for NODE_ENV=${envName}.`,
    );
  }

  const requiredKeys = [
    'type',
    'host',
    'port',
    'username',
    'password',
    'database',
  ] as const;

  const missingKeys = requiredKeys.filter((key) => {
    const value = dbConfig[key];
    return value === undefined || value === null || value === '';
  });

  if (missingKeys.length > 0) {
    throw new Error(
      `Knowledge database config is incomplete for NODE_ENV=${envName}. Missing keys: ${missingKeys.join(', ')}`,
    );
  }
};

export const getEnvFilePaths = () => {
  return [
    path.join(backendRoot, `.env.${envName}`),
    path.join(backendRoot, '.env'),
  ];
};

const config = (): AppConfig => {
  const defaultConfig = readYamlFile('config.development.yml');
  const baseConfig = readYamlFile('config.yml');
  const envConfig = readYamlFile(`config.${envName}.yml`);
  const mergedConfig = mergeConfig(
    mergeConfig(defaultConfig, baseConfig),
    envConfig,
  );

  assertDatabaseConfig(mergedConfig);
  assertKnowledgeDatabaseConfig(mergedConfig);

  return mergedConfig as unknown as AppConfig;
};

export default config;
