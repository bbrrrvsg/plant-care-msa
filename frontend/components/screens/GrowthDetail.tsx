import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Platform, StatusBar, Image, ActivityIndicator,
  Modal, Alert, Share, Pressable, Dimensions,
} from 'react-native';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Calendar, Clock,
  Leaf, Trash2, Share2, Sparkles, X, AlertCircle,
} from 'lucide-react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { growthLogApi, getUserId, GrowthLogItem, resolveAssetUrl } from '../../services/api';

type GrowthDetailRouteProp = RouteProp<RootStackParamList, 'GrowthDetail'>;
type GrowthDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'GrowthDetail'>;

const { width: SCREEN_W } = Dimensions.get('window');

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

export function GrowthDetail() {
  const navigation = useNavigation<GrowthDetailNavigationProp>();
  const route = useRoute<GrowthDetailRouteProp>();
  const { logId } = route.params;

  const [entry, setEntry] = useState<GrowthLogItem | null>(null);
  const [siblings, setSiblings] = useState<GrowthLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageOpen, setImageOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadDetail = useCallback(async () => {
    try {
      setError(null);
      const detail = await growthLogApi.getDetail(logId, true);
      setEntry(detail);

      const userId = getUserId();
      if (userId != null && detail?.plantId != null) {
        const all = await growthLogApi.getMyLogs(userId);
        const sameP = all
          .filter((l) => l.plantId === detail.plantId)
          .sort((a, b) => {
            const ta = new Date(a.createDate || a.logDate || 0).getTime();
            const tb = new Date(b.createDate || b.logDate || 0).getTime();
            return ta - tb; // 오래된 것 먼저 (prev/next 계산 편의)
          });
        setSiblings(sameP);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '기록을 불러오지 못했어요.');
    } finally {
      setIsLoading(false);
    }
  }, [logId]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadDetail();
    }, [loadDetail]),
  );

  const idx = entry ? siblings.findIndex((s) => s.logId === entry.logId) : -1;
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  const handleShare = async () => {
    if (!entry) return;
    try {
      const lines = [
        entry.title || '성장 일지',
        entry.plantNickname ? `🪴 ${entry.plantNickname}` : '',
        formatDate(entry.logDate || entry.createDate),
        '',
        entry.content || '',
      ].filter(Boolean);
      await Share.share({ message: lines.join('\n') });
    } catch {
      // 사용자 취소 등은 무시
    }
  };

  const confirmDelete = async () => {
    if (!entry) return;
    setIsDeleting(true);
    try {
      await growthLogApi.delete(entry.logId);
      setShowDeleteModal(false);
      navigation.goBack();
    } catch (e) {
      Alert.alert('삭제 실패', e instanceof Error ? e.message : '일지를 삭제하지 못했어요.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={s.centerBox}>
          <ActivityIndicator size="large" color="#3a7d44" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !entry) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={s.appBar}>
          <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft color="#374151" size={22} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>기록 상세</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={s.centerBox}>
          <View style={s.notFoundCircle}>
            <Leaf size={28} color="#D1D5DB" />
          </View>
          <Text style={s.notFoundTitle}>기록을 찾을 수 없어요</Text>
          <Text style={s.notFoundDesc}>삭제되었거나 이동되었을 수 있어요.</Text>
          <TouchableOpacity
            style={s.primaryBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={s.primaryBtnText}>일지로 돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isAI = entry.diagnosisId != null;
  const typeColor = getTypeColor(entry.type);
  const dateStr = formatDate(entry.logDate || entry.createDate);
  const timeStr = formatTime(entry.createDate);
  const diagnosis = entry.diagnosisDto;
  const heroSrc = resolveAssetUrl(entry.photoUrl || diagnosis?.imageUrl);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* AppBar */}
      <View style={s.appBar}>
        <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()} accessibilityLabel="뒤로">
          <ArrowLeft color="#374151" size={22} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>기록 상세</Text>
        <TouchableOpacity style={s.iconBtn} onPress={handleShare} accessibilityLabel="공유">
          <Share2 color="#374151" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.container}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero image */}
        {heroSrc ? (
          <Pressable onPress={() => setImageOpen(true)} style={s.heroWrap}>
            <Image source={{ uri: heroSrc }} style={s.heroImg} resizeMode="cover" />
          </Pressable>
        ) : (
          <View style={[s.heroWrap, s.heroEmpty]}>
            <Leaf size={36} color="#D1D5DB" />
            <Text style={s.heroEmptyText}>사진이 없어요</Text>
          </View>
        )}

        {/* Body card */}
        <View style={s.bodyWrap}>
          <View style={s.bodyCard}>
            {/* Title row */}
            {entry.title ? (
              <Text style={s.title}>{entry.title}</Text>
            ) : null}

            <View style={s.metaRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.plantName}>
                  {entry.plantNickname || `식물 #${entry.plantId}`}
                </Text>
                <View style={s.metaInfoRow}>
                  {dateStr ? (
                    <View style={s.metaInfoItem}>
                      <Calendar size={12} color="#6B7280" />
                      <Text style={s.metaInfoText}>{dateStr}</Text>
                    </View>
                  ) : null}
                  {timeStr ? (
                    <View style={s.metaInfoItem}>
                      <Clock size={12} color="#6B7280" />
                      <Text style={s.metaInfoText}>{timeStr}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <View style={s.tagColumn}>
                {entry.type ? (
                  <View style={[s.typeTag, { backgroundColor: `${typeColor}1A` }]}>
                    <Text style={[s.typeTagText, { color: typeColor }]}>{entry.type}</Text>
                  </View>
                ) : null}
                {isAI && (
                  <View style={s.aiTag}>
                    <Sparkles size={11} color="#7C3AED" />
                    <Text style={s.aiTagText}>AI 진단</Text>
                  </View>
                )}
              </View>
            </View>

            {/* AI diagnosis details */}
            {isAI && diagnosis ? (
              <View style={s.aiCard}>
                <View style={s.aiCardHeader}>
                  <Sparkles size={14} color="#7C3AED" />
                  <Text style={s.aiCardTitle}>{diagnosis.title || 'AI 진단 결과'}</Text>
                </View>
                {diagnosis.subtitle ? (
                  <Text style={s.aiSubtitle}>{diagnosis.subtitle}</Text>
                ) : null}
                {diagnosis.details ? (
                  <Text style={s.aiDetails}>{diagnosis.details}</Text>
                ) : null}
                {diagnosis.result ? (
                  <View style={s.aiResultBox}>
                    <Text style={s.aiResultLabel}>권장사항</Text>
                    <Text style={s.aiResultText}>{diagnosis.result}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Note */}
            <View style={s.noteSection}>
              <Text style={s.noteLabel}>기록 메모</Text>
              <Text style={s.noteText}>{entry.content}</Text>
            </View>

            <View style={s.footerHint}>
              <Leaf size={12} color="#7CCB8A" />
              <Text style={s.footerHintText}> 작은 변화도 소중한 기록이에요</Text>
            </View>
          </View>

          {/* Prev / Next nav */}
          {(prev || next) && (
            <View style={s.navRow}>
              <TouchableOpacity
                style={[s.navBtn, !prev && s.navBtnDisabled]}
                disabled={!prev}
                onPress={() => prev && navigation.replace('GrowthDetail', { logId: prev.logId })}
              >
                <ChevronLeft size={16} color="#9CA3AF" />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.navLabel}>이전 기록</Text>
                  <Text style={s.navValue} numberOfLines={1}>
                    {prev ? formatDate(prev.logDate || prev.createDate) : '없음'}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.navBtn, s.navBtnRight, !next && s.navBtnDisabled]}
                disabled={!next}
                onPress={() => next && navigation.replace('GrowthDetail', { logId: next.logId })}
              >
                <View style={{ flex: 1, minWidth: 0, alignItems: 'flex-end' }}>
                  <Text style={s.navLabel}>다음 기록</Text>
                  <Text style={s.navValue} numberOfLines={1}>
                    {next ? formatDate(next.logDate || next.createDate) : '없음'}
                  </Text>
                </View>
                <ChevronRight size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          )}

          {/* Danger zone */}
          <TouchableOpacity
            style={s.deleteBtn}
            onPress={() => setShowDeleteModal(true)}
          >
            <Trash2 size={16} color="#DC2626" />
            <Text style={s.deleteBtnText}>이 기록 삭제하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Image lightbox */}
      <Modal
        visible={imageOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setImageOpen(false)}
      >
        <Pressable style={s.lightbox} onPress={() => setImageOpen(false)}>
          <TouchableOpacity
            style={s.lightboxClose}
            onPress={() => setImageOpen(false)}
            accessibilityLabel="닫기"
          >
            <X color="#ffffff" size={22} />
          </TouchableOpacity>
          {heroSrc ? (
            <Image
              source={{ uri: heroSrc }}
              style={{ width: SCREEN_W, height: SCREEN_W }}
              resizeMode="contain"
            />
          ) : null}
        </Pressable>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => !isDeleting && setShowDeleteModal(false)}
      >
        <View style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <View style={s.modalIconCircle}>
                <AlertCircle size={20} color="#DC2626" />
              </View>
              <Text style={s.modalTitle}>이 기록을 삭제할까요?</Text>
            </View>
            <Text style={s.modalBody}>
              삭제한 기록은 복구할 수 없어요.{'\n'}사진과 메모가 함께 사라집니다.
            </Text>
            <View style={s.modalActions}>
              <TouchableOpacity
                style={[s.modalBtn, s.modalCancelBtn]}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                <Text style={s.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, s.modalConfirmBtn, isDeleting && { opacity: 0.6 }]}
                onPress={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={s.modalConfirmText}>삭제하기</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  appBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, paddingVertical: 12,
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  iconBtn: { padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  container: { flex: 1, backgroundColor: '#f5f5f0' },
  scrollContent: { paddingBottom: 40 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },

  // hero
  heroWrap: { width: '100%', aspectRatio: 4 / 3, backgroundColor: '#E5E7EB' },
  heroImg: { width: '100%', height: '100%' },
  heroEmpty: { alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F3F4F6' },
  heroEmptyText: { fontSize: 13, color: '#9CA3AF' },

  // body
  bodyWrap: { paddingHorizontal: 16, marginTop: -20 },
  bodyCard: {
    backgroundColor: '#ffffff', borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: '#F3F4F6',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  plantName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  metaInfoRow: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 4, marginTop: 6 },
  metaInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaInfoText: { fontSize: 12, color: '#6B7280' },
  tagColumn: { alignItems: 'flex-end', gap: 6 },
  typeTag: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  typeTagText: { fontSize: 12, fontWeight: '600' },
  aiTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F5F3FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
  },
  aiTagText: { color: '#7C3AED', fontSize: 10, fontWeight: '600' },

  // AI diagnosis
  aiCard: {
    marginTop: 16, padding: 14, borderRadius: 16,
    backgroundColor: 'rgba(237, 233, 254, 0.4)',
    borderWidth: 1, borderColor: '#EDE9FE',
  },
  aiCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  aiCardTitle: { fontSize: 13, fontWeight: '700', color: '#6D28D9' },
  aiSubtitle: { fontSize: 13, color: '#5B21B6', marginBottom: 6, lineHeight: 19 },
  aiDetails: { fontSize: 13, color: '#4B5563', lineHeight: 20 },
  aiResultBox: {
    marginTop: 10, padding: 10, borderRadius: 12,
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#EDE9FE',
  },
  aiResultLabel: { fontSize: 11, fontWeight: '700', color: '#7C3AED', marginBottom: 4 },
  aiResultText: { fontSize: 13, color: '#374151', lineHeight: 20 },

  // note
  noteSection: { marginTop: 16 },
  noteLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 8 },
  noteText: { fontSize: 15, color: '#1F2937', lineHeight: 24 },

  footerHint: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  footerHintText: { fontSize: 11, color: '#9CA3AF' },

  // nav row
  navRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  navBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6',
    padding: 12,
  },
  navBtnRight: { justifyContent: 'flex-end' },
  navBtnDisabled: { opacity: 0.4 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#9CA3AF' },
  navValue: { fontSize: 12, fontWeight: '500', color: '#374151', marginTop: 2 },

  // delete button
  deleteBtn: {
    marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 16,
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#FECACA',
  },
  deleteBtnText: { fontSize: 14, fontWeight: '600', color: '#DC2626' },

  // not found
  notFoundCircle: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#ffffff',
    borderWidth: 1, borderColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  notFoundTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 4 },
  notFoundDesc: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  primaryBtn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, backgroundColor: '#3a7d44' },
  primaryBtnText: { color: '#ffffff', fontWeight: '600' },

  // lightbox
  lightbox: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  lightboxClose: {
    position: 'absolute', top: 40, right: 20, zIndex: 2,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center',
  },

  // delete modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 360, backgroundColor: '#ffffff', borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  modalIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827', flexShrink: 1 },
  modalBody: { fontSize: 14, color: '#4B5563', lineHeight: 20, marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 8 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalCancelBtn: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E5E7EB' },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  modalConfirmBtn: { backgroundColor: '#DC2626' },
  modalConfirmText: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
});
