import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  SafeAreaView, Dimensions, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Sprout } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

const { width } = Dimensions.get('window');

const slides = [
  {
    image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800',
    title: '실시간 정원 모니터링',
    desc: 'ESP32 센서로 식물의 온도, 습도, 토양 수분을 실시간으로 확인하세요.',
  },
  {
    image: 'https://images.unsplash.com/photo-1592150621344-82841b993389?w=800',
    title: '똑똑한 AI 건강 진단',
    desc: '사진 한 장으로 식물의 병해충을 진단하고 전문적인 케어 가이드를 받으세요.',
  },
  {
    image: 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=800',
    title: '나만의 식물 성장 일기',
    desc: '식물의 모든 성장 순간을 기록하고 타임라인으로 감상하세요.',
  },
  {
    image: 'https://images.unsplash.com/photo-1512428813833-df4dc197732d?w=800',
    title: '함께 초록빛\n일상을 만들어요',
    desc: '지금 SPPKL과 함께 당신의 디지털 온실을 시작해보세요.',
  },
];

export function Onboarding() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [current, setCurrent] = useState(0);
  const isLast = current === slides.length - 1;
  const slide = slides[current];

  return (
    <View style={styles.flex1}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={['#e8f5e9', '#ffffff']} style={styles.background} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Sprout color="#3a7d44" size={24} />
            <Text style={styles.logoText}>PlantCare</Text>
          </View>
          {!isLast && (
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.skipText}>건너뛰기</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.imageCard}>
            <Image source={{ uri: slide.image }} style={styles.heroImage} resizeMode="cover" />
            <LinearGradient
              colors={['rgba(0,0,0,0.15)', 'transparent']}
              style={[styles.absolute, { height: '33%' }]}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.75)']}
              style={[styles.absolute, { top: '33%', height: '67%' }]}
            />
            <View style={styles.titleOverlay}>
              <Text style={styles.slideTitle}>{slide.title}</Text>
            </View>
          </View>

          {/* Dots */}
          <View style={styles.dotsContainer}>
            {slides.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === current ? styles.dotActive : styles.dotInactive]}
              />
            ))}
          </View>

          <Text style={styles.slideDesc}>{slide.desc}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.mainButton}
            activeOpacity={0.9}
            onPress={() => isLast ? navigation.navigate('Login') : setCurrent(current + 1)}
          >
            <Text style={styles.mainButtonText}>{isLast ? '시작하기' : '다음'}</Text>
            <ArrowRight color="#ffffff" size={20} />
          </TouchableOpacity>

          {current === 0 ? (
            <View style={styles.loginRow}>
              <Text style={styles.loginHint}>이미 계정이 있으신가요? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>로그인</Text>
              </TouchableOpacity>
            </View>
          ) : isLast ? (
            <Text style={styles.versionText}>PlantCare · v1.0</Text>
          ) : (
            <View style={styles.spacer} />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  background: { ...StyleSheet.absoluteFillObject },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { color: '#3a7d44', fontSize: 18, fontWeight: '700' },
  skipText: { color: '#6B7280', fontSize: 14 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  imageCard: {
    width: '100%',
    maxWidth: 320,
    aspectRatio: 4 / 5,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
    marginBottom: 32,
  },
  heroImage: { width: '100%', height: '100%' },
  absolute: { position: 'absolute', left: 0, right: 0, top: 0 },
  titleOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24 },
  slideTitle: { fontSize: 28, fontWeight: '800', color: '#ffffff', lineHeight: 36 },
  dotsContainer: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  dot: { height: 10, borderRadius: 5 },
  dotActive: { width: 24, backgroundColor: '#3a7d44' },
  dotInactive: { width: 10, backgroundColor: '#D1D5DB' },
  slideDesc: { textAlign: 'center', color: '#4B5563', fontSize: 15, lineHeight: 22, maxWidth: 280 },
  footer: { paddingHorizontal: 24, paddingBottom: 32, gap: 16 },
  mainButton: {
    flexDirection: 'row',
    backgroundColor: '#2d5a27',
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mainButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  loginHint: { color: '#6B7280', fontSize: 14 },
  loginLink: { color: '#3a7d44', fontSize: 14, fontWeight: '600' },
  versionText: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: 8 },
  spacer: { height: 24 },
});
