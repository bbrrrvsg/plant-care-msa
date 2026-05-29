export const Colors = {
  primary: '#3a7d44',
  primaryLight: '#7CCB8A',
  primaryBg: '#e8f5e9',
  primaryBgLight: '#E9F7EF',
  dark: '#2d5a27',
  background: '#f5f5f0',
  backgroundGray: '#f9f9f9',
  white: '#ffffff',
  black: '#000000',

  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  textGreen: '#3a7d44',

  border: '#e5e7eb',
  borderLight: '#f3f4f6',

  success: '#16a34a',
  successBg: '#dcfce7',
  successText: '#15803d',

  warning: '#f59e0b',
  warningBg: '#fef3c7',
  warningText: '#b45309',

  info: '#3b82f6',
  infoBg: '#dbeafe',
  infoText: '#1d4ed8',

  error: '#ef4444',
  errorBg: '#fee2e2',
  errorText: '#dc2626',

  orange: '#f97316',
  orangeBg: '#fff7ed',

  blue: '#3b82f6',
  blueBg: '#eff6ff',

  red: '#ef4444',
  redBg: '#fef2f2',
} as const;

// 센서 통합 상태 컬러 — Dashboard indicator / Devices 카드 / Plant 카드 등에서 공통 사용
export const SensorStatusColors = {
  ONLINE:  { dot: '#22C55E', bg: '#D1FAE5', text: '#059669', label: '실시간 모니터링', badge: '온라인' },
  OFFLINE: { dot: '#F59E0B', bg: '#FEF3C7', text: '#B45309', label: '연결 지연',       badge: '오프라인' },
  DISABLED:{ dot: '#9CA3AF', bg: '#F3F4F6', text: '#6B7280', label: '데이터 없음',     badge: '비활성' },
  NOT_REGISTERED: { dot: '#9CA3AF', bg: '#F3F4F6', text: '#6B7280', label: '센서 미연결', badge: '미등록' },
} as const;

// 식물 건강 상태 — 측정값 임계 기반 (정상/주의/위험)
export const HealthStateColors = {
  OK:      { bg: '#ECFDF5', border: '#A7F3D0', dot: '#10B981', text: '#065F46', emoji: '🟢' },
  WARN:    { bg: '#FFFBEB', border: '#FDE68A', dot: '#F59E0B', text: '#92400E', emoji: '🟡' },
  CRIT:    { bg: '#FEF2F2', border: '#FECACA', dot: '#EF4444', text: '#991B1B', emoji: '🔴' },
  NO_DATA: { bg: '#F9FAFB', border: '#E5E7EB', dot: '#9CA3AF', text: '#6B7280', emoji: '⚪' },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

export const FontSize = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
} as const;
