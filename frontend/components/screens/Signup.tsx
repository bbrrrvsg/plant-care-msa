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
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Leaf, ArrowRight, User, Mail, Lock, IdCard } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

import { authApi } from '../../services/api';

export function Signup() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [userId, setUserId] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userIdError, setUserIdError] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateUserId = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return '아이디를 입력해주세요.';
    if (trimmed.length < 8 || trimmed.length > 20) return '아이디는 8자 이상 20자 이하로 입력해주세요.';
    return '';
  };

  const validateNickname = (value: string) => {
    if (!value.trim()) return '닉네임을 입력해주세요.';
    return '';
  };

  const validateEmail = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return '이메일을 입력해주세요.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) return '올바른 이메일 형식을 입력해주세요.';
    return '';
  };

  const validatePassword = (value: string) => {
    if (!value.trim()) return '비밀번호를 입력해주세요.';
    if (value.length < 8) return '비밀번호는 8자 이상이어야 합니다.';
    return '';
  };

  const handleSignup = async () => {
    const nextUserIdError = validateUserId(userId);
    const nextNicknameError = validateNickname(nickname);
    const nextEmailError = validateEmail(email);
    const nextPasswordError = validatePassword(password);

    setUserIdError(nextUserIdError);
    setNicknameError(nextNicknameError);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);

    if (nextUserIdError || nextNicknameError || nextEmailError || nextPasswordError) {
      return;
    }

    setIsSubmitting(true);

    try {
      await authApi.signup(userId.trim(), nickname.trim(), email.trim(), password);
      navigation.navigate('Login');
    } catch (error) {
      const message = error instanceof Error ? error.message : '회원가입에 실패했습니다.';

      if (message.includes('이미 사용 중인 아이디')) {
        setUserIdError(message);
      } else if (message.includes('이미 사용 중인 닉네임')) {
        setNicknameError(message);
      } else {
        Alert.alert('회원가입 실패', message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.flex1}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={['#e8f5e9', '#ffffff']} style={styles.background} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex1}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.logoSection}>
              <View style={styles.logoCircle}>
                <Leaf color="#3a7d44" size={32} />
              </View>
              <Text style={styles.title}>계정을 만들어보세요</Text>
              <Text style={styles.subtitle}>회원가입 후 식물 관리 기록을 시작할 수 있어요.</Text>
            </View>

            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>아이디</Text>
                <View style={styles.inputWrapper}>
                  <IdCard color="#9CA3AF" size={20} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="8자 이상 20자 이하"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                    value={userId}
                    onChangeText={(value) => {
                      setUserId(value);
                      setUserIdError(validateUserId(value));
                    }}
                    onBlur={() => setUserIdError(validateUserId(userId))}
                  />
                </View>
                {!!userIdError && <Text style={styles.errorText}>{userIdError}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>닉네임</Text>
                <View style={styles.inputWrapper}>
                  <User color="#9CA3AF" size={20} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="닉네임을 입력하세요"
                    placeholderTextColor="#9CA3AF"
                    value={nickname}
                    onChangeText={(value) => {
                      setNickname(value);
                      if (nicknameError) {
                        setNicknameError(validateNickname(value));
                      }
                    }}
                    onBlur={() => setNicknameError(validateNickname(nickname))}
                  />
                </View>
                {!!nicknameError && <Text style={styles.errorText}>{nicknameError}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>이메일</Text>
                <View style={styles.inputWrapper}>
                  <Mail color="#9CA3AF" size={20} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="name@example.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={(value) => {
                      setEmail(value);
                      if (emailError) {
                        setEmailError(validateEmail(value));
                      }
                    }}
                    onBlur={() => setEmailError(validateEmail(email))}
                  />
                </View>
                {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>비밀번호</Text>
                <View style={styles.inputWrapper}>
                  <Lock color="#9CA3AF" size={20} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="비밀번호를 입력하세요"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                    value={password}
                    onChangeText={(value) => {
                      setPassword(value);
                      if (passwordError) {
                        setPasswordError(validatePassword(value));
                      }
                    }}
                    onBlur={() => setPasswordError(validatePassword(password))}
                  />
                </View>
                {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
                {!passwordError && <Text style={styles.helperText}>비밀번호는 8자 이상이어야 합니다.</Text>}
              </View>

              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSignup}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>회원가입</Text>
                    <ArrowRight color="#ffffff" size={20} />
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>이미 계정이 있으신가요? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>로그인</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  background: { ...StyleSheet.absoluteFillObject },
  safeArea: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 40, paddingBottom: 60 },
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 24,
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 32,
  },
  inputGroup: { marginBottom: 4 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
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
  helperText: { fontSize: 12, color: '#9CA3AF', marginTop: 8 },
  errorText: { marginTop: 8, color: '#D14343', fontSize: 12, fontWeight: '500' },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#2d5a27',
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { fontSize: 14, color: '#6B7280' },
  loginLink: { fontSize: 14, color: '#3a7d44', fontWeight: '700' },
});
