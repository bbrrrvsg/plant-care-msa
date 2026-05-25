import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, Platform, StatusBar, ActivityIndicator, KeyboardAvoidingView,
  Alert, Image,
} from 'react-native';
import { ArrowLeft, Cpu, Check, RefreshCw } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import {
  sensorApi,
  plantApi,
  getUserId,
  SensorDeviceInfo,
  MyPlantItem,
} from '../../services/api';

type Step = 'select-device' | 'name-device' | 'link-plant' | 'complete';
const steps: Step[] = ['select-device', 'name-device', 'link-plant', 'complete'];

export function SensorRegister() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'SensorRegister'>>();
  const plantId = route.params?.plantId ?? null;

  const [step, setStep] = useState<Step>('select-device');

  const [unlinkedDevices, setUnlinkedDevices] = useState<SensorDeviceInfo[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [devicesError, setDevicesError] = useState<string | null>(null);

  const [selectedDevice, setSelectedDevice] = useState<SensorDeviceInfo | null>(null);
  const [deviceName, setDeviceName] = useState('');

  const [plants, setPlants] = useState<MyPlantItem[]>([]);
  const [plantsLoading, setPlantsLoading] = useState(false);
  const [plantsError, setPlantsError] = useState<string | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<MyPlantItem | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const progress = ((steps.indexOf(step) + 1) / steps.length) * 100;

  const loadUnlinkedDevices = useCallback(async () => {
    setDevicesLoading(true);
    setDevicesError(null);
    try {
      const list = await sensorApi.getUnlinkedDevices();
      setUnlinkedDevices(list);
    } catch (e) {
      setDevicesError(e instanceof Error ? e.message : '디바이스 목록을 불러오지 못했어요.');
    } finally {
      setDevicesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUnlinkedDevices();
  }, [loadUnlinkedDevices]);

  useEffect(() => {
    if (step !== 'link-plant') return;
    let cancelled = false;
    (async () => {
      try {
        setPlantsLoading(true);
        setPlantsError(null);
        const userId = getUserId();
        if (userId == null) {
          if (!cancelled) {
            setPlantsError('로그인이 필요합니다.');
            setPlantsLoading(false);
          }
          return;
        }
        const data = await plantApi.getMyPlants(userId);
        if (!cancelled) {
          setPlants(data);
          if (plantId) {
            const found = data.find((p) => String(p.myPlantId) === plantId);
            if (found) setSelectedPlant(found);
          }
          setPlantsLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setPlantsError(e instanceof Error ? e.message : '식물 목록을 불러오지 못했어요.');
          setPlantsLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [step, plantId]);

  const handleSubmit = async () => {
    if (!selectedDevice || !selectedPlant) return;

    const userId = getUserId();
    if (userId == null) {
      Alert.alert('오류', '로그인 정보를 찾을 수 없어요.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (deviceName.trim()) {
        await sensorApi.updateDeviceName(selectedDevice.deviceId, deviceName.trim());
      }

      await sensorApi.linkDevice(selectedDevice.deviceId, {
        plantId: selectedPlant.myPlantId,
        userId: String(userId),
        deviceName: deviceName.trim() || selectedDevice.deviceId,
        speciesCode: selectedPlant.speciesCode
          ? Number(selectedPlant.speciesCode)
          : undefined,
      });

      setStep('complete');
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : '디바이스 연결에 실패했어요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = () => {
    if (selectedPlant) {
      navigation.navigate('SensorDashboard', { plantId: selectedPlant.myPlantId });
    } else {
      navigation.goBack();
    }
  };

  const goBack = () => {
    const idx = steps.indexOf(step);
    if (idx === 0) {
      navigation.goBack();
    } else {
      setStep(steps[idx - 1]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.appBar}>
        <TouchableOpacity style={styles.iconButton} onPress={goBack}>
          <ArrowLeft color="#374151" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>기기 등록</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` as any }]} />
      </View>

      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>

          {step === 'select-device' && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitleLeft}>등록할 기기 선택</Text>
              <Text style={styles.stepDescLeft}>전원이 켜져 있는 ESP32 기기 중에서 등록할 디바이스를 선택하세요.</Text>

              {devicesLoading ? (
                <View style={styles.centerBox}>
                  <ActivityIndicator size="large" color="#3a7d44" />
                </View>
              ) : devicesError && unlinkedDevices.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>{devicesError}</Text>
                  <TouchableOpacity style={styles.outlineButton} onPress={loadUnlinkedDevices}>
                    <RefreshCw color="#3a7d44" size={16} />
                    <Text style={styles.outlineButtonText}>다시 시도</Text>
                  </TouchableOpacity>
                </View>
              ) : unlinkedDevices.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>주변에 등록 대기 중인 디바이스가 없어요.{'\n'}ESP32 전원을 켜고 잠시 기다려주세요.</Text>
                  <TouchableOpacity style={styles.outlineButton} onPress={loadUnlinkedDevices}>
                    <RefreshCw color="#3a7d44" size={16} />
                    <Text style={styles.outlineButtonText}>새로고침</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.listContainer}>
                  {unlinkedDevices.map((device) => {
                    const isSelected = selectedDevice?.deviceId === device.deviceId;
                    return (
                      <TouchableOpacity
                        key={device.deviceId}
                        style={[styles.listItem, isSelected && styles.listItemSelected]}
                        onPress={() => setSelectedDevice(device)}
                      >
                        <View style={styles.listItemLeft}>
                          <View style={[styles.itemIconCircle, isSelected && styles.itemIconCircleSelected]}>
                            <Cpu color={isSelected ? '#3a7d44' : '#6B7280'} size={20} />
                          </View>
                          <View>
                            <Text style={[styles.itemTitle, isSelected && styles.itemTitleSelected]}>
                              {device.deviceName || 'SPPKL Sensor'}
                            </Text>
                            <Text style={styles.itemSubtitle}>{device.deviceId}</Text>
                          </View>
                        </View>
                        {isSelected && <Check color="#3a7d44" size={20} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <TouchableOpacity
                style={[styles.primaryButton, !selectedDevice && styles.buttonDisabled]}
                disabled={!selectedDevice}
                onPress={() => setStep('name-device')}
              >
                <Text style={styles.primaryButtonText}>다음</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'name-device' && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitleLeft}>기기 이름 설정</Text>
              <Text style={styles.stepDescLeft}>센서를 쉽게 구분할 수 있는 이름을 지어주세요.</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder="예: 거실 몬스테라 센서"
                  placeholderTextColor="#9CA3AF"
                  value={deviceName}
                  onChangeText={setDeviceName}
                  autoFocus
                />
                <Text style={styles.inputHint}>비워두면 기기 ID로 자동 설정됩니다.</Text>
              </View>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setStep('link-plant')}
              >
                <Text style={styles.primaryButtonText}>다음</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'link-plant' && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitleLeft}>식물 연결</Text>
              <Text style={styles.stepDescLeft}>이 센서가 관리할 식물을 선택해주세요.</Text>

              {plantsLoading ? (
                <View style={styles.centerBox}>
                  <ActivityIndicator size="large" color="#3a7d44" />
                </View>
              ) : plantsError ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>{plantsError}</Text>
                </View>
              ) : plants.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>등록된 식물이 없어요.{'\n'}먼저 식물을 등록해주세요.</Text>
                  <TouchableOpacity
                    style={styles.outlineButton}
                    onPress={() => navigation.navigate('AddPlant')}
                  >
                    <Text style={styles.outlineButtonText}>식물 등록하기</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.listContainer}>
                  {plants.map((plant) => {
                    const isSelected = selectedPlant?.myPlantId === plant.myPlantId;
                    return (
                      <TouchableOpacity
                        key={plant.myPlantId}
                        style={[styles.listItem, isSelected && styles.listItemSelected]}
                        onPress={() => setSelectedPlant(plant)}
                      >
                        <View style={styles.listItemLeft}>
                          <View style={[styles.itemIconCircle, isSelected && styles.itemIconCircleSelected]}>
                            {plant.imageUrl ? (
                              <Image source={{ uri: plant.imageUrl }} style={styles.plantThumb} />
                            ) : (
                              <Text style={styles.emojiText}>🌱</Text>
                            )}
                          </View>
                          <View>
                            <Text style={[styles.itemTitle, isSelected && styles.itemTitleSelected]}>
                              {plant.nickname}
                            </Text>
                            <Text style={styles.itemSubtitle}>{plant.plantName}</Text>
                          </View>
                        </View>
                        {isSelected && <Check color="#3a7d44" size={20} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {submitError && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{submitError}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.primaryButton, (!selectedPlant || isSubmitting) && styles.buttonDisabled]}
                disabled={!selectedPlant || isSubmitting}
                onPress={handleSubmit}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>디바이스 연결</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {step === 'complete' && (
            <View style={styles.stepContainer}>
              <View style={styles.stepIconCircle}>
                <Check color="#3a7d44" size={48} />
              </View>
              <Text style={styles.stepTitle}>기기 등록 완료!</Text>
              <Text style={styles.stepDesc}>
                센서가 <Text style={{ fontWeight: '700' }}>{selectedPlant?.nickname}</Text>에 성공적으로 연결되었습니다.
              </Text>

              <View style={styles.summaryCard}>
                {[
                  { label: '기기 ID',   value: selectedDevice?.deviceId ?? '-' },
                  { label: '기기 별명', value: deviceName.trim() || '(기본값)' },
                  { label: '연결 식물', value: selectedPlant?.nickname ?? '-' },
                ].map((row) => (
                  <View key={row.label} style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{row.label}</Text>
                    <Text style={styles.summaryValue}>{row.value}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.autoNote}>물주기 설정은 식물 도감을 바탕으로 자동 설정되었어요.</Text>

              <TouchableOpacity style={styles.primaryButton} onPress={handleComplete}>
                <Text style={styles.primaryButtonText}>센서 대시보드로 이동</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.outlineButton, { marginTop: 12 }]}
                onPress={() => navigation.navigate('SensorDevices')}
              >
                <Text style={styles.outlineButtonText}>기기 관리로 이동</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  flex1: { flex: 1 },
  appBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  iconButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  progressContainer: { height: 4, backgroundColor: '#F3F4F6', width: '100%' },
  progressBar: { height: '100%', backgroundColor: '#3a7d44' },
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 24, paddingBottom: 40 },
  stepContainer: { flex: 1, alignItems: 'center' },
  stepIconCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center',
    marginBottom: 24, marginTop: 40,
  },
  stepTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 12, textAlign: 'center' },
  stepDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 32, paddingHorizontal: 20 },
  stepTitleLeft: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8, alignSelf: 'flex-start' },
  stepDescLeft: { fontSize: 14, color: '#6B7280', marginBottom: 24, alignSelf: 'flex-start' },
  centerBox: { width: '100%', paddingVertical: 48, alignItems: 'center', marginBottom: 32 },
  emptyBox: {
    width: '100%', backgroundColor: '#ffffff', borderRadius: 16,
    borderWidth: 1, borderColor: '#E5E7EB', padding: 24,
    alignItems: 'center', gap: 16, marginBottom: 32,
  },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  outlineButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: '#7CCB8A', borderRadius: 12, backgroundColor: '#F0FDF4',
  },
  outlineButtonText: { fontSize: 14, fontWeight: '600', color: '#3a7d44' },
  listContainer: { width: '100%', gap: 12, marginBottom: 32 },
  listItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#ffffff', padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  listItemSelected: { borderColor: '#7CCB8A', backgroundColor: '#F0FDF4' },
  listItemLeft: { flexDirection: 'row', alignItems: 'center' },
  itemIconCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 16,
    overflow: 'hidden',
  },
  itemIconCircleSelected: { backgroundColor: '#ffffff' },
  plantThumb: { width: '100%', height: '100%' },
  emojiText: { fontSize: 18 },
  itemTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 4 },
  itemTitleSelected: { color: '#111827' },
  itemSubtitle: { fontSize: 12, color: '#9CA3AF' },
  inputWrapper: { width: '100%', marginBottom: 32 },
  textInput: {
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#D1D5DB',
    borderRadius: 16, paddingHorizontal: 16, height: 56, fontSize: 16, color: '#111827',
  },
  inputHint: { fontSize: 12, color: '#9CA3AF', marginTop: 8, marginLeft: 4 },
  summaryCard: {
    width: '100%', backgroundColor: '#ffffff', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16, gap: 12,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14, color: '#6B7280' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  autoNote: { fontSize: 12, color: '#6B7280', textAlign: 'center', marginBottom: 24, paddingHorizontal: 12 },
  errorBox: {
    width: '100%', backgroundColor: '#FEF2F2', borderRadius: 12,
    borderWidth: 1, borderColor: '#FECACA', padding: 12, marginBottom: 16,
  },
  errorText: { fontSize: 13, color: '#991B1B' },
  primaryButton: {
    width: '100%', height: 56, backgroundColor: '#2d5a27',
    borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  buttonDisabled: { backgroundColor: '#9CA3AF' },
  primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
