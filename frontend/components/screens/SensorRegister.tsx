import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, Platform, StatusBar, ActivityIndicator, KeyboardAvoidingView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import {
  ArrowLeft, Wifi, WifiOff, Cpu, Check, Droplets, Timer, Minus, Plus,
} from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

const mockUnlinkedDevices = [
  { deviceId: 'AA:BB:CC:DD:EE:01', active: true },
  { deviceId: 'AA:BB:CC:DD:EE:02', active: true },
  { deviceId: 'AA:BB:CC:DD:EE:03', active: true },
];

const mockPlants = [
  { id: 1, nickname: '몬스테라', species: 'Monstera Deliciosa' },
  { id: 2, nickname: '산세베리아', species: 'Sansevieria trifasciata' },
  { id: 3, nickname: '보스턴 고사리', species: 'Nephrolepis exaltata' },
  { id: 4, nickname: '다육이 삼총사', species: 'Mixed Succulents' },
];

type Step = 'wifi' | 'select-device' | 'name-device' | 'link-plant' | 'settings' | 'complete';
type WifiStatus = 'checking' | 'connected' | 'disconnected';

export function SensorRegister() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'SensorRegister'>>();
  const plantId = route.params?.plantId ?? null;
  const [step, setStep] = useState<Step>('wifi');
  const [isScanning, setIsScanning] = useState(false);
  const [wifiStatus, setWifiStatus] = useState<WifiStatus>('checking');
  const [selectedDevice, setSelectedDevice] = useState<typeof mockUnlinkedDevices[0] | null>(null);
  const [deviceName, setDeviceName] = useState('');
  const [selectedPlant, setSelectedPlant] = useState<typeof mockPlants[0] | null>(null);
  const [threshold, setThreshold] = useState(30);
  const [duration, setDuration] = useState(3000);

  const steps: Step[] = ['wifi', 'select-device', 'name-device', 'link-plant', 'settings', 'complete'];
  const progress = ((steps.indexOf(step) + 1) / steps.length) * 100;

  useEffect(() => {
    if (plantId) {
      const found = mockPlants.find((p) => p.id.toString() === plantId);
      if (found) setSelectedPlant(found);
    }
  }, [plantId]);

  useEffect(() => {
    if (step === 'wifi') {
      setWifiStatus('checking');
      const t = setTimeout(() => setWifiStatus('connected'), 1500);
      return () => clearTimeout(t);
    }
  }, [step]);

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => { setIsScanning(false); setStep('select-device'); }, 2000);
  };

  const handleComplete = () => {
    navigation.navigate('SensorDashboard');
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

      {/* AppBar */}
      <View style={styles.appBar}>
        <TouchableOpacity style={styles.iconButton} onPress={goBack}>
          <ArrowLeft color="#374151" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>기기 등록</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` as any }]} />
      </View>

      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>

          {/* STEP: wifi */}
          {step === 'wifi' && (
            <View style={styles.stepContainer}>
              <View style={styles.stepIconCircle}>
                <Wifi color="#3a7d44" size={48} />
              </View>
              <Text style={styles.stepTitle}>Wi-Fi 연결 확인</Text>
              <Text style={styles.stepDesc}>기기를 등록하려면 스마트폰이 2.4GHz Wi-Fi에 연결되어 있어야 합니다.</Text>

              <View style={styles.wifiStatusCard}>
                {wifiStatus === 'checking' && (
                  <View style={styles.statusRow}>
                    <ActivityIndicator size="small" color="#9CA3AF" />
                    <Text style={styles.statusText}>네트워크 확인 중...</Text>
                  </View>
                )}
                {wifiStatus === 'connected' && (
                  <View style={styles.statusRow}>
                    <Wifi color="#10B981" size={20} />
                    <Text style={styles.statusTextSuccess}>Home_WiFi_2.4G 연결됨</Text>
                  </View>
                )}
                {wifiStatus === 'disconnected' && (
                  <View style={styles.statusRow}>
                    <WifiOff color="#EF4444" size={20} />
                    <Text style={styles.statusTextError}>Wi-Fi에 연결되어 있지 않습니다</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, (wifiStatus !== 'connected' || isScanning) && styles.buttonDisabled]}
                disabled={wifiStatus !== 'connected' || isScanning}
                onPress={handleScan}
              >
                {isScanning ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>주변 기기 스캔하기</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* STEP: select-device */}
          {step === 'select-device' && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitleLeft}>등록할 기기 선택</Text>
              <Text style={styles.stepDescLeft}>전원이 켜져 있고 파란색 불이 깜빡이는 기기를 선택하세요.</Text>
              <View style={styles.listContainer}>
                {mockUnlinkedDevices.map((device) => {
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
                          <Text style={[styles.itemTitle, isSelected && styles.itemTitleSelected]}>SPPKL Sensor</Text>
                          <Text style={styles.itemSubtitle}>{device.deviceId}</Text>
                        </View>
                      </View>
                      {isSelected && <Check color="#3a7d44" size={20} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity
                style={[styles.primaryButton, !selectedDevice && styles.buttonDisabled]}
                disabled={!selectedDevice}
                onPress={() => setStep('name-device')}
              >
                <Text style={styles.primaryButtonText}>다음</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP: name-device */}
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
              </View>
              <TouchableOpacity
                style={[styles.primaryButton, !deviceName.trim() && styles.buttonDisabled]}
                disabled={!deviceName.trim()}
                onPress={() => setStep('link-plant')}
              >
                <Text style={styles.primaryButtonText}>다음</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP: link-plant */}
          {step === 'link-plant' && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitleLeft}>식물 연결</Text>
              <Text style={styles.stepDescLeft}>이 센서가 관리할 식물을 선택해주세요.</Text>
              <View style={styles.listContainer}>
                {mockPlants.map((plant) => {
                  const isSelected = selectedPlant?.id === plant.id;
                  return (
                    <TouchableOpacity
                      key={plant.id}
                      style={[styles.listItem, isSelected && styles.listItemSelected]}
                      onPress={() => setSelectedPlant(plant)}
                    >
                      <View style={styles.listItemLeft}>
                        <View style={[styles.itemIconCircle, isSelected && styles.itemIconCircleSelected]}>
                          <Text style={styles.emojiText}>🌱</Text>
                        </View>
                        <View>
                          <Text style={[styles.itemTitle, isSelected && styles.itemTitleSelected]}>{plant.nickname}</Text>
                          <Text style={styles.itemSubtitle}>{plant.species}</Text>
                        </View>
                      </View>
                      {isSelected && <Check color="#3a7d44" size={20} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity
                style={[styles.primaryButton, !selectedPlant && styles.buttonDisabled]}
                disabled={!selectedPlant}
                onPress={() => setStep('settings')}
              >
                <Text style={styles.primaryButtonText}>다음</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP: settings — @react-native-community/slider 사용 */}
          {step === 'settings' && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitleLeft}>센서 세부 설정</Text>
              <Text style={styles.stepDescLeft}>자동 물주기를 위한 기준값을 설정합니다.</Text>

              {/* Threshold Slider */}
              <View style={styles.settingCard}>
                <View style={styles.settingHeader}>
                  <View style={styles.settingHeaderLeft}>
                    <Droplets color="#3B82F6" size={20} />
                    <Text style={styles.settingTitle}>수분 임계값</Text>
                  </View>
                  <Text style={styles.settingValue}>{threshold}%</Text>
                </View>
                <Text style={styles.settingHint}>토양 수분이 이 수치 이하로 떨어지면 펌프가 가동됩니다.</Text>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={10}
                  maximumValue={80}
                  step={5}
                  value={threshold}
                  onValueChange={(v) => setThreshold(Math.round(v))}
                  minimumTrackTintColor="#3B82F6"
                  maximumTrackTintColor="#F3F4F6"
                  thumbTintColor="#3B82F6"
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>10%</Text>
                  <Text style={styles.sliderLabel}>80%</Text>
                </View>
              </View>

              {/* Duration Slider */}
              <View style={styles.settingCard}>
                <View style={styles.settingHeader}>
                  <View style={styles.settingHeaderLeft}>
                    <Timer color="#F59E0B" size={20} />
                    <Text style={styles.settingTitle}>펌프 가동 시간</Text>
                  </View>
                  <Text style={styles.settingValue}>{(duration / 1000).toFixed(1)}초</Text>
                </View>
                <Text style={styles.settingHint}>1회 작동 시 물을 공급할 시간입니다.</Text>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={1000}
                  maximumValue={10000}
                  step={500}
                  value={duration}
                  onValueChange={(v) => setDuration(Math.round(v))}
                  minimumTrackTintColor="#F59E0B"
                  maximumTrackTintColor="#F3F4F6"
                  thumbTintColor="#F59E0B"
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>1.0초</Text>
                  <Text style={styles.sliderLabel}>10.0초</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={() => setStep('complete')}>
                <Text style={styles.primaryButtonText}>설정 완료</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP: complete */}
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
                  { label: '기기 ID',      value: selectedDevice?.deviceId ?? '-' },
                  { label: '기기 별명',    value: deviceName },
                  { label: '연결 식물',    value: selectedPlant?.nickname ?? '-' },
                  { label: '수분 임계값',  value: `${threshold}%` },
                  { label: '펌프 가동',    value: `${(duration / 1000).toFixed(1)}초` },
                ].map((row) => (
                  <View key={row.label} style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{row.label}</Text>
                    <Text style={styles.summaryValue}>{row.value}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={handleComplete}>
                <Text style={styles.primaryButtonText}>센서 대시보드로 이동</Text>
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
  wifiStatusCard: {
    width: '100%', backgroundColor: '#ffffff', padding: 20,
    borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 32,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  statusText: { fontSize: 15, color: '#6B7280', fontWeight: '500' },
  statusTextSuccess: { fontSize: 15, color: '#059669', fontWeight: '600' },
  statusTextError: { fontSize: 15, color: '#DC2626', fontWeight: '600' },
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
  },
  itemIconCircleSelected: { backgroundColor: '#ffffff' },
  emojiText: { fontSize: 18 },
  itemTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 4 },
  itemTitleSelected: { color: '#111827' },
  itemSubtitle: { fontSize: 12, color: '#9CA3AF' },
  inputWrapper: { width: '100%', marginBottom: 32 },
  textInput: {
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#D1D5DB',
    borderRadius: 16, paddingHorizontal: 16, height: 56, fontSize: 16, color: '#111827',
  },
  settingCard: {
    width: '100%', backgroundColor: '#ffffff', borderRadius: 20,
    padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB',
  },
  settingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  settingHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  settingValue: { fontSize: 18, fontWeight: '800', color: '#111827' },
  settingHint: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  sliderLabel: { fontSize: 12, color: '#9CA3AF' },
  summaryCard: {
    width: '100%', backgroundColor: '#ffffff', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 32, gap: 12,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14, color: '#6B7280' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  primaryButton: {
    width: '100%', height: 56, backgroundColor: '#2d5a27',
    borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  buttonDisabled: { backgroundColor: '#9CA3AF' },
  primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
