import { useEffect, useState } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import { ScrollView, Text, View } from '@tarojs/components';
import AuthGate from '../../components/AuthGate';
import CustomNavBar from '../../components/CustomNavBar';
import ErrorState from '../../components/ErrorState';
import Icon from '../../components/Icon';
import { useFetchData } from '../../hooks/useFetchData';
import { fetchExamResult } from '../../services/api';
import { ExamResult, ExamResultResponse } from '../../types';

export default function ExamResultPage() {
  const router = useRouter();
  const examRecordId = router.params.examRecordId || '0';
  const courseId = router.params.courseId || '';
  const chapterId = router.params.chapterId;
  const { data, loading, error, fetchData } = useFetchData<ExamResult>();
  const [toastText, setToastText] = useState('');

  useEffect(() => {
    fetchData(() => fetchExamResult(examRecordId) as Promise<ExamResultResponse>);
  }, [examRecordId, fetchData]);

  useEffect(() => {
    if (!toastText) return undefined;
    const timer = setTimeout(() => setToastText(''), 1600);
    return () => clearTimeout(timer);
  }, [toastText]);

  const retryUrl = `/pages/exam/index?courseId=${courseId}&chapterId=${chapterId || 9}`;
  const resultStatusText = data?.passed ? '已通过认证' : '未通过认证';

  return (
    <AuthGate>
      <View className="page result-page page-white">
        {toastText ? <Text className="toast">{toastText}</Text> : null}
        <CustomNavBar
          title="考试成绩"
          variant="white"
          showBack
          backFallbackUrl="/pages/exam-center/index"
          rightSlot={<View className="custom-nav-action" onClick={() => setToastText('成绩卡已生成')}><Icon name="Share" /></View>}
        />
        {loading ? <View className="loading-state"><Text className="loading-text">加载成绩中...</Text></View> : null}
        {error || !data ? (
          !loading ? <ErrorState message={error || '考试结果加载失败'} onRetry={() => fetchData(() => fetchExamResult(examRecordId) as Promise<ExamResultResponse>)} /> : null
        ) : (
          <>
            <ScrollView scrollY className="result-scroll">
              <View className={`result-hero ${data.passed ? 'gradient' : 'failed-gradient'}`}>
                <Text className={`result-status ${data.passed ? '' : 'failed'}`.trim()}><Icon name={data.passed ? 'VerifiedCheck' : 'X'} /> {resultStatusText}</Text>
                <View className="score-row"><Text className="score">{data.score}</Text><Text className="score-unit">分</Text></View>
                <Text className="result-title">{data.examName}</Text>
                <Text className="result-desc">{data.resultDesc}</Text>
                {data.passed && data.certificateId ? (
                  <View className="hero-actions">
                    <View className="hero-action" onClick={() => Taro.navigateTo({ url: `/pages/certificate-detail/index?certificateId=${data.certificateId}` })}><Icon name="Medal" /> 查看证书</View>
                  </View>
                ) : null}
              </View>
              <View className="summary-grid">
                {data.dataOverview.map(item => (
                  <View className="summary-card" key={item.name}>
                    <Text className="summary-value">{item.value}</Text>
                    <Text className="summary-label">{item.name}</Text>
                  </View>
                ))}
              </View>
              <View className="section-card">
                <View className="section-head"><Text className="section-title">题型表现</Text><Text className="section-link" onClick={() => Taro.showToast({ title: '敬请期待', icon: 'none' })}>查看答题</Text></View>
                {data.typePerformance.map(item => {
                  const percent = item.totalCount ? Math.round((item.correctCount / item.totalCount) * 100) : 0;
                  return (
                    <View className="type-row" key={item.name}>
                      <Text className="type-name">{item.name}</Text>
                      <View className="bar"><View className="bar-fill gradient" style={{ width: `${percent}%` }} /></View>
                      <Text className="type-score">{item.correctCount}/{item.totalCount}</Text>
                    </View>
                  );
                })}
              </View>
              <View className="safe-bottom" />
            </ScrollView>
            <View className="fixed-bottom-actions">
              <View
                className="secondary-btn"
                onClick={() => {
                  if (data.passed) {
                    Taro.switchTab({ url: '/pages/course-list/index' });
                    return;
                  }
                  Taro.switchTab({ url: '/pages/course-list/index' });
                }}
              >
                {data.passed ? '返回课程' : '去学习'}
              </View>
              <View className="primary-btn" onClick={() => Taro.redirectTo({ url: retryUrl })}><Icon name="Refresh" /> {data.passed ? '再练一次' : '重新考试'}</View>
            </View>
          </>
        )}
      </View>
    </AuthGate>
  );
}
