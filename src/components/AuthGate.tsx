import { useEffect, type ReactNode } from 'react';
import Taro from '@tarojs/taro';
import { View, Text } from '@tarojs/components';
import { useAuth } from '../contexts/AuthContext';

export default function AuthGate({ children }: { children: ReactNode }) {
  const { initializing, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!initializing && !isAuthenticated) {
      Taro.reLaunch({ url: '/pages/login/index' });
    }
  }, [initializing, isAuthenticated]);

  if (initializing) {
    return <View className="loading-state"><Text className="loading-text">登录态恢复中...</Text></View>;
  }

  if (!isAuthenticated) {
    return <View className="loading-state"><Text className="loading-text">正在前往登录页...</Text></View>;
  }

  return <>{children}</>;
}
