import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, Alert, StatusBar,
  ActivityIndicator, Image,
} from 'react-native';
import { ArrowLeft, Leaf, Check, Camera, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import {
  growthLogApi, plantApi, getUserId,
  MyPlantItem,
} from '../../services/api';

const entryTypes = [
  { id: 'growth',   label: '성장 기록', color: '#3a7d44' },
  { id: 'care',     label: '일상 관리', color: '#0ea5e9' },
  { id: 'watering', label: '물주기',   color: '#0284c7' },
  { id: 'repot',    label: '분갈이',   color: '#a16207' },
  { id: 'bloom',    label: '개화',     color: '#db2777' },
  { id: 'issue',    label: '이상 증상', color: '#dc2626' },
];

export function DiaryWrite() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [plants, setPlants] = useState<MyPlantItem[]>([]);
  const [plantsLoading, setPlantsLoading] = useState(true);
  const [plantsError, setPlantsError] = useState<string | null>(null);

  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(null);
  const [type, setType] = useState(entryTypes[0].id);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요해요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
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
          if (data.length > 0) setSelectedPlantId(data[0].myPlantId);
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
  }, []);

  const canSubmit = note.trim().length > 0 && selectedPlantId != null;

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;
    if (selectedPlantId == null) {
      Alert.alert('오류', '식물을 선택해주세요.');
      return;
    }

    const selectedTypeLabel = entryTypes.find((t) => t.id === type)?.label ?? '성장 기록';
    const finalTitle = title.trim() || `${selectedTypeLabel} 기록`;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await growthLogApi.writeWithImage(
        {
          plantId: selectedPlantId,
          title: finalTitle,
          content: note,
          type: selectedTypeLabel,
        },
        imageUri,
      );

      Alert.alert('성공', '기록이 저장되었습니다.', [
        {
          text: '확인',
          onPress: () => navigation.navigate('MainTabs', { screen: 'Diary' }),
        },
      ]);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : '저장에 실패했어요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={s.appBar}>
        <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#374151" size={24} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>새 기록 쓰기</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={s.container} contentContainerStyle={s.scroll}>

          {/* 사진 */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>사진</Text>
            {imageUri ? (
              <View style={s.photoPreviewWrap}>
                <Image source={{ uri: imageUri }} style={s.photoPreview} />
                <TouchableOpacity
                  style={s.photoRemoveBtn}
                  onPress={() => setImageUri(null)}
                  accessibilityLabel="사진 제거"
                >
                  <X color="#ffffff" size={16} />
                </TouchableOpacity>
                <TouchableOpacity style={s.photoChangeBtn} onPress={pickImage}>
                  <Camera color="#ffffff" size={14} />
                  <Text style={s.photoChangeText}>변경</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={s.photoEmpty} onPress={pickImage} activeOpacity={0.85}>
                <View style={s.photoIconCircle}>
                  <Camera color="#3a7d44" size={22} />
                </View>
                <Text style={s.photoEmptyTitle}>오늘의 식물 모습 담기</Text>
                <Text style={s.photoEmptyHint}>JPG, PNG 최대 10MB</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 제목 (선택) */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>제목 (선택)</Text>
            <View style={s.dtWrapper}>
              <TextInput
                style={s.dtInput}
                placeholder="비워두면 자동 생성됩니다"
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
                maxLength={50}
              />
            </View>
          </View>

          {/* 식물 선택 */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>어떤 식물의 기록인가요?</Text>
            {plantsLoading ? (
              <View style={s.inlineLoading}>
                <ActivityIndicator size="small" color="#3a7d44" />
              </View>
            ) : plantsError && plants.length === 0 ? (
              <Text style={s.errorText}>{plantsError}</Text>
            ) : plants.length === 0 ? (
              <View style={s.emptyBox}>
                <Text style={s.emptyText}>등록된 식물이 없어요</Text>
                <TouchableOpacity
                  style={s.emptyBtn}
                  onPress={() => navigation.navigate('AddPlant')}
                >
                  <Text style={s.emptyBtnText}>식물 등록하기</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hScroll}>
                {plants.map((p) => {
                  const active = selectedPlantId === p.myPlantId;
                  return (
                    <TouchableOpacity
                      key={p.myPlantId}
                      onPress={() => setSelectedPlantId(p.myPlantId)}
                      style={[s.plantChip, active && s.plantChipActive]}
                    >
                      <Text style={s.plantEmoji}>🪴</Text>
                      <Text style={[s.plantChipText, active && s.plantChipTextActive]}>
                        {p.nickname}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* 기록 종류 */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>기록 종류</Text>
            <View style={s.typeGrid}>
              {entryTypes.map((t) => {
                const active = type === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => setType(t.id)}
                    style={[s.typeChip, active && { backgroundColor: t.color, borderColor: t.color }]}
                  >
                    {active && <Check color="#ffffff" size={14} style={{ marginRight: 4 }} />}
                    <Text style={[s.typeChipText, active && { color: '#ffffff' }]}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 내용 */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>내용</Text>
            <View style={[s.taWrapper, note.length > 0 && s.taActive]}>
              <TextInput
                style={s.ta}
                placeholder="식물의 상태나 해주고 싶은 말을 적어보세요..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={note}
                onChangeText={(t) => { if (t.length <= 500) setNote(t); }}
              />
            </View>
            <View style={s.taFooter}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Leaf color="#7CCB8A" size={12} />
                <Text style={s.hint}> 작은 변화도 소중한 기록이 돼요</Text>
              </View>
              <Text style={s.hint}>{note.length}/500</Text>
            </View>
          </View>

        </ScrollView>

        <View style={s.bottomBar}>
          {submitError && (
            <View style={s.errorBox}>
              <Text style={s.errorBoxText}>{submitError}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[s.submitBtn, (!canSubmit || isSubmitting) && s.submitDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={[s.submitText, !canSubmit && { color: '#9CA3AF' }]}>
                기록 저장하기
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  appBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 12, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  iconBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  container: { flex: 1, backgroundColor: '#ffffff' },
  scroll: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 12 },
  hScroll: { gap: 12, paddingRight: 20 },
  plantChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#F9FAFB', borderWidth: 2, borderColor: 'transparent', borderRadius: 20, marginRight: 10 },
  plantChipActive: { backgroundColor: '#F0FDF4', borderColor: '#7CCB8A' },
  plantEmoji: { fontSize: 16, marginRight: 8 },
  plantChipText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  plantChipTextActive: { color: '#2E7D32', fontWeight: '600' },
  inlineLoading: { paddingVertical: 16, alignItems: 'flex-start' },
  emptyBox: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 20, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14, color: '#6B7280' },
  emptyBtn: { backgroundColor: '#3a7d44', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  emptyBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  errorText: { fontSize: 13, color: '#B91C1C' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 20, marginRight: 8, marginBottom: 8 },
  typeChipText: { fontSize: 14, fontWeight: '500', color: '#4B5563' },
  dtWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, paddingHorizontal: 16, height: 48 },
  dtInput: { flex: 1, fontSize: 15, color: '#111827' },
  taWrapper: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 20, padding: 16 },
  taActive: { backgroundColor: '#ffffff', borderColor: '#7CCB8A' },
  ta: { fontSize: 15, color: '#111827', minHeight: 120 },
  taFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingHorizontal: 4 },
  hint: { fontSize: 12, color: '#9CA3AF' },
  bottomBar: { backgroundColor: 'rgba(245,245,240,0.95)', borderTopWidth: 1, borderTopColor: 'rgba(229,231,235,0.6)', paddingHorizontal: 20, paddingVertical: 16 },
  errorBox: { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1, padding: 12, borderRadius: 12, marginBottom: 12 },
  errorBoxText: { color: '#B91C1C', fontSize: 13 },
  submitBtn: { backgroundColor: '#2d5a27', paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  submitDisabled: { backgroundColor: '#E5E7EB' },
  submitText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },

  // 사진 섹션
  photoEmpty: {
    alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 32, paddingHorizontal: 16,
    backgroundColor: '#F9FAFB', borderRadius: 20,
    borderWidth: 2, borderStyle: 'dashed', borderColor: '#D1D5DB',
  },
  photoIconCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(124,203,138,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  photoEmptyTitle: { fontSize: 15, fontWeight: '600', color: '#374151' },
  photoEmptyHint: { fontSize: 12, color: '#7CCB8A', fontWeight: '500' },
  photoPreviewWrap: { position: 'relative', borderRadius: 20, overflow: 'hidden', backgroundColor: '#E5E7EB' },
  photoPreview: { width: '100%', aspectRatio: 4 / 3 },
  photoRemoveBtn: {
    position: 'absolute', top: 10, right: 10,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  photoChangeBtn: {
    position: 'absolute', bottom: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  photoChangeText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
});
