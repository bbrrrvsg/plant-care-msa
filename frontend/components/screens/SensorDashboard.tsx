import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, Platform, StatusBar, Animated,
} from 'react-native';
import { ArrowLeft, Plus, Activity, Thermometer, Wind, Droplets } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

export function SensorDashboard() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const pingAnim = useRef(new Animated.Value(0.75)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pingAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
        Animated.timing(pingAnim, { toValue: 0.75, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [pingAnim]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* AppBar */}
      <View style={styles.appBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#374151" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>실시간 센서</Text>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('SensorRegister')}>
          <Plus color="#3a7d44" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>

        {/* Realtime Indicator */}
        <View style={styles.indicatorCard}>
          <View style={styles.indicatorLeft}>
            <View style={styles.dotContainer}>
              <View style={styles.dotCore} />
              <Animated.View style={[styles.dotPing, { opacity: pingAnim }]} />
            </View>
            <Text style={styles.indicatorText}>실시간 모니터링</Text>
          </View>
          <Text style={styles.indicatorTime}>방금 업데이트됨</Text>
        </View>

        {/* Sensor Widgets */}
        <View style={styles.widgetsContainer}>
          {/* Temperature */}
          <View style={styles.widgetCard}>
            <View style={styles.widgetHeader}>
              <View style={[styles.iconCircle, { backgroundColor: '#FFEDD5' }]}>
                <Thermometer color="#EA580C" size={24} />
              </View>
              <View>
                <Text style={styles.widgetLabel}>온도</Text>
                <Text style={styles.widgetRange}>적정 범위: 18-24°C</Text>
              </View>
            </View>
            <View style={styles.valueContainer}>
              <Text style={styles.mainValue}>22.5</Text>
              <Text style={styles.unitText}>°C</Text>
            </View>
            <View style={styles.sparklineContainer}>
              {[20, 22, 21, 23, 22, 22.5, 22, 21.5, 22, 22.5].map((val, i) => (
                <View key={i} style={[styles.sparklineBar, { backgroundColor: '#FED7AA', height: `${(val / 24) * 100}%` as any }]} />
              ))}
            </View>
          </View>

          {/* Humidity */}
          <View style={styles.widgetCard}>
            <View style={styles.widgetHeader}>
              <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
                <Wind color="#2563EB" size={24} />
              </View>
              <View>
                <Text style={styles.widgetLabel}>습도</Text>
                <Text style={styles.widgetRange}>적정 범위: 50-70%</Text>
              </View>
            </View>
            <View style={styles.valueContainer}>
              <Text style={styles.mainValue}>65</Text>
              <Text style={styles.unitText}>%</Text>
            </View>
            <View style={styles.sparklineContainer}>
              {[58, 60, 62, 64, 63, 65, 66, 64, 65, 65].map((val, i) => (
                <View key={i} style={[styles.sparklineBar, { backgroundColor: '#BFDBFE', height: `${(val / 80) * 100}%` as any }]} />
              ))}
            </View>
          </View>

          {/* Soil Moisture */}
          <View style={styles.widgetCard}>
            <View style={styles.widgetHeader}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(124, 203, 138, 0.2)' }]}>
                <Droplets color="#7CCB8A" size={24} />
              </View>
              <View>
                <Text style={styles.widgetLabel}>토양 수분</Text>
                <Text style={styles.widgetRange}>적정 범위: 40-70%</Text>
              </View>
            </View>
            <View style={styles.valueContainer}>
              <Text style={styles.mainValue}>68</Text>
              <Text style={styles.unitText}>%</Text>
            </View>
            <View style={styles.sparklineContainer}>
              {[70, 69, 68, 68, 67, 68, 68, 67, 68, 68].map((val, i) => (
                <View key={i} style={[styles.sparklineBar, { backgroundColor: 'rgba(124,203,138,0.4)', height: `${(val / 80) * 100}%` as any }]} />
              ))}
            </View>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Activity color="#2563EB" size={20} style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>센서 상태</Text>
              <Text style={styles.infoDesc}>모든 센서가 정상 작동 중입니다. 데이터는 5분마다 업데이트됩니다.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', zIndex: 10,
  },
  iconButton: { padding: 8, marginHorizontal: -8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#111827', marginLeft: 12 },
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 16, gap: 24 },
  indicatorCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#ffffff', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#F3F4F6', elevation: 1,
    marginBottom: 16,
  },
  indicatorLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dotContainer: { position: 'relative', width: 12, height: 12, marginRight: 8 },
  dotCore: { width: 12, height: 12, backgroundColor: '#22C55E', borderRadius: 6, position: 'absolute' },
  dotPing: { width: 12, height: 12, backgroundColor: '#22C55E', borderRadius: 6, position: 'absolute' },
  indicatorText: { fontSize: 16, fontWeight: '500', color: '#111827' },
  indicatorTime: { fontSize: 14, color: '#6B7280' },
  widgetsContainer: { gap: 16, marginBottom: 24 },
  widgetCard: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 24,
    borderWidth: 1, borderColor: '#F3F4F6', elevation: 2, marginBottom: 16,
  },
  widgetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconCircle: { padding: 12, borderRadius: 999, marginRight: 12 },
  widgetLabel: { fontSize: 16, fontWeight: '500', color: '#4B5563' },
  widgetRange: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  valueContainer: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 12 },
  mainValue: { fontSize: 48, fontWeight: '700', color: '#111827', marginRight: 8 },
  unitText: { fontSize: 20, color: '#6B7280' },
  sparklineContainer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 48,
  },
  sparklineBar: { flex: 1, borderTopLeftRadius: 4, borderTopRightRadius: 4, marginHorizontal: 2 },
  infoCard: {
    backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE',
    borderRadius: 16, padding: 16,
  },
  infoRow: { flexDirection: 'row', gap: 12 },
  infoIcon: { marginTop: 2, marginRight: 8 },
  infoTextContainer: { flex: 1 },
  infoTitle: { fontSize: 16, fontWeight: '600', color: '#1E3A8A', marginBottom: 4 },
  infoDesc: { fontSize: 14, color: '#1E40AF', lineHeight: 20 },
});
