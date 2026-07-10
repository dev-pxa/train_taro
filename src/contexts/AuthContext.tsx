import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Taro from '@tarojs/taro';
import { LoginResponse } from '../types';
import { clearAuthData, loadAuthData, saveAuthData } from '../services/storage';
import { setUnauthorizedHandler } from '../services/api';

interface AuthContextValue {
  initializing: boolean;
  token: string | null;
  user: LoginResponse['user'] | null;
  isAuthenticated: boolean;
  signIn: (data: LoginResponse) => Promise<void>;
  signOut: () => Promise<void>;
  handleAuthExpired: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [initializing, setInitializing] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<LoginResponse['user'] | null>(null);
  const authExpiredAlertVisibleRef = useRef(false);

  const resetAuthState = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let mounted = true;
    loadAuthData().then(authData => {
      if (!mounted) return;
      if (authData) {
        setToken(authData.token);
        setUser(authData.user);
      } else {
        resetAuthState();
      }
      setInitializing(false);
    });
    return () => {
      mounted = false;
    };
  }, [resetAuthState]);

  const signIn = useCallback(async (data: LoginResponse) => {
    if (!data.token || !data.user) {
      throw new Error('登录接口返回数据缺少 token 或用户信息');
    }
    await saveAuthData(data);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await clearAuthData();
    } finally {
      resetAuthState();
      Taro.reLaunch({ url: '/pages/login/index' });
    }
  }, [resetAuthState]);

  const handleAuthExpired = useCallback(async () => {
    await signOut();
    if (authExpiredAlertVisibleRef.current) return;
    authExpiredAlertVisibleRef.current = true;
    await Taro.showModal({ title: '登录已过期', content: '请重新登录后继续学习', showCancel: false });
    authExpiredAlertVisibleRef.current = false;
  }, [signOut]);

  useEffect(() => {
    setUnauthorizedHandler(handleAuthExpired);
    return () => setUnauthorizedHandler(null);
  }, [handleAuthExpired]);

  const value = useMemo<AuthContextValue>(() => ({
    initializing,
    token,
    user,
    isAuthenticated: Boolean(token && user),
    signIn,
    signOut,
    handleAuthExpired,
  }), [handleAuthExpired, initializing, signIn, signOut, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth 必须在 AuthProvider 内部使用');
  }
  return context;
}
