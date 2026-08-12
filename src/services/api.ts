import Taro from '@tarojs/taro';
import {
  CertificateDetailResponse,
  CourseCategoriesResponse,
  CourseListFilter,
  CourseDetailResponse,
  CourseListResponse,
  ExamListResponse,
  ExamResponse,
  ExamResultResponse,
  ExamStartRequest,
  ExamStartResponse,
  ExamSubmitRequest,
  ExamSubmitResponse,
  HomeResponse,
  LoginApiResponse,
  LoginConfigResponse,
  LoginRequest,
  LoginResponse,
  ProfileResponse,
  ProductCategoriesResponse,
  ProductDetailResponse,
  ProductListFilter,
  ProductListResponse,
  UpdatePlayProgressRequest,
} from '../types';
import { getFullApiBaseUrl } from './environment';
import { getToken } from './storage';
import {
  USE_MOCK,
  buildMockCourseList,
  mockCourseCategories,
  logMockProgress,
  mockCourseDetailData,
  mockDelay,
  mockFetchCertificateDetail,
  mockFetchExamList,
  mockFetchExamResult,
  mockHomeData,
  mockLogin,
  mockLoginConfig,
  mockProfileData,
  mockStartExam,
  mockSubmitExam,
  mockExamData,
} from './mock';

class AuthExpiredError extends Error {
  constructor() {
    super('登录已过期，请重新登录');
    this.name = 'AuthExpiredError';
  }
}

let unauthorizedHandler: (() => void | Promise<void>) | null = null;

export function setUnauthorizedHandler(handler: (() => void | Promise<void>) | null): void {
  unauthorizedHandler = handler;
}

async function request<T>(path: string, options: any = {}, auth = true): Promise<T> {
  const token = auth ? await getToken() : null;
  const header = {
    'Content-Type': 'application/json',
    ...(options.header || {}),
    ...(token ? { Authorization: `Bearer ${token}`, token } : {}),
  };

  const response = await Taro.request<T>({
    ...options,
    url: `${await getFullApiBaseUrl()}${path}`,
    header,
    credentials: 'include',
  });

  if (response.statusCode === 401) {
    await unauthorizedHandler?.();
    throw new AuthExpiredError();
  }

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`请求失败：${response.statusCode}`);
  }

  return response.data as T;
}

export async function fetchHomeData(): Promise<HomeResponse> {
  return USE_MOCK ? mockDelay(mockHomeData) : request<HomeResponse>('/home');
}

export async function fetchLoginConfig(): Promise<LoginConfigResponse> {
  return USE_MOCK ? mockDelay(mockLoginConfig) : request<LoginConfigResponse>('/login/config', {}, false);
}

export async function login(loginRequest: LoginRequest): Promise<LoginResponse> {
  if (USE_MOCK) return mockDelay(mockLogin(loginRequest));

  const response = await request<LoginApiResponse>('/login', { method: 'POST', data: loginRequest }, false);
  if (response.code !== 0) {
    throw new Error(response.des || response.desc || '登录失败');
  }
  if (!response.data?.token || !response.data?.user) {
    throw new Error('登录接口返回数据缺少 token 或用户信息');
  }
  return response.data;
}

export async function fetchCourseCategories(): Promise<CourseCategoriesResponse> {
  return USE_MOCK ? mockDelay(mockCourseCategories) : request<CourseCategoriesResponse>('/course-categories');
}

export async function fetchCourseList(filter: CourseListFilter = {}): Promise<CourseListResponse> {
  if (USE_MOCK) return mockDelay(buildMockCourseList(filter));

  const data = {
    ...(filter.primaryCategoryId !== undefined
      ? { primaryCategoryId: filter.primaryCategoryId }
      : {}),
    ...(filter.secondaryCategoryId !== undefined
      ? { secondaryCategoryId: filter.secondaryCategoryId }
      : {}),
  };
  return request<CourseListResponse>('/courses', { method: 'GET', data });
}

export async function fetchProfile(): Promise<ProfileResponse> {
  return USE_MOCK ? mockDelay(mockProfileData) : request<ProfileResponse>('/profile');
}

export async function fetchCourseDetail(courseId: string): Promise<CourseDetailResponse> {
  console.log('fetchCourseDetail courseId:', courseId);
  return USE_MOCK ? mockDelay(mockCourseDetailData) : request<CourseDetailResponse>(`/course?id=${courseId}`);
}

export async function fetchProductCategories(): Promise<ProductCategoriesResponse> {
  return request<ProductCategoriesResponse>('/product-categories');
}

export async function fetchProductList(filter: ProductListFilter = {}): Promise<ProductListResponse> {
  const data = {
    ...(filter.primaryCategoryId !== undefined
      ? { primaryCategoryId: filter.primaryCategoryId }
      : {}),
    ...(filter.secondaryCategoryId !== undefined
      ? { secondaryCategoryId: filter.secondaryCategoryId }
      : {}),
  };
  return request<ProductListResponse>('/products', { method: 'GET', data });
}

export async function fetchProductDetail(productId: string | number): Promise<ProductDetailResponse> {
  return request<ProductDetailResponse>(`/product?id=${productId}`);
}

export async function updatePlayProgress(playProgressRequest: UpdatePlayProgressRequest): Promise<{ code: number; desc: string; data: null }> {
  if (USE_MOCK) {
    logMockProgress(playProgressRequest);
    return mockDelay({ code: 0, desc: '更新成功', data: null });
  }
  return request('/course/play-progress', { method: 'POST', data: playProgressRequest });
}

export async function fetchExamDetail(courseId: string, chapterId: number): Promise<ExamResponse> {
  console.log('fetchExamDetail:', courseId, chapterId);
  return USE_MOCK ? mockDelay(mockExamData) : request<ExamResponse>(`/exam?courseId=${courseId}&chapterId=${chapterId}`);
}

export async function fetchExamList(): Promise<ExamListResponse> {
  return USE_MOCK ? mockFetchExamList() : request<ExamListResponse>('/exams');
}

export async function startExam(examStartRequest: ExamStartRequest): Promise<ExamStartResponse> {
  return USE_MOCK ? mockStartExam(examStartRequest) : request<ExamStartResponse>('/exam/start', { method: 'POST', data: examStartRequest });
}

export async function submitExam(examSubmitRequest: ExamSubmitRequest): Promise<ExamSubmitResponse> {
  return USE_MOCK ? mockSubmitExam(examSubmitRequest) : request<ExamSubmitResponse>('/examSubmit', { method: 'POST', data: examSubmitRequest });
}

export async function fetchExamResult(examRecordId: string | number): Promise<ExamResultResponse> {
  return USE_MOCK ? mockFetchExamResult(examRecordId) : request<ExamResultResponse>(`/examResult?examRecordId=${examRecordId}`);
}

export async function fetchCertificateDetail(certificateId: number): Promise<CertificateDetailResponse> {
  return USE_MOCK ? mockFetchCertificateDetail(certificateId) : request<CertificateDetailResponse>(`/certificateDetail?certificateId=${certificateId}`);
}
