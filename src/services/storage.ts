import Taro from '@tarojs/taro';
import { LoginResponse } from '../types';

const AUTH_STORAGE_KEY = 'train_rn_auth';

export type AuthStorageData = LoginResponse;

let authDataCache: AuthStorageData | null = null;

export async function saveAuthData(data: AuthStorageData): Promise<void> {
  await Taro.setStorage({ key: AUTH_STORAGE_KEY, data });
  const saved = await Taro.getStorage<AuthStorageData>({ key: AUTH_STORAGE_KEY });
  if (!saved.data?.token || !saved.data?.user) {
    throw new Error('登录状态保存失败，请重试');
  }
  authDataCache = saved.data;
}

export async function loadAuthData(): Promise<AuthStorageData | null> {
  if (authDataCache?.token && authDataCache.user) {
    return authDataCache;
  }

  try {
    const saved = await Taro.getStorage<AuthStorageData>({ key: AUTH_STORAGE_KEY });
    if (!saved.data?.token || !saved.data?.user) {
      await clearAuthData();
      return null;
    }
    authDataCache = saved.data;
    return saved.data;
  } catch {
    return null;
  }
}

export async function getToken(): Promise<string | null> {
  const data = await loadAuthData();
  return data?.token ?? null;
}

export async function clearAuthData(): Promise<void> {
  authDataCache = null;
  try {
    await Taro.removeStorage({ key: AUTH_STORAGE_KEY });
  } catch {
    // ignored
  }
}
