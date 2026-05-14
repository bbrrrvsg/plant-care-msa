import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import { Sprout, User, EyeOff, Eye, X, Check } from 'lucide-react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

import { authApi, setAuthData } from '../../services/api';

const googleAccounts = [
  { name: '김플랜트', email: 'kimplant@gmail.com', color: '#4285F4' },
  { name: 'Garden Lover', email: 'gardenlover@gmail.com', color: '#34A853' },
];

export function Login() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stage, setStage] = useState<'choose' | 'consent' | 'loading' | 'success'>('choose');
  const [provider, setProvider] = useState<'google' | 'apple' | null>(null);
  const [userIdError, setUserIdError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const openProvider = (nextProvider: 'google' | 'apple') => {
    setProvider(nextProvider);
    setStage(nextProvider === 'apple' ? 'consent' : 'choose');
    setIsModalOpen(true);
  };

  const handleConsent = () => {
    setStage('loading');
    setTimeout(() => setStage('success'), 1300);
    setTimeout(() => {
      setIsModalOpen(false);
      setStage('choose');
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        })
      );
    }, 2100);
  };

  const validateUserId = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return '아이디를 입력해주세요.';
    if (trimmed.length < 8 || trimmed.length > 20) return '아이디는 8자 이상 20자 이하로 입력해주세요.';
    return '';
  };

  const validatePassword = (value: string) => {
    if (!value.trim()) return '비밀번호를 입력해주세요.';
    if (value.length < 8) return '비밀번호는 8자 이상이어야 합니다.';
    return '';
  };

  const handleLogin = async () => {
    const nextUserIdError = validateUserId(userId);
    const nextPasswordError = validatePassword(password);

    setUserIdError(nextUserIdError);
    setPasswordError(nextPasswordError);

    if (nextUserIdError || nextPasswordError) {
      return;
    }

    setIsSubmitting(true);

    try {
      setUserIdError('');
      setPasswordError('');
      
      const {
      token,
      nickname,
      userId: loggedInUserId,
      } = await authApi.login(userId.trim(), password);

      await setAuthData(token, nickname, loggedInUserId);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        })
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : '로그인에 실패했습니다.';

      if (message.includes('존재하지 않는 아이디')) {
        setUserIdError(message);
      } else if (message.includes('비밀번호가 일치하지 않습니다')) {
        setPasswordError(message);
      } else {
        Alert.alert('로그인 실패', message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex1}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Sprout color="#3a7d44" size={32} />
            </View>
            <Text style={styles.title}>다시 만나서 반가워요</Text>
            <Text style={styles.subtitle}>로그인하고 식물 관리 기록을 이어가세요.</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>아이디</Text>
              <View style={styles.inputWrapper}>
                <User color="#9CA3AF" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="아이디를 입력하세요"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  value={userId}
                  onChangeText={(value) => {
                    setUserId(value);
                    if (userIdError) {
                      setUserIdError(validateUserId(value));
                    }
                  }}
                  onBlur={() => setUserIdError(validateUserId(userId))}
                />
              </View>
              {!!userIdError && <Text style={styles.errorText}>{userIdError}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>비밀번호</Text>
                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={styles.forgotText}>비밀번호 찾기</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder="비밀번호를 입력하세요"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPw}
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    if (passwordError) {
                      setPasswordError(validatePassword(value));
                    }
                  }}
                  onBlur={() => setPasswordError(validatePassword(password))}
                />
                <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeIcon}>
                  {showPw ? <Eye color="#9CA3AF" size={20} /> : <EyeOff color="#9CA3AF" size={20} />}
                </TouchableOpacity>
              </View>
              {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isSubmitting && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.loginButtonText}>로그인</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.socialSection}>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>또는 간편 로그인</Text>
              <View style={styles.dividerLine} />
            </View>
            <View style={styles.socialButtonsRow}>
              <TouchableOpacity style={styles.socialButton} onPress={() => openProvider('google')}>
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialButton, styles.appleButton]} onPress={() => openProvider('apple')}>
                <Text style={[styles.socialButtonText, styles.appleButtonText]}>Apple</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>아직 계정이 없으신가요? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.signupLink}>회원가입</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={isModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {provider === 'google' ? 'Google로 로그인' : 'Apple로 로그인'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <X color="#374151" size={24} />
              </TouchableOpacity>
            </View>

            {stage === 'choose' && (
              <View style={styles.sheetContent}>
                {googleAccounts.map((account, idx) => (
                  <TouchableOpacity key={idx} style={styles.accountItem} onPress={handleConsent}>
                    <View style={[styles.avatar, { backgroundColor: account.color }]}>
                      <Text style={styles.avatarText}>{account.name[0]}</Text>
                    </View>
                    <View>
                      <Text style={styles.accName}>{account.name}</Text>
                      <Text style={styles.accEmail}>{account.email}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {stage === 'consent' && (
              <View style={styles.sheetContent}>
                <Text style={styles.consentText}>간편 로그인을 계속하려면 접근 권한에 동의해주세요.</Text>
                <TouchableOpacity style={styles.consentButton} onPress={handleConsent}>
                  <Text style={styles.consentButtonText}>계속하기</Text>
                </TouchableOpacity>
              </View>
            )}

            {stage === 'loading' && (
              <View style={[styles.sheetContent, styles.center]}>
                <ActivityIndicator size="large" color="#3a7d44" />
                <Text style={styles.loadingText}>로그인 중...</Text>
              </View>
            )}

            {stage === 'success' && (
              <View style={[styles.sheetContent, styles.center]}>
                <View style={styles.successBadge}>
                  <Check color="#ffffff" size={32} />
                </View>
                <Text style={styles.successText}>로그인 완료</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: { padding: 24, paddingBottom: 40 },
  logoSection: { alignItems: 'center', marginTop: 40, marginBottom: 48 },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  formContainer: { gap: 20 },
  inputGroup: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  forgotText: { fontSize: 12, color: '#3a7d44', fontWeight: '500' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 12 },
  textInput: { flex: 1, height: 56, fontSize: 16, color: '#111827' },
  eyeIcon: { padding: 8 },
  errorText: { marginTop: 8, color: '#D14343', fontSize: 12, fontWeight: '500' },
  loginButton: {
    backgroundColor: '#2d5a27',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: { opacity: 0.7 },
  loginButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  socialSection: { marginTop: 32 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { fontSize: 12, color: '#9CA3AF' },
  socialButtonsRow: { flexDirection: 'row', gap: 12 },
  socialButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  appleButton: { backgroundColor: '#000000', borderColor: '#000000' },
  appleButtonText: { color: '#ffffff' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
  footerText: { fontSize: 14, color: '#6B7280' },
  signupLink: { fontSize: 14, color: '#3a7d44', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    minHeight: 350,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  sheetContent: { gap: 16 },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#ffffff', fontWeight: '700' },
  accName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  accEmail: { fontSize: 13, color: '#6B7280' },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 16, color: '#6B7280' },
  successBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3a7d44',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successText: { fontSize: 18, fontWeight: '700', color: '#2E7D32' },
  consentText: { fontSize: 14, color: '#4B5563', textAlign: 'center', marginBottom: 20 },
  consentButton: {
    backgroundColor: '#3a7d44',
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consentButtonText: { color: '#ffffff', fontWeight: '600' },
});
