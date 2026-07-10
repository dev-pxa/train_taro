import { useEffect, useMemo, useState } from 'react';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import { ScrollView, Text, View } from '@tarojs/components';
import AuthGate from '../../components/AuthGate';
import CourseCard from '../../components/CourseCard';
import CustomNavBar, { getCustomNavMetrics } from '../../components/CustomNavBar';
import ErrorState from '../../components/ErrorState';
import { useFetchData } from '../../hooks/useFetchData';
import { fetchCourseList } from '../../services/api';
import { Course, CourseCategory, CourseListResponse } from '../../types';

const COURSE_LIST_FILTER_HEIGHT = 162;

const CATEGORY_TABS: { key: CourseCategory; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'series', label: '系列课程' },
  { key: 'micro', label: '微课程' },
  { key: 'required', label: '岗位必修' },
  { key: 'certificate', label: '专业证书' },
  { key: 'safety', label: '安全专题' },
  { key: 'skill', label: '技能提升' },
];

export default function CourseListPage() {
  const router = useRouter();
  const initialCategory = (router.params.category as CourseCategory) || 'all';
  const [activeCategory, setActiveCategory] = useState<CourseCategory>(initialCategory);
  const { data, loading, error, fetchData } = useFetchData<CourseListResponse['data']>();
  const navMetrics = useMemo(getCustomNavMetrics, []);
  const navHeight = navMetrics.statusBarHeight + navMetrics.navBarHeight;

  useEffect(() => {
    fetchData(() => fetchCourseList(activeCategory));
  }, [activeCategory, fetchData]);

  useDidShow(() => {
    const pendingCategory = Taro.getStorageSync<CourseCategory>('course_list_pending_category');
    if (pendingCategory) {
      Taro.removeStorageSync('course_list_pending_category');
      setActiveCategory(pendingCategory);
    }
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
            {CATEGORY_TABS.map(tab => (
              <Text key={tab.key} className={`category-tab ${tab.key === activeCategory ? 'active' : ''}`} onClick={() => setActiveCategory(tab.key)}>
                {tab.label}
              </Text>
            ))}
          </ScrollView>

          <View className="filter-bar">
            <Text className="filter-result">共 {courses.length} 门课程</Text>
            <Text className="filter-sort">最新 ⌄</Text>
          </View>
        </View>
        <View style={{ height: `${COURSE_LIST_FILTER_HEIGHT}px` }} />

        {loading ? <View className="loading-state"><Text className="loading-text">加载中...</Text></View> : null}
        {error || !data ? (
          !loading ? <ErrorState message={error || '数据加载失败'} onRetry={() => fetchData(() => fetchCourseList(activeCategory))} /> : null
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
