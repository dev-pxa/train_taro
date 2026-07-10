import Taro from '@tarojs/taro';
import { View, Text } from '@tarojs/components';

export default function ErrorState({ message, onRetry, onGoHome }: { message?: string; onRetry?: () => void; onGoHome?: () => void }) {
  return (
    <View className="error-state">
      <Text className="error-badge gradient">!</Text>
      <Text className="error-title">加载失败</Text>
      <Text className="error-message">{message || '网络连接出现问题，请检查后重试'}</Text>
      {onRetry ? <View className="primary-btn" onClick={onRetry}>重试</View> : null}
      <View className="secondary-btn" style={{ marginTop: '20px' }} onClick={onGoHome || (() => Taro.navigateTo({ url: '/pages/developer-debug/index' }))}>
        {onGoHome ? '返回首页' : '开发者调试'}
      </View>
    </View>
  );
}
