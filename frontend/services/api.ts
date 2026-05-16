import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const DEVICE_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL_DEVICE || 'http://192.168.68.59:8080';
const WEB_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL_WEB || 'http://localhost:8080';


const BASE_URL = Platform.OS === 'web' ? WEB_BASE_URL : DEVICE_BASE_URL;

export { BASE_URL };

const TOKEN_KEY = 'authToken';
const NICKNAME_KEY = 'userNickname';
const USER_ID_KEY = 'userId';

// 앱이 실행되는 동안 사용할 메모리 캐시 (매번 디스크에서 읽으면 느리므로)
let authToken: string | null = null;
let currentNickname = '';
let currentUserId: number | null = null;

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

/**
 * [추가된 부분 1] 앱 시작 시 저장된 토큰을 불러오는 함수
 */
export const restoreAuth = async (): Promise<boolean> => {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const nickname = await SecureStore.getItemAsync(NICKNAME_KEY);
    const userId = await SecureStore.getItemAsync(USER_ID_KEY);

    if (token) {
      authToken = token;
      currentNickname = nickname || '';
      currentUserId = userId ? Number(userId) : null;
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
export const setAuthData = async (token: string, nickname: string, userId: number) => {
  try {
    authToken = token;
    currentNickname = nickname;
    currentUserId = userId;
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(NICKNAME_KEY, nickname);
    await SecureStore.setItemAsync(USER_ID_KEY, String(userId));
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
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(NICKNAME_KEY);
    await SecureStore.deleteItemAsync(USER_ID_KEY);
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
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
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
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
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
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: unknown;
}) {
  const response = await request<ApiResponse<T>>(config);
  return response.data;
}

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
    deviceId?: string;
    deviceName?: string;
    imageUri?: string;
  }): Promise<MyPlantItem> {
    const formData = new FormData();
    formData.append('userId', String(params.userId));
    formData.append('nickname', params.nickname);
    if (params.location) formData.append('location', params.location);
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
};

// plant-service의 도감 API: 응답 래퍼 없이 DTO/배열을 그대로 반환한다고 가정.
export const bookApi = {
  getAll: () => request<PlantBookItem[]>({ url: '/book', method: 'GET' }),
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
  createdAt: string;
  updatedAt?: string;
}

// plant-service의 PUT /plant/{id}는 nickname/location만 갱신함
export interface CreateMyPlantDto {
  nickname?: string;
  location?: string;
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

export interface PlantBookItem {
  speciesCode: number;
  name: string;
  scientificName?: string;
  imageUrl?: string;
  difficulty?: string;
}

export interface PlantBookDetail extends PlantBookItem {
  description?: string;
  adviseInfo?: string;
  growthTemp?: string;
  waterCycle?: string;
  lightInfo?: string;
  humidity?: string;
}
