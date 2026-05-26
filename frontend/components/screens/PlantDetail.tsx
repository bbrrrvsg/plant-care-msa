import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
  Dimensions, Platform, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { ChevronLeft, MoreVertical, Droplets, Sun, Thermometer, Calendar, PlusCircle, Settings, Heart } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { plantApi, sensorApi, growthLogApi, MyPlantItem, SensorData, GrowthLogItem, getUserId } from '../../services/api';
import { getMoistureStatus, getTempStatus, getIlluminanceStatus } from '../../lib/sensorHelpers';
import { Colors } from '../../theme';

const { width } = Dimensions.get('window');
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800';

const SensorWidget = ({ label, value, icon, status }: any) => (
  <View style={s.sensorWidget}>
    {icon}
    <Text style={s.sensorValue}>{value}</Text>
    <Text style={s.sensorLabel}>{label}</Text>
    <View style={s.statusTag}><Text style={s.statusTagText}>{status}</Text></View>
  </View>
);

const computeDayCount = (dateStr?: string) => {
  if (!dateStr) return 'D+0';
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  return `D+${Math.max(0, days)}`;
};

const formatLastWatered = (dateStr?: string) => {
  if (!dateStr) return '기록 없음';
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return '오늘';
  if (days === 1) return '어제';
  return `${days}일 전`;
};

const formatLogDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd}`;
  } catch {
    return dateStr;
  }
};

const getRecentPlantLogs = (allLogs: GrowthLogItem[], plantId: number) =>
  allLogs
    .filter((log) => log.plantId === plantId)
    .sort((a, b) => {
      const ta = a.createDate ? new Date(a.createDate).getTime() : 0;
      const tb = b.createDate ? new Date(b.createDate).getTime() : 0;
      return tb - ta;
    })
    .slice(0, 3);

export function PlantDetail() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'PlantDetail'>>();
  const { plantId } = route.params;

  const [plant, setPlant] = useState<MyPlantItem | null>(null);
  const [sensor, setSensor] = useState<SensorData | null>(null);
  const [logs, setLogs] = useState<GrowthLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWatering, setIsWatering] = useState(false);

  const handleWaterPress = async () => {
    if (isWatering) return;
    try {
      setIsWatering(true);
      await sensorApi.requestPump(plantId);
      Alert.alert('물주기 요청 전송', '곧 펌프가 작동합니다. (최대 약 5초 지연)');
    } catch (e) {
      Alert.alert('물주기 실패', e instanceof Error ? e.message : '요청을 전송하지 못했어요.');
    } finally {
      setIsWatering(false);
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userId = getUserId();

      const [plantData, sensorData, allLogs] = await Promise.all([
        plantApi.getById(plantId),
        sensorApi.getLatest(plantId).catch(() => null),
        userId != null
          ? growthLogApi.getMyLogs(userId).catch(() => [] as GrowthLogItem[])
          : Promise.resolve([] as GrowthLogItem[]),
      ]);

      setPlant(plantData);
      setSensor(sensorData);
      setLogs(getRecentPlantLogs(allLogs, plantId));
    } catch (e) {
      setError(e instanceof Error ? e.message : '식물 정보를 불러오지 못했어요.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const userId = getUserId();

        const [plantData, sensorData, allLogs] = await Promise.all([
          plantApi.getById(plantId),
          sensorApi.getLatest(plantId).catch(() => null),
          userId != null
            ? growthLogApi.getMyLogs(userId).catch(() => [] as GrowthLogItem[])
            : Promise.resolve([] as GrowthLogItem[]),
        ]);

        const plantLogs = getRecentPlantLogs(allLogs, plantId);

        if (!cancelled) {
          setPlant(plantData);
          setSensor(sensorData);
          setLogs(plantLogs);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '식물 정보를 불러오지 못했어요.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [plantId]);

  if (isLoading) {
    return (
      <SafeAreaView style={[s.safe, s.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (error && !plant) {
    return (
      <SafeAreaView style={[s.safe, s.centered]}>
        <Text style={s.errorText}>{error}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={loadData}>
          <Text style={s.retryBtnText}>다시 시도</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!plant) return null;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" />
      <View style={s.header}>
        <TouchableOpacity style={s.headerBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color="#ffffff" size={28} />
        </TouchableOpacity>
        <TouchableOpacity style={s.headerBtn}>
          <MoreVertical color="#ffffff" size={24} />
        </TouchableOpacity>
      </View>
      <ScrollView bounces={false} contentContainerStyle={{ backgroundColor: '#f5f5f0' }}>
        <View style={s.imageContainer}>
          <Image source={{ uri: plant.imageUrl || FALLBACK_IMAGE }} style={s.mainImage} />
          <View style={s.overlay} />
        </View>
        <View style={s.contentCard}>
          <View style={s.titleSection}>
            <View style={{ flex: 1 }}>
              <Text style={s.plantName}>{plant.nickname}</Text>
              <Text style={s.plantSpecies}>{plant.plantName}</Text>
            </View>
            <TouchableOpacity
              style={[s.actionBtn, isWatering && s.actionBtnDisabled]}
              onPress={handleWaterPress}
              disabled={isWatering}
            >
              {isWatering ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Droplets color="#ffffff" size={20} />
              )}
              <Text style={s.actionBtnText}>{isWatering ? '요청 중...' : '물주기'}</Text>
            </TouchableOpacity>
          </View>
          <View style={s.statusRow}>
            <View style={s.statusItem}>
              <Calendar color="#6B7280" size={18} />
              <Text style={s.statusText}>{computeDayCount(plant.registeredAt || plant.createdAt)}</Text>
            </View>
            <View style={s.statusItem}>
              <Droplets color="#3B82F6" size={18} />
              <Text style={s.statusText}>{formatLastWatered(plant.lastWatered)}</Text>
            </View>
          </View>
          <View style={s.sectionContainer}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>실시간 상태</Text>
              <TouchableOpacity onPress={() => navigation.navigate('SensorDashboard', { plantId })}>
                <Text style={s.detailLink}>상세 보기</Text>
              </TouchableOpacity>
            </View>
            <View style={s.sensorGrid}>
              <SensorWidget
                label="토양 수분"
                value={sensor?.soilMoisture != null ? `${Math.round(sensor.soilMoisture)}%` : '-'}
                icon={<Droplets color="#3B82F6" size={24} />}
                status={getMoistureStatus(sensor?.soilMoisture)}
              />
              <SensorWidget
                label="주변 온도"
                value={sensor?.temperature != null ? `${Math.round(sensor.temperature)}°C` : '-'}
                icon={<Thermometer color="#EF4444" size={24} />}
                status={getTempStatus(sensor?.temperature)}
              />
              <SensorWidget
                label="조도"
                value={sensor?.illuminance != null ? `${Math.round(sensor.illuminance)} lux` : '-'}
                icon={<Sun color="#F59E0B" size={24} />}
                status={getIlluminanceStatus(sensor?.illuminance)}
              />
            </View>
          </View>
          <View style={s.sectionContainer}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>성장 일지</Text>
              <TouchableOpacity onPress={() => navigation.navigate('DiaryWrite', { plantId })}>
                <PlusCircle color="#3a7d44" size={24} />
              </TouchableOpacity>
            </View>

            {logs.length === 0 ? (
              <TouchableOpacity
                style={s.diaryEmptyCard}
                onPress={() => navigation.navigate('DiaryWrite', { plantId })}
              >
                <Text style={s.diaryEmptyText}>
                  아직 작성된 일지가 없어요{'\n'}첫 기록을 남겨보세요
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={{ gap: 10 }}>
                {logs.map((log) => (
                  <View key={log.logId} style={s.diaryCard}>
                    <View style={s.diaryHeader}>
                      <Text style={s.diaryDate}>
                        {formatLogDate(log.logDate || log.createDate)}
                      </Text>
                      {log.type && (
                        <View style={s.diaryTypeTag}>
                          <Text style={s.diaryTypeText}>{log.type}</Text>
                        </View>
                      )}
                    </View>
                    {log.title && <Text style={s.diaryTitle}>{log.title}</Text>}
                    <Text style={s.diaryContent} numberOfLines={2}>
                      {log.content}
                    </Text>
                  </View>
                ))}
                <TouchableOpacity
                  style={s.diaryMoreBtn}
                  onPress={() => navigation.navigate('MainTabs', { screen: 'Diary' })}
                >
                  <Text style={s.diaryMoreText}>전체 일지 보기</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <TouchableOpacity style={s.secondaryBtn} onPress={() => navigation.navigate('SensorRegister')}>
            <Settings color="#374151" size={20} />
            <Text style={s.secondaryBtnText}>센서 및 장치 설정</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.farewellBtn}
            onPress={() =>
              navigation.navigate('PlantFarewell', {
                plantId,
                nickname: plant.nickname,
                plantName: plant.plantName,
                imageUrl: plant.imageUrl,
                registeredAt: plant.registeredAt || plant.createdAt,
              })
            }
          >
            <Heart color="#9CA3AF" size={18} />
            <Text style={s.farewellBtnText}>이 식물을 떠나보내기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  centered: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  errorText: { fontSize: 14, color: Colors.errorText, textAlign: 'center', marginHorizontal: 24, marginBottom: 16 },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.primary, borderRadius: 10 },
  retryBtnText: { color: '#ffffff', fontWeight: '600' },
  header: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, zIndex: 10 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  imageContainer: { width, height: width * 0.8, position: 'relative' },
  mainImage: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.1)' },
  contentCard: { marginTop: -30, backgroundColor: '#f5f5f0', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 20, paddingTop: 32, paddingBottom: 40 },
  titleSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  plantName: { fontSize: 28, fontWeight: '800', color: '#111827' },
  plantSpecies: { fontSize: 16, color: '#6B7280', fontStyle: 'italic', marginTop: 4 },
  actionBtn: { flexDirection: 'row', backgroundColor: '#3a7d44', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, alignItems: 'center', gap: 6 },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
  statusRow: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  statusItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { fontSize: 14, color: '#4B5563', fontWeight: '500' },
  sectionContainer: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  detailLink: { color: '#3a7d44', fontSize: 14, fontWeight: '600' },
  sensorGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  sensorWidget: { flex: 1, backgroundColor: '#ffffff', borderRadius: 20, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  sensorValue: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 8 },
  sensorLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusTag: { marginTop: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: '#E8F5E9' },
  statusTagText: { fontSize: 10, fontWeight: '600', color: '#2E7D32' },
  diaryCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  diaryDate: { fontSize: 12, color: '#9CA3AF', marginBottom: 6 },
  diaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  diaryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  diaryTypeTag: {
    backgroundColor: 'rgba(124,203,138,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  diaryTypeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3a7d44',
  },
  diaryContent: { fontSize: 14, color: '#374151', lineHeight: 20 },
  diaryEmptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  diaryEmptyText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  diaryMoreBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  diaryMoreText: {
    fontSize: 13,
    color: '#3a7d44',
    fontWeight: '600',
  },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: '#D1D5DB', marginTop: 8 },
  secondaryBtnText: { fontSize: 14, color: '#374151', fontWeight: '600' },
  farewellBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', marginTop: 8, backgroundColor: '#FAFAFA' },
  farewellBtnText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
});
