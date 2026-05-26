import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Platform, StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { ArrowLeft, Settings, AlertTriangle, Droplets, Info } from 'lucide-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { notificationApi, getUserId, type NotificationItem } from '../../services/api';

type CategoryTab = 'all' | 'warnings' | 'care' | 'system';
type UiKind = 'warning' | 'care' | 'system';
type Bucket = 'today' | 'yesterday' | 'thisWeek' | 'older';

type UiNotification = {
  id: number;
  kind: UiKind;
  title: string;
  subtitle: string;
  timestamp: string;
  isRead: boolean;
  bucket: Bucket;
};

function classifyType(type: string): UiKind {
  if (type === 'WATER_LOW') return 'warning';
  if (type === 'DEVICE_INACTIVE') return 'system';
  return 'care';
}

function bucketOf(createdAt?: string): Bucket {
  if (!createdAt) return 'older';
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return 'older';
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOfWeek = startOfToday - 6 * 24 * 60 * 60 * 1000;
  const t = created.getTime();
  if (t >= startOfToday) return 'today';
  if (t >= startOfYesterday) return 'yesterday';
  if (t >= startOfWeek) return 'thisWeek';
  return 'older';
}

function formatTimestamp(createdAt?: string): string {
  if (!createdAt) return '';
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return '';
  const diffMs = Date.now() - created.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return created.toLocaleDateString();
}

function toUi(n: NotificationItem): UiNotification {
  const kind = classifyType(n.type);
  return {
    id: n.notificationId,
    kind,
    title: n.title || (n.type === 'WATER_LOW' ? '토양 수분 부족 감지' : n.type === 'DEVICE_INACTIVE' ? '센서 연결 끊김' : '알림'),
    subtitle: n.message || (n.plantNickname ?? ''),
    timestamp: formatTimestamp(n.createdAt),
    isRead: n.isRead,
    bucket: bucketOf(n.createdAt),
  };
}

type CardProps = { kind: UiKind; title: string; subtitle: string; timestamp: string; isRead: boolean; onPress?: () => void };
function NotificationCard({ kind, title, subtitle, timestamp, isRead, onPress }: CardProps) {
  const cfg: Record<UiKind, { Icon: any; color: string; bg: string }> = {
    warning: { Icon: AlertTriangle, color: '#EF4444', bg: '#FEE2E2' },
    care:    { Icon: Droplets,      color: '#3B82F6', bg: '#DBEAFE' },
    system:  { Icon: Info,          color: '#6B7280', bg: '#F3F4F6' },
  };
  const { Icon, color, bg } = cfg[kind];
  return (
    <TouchableOpacity style={[styles.card, !isRead && styles.cardUnread]} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: bg }]}><Icon color={color} size={20} /></View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, !isRead && styles.cardTitleUnread]}>{title}</Text>
        <Text style={styles.cardSubtitle} numberOfLines={2}>{subtitle}</Text>
        <Text style={styles.cardTimestamp}>{timestamp}</Text>
      </View>
      {!isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

export function Notifications() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedTab, setSelectedTab] = useState<CategoryTab>('all');
  const [items, setItems] = useState<UiNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const userId = getUserId();
    if (userId == null) {
      setError('로그인 정보가 없습니다');
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const data = await notificationApi.getByUser(String(userId));
      setItems(data.map(toUi));
    } catch (e: any) {
      setError(e?.message ?? '알림을 불러오지 못했어요');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const handleCardPress = useCallback(async (id: number, alreadyRead: boolean) => {
    if (alreadyRead) return;
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    try {
      await notificationApi.markRead(id);
    } catch {
      // 실패 시 다음 새로고침에서 정정됨
    }
  }, []);

  const filtered = useMemo(() => items.filter((n) => {
    if (selectedTab === 'all')      return true;
    if (selectedTab === 'warnings') return n.kind === 'warning';
    if (selectedTab === 'care')     return n.kind === 'care';
    if (selectedTab === 'system')   return n.kind === 'system';
    return true;
  }), [items, selectedTab]);

  const grouped = useMemo(() => ({
    today:     filtered.filter((n) => n.bucket === 'today'),
    yesterday: filtered.filter((n) => n.bucket === 'yesterday'),
    thisWeek:  filtered.filter((n) => n.bucket === 'thisWeek'),
    older:     filtered.filter((n) => n.bucket === 'older'),
  }), [filtered]);

  const renderTab = (id: CategoryTab, label: string) => (
    <TouchableOpacity key={id} style={[styles.tab, selectedTab === id && styles.tabActive]} onPress={() => setSelectedTab(id)}>
      <Text style={[styles.tabText, selectedTab === id && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderSection = (label: string, list: UiNotification[]) => (
    list.length > 0 ? (
      <>
        <Text style={styles.sectionTitle}>{label}</Text>
        {list.map((n) => (
          <NotificationCard
            key={n.id}
            kind={n.kind}
            title={n.title}
            subtitle={n.subtitle}
            timestamp={n.timestamp}
            isRead={n.isRead}
            onPress={() => handleCardPress(n.id, n.isRead)}
          />
        ))}
      </>
    ) : null
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.appBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}><ArrowLeft color="#374151" size={24} /></TouchableOpacity>
        <Text style={styles.headerTitle}>알림</Text>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Settings')}><Settings color="#374151" size={24} /></TouchableOpacity>
      </View>
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {(['all','warnings','care','system'] as CategoryTab[]).map((id) =>
            renderTab(id, { all:'전체', warnings:'경고', care:'관리', system:'시스템' }[id])
          )}
        </ScrollView>
      </View>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.emptyState}><ActivityIndicator color="#3a7d44" /></View>
        ) : error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{error}</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>알림이 없습니다</Text>
          </View>
        ) : (
          <>
            {renderSection('오늘', grouped.today)}
            {renderSection('어제', grouped.yesterday)}
            {renderSection('이번 주', grouped.thisWeek)}
            {renderSection('이전', grouped.older)}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex:1, backgroundColor:'#ffffff', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  appBar: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:12, backgroundColor:'#ffffff' },
  iconButton: { padding:8 },
  headerTitle: { fontSize:18, fontWeight:'700', color:'#111827' },
  tabContainer: { backgroundColor:'#ffffff', borderBottomWidth:1, borderBottomColor:'#E5E7EB' },
  tabScroll: { paddingHorizontal:16, flexDirection:'row' },
  tab: { paddingVertical:12, marginRight:24, borderBottomWidth:2, borderBottomColor:'transparent' },
  tabActive: { borderBottomColor:'#3a7d44' },
  tabText: { fontSize:15, fontWeight:'500', color:'#6B7280' },
  tabTextActive: { color:'#3a7d44', fontWeight:'700' },
  container: { flex:1, backgroundColor:'#F9FAFB' },
  scrollContent: { padding:16, paddingBottom:40 },
  sectionTitle: { fontSize:14, fontWeight:'600', color:'#6B7280', marginBottom:12, paddingHorizontal:4, marginTop:16 },
  card: { flexDirection:'row', alignItems:'flex-start', backgroundColor:'#ffffff', padding:16, borderRadius:16, borderWidth:1, borderColor:'#F3F4F6', marginBottom:12 },
  cardUnread: { backgroundColor:'#F0FDF4', borderColor:'#BBF7D0' },
  iconContainer: { width:40, height:40, borderRadius:20, alignItems:'center', justifyContent:'center', marginRight:12 },
  cardContent: { flex:1 },
  cardTitle: { fontSize:15, fontWeight:'500', color:'#374151', marginBottom:4 },
  cardTitleUnread: { fontWeight:'700', color:'#111827' },
  cardSubtitle: { fontSize:13, color:'#6B7280', marginBottom:6 },
  cardTimestamp: { fontSize:12, color:'#9CA3AF' },
  unreadDot: { width:8, height:8, borderRadius:4, backgroundColor:'#10B981', marginTop:6, marginLeft:8 },
  emptyState: { alignItems:'center', justifyContent:'center', paddingVertical:64 },
  emptyTitle: { fontSize:18, fontWeight:'700', color:'#111827' },
});
