import { getApiBaseUrl } from './environment';
import { getToken } from './storage';

export type ResourceAuthOptions = {
  header?: Record<string, string>;
  credentials: RequestCredentials;
};

function isRelativeUrl(url: string): boolean {
  return !/^https?:\/\//i.test(url);
}

function getOrigin(url: string): string | null {
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : undefined;
    return new URL(url, base).origin;
  } catch {
    return null;
  }
}

async function shouldAttachAuth(url: string): Promise<boolean> {
  if (!url || url.startsWith('blob:') || url.startsWith('data:')) {
    return false;
  }

  if (isRelativeUrl(url)) {
    return true;
  }

  const resourceOrigin = getOrigin(url);
  if (!resourceOrigin) {
    return false;
  }

  if (typeof window !== 'undefined' && resourceOrigin === window.location.origin) {
    return true;
  }

  const apiOrigin = getOrigin(await getApiBaseUrl());
  return Boolean(apiOrigin && resourceOrigin === apiOrigin);
}

export async function getResourceAuthOptions(url: string): Promise<ResourceAuthOptions> {
  if (!(await shouldAttachAuth(url))) {
    return { credentials: 'omit' };
  }

  const token = await getToken();
  return {
    header: token ? { Authorization: `Bearer ${token}`, token } : undefined,
    credentials: 'include',
  };
}
