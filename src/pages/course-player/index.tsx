import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import { ScrollView, Text, Video, View } from '@tarojs/components';
import AuthGate from '../../components/AuthGate';
import CustomNavBar from '../../components/CustomNavBar';
import ErrorState from '../../components/ErrorState';
import Icon, { IconName } from '../../components/Icon';
import { useFetchData } from '../../hooks/useFetchData';
import { fetchCourseDetail, updatePlayProgress } from '../../services/api';
import { Chapter, CourseDetail } from '../../types';

type TabType = 'catalog' | 'notes' | 'questions';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}小时`);
  if (m > 0) parts.push(`${m}分钟`);
  if (s > 0 || parts.length === 0) parts.push(`${s}秒`);
  return parts.join('');
}

export default function CoursePlayerPage() {
  const router = useRouter();
  const courseId = router.params.courseId || '';
  const [activeTab, setActiveTab] = useState<TabType>('catalog');
  const [playingItemId, setPlayingItemId] = useState<number | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const currentTimeRef = useRef(0);
  const playingItemIdRef = useRef<number | null>(null);
  const { data, loading, error, fetchData } = useFetchData<CourseDetail>();

  useEffect(() => {
    if (courseId) fetchData(() => fetchCourseDetail(courseId));
  }, [courseId, fetchData]);

  useEffect(() => {
    if (data?.chapters.length && playingItemId === null) {
      const preferred = data.chapters[data.currentChapterIndex];
      const target = preferred?.type === 'video' ? preferred : data.chapters.find(item => item.type === 'video');
      setPlayingItemId(target?.id ?? null);
      setChapters(data.chapters);
      playingItemIdRef.current = target?.id ?? null;
      currentTimeRef.current = target?.initialTime ?? 0;
    }
  }, [data, playingItemId]);

  useEffect(() => {
    playingItemIdRef.current = playingItemId;
  }, [playingItemId]);

  const reportPlayProgress = useCallback((chapterId: number, playPosition: number) => {
    updatePlayProgress({ courseId, chapterId, playPosition }).catch(() => undefined);
  }, [courseId]);

  useEffect(() => () => {
    if (playingItemIdRef.current !== null) {
      reportPlayProgress(playingItemIdRef.current, currentTimeRef.current);
    }
  }, [reportPlayProgress]);

  const currentPlayingItem = useMemo(() => chapters.find(item => item.id === playingItemId && item.type === 'video') || chapters.find(item => item.type === 'video'), [chapters, playingItemId]);

  const getCatalogMeta = (item: Chapter, isCurrent: boolean): string => {
    if (isCurrent) return '正在播放';
    if (item.type === 'image') return '图片资料';
    if (item.type === 'pdf') return 'PDF资料';
    if (item.type === 'test') return '考试测验';
    return `时长 ${formatDuration(item.spendTime)}`;
  };

  const getCatalogIconName = (item: Chapter): IconName => {
    if (item.status === 'locked' && item.type === 'test') return 'Lock';
    if (item.status === 'completed') return 'CheckCircle';
    if (item.type === 'test') return 'Exam';
    if (item.type === 'image' || item.type === 'pdf') return 'Book';
    return 'Play';
  };

  const handleCatalogItemPress = (item: Chapter) => {
    if (item.status === 'locked' && item.type === 'test') return;
    if (item.type === 'test') {
      Taro.navigateTo({ url: `/pages/exam/index?courseId=${courseId}&chapterId=${item.id}` });
      return;
    }
    if (item.type === 'image' || item.type === 'pdf') {
      if (playingItemId !== null) reportPlayProgress(playingItemId, currentTimeRef.current);
      Taro.navigateTo({
        url: `/pages/resource-preview/index?type=${item.type}&url=${encodeURIComponent(item.url || '')}&title=${encodeURIComponent(item.name)}`,
      });
      return;
    }
    if (playingItemId !== null) reportPlayProgress(playingItemId, currentTimeRef.current);
    setPlayingItemId(item.id);
    currentTimeRef.current = item.initialTime;
  };

  return (
    <AuthGate>
      <View className="page player-page page-white">
        <CustomNavBar title="课程播放" variant="white" showBack />
        {loading ? <View className="loading-state"><Text className="loading-text">加载中...</Text></View> : null}
        {error || !data ? (
          !loading ? <ErrorState message={error || '数据加载失败'} onRetry={() => fetchData(() => fetchCourseDetail(courseId))} onGoHome={() => Taro.switchTab({ url: '/pages/home/index' })} /> : null
        ) : (
          <>
            <View className="video-shell">
              {currentPlayingItem ? (
                <Video
                  className="video-player"
                  src={currentPlayingItem.url || ''}
                  initialTime={currentPlayingItem.initialTime || 0}
                  controls
                  autoplay
                  onTimeUpdate={event => { currentTimeRef.current = event.detail.currentTime; }}
                />
              ) : (
                <View className="video-empty"><Text className="video-empty-text">暂无视频章节</Text></View>
              )}
            </View>

            <View className="player-info">
              <Text className="player-title">{data.title}</Text>
              <Text className="player-desc">{data.desc}</Text>
              <View className="player-actions">
                <View className="primary-small"><Icon name="CloudDownload" /> 离线缓存</View>
                <View className="secondary-small"><Icon name="Share" /> 分享同事</View>
              </View>
            </View>

            <View className="player-tabs">
              {[
                { key: 'catalog', label: '课程目录' },
                { key: 'notes', label: '写笔记(12)' },
                { key: 'questions', label: '课堂提问' },
              ].map(tab => (
                <Text key={tab.key} className={`player-tab ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key as TabType)}>{tab.label}</Text>
              ))}
            </View>

            <ScrollView scrollY className="player-scroll">
              {activeTab === 'catalog' ? chapters.map(item => {
                const isCurrent = item.id === playingItemId;
                return (
                  <View key={item.id} className={`catalog-item ${isCurrent ? 'current' : ''}`} onClick={() => handleCatalogItemPress(item)}>
                    <Text className="catalog-index">{item.index}</Text>
                    <View className="catalog-main">
                      <Text className="catalog-name">{item.name}</Text>
                      <Text className="catalog-meta">{getCatalogMeta(item, isCurrent)}</Text>
                    </View>
                    <Icon name={getCatalogIconName(item)} />
                  </View>
                );
              }) : (
                <View className="empty-state"><Text className="empty-text">{activeTab === 'notes' ? '笔记功能开发中...' : '提问功能开发中...'}</Text></View>
              )}
            </ScrollView>
          </>
        )}
      </View>
    </AuthGate>
  );
}
