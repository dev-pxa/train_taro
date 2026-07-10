import Taro from '@tarojs/taro';

export type ApiEnvironment = 'test' | 'mock' | 'production' | 'custom';

export interface RuntimeEnvironmentConfig {
  env: ApiEnvironment;
  apiBaseUrl: string;
}

export interface ApiEnvironmentOption extends RuntimeEnvironmentConfig {
  label: string;
  badge: string;
}

const ENVIRONMENT_STORAGE_KEY = 'train_rn_runtime_environment';
export const API_PATH_PREFIX = '/api/app';
export const DEFAULT_ENVIRONMENT: ApiEnvironment = 'test';

export const API_ENVIRONMENT_OPTIONS: Record<ApiEnvironment, ApiEnvironmentOption> = {
  mock: {
    env: 'mock',
    label: 'mock环境',
    badge: 'mock',
    apiBaseUrl: 'https://m1.apifoxmock.com/m1/8000488-7754565-default',
  },
  test: {
    env: 'test',
    label: '测试环境',
    badge: '当前',
    apiBaseUrl: 'http://49.232.34.105:8082',
  },
  production: {
    env: 'production',
    label: '生产环境',
    badge: '线上',
    apiBaseUrl: 'https://api.qixuntong.com',
  },
  custom: {
    env: 'custom',
    label: '自定义环境',
    badge: '自定义',
    apiBaseUrl: '',
  },
};

const FALLBACK_ENVIRONMENT_CONFIG: RuntimeEnvironmentConfig = {
  env: DEFAULT_ENVIRONMENT,
  apiBaseUrl: API_ENVIRONMENT_OPTIONS[DEFAULT_ENVIRONMENT].apiBaseUrl,
};

function normalizeBaseUrl(apiBaseUrl: string): string {
  return apiBaseUrl.trim().replace(/\/+$/, '');
}

function isApiEnvironment(value: unknown): value is ApiEnvironment {
  return value === 'test' || value === 'mock' || value === 'production' || value === 'custom';
}

function resolveEnvironmentConfig(config: Partial<RuntimeEnvironmentConfig> | null | undefined): RuntimeEnvironmentConfig {
  const normalizedUrl = typeof config?.apiBaseUrl === 'string' ? normalizeBaseUrl(config.apiBaseUrl) : '';
  if (!config || !isApiEnvironment(config.env) || !normalizedUrl) {
    return FALLBACK_ENVIRONMENT_CONFIG;
  }
  return { env: config.env, apiBaseUrl: normalizedUrl };
}

export function getDefaultEnvironmentConfig(): RuntimeEnvironmentConfig {
  return FALLBACK_ENVIRONMENT_CONFIG;
}

export async function saveEnvironmentConfig(env: ApiEnvironment, customApiBaseUrl?: string): Promise<RuntimeEnvironmentConfig> {
  const option = API_ENVIRONMENT_OPTIONS[env] ?? API_ENVIRONMENT_OPTIONS[DEFAULT_ENVIRONMENT];
  const apiBaseUrl = env === 'custom' ? customApiBaseUrl ?? '' : option.apiBaseUrl;
  const config = { env: option.env, apiBaseUrl: normalizeBaseUrl(apiBaseUrl) };
  await Taro.setStorage({ key: ENVIRONMENT_STORAGE_KEY, data: config });
  return config;
}

export async function loadEnvironmentConfig(): Promise<RuntimeEnvironmentConfig> {
  try {
    const saved = await Taro.getStorage<Partial<RuntimeEnvironmentConfig>>({ key: ENVIRONMENT_STORAGE_KEY });
    return resolveEnvironmentConfig(saved.data);
  } catch {
    return FALLBACK_ENVIRONMENT_CONFIG;
  }
}

export async function getApiBaseUrl(): Promise<string> {
  const config = await loadEnvironmentConfig();
  return config.apiBaseUrl || FALLBACK_ENVIRONMENT_CONFIG.apiBaseUrl;
}

function shouldUseH5DevProxy(config: RuntimeEnvironmentConfig): boolean {
  return (
    process.env.TARO_ENV === 'h5' &&
    process.env.NODE_ENV === 'development' &&
    config.env === 'test' &&
    config.apiBaseUrl === API_ENVIRONMENT_OPTIONS.test.apiBaseUrl
  );
}

export async function getFullApiBaseUrl(): Promise<string> {
  const config = await loadEnvironmentConfig();
  if (shouldUseH5DevProxy(config)) {
    return API_PATH_PREFIX;
  }
  return `${config.apiBaseUrl || FALLBACK_ENVIRONMENT_CONFIG.apiBaseUrl}${API_PATH_PREFIX}`;
}
