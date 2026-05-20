import React, { useCallback, useState } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Platform, StatusBar, ActivityIndicator,
} from 'react-native';
import { Plus, Bell, CloudRain } from 'lucide-react-native';
import { useNavigation, useFocusEffect, CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../../App';
import { PlantCard } from '../shared/PlantCard';
import { getNickname, plantApi, MyPlantItem, getUserId } from '../../services/api';

type HomeNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400';

export function Home() {
  const navigation = useNavigation<HomeNavigationProp>();
  const nickname = getNickname() || '플랜터';

  const [myPlants, setMyPlants] = useState<MyPlantItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchMyPlants = useCallback(async (cancelledRef?: { current: boolean }) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const storedUserId = getUserId();
      if (storedUserId == null) {
        throw new Error('로그인 정보가 없습니다.');
      }
      const data = await plantApi.getMyPlants(storedUserId);
      if (!cancelledRef?.current) {
        setMyPlants(data ?? []);
      }
    } catch (error) {
      if (!cancelledRef?.current) {
        const message = error instanceof Error ? error.message : '내 식물 목록을 불러오지 못했어요.';
        setErrorMessage(message);
        console.error('내 식물 목록을 불러오는데 실패했습니다:', error);
      }
    } finally {
      if (!cancelledRef?.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const cancelledRef = { current: false };
      fetchMyPlants(cancelledRef);

      return () => {
        cancelledRef.current = true;
      };
    }, [fetchMyPlants])
  );

  const renderPlantCard = (plant: MyPlantItem) => {
    const statusText = plant.lastWatered
      ? `마지막 급수: ${plant.lastWatered}`
      : plant.plantName || '등록된 식물';

    return (
      <PlantCard
        key={plant.myPlantId}
        id={plant.myPlantId}
        name={plant.nickname}
        species={plant.plantName || '종 정보 없음'}
        image={plant.imageUrl || FALLBACK_IMAGE}
        statusText={statusText}
        onPress={() => navigation.navigate('PlantDetail', { plantId: plant.myPlantId })}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.appBar}>
          <Text style={styles.appTitle}>PlantCare</Text>
          <View style={styles.appBarRight}>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Notifications')}>
              <Bell color="#374151" size={24} />
              <View style={styles.badge} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Settings')}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120' }}
                style={styles.profileImage}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.greetingSection}>
            <Text style={styles.greetingTitle}>환영합니다, {nickname}님</Text>
            <Text style={styles.greetingSubtitle}>
              오늘 돌볼 식물이 {myPlants.length}개 있어요.
            </Text>
          </View>

          <View style={styles.weatherWidget}>
            <View style={styles.weatherIconContainer}>
              <CloudRain color="#2E7D32" size={40} strokeWidth={1.8} />
              <Text style={styles.temperature}>22°C</Text>
            </View>
            <View style={styles.weatherTextContainer}>
              <Text style={styles.weatherText}>
                오늘은 하루 종일 비가 와요. 식물의 과습 상태를 확인해 주세요.
              </Text>
            </View>
          </View>

          <View style={styles.myPlantsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>내 식물</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>전체 보기</Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={styles.stateContainer}>
                <ActivityIndicator size="large" color="#3a7d44" />
              </View>
            ) : errorMessage ? (
              <View style={styles.stateContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => fetchMyPlants()}>
                  <Text style={styles.retryText}>다시 시도</Text>
                </TouchableOpacity>
              </View>
            ) : myPlants.length > 0 ? (
              myPlants.map(renderPlantCard)
            ) : (
              <View style={styles.stateContainer}>
                <Text style={styles.emptyTitle}>아직 등록된 식물이 없어요.</Text>
                <Text style={styles.emptyText}>아래 버튼으로 첫 식물을 추가해 보세요.</Text>
              </View>
            )}

            <TouchableOpacity style={styles.addPlantButton} onPress={() => navigation.navigate('AddPlant')}>
              <View style={styles.addIconCircle}>
                <Plus color="#9CA3AF" size={20} />
              </View>
              <Text style={styles.addPlantText}>내 식물 추가하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: { flex: 1, backgroundColor: '#f5f5f0' },
  contentContainer: { paddingBottom: 100 },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  appTitle: { fontSize: 20, fontWeight: '700', color: '#3a7d44' },
  appBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: { padding: 8, position: 'relative' },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: '#EF4444',
    borderRadius: 4,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(124, 203, 138, 0.4)',
    overflow: 'hidden',
  },
  profileImage: { width: '100%', height: '100%' },
  mainContent: { padding: 16 },
  greetingSection: { marginBottom: 16 },
  greetingTitle: { fontSize: 24, fontWeight: '700', color: '#2E7D32', lineHeight: 32 },
  greetingSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  weatherWidget: {
    flexDirection: 'row',
    backgroundColor: '#F1F8E9',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.1)',
    marginBottom: 24,
  },
  weatherIconContainer: { minWidth: 80, alignItems: 'center', justifyContent: 'center' },
  temperature: { fontSize: 24, fontWeight: '700', color: '#2E7D32', marginTop: 4 },
  weatherTextContainer: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(46, 125, 50, 0.15)',
    paddingLeft: 16,
  },
  weatherText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  myPlantsSection: { marginTop: 8 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  seeAllText: { fontSize: 14, color: '#7CCB8A' },
  stateContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    minHeight: 112,
  },
  errorText: { fontSize: 14, color: '#DC2626', textAlign: 'center', lineHeight: 20 },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#3a7d44',
  },
  retryText: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#374151' },
  emptyText: { fontSize: 13, color: '#9CA3AF', marginTop: 6 },
  addPlantButton: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  addPlantText: { fontSize: 14, fontWeight: '500', color: '#9CA3AF' },
});
