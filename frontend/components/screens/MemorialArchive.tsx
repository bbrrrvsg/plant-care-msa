import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, Image, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator, Modal, Alert, RefreshControl,
} from 'react-native';
import { ArrowLeft, Heart, Trash2, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { plantApi, getUserId, MyPlantItem } from '../../services/api';
import { reasonLabel } from './PlantFarewell';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800';

function formatDate(iso?: string) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return '';
  }
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
      const data = await plantApi.getMemorials(userId);
      setItems(data);
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

  const renderItem = ({ item }: { item: MyPlantItem }) => {
    const days = daysBetween(item.registeredAt || item.createdAt, item.archivedAt);
    const isDeleting = deletingId === item.myPlantId;
    return (
      <TouchableOpacity
        style={[styles.card, isDeleting && { opacity: 0.5 }]}
        activeOpacity={0.85}
        onPress={() => setSelected(item)}
        disabled={isDeleting}
      >
        <Image source={{ uri: item.imageUrl || FALLBACK_IMAGE }} style={styles.cardImage} />
        <View style={styles.cardBody}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardNickname} numberOfLines={1}>{item.nickname}</Text>
              {item.plantName ? (
                <Text style={styles.cardSpecies} numberOfLines={1}>{item.plantName}</Text>
              ) : null}
            </View>
            <View style={styles.reasonChip}>
              <Text style={styles.reasonChipText}>{reasonLabel(item.farewellReason)}</Text>
            </View>
          </View>
          <View style={styles.cardStats}>
            <Text style={styles.cardStatText}>함께한 시간 {days}일</Text>
            <Text style={styles.cardDot}>·</Text>
            <Text style={styles.cardStatText}>{formatDate(item.archivedAt)} 떠나보냄</Text>
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
        <View style={styles.centered}>
          <View style={styles.emptyIcon}>
            <Heart color="#9CA3AF" size={28} />
          </View>
          <Text style={styles.emptyTitle}>아직 보관된 추억이 없어요</Text>
          <Text style={styles.emptyDesc}>
            함께한 시간을 떠나보낼 때{'\n'}이곳에 따뜻하게 남게 돼요.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.myPlantId)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3a7d44" />}
        />
      )}

      {/* 상세 모달 */}
      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setSelected(null)}>
              <X color="#6B7280" size={20} />
            </TouchableOpacity>
            {selected && (
              <>
                <Image source={{ uri: selected.imageUrl || FALLBACK_IMAGE }} style={styles.modalImage} />
                <Text style={styles.modalNickname}>{selected.nickname}</Text>
                {selected.plantName ? <Text style={styles.modalSpecies}>{selected.plantName}</Text> : null}
                <View style={styles.modalChip}>
                  <Text style={styles.modalChipText}>{reasonLabel(selected.farewellReason)}</Text>
                </View>
                <Text style={styles.modalMeta}>
                  {formatDate(selected.registeredAt || selected.createdAt)} ~ {formatDate(selected.archivedAt)}
                </Text>
                {selected.farewellMessage ? (
                  <View style={styles.messageBox}>
                    <Text style={styles.messageLabel}>마지막 한마디</Text>
                    <Text style={styles.messageText}>{selected.farewellMessage}</Text>
                  </View>
                ) : null}
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => {
                    const target = selected;
                    setSelected(null);
                    setShowDeleteConfirm(target);
                  }}
                >
                  <Trash2 color="#EF4444" size={16} />
                  <Text style={styles.deleteBtnText}>완전히 삭제하기</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* 완전 삭제 재확인 */}
      <Modal visible={!!showDeleteConfirm} transparent animationType="fade" onRequestClose={() => setShowDeleteConfirm(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIcon}>
              <Trash2 color="#EF4444" size={26} />
            </View>
            <Text style={styles.confirmTitle}>정말 완전히 삭제할까요?</Text>
            <Text style={styles.confirmDesc}>
              이 추억은 영영 돌아오지 않아요.{'\n'}한 번 더 생각해주세요.
            </Text>
            <View style={styles.confirmBtnRow}>
              <TouchableOpacity style={styles.confirmCancel} onPress={() => setShowDeleteConfirm(null)}>
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

  emptyIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },

  card: {
    backgroundColor: '#ffffff', borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  cardImage: { width: '100%', height: 140 },
  cardBody: { padding: 14 },
  cardNickname: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardSpecies: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  reasonChip: {
    backgroundColor: 'rgba(124,203,138,0.18)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  reasonChipText: { fontSize: 11, fontWeight: '600', color: '#3a7d44' },
  cardStats: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  cardStatText: { fontSize: 12, color: '#6B7280' },
  cardDot: { color: '#D1D5DB' },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  modalCard: {
    width: '100%', backgroundColor: '#ffffff', borderRadius: 24, padding: 20,
    alignItems: 'center',
  },
  modalClose: { position: 'absolute', top: 12, right: 12, padding: 6, zIndex: 1 },
  modalImage: { width: 120, height: 120, borderRadius: 60, marginTop: 8 },
  modalNickname: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 14 },
  modalSpecies: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  modalChip: {
    backgroundColor: 'rgba(124,203,138,0.18)',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, marginTop: 10,
  },
  modalChipText: { fontSize: 12, fontWeight: '600', color: '#3a7d44' },
  modalMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 8 },
  messageBox: {
    width: '100%', marginTop: 18, padding: 14,
    backgroundColor: '#f5f5f0', borderRadius: 16,
  },
  messageLabel: { fontSize: 11, fontWeight: '700', color: '#3a7d44', marginBottom: 6, letterSpacing: 1 },
  messageText: { fontSize: 14, color: '#374151', lineHeight: 22 },
  deleteBtn: {
    marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 14,
  },
  deleteBtnText: { fontSize: 13, color: '#EF4444', fontWeight: '600' },

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
