import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
  Platform, StatusBar, LayoutAnimation, UIManager, ActivityIndicator, Alert,
} from 'react-native';
import {
  ArrowLeft, Cpu, Plus, ChevronRight, ChevronDown, Power, AlertCircle,
  Droplets, Timer,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import {
  sensorApi,
  plantApi,
  getUserId,
  SensorDeviceInfo,
  MyPlantItem,
} from '../../services/api';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function formatDate(iso?: string) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export function SensorDevices() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [devices, setDevices] = useState<SensorDeviceInfo[]>([]);
  const [plantMap, setPlantMap] = useState<Map<number, MyPlantItem>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const userId = getUserId();
        if (userId == null) {
          if (!cancelled) {
            setError('로그인이 필요합니다.');
            setIsLoading(false);
          }
          return;
        }
        const [devicesList, plantsList] = await Promise.all([
          sensorApi.getMyDevices(String(userId)),
          plantApi.getMyPlants(userId).catch(() => [] as MyPlantItem[]),
        ]);
        if (cancelled) return;
        const map = new Map<number, MyPlantItem>(plantsList.map((p) => [p.myPlantId, p]));
        setDevices(devicesList);
        setPlantMap(map);
        if (devicesList.length > 0) setExpanded(devicesList[0].deviceId);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '디바이스 목록을 불러오지 못했어요.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(expanded === id ? null : id);
    setConfirmId(null);
  };

  const remove = async (deviceId: string) => {
    try {
      await sensorApi.unlinkDevice(deviceId);
      setDevices((prev) => prev.filter((d) => d.deviceId !== deviceId));
      setConfirmId(null);
    } catch (e) {
      Alert.alert('오류', e instanceof Error ? e.message : '연결 해제에 실패했어요.');
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={s.appBar}>
        <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#374151" size={24} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>기기 관리</Text>
        <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('SensorRegister')}>
          <Plus color="#3a7d44" size={24} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={s.centerBox}>
          <ActivityIndicator size="large" color="#3a7d44" />
        </View>
      ) : error && devices.length === 0 ? (
        <View style={s.centerBox}>
          <Text style={s.emptyText}>{error}</Text>
        </View>
      ) : devices.length === 0 ? (
        <View style={s.centerBox}>
          <Cpu color="#9CA3AF" size={48} />
          <Text style={s.emptyTitle}>연결된 디바이스가 없어요</Text>
          <Text style={s.emptyText}>ESP32 센서를 등록하고 식물과 연결해보세요.</Text>
          <TouchableOpacity style={s.registerBtn} onPress={() => navigation.navigate('SensorRegister')}>
            <Plus color="#ffffff" size={16} />
            <Text style={s.registerBtnText}>디바이스 등록하기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={s.container} contentContainerStyle={s.scroll}>
          {devices.map((d) => {
            const isExp = expanded === d.deviceId;
            const isConf = confirmId === d.deviceId;
            const isOnline = !!d.active;
            const plant = d.plantId != null ? plantMap.get(d.plantId) : null;
            const displayName = d.deviceName || d.deviceId;
            return (
              <View key={d.deviceId} style={[s.card, isExp && s.cardExp]}>
                <TouchableOpacity style={s.cardHeader} onPress={() => toggle(d.deviceId)} activeOpacity={0.7}>
                  <View style={s.headerLeft}>
                    <View style={[s.statusDot, { backgroundColor: isOnline ? '#10B981' : '#D1D5DB' }]} />
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={s.nickname}>{displayName}</Text>
                        <View style={isOnline ? s.onlineBadge : s.offlineBadge}>
                          <Text style={isOnline ? s.onlineBadgeText : s.offlineBadgeText}>
                            {isOnline ? '온라인' : '오프라인'}
                          </Text>
                        </View>
                      </View>
                      <Text style={s.mac}>{d.deviceId}</Text>
                    </View>
                  </View>
                  {isExp ? <ChevronDown size={20} color="#9CA3AF" /> : <ChevronRight size={20} color="#9CA3AF" />}
                </TouchableOpacity>
                {isExp && (
                  <View style={s.expandedContent}>
                    <View style={s.statsRow}>
                      <View style={s.statBox}>
                        <Droplets size={16} color="#3B82F6" />
                        <Text style={s.statLabel}>임계값</Text>
                        <Text style={s.statValue}>{d.threshold != null ? `${d.threshold}%` : '-'}</Text>
                      </View>
                      <View style={s.statBox}>
                        <Timer size={16} color="#F59E0B" />
                        <Text style={s.statLabel}>가동시간</Text>
                        <Text style={s.statValue}>
                          {d.duration != null ? `${(d.duration / 1000).toFixed(1)}초` : '-'}
                        </Text>
                      </View>
                      <View style={s.statBox}>
                        <Power size={16} color={isOnline ? '#10B981' : '#9CA3AF'} />
                        <Text style={s.statLabel}>상태</Text>
                        <Text style={s.statValue}>{isOnline ? '활성' : '비활성'}</Text>
                      </View>
                    </View>
                    <View style={s.infoList}>
                      <View style={s.infoRow}>
                        <Text style={s.infoLabel}>연결된 식물</Text>
                        <Text style={s.infoValue}>
                          {plant ? `${plant.nickname} (${plant.plantName})` :
                           d.plantId != null ? `#${d.plantId}` : '연결되지 않음'}
                        </Text>
                      </View>
                      <View style={s.infoRow}>
                        <Text style={s.infoLabel}>등록일</Text>
                        <Text style={s.infoValue}>{formatDate(d.createdAt)}</Text>
                      </View>
                      <View style={s.infoRow}>
                        <Text style={s.infoLabel}>최종 업데이트</Text>
                        <Text style={s.infoValue}>{formatDate(d.updatedAt)}</Text>
                      </View>
                    </View>
                    {isConf ? (
                      <View style={s.confirmBox}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <AlertCircle size={16} color="#EF4444" />
                          <Text style={s.confirmText}>식물 연결을 해제하시겠습니까?</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity style={s.cancelBtn} onPress={() => setConfirmId(null)}>
                            <Text style={s.cancelBtnText}>취소</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={s.removeBtn} onPress={() => remove(d.deviceId)}>
                            <Text style={s.removeBtnText}>연결 해제</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity style={s.initRemoveBtn} onPress={() => setConfirmId(d.deviceId)}>
                        <Power size={16} color="#EF4444" style={{ marginRight: 8 }} />
                        <Text style={s.initRemoveText}>기기 연결 해제</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  appBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  iconBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 16, paddingBottom: 40 },
  centerBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24, gap: 12, backgroundColor: '#F9FAFB',
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 4 },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  registerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 12, marginTop: 12,
    backgroundColor: '#2d5a27', borderRadius: 12,
  },
  registerBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  card: {
    backgroundColor: '#ffffff', borderRadius: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden',
  },
  cardExp: { borderColor: '#7CCB8A', elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  nickname: { fontSize: 16, fontWeight: '700', color: '#111827' },
  onlineBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  onlineBadgeText: { fontSize: 10, fontWeight: '600', color: '#059669' },
  offlineBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  offlineBadgeText: { fontSize: 10, fontWeight: '600', color: '#6B7280' },
  mac: { fontSize: 12, color: '#9CA3AF', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  expandedContent: { paddingHorizontal: 16, paddingBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 4 },
  statBox: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 2, marginTop: 4 },
  statValue: { fontSize: 14, fontWeight: '700', color: '#111827' },
  infoList: { gap: 16, marginVertical: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  infoLabel: { fontSize: 14, color: '#6B7280' },
  infoValue: { fontSize: 14, fontWeight: '500', color: '#111827', flexShrink: 1, textAlign: 'right', marginLeft: 8 },
  confirmBox: { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#FECACA' },
  confirmText: { fontSize: 14, fontWeight: '600', color: '#991B1B' },
  cancelBtn: { flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  removeBtn: { flex: 1, backgroundColor: '#EF4444', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  removeBtnText: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
  initRemoveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingVertical: 14,
  },
  initRemoveText: { fontSize: 14, fontWeight: '600', color: '#EF4444' },
});
