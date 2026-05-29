import type { DeviceStatus, SensorData, SensorDeviceInfo } from '../services/api';
import { HealthStateColors, SensorStatusColors } from '../theme';
import {
  getHumidityStatus,
  getIlluminanceStatus,
  getMoistureStatus,
  getTempStatus,
} from './sensorHelpers';

// 클라이언트가 다루는 통합 센서 상태
// NOT_REGISTERED: 식물에 deviceId 없음 (등록 전)
// ONLINE: 최근 데이터 수신 (~1분 이내)
// OFFLINE: 등록은 됐지만 데이터 없음 (1~10분, 또는 백엔드 status=OFFLINE)
// DISABLED: active=false (10분 이상 데이터 없어 스케줄러가 비활성화)
export type SensorState = 'NOT_REGISTERED' | 'ONLINE' | 'OFFLINE' | 'DISABLED';

const ONLINE_THRESHOLD_MS = 60 * 1000;          // 1분 이내 데이터 → ONLINE
const OFFLINE_THRESHOLD_MS = 10 * 60 * 1000;    // 10분 이내 데이터 → OFFLINE

// 식물 + 디바이스 + 최신 센서 데이터로부터 통합 상태를 도출
export function deriveSensorState(
  plantDeviceId: string | null | undefined,
  device: SensorDeviceInfo | null | undefined,
  sensorCreatedAt: string | null | undefined,
): SensorState {
  if (!plantDeviceId) return 'NOT_REGISTERED';
  if (device?.status === 'DISABLED') return 'DISABLED';

  const elapsedMs = elapsedSince(sensorCreatedAt);
  if (elapsedMs != null && elapsedMs < ONLINE_THRESHOLD_MS) return 'ONLINE';
  if (device?.status === 'ONLINE') return 'ONLINE';
  return 'OFFLINE';
}

export type RealtimeIndicator = {
  state: 'ONLINE' | 'STALE' | 'NO_DATA';
  label: string;
  color: string;
};

// 마지막 수신 시각 기준 실시간 indicator (대시보드 상단 카드용)
// theme의 SensorStatusColors와 동일한 팔레트를 사용해 다른 화면과 시각 일관성 유지
export function getRealtimeIndicator(sensorCreatedAt: string | null | undefined): RealtimeIndicator {
  const elapsedMs = elapsedSince(sensorCreatedAt);
  if (elapsedMs == null) {
    return { state: 'NO_DATA', label: SensorStatusColors.DISABLED.label, color: SensorStatusColors.DISABLED.dot };
  }
  if (elapsedMs < ONLINE_THRESHOLD_MS) {
    return { state: 'ONLINE', label: SensorStatusColors.ONLINE.label, color: SensorStatusColors.ONLINE.dot };
  }
  if (elapsedMs < OFFLINE_THRESHOLD_MS) {
    return { state: 'STALE', label: SensorStatusColors.OFFLINE.label, color: SensorStatusColors.OFFLINE.dot };
  }
  return { state: 'NO_DATA', label: SensorStatusColors.DISABLED.label, color: SensorStatusColors.DISABLED.dot };
}

function elapsedSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const time = new Date(dateStr).getTime();
  if (Number.isNaN(time)) return null;
  return Math.max(0, Date.now() - time);
}

// SensorDeviceInfo만으로 카드/리스트에 표시할 상태
export function getDeviceCardState(device: SensorDeviceInfo): SensorState {
  if (device.status === 'DISABLED') return 'DISABLED';
  if (device.status === 'OFFLINE') return 'OFFLINE';
  return 'ONLINE';
}

// 상태 → 시각 정보 (theme의 SensorStatusColors 매핑)
// SensorState ('NOT_REGISTERED' 포함)이든 DeviceStatus든 동일 토큰 셋을 반환
export function getStatusVisual(state: SensorState | DeviceStatus) {
  return SensorStatusColors[state];
}

// ───── 식물 건강 요약 (대시보드 최상단 카드용) ─────

export type MetricState = 'OK' | 'WARN' | 'CRIT' | 'NO_DATA';

export type MetricSummary = {
  label: string;
  state: MetricState;
  description: string;  // 예: '적절', '부족 — 물주기 필요'
};

export type PlantHealthSummary = {
  overall: MetricState;
  title: string;
  metrics: MetricSummary[];
};

// sensorHelpers의 문자열 분기를 MetricState로 매핑 (임계값 단일 소스 유지)
export function moistureMetric(v?: number): MetricSummary {
  const s = getMoistureStatus(v);
  if (s === '-') return { label: '토양 수분', state: 'NO_DATA', description: '데이터 없음' };
  if (s === '부족') return { label: '토양 수분', state: 'CRIT', description: '부족 — 물주기 필요' };
  if (s === '과다') return { label: '토양 수분', state: 'CRIT', description: '과다' };
  return { label: '토양 수분', state: 'OK', description: '적절' };
}

export function tempMetric(v?: number): MetricSummary {
  const s = getTempStatus(v);
  if (s === '-') return { label: '온도', state: 'NO_DATA', description: '데이터 없음' };
  if (s === '주의') return { label: '온도', state: 'WARN', description: '적정 범위 벗어남' };
  return { label: '온도', state: 'OK', description: '안정적' };
}

export function humidityMetric(v?: number): MetricSummary {
  const s = getHumidityStatus(v);
  if (s === '-') return { label: '습도', state: 'NO_DATA', description: '데이터 없음' };
  if (s === '건조') return { label: '습도', state: 'WARN', description: '건조' };
  if (s === '습함') return { label: '습도', state: 'WARN', description: '습함' };
  return { label: '습도', state: 'OK', description: '쾌적' };
}

export function illuminanceMetric(v?: number): MetricSummary {
  const s = getIlluminanceStatus(v);
  if (s === '-') return { label: '조도', state: 'NO_DATA', description: '데이터 없음' };
  if (s === '어두움') return { label: '조도', state: 'WARN', description: '부족' };
  if (s === '강함') return { label: '조도', state: 'WARN', description: '너무 강함' };
  return { label: '조도', state: 'OK', description: '충분' };
}

export function getPlantHealthSummary(sensor: SensorData | null | undefined): PlantHealthSummary {
  if (!sensor) {
    return { overall: 'NO_DATA', title: '센서 데이터 대기 중', metrics: [] };
  }
  const metrics = [
    moistureMetric(sensor.soilMoisture),
    tempMetric(sensor.temperature),
    humidityMetric(sensor.humidity),
    illuminanceMetric(sensor.illuminance),
  ];
  if (metrics.some((m) => m.state === 'CRIT')) {
    return { overall: 'CRIT', title: '조치가 필요해요', metrics };
  }
  if (metrics.some((m) => m.state === 'WARN')) {
    return { overall: 'WARN', title: '확인이 필요해요', metrics };
  }
  return { overall: 'OK', title: '정상 관리 중', metrics };
}

export function getHealthVisual(state: MetricState) {
  return HealthStateColors[state];
}
