import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, ScrollView, Platform, Image, StatusBar,
  Alert, ActivityIndicator,
} from 'react-native';
import { ArrowLeft, Upload } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { plantApi, getUserId } from '../../services/api';

export function AddPlant() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [plantName, setPlantName] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = async () => {
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

  const handleSubmit = async () => {
    const userId = getUserId();
    if (userId == null) {
      Alert.alert('로그인이 필요합니다', '다시 로그인 후 시도해 주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await plantApi.addPlant({
        userId,
        nickname: plantName.trim(),
        location: location.trim() || undefined,
        imageUri: imageUri ?? undefined,
      });
      Alert.alert('등록 완료', '새 식물이 등록되었습니다.', [
        { text: '확인', onPress: () => navigation.navigate('MainTabs', { screen: 'Home' }) },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : '식물 등록에 실패했습니다.';
      Alert.alert('등록 실패', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* AppBar */}
      <View style={styles.appBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#374151" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>새 식물 추가</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={styles.keyboardAvoid} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>

          {/* Photo Upload */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>식물 사진</Text>
            <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <View style={styles.iconCircle}>
                    <Upload color="#7CCB8A" size={32} />
                  </View>
                  <Text style={styles.uploadText}>식물 사진 업로드</Text>
                  <Text style={styles.uploadSubText}>JPG, PNG 최대 10MB</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Plant Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>식물 이름</Text>
            <TextInput
              style={styles.textInput}
              placeholder="예: 우리집 몬스테라"
              placeholderTextColor="#9CA3AF"
              value={plantName}
              onChangeText={setPlantName}
            />
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>위치 (선택사항)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="예: 거실 창가, 베란다"
              placeholderTextColor="#9CA3AF"
              value={location}
              onChangeText={setLocation}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Submit Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.submitButton, (!plantName || isSubmitting) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!plantName || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>식물 등록하기</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1, backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  appBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 16,
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  keyboardAvoid: { flex: 1 },
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 20, gap: 24 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  uploadBox: {
    backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#D1D5DB',
    borderStyle: 'dashed', borderRadius: 16, overflow: 'hidden',
  },
  uploadPlaceholder: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(124, 203, 138, 0.1)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  uploadText: { fontSize: 16, color: '#374151', fontWeight: '500' },
  uploadSubText: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  previewImage: { width: '100%', height: 200, resizeMode: 'cover' },
  textInput: {
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#D1D5DB',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: '#111827',
  },
  textArea: { minHeight: 120 },
  bottomContainer: {
    backgroundColor: '#ffffff', paddingHorizontal: 20, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  submitButton: {
    backgroundColor: '#3a7d44', paddingVertical: 16,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  submitButtonDisabled: { backgroundColor: '#9CA3AF' },
  submitButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
