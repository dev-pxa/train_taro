import Taro, { useDidShow } from '@tarojs/taro';
import { ScrollView, Text, View } from '@tarojs/components';
import AuthGate from '../../components/AuthGate';
import CustomNavBar from '../../components/CustomNavBar';
import ErrorState from '../../components/ErrorState';
import Icon from '../../components/Icon';
import { useFetchData } from '../../hooks/useFetchData';
import { fetchExamList } from '../../services/api';
import { ExamListData, ExamRecordListItem, PendingExamItem } from '../../types';

function formatDuration(seconds: number): string {
  if (!seconds) return '0 分钟';
  if (seconds % 60 === 0) return `${seconds / 60} 分钟`;
  return `${seconds} 秒`;
}

function buildExamUrl(exam: PendingExamItem): string {
  const courseParam = exam.courseId ? `courseId=${exam.courseId}&` : '';
  return `/pages/exam/index?${courseParam}chapterId=${exam.quizId}`;
}

function buildResultUrl(record: ExamRecordListItem): string {
  const courseParam = record.courseId ? `&courseId=${record.courseId}` : '';
  return `/pages/exam-result/index?examRecordId=${record.examRecordId}${courseParam}&chapterId=${record.quizId}`;
}

function buildRecordCountText(records: ExamRecordListItem[]): string {
  const expiredCount = records.filter(record => record.valid === false).length;
  return expiredCount ? `${records.length} 条 · ${expiredCount} 条失效` : `${records.length} 条`;
}

export default function ExamCenterPage() {
  const { data, loading, error, fetchData } = useFetchData<ExamListData>();

  useDidShow(() => {
    fetchData(fetchExamList);
  });

  const pendingExams = data ? data.pendingExams || [] : [];
  const records = data ? data.records || [] : [];

  const openExam = (exam: PendingExamItem) => {
    Taro.navigateTo({ url: buildExamUrl(exam) });
  };

  const openRecord = (record: ExamRecordListItem) => {
    if (record.valid === false) {
      Taro.showToast({
        title: record.invalidToast || '该考试记录已失效，暂不可查看成绩详情。',
        icon: 'none',
      });
      return;
    }
    Taro.navigateTo({ url: buildResultUrl(record) });
  };

  return (
    <AuthGate>
      <View className="page exam-list-page">
        <CustomNavBar title="考试" variant="white" showBack backFallbackUrl="/pages/home/index" />

        {loading ? <View className="loading-state"><Text className="loading-text">加载中...</Text></View> : null}
        {error ? (
          !loading ? <ErrorState message={error || '考试列表加载失败'} onRetry={() => fetchData(fetchExamList)} /> : null
        ) : (
          <ScrollView scrollY className="exam-list-content">
            <View className="exam-list-intro gradient">
              <View className="exam-list-kicker">
                <Icon name="Exam" />
                <Text>考试中心</Text>
              </View>
              <Text className="exam-list-title">待完成考试与历史记录</Text>
              <Text className="exam-list-copy">查看企业安排的考试任务，点击待完成考试即可进入考前确认并开始考试。</Text>
            </View>

            <View className="exam-list-section">
              <View className="exam-list-section-head">
                <Text className="exam-list-section-title">待完成考试</Text>
                <Text className="exam-list-section-count">{pendingExams.length} 场</Text>
              </View>

              {pendingExams.length ? (
                <View className="exam-list-stack">
                  {pendingExams.map((exam, index) => (
                    <View key={exam.quizId} className="exam-list-item" onClick={() => openExam(exam)}>
                      <View className={`exam-list-icon ${index % 2 === 1 ? 'exam-list-icon-alt' : ''}`}>
                        <Icon name={index % 2 === 1 ? 'Lock' : 'Exam'} />
                      </View>
                      <View className="exam-list-main">
                        <Text className="exam-list-item-title">{exam.title}</Text>
                        <View className="exam-list-meta">
                          <Text className="exam-meta-pill"><Icon name="Clock" /> {formatDuration(exam.durationSeconds)}</Text>
                          <Text className="exam-meta-pill"><Icon name="Book" /> {exam.questionCount} 题</Text>
                        </View>
                        <Text className="exam-list-note">{exam.note}</Text>
                      </View>
                      <View className="exam-list-arrow"><Icon name="ArrowRight" /></View>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="exam-list-empty"><Text>暂无待完成考试</Text></View>
              )}
            </View>

            <View className="exam-list-section">
              <View className="exam-list-section-head">
                <Text className="exam-list-section-title">考试记录</Text>
                <Text className={`exam-list-section-count ${records.some(record => record.valid === false) ? 'has-expired' : ''}`}>{buildRecordCountText(records)}</Text>
              </View>

              {records.length ? (
                <View className="exam-list-stack">
                  {records.map(record => (
                    <View key={record.examRecordId} className={`exam-list-item ${record.valid === false ? 'expired' : ''}`} onClick={() => openRecord(record)}>
                      <View className={`exam-list-icon ${record.valid === false ? 'exam-list-expired-icon' : (record.passed ? 'exam-list-record-icon' : 'exam-list-failed-icon')}`}>
                        <Icon name={record.valid === false ? 'Clock' : (record.passed ? 'Medal' : 'Refresh')} />
                      </View>
                      <View className="exam-list-main">
                        <Text className="exam-list-item-title">{record.title}</Text>
                        <View className="exam-list-meta">
                          {record.valid === false ? null : <Text className="exam-meta-pill">{record.score} 分</Text>}
                          <Text className={`exam-meta-pill ${record.valid === false ? 'expired-pill' : ''}`}>{record.statusText}</Text>
                          {record.valid === false ? <Text className="exam-meta-pill expired-pill">不可查看</Text> : null}
                        </View>
                        <Text className="exam-list-note">{record.note}</Text>
                      </View>
                      <View className={`exam-list-arrow ${record.valid === false ? 'expired-hint' : ''}`}><Icon name={record.valid === false ? 'Info' : 'ArrowRight'} /></View>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="exam-list-empty"><Text>暂无考试记录</Text></View>
              )}
            </View>

            <View className="safe-bottom" />
          </ScrollView>
        )}
      </View>
    </AuthGate>
  );
}
