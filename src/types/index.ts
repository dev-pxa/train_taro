export interface Company {
  code: string;
  name: string;
}

export interface AgreementContentItem {
  title: string;
  content: string;
}

export interface Agreement {
  serviceAgreement: { title: string; contents: AgreementContentItem[] };
  privacyPolicy: { title: string; contents: AgreementContentItem[] };
}

export interface ApiResponse<T> {
  code: number;
  desc?: string;
  des?: string;
  data: T;
}

export interface LoginConfigData {
  companies: Company[];
  agreements: Agreement;
}

export type LoginConfigResponse = ApiResponse<LoginConfigData>;

export interface LoginRequest {
  companyCode: string;
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    name: string;
    phone?: string;
    avatar?: string | null;
    companyCode: string;
    companyName: string;
  };
}

export type LoginApiResponse = ApiResponse<LoginResponse>;

export type CourseType = 'micro' | 'series';
export type CourseCategory = 'all' | 'series' | 'micro' | 'required' | 'certificate' | 'safety' | 'skill';

export interface CarouselItem {
  id: string;
  imageUrl: string;
  jumpUrl: string;
}

export interface Course {
  id: string;
  title: string;
  coverImage: string;
  type: CourseType;
  duration: string;
  label?: string;
  jumpUrl: string;
}

export interface CourseModule {
  moduleType: 'required' | 'certificate';
  sectionTitle: string;
  sectionLink: string;
  courses: Course[];
}

export type HomeResponse = ApiResponse<{
  carousel: { interval: number; items: CarouselItem[] };
  continueLearning: {
    sectionTitle: string;
    sectionLink: string;
    course: {
      id: string;
      title: string;
      coverImage: string;
      currentTime: string;
      totalTime: string;
      progress: number;
      jumpUrl: string;
    } | null;
  } | null;
  courseModules: CourseModule[];
}>;

export type CourseListResponse = ApiResponse<{ list: Course[] }>;

export type ChapterType = 'video' | 'image' | 'pdf' | 'test' | 'exam';
export type ChapterStatus = 'playing' | 'completed' | 'unlocked' | 'locked';

export interface Chapter {
  id: number;
  index: string;
  name: string;
  type: ChapterType;
  spendTime: number;
  status: ChapterStatus;
  url: string;
  initialTime: number;
}

export interface CourseDetail {
  id: number;
  title: string;
  desc: string;
  currentChapterIndex: number;
  chapters: Chapter[];
}

export type CourseDetailResponse = ApiResponse<CourseDetail>;

export interface UpdatePlayProgressRequest {
  courseId: string;
  chapterId: number;
  playPosition?: number;
}

export type ExamStatus = 'not_started' | 'in_progress';
export type ExamQuestionType = 0 | 1;

interface BaseExamQuestion {
  id: number;
  type: ExamQuestionType;
  title: string;
  score: number;
}

export interface ChoiceExamQuestion extends BaseExamQuestion {
  type: 0;
  options: string[];
}

export interface FillExamQuestion extends BaseExamQuestion {
  type: 1;
  blankCount: number;
}

export type ExamQuestion = ChoiceExamQuestion | FillExamQuestion;

export interface ExamStartPageInfo {
  statusText: string;
  summaryItems: { type: 'duration' | 'questionCount'; label: string; value: string }[];
  requirementTitle: string;
  requirements: string[];
  notice: string;
  confirmText: string;
}

export interface ExamDetail {
  name: string;
  desc: string;
  startPage: ExamStartPageInfo;
  warningText: string;
  status: ExamStatus;
  durationSeconds: number;
  remainingSeconds: number;
  currentQuestionIndex: number;
  questions: ExamQuestion[];
}

export type ExamResponse = ApiResponse<ExamDetail>;

export type ExamSubmitAnswer =
  | { questionId: number; type: 0; optionIndex: number }
  | { questionId: number; type: 1; values: string[] };

export interface ExamSubmitRequest {
  chapterId: number;
  durationSeconds: number;
  remainingSeconds: number;
  answers: ExamSubmitAnswer[];
}

export type ExamSubmitResponse = ApiResponse<{ examRecordId: string }>;

export interface ExamResult {
  examRecordId: number;
  examName: string;
  passed: boolean;
  certificateId?: number;
  score: number;
  passScore: number;
  resultStatusText: string;
  resultDesc: string;
  dataOverview: { name: string; value: string }[];
  typePerformance: { name: string; correctCount: number; totalCount: number }[];
  tipInfo: { img: string; title: string; desc: string };
}

export type ExamResultResponse = ApiResponse<ExamResult>;

export interface CertificateDetail {
  certificateId: number;
  statusText: string;
  name: string;
  desc: string;
  imageUrl: string;
  previewHint: string;
  infoSection: { title: string; rows: { label: string; value: string }[] };
  nodeInfo: { noteTitle: string; notes: string[] };
}

export type CertificateDetailResponse = ApiResponse<CertificateDetail>;

export interface StatsItem {
  value: string;
  label: string;
  type: 'studyMinutes' | 'certificate' | 'ranking' | 'other';
}

export interface RecentLearningItem {
  id: string;
  courseName: string;
  coverImage: string;
  lastWatched: string;
  progress: number;
  jumpUrl: string;
}

export type ProfileResponse = ApiResponse<{
  stats: StatsItem[];
  recentLearning: RecentLearningItem[];
}>;
