import React from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sprout, Sparkles, Plus } from 'lucide-react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../../App';
import { useDiaryEntries } from '../../lib/diaryStore';

type GrowthDiaryNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Diary'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function GrowthDiary() {
  const navigation = useNavigation<GrowthDiaryNavigationProp>();
  const diaryEntries = useDiaryEntries();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* AppBar */}
      <View style={styles.appBar}>
        <Text style={styles.headerTitle}>성장 일지</Text>
        <Text style={styles.headerSubtitle}>{diaryEntries.length}개의 기록</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.timelineContainer}>
          <View style={styles.timelineLine} />

          <View style={styles.entriesList}>
            {diaryEntries.map((entry) => (
              <View key={entry.id} style={styles.entryRow}>
                {/* Timeline Dot */}
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

                {/* Entry Card */}
                <View style={styles.entryCard}>
                  <Image source={{ uri: entry.image }} style={styles.entryImage} />
                  <View style={styles.entryContent}>
                    <View style={styles.entryHeader}>
                      <View>
                        <Text style={styles.plantName}>{entry.plant}</Text>
                        <Text style={styles.dateTime}>{entry.date} · {entry.time}</Text>
                      </View>
                      <View style={styles.tagColumn}>
                        <View style={styles.typeTag}>
                          <Text style={styles.typeTagText}>{entry.type}</Text>
                        </View>
                        {entry.source === 'ai' && (
                          <View style={styles.aiTag}>
                            <Sparkles color="#7C3AED" size={12} />
                            <Text style={styles.aiTagText}>
                              AI 진단{entry.confidence != null ? ` · ${entry.confidence}%` : ''}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Text style={styles.entryNote}>{entry.note}</Text>
                  </View>
                </View>
              </View>
            ))}

            {/* Add Button */}
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
          </View>
        </View>
      </ScrollView>
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
  timelineContainer: { position: 'relative' },
  timelineLine: { position: 'absolute', left: 19, top: 32, bottom: 40, width: 2, backgroundColor: 'rgba(124,203,138,0.3)' },
  entriesList: { gap: 24 },
  entryRow: { position: 'relative', paddingLeft: 48, marginBottom: 24 },
  timelineDotContainer: { position: 'absolute', left: 0, top: 8, width: 40, height: 40, borderRadius: 20, backgroundColor: '#ffffff', borderWidth: 1, borderColor: 'rgba(124,203,138,0.4)', alignItems: 'center', justifyContent: 'center', elevation: 2 },
  timelineDotGradient: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  timelineDotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ffffff' },
  entryCard: { backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6', elevation: 2 },
  entryImage: { width: '100%', height: 180, resizeMode: 'cover' },
  entryContent: { padding: 16 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  plantName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  dateTime: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  tagColumn: { alignItems: 'flex-end', gap: 4 },
  typeTag: { backgroundColor: 'rgba(124,203,138,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  typeTagText: { color: '#3a7d44', fontSize: 12, fontWeight: '600' },
  aiTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F3FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  aiTagText: { color: '#7C3AED', fontSize: 10, fontWeight: '600' },
  entryNote: { fontSize: 14, color: '#374151', lineHeight: 20 },
  addDotContainer: { position: 'absolute', left: 0, top: 8, width: 40, height: 40, borderRadius: 20, backgroundColor: '#ffffff', borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(124,203,138,0.6)', alignItems: 'center', justifyContent: 'center' },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#ffffff', paddingVertical: 16, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: '#D1D5DB' },
  addIconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(124,203,138,0.1)', alignItems: 'center', justifyContent: 'center' },
  addButtonText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
});
