import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image, ScrollView, StyleSheet,
  SafeAreaView, Platform, StatusBar, ActivityIndicator, Dimensions,
} from 'react-native';
import {
  ArrowLeft, X, Search, ScanLine, Check, Activity,
  Image as ImageIcon, RotateCcw, BookOpen, Sparkles,
} from 'lucide-react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../../App';

type AIDiagnosisNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'AIDiagnosis'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const { width } = Dimensions.get('window');

const recentSearches = [
  { id: 'r1', name: '몬스테라 델리시오사', time: '2시간 전 검색', image: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=200' },
  { id: 'r2', name: '올리브 나무',           time: '어제 검색',   image: 'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=200' },
  { id: 'r3', name: '칼라테아 오르비폴리아', time: '3일 전 검색', image: 'https://images.unsplash.com/photo-1632207691143-643e2a9a9361?w=200' },
];

type Step = 'entry' | 'scan' | 'analyzing' | 'identified' | 'health';

export function AIDiagnosis() {
  const navigation = useNavigation<AIDiagnosisNavigationProp>();
  const [step, setStep] = useState<Step>('entry');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (step === 'analyzing') {
      const t = setTimeout(() => setStep('identified'), 3000);
      return () => clearTimeout(t);
    }
  }, [step]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => navigation.navigate('Diary'), 1500);
  };

  return (
    <SafeAreaView style={[styles.safeArea, step === 'scan' && { backgroundColor: '#000' }]}>
      <StatusBar barStyle={step === 'scan' ? 'light-content' : 'dark-content'} />

      {/* AppBar */}
      <View style={[styles.appBar, step === 'scan' && { backgroundColor: '#000', borderBottomWidth: 0 }]}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => (step === 'entry' ? navigation.navigate('Home') : step === 'health' ? setStep('identified') : setStep('entry'))}
        >
          <ArrowLeft color={step === 'scan' ? '#ffffff' : '#374151'} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, step === 'scan' && { color: '#ffffff' }]}>
          {step === 'entry' ? 'AI 식물 진단' : step === 'scan' ? '식물 스캔' : step === 'analyzing' ? '분석 중' : '진단 결과'}
        </Text>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Home')}>
          <X color={step === 'scan' ? '#ffffff' : '#374151'} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>

        {/* Entry */}
        {step === 'entry' && (
          <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
            <View style={styles.searchBar}>
              <Search color="#9CA3AF" size={20} />
              <TextInput
                style={styles.searchInput}
                placeholder="식물 이름으로 검색해보세요"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.scanCard}>
              <View style={styles.scanCardHeader}>
                <View>
                  <Text style={styles.scanCardTitle}>식물을 촬영해보세요</Text>
                  <Text style={styles.scanCardDesc}>AI가 식물의 종류와 건강 상태를 분석해드려요</Text>
                </View>
                <View style={styles.scanIconCircle}><ScanLine color="#3a7d44" size={24} /></View>
              </View>
              <View style={styles.scanButtonRow}>
                <TouchableOpacity style={styles.primaryButton} onPress={() => setStep('scan')}>
                  <Text style={styles.primaryButtonText}>카메라로 스캔하기</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryIconButton}>
                  <ImageIcon color="#4B5563" size={20} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>최근 검색한 식물</Text>
                <TouchableOpacity><Text style={styles.clearText}>전체 삭제</Text></TouchableOpacity>
              </View>
              {recentSearches.map((item) => (
                <TouchableOpacity key={item.id} style={styles.recentItem}>
                  <Image source={{ uri: item.image }} style={styles.recentImage} />
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentName}>{item.name}</Text>
                    <Text style={styles.recentTime}>{item.time}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {/* Scan */}
        {step === 'scan' && (
          <View style={styles.scanContainer}>
            <View style={styles.cameraPlaceholder}>
              <View style={styles.targetFrame}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
                <ScanLine color="rgba(255,255,255,0.5)" size={48} />
              </View>
            </View>
            <View style={styles.cameraControls}>
              <Text style={styles.cameraHint}>식물이 프레임 안에 들어오게 맞춰주세요</Text>
              <TouchableOpacity style={styles.captureButton} onPress={() => setStep('analyzing')}>
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Analyzing */}
        {step === 'analyzing' && (
          <View style={styles.centerContainer}>
            <View style={styles.pulseCircle}><ScanLine color="#3a7d44" size={48} /></View>
            <Text style={styles.analyzingTitle}>식물 분석 중...</Text>
            <Text style={styles.analyzingDesc}>잎의 모양과 패턴을 확인하고 있습니다</Text>
            <ActivityIndicator size="large" color="#3a7d44" style={{ marginTop: 24 }} />
          </View>
        )}

        {/* Identified */}
        {step === 'identified' && (
          <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=800' }} style={styles.resultImage} />
            <View style={styles.resultCard}>
              <View style={styles.matchBadge}>
                <Sparkles color="#3a7d44" size={14} />
                <Text style={styles.matchText}>98% 일치</Text>
              </View>
              <Text style={styles.plantName}>몬스테라 델리시오사</Text>
              <Text style={styles.plantSpecies}>Monstera Deliciosa</Text>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}><Text style={styles.infoLabel}>관리 난이도</Text><Text style={styles.infoValue}>쉬움</Text></View>
                <View style={styles.infoDivider} />
                <View style={styles.infoItem}><Text style={styles.infoLabel}>빛 요구량</Text><Text style={styles.infoValue}>반양지</Text></View>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.outlineButton} onPress={() => setStep('scan')}>
                  <RotateCcw color="#4B5563" size={18} />
                  <Text style={styles.outlineButtonText}>다시 촬영</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.fillButton} onPress={() => setStep('health')}>
                  <Activity color="#ffffff" size={18} />
                  <Text style={styles.fillButtonText}>건강 상태 확인</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}

        {/* Health */}
        {step === 'health' && (
          <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
            <View style={styles.healthHeader}>
              <View style={styles.healthStatus}>
                <Text style={styles.healthTitle}>전반적인 상태: </Text>
                <Text style={styles.healthGood}>매우 건강함</Text>
              </View>
              <Text style={styles.healthDesc}>촬영된 몬스테라는 현재 아주 건강한 상태입니다. 새 잎이 돋아날 준비를 하고 있네요!</Text>
            </View>

            <View style={styles.checklist}>
              <Text style={styles.checklistTitle}>상세 진단 항목</Text>
              {[
                '잎이 선명한 초록색이며 변색이 없어요',
                '해충이나 질병의 징후가 보이지 않아요',
                '현재 물주기와 조명 관리를 유지하세요',
              ].map((text, i) => (
                <View key={i} style={styles.checkItem}>
                  <Check color="#7CCB8A" size={20} style={{ marginRight: 8 }} />
                  <Text style={styles.checkText}>{text}</Text>
                </View>
              ))}
            </View>

            <View style={styles.tipBox}>
              <Text style={styles.tipText}>
                <Text style={{ fontWeight: '700' }}>💡 팁: </Text>
                정기적인 모니터링은 문제를 조기에 발견하는 데 도움이 됩니다.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, saved && styles.saveButtonActive]}
              onPress={handleSave}
              disabled={saved}
            >
              {saved ? <Check color="#ffffff" size={20} /> : <BookOpen color="#ffffff" size={20} />}
              <Text style={styles.saveButtonText}>{saved ? '일지에 저장됨' : '이 진단 결과를 일지에 저장'}</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  appBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  iconButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  container: { flex: 1, backgroundColor: '#f5f5f0' },
  content: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 12, paddingHorizontal: 12, height: 48, marginBottom: 24, borderWidth: 1, borderColor: '#E5E7EB' },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#111827' },
  scanCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, marginBottom: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  scanCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  scanCardTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  scanCardDesc: { fontSize: 13, color: '#6B7280' },
  scanIconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  scanButtonRow: { flexDirection: 'row', gap: 12 },
  primaryButton: { flex: 1, backgroundColor: '#3a7d44', height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 15 },
  secondaryIconButton: { width: 48, height: 48, backgroundColor: '#F3F4F6', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  clearText: { fontSize: 13, color: '#6B7280' },
  recentItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 12 },
  recentImage: { width: 56, height: 56, borderRadius: 12, marginRight: 16 },
  recentInfo: { flex: 1 },
  recentName: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 4 },
  recentTime: { fontSize: 12, color: '#9CA3AF' },
  scanContainer: { flex: 1, backgroundColor: '#000' },
  cameraPlaceholder: { flex: 1, backgroundColor: '#1F2937', alignItems: 'center', justifyContent: 'center' },
  targetFrame: { width: 250, height: 350, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#ffffff', borderWidth: 0 },
  cornerTL: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4 },
  cornerTR: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4 },
  cornerBL: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4 },
  cornerBR: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4 },
  cameraControls: { height: 160, alignItems: 'center', justifyContent: 'center', paddingBottom: 20 },
  cameraHint: { color: '#ffffff', fontSize: 14, marginBottom: 24 },
  captureButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  captureButtonInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#ffffff' },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f0' },
  pulseCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(124,203,138,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  analyzingTitle: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 8 },
  analyzingDesc: { fontSize: 15, color: '#6B7280' },
  resultImage: { width: '100%', height: width * 0.8, borderRadius: 24, marginBottom: -20 },
  resultCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4 },
  matchBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4, marginBottom: 12 },
  matchText: { color: '#2E7D32', fontSize: 12, fontWeight: '700' },
  plantName: { fontSize: 26, fontWeight: '800', color: '#111827' },
  plantSpecies: { fontSize: 15, color: '#6B7280', fontStyle: 'italic', marginTop: 4, marginBottom: 20 },
  infoRow: { flexDirection: 'row', backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, marginBottom: 24 },
  infoItem: { flex: 1, alignItems: 'center' },
  infoLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  infoValue: { fontSize: 15, fontWeight: '600', color: '#374151' },
  infoDivider: { width: 1, backgroundColor: '#E5E7EB', marginHorizontal: 16 },
  actionRow: { flexDirection: 'row', gap: 12 },
  outlineButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 50, borderRadius: 14, borderWidth: 1, borderColor: '#D1D5DB', gap: 8 },
  outlineButtonText: { color: '#4B5563', fontWeight: '600', fontSize: 15 },
  fillButton: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3a7d44', height: 50, borderRadius: 14, gap: 8 },
  fillButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 15 },
  healthHeader: { backgroundColor: '#ffffff', padding: 20, borderRadius: 20, marginBottom: 16 },
  healthStatus: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  healthTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  healthGood: { fontSize: 18, fontWeight: '800', color: '#2E7D32' },
  healthDesc: { fontSize: 14, color: '#4B5563', lineHeight: 22 },
  checklist: { backgroundColor: '#ffffff', padding: 20, borderRadius: 20, marginBottom: 16 },
  checklistTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },
  checkItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  checkText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },
  tipBox: { backgroundColor: '#EFF6FF', padding: 16, borderRadius: 16, marginBottom: 32, borderWidth: 1, borderColor: '#BFDBFE' },
  tipText: { color: '#1E3A8A', fontSize: 14, lineHeight: 20 },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3a7d44', height: 56, borderRadius: 16, gap: 8 },
  saveButtonActive: { backgroundColor: '#7CCB8A' },
  saveButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
});
