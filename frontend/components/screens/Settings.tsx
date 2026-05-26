import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Platform, StatusBar, Modal, Image, Alert, ActivityIndicator,
} from 'react-native';
import {
  ArrowLeft, ChevronRight, Bell, Shield, Smartphone,
  Camera, Wifi, HelpCircle, FileText, Trash2, LogOut,
  Sprout, Mail, Pencil, X, Heart,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

import {
  clearAuthData, getLoginId, getNickname, resolveAssetUrl, userApi, UserProfile,
} from '../../services/api';

// ─── Custom Toggle ────────────────────────────────────────
function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onToggle}
      style={[styles.toggleContainer, enabled ? styles.toggleOn : styles.toggleOff]}
    >
      <View style={[styles.toggleCircle, enabled ? styles.circleOn : styles.circleOff]} />
    </TouchableOpacity>
  );
}

// ─── ConfirmModal ─────────────────────────────────────────
interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  desc: string;
  confirmLabel: string;
  confirmColor?: string;
  icon: React.ComponentType<{ color: string; size: number }>;
}
function ConfirmModal({ visible, onClose, onConfirm, title, desc, confirmLabel, confirmColor = '#3a7d44', icon: Icon }: ConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetContent}>
            <View style={[styles.modalIconCircle, { backgroundColor: confirmColor === '#EF4444' ? '#FEF2F2' : '#F0FDF4' }]}>
              <Icon color={confirmColor} size={28} />
            </View>
            <Text style={styles.modalTitle}>{title}</Text>
            <Text style={styles.modalDesc}>{desc}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmButton, { backgroundColor: confirmColor }]} onPress={onConfirm}>
                <Text style={styles.confirmButtonText}>{confirmLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── SettingItem ──────────────────────────────────────────
type SettingItemProps = {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  value?: string;
  onPress?: () => void;
  isToggle?: boolean;
  enabled?: boolean;
  onToggle?: () => void;
  isDestructive?: boolean;
};
function SettingItem({ icon: Icon, label, value, onPress, isToggle = false, enabled = false, onToggle = () => {}, isDestructive = false }: SettingItemProps) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} disabled={isToggle}>
      <View style={styles.settingLeft}>
        <View style={[styles.iconBox, isDestructive && styles.destructiveIconBox]}>
          <Icon size={20} color={isDestructive ? '#EF4444' : '#4B5563'} />
        </View>
        <Text style={[styles.settingLabel, isDestructive && styles.destructiveText]}>{label}</Text>
      </View>
      {isToggle ? (
        <Toggle enabled={enabled} onToggle={onToggle} />
      ) : (
        <View style={styles.settingRight}>
          {value && <Text style={styles.settingValue}>{value}</Text>}
          <ChevronRight size={18} color="#9CA3AF" />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────
export function Settings() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [waterReminder, setWaterReminder] = useState(true);
  const [sensorAlert, setSensorAlert] = useState(true);
  const [cameraPermission, setCameraPermission] = useState(true);
  const [wifiPermission, setWifiPermission] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fallbackNickname = getNickname() || '플랜터';
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      const loginId = getLoginId();
      if (!loginId) return;
      userApi
        .getByLoginId(loginId)
        .then((data) => {
          if (!cancelled) setProfile(data);
        })
        .catch((err) => {
          console.warn('프로필 조회 실패:', err);
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const pickAndUploadProfileImage = async (loginId: string) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('권한 필요', '프로필 사진을 변경하려면 사진 접근 권한이 필요합니다.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;

      setIsUploadingProfile(true);
      const updated = await userApi.uploadProfileImage(loginId, result.assets[0].uri);
      setProfile(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : '프로필 사진 변경에 실패했어요.';
      Alert.alert('업로드 실패', message);
    } finally {
      setIsUploadingProfile(false);
    }
  };

  const removeProfileImage = async (loginId: string) => {
    try {
      setIsUploadingProfile(true);
      const updated = await userApi.removeProfileImage(loginId);
      setProfile(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : '프로필 사진 삭제에 실패했어요.';
      Alert.alert('삭제 실패', message);
    } finally {
      setIsUploadingProfile(false);
    }
  };

  const handleAvatarPress = () => {
    const loginId = getLoginId();
    if (!loginId) {
      Alert.alert('로그인이 필요합니다', '다시 로그인 후 시도해 주세요.');
      return;
    }
    const hasImage = !!profile?.profileImageUrl;
    const buttons: Array<{ text: string; style?: 'cancel' | 'destructive' | 'default'; onPress?: () => void }> = [
      { text: '사진 선택', onPress: () => pickAndUploadProfileImage(loginId) },
    ];
    if (hasImage) {
      buttons.push({
        text: '기본 이미지로 되돌리기',
        style: 'destructive',
        onPress: () => removeProfileImage(loginId),
      });
    }
    buttons.push({ text: '취소', style: 'cancel' });
    Alert.alert('프로필 사진', undefined, buttons);
  };

  const displayNickname = profile?.nickname || fallbackNickname;
  const displayEmail = profile?.email || '';
  const avatarUrl = resolveAssetUrl(profile?.profileImageUrl);
  const avatarInitial = (displayNickname || 'P').trim().charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* AppBar */}
      <View style={styles.appBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#374151" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>환경설정</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>

        {/* Profile */}
        <View style={styles.profileCard}>
          <View style={styles.profileInfo}>
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={handleAvatarPress}
              activeOpacity={0.8}
              disabled={isUploadingProfile}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitial}>{avatarInitial}</Text>
                </View>
              )}
              <View style={styles.editBadge}>
                {isUploadingProfile ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Pencil size={12} color="#ffffff" />
                )}
              </View>
            </TouchableOpacity>
            <View style={styles.profileText}>
              <Text style={styles.userName}>{displayNickname} 집사님</Text>
              {displayEmail ? (
                <View style={styles.userEmailRow}>
                  <Mail size={14} color="#6B7280" />
                  <Text style={styles.userEmail}>{displayEmail}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Notifications */}
        <Text style={styles.sectionTitle}>알림 및 미리알림</Text>
        <View style={styles.sectionList}>
          <SettingItem icon={Bell} label="푸시 알림" isToggle enabled={pushEnabled} onToggle={() => setPushEnabled(!pushEnabled)} />
          <SettingItem icon={Sprout} label="물주기 알림" isToggle enabled={waterReminder} onToggle={() => setWaterReminder(!waterReminder)} />
          <SettingItem icon={Shield} label="센서 이상 경고" isToggle enabled={sensorAlert} onToggle={() => setSensorAlert(!sensorAlert)} />
        </View>

        {/* Permissions */}
        <Text style={styles.sectionTitle}>앱 권한 설정</Text>
        <View style={styles.sectionList}>
          <SettingItem icon={Camera} label="카메라 접근" isToggle enabled={cameraPermission} onToggle={() => setCameraPermission(!cameraPermission)} />
          <SettingItem icon={Wifi} label="Wi-Fi 및 네트워크" isToggle enabled={wifiPermission} onToggle={() => setWifiPermission(!wifiPermission)} />
        </View>

        {/* Memorial */}
        <Text style={styles.sectionTitle}>추억</Text>
        <View style={styles.sectionList}>
          <SettingItem
            icon={Heart}
            label="추억 보관함"
            onPress={() => navigation.navigate('MemorialArchive')}
          />
        </View>

        {/* App Info */}
        <Text style={styles.sectionTitle}>정보</Text>
        <View style={styles.sectionList}>
          <SettingItem icon={Smartphone} label="앱 버전" value="1.0.0 (최신)" />
          <SettingItem icon={FileText} label="서비스 이용약관" />
          <SettingItem icon={HelpCircle} label="고객센터" />
        </View>

        {/* Account */}
        <Text style={styles.sectionTitle}>계정 관리</Text>
        <View style={styles.sectionList}>
          <SettingItem icon={LogOut} label="로그아웃" onPress={() => setShowLogoutModal(true)} />
          <SettingItem icon={Trash2} label="계정 탈퇴" isDestructive onPress={() => setShowDeleteModal(true)} />
        </View>

        <Text style={styles.copyrightText}>© 2024 SPPKL. All rights reserved.</Text>
      </ScrollView>

      <ConfirmModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={async () => {
          setShowLogoutModal(false);
          // 1. 기기에서 토큰 및 닉네임 삭제
          await clearAuthData();
          // 2. 네비게이션 스택을 완전히 비우고 온보딩 화면으로 리셋
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Onboarding' }], // App.tsx에 등록된 화면 이름에 맞게 대소문자 주의!
            })
          );
        }}
        title="로그아웃 하시겠어요?"
        desc="다음에 다시 만나요!"
        confirmLabel="로그아웃"
        icon={LogOut}
      />
      <ConfirmModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          setShowDeleteModal(false);
          await clearAuthData();
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Onboarding' }],
            })
          );
        }}
        title="정말 계정을 삭제하시겠어요?"
        desc="모든 식물 데이터와 일지 기록이 영구 삭제됩니다."
        confirmLabel="탈퇴하기"
        confirmColor="#EF4444"
        icon={Trash2}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  appBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  iconButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  profileCard: {
    backgroundColor: '#ffffff', borderRadius: 24, padding: 20, marginBottom: 32,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  profileInfo: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: { backgroundColor: '#3a7d44', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#ffffff', fontSize: 28, fontWeight: '700' },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#3a7d44', width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#ffffff',
  },
  profileText: { gap: 4 },
  userName: { fontSize: 20, fontWeight: '700', color: '#111827' },
  userEmailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userEmail: { fontSize: 14, color: '#6B7280' },
  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: '#9CA3AF',
    textTransform: 'uppercase', marginBottom: 12, marginLeft: 4, marginTop: 28,
  },
  sectionList: {
    backgroundColor: '#ffffff', borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  destructiveIconBox: { backgroundColor: '#FEF2F2' },
  settingLabel: { fontSize: 15, fontWeight: '500', color: '#374151' },
  destructiveText: { color: '#EF4444' },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingValue: { fontSize: 14, color: '#9CA3AF' },
  // Custom Toggle
  toggleContainer: { width: 48, height: 24, borderRadius: 24, padding: 2 },
  toggleOn: { backgroundColor: '#3a7d44' },
  toggleOff: { backgroundColor: '#D1D5DB' },
  toggleCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#ffffff' },
  circleOn: { alignSelf: 'flex-end' },
  circleOff: { alignSelf: 'flex-start' },
  copyrightText: { textAlign: 'center', color: '#D1D5DB', fontSize: 12, marginTop: 12 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#ffffff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 24 },
  sheetContent: { alignItems: 'center' },
  modalIconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  modalDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelButton: { flex: 1, height: 56, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#4B5563' },
  confirmButton: { flex: 1, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  confirmButtonText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
});
