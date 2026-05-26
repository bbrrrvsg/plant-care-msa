import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { hydrateFavorites } from '../lib/favoritesStore';

const DEVICE_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL_DEVICE;
const WEB_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL_WEB;


const BASE_URL = Platform.OS === 'web' ? WEB_BASE_URL : DEVICE_BASE_URL;

export { BASE_URL };

/**
 * 백엔드가 반환한 자산 경로(예: "/images/uuid_foo.jpg")를 절대 URL로 변환.
 * - 이미 http(s)/data/file/blob URL이면 그대로 반환
 * - "/" 로 시작하면 BASE_URL 앞에 붙임
 * - 그 외(상대 경로/플레이스홀더)는 그대로 반환
 */
export function resolveAssetUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (/^(https?:|data:|file:|blob:)/i.test(url)) return url;
  if (url.startsWith('/') && BASE_URL) return `${BASE_URL.replace(/\/$/, '')}${url}`;
  return url;
}

const TOKEN_KEY = 'authToken';
const NICKNAME_KEY = 'userNickname';
const USER_ID_KEY = 'userId';
const LOGIN_ID_KEY = 'userLoginId';

// 앱이 실행되는 동안 사용할 메모리 캐시 (매번 디스크에서 읽으면 느리므로)
let authToken: string | null = null;
let currentNickname = '';
let currentUserId: number | null = null;
let currentLoginId: string | null = null;

export function setToken(token: string) {
  authToken = token;
}

export function clearToken() {
  authToken = null;
  currentNickname = '';
  currentUserId = null;
}

export function setNickname(nickname: string) {
  currentNickname = nickname;
}

export function getNickname() {
  return currentNickname;
}

export function getUserId() {
  return currentUserId;
}

export function getLoginId() {
  return currentLoginId;
}

/**
 * [추가된 부분 1] 앱 시작 시 저장된 토큰을 불러오는 함수
 */
export const restoreAuth = async (): Promise<boolean> => {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const nickname = await SecureStore.getItemAsync(NICKNAME_KEY);
    const userId = await SecureStore.getItemAsync(USER_ID_KEY);
    const loginId = await SecureStore.getItemAsync(LOGIN_ID_KEY);

    if (token) {
      authToken = token;
      currentNickname = nickname || '';
      currentUserId = userId ? Number(userId) : null;
      currentLoginId = loginId || null;
      await hydrateFavorites(currentUserId);
      return true; // 복원 성공 (자동 로그인)
    }
  } catch (error) {
    console.error('토큰 복원 실패:', error);
  }
  return false; // 복원 실패 (로그인 필요)
};

/**
 * [추가된 부분 2] 로그인 성공 시 토큰과 닉네임을 기기에 저장하는 함수
 * (Login.tsx에서 로그인 API 성공 직후 호출해야 함)
 */
export const setAuthData = async (
  token: string,
  nickname: string,
  userId: number,
  loginId?: string,
) => {
  try {
    authToken = token;
    currentNickname = nickname;
    currentUserId = userId;
    currentLoginId = loginId ?? null;
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(NICKNAME_KEY, nickname);
    await SecureStore.setItemAsync(USER_ID_KEY, String(userId));
    if (loginId) {
      await SecureStore.setItemAsync(LOGIN_ID_KEY, loginId);
    }
    await hydrateFavorites(userId);
  } catch (error) {
    console.error('토큰 저장 실패:', error);
  }
};

/**
 * [추가된 부분 3] 로그아웃 시 기기에서 토큰을 삭제하는 함수
 * (Settings.tsx의 로그아웃 버튼에서 호출해야 함)
 */
export const clearAuthData = async () => {
  try {
    authToken = null;
    currentNickname = '';
    currentUserId = null;
    currentLoginId = null;
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(NICKNAME_KEY);
    await SecureStore.deleteItemAsync(USER_ID_KEY);
    await SecureStore.deleteItemAsync(LOGIN_ID_KEY);
    await hydrateFavorites(null);
  } catch (error) {
    console.error('토큰 삭제 실패:', error);
  }
};

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30초 타임아웃
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Axios 요청 인터셉터 (F2 문제 해결)
 * 모든 백엔드 요청 헤더에 Authorization 토큰을 자동으로 실어 보냅니다.
 */
apiClient.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

function toErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const responseMessage = error.response?.data?.message;
    if (typeof responseMessage === 'string' && responseMessage.length > 0) {
      return responseMessage;
    }

    if (error.code === AxiosError.ERR_NETWORK) {
      return `Network error. Check that the API is reachable at ${BASE_URL}.`;
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unexpected request failure.';
}

async function request<T>(config: {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: unknown;
}) {
  try {
    const response = await apiClient.request<T>(config);
    return response.data;
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

async function requestNullable<T>(config: {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: unknown;
}) {
  try {
    const response = await apiClient.request<T>(config);
    if (response.status === 204) return null;
    return response.data ?? null;
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

async function requestApiData<T>(config: {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: unknown;
}) {
  const response = await request<ApiResponse<T>>(config);
  return response.data;
}

// 사용자 프로필(user-service /auth/user/**)
// 이 서비스만 ApiResponse 래퍼 없이 DTO를 그대로 반환하는 부분(getUser)이 있어 분기 처리한다.
export const userApi = {
  // /auth/user/{userId} 응답이 래핑되지 않은 DTO이므로 request<>를 그대로 사용
  getByLoginId: (loginId: string) =>
    request<UserProfile>({
      url: `/auth/user/${encodeURIComponent(loginId)}`,
      method: 'GET',
    }),

  removeProfileImage: (loginId: string) =>
    request<UserProfile>({
      url: `/auth/user/${encodeURIComponent(loginId)}/profile-image`,
      method: 'DELETE',
    }),

  async uploadProfileImage(loginId: string, imageUri: string): Promise<UserProfile> {
    const filename = imageUri.split('/').pop() || 'profile.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';

    const formData = new FormData();
    formData.append('image', { uri: imageUri, name: filename, type } as any);

    try {
      const response = await apiClient.patch<UserProfile>(
        `/auth/user/${encodeURIComponent(loginId)}/profile-image`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return response.data;
    } catch (error) {
      throw new Error(toErrorMessage(error));
    }
  },
};

export const authApi = {
  async login(userId: string, password: string) {
    return requestApiData<{ userId: number; token: string; nickname: string }>({
      url: '/auth/login',
      method: 'POST',
      data: { userId, password },
    });
  },

  async signup(userId: string, nickname: string, email: string, password: string) {
    return requestApiData<string>({
      url: '/auth/signup',
      method: 'POST',
      data: { userId, nickname, email, password },
    });
  },
};

// 🌿 식물 관련 API 묶음 (plant-service: 응답 래퍼 없이 DTO/배열 그대로 반환)
// 토큰은 요청 인터셉터에서 자동으로 실려 가므로 보통 /plant 호출만으로 내 식물을 식별할 수 있음.
// 백엔드가 userId 파라미터를 필수로 요구하면 인자로 넘겨주세요.
export const plantApi = {
  getMyPlants: (userId: number) =>
    request<MyPlantItem[]>({
      url: `/plant?userId=${userId}`,
      method: 'GET',
    }),
  getById: (myPlantId: number) =>
    request<MyPlantItem>({ url: `/plant/${myPlantId}`, method: 'GET' }),
  getPlantDetail: (myPlantId: number) =>
    request<MyPlantItem>({ url: `/plant/${myPlantId}`, method: 'GET' }),
  async addPlant(params: {
    userId: number;
    nickname: string;
    location?: string;
    speciesCode?: number;
    deviceId?: string;
    deviceName?: string;
    imageUri?: string;
  }): Promise<MyPlantItem> {
    const formData = new FormData();
    formData.append('userId', String(params.userId));
    formData.append('nickname', params.nickname);
    if (params.location) formData.append('location', params.location);
    if (params.speciesCode != null) formData.append('speciesCode', String(params.speciesCode));
    if (params.deviceId) formData.append('deviceId', params.deviceId);
    if (params.deviceName) formData.append('deviceName', params.deviceName);

    if (params.imageUri) {
      const filename = params.imageUri.split('/').pop() || 'plant.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      formData.append('image', { uri: params.imageUri, name: filename, type } as any);
    }

    try {
      const response = await apiClient.post<MyPlantItem>('/plant', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw new Error(toErrorMessage(error));
    }
  },
  update: (myPlantId: number, data: Partial<CreateMyPlantDto>) =>
    request<MyPlantItem>({ url: `/plant/${myPlantId}`, method: 'PUT', data }),
  delete: (myPlantId: number) =>
    request<void>({ url: `/plant/${myPlantId}`, method: 'DELETE' }),
  archive: (myPlantId: number, data: { reason: string; message: string }) =>
    request<MyPlantItem>({
      url: `/plant/${myPlantId}/archive`,
      method: 'PATCH',
      data,
    }),
  getMemorials: (userId: number) =>
    request<MyPlantItem[]>({
      url: `/plant?userId=${userId}&archived=true`,
      method: 'GET',
    }),
};

// plant-service의 도감 API: 응답 래퍼 없이 DTO/배열을 그대로 반환한다고 가정.
export const bookApi = {
  getAll: () => request<PlantBookItem[]>({ url: '/book', method: 'GET' }),
  // 카테고리: 'all' | 'beginner' | 'succulent' | 'foliage' | 'flower_fruit'
  getByCategory: (category: string) =>
    request<PlantBookItem[]>({
      url: `/book?category=${encodeURIComponent(category)}`,
      method: 'GET',
    }),
  search: (name: string) =>
    request<PlantBookItem[]>({
      url: `/book/search?name=${encodeURIComponent(name)}`,
      method: 'GET',
    }),
  getById: (speciesCode: number) =>
    request<PlantBookDetail>({
      url: `/book/${encodeURIComponent(String(speciesCode))}`,
      method: 'GET',
    }),
};

export const sensorApi = {
  getLatest: (plantId: number) =>
    requestNullable<SensorData>({ url: `/api/sensor/data/${plantId}`, method: 'GET' }),
  getHistory: (plantId: number, hours: number = 10) =>
    request<SensorData[]>({
      url: `/api/sensor/data/${plantId}/history?hours=${hours}`,
      method: 'GET',
    }),

  // 미연결 디바이스 목록 (ESP32 자동 등록 후 link 안 된 것들)
  getUnlinkedDevices: () =>
    request<SensorDeviceInfo[]>({
      url: '/api/sensor/device/unlinked',
      method: 'GET',
    }),

  // 내가 연결한 디바이스 목록
  getMyDevices: (userId: string) =>
    request<SensorDeviceInfo[]>({
      url: `/api/sensor/device?userId=${encodeURIComponent(userId)}`,
      method: 'GET',
    }),

  // 디바이스 별명 설정
  updateDeviceName: (deviceId: string, deviceName: string) =>
    request<void>({
      url: `/api/sensor/device/${encodeURIComponent(deviceId)}/name`,
      method: 'PATCH',
      data: { deviceName },
    }),

  // 디바이스 → 식물 연결
  linkDevice: (deviceId: string, payload: {
    plantId: number;
    userId: string;
    deviceName?: string;
    speciesCode?: number;
  }) =>
    request<void>({
      url: `/api/sensor/device/${encodeURIComponent(deviceId)}/link`,
      method: 'PATCH',
      data: payload,
    }),

  // 디바이스 → 식물 연결 해제
  unlinkDevice: (deviceId: string) =>
    request<void>({
      url: `/api/sensor/device/${encodeURIComponent(deviceId)}/unlink`,
      method: 'PATCH',
    }),
};

// 🌱 성장 일지(GrowthLog) API — plant-service의 /growth-log/** 라우트
// 백엔드 GrowthLogDto/RequestDto 1:1 대응. 응답은 래퍼 없이 DTO 또는 배열 그대로.
export const growthLogApi = {
  getMyLogs: (userId: number) =>
    request<GrowthLogItem[]>({
      url: `/growth-log?userId=${userId}`,
      method: 'GET',
    }),

  getDetail: (logId: number, includeDiagnosis: boolean = false) =>
    request<GrowthLogItem>({
      url: `/growth-log/${logId}?includeDiagnosis=${includeDiagnosis}`,
      method: 'GET',
    }),

  // 사진 없이 저장 (JSON)
  write: (data: CreateGrowthLogDto) =>
    request<GrowthLogItem>({
      url: '/growth-log/write',
      method: 'POST',
      data,
    }),

  // 사진 첨부 저장 (multipart). imageUri가 있으면 multipart, 없으면 JSON 경로로 호출.
  async writeWithImage(data: CreateGrowthLogDto, imageUri?: string | null): Promise<GrowthLogItem> {
    if (!imageUri) {
      return growthLogApi.write(data);
    }
    const formData = new FormData();
    formData.append('plantId', String(data.plantId));
    formData.append('title', data.title);
    formData.append('content', data.content);
    if (data.type) formData.append('type', data.type);
    if (data.diagnosisId != null) formData.append('diagnosisId', String(data.diagnosisId));
    if (data.logDate) formData.append('logDate', data.logDate);

    const filename = imageUri.split('/').pop() || 'log.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';
    formData.append('image', { uri: imageUri, name: filename, type } as any);

    try {
      const response = await apiClient.post<GrowthLogItem>('/growth-log/write', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw new Error(toErrorMessage(error));
    }
  },

  update: (logId: number, data: Partial<GrowthLogItem>) =>
    request<GrowthLogItem>({
      url: `/growth-log/${logId}`,
      method: 'PUT',
      data,
    }),

  delete: (logId: number) =>
    request<boolean>({
      url: `/growth-log/${logId}`,
      method: 'DELETE',
    }),
};

// 🌤️ 날씨 위젯 API — plant-service의 /weather/widget 라우트
export const weatherApi = {
  getWidget: (lat: number, lon: number) =>
    request<WeatherWidgetResponse>({
      url: `/weather/widget?lat=${lat}&lon=${lon}`,
      method: 'GET',
    }),
};

export const aiApi = {
  async diagnose(imageUri: string, plantId?: number): Promise<DiagnosisResult> {
    const filename = imageUri.split('/').pop() || 'plant.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    const formData = new FormData();
    formData.append('image', { uri: imageUri, name: filename, type } as any);
    if (plantId != null) {
      formData.append('plantId', String(plantId));
    }

    try {
      const response = await apiClient.post<DiagnosisResult>('/ai/gemini', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(toErrorMessage(error));
    }
  },

  async identify(imageUri: string): Promise<PlantBookItem[]> {
    const filename = imageUri.split('/').pop() || 'plant.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    const formData = new FormData();
    formData.append('image', { uri: imageUri, name: filename, type } as any);

    try {
      const response = await apiClient.post<PlantBookItem[]>('/ai/identify', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw new Error(toErrorMessage(error));
    }
  },
};

/**
 * 🌿 내 식물 데이터 타입 (백엔드 PlantResponseDto 1:1 대응)
 */
export interface MyPlantItem {
  myPlantId: number;
  userId: number;
  speciesCode?: string;
  plantName: string;       // 종 이름 (book에서 옴)
  imageUrl?: string;       // 식물 사진 URL
  nickname: string;        // 사용자가 지은 별명
  location?: string;
  deviceId?: string;
  registeredAt?: string;
  lastWatered?: string;
  archivedAt?: string;            // null이면 활성, 값 있으면 추억 보관함
  farewellReason?: string;        // moved | rehomed | withered | other
  farewellMessage?: string;
  createdAt: string;
  updatedAt?: string;
}

// plant-service의 PUT /plant/{id}는 nickname/location만 갱신함
export interface CreateMyPlantDto {
  nickname?: string;
  location?: string;
}

// 백엔드 SensorDeviceDto 대응 (sensor-service)
export interface SensorDeviceInfo {
  deviceId: string;
  deviceName?: string;
  plantId?: number;
  userId?: string;
  active?: boolean;
  threshold?: number;
  duration?: number;
  speciesCode?: number;
  createdAt?: string;
  updatedAt?: string;
}

// 백엔드 SensorDataDto 대응
export interface SensorData {
  id?: number;
  plantId: number;
  deviceId?: string;
  soilMoisture: number;
  temperature: number;
  humidity: number;
  illuminance: number;
  createdAt?: string;
}

export interface DiagnosisResult {
  diagnosisId: number;
  plantId: number;
  title: string;
  subtitle?: string;
  details: string;
  result: string;
  imageUrl: string;
  diagnosisDate: string;
}

// 백엔드 UserResponseDto 대응 (user-service /auth/user/**)
export interface UserProfile {
  id: number;
  userId: string;
  email: string;
  nickname: string;
  profileImageUrl?: string;
}

export interface PlantBookItem {
  speciesCode: number;
  plantName: string;
  imageUrl?: string;
  careLevel?: string;
}

export interface PlantBookDetail extends PlantBookItem {
  watering?: string;
  sunlight?: string;
  humidity?: string;
  temperature?: string;
}

// 백엔드 GrowthLogDto 대응
export interface GrowthLogItem {
  logId: number;
  plantId: number;
  diagnosisId?: number;
  title: string;
  photoUrl?: string;
  logDate?: string;           // LocalDate (YYYY-MM-DD)
  content: string;
  type?: string;
  plantNickname?: string;
  createDate?: string;
  updateDate?: string;
  diagnosisDto?: AIDiagnosisDetail;   // includeDiagnosis=true 일 때만 채워짐
}

// 백엔드 AIDiagnosisDto 대응 (일지 상세 includeDiagnosis=true 응답에 포함)
export interface AIDiagnosisDetail {
  diagnosisId: number;
  plantId: number;
  title: string;
  subtitle?: string;
  details?: string;
  result?: string;
  imageUrl?: string;
  diagnosisDate?: string;
  createDate?: string;
  updateDate?: string;
}

// 백엔드 GrowthLogRequestDto 대응 (POST /growth-log/write body)
export interface CreateGrowthLogDto {
  plantId: number;
  diagnosisId?: number;
  title: string;
  content: string;
  type?: string;
  logDate?: string;
}

// 백엔드 WeatherWidgetResponse 대응 (plant-service)
export interface WeatherWidgetResponse {
  temperature: number;
  condition: string;
  humidity?: number | null;
  adviceTip: string;
}
