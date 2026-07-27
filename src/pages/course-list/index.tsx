import { useCallback, useEffect, useMemo, useState } from 'react';
import Taro, { useDidShow } from '@tarojs/taro';
import { ScrollView, Text, View } from '@tarojs/components';
import AuthGate from '../../components/AuthGate';
import CourseCard from '../../components/CourseCard';
import CustomNavBar, { getCustomNavMetrics } from '../../components/CustomNavBar';
import ErrorState from '../../components/ErrorState';
import { useFetchData } from '../../hooks/useFetchData';
import { fetchCourseList, fetchCourseTabs } from '../../services/api';
import { Course, CourseListFilter, CourseListResponse, CourseTab } from '../../types';

const COURSE_LIST_FILTER_HEIGHT = 162;

export default function CourseListPage() {
  const [tabs, setTabs] = useState<CourseTab[]>([]);
  const [tabsLoading, setTabsLoading] = useState(true);
  const [tabsError, setTabsError] = useState('');
  const [activeTabKey, setActiveTabKey] = useState('all');
  const { data, loading, error, fetchData } = useFetchData<CourseListResponse['data']>();
  const navMetrics = useMemo(getCustomNavMetrics, []);
  const navHeight = navMetrics.statusBarHeight + navMetrics.navBarHeight;

  const loadTabs = useCallback(async () => {
    setTabsLoading(true);
    setTabsError('');
    try {
      const response = await fetchCourseTabs();
      if (response.code !== 0 || !Array.isArray(response.data)) {
        throw new Error(response.desc || response.des || '获取课程分类失败');
      }
      setTabs(response.data);
      setActiveTabKey(current => response.data.some(tab => tab.key === current) ? current : 'all');
    } catch (loadError) {
      setTabsError(loadError instanceof Error ? loadError.message : '获取课程分类失败');
    } finally {
      setTabsLoading(false);
    }
  }, []);

  const activeTab = tabs.find(tab => tab.key === activeTabKey);
  const activeFilter = useMemo<CourseListFilter>(() => {
    if (activeTab?.kind === 'TYPE') {
      return { type: activeTab.type === 1 ? 'series' : 'micro' };
    }
    if (activeTab?.kind === 'CATEGORY' && activeTab.categoryId != null) {
      return { categoryId: activeTab.categoryId };
    }
    return {};
  }, [activeTab]);

  useEffect(() => {
    if (activeTab) {
      fetchData(() => fetchCourseList(activeFilter));
    }
  }, [activeFilter, activeTab, fetchData]);

  useDidShow(() => {
    const pendingTab = Taro.getStorageSync<string>('course_list_pending_tab');
    if (pendingTab) {
      Taro.removeStorageSync('course_list_pending_tab');
      setActiveTabKey(pendingTab);
    }
    loadTabs();
  });

  const openCourse = (course: Course) => {
    Taro.navigateTo({ url: `/pages/course-player/index?courseId=${course.id}` });
  };

  const courses = data?.list || [];

  return (
    <AuthGate>
      <View className="page course-list-page">
        <CustomNavBar title="课程列表" variant="default" fixed />

        <View className="course-list-fixed-tools" style={{ top: `${navHeight}px` }}>
          <ScrollView scrollX className="category-tabs" showScrollbar={false}>
            {tabs.map(tab => (
              <Text key={tab.key} className={`category-tab ${tab.key === activeTabKey ? 'active' : ''}`} onClick={() => setActiveTabKey(tab.key)}>
                {tab.name}
              </Text>
            ))}
          </ScrollView>

          <View className="filter-bar">
            <Text className="filter-result">共 {data?.total ?? courses.length} 门课程</Text>
            <Text className="filter-sort">最新 ⌄</Text>
          </View>
        </View>
        <View style={{ height: `${COURSE_LIST_FILTER_HEIGHT}px` }} />

        {loading || tabsLoading ? <View className="loading-state"><Text className="loading-text">加载中...</Text></View> : null}
        {tabsError ? (
          !tabsLoading ? <ErrorState message={tabsError} onRetry={loadTabs} /> : null
        ) : error || !data ? (
          !loading ? <ErrorState message={error || '数据加载失败'} onRetry={() => fetchData(() => fetchCourseList(activeFilter))} /> : null
        ) : (
          <ScrollView scrollY className="course-list-scroll" style={{ height: `calc(100vh - ${navHeight + COURSE_LIST_FILTER_HEIGHT}px)` }}>
            {courses.length ? (
              <View className="course-grid course-grid-page">
                {courses.map(course => <CourseCard key={course.id} course={course} onPress={openCourse} />)}
              </View>
            ) : (
              <View className="empty-state"><Text className="empty-text">该分类下暂时没有课程</Text></View>
            )}
            <View className="safe-bottom" />
          </ScrollView>
        )}
      </View>
    </AuthGate>
  );
}
