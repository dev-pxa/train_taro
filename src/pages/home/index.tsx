import { useEffect } from 'react';
import Taro from '@tarojs/taro';
import { ScrollView, Text, View } from '@tarojs/components';
import AuthGate from '../../components/AuthGate';
import Carousel from '../../components/Carousel';
import CourseCard from '../../components/CourseCard';
import CustomNavBar from '../../components/CustomNavBar';
import ErrorState from '../../components/ErrorState';
import { useFetchData } from '../../hooks/useFetchData';
import { fetchHomeData } from '../../services/api';
import { Course, HomeResponse } from '../../types';

export default function HomePage() {
  const { data, loading, error, fetchData } = useFetchData<HomeResponse['data']>();

  useEffect(() => {
    fetchData(fetchHomeData);
  }, [fetchData]);

  const openCourse = (course: Course) => {
    Taro.navigateTo({ url: `/pages/course-player/index?courseId=${course.id}` });
  };

  const openCourseModule = (moduleType: string) => {
    Taro.setStorageSync('course_list_pending_tab', moduleType);
    Taro.switchTab({ url: '/pages/course-list/index' });
  };

  return (
    <AuthGate>
      <View className="page home-page">
        <CustomNavBar title="企训通" variant="home" />
        {loading ? <View className="loading-state"><Text className="loading-text">加载中...</Text></View> : null}
        {error || !data ? (
          !loading ? <ErrorState message={error || '数据加载失败'} onRetry={() => fetchData(fetchHomeData)} /> : null
        ) : (
          <ScrollView scrollY className="page-scroll">
            <View style={{ height: '10px' }} />

            <Carousel interval={data.carousel.interval} items={data.carousel.items} onPress={() => Taro.showToast({ title: 'Banner 跳转', icon: 'none' })} />

            {data.courseModules.map(module => (
              <View className="section" key={module.moduleType}>
                <View className="section-head">
                  <Text className="section-title">{module.sectionTitle}</Text>
                  <Text className="section-link" onClick={() => openCourseModule(module.moduleType)}>查看全部</Text>
                </View>
                <View className="course-grid">
                  {module.courses.map(course => <CourseCard key={course.id} course={course} onPress={openCourse} />)}
                </View>
              </View>
            ))}
            <View className="safe-bottom" />
          </ScrollView>
        )}
      </View>
    </AuthGate>
  );
}
