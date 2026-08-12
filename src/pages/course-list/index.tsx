import { useCallback, useEffect, useMemo, useState } from 'react';
import Taro, { useDidShow } from '@tarojs/taro';
import { ScrollView, Text, View } from '@tarojs/components';
import AuthGate from '../../components/AuthGate';
import CourseCard from '../../components/CourseCard';
import CustomNavBar, { getCustomNavMetrics } from '../../components/CustomNavBar';
import ErrorState from '../../components/ErrorState';
import { useFetchData } from '../../hooks/useFetchData';
import { fetchCourseCategories, fetchCourseList } from '../../services/api';
import { Course, CourseCategory, CourseListFilter, CourseListResponse } from '../../types';

const COURSE_LIST_FILTER_HEIGHT = 294;

export default function CourseListPage() {
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');
  const [primaryCategoryId, setPrimaryCategoryId] = useState<number>();
  const [secondaryCategoryId, setSecondaryCategoryId] = useState<number>();
  const { data, loading, error, fetchData } = useFetchData<CourseListResponse['data']>();
  const navMetrics = useMemo(getCustomNavMetrics, []);
  const navHeight = navMetrics.statusBarHeight + navMetrics.navBarHeight;
  const filterHeight = Taro.pxTransform(COURSE_LIST_FILTER_HEIGHT);

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError('');
    try {
      const response = await fetchCourseCategories();
      if (response.code !== 0 || !Array.isArray(response.data)) {
        throw new Error(response.desc || response.des || '获取课程分类失败');
      }
      setCategories(response.data);
      setPrimaryCategoryId(current => {
        if (current && response.data.some(item => item.id === current)) return current;
        return response.data[0]?.id;
      });
    } catch (loadError) {
      setCategoriesError(loadError instanceof Error ? loadError.message : '获取课程分类失败');
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const activePrimary = useMemo(
    () => categories.find(item => item.id === primaryCategoryId),
    [categories, primaryCategoryId],
  );

  const activeFilter = useMemo<CourseListFilter | undefined>(() => {
    if (!primaryCategoryId) return undefined;
    return {
      primaryCategoryId,
      secondaryCategoryId,
    };
  }, [primaryCategoryId, secondaryCategoryId]);

  useEffect(() => {
    if (activeFilter) {
      fetchData(() => fetchCourseList(activeFilter));
    }
  }, [activeFilter, fetchData]);

  useDidShow(() => {
    void loadCategories();
  });

  const selectPrimary = (id: number) => {
    if (id === primaryCategoryId) return;
    setPrimaryCategoryId(id);
    setSecondaryCategoryId(undefined);
  };

  const openCourse = (course: Course) => {
    Taro.navigateTo({ url: `/pages/course-player/index?courseId=${course.id}` });
  };

  const courses = data?.list || [];
  const compactPrimaryTabs = categories.length <= 3;

  return (
    <AuthGate>
      <View className="page course-list-page">
        <CustomNavBar title="课程列表" variant="default" fixed />

        <View className="course-list-fixed-tools" style={{ top: `${navHeight}px` }}>
          <View className="course-taxonomy">
            <ScrollView scrollX className="primary-tabs" showScrollbar={false}>
              <View className={`primary-tabs-track ${compactPrimaryTabs ? 'compact' : ''}`}>
                {categories.map(category => (
                  <Text
                    key={category.id}
                    className={`primary-tab ${category.id === primaryCategoryId ? 'active' : ''}`}
                    onClick={() => selectPrimary(category.id)}
                  >
                    {category.name}
                  </Text>
                ))}
              </View>
            </ScrollView>

            <ScrollView scrollX className="secondary-tabs" showScrollbar={false}>
              <View className="secondary-tabs-track">
                <Text
                  className={`category-tab ${secondaryCategoryId == null ? 'active' : ''}`}
                  onClick={() => setSecondaryCategoryId(undefined)}
                >
                  全部
                </Text>
                {(activePrimary?.children || []).map(category => (
                  <Text
                    key={category.id}
                    className={`category-tab ${category.id === secondaryCategoryId ? 'active' : ''}`}
                    onClick={() => setSecondaryCategoryId(category.id)}
                  >
                    {category.name}
                  </Text>
                ))}
              </View>
            </ScrollView>
          </View>

          <View className="filter-bar">
            <Text className="filter-result">共 {data?.total ?? courses.length} 门课程</Text>
            <Text className="filter-sort">最新 ⌄</Text>
          </View>
        </View>
        <View style={{ height: filterHeight }} />

        {loading || categoriesLoading ? <View className="loading-state"><Text className="loading-text">加载中...</Text></View> : null}
        {categoriesError ? (
          !categoriesLoading ? <ErrorState message={categoriesError} onRetry={loadCategories} /> : null
        ) : !categories.length ? (
          !categoriesLoading ? <View className="empty-state"><Text className="empty-text">暂无课程分类</Text></View> : null
        ) : error || !data ? (
          !loading ? <ErrorState message={error || '数据加载失败'} onRetry={() => activeFilter && fetchData(() => fetchCourseList(activeFilter))} /> : null
        ) : (
          <ScrollView scrollY className="course-list-scroll" style={{ height: `calc(100vh - ${navHeight}px - ${filterHeight})` }}>
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
