import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, Platform, StatusBar, ActivityIndicator,
} from 'react-native';
import { ArrowLeft, Plus, Settings, Activity, Thermometer, Wind, Droplets, Sun } from 'lucide-react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { plantApi, sensorApi, MyPlantItem, SensorData } from '../../services/api';
import {
  getMoistureStatus,
  getTempStatus,
  getHumidityStatus,
  getIlluminanceStatus,
} from '../../lib/sensorHelpers';
import { getHealthVisual, getPlantHealthSummary, getRealtimeIndicator } from '../../lib/sensorState';
import { HealthStateColors } from '../../theme';
import { Colors } from '../../theme';

const LATEST_POLL_INTERVAL_MS = 5000;

type SensorDashboardRouteProp = RouteProp<RootStackParamList, 'SensorDashboard'>;

type GaugeConfig = {
  current: number | undefined;   // 현재 측정값 (raw)
  min: number;
  max: number;
  optimalMin: number;
  optimalMax: number;
  fillColor: string;              // 현재값 fill (상태 기반 컬러)
};

type SensorMetric = {
  label: string;
  range: string;
  value: string;
  unit: string;
  status: string;
  data: number[];
  max: number;
  color: string;
  icon: React.ReactNode;
  gauge?: GaugeConfig;            // 정의되면 Sparkline 대신 가로 게이지 렌더
};

const getNumericHistory = (
  history: SensorData[],
  pick: (data: SensorData) => number | undefined,
) => history
  .map(pick)
  .filter((value): value is number => value != null);

const formatRelativeTime = (dateStr?: string) => {
  if (!dateStr) return '데이터 없음';

  const time = new Date(dateStr).getTime();
  if (Number.isNaN(time)) return '데이터 없음';

  const diffMinutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}일 전`;
};

const Sparkline = ({ data, color, max }: { data: number[]; color: string; max: number }) => {
  if (data.length === 0) {
    return (
      <View style={styles.emptySparkline}>
        <Text style={styles.emptySparklineText}>데이터가 아직 쌓이지 않았어요</Text>
      </View>
    );
  }

  return (
    <View style={styles.sparklineContainer}>
      {data.map((value, index) => {
        const percent = Math.max(8, Math.min(100, (value / max) * 100));
        return (
          <View
            key={`${value}-${index}`}
            style={[styles.sparklineBar, { backgroundColor: color, height: `${percent}%` as any }]}
          />
        );
      })}
    </View>
  );
};

const Gauge = ({ config }: { config: GaugeConfig }) => {
  if (config.current == null) {
    return (
      <View style={styles.emptySparkline}>
        <Text style={styles.emptySparklineText}>데이터가 아직 들어오지 않았어요</Text>
      </View>
    );
  }
  const span = config.max - config.min;
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  const fillPct = clamp(((config.current - config.min) / span) * 100);
  const optimalStartPct = clamp(((config.optimalMin - config.min) / span) * 100);
  const optimalWidthPct = clamp(((config.optimalMax - config.optimalMin) / span) * 100);

  return (
    <View style={styles.gaugeContainer}>
      <View style={styles.gaugeTrack}>
        <View
          style={[
            styles.gaugeOptimalZone,
            { left: `${optimalStartPct}%` as any, width: `${optimalWidthPct}%` as any },
          ]}
        />
        <View
          style={[
            styles.gaugeFill,
            { width: `${fillPct}%` as any, backgroundColor: config.fillColor },
          ]}
        />
      </View>
      <View style={styles.gaugeLabels}>
        <Text style={styles.gaugeLabelMuted}>{config.min}%</Text>
        <Text style={styles.gaugeLabelOptimal}>
          적정 {config.optimalMin}~{config.optimalMax}%
        </Text>
        <Text style={styles.gaugeLabelMuted}>{config.max}%</Text>
      </View>
    </View>
  );
};

const SensorWidget = ({ metric }: { metric: SensorMetric }) => (
  <View style={styles.widgetCard}>
    <View style={styles.widgetHeader}>
      {metric.icon}
      <View style={styles.widgetTitleGroup}>
        <Text style={styles.widgetLabel}>{metric.label}</Text>
        <Text style={styles.widgetRange}>적정 범위: {metric.range}</Text>
      </View>
      <View style={styles.statusChip}>
        <Text style={styles.statusChipText}>{metric.status}</Text>
      </View>
    </View>
    <View style={styles.valueContainer}>
      <Text style={styles.mainValue}>{metric.value}</Text>
      <Text style={styles.unitText}>{metric.unit}</Text>
    </View>
    {metric.gauge ? (
      <Gauge config={metric.gauge} />
    ) : (
      <View>
        <Text style={styles.sparklineCaption}>지난 1시간</Text>
        <Sparkline data={metric.data} color={metric.color} max={metric.max} />
      </View>
    )}
  </View>
);

export function SensorDashboard() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<SensorDashboardRouteProp>();
  const { plantId } = route.params;

  const [plant, setPlant] = useState<MyPlantItem | null>(null);
  const [sensor, setSensor] = useState<SensorData | null>(null);
  const [history, setHistory] = useState<SensorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  // 첫 로드만 로딩 스피너 노출, 포커스 복귀/폴링 시에는 silent refresh
  const loadAll = useCallback(async () => {
    try {
      if (!hasLoadedRef.current) setIsLoading(true);
      setError(null);
      const [plantData, latest, recent] = await Promise.all([
        plantApi.getById(plantId).catch(() => null),
        sensorApi.getLatest(plantId).catch(() => null),
        sensorApi.getRecent(plantId).catch(() => [] as SensorData[]),
      ]);
      setPlant(plantData);
      setSensor(latest);
      setHistory(recent);
    } catch (e) {
      if (!hasLoadedRef.current) setError(e instanceof Error ? e.message : '센서 데이터를 불러오지 못했어요.');
    } finally {
      setIsLoading(false);
      hasLoadedRef.current = true;
    }
  }, [plantId]);

  // 화면 포커스마다 전체 silent refresh + 5초 폴링으로 최신값 갱신
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      loadAll();
      const tick = async () => {
        const latest = await sensorApi.getLatest(plantId).catch(() => null);
        if (!cancelled) setSensor(latest);
      };
      const id = setInterval(tick, LATEST_POLL_INTERVAL_MS);
      return () => { cancelled = true; clearInterval(id); };
    }, [plantId, loadAll]),
  );

  const indicator = getRealtimeIndicator(sensor?.createdAt);
  const summary = getPlantHealthSummary(sensor);
  const summaryVisual = getHealthVisual(summary.overall);
  // plant.deviceId가 sensor-service link 흐름에서 누락되는 과거 데이터 보호용으로 sensor.deviceId도 fallback
  const hasDevice = !!plant?.deviceId || !!sensor?.deviceId;

  const metrics: SensorMetric[] = [
    {
      label: '온도',
      range: '18-24°C',
      value: sensor?.temperature != null ? sensor.temperature.toFixed(1) : '-',
      unit: '°C',
      status: getTempStatus(sensor?.temperature),
      data: getNumericHistory(history, (data) => data.temperature),
      max: 30,
      color: '#FED7AA',
      icon: (
        <View style={[styles.iconCircle, { backgroundColor: '#FFEDD5' }]}>
          <Thermometer color="#EA580C" size={24} />
        </View>
      ),
    },
    {
      label: '습도',
      range: '30-70%',
      value: sensor?.humidity != null ? Math.round(sensor.humidity).toString() : '-',
      unit: '%',
      status: getHumidityStatus(sensor?.humidity),
      data: getNumericHistory(history, (data) => data.humidity),
      max: 100,
      color: '#BFDBFE',
      icon: (
        <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
          <Wind color="#2563EB" size={24} />
        </View>
      ),
      gauge: {
        current: sensor?.humidity,
        min: 0,
        max: 100,
        optimalMin: 30,
        optimalMax: 70,
        fillColor: HealthStateColors[
          sensor?.humidity == null
            ? 'NO_DATA'
            : sensor.humidity < 30 || sensor.humidity > 70
            ? 'WARN'
            : 'OK'
        ].dot,
      },
    },
    {
      label: '토양 수분',
      range: '40-70%',
      value: sensor?.soilMoisture != null ? Math.round(sensor.soilMoisture).toString() : '-',
      unit: '%',
      status: getMoistureStatus(sensor?.soilMoisture),
      data: getNumericHistory(history, (data) => data.soilMoisture),
      max: 100,
      color: 'rgba(124,203,138,0.4)',
      icon: (
        <View style={[styles.iconCircle, { backgroundColor: 'rgba(124, 203, 138, 0.2)' }]}>
          <Droplets color="#7CCB8A" size={24} />
        </View>
      ),
      // 토양 수분은 0~100% 자연 스케일이라 게이지가 가장 직관적
      gauge: {
        current: sensor?.soilMoisture,
        min: 0,
        max: 100,
        optimalMin: 40,
        optimalMax: 70,
        fillColor: HealthStateColors[
          sensor?.soilMoisture == null
            ? 'NO_DATA'
            : sensor.soilMoisture < 20 || sensor.soilMoisture > 80
            ? 'CRIT'
            : 'OK'
        ].dot,
      },
    },
    {
      label: '조도',
      range: '100-10,000 lux',
      value: sensor?.illuminance != null ? Math.round(sensor.illuminance).toString() : '-',
      unit: 'lux',
      status: getIlluminanceStatus(sensor?.illuminance),
      data: getNumericHistory(history, (data) => data.illuminance),
      max: 10000,
      color: '#FDE68A',
      icon: (
        <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
          <Sun color="#F59E0B" size={24} />
        </View>
      ),
    },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (error && !sensor) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadAll}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.appBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#374151" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>실시간 센서</Text>
        {hasDevice ? (
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('SensorDevices')}>
            <Settings color="#374151" size={24} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('SensorRegister', { plantId: String(plantId) })}
          >
            <Plus color="#3a7d44" size={24} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: summaryVisual.bg, borderColor: summaryVisual.border },
          ]}
        >
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryEmoji}>{summaryVisual.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.summaryTitle, { color: summaryVisual.text }]}>{summary.title}</Text>
              <Text style={styles.summarySubtitle}>
                마지막 업데이트: {formatRelativeTime(sensor?.createdAt)}
              </Text>
            </View>
          </View>
          {summary.metrics.length > 0 && (
            <View style={styles.metricList}>
              {summary.metrics.map((m) => {
                const mv = getHealthVisual(m.state);
                return (
                  <View key={m.label} style={styles.metricRow}>
                    <View style={[styles.metricDot, { backgroundColor: mv.dot }]} />
                    <Text style={styles.metricLabel}>{m.label}</Text>
                    <Text style={[styles.metricDesc, { color: mv.text }]}>{m.description}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.widgetsContainer}>
          {metrics.map((metric) => (
            <SensorWidget key={metric.label} metric={metric} />
          ))}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Activity color="#2563EB" size={20} style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>센서 상태</Text>
              <Text style={styles.infoDesc}>
                {indicator.state === 'ONLINE'
                  ? '센서가 정상 작동 중이에요. 화면이 5초마다 자동으로 갱신됩니다.'
                  : indicator.state === 'STALE'
                  ? '센서 데이터 수신이 잠시 지연되고 있어요. 기기 전원과 Wi-Fi를 확인해주세요.'
                  : hasDevice
                  ? '센서로부터 데이터가 들어오지 않고 있어요. ESP32 전원이 켜져 있는지 확인해주세요.'
                  : '아직 이 식물에 센서가 연결되지 않았어요.'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 14,
    color: Colors.errorText,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 10,
  },
  iconButton: { padding: 8, marginHorizontal: -8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#111827', marginLeft: 12 },
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 16, gap: 24 },
  summaryCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryEmoji: { fontSize: 32 },
  summaryTitle: { fontSize: 18, fontWeight: '800' },
  summarySubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  metricList: { marginTop: 16, gap: 8 },
  metricRow: { flexDirection: 'row', alignItems: 'center' },
  metricDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  metricLabel: { fontSize: 14, color: '#374151', fontWeight: '500', minWidth: 70 },
  metricDesc: { fontSize: 14, fontWeight: '600', flex: 1 },
  widgetsContainer: { gap: 16, marginBottom: 24 },
  widgetCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 2,
    marginBottom: 16,
  },
  widgetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  widgetTitleGroup: { flex: 1 },
  iconCircle: { padding: 12, borderRadius: 999, marginRight: 12 },
  widgetLabel: { fontSize: 16, fontWeight: '500', color: '#4B5563' },
  widgetRange: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#E8F5E9',
  },
  statusChipText: { fontSize: 12, fontWeight: '600', color: '#2E7D32' },
  valueContainer: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 12 },
  mainValue: { fontSize: 48, fontWeight: '700', color: '#111827', marginRight: 8 },
  unitText: { fontSize: 20, color: '#6B7280' },
  sparklineContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 48,
  },
  sparklineBar: { flex: 1, borderTopLeftRadius: 4, borderTopRightRadius: 4, marginHorizontal: 2 },
  emptySparkline: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  emptySparklineText: { fontSize: 13, color: '#9CA3AF' },
  sparklineCaption: { fontSize: 11, color: '#9CA3AF', marginBottom: 6, fontWeight: '500' },
  gaugeContainer: { marginTop: 4 },
  gaugeTrack: {
    height: 14,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    position: 'relative',
  },
  gaugeOptimalZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',  // 적정 범위 옅은 초록 띠
  },
  gaugeFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 999,
  },
  gaugeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  gaugeLabelMuted: { fontSize: 11, color: '#9CA3AF' },
  gaugeLabelOptimal: { fontSize: 11, color: '#10B981', fontWeight: '600' },
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 16,
    padding: 16,
  },
  infoRow: { flexDirection: 'row', gap: 12 },
  infoIcon: { marginTop: 2, marginRight: 8 },
  infoTextContainer: { flex: 1 },
  infoTitle: { fontSize: 16, fontWeight: '600', color: '#1E3A8A', marginBottom: 4 },
  infoDesc: { fontSize: 14, color: '#1E40AF', lineHeight: 20 },
});
