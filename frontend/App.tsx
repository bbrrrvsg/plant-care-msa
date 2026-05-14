import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { restoreAuth } from './services/api';

// Screens
import { Onboarding } from './components/screens/Onboarding';
import { Login } from './components/screens/Login';
import { Signup } from './components/screens/Signup';
import { ForgotPassword } from './components/screens/ForgotPassword';
import { Home } from './components/screens/Home';
import { PlantDetail } from './components/screens/PlantDetail';
import { AddPlant } from './components/screens/AddPlant';
import { AIDiagnosis } from './components/screens/AIDiagnosis';
import { GrowthDiary } from './components/screens/GrowthDiary';
import { DiaryWrite } from './components/screens/DiaryWrite';
import { SensorDashboard } from './components/screens/SensorDashboard';
import { Notifications } from './components/screens/Notifications';
import { PlantEncyclopedia } from './components/screens/PlantEncyclopedia';
import { Settings } from './components/screens/Settings';
import { EncyclopediaDetail } from './components/screens/EncyclopediaDetail';
import { SensorDevices } from './components/screens/SensorDevices';
import { SensorRegister } from './components/screens/SensorRegister';

import { Colors, FontSize, Spacing } from './theme';

// 하단 탭 네비게이터의 라우트 타입
export type MainTabParamList = {
  Home: undefined;
  Encyclopedia: undefined;
  AIDiagnosis: undefined;
  Diary: undefined;
};

// 루트 스택 네비게이터의 라우트 타입 (F5, F8 해결)
export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  PlantDetail: { plantId: number };
  AddPlant: undefined;
  SensorDashboard: undefined;
  Notifications: undefined;
  Settings: undefined;
  EncyclopediaDetail: { speciesCode: number };
  DiaryWrite: { plantId?: number } | undefined;
  SensorDevices: undefined;
  SensorRegister: { plantId?: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// 하단 탭 네비게이터 (바텀 네비게이션이 보이는 화면들)
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          paddingBottom: Platform.OS === 'ios' ? 20 : Spacing.sm,
          height: Platform.OS === 'ios' ? 85 : 65,
        },
        tabBarLabelStyle: {
          fontSize: FontSize.xs,
          fontWeight: '600',
          marginBottom: Platform.OS === 'ios' ? 0 : 5,
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName = '';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Encyclopedia') iconName = focused ? 'book' : 'book-outline';
          else if (route.name === 'AIDiagnosis') iconName = focused ? 'camera' : 'camera-outline';
          else if (route.name === 'Diary') iconName = focused ? 'journal' : 'journal-outline';
          return <Ionicons name={iconName as any} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={Home} options={{ title: '홈' }} />
      <Tab.Screen name="Encyclopedia" component={PlantEncyclopedia} options={{ title: '식물도감' }} />
      <Tab.Screen name="AIDiagnosis" component={AIDiagnosis} options={{ title: 'AI진단' }} />
      <Tab.Screen name="Diary" component={GrowthDiary} options={{ title: '일지' }} />
    </Tab.Navigator>
  );
}

// 전체 스택 네비게이터 (앱의 최상위 라우터)
export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<'Onboarding' | 'MainTabs'>('Onboarding');

  useEffect(() => {
    (async () => {
      const restored = await restoreAuth();
      setInitialRoute(restored ? 'MainTabs' : 'Onboarding');
      setIsReady(true);
    })();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{ headerShown: false }}
        >
          {/* 인증 및 온보딩 */}
          <Stack.Screen name="Onboarding" component={Onboarding} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Signup" component={Signup} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />

          {/* 메인 탭 화면들 */}
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />

          {/* 상세 및 기타 화면들 */}
          <Stack.Screen name="PlantDetail" component={PlantDetail} />
          <Stack.Screen name="AddPlant" component={AddPlant} />
          <Stack.Screen name="SensorDashboard" component={SensorDashboard} />
          <Stack.Screen name="Notifications" component={Notifications} />
          <Stack.Screen name="Settings" component={Settings} />
          <Stack.Screen name="EncyclopediaDetail" component={EncyclopediaDetail} />
          <Stack.Screen name="DiaryWrite" component={DiaryWrite} />
          <Stack.Screen name="SensorDevices" component={SensorDevices} />
          <Stack.Screen name="SensorRegister" component={SensorRegister} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
