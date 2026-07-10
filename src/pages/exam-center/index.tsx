import Taro from '@tarojs/taro';
import { Text, View } from '@tarojs/components';
import AuthGate from '../../components/AuthGate';
import CustomNavBar from '../../components/CustomNavBar';
import Icon from '../../components/Icon';

export default function ExamCenterPage() {
  return (
    <AuthGate>
      <View className="page exam-center-page">
        <CustomNavBar title="考试" variant="default" />
        <View className="exam-center-content">
          <View className="exam-center-hero gradient">
            <Text className="exam-status">认证考试</Text>
            <Text className="exam-title">智能家居方案顾问认证考试</Text>
            <Text className="exam-desc">完成课程学习后，可在这里进入结业考试，成绩会同步到个人认证记录。</Text>
          </View>

          <View className="section-card soft-card">
            <Text className="section-title">考试规则</Text>
            <Text className="require-line">1. 考试开始后不可暂停，倒计时结束会自动提交。</Text>
            <Text className="require-line">2. 认证考试开启切屏监测，切屏 2 次将自动交卷。</Text>
            <Text className="require-line">3. 提交后可查看成绩、题型表现和证书信息。</Text>
          </View>

          <View className="section-card soft-card">
            <View className="exam-center-row">
              <View className="exam-center-icon gradient"><Icon name="Exam" /></View>
              <View className="exam-center-copy">
                <Text className="exam-center-title">结业考试</Text>
                <Text className="exam-center-meta">30 分钟 · 6 题 · 70 分通过</Text>
              </View>
            </View>
            <View
              className="primary-btn exam-center-action"
              onClick={() => Taro.navigateTo({ url: '/pages/exam/index?courseId=course_001&chapterId=9' })}
            >
              去开始
            </View>
            <View
              className="secondary-btn exam-center-action"
              onClick={() => Taro.navigateTo({ url: '/pages/course-player/index?courseId=course_001' })}
            >
              先复习课程
            </View>
          </View>
        </View>
      </View>
    </AuthGate>
  );
}
