import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import { Input, ScrollView, Text, View } from '@tarojs/components';
import AuthGate from '../../components/AuthGate';
import CustomNavBar from '../../components/CustomNavBar';
import ErrorState from '../../components/ErrorState';
import Icon, { IconName } from '../../components/Icon';
import { useFetchData } from '../../hooks/useFetchData';
import { fetchExamDetail, startExam, submitExam } from '../../services/api';
import { ExamDetail, ExamQuestion, ExamStartRequest, ExamSubmitAnswer } from '../../types';

function formatTime(total: number): string {
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function getSummaryIconName(type: string): IconName {
  if (type === 'duration') return 'ExamDuration';
  if (type === 'questionCount') return 'ExamQuestionCount';
  if (type === 'passScore' || type === 'passingScore' || type === 'score') return 'ExamPassScore';
  return 'Book';
}

function getResponseMessage(response: { des?: string; desc?: string }, fallback: string): string {
  return response.des || response.desc || fallback;
}

function normalizeSeconds(seconds: unknown): number {
  return typeof seconds === 'number' && Number.isFinite(seconds) ? seconds : 0;
}

export default function ExamPage() {
  const router = useRouter();
  const courseId = router.params.courseId || '';
  const chapterId = Number(router.params.chapterId || 0);
  const { data, loading, error, fetchData } = useFetchData<ExamDetail>();
  const [hasStarted, setHasStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [timerReady, setTimerReady] = useState(false);
  const [choiceAnswers, setChoiceAnswers] = useState<Record<number, number>>({});
  const [fillAnswers, setFillAnswers] = useState<Record<number, string[]>>({});
  const [focusedBlankIndex, setFocusedBlankIndex] = useState<number | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [startSubmitting, setStartSubmitting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    setTimerReady(false);
    hasSubmittedRef.current = false;
    fetchData(() => fetchExamDetail(courseId, chapterId));
  }, [chapterId, courseId, fetchData]);

  useEffect(() => {
    if (!data) return;
    const isInProgress = data.status === 'in_progress';
    setHasStarted(isInProgress);
    setCurrentQuestionIndex(0);
    setRemainingSeconds(isInProgress ? normalizeSeconds(data.remainingSeconds) : normalizeSeconds(data.durationSeconds));
    setTimerReady(true);
  }, [data]);

  const isAnswering = !!data && (hasStarted || data.status === 'in_progress');

  useEffect(() => {
    if (!isAnswering || remainingSeconds <= 0) return undefined;
    const timer = setInterval(() => setRemainingSeconds(prev => Math.max(prev - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [isAnswering, remainingSeconds]);

  const questions = Array.isArray(data?.questions) ? data.questions : [];
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex >= questions.length - 1;

  const canGoNext = useMemo(() => {
    if (!currentQuestion) return false;
    if (currentQuestion.type === 0) return choiceAnswers[currentQuestion.id] !== undefined;
    const answers = fillAnswers[currentQuestion.id] || [];
    return answers.length === currentQuestion.blankCount && answers.every(answer => answer?.trim());
  }, [choiceAnswers, currentQuestion, fillAnswers]);

  const buildSubmitAnswers = useCallback((): ExamSubmitAnswer[] => questions.reduce<ExamSubmitAnswer[]>((answers, question) => {
    if (question.type === 0) {
      const optionIndex = choiceAnswers[question.id];
      if (optionIndex !== undefined) answers.push({ questionId: question.id, type: 0, optionIndex });
    } else {
      const values = Array.from({ length: question.blankCount }, (_, index) => (fillAnswers[question.id]?.[index] || '').trim());
      if (values.some(Boolean)) answers.push({ questionId: question.id, type: 1, values });
    }
    return answers;
  }, []), [choiceAnswers, fillAnswers, questions]);

  const handleSubmitExam = useCallback(async () => {
    if (!data || submitting || hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    setSubmitting(true);
    try {
      const response = await submitExam({ chapterId, durationSeconds: data.durationSeconds, remainingSeconds, answers: buildSubmitAnswers() });
      Taro.redirectTo({ url: `/pages/exam-result/index?examRecordId=${response.data.examRecordId}&courseId=${courseId}&chapterId=${chapterId}` });
    } catch {
      hasSubmittedRef.current = false;
      Taro.showToast({ title: '提交失败，请重试', icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  }, [buildSubmitAnswers, chapterId, courseId, data, remainingSeconds, submitting]);

  useEffect(() => {
    if (timerReady && isAnswering && remainingSeconds === 0 && !hasSubmittedRef.current) {
      handleSubmitExam();
    }
  }, [handleSubmitExam, isAnswering, remainingSeconds, timerReady]);

  useEffect(() => {
    setFocusedBlankIndex(null);
  }, [currentQuestionIndex]);

  const handleNext = () => {
    if (!canGoNext || submitting) return;
    if (isLastQuestion) {
      handleSubmitExam();
    } else {
      setCurrentQuestionIndex(index => Math.min(index + 1, questions.length - 1));
    }
  };

  const handleLeaveExam = () => {
    setShowExitConfirm(false);
    handleSubmitExam();
  };

  const handleStartExam = async () => {
    if (!data || startSubmitting) return;

    const startRequest: ExamStartRequest = { chapterId };
    const numericCourseId = Number(courseId);
    if (courseId && Number.isFinite(numericCourseId)) {
      startRequest.courseId = numericCourseId;
    }

    setStartSubmitting(true);
    try {
      const response = await startExam(startRequest);
      const message = getResponseMessage(response, '开始考试失败');

      if (response.code === 0 && response.data?.status === 'in_progress') {
        setHasStarted(true);
        setCurrentQuestionIndex(0);
        setRemainingSeconds(response.data.remainingSeconds ?? data.durationSeconds ?? 0);
        setTimerReady(true);
        Taro.showToast({ title: message || '考试已开始', icon: 'none' });
        return;
      }

      if (response.code === 40903) {
        Taro.showToast({ title: message || '考试已通过，无需重新开始', icon: 'none' });
        const examRecordId = response.data?.examRecordId;
        if (examRecordId) {
          setTimeout(() => {
            Taro.redirectTo({ url: `/pages/exam-result/index?examRecordId=${examRecordId}&courseId=${courseId}&chapterId=${chapterId}` });
          }, 800);
        }
        return;
      }

      Taro.showToast({ title: message, icon: 'none' });
    } catch (err) {
      const message = err instanceof Error ? err.message : '开始考试失败，请重试';
      Taro.showToast({ title: message, icon: 'none' });
    } finally {
      setStartSubmitting(false);
    }
  };

  const renderFillQuestionTitle = (question: ExamQuestion) => {
    if (question.type !== 1) return <Text className="question-title">{question.title}</Text>;
    const segments = question.title.split('$');
    return (
      <Text className="question-title fill-question-title">
        {segments.map((segment, index) => {
          const filled = !!fillAnswers[question.id]?.[index]?.trim();
          return (
            <Text key={`${segment}-${index}`}>
              {segment}
              {index < question.blankCount ? (
                <Text className={`blank-marker ${filled ? 'filled' : ''}`} onClick={() => setFocusedBlankIndex(index)}>
                  {index + 1}
                </Text>
              ) : null}
            </Text>
          );
        })}
      </Text>
    );
  };

  const renderQuestion = (question: ExamQuestion) => {
    if (question.type === 0) {
      return (
        <View key={question.id} className="option-list">
          {question.options.map((option, index) => (
            <View key={`${question.id}-${index}`} className={`option-item ${choiceAnswers[question.id] === index ? 'selected' : ''}`} onClick={() => setChoiceAnswers(prev => ({ ...prev, [question.id]: index }))}>
              <Text className="option-letter">{String.fromCharCode(65 + index)}</Text>
              <Text className="option-text">{option}</Text>
              <Text className="option-check">✓</Text>
            </View>
          ))}
        </View>
      );
    }

    return (
      <View className="fill-answer-area">
        <View className="fill-answer-title">
          <Icon name="Plus" className="fill-answer-icon" />
          <Text>请在下方填写答案</Text>
        </View>
        {Array.from({ length: question.blankCount }, (_, index) => (
          <View className="fill-blank-item" key={index}>
            <View className="fill-blank-label">
              <Text className="fill-blank-index">{index + 1}</Text>
              <Text>{`第${index + 1}个空`}</Text>
            </View>
            <View className="fill-blank-input-wrapper">
              <Input
                className={`fill-input fill-blank-input ${fillAnswers[question.id]?.[index]?.trim() ? 'filled' : ''}`}
                placeholder="请输入答案"
                value={fillAnswers[question.id]?.[index] || ''}
                focus={focusedBlankIndex === index}
                onFocus={() => setFocusedBlankIndex(index)}
                onBlur={() => setFocusedBlankIndex(null)}
                onInput={event => setFillAnswers(prev => {
                  const values = [...(prev[question.id] || [])];
                  values[index] = event.detail.value;
                  return { ...prev, [question.id]: values };
                })}
              />
              {fillAnswers[question.id]?.[index]?.trim() ? <Text className="fill-blank-hint">✓ 已填写</Text> : null}
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <AuthGate>
      <View className="page exam-page page-white">
        {loading ? <View className="loading-state"><Text className="loading-text">加载中...</Text></View> : null}
        {error || !data ? (
          !loading ? <ErrorState message={error || '考试信息加载失败'} onRetry={() => fetchData(() => fetchExamDetail(courseId, chapterId))} /> : null
        ) : !isAnswering ? (
          <>
            <CustomNavBar
              title="考前确认"
              variant="white"
              showBack
              rightSlot={<View className="custom-nav-action" onClick={() => Taro.showToast({ title: '考试开始后会显示倒计时与答题进度', icon: 'none' })}>?</View>}
            />
            <ScrollView scrollY className="exam-start-scroll">
              <View className="exam-start">
                <View className="exam-hero gradient">
                  <Text className="exam-status">{data.startPage.statusText}</Text>
                  <Text className="exam-title">{data.name}</Text>
                  <Text className="exam-desc">{data.desc}</Text>
                </View>
                <View className="exam-summary">
                  {data.startPage.summaryItems.map(item => (
                    <View className="summary-card soft-card" key={item.label}>
                      <View className="summary-icon">
                        <Icon name={getSummaryIconName(item.type)} className="summary-icon-text" />
                      </View>
                      <Text className="summary-label">{item.label}</Text>
                      <Text className="summary-value">{item.value}</Text>
                    </View>
                  ))}
                </View>
                <View className="require-card soft-card">
                  <View className="require-title-row">
                    <Icon name="VerifiedCheck" className="require-icon" />
                    <Text className="require-title">{data.startPage.requirementTitle}</Text>
                  </View>
                  <View className="requirement-list">
                    {data.startPage.requirements.map((item, index) => (
                      <View key={item} className="requirement-item">
                        <Text className="requirement-index">{index + 1}</Text>
                        <Text className="require-line">{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View className="notice-card">
                  <Icon name="CheckCircle" className="notice-icon" />
                  <Text className="notice-copy">{data.startPage.notice}</Text>
                </View>
                <View className="confirm-row">
                  <Text className="confirm-dot">✓</Text>
                  <Text className="confirm-text">{data.startPage.confirmText}</Text>
                </View>
                <View className="exam-safe-bottom" />
              </View>
            </ScrollView>
            <View className="exam-bottom">
              <View className="exam-btn exam-btn-secondary" onClick={() => Taro.navigateBack()}>取消</View>
              <View className={`exam-btn exam-btn-primary ${startSubmitting ? 'disabled' : ''}`} onClick={handleStartExam}>{startSubmitting ? '开始中...' : '去开始'}</View>
            </View>
          </>
        ) : currentQuestion ? (
          <View className="exam-answer-page">
            <CustomNavBar
              title={formatTime(remainingSeconds)}
              variant="white"
              showBack
              leftIcon="X"
              onBack={() => setShowExitConfirm(true)}
              rightSlot={<Text className="answer-progress">进度 {String(currentQuestionIndex + 1).padStart(2, '0')}/{questions.length}</Text>}
            />
            <View className="warning-banner">
              <Icon name="VerifiedCheck" className="warning-icon" />
              <Text className="warning-text">{data.warningText}</Text>
            </View>
            <ScrollView scrollY className="question-scroll">
              <View className="question-content">
                <View className="question-meta">
                  <Text className="question-type">{currentQuestion.type === 0 ? '单选题' : '填空题'}</Text>
                  <Text className="question-score">分值：{currentQuestion.score}分</Text>
                </View>
                {renderFillQuestionTitle(currentQuestion)}
                {renderQuestion(currentQuestion)}
              </View>
            </ScrollView>
            <View className="exam-bottom">
              <View className={`exam-btn exam-btn-secondary ${currentQuestionIndex === 0 ? 'disabled' : ''}`} onClick={() => setCurrentQuestionIndex(index => Math.max(index - 1, 0))}>上一题</View>
              <View className={`exam-btn exam-btn-primary ${!canGoNext || submitting ? 'disabled' : ''}`} onClick={handleNext}>
                {submitting ? '提交中...' : isLastQuestion ? '提交' : `确认进入第${currentQuestionIndex + 2}题`}
              </View>
            </View>
            {showExitConfirm ? (
              <View className="exit-overlay">
                <View className="exit-modal">
                  <View className="exit-modal-icon-wrap">
                    <View className="exit-modal-icon-bg" />
                    <View className="exit-modal-icon">
                      <Icon name="Clock" className="exit-modal-icon-text" />
                    </View>
                  </View>
                  <Text className="exit-modal-title">确认要离开吗？</Text>
                  <Text className="exit-modal-desc">确认离开将提交当前作答并生成考试结果，请谨慎操作</Text>
                  <View className="exit-modal-buttons">
                    <View className="exit-modal-btn exit-modal-btn-continue" onClick={() => setShowExitConfirm(false)}>继续考试</View>
                    <View className={`exit-modal-btn exit-modal-btn-leave ${submitting ? 'disabled' : ''}`} onClick={handleLeaveExam}>{submitting ? '提交中...' : '确认离开'}</View>
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        ) : (
          <View className="exam-answer-page">
            <CustomNavBar title="考试" variant="white" showBack />
            <ErrorState
              message="题目数据为空或加载异常，请返回后重新进入考试"
              onRetry={() => fetchData(() => fetchExamDetail(courseId, chapterId))}
            />
          </View>
        )}
      </View>
    </AuthGate>
  );
}
