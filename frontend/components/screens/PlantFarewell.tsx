import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
  TextInput, Platform, StatusBar, ActivityIndicator, Alert, Animated, Easing,
  KeyboardAvoidingView,
} from 'react-native';
import {
  ArrowLeft, Heart, Check, Home, Truck, Gift, Cloud, MoreHorizontal,
} from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { plantApi, growthLogApi, getUserId } from '../../services/api';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800';

type FarewellReason = 'moved' | 'rehomed' | 'withered' | 'other';
type Step = 'intro' | 'reason' | 'message' | 'ceremony' | 'done';

const reasonOptions: { id: FarewellReason; icon: any; label: string; hint: string }[] = [
  { id: 'moved',    icon: Truck,            label: '이사·환경 변화', hint: '이사·계절 변화로 함께하기 어려워졌어요' },
  { id: 'rehomed',  icon: Gift,             label: '새 가족을 찾아서', hint: '더 잘 돌봐줄 누군가에게 보냈어요' },
  { id: 'withered', icon: Cloud,            label: '먼저 떠났어요',   hint: '최선을 다했지만 시들었어요' },
  { id: 'other',    icon: MoreHorizontal,   label: '기타 이유',        hint: '그 밖의 이유로 떠나보내요' },
];

const reasonLabel = (r?: string | null) =>
  reasonOptions.find((o) => o.id === r)?.label ?? '추억';

// 보관함 표시용 과거형 라벨 (의식 선택지와 별개)
const reasonArchiveLabel = (r?: string | null) => {
  switch (r) {
    case 'moved':    return '이사로 떠나보냄';
    case 'rehomed':  return '새 가족에게 보냄';
    case 'withered': return '시들어 떠나보냄';
    case 'other':    return '다른 이유로 떠나보냄';
    default:         return '추억으로 남김';
  }
};

function daysSinceISO(iso?: string) {
  if (!iso) return 0;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}

export function PlantFarewell() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'PlantFarewell'>>();
  const { plantId, nickname, plantName, imageUrl, registeredAt } = route.params;

  const [step, setStep] = useState<Step>('intro');
  const [reason, setReason] = useState<FarewellReason | null>(null);
  const [message, setMessage] = useState('');
  const [recordCount, setRecordCount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const days = useMemo(() => daysSinceISO(registeredAt), [registeredAt]);

  // 기록 수 비동기 로드 (실패해도 0 유지)
  useEffect(() => {
    const userId = getUserId();
    if (userId == null) return;
    growthLogApi
      .getMyLogs(userId)
      .then((logs) => setRecordCount(logs.filter((l) => l.plantId === plantId).length))
      .catch(() => setRecordCount(0));
  }, [plantId]);

  const handleBack = () => {
    if (step === 'intro') navigation.goBack();
    else if (step === 'reason') setStep('intro');
    else if (step === 'message') setStep('reason');
  };

  const startCeremony = async () => {
    if (!reason) return;
    setStep('ceremony');
    setIsSubmitting(true);
    try {
      await plantApi.archive(plantId, { reason, message: message.trim() });
      setIsSubmitting(false);
    } catch (e: any) {
      setIsSubmitting(false);
      Alert.alert(
        '잠시 멈췄어요',
        e?.message ?? '떠나보내기 요청을 처리하지 못했어요. 다시 시도해주세요.',
        [{ text: '돌아가기', onPress: () => setStep('message') }],
      );
    }
  };

  // 의식 단계: 애니메이션 + API 완료 대기
  const handleCeremonyDone = () => {
    if (!isSubmitting) setStep('done');
  };

  // API가 더 빨리 끝나면 isSubmitting=false → ceremony 끝나면 자동 done
  // API가 늦으면 ceremony 애니메이션은 끝났지만 isSubmitting 동안 대기 후 done
  const goMemorial = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          { name: 'MainTabs' },
          { name: 'MemorialArchive' },
        ],
      }),
    );
  };

  const goHome = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      }),
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* AppBar */}
      <View style={styles.appBar}>
        {step !== 'ceremony' && step !== 'done' ? (
          <TouchableOpacity style={styles.iconBtn} onPress={handleBack}>
            <ArrowLeft color="#374151" size={22} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtn} />
        )}
        <Text style={styles.appBarTitle}>FAREWELL</Text>
        <View style={styles.iconBtn} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {step === 'intro' && (
          <IntroStep
            nickname={nickname}
            plantName={plantName}
            imageUrl={imageUrl}
            days={days}
            recordCount={recordCount}
            onContinue={() => setStep('reason')}
            onCancel={() => navigation.goBack()}
          />
        )}

        {step === 'reason' && (
          <ReasonStep
            selected={reason}
            onSelect={setReason}
            onNext={() => setStep('message')}
          />
        )}

        {step === 'message' && (
          <MessageStep
            nickname={nickname}
            imageUrl={imageUrl}
            message={message}
            onChange={setMessage}
            onNext={startCeremony}
          />
        )}

        {step === 'ceremony' && (
          <CeremonyStep
            nickname={nickname}
            imageUrl={imageUrl}
            isSubmitting={isSubmitting}
            onAnimationEnd={handleCeremonyDone}
          />
        )}

        {step === 'done' && (
          <DoneStep
            nickname={nickname}
            imageUrl={imageUrl}
            days={days}
            recordCount={recordCount}
            onMemorial={goMemorial}
            onHome={goHome}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Step Components ────────────────────────────────────

function IntroStep({
  nickname, plantName, imageUrl, days, recordCount, onContinue, onCancel,
}: {
  nickname: string; plantName?: string; imageUrl?: string;
  days: number; recordCount: number;
  onContinue: () => void; onCancel: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.centerCol}>
        <View style={styles.heartCircle}>
          <Heart color="#3a7d44" size={36} fill="#3a7d44" fillOpacity={0.15 as any} />
        </View>
        <Text style={styles.heading}>
          {nickname}을(를){'\n'}떠나보낼 준비가 되셨나요?
        </Text>
        <Text style={styles.subText}>
          삭제 대신 천천히 마음을 정리해요.{'\n'}
          기록은 추억 보관함에 안전하게 남아요.
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <Image source={{ uri: imageUrl || FALLBACK_IMAGE }} style={styles.summaryImage} />
        <View style={styles.summaryBody}>
          <Text style={styles.summaryName}>{nickname}</Text>
          {plantName ? <Text style={styles.summarySpecies}>{plantName}</Text> : null}
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{days}</Text>
              <Text style={styles.statLabel}>함께한 일수</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{recordCount}</Text>
              <Text style={styles.statLabel}>남긴 기록</Text>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onContinue}>
        <Text style={styles.primaryBtnText}>떠나보내기 시작하기</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.ghostBtn} onPress={onCancel}>
        <Text style={styles.ghostBtnText}>조금 더 함께할게요</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function ReasonStep({
  selected, onSelect, onNext,
}: {
  selected: FarewellReason | null;
  onSelect: (r: FarewellReason) => void;
  onNext: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Text style={[styles.heading, { textAlign: 'center' }]}>
        어떤 이유로{'\n'}떠나보내나요?
      </Text>
      <Text style={[styles.subText, { textAlign: 'center' }]}>
        솔직한 마음이 다음 만남을 더 잘 돌봐줘요.
      </Text>

      <View style={{ marginTop: 24, gap: 10 }}>
        {reasonOptions.map((r) => {
          const active = selected === r.id;
          const Icon = r.icon;
          return (
            <TouchableOpacity
              key={r.id}
              onPress={() => onSelect(r.id)}
              style={[styles.reasonCard, active && styles.reasonCardActive]}
              activeOpacity={0.85}
            >
              <View style={[styles.reasonIcon, active && styles.reasonIconActive]}>
                <Icon color={active ? '#ffffff' : '#3a7d44'} size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reasonLabel}>{r.label}</Text>
                <Text style={styles.reasonHint}>{r.hint}</Text>
              </View>
              {active && (
                <View style={styles.checkBadge}>
                  <Check color="#ffffff" size={14} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, !selected && styles.primaryBtnDisabled]}
        onPress={onNext}
        disabled={!selected}
      >
        <Text style={styles.primaryBtnText}>다음</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function MessageStep({
  nickname, imageUrl, message, onChange, onNext,
}: {
  nickname: string; imageUrl?: string;
  message: string; onChange: (v: string) => void; onNext: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <Text style={[styles.heading, { textAlign: 'center' }]}>
        마지막으로{'\n'}한마디 남겨주세요
      </Text>
      <Text style={[styles.subText, { textAlign: 'center' }]}>
        고마운 마음, 미안한 마음, 무엇이든 좋아요.
      </Text>

      <View style={styles.letterCard}>
        <View style={styles.letterHeader}>
          <Image source={{ uri: imageUrl || FALLBACK_IMAGE }} style={styles.letterAvatar} />
          <Text style={styles.letterTo}>To. {nickname}</Text>
        </View>
        <TextInput
          value={message}
          onChangeText={(t) => onChange(t.slice(0, 200))}
          placeholder={`그동안 우리 집을 초록으로 채워줘서 고마웠어요.\n\n잘 가요, ${nickname}.`}
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          style={styles.letterInput}
        />
        <View style={styles.letterFooter}>
          <Text style={styles.letterCount}>{message.length}/200</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onNext}>
        <Text style={styles.primaryBtnText}>편지 보내기</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.ghostBtn} onPress={onNext}>
        <Text style={styles.ghostBtnText}>마음으로 보내기</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function CeremonyStep({
  nickname, imageUrl, isSubmitting, onAnimationEnd,
}: {
  nickname: string; imageUrl?: string; isSubmitting: boolean; onAnimationEnd: () => void;
}) {
  const pulse = useRef(new Animated.Value(1)).current;
  const petals = useRef(
    Array.from({ length: 14 }).map(() => ({
      translateY: new Animated.Value(0),
      opacity: new Animated.Value(0),
      rotate: new Animated.Value(0),
    })),
  ).current;
  const [animDone, setAnimDone] = useState(false);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.05, duration: 1200, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulse, { toValue: 1.0,  duration: 1200, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ]),
    ).start();

    petals.forEach((p, i) => {
      Animated.parallel([
        Animated.sequence([
          Animated.delay(i * 120),
          Animated.timing(p.opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(p.opacity, { toValue: 0, duration: 1800, useNativeDriver: true, easing: Easing.in(Easing.quad) }),
        ]),
        Animated.sequence([
          Animated.delay(i * 120),
          Animated.timing(p.translateY, { toValue: 500, duration: 2200, useNativeDriver: true, easing: Easing.in(Easing.cubic) }),
        ]),
        Animated.sequence([
          Animated.delay(i * 120),
          Animated.timing(p.rotate, { toValue: 1, duration: 2200, useNativeDriver: true, easing: Easing.linear }),
        ]),
      ]).start();
    });

    const t = setTimeout(() => setAnimDone(true), 2800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (animDone && !isSubmitting) onAnimationEnd();
  }, [animDone, isSubmitting]);

  return (
    <View style={styles.ceremonyContainer}>
      {petals.map((p, i) => (
        <Animated.Text
          key={i}
          pointerEvents="none"
          style={[
            styles.petal,
            {
              left: `${(i * 53) % 100}%`,
              opacity: p.opacity,
              transform: [
                { translateY: p.translateY },
                {
                  rotate: p.rotate.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '420deg'],
                  }),
                },
              ],
            },
          ]}
        >
          🍃
        </Animated.Text>
      ))}

      <Animated.View style={[styles.ceremonyImageWrap, { transform: [{ scale: pulse }] }]}>
        <Image source={{ uri: imageUrl || FALLBACK_IMAGE }} style={styles.ceremonyImage} />
      </Animated.View>
      <Text style={styles.ceremonyTitle}>{nickname}을(를) 보내드리고 있어요…</Text>
      <Text style={styles.ceremonySub}>잘 자요, 추억을 차곡차곡 정리하고 있어요.</Text>

      {isSubmitting && (
        <View style={{ marginTop: 16 }}>
          <ActivityIndicator color="#3a7d44" />
        </View>
      )}
    </View>
  );
}

function DoneStep({
  nickname, imageUrl, days, recordCount, onMemorial, onHome,
}: {
  nickname: string; imageUrl?: string; days: number; recordCount: number;
  onMemorial: () => void; onHome: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.centerCol}>
        <View style={styles.doneCheckCircle}>
          <Check color="#3a7d44" size={28} />
        </View>
        <Text style={styles.heading}>편지가 도착했어요</Text>
        <Text style={styles.subText}>
          {nickname}과(와) 함께한 시간은{'\n'}추억 보관함에 소중히 남겨두었어요.
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <Image source={{ uri: imageUrl || FALLBACK_IMAGE }} style={styles.summaryImage} />
        <View style={styles.summaryBody}>
          <Text style={styles.summaryName}>{nickname}</Text>
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{days}일</Text>
              <Text style={styles.statLabel}>함께한 시간</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{recordCount}개</Text>
              <Text style={styles.statLabel}>남긴 기록</Text>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onMemorial}>
        <Text style={styles.primaryBtnText}>추억 보관함 열어보기</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.outlineBtn} onPress={onHome}>
        <Home color="#4B5563" size={16} />
        <Text style={styles.outlineBtnText}>홈으로 돌아가기</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f0' },
  appBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 12,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  appBarTitle: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', letterSpacing: 2 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  centerCol: { alignItems: 'center' },
  heartCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#ffffff',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(124,203,138,0.3)',
    marginBottom: 16,
  },
  heading: {
    fontSize: 22, fontWeight: '800', color: '#111827',
    textAlign: 'center', lineHeight: 30, marginTop: 4,
  },
  subText: {
    fontSize: 13, color: '#6B7280', textAlign: 'center',
    marginTop: 10, lineHeight: 20,
  },

  summaryCard: {
    marginTop: 24, backgroundColor: '#ffffff', borderRadius: 24,
    overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6',
  },
  summaryImage: { width: '100%', height: 170 },
  summaryBody: { padding: 18 },
  summaryName: { fontSize: 17, fontWeight: '700', color: '#111827' },
  summarySpecies: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  statRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  statBox: {
    flex: 1, backgroundColor: '#f5f5f0', borderRadius: 16,
    paddingVertical: 12, alignItems: 'center',
  },
  statNum: { fontSize: 18, fontWeight: '700', color: '#3a7d44' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },

  reasonCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 18,
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#F3F4F6',
  },
  reasonCardActive: {
    backgroundColor: 'rgba(124,203,138,0.15)',
    borderColor: '#7CCB8A',
  },
  reasonIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#f5f5f0', alignItems: 'center', justifyContent: 'center',
  },
  reasonIconActive: { backgroundColor: '#3a7d44' },
  reasonLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },
  reasonHint: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  checkBadge: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#3a7d44',
    alignItems: 'center', justifyContent: 'center',
  },

  letterCard: {
    marginTop: 24, backgroundColor: '#ffffff', borderRadius: 24,
    padding: 18, borderWidth: 1, borderColor: '#F3F4F6',
  },
  letterHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  letterAvatar: { width: 36, height: 36, borderRadius: 18 },
  letterTo: { fontSize: 14, fontWeight: '600', color: '#111827' },
  letterInput: {
    fontSize: 14, color: '#374151', lineHeight: 22,
    minHeight: 130, padding: 0,
  },
  letterFooter: { alignItems: 'flex-end', marginTop: 8 },
  letterCount: { fontSize: 11, color: '#9CA3AF' },

  primaryBtn: {
    marginTop: 24, backgroundColor: '#3a7d44',
    paddingVertical: 16, borderRadius: 18, alignItems: 'center',
  },
  primaryBtnDisabled: { backgroundColor: '#D1D5DB' },
  primaryBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  ghostBtn: { marginTop: 8, paddingVertical: 12, alignItems: 'center' },
  ghostBtnText: { color: '#6B7280', fontSize: 13 },
  outlineBtn: {
    marginTop: 8, flexDirection: 'row', gap: 6,
    paddingVertical: 14, borderRadius: 18,
    borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  outlineBtnText: { color: '#4B5563', fontWeight: '600', fontSize: 14 },

  ceremonyContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 20, position: 'relative', overflow: 'hidden',
  },
  petal: { position: 'absolute', top: -20, fontSize: 22 },
  ceremonyImageWrap: {
    width: 160, height: 160, borderRadius: 80, overflow: 'hidden',
    borderWidth: 4, borderColor: '#ffffff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  ceremonyImage: { width: '100%', height: '100%' },
  ceremonyTitle: { fontSize: 16, fontWeight: '700', color: '#111827', textAlign: 'center', marginTop: 24 },
  ceremonySub: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 8 },

  doneCheckCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(124,203,138,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
});

export { reasonLabel, reasonArchiveLabel };
