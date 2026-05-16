import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Image, ScrollView, StyleSheet,
  SafeAreaView, Platform, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import {
  ArrowLeft, Camera, Check, RotateCcw, BookOpen,
  Stethoscope, Upload, Sparkles, Sun, Leaf, ScanLine,
} from 'lucide-react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../../App';
import * as ImagePicker from 'expo-image-picker';
import {
  aiApi, plantApi, getUserId,
  MyPlantItem, DiagnosisResult,
} from '../../services/api';

type AIDiagnosisNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'AIDiagnosis'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type Step = 'entry' | 'analyzing' | 'result';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=80';

type ParsedSection = {
  header: string | null;
  bullets: string[];
  paragraphs: string[];
};
type HealthStatus = 'healthy' | 'warning' | 'fail';

const inferHealthStatus = (result: string, subtitle?: string): HealthStatus => {
  if (result === '진단실패') return 'fail';
  
  if (subtitle) {
    const warningKeywords = [
      '부족', '과다', '스트레스', '주의', '위험', '심각',
      '병', '썩', '마름', '시들', '고사', '갈변', '낙엽',
      '벌레', '해충', '응애', '진딧물', '깍지',
      '탈수', '과습', '영양', '결핍',
    ];
    if (warningKeywords.some((kw) => subtitle.includes(kw))) {
      return 'warning';
    }
  }
  
  return 'healthy';
};

const parseDetails = (details: string): ParsedSection[] | null => {
  if (!details || !details.trim()) return null;

  const lines = details.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const sections: ParsedSection[] = [];
  let current: ParsedSection = { header: null, bullets: [], paragraphs: [] };

  const stripMarkdown = (s: string) =>
    s.replace(/\*\*(.+?)\*\*/g, '$1')
     .replace(/\*(.+?)\*/g, '$1')
     .trim();

  for (const line of lines) {
    const headerMatch = line.match(/^\*\*(.+?)\*\*:?$/);
    if (headerMatch) {
      if (current.bullets.length > 0 || current.paragraphs.length > 0 || current.header) {
        sections.push(current);
      }
      current = { header: headerMatch[1].replace(/:$/, ''), bullets: [], paragraphs: [] };
      continue;
    }

    const bulletMatch = line.match(/^(\*\s+|-\s+|\d+\.\s+)(.+)$/);
    if (bulletMatch) {
      current.bullets.push(stripMarkdown(bulletMatch[2]));
      continue;
    }

    current.paragraphs.push(stripMarkdown(line));
  }

  if (current.bullets.length > 0 || current.paragraphs.length > 0 || current.header) {
    sections.push(current);
  }

  const totalContent = sections.reduce(
    (sum, s) => sum + s.bullets.length + s.paragraphs.length, 0,
  );
  if (totalContent === 0) return null;

  return sections;
};

export function AIDiagnosis() {
  const navigation = useNavigation<AIDiagnosisNavigationProp>();
  const [step, setStep] = useState<Step>('entry');

  const [plants, setPlants] = useState<MyPlantItem[]>([]);
  const [plantsLoading, setPlantsLoading] = useState(true);

  const [selectedPlantId, setSelectedPlantId] = useState<number | null | undefined>(undefined);

  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [diagnoseError, setDiagnoseError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const userId = getUserId();
        if (userId == null) {
          if (!cancelled) {
            setPlantsLoading(false);
            setSelectedPlantId(null);
          }
          return;
        }
        const data = await plantApi.getMyPlants(userId);
        if (!cancelled) {
          setPlants(data);
          setSelectedPlantId(data.length > 0 ? data[0].myPlantId : null);
          setPlantsLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setPlants([]);
          setSelectedPlantId(null);
          setPlantsLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (step !== 'analyzing') {
      setProgress(0);
      return;
    }
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p;
        const increment = p < 30 ? 4 : p < 60 ? 2 : 1;
        return Math.min(90, p + increment);
      });
    }, 150);
    return () => clearInterval(interval);
  }, [step]);

  const startDiagnosis = async (uri: string) => {
    setStep('analyzing');
    setDiagnoseError(null);
    try {
      const plantIdToSend = typeof selectedPlantId === 'number' ? selectedPlantId : undefined;
      const result = await aiApi.diagnose(uri, plantIdToSend);
      setDiagnosis(result);
      setProgress(100);
      setStep('result');
    } catch (e) {
      setDiagnoseError(e instanceof Error ? e.message : '진단에 실패했어요.');
      setStep('entry');
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      startDiagnosis(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('권한 필요', '카메라 권한이 필요합니다.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      startDiagnosis(result.assets[0].uri);
    }
  };

  const resetAll = () => {
    setDiagnosis(null);
    setImageUri(null);
    setDiagnoseError(null);
    setStep('entry');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.appBar}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => {
            if (step === 'entry') navigation.navigate('Home');
            else resetAll();
          }}
        >
          <ArrowLeft color="#374151" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 'entry' ? 'AI 식물 진단' :
           step === 'analyzing' ? '분석 중' : '진단 결과'}
        </Text>
        <View style={styles.appBarBadge}>
          <Stethoscope color="#3a7d44" size={20} />
        </View>
      </View>

      <View style={styles.container}>

        {/* === Entry === */}
        {step === 'entry' && (
          <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.heroTitle}>
              식물의 건강 상태,{'\n'}AI가 확인해 드려요
            </Text>
            <Text style={styles.heroSub}>
              잎 사진 한 장으로 질병·해충·영양 상태를 분석합니다.
            </Text>

            <Text style={styles.sectionLabel}>진단할 식물</Text>

            {plantsLoading ? (
              <ActivityIndicator size="small" color="#3a7d44" style={{ marginVertical: 16 }} />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipScroll}
                contentContainerStyle={styles.chipScrollContent}
              >
                {plants.map((p) => {
                  const isSelected = selectedPlantId === p.myPlantId;
                  return (
                    <TouchableOpacity
                      key={p.myPlantId}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => setSelectedPlantId(p.myPlantId)}
                    >
                      <Image
                        source={{ uri: p.imageUrl || PLACEHOLDER_IMAGE }}
                        style={styles.chipImage}
                      />
                      <View style={styles.chipTextContainer}>
                        <Text
                          style={[styles.chipName, isSelected && styles.chipTextSelected]}
                          numberOfLines={1}
                        >
                          {p.nickname}
                        </Text>
                        <Text
                          style={[styles.chipSpecies, isSelected && styles.chipSubTextSelected]}
                          numberOfLines={1}
                        >
                          {p.plantName}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={[
                    styles.chip,
                    styles.chipOther,
                    selectedPlantId === null && styles.chipSelected,
                  ]}
                  onPress={() => setSelectedPlantId(null)}
                >
                  <View style={styles.chipOtherIcon}>
                    <Text style={styles.chipOtherIconText}>?</Text>
                  </View>
                  <View style={styles.chipTextContainer}>
                    <Text style={[styles.chipName, selectedPlantId === null && styles.chipTextSelected]}>
                      기타
                    </Text>
                    <Text style={[styles.chipSpecies, selectedPlantId === null && styles.chipSubTextSelected]}>
                      모르는 식물
                    </Text>
                  </View>
                </TouchableOpacity>
              </ScrollView>
            )}

            {/* Primary 카드 — 촬영 */}
            <TouchableOpacity activeOpacity={0.9} style={styles.primaryCard} onPress={takePhoto}>
              <View style={styles.primaryIconBox}>
                <Camera color="#ffffff" size={22} />
              </View>
              <Text style={styles.primaryCardTitle}>사진 촬영으로 진단 시작</Text>
              <Text style={styles.primaryCardDesc}>
                이상이 의심되는 잎이나 줄기를{'\n'}가까이서 촬영해 주세요.
              </Text>
              <View style={styles.primaryCardDeco} pointerEvents="none">
                <ScanLine color="rgba(255,255,255,0.08)" size={120} />
              </View>
            </TouchableOpacity>

            {/* Secondary 카드 — 갤러리 */}
            <TouchableOpacity activeOpacity={0.9} style={styles.secondaryCard} onPress={pickFromGallery}>
              <View style={styles.secondaryIconBox}>
                <Upload color="#3a7d44" size={22} />
              </View>
              <Text style={styles.secondaryCardTitle}>갤러리에서 사진 선택</Text>
              <Text style={styles.secondaryCardDesc}>
                저장된 사진을 불러와{'\n'}진단을 받아보세요.
              </Text>
              <View style={styles.secondaryCardDeco} pointerEvents="none">
                <Upload color="#F3F4F6" size={120} />
              </View>
            </TouchableOpacity>

            {/* 팁 카드 */}
            <View style={styles.tipsCard}>
              <View style={styles.tipsHeader}>
                <Sparkles color="#3a7d44" size={16} />
                <Text style={styles.tipsHeaderText}>정확한 진단을 위한 팁</Text>
              </View>
              <View style={styles.tipRow}>
                <View style={styles.tipIconWrap}>
                  <Sun color="#3a7d44" size={14} />
                </View>
                <Text style={styles.tipRowText}>밝은 자연광 아래에서 촬영해 주세요</Text>
              </View>
              <View style={styles.tipRow}>
                <View style={styles.tipIconWrap}>
                  <Leaf color="#3a7d44" size={14} />
                </View>
                <Text style={styles.tipRowText}>증상이 있는 부위가 잘 보이도록 가까이서 찍어주세요</Text>
              </View>
              <View style={[styles.tipRow, { marginBottom: 0 }]}>
                <View style={styles.tipIconWrap}>
                  <Camera color="#3a7d44" size={14} />
                </View>
                <Text style={styles.tipRowText}>흔들리지 않게 초점을 잘 맞춰주세요</Text>
              </View>
            </View>

            {diagnoseError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{diagnoseError}</Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* === Analyzing === */}
        {step === 'analyzing' && (
          <View style={styles.centerContainer}>
            <View style={styles.previewContainer}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
              ) : (
                <View style={[styles.previewImage, { backgroundColor: '#f2a48f' }]} />
              )}
              <View style={[styles.cornerDeco, styles.cornerTL]} />
              <View style={[styles.cornerDeco, styles.cornerTR]} />
              <View style={[styles.cornerDeco, styles.cornerBL]} />
              <View style={[styles.cornerDeco, styles.cornerBR]} />
            </View>

            <Text style={styles.analyzingTitle}>
              AI가 식물의 건강 상태를{'\n'}분석하고 있습니다…
            </Text>
            <Text style={styles.analyzingDesc}>
              {selectedPlantId === null
                ? '잎의 색상과 패턴을 정밀 분석 중입니다'
                : '잎의 상태와 센서 데이터를 종합 분석 중입니다'}
            </Text>

            <Text style={styles.progressText}>{progress}%</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
          </View>
        )}

        {/* === Result === */}
        {step === 'result' && diagnosis && (() => {
          const sections = parseDetails(diagnosis.details);
          return (
            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
              {(diagnosis.imageUrl || imageUri) && (
                <View style={styles.resultImageWrap}>
                  <Image
                    source={{ uri: diagnosis.imageUrl || imageUri! }}
                    style={styles.resultImage}
                  />
                </View>
              )}

              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultCardTitle}>진단 결과</Text>
                  {(() => {
                    const healthStatus = inferHealthStatus(diagnosis.result, diagnosis.subtitle);
                    const chipStyle =
                      healthStatus === 'fail' ? styles.statusChipFail :
                      healthStatus === 'warning' ? styles.statusChipWarning :
                      null;
                    const textStyle =
                      healthStatus === 'fail' ? styles.statusChipTextFail :
                      healthStatus === 'warning' ? styles.statusChipTextWarning :
                      null;
                    const label =
                      healthStatus === 'fail' ? '진단 실패' :
                      healthStatus === 'warning' ? '주의 필요' :
                      '건강함';

                    return (
                      <View style={[styles.statusChip, chipStyle]}>
                        <Text style={[styles.statusChipText, textStyle]}>{label}</Text>
                      </View>
                    );
                  })()}
                </View>

                <Text style={styles.resultPlantName}>{diagnosis.title}</Text>
                {diagnosis.subtitle && (
                  <Text style={styles.resultSubtitle}>{diagnosis.subtitle}</Text>
                )}

                {sections ? (
                  <View style={{ marginTop: 16 }}>
                    {sections.map((section, idx) => (
                      <View key={idx} style={{ marginBottom: 16 }}>
                        {section.header && (
                          <Text style={styles.sectionHeaderText}>{section.header}</Text>
                        )}
                        {section.paragraphs.map((p, i) => (
                          <Text key={`p-${i}`} style={styles.paragraphText}>{p}</Text>
                        ))}
                        {section.bullets.length > 0 && (
                          <View style={{ marginTop: 4 }}>
                            {section.bullets.map((b, i) => (
                              <View key={`b-${i}`} style={styles.bulletRow}>
                                <Check color="#7CCB8A" size={16} style={{ marginTop: 3, marginRight: 8 }} />
                                <Text style={styles.bulletText}>{b}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.detailsBox}>
                    <Text style={styles.detailsText}>{diagnosis.details}</Text>
                  </View>
                )}

                <View style={styles.tipBox}>
                  <Text style={styles.tipText}>
                    <Text style={{ fontWeight: '700' }}>💡 팁: </Text>
                    정기적인 모니터링은 문제를 조기에 발견하는 데 도움이 됩니다.
                    매주 식물의 변화를 확인하세요.
                  </Text>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.outlineButton} onPress={resetAll}>
                    <RotateCcw color="#4B5563" size={18} />
                    <Text style={styles.outlineButtonText}>다시 진단</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.fillButton}
                    onPress={() => navigation.navigate('Diary')}
                  >
                    <BookOpen color="#ffffff" size={18} />
                    <Text style={styles.fillButtonText}>일지 보기</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          );
        })()}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  appBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  iconButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  appBarBadge: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(124, 203, 138, 0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 4,
  },
  container: { flex: 1, backgroundColor: '#f5f5f0' },
  content: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  heroTitle: { fontSize: 28, fontWeight: '800', lineHeight: 36, color: '#111827' },
  heroSub: { fontSize: 14, color: '#6B7280', marginTop: 8, marginBottom: 24 },

  sectionLabel: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 12 },

  chipScroll: { marginBottom: 24 },
  chipScrollContent: { gap: 10, paddingRight: 16 },
  chip: {
    width: 140, padding: 12, borderRadius: 16,
    backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  chipSelected: { borderColor: '#3a7d44', backgroundColor: '#F0FDF4' },
  chipImage: { width: 56, height: 56, borderRadius: 12, marginBottom: 8 },
  chipOther: { justifyContent: 'center' },
  chipOtherIcon: {
    width: 56, height: 56, borderRadius: 12, backgroundColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  chipOtherIconText: { fontSize: 28, fontWeight: '700', color: '#9CA3AF' },
  chipTextContainer: { alignItems: 'center', width: '100%' },
  chipName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  chipSpecies: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  chipTextSelected: { color: '#2E7D32' },
  chipSubTextSelected: { color: '#3a7d44' },

  primaryCard: {
    backgroundColor: '#3a7d44', borderRadius: 24, padding: 20, marginBottom: 12,
    overflow: 'hidden', position: 'relative',
  },
  primaryIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  primaryCardTitle: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  primaryCardDesc: { fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 20, marginTop: 4 },
  primaryCardDeco: { position: 'absolute', right: -16, bottom: -16 },

  secondaryCard: {
    backgroundColor: '#ffffff', borderRadius: 24, padding: 20, marginBottom: 24,
    borderWidth: 1, borderColor: '#F3F4F6',
    overflow: 'hidden', position: 'relative',
  },
  secondaryIconBox: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#f5f5f0',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  secondaryCardTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  secondaryCardDesc: { fontSize: 13, color: '#6B7280', lineHeight: 20, marginTop: 4 },
  secondaryCardDeco: { position: 'absolute', right: -16, bottom: -16 },

  tipsCard: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  tipsHeaderText: { fontSize: 15, fontWeight: '700', color: '#111827' },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  tipIconWrap: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(124, 203, 138, 0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10, marginTop: 1,
  },
  tipRowText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },

  errorBox: {
    backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1,
    padding: 12, borderRadius: 12, marginTop: 12,
  },
  errorText: { fontSize: 14, color: '#B91C1C' },

  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f0', paddingHorizontal: 24 },

  previewContainer: {
    width: 240, height: 240, borderRadius: 24, overflow: 'hidden',
    marginBottom: 24, position: 'relative',
  },
  previewImage: { width: '100%', height: '100%' },
  cornerDeco: {
    position: 'absolute', width: 32, height: 32,
    borderColor: '#7CCB8A', borderWidth: 0,
  },
  cornerTL: { top: 12, left: 12, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  cornerTR: { top: 12, right: 12, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  cornerBL: { bottom: 12, left: 12, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 12, right: 12, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },

  analyzingTitle: { fontSize: 22, fontWeight: '700', color: '#111827', textAlign: 'center', lineHeight: 30 },
  analyzingDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8 },

  progressText: { fontSize: 28, fontWeight: '700', color: '#3a7d44', marginTop: 24 },
  progressBarBg: {
    width: 240, height: 8, backgroundColor: '#E2EBE0',
    borderRadius: 4, marginTop: 12, overflow: 'hidden',
  },
  progressBarFill: { height: '100%', backgroundColor: '#3a7d44', borderRadius: 4 },

  resultImageWrap: {
    borderRadius: 20, overflow: 'hidden', marginBottom: 16,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  resultImage: { width: '100%', height: 240 },
  resultCard: {
    backgroundColor: '#ffffff', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  resultHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  resultCardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  statusChip: {
    backgroundColor: 'rgba(124, 203, 138, 0.2)',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
  },
  statusChipFail: { backgroundColor: '#FEF2F2' },
  statusChipWarning: { backgroundColor: '#FEF3C7' },
  statusChipText: { fontSize: 12, fontWeight: '700', color: '#2E5D31' },
  statusChipTextFail: { color: '#B91C1C' },
  statusChipTextWarning: { color: '#92400E' },
  resultPlantName: { fontSize: 22, fontWeight: '800', color: '#111827' },
  resultSubtitle: { fontSize: 15, fontWeight: '600', color: '#3a7d44', marginTop: 4 },

  sectionHeaderText: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 },
  paragraphText: { fontSize: 14, color: '#4B5563', lineHeight: 22, marginBottom: 6 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  bulletText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },

  detailsBox: {
    backgroundColor: '#F9FAFB', padding: 16, borderRadius: 12,
    marginTop: 16, marginBottom: 16,
  },
  detailsText: { fontSize: 14, color: '#374151', lineHeight: 22 },

  tipBox: {
    backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', borderWidth: 1,
    padding: 12, borderRadius: 12, marginTop: 16, marginBottom: 20,
  },
  tipText: { fontSize: 13, color: '#1E3A8A', lineHeight: 20 },

  actionRow: { flexDirection: 'row', gap: 12 },
  outlineButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 50, borderRadius: 14, borderWidth: 1, borderColor: '#D1D5DB', gap: 8 },
  outlineButtonText: { color: '#4B5563', fontWeight: '600', fontSize: 15 },
  fillButton: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3a7d44', height: 50, borderRadius: 14, gap: 8 },
  fillButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 15 },
});
