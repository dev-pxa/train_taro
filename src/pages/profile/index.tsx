import { useEffect } from 'react';
import Taro from '@tarojs/taro';
import { Image, ScrollView, Text, View } from '@tarojs/components';
import AuthGate from '../../components/AuthGate';
import CustomNavBar from '../../components/CustomNavBar';
import ErrorState from '../../components/ErrorState';
import Icon from '../../components/Icon';
import { useAuth } from '../../contexts/AuthContext';
import { useFetchData } from '../../hooks/useFetchData';
import { fetchProfile } from '../../services/api';
import { ProfileResponse } from '../../types';

export default function ProfilePage() {
  const { signOut, user } = useAuth();
  const { data, loading, error, fetchData } = useFetchData<ProfileResponse['data']>();
  const displayName = user?.name || user?.username || '学员';
  const avatarInitial = displayName.trim().charAt(0) || '学';

  useEffect(() => {
    fetchData(fetchProfile);
  }, [fetchData]);

  const handleLogout = async () => {
    const result = await Taro.showModal({ title: '退出登录', content: '确定要退出当前账号吗？', confirmText: '退出' });
    if (result.confirm) {
      await signOut();
    }
  };

  return (
    <AuthGate>
      <View className="page profile-page">
        <CustomNavBar title="我的" variant="default" />
        {loading ? <View className="loading-state"><Text className="loading-text">加载中...</Text></View> : null}
        {error || !data ? (
          !loading ? <ErrorState message={error || '数据加载失败'} onRetry={() => fetchData(fetchProfile)} /> : null
        ) : (
          <ScrollView scrollY className="page-scroll">
            <View className="profile-header soft-card">
              <View className="profile-user">
                <View className="profile-avatar gradient">
                  {user?.avatar ? <Image className="avatar-img" src={user.avatar} mode="aspectFill" /> : <Text className="profile-avatar-text">{avatarInitial}</Text>}
                </View>
                <View>
                  <Text className="profile-name">{displayName}</Text>
                  <Text className="profile-company">{user?.companyName || '企业培训平台'}</Text>
                </View>
              </View>
              <Text className="edit-button">编辑</Text>
            </View>

            <View className="stats-card soft-card">
              {data.stats.map(stat => (
                <View className="stat-item" key={stat.label}>
                  <Text className="stat-value">{stat.value}</Text>
                  <Text className="stat-label">{stat.label}</Text>
                </View>
              ))}
            </View>

            <Text className="section-title standalone">最近学习记录</Text>
            <View className="recent-list soft-card">
              {data.recentLearning.map(record => (
                <View className="learning-record" key={record.id}>
                  <Image className="learning-thumb" src={record.coverImage} mode="aspectFill" />
                  <View className="learning-info">
                    <Text className="learning-title">{record.courseName}</Text>
                    <Text className="learning-time">{record.lastWatched}</Text>
                  </View>
                  <View className="play-pill"><Icon name="Play" /></View>
                </View>
              ))}
            </View>

            <View className="menu-group soft-card">
              <View className="menu-item"><Text>系统设置与隐私</Text><Icon name="ArrowRight" /></View>
              <View className="menu-item"><Text>离线缓存管理</Text><Icon name="ArrowRight" /></View>
            </View>

            <View className="logout-btn" onClick={handleLogout}>退出当前企业账号</View>
            <View className="debug-entry" onClick={() => Taro.navigateTo({ url: '/pages/developer-debug/index' })}>开发者调试</View>
            <View className="safe-bottom" />
          </ScrollView>
        )}
      </View>
    </AuthGate>
  );
}
