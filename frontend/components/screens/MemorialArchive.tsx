import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, Image, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator, Modal, Alert, RefreshControl,
  ScrollView,
} from 'react-native';
import {
  ArrowLeft, Heart, Trash2, X, Calendar, BookOpen,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { plantApi, growthLogApi, getUserId, MyPlantItem } from '../../services/api';
import { reasonArchiveLabel } from './PlantFarewell';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800';

function formatKoreanDate(iso?: string) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function daysBetween(startIso?: string, endIso?: string) {
  if (!startIso || !endIso) return 0;
  const s = new Date(startIso).getTime();
  const e = new Date(endIso).getTime();
  if (isNaN(s) || isNaN(e)) return 0;
  return Math.max(0, Math.floor((e - s) / 86400000));
}

export function MemorialArchive() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [items, setItems] = useState<MyPlantItem[]>([]);
  const [recordCounts, setRecordCounts] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MyPlantItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<MyPlantItem | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const userId = getUserId();
      if (userId == null) {
        setItems([]);
        return;
      }
      const [memorials, logs] = await Promise.all([
        plantApi.getMemorials(userId),
        growthLogApi.getMyLogs(userId).catch(() => []),
      ]);
      setItems(memorials);
      const counts: Record<number, number> = {};
      logs.forEach((l) => {
        if (l.plantId != null) counts[l.plantId] = (counts[l.plantId] ?? 0) + 1;
      });
      setRecordCounts(counts);
    } catch (e: any) {
      setError(e?.message ?? '추억을 불러오지 못했어요.');
    }
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await load();
      setIsLoading(false);
    })();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const confirmDelete = async (item: MyPlantItem) => {
    setShowDeleteConfirm(null);
    setDeletingId(item.myPlantId);
    try {
      await plantApi.delete(item.myPlantId);
      setItems((prev) => prev.filter((p) => p.myPlantId !== item.myPlantId));
      if (selected?.myPlantId === item.myPlantId) setSelected(null);
    } catch (e: any) {
      Alert.alert('삭제 실패', e?.message ?? '다시 시도해주세요.');
    } finally {
      setDeletingId(null);
    }
  };

  const ListHeader = () => (
    <View style={styles.banner}>
      <View style={styles.bannerIcon}>
        <Heart color="#3a7d44" size={20} fill="#3a7d44" fillOpacity={0.15 as any} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.bannerTitle}>떠나보낸 식물들의 자리</Text>
        <Text style={styles.bannerSub}>함께한 시간은 사라지지 않아요.</Text>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: MyPlantItem }) => {
    const days = daysBetween(item.registeredAt || item.createdAt, item.archivedAt);
    const records = recordCounts[item.myPlantId] ?? 0;
    const isDeleting = deletingId === item.myPlantId;
    return (
      <TouchableOpacity
        style={[styles.row, isDeleting && { opacity: 0.5 }]}
        activeOpacity={0.85}
        onPress={() => setSelected(item)}
        disabled={isDeleting}
      >
        <Image source={{ uri: item.imageUrl || FALLBACK_IMAGE }} style={styles.rowImage} />
        <View style={styles.rowBody}>
          <View style={styles.rowTopLine}>
            <Text style={styles.rowName} numberOfLines={1}>
              {item.nickname}
            </Text>
            <View style={styles.reasonChip}>
              <Text style={styles.reasonChipText}>{reasonArchiveLabel(item.farewellReason)}</Text>
            </View>
          </View>
          <View style={styles.rowMetaLine}>
            <Calendar color="#6B7280" size={12} />
            <Text style={styles.rowMetaText}>{formatKoreanDate(item.archivedAt)}에 보냄</Text>
          </View>
          <View style={styles.rowStatLine}>
            <View style={styles.rowStatItem}>
              <Heart color="#3a7d44" size={12} fill="#3a7d44" fillOpacity={0.2 as any} />
              <Text style={styles.rowStatText}>{days}일</Text>
            </View>
            <View style={styles.rowStatItem}>
              <BookOpen color="#3a7d44" size={12} />
              <Text style={styles.rowStatText}>{records}개</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.appBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#374151" size={22} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>추억 보관함</Text>
        <View style={styles.iconBtn} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#3a7d44" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
            <Text style={styles.retryBtnText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      ) : items.length === 0 ? (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3a7d44" />}
        >
          <ListHeader />
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Heart color="#9CA3AF" size={26} />
            </View>
            <Text style={styles.emptyTitle}>아직 보관된 추억이 없어요</Text>
            <Text style={styles.emptyDesc}>
              함께한 시간을 떠나보낼 때{'\n'}이곳에 따뜻하게 남게 돼요.
            </Text>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.myPlantId)}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3a7d44" />}
        />
      )}

      {/* 상세 바텀시트 */}
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.sheetBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setSelected(null)}
          />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            {selected && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 32 }}
              >
                <Image
                  source={{ uri: selected.imageUrl || FALLBACK_IMAGE }}
                  style={styles.heroImage}
                />
                <View style={styles.sheetBody}>
                  <Text style={styles.detailName}>{selected.nickname}</Text>
                  {selected.plantName ? (
                    <Text style={styles.detailSpecies}>{selected.plantName}</Text>
                  ) : null}

                  <View style={styles.statRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statNum}>
                        {daysBetween(selected.registeredAt || selected.createdAt, selected.archivedAt)}일
                      </Text>
                      <Text style={styles.statLabel}>함께한 시간</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statNum}>
                        {recordCounts[selected.myPlantId] ?? 0}개
                      </Text>
                      <Text style={styles.statLabel}>남긴 기록</Text>
                    </View>
                  </View>

                  <View style={styles.metaList}>
                    <MetaRow label="떠나보낸 날" value={formatKoreanDate(selected.archivedAt)} />
                    <MetaRow
                      label="처음 만난 날"
                      value={formatKoreanDate(selected.registeredAt || selected.createdAt)}
                    />
                    <MetaRow label="떠나보낸 이유" value={reasonArchiveLabel(selected.farewellReason)} />
                  </View>

                  {selected.farewellMessage ? (
                    <View style={styles.messageBox}>
                      <Text style={styles.messageLabel}>마지막 한마디</Text>
                      <Text style={styles.messageText}>{selected.farewellMessage}</Text>
                    </View>
                  ) : null}

                  <TouchableOpacity
                    style={styles.dangerBtn}
                    onPress={() => {
                      const target = selected;
                      setSelected(null);
                      setShowDeleteConfirm(target);
                    }}
                  >
                    <Trash2 color="#EF4444" size={16} />
                    <Text style={styles.dangerBtnText}>보관함에서도 영구 삭제하기</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* 완전 삭제 재확인 */}
      <Modal
        visible={!!showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(null)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIcon}>
              <Trash2 color="#EF4444" size={26} />
            </View>
            <Text style={styles.confirmTitle}>정말 완전히 삭제할까요?</Text>
            <Text style={styles.confirmDesc}>
              이 추억은 영영 돌아오지 않아요.{'\n'}한 번 더 생각해주세요.
            </Text>
            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={styles.confirmCancel}
                onPress={() => setShowDeleteConfirm(null)}
              >
                <Text style={styles.confirmCancelText}>유지하기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDelete}
                onPress={() => showDeleteConfirm && confirmDelete(showDeleteConfirm)}
              >
                <Text style={styles.confirmDeleteText}>완전 삭제</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  appBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#ffffff',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  appBarTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  errorText: { fontSize: 14, color: '#EF4444', textAlign: 'center', marginBottom: 12 },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#3a7d44', borderRadius: 10 },
  retryBtnText: { color: '#ffffff', fontWeight: '600' },

  // 안내 배너
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(124,203,138,0.18)',
    padding: 14, borderRadius: 18, marginBottom: 10,
  },
  bannerIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#ffffff',
    alignItems: 'center', justifyContent: 'center',
  },
  bannerTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  bannerSub: { fontSize: 12, color: '#4B5563', marginTop: 2 },

  // 리스트 행
  row: {
    flexDirection: 'row', gap: 12, padding: 12, borderRadius: 18,
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#F3F4F6',
    alignItems: 'center',
  },
  rowImage: { width: 64, height: 64, borderRadius: 14 },
  rowBody: { flex: 1, gap: 6 },
  rowTopLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rowName: { flex: 1, fontSize: 14, fontWeight: '700', color: '#111827' },
  reasonChip: {
    backgroundColor: 'rgba(124,203,138,0.22)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  reasonChipText: { fontSize: 10, fontWeight: '700', color: '#2D5F33' },
  rowMetaLine: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowMetaText: { fontSize: 11, color: '#6B7280' },
  rowStatLine: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rowStatItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowStatText: { fontSize: 11, color: '#3a7d44', fontWeight: '600' },

  // 빈 상태
  empty: {
    backgroundColor: '#ffffff', borderRadius: 18,
    paddingVertical: 36, alignItems: 'center',
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  emptyIcon: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 6 },
  emptyDesc: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 18 },

  // 바텀시트
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 8, maxHeight: '88%',
  },
  sheetHandle: {
    width: 44, height: 4, borderRadius: 2,
    backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 4,
  },
  heroImage: {
    width: '100%', height: 220, backgroundColor: '#f5f5f0',
  },
  sheetBody: { paddingHorizontal: 20, paddingTop: 20 },
  detailName: { fontSize: 22, fontWeight: '800', color: '#111827' },
  detailSpecies: { fontSize: 14, color: '#6B7280', marginTop: 4 },

  statRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  statBox: {
    flex: 1, backgroundColor: '#f5f5f0', borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
  },
  statNum: { fontSize: 20, fontWeight: '800', color: '#3a7d44' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 4 },

  metaList: { marginTop: 22, gap: 14 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaLabel: { fontSize: 13, color: '#6B7280' },
  metaValue: { fontSize: 13, color: '#1F2937', fontWeight: '600' },

  messageBox: {
    marginTop: 22, padding: 14,
    backgroundColor: '#f5f5f0', borderRadius: 16,
  },
  messageLabel: { fontSize: 11, fontWeight: '700', color: '#3a7d44', marginBottom: 6, letterSpacing: 1 },
  messageText: { fontSize: 14, color: '#374151', lineHeight: 22 },

  dangerBtn: {
    marginTop: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 16,
    borderWidth: 1, borderColor: '#FCA5A5', backgroundColor: '#ffffff',
  },
  dangerBtnText: { fontSize: 13, color: '#EF4444', fontWeight: '700' },

  // 확인 모달
  confirmOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  confirmCard: {
    width: '100%', backgroundColor: '#ffffff', borderRadius: 24,
    padding: 24, alignItems: 'center',
  },
  confirmIcon: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#FEF2F2',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  confirmTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  confirmDesc: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  confirmBtnRow: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 20 },
  confirmCancel: {
    flex: 1, height: 50, borderRadius: 14, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  confirmCancelText: { fontSize: 14, fontWeight: '600', color: '#4B5563' },
  confirmDelete: {
    flex: 1, height: 50, borderRadius: 14, backgroundColor: '#EF4444',
    alignItems: 'center', justifyContent: 'center',
  },
  confirmDeleteText: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
});
