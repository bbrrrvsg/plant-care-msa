import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Platform, StatusBar,
  ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sprout, Sparkles, Plus } from 'lucide-react-native';
import { useNavigation, CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../../App';
import { growthLogApi, getUserId, GrowthLogItem, resolveAssetUrl } from '../../services/api';

type GrowthDiaryNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Diary'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const getTypeColor = (type?: string): string => {
  switch (type) {
    case '성장 기록': return '#3a7d44';
    case '일상 관리': return '#0ea5e9';
    case '물주기':   return '#0284c7';
    case '분갈이':   return '#a16207';
    case '개화':     return '#db2777';
    case '이상 증상': return '#dc2626';
    case 'AI 진단':  return '#7C3AED';
    default:         return '#6B7280';
  }
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  } catch {
    return dateStr;
  }
};

const formatTime = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h < 12 ? '오전' : '오후';
    const hh = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${ampm} ${hh}:${String(m).padStart(2, '0')}`;
  } catch {
    return '';
  }
};

export function GrowthDiary() {
  const navigation = useNavigation<GrowthDiaryNavigationProp>();

  const [entries, setEntries] = useState<GrowthLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadEntries = useCallback(async () => {
    try {
      setError(null);
      const userId = getUserId();
      if (userId == null) {
        setError('로그인이 필요합니다.');
        setIsLoading(false);
        setRefreshing(false);
        return;
      }
      const data = await growthLogApi.getMyLogs(userId);
      // 최신순 정렬 (createDate 기준 내림차순, 없으면 logDate)
      const sorted = [...data].sort((a, b) => {
        const ta = new Date(a.createDate || a.logDate || 0).getTime();
        const tb = new Date(b.createDate || b.logDate || 0).getTime();
        return tb - ta;
      });
      setEntries(sorted);
    } catch (e) {
      setError(e instanceof Error ? e.message : '일지를 불러오지 못했어요.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadEntries();
    }, [loadEntries]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadEntries();
  };

  const renderAddRow = () => (
    <View style={styles.entryRow}>
      <View style={styles.addDotContainer}>
        <Plus color="#3a7d44" size={16} />
      </View>
      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('DiaryWrite')}>
        <View style={styles.addIconCircle}>
          <Sprout color="#3a7d44" size={16} />
        </View>
        <Text style={styles.addButtonText}>새 성장 기록 쓰기</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.appBar}>
        <Text style={styles.headerTitle}>성장 일지</Text>
        <Text style={styles.headerSubtitle}>{entries.length}개의 기록</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#3a7d44" />
        </View>
      ) : error && entries.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => { setIsLoading(true); loadEntries(); }}
          >
            <Text style={styles.retryBtnText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3a7d44" />
          }
        >
          <View style={styles.timelineContainer}>
            <View style={styles.timelineLine} />

            <View style={styles.entriesList}>
              {entries.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>아직 작성된 일지가 없어요</Text>
                </View>
              ) : (
                entries.map((entry) => {
                  const typeColor = getTypeColor(entry.type);
                  return (
                    <View key={entry.logId} style={styles.entryRow}>
                      <View style={styles.timelineDotContainer}>
                        <LinearGradient
                          colors={['#7CCB8A', '#3a7d44']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.timelineDotGradient}
                        >
                          <View style={styles.timelineDotInner} />
                        </LinearGradient>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate('GrowthDetail', { logId: entry.logId })}
                        style={styles.entryCard}
                      >
                        {entry.photoUrl ? (
                          <Image
                            source={{ uri: resolveAssetUrl(entry.photoUrl)! }}
                            style={styles.cardPhoto}
                            resizeMode="cover"
                          />
                        ) : null}
                        <View style={styles.entryContent}>
                          {entry.title ? (
                            <Text style={styles.entryTitle}>{entry.title}</Text>
                          ) : null}
                          <View style={styles.entryHeader}>
                            <View style={{ flexShrink: 1 }}>
                              <Text style={styles.plantName}>
                                {entry.plantNickname || `식물 #${entry.plantId}`}
                              </Text>
                              <Text style={styles.dateTime}>
                                {formatDate(entry.logDate || entry.createDate)}
                                {formatTime(entry.createDate) ? ` · ${formatTime(entry.createDate)}` : ''}
                              </Text>
                            </View>
                            <View style={styles.tagColumn}>
                              {entry.type ? (
                                <View style={[styles.typeTag, { backgroundColor: `${typeColor}1A` }]}>
                                  <Text style={[styles.typeTagText, { color: typeColor }]}>
                                    {entry.type}
                                  </Text>
                                </View>
                              ) : null}
                              {entry.diagnosisId != null && entry.type !== 'AI 진단' && (
                                <View style={styles.aiTag}>
                                  <Sparkles color="#7C3AED" size={12} />
                                  <Text style={styles.aiTagText}>AI 진단 연결</Text>
                                </View>
                              )}
                            </View>
                          </View>
                          <Text style={styles.entryNote} numberOfLines={3}>{entry.content}</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}

              {renderAddRow()}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  appBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#3a7d44' },
  headerSubtitle: { fontSize: 12, color: '#9CA3AF' },
  container: { flex: 1, backgroundColor: '#f5f5f0' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 20 },
  errorText: { fontSize: 14, color: '#B91C1C', textAlign: 'center' },
  retryBtn: { backgroundColor: '#3a7d44', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  emptyBox: { backgroundColor: '#ffffff', borderRadius: 16, paddingVertical: 32, alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6' },
  emptyText: { fontSize: 14, color: '#6B7280' },
  timelineContainer: { position: 'relative' },
  timelineLine: { position: 'absolute', left: 19, top: 32, bottom: 40, width: 2, backgroundColor: 'rgba(124,203,138,0.3)' },
  entriesList: { gap: 24 },
  entryRow: { position: 'relative', paddingLeft: 48, marginBottom: 24 },
  timelineDotContainer: { position: 'absolute', left: 0, top: 8, width: 40, height: 40, borderRadius: 20, backgroundColor: '#ffffff', borderWidth: 1, borderColor: 'rgba(124,203,138,0.4)', alignItems: 'center', justifyContent: 'center', elevation: 2 },
  timelineDotGradient: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  timelineDotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ffffff' },
  entryCard: { backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6', elevation: 2 },
  cardPhoto: { width: '100%', aspectRatio: 4 / 3, backgroundColor: '#E5E7EB' },
  entryContent: { padding: 16 },
  entryTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 12 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  plantName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  dateTime: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  tagColumn: { alignItems: 'flex-end', gap: 4 },
  typeTag: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  typeTagText: { fontSize: 12, fontWeight: '600' },
  aiTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F3FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  aiTagText: { color: '#7C3AED', fontSize: 10, fontWeight: '600' },
  entryNote: { fontSize: 14, color: '#374151', lineHeight: 20 },
  addDotContainer: { position: 'absolute', left: 0, top: 8, width: 40, height: 40, borderRadius: 20, backgroundColor: '#ffffff', borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(124,203,138,0.6)', alignItems: 'center', justifyContent: 'center' },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#ffffff', paddingVertical: 16, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: '#D1D5DB' },
  addIconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(124,203,138,0.1)', alignItems: 'center', justifyContent: 'center' },
  addButtonText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
});
