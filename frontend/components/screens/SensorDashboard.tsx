import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, Platform, StatusBar, Animated, ActivityIndicator,
} from 'react-native';
import { ArrowLeft, Plus, Settings, Activity, Thermometer, Wind, Droplets, Sun } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { sensorApi, SensorData } from '../../services/api';
import {
  getMoistureStatus,
  getTempStatus,
  getHumidityStatus,
  getIlluminanceStatus,
} from '../../lib/sensorHelpers';
import { Colors } from '../../theme';

type SensorDashboardRouteProp = RouteProp<RootStackParamList, 'SensorDashboard'>;

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
    <Sparkline data={metric.data} color={metric.color} max={metric.max} />
  </View>
);

export function SensorDashboard() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<SensorDashboardRouteProp>();
  const { plantId } = route.params;
  const pingAnim = useRef(new Animated.Value(0.75)).current;

  const [sensor, setSensor] = useState<SensorData | null>(null);
  const [history, setHistory] = useState<SensorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [latest, hist] = await Promise.all([
        sensorApi.getLatest(plantId).catch(() => null),
        sensorApi.getHistory(plantId, 10).catch(() => [] as SensorData[]),
      ]);
      setSensor(latest);
      setHistory(hist);
    } catch (e) {
      setError(e instanceof Error ? e.message : '센서 데이터를 불러오지 못했어요.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pingAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
        Animated.timing(pingAnim, { toValue: 0.75, duration: 1000, useNativeDriver: true }),
      ]),
    ).start();
  }, [pingAnim]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [latest, hist] = await Promise.all([
          sensorApi.getLatest(plantId).catch(() => null),
          sensorApi.getHistory(plantId, 10).catch(() => [] as SensorData[]),
        ]);
        if (!cancelled) {
          setSensor(latest);
          setHistory(hist);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '센서 데이터를 불러오지 못했어요.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [plantId]);

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
      range: '50-70%',
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
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
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
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('SensorDevices')}>
            <Settings color="#374151" size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('SensorRegister')}>
            <Plus color="#3a7d44" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.indicatorCard}>
          <View style={styles.indicatorLeft}>
            <View style={styles.dotContainer}>
              <View style={styles.dotCore} />
              <Animated.View style={[styles.dotPing, { opacity: pingAnim }]} />
            </View>
            <Text style={styles.indicatorText}>실시간 모니터링</Text>
          </View>
          <Text style={styles.indicatorTime}>{formatRelativeTime(sensor?.createdAt)}</Text>
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
                {sensor
                  ? '모든 센서가 정상 작동 중입니다. 데이터는 5분마다 업데이트됩니다.'
                  : '센서가 연결되지 않았거나 데이터가 없습니다.'}
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
  indicatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 1,
    marginBottom: 16,
  },
  indicatorLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dotContainer: { position: 'relative', width: 12, height: 12, marginRight: 8 },
  dotCore: { width: 12, height: 12, backgroundColor: '#22C55E', borderRadius: 6, position: 'absolute' },
  dotPing: { width: 12, height: 12, backgroundColor: '#22C55E', borderRadius: 6, position: 'absolute' },
  indicatorText: { fontSize: 16, fontWeight: '500', color: '#111827' },
  indicatorTime: { fontSize: 14, color: '#6B7280' },
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
