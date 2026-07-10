import { useMemo, type ReactNode } from 'react';
import Taro from '@tarojs/taro';
import { Text, View } from '@tarojs/components';
import Icon, { IconName } from './Icon';

type NavVariant = 'default' | 'white' | 'transparent' | 'dark' | 'home';

interface CustomNavBarProps {
  title?: string;
  subtitle?: string;
  variant?: NavVariant;
  showBack?: boolean;
  leftIcon?: IconName;
  rightSlot?: ReactNode;
  backFallbackUrl?: string;
  onBack?: () => void;
  fixed?: boolean;
  placeholder?: boolean;
}

export interface NavMetrics {
  statusBarHeight: number;
  navBarHeight: number;
  capsuleWidth: number;
}

function getSafeSystemInfo() {
  try {
    return Taro.getSystemInfoSync();
  } catch {
    return { statusBarHeight: 0, windowWidth: 375 };
  }
}

export function getCustomNavMetrics(): NavMetrics {
  const systemInfo = getSafeSystemInfo();
  const statusBarHeight = systemInfo.statusBarHeight || 0;

  if (process.env.TARO_ENV === 'h5') {
    return {
      statusBarHeight: 0,
      navBarHeight: 48,
      capsuleWidth: 104,
    };
  }

  try {
    const menuButton = Taro.getMenuButtonBoundingClientRect();
    const navBarHeight = menuButton.height + (menuButton.top - statusBarHeight) * 2;
    return {
      statusBarHeight,
      navBarHeight,
      capsuleWidth: Math.max(systemInfo.windowWidth - menuButton.left + 8, 96),
    };
  } catch {
    return {
      statusBarHeight,
      navBarHeight: 44,
      capsuleWidth: 104,
    };
  }
}

function goFallback(url: string) {
  if (url === '/pages/home/index' || url === '/pages/course-list/index' || url === '/pages/exam-center/index' || url === '/pages/profile/index') {
    Taro.switchTab({ url });
    return;
  }

  Taro.reLaunch({ url });
}

export default function CustomNavBar({
  title,
  subtitle,
  variant = 'default',
  showBack = false,
  leftIcon = 'Back',
  rightSlot,
  backFallbackUrl = '/pages/home/index',
  onBack,
  fixed = false,
  placeholder,
}: CustomNavBarProps) {
  const metrics = useMemo(getCustomNavMetrics, []);
  const navHeight = metrics.statusBarHeight + metrics.navBarHeight;
  const shouldFixNav = fixed || process.env.TARO_ENV === 'h5';
  const shouldRenderPlaceholder = placeholder ?? shouldFixNav;

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    const pages = Taro.getCurrentPages();
    if (pages.length > 1) {
      Taro.navigateBack();
      return;
    }

    goFallback(backFallbackUrl);
  };

  return (
    <>
      <View className={`custom-nav custom-nav-${variant} ${shouldFixNav ? 'custom-nav-fixed' : ''}`}>
        <View style={{ height: `${metrics.statusBarHeight}px` }} />
        <View className="custom-nav-bar" style={{ height: `${metrics.navBarHeight}px` }}>
          <View className="custom-nav-left">
            {showBack ? (
              <View className="custom-nav-button" onClick={handleBack}>
                <Icon name={leftIcon} className="custom-nav-icon" />
              </View>
            ) : null}
          </View>

          <View className="custom-nav-title-wrap" style={{ paddingRight: `${metrics.capsuleWidth}px`, paddingLeft: `${metrics.capsuleWidth}px` }}>
            {subtitle ? <Text className="custom-nav-subtitle">{subtitle}</Text> : null}
            {title ? <Text className="custom-nav-title">{title}</Text> : null}
          </View>

          <View className="custom-nav-right" style={{ width: `${metrics.capsuleWidth}px` }}>
            {rightSlot}
          </View>
        </View>
      </View>
      {shouldRenderPlaceholder ? <View style={{ height: `${navHeight}px` }} /> : null}
    </>
  );
}
