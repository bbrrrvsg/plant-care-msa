import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Platform, StatusBar,
} from 'react-native';
import { ArrowLeft, Settings, AlertTriangle, Droplets, Sparkles, Info } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type CategoryTab = 'all' | 'warnings' | 'care' | 'system';
type Notification = { id: string; type: 'warning'|'care'|'ai'|'system'; title: string; subtitle: string; timestamp: string; severity: string; isRead: boolean; date: string; };

const mockNotifications: Notification[] = [
  { id:'1', type:'warning', title:'토양 수분 부족 감지',     subtitle:'몬스테라 토양 수분이 32%로 떨어졌어요', timestamp:'5분 전',  severity:'critical', isRead:false, date:'today' },
  { id:'2', type:'care',    title:'몬스테라 물주기 알림',    subtitle:'일정에 따라 물을 줄 시간이에요',         timestamp:'1시간 전', severity:'info',     isRead:false, date:'today' },
  { id:'3', type:'warning', title:'온도가 권장 범위를 초과', subtitle:'산세베리아 온도가 28°C로 높습니다',       timestamp:'어제',     severity:'warning',  isRead:true,  date:'yesterday' },
  { id:'4', type:'ai',      title:'새로운 AI 진단 결과',     subtitle:'보스턴 고사리 진단이 완료되었습니다',     timestamp:'2일 전',   severity:'info',     isRead:true,  date:'thisWeek' },
  { id:'5', type:'system',  title:'시스템 업데이트 완료',    subtitle:'센서 동기화 성능이 개선되었습니다',       timestamp:'4일 전',   severity:'info',     isRead:true,  date:'thisWeek' },
];

type CardProps = { type:'warning'|'care'|'ai'|'system'; title:string; subtitle:string; timestamp:string; isRead:boolean; };
function NotificationCard({ type, title, subtitle, timestamp, isRead }: CardProps) {
  const cfg: Record<string,{Icon:any;color:string;bg:string}> = {
    warning: { Icon: AlertTriangle, color:'#EF4444', bg:'#FEE2E2' },
    care:    { Icon: Droplets,      color:'#3B82F6', bg:'#DBEAFE' },
    ai:      { Icon: Sparkles,      color:'#8B5CF6', bg:'#EDE9FE' },
    system:  { Icon: Info,          color:'#6B7280', bg:'#F3F4F6' },
  };
  const { Icon, color, bg } = cfg[type];
  return (
    <TouchableOpacity style={[styles.card, !isRead && styles.cardUnread]}>
      <View style={[styles.iconContainer, { backgroundColor: bg }]}><Icon color={color} size={20} /></View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, !isRead && styles.cardTitleUnread]}>{title}</Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>{subtitle}</Text>
        <Text style={styles.cardTimestamp}>{timestamp}</Text>
      </View>
      {!isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

export function Notifications() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedTab, setSelectedTab] = useState<CategoryTab>('all');
  const filtered = mockNotifications.filter((n) => {
    if (selectedTab === 'all')      return true;
    if (selectedTab === 'warnings') return n.type === 'warning';
    if (selectedTab === 'care')     return n.type === 'care';
    if (selectedTab === 'system')   return n.type === 'system' || n.type === 'ai';
    return true;
  });
  const grouped = {
    today:     filtered.filter((n) => n.date === 'today'),
    yesterday: filtered.filter((n) => n.date === 'yesterday'),
    thisWeek:  filtered.filter((n) => n.date === 'thisWeek'),
  };

  const renderTab = (id: CategoryTab, label: string) => (
    <TouchableOpacity key={id} style={[styles.tab, selectedTab === id && styles.tabActive]} onPress={() => setSelectedTab(id)}>
      <Text style={[styles.tabText, selectedTab === id && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
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
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>알림이 없습니다</Text>
          </View>
        ) : (
          <>
            {grouped.today.length > 0 && <><Text style={styles.sectionTitle}>오늘</Text>{grouped.today.map((n) => <NotificationCard key={n.id} {...(n as any)} />)}</>}
            {grouped.yesterday.length > 0 && <><Text style={styles.sectionTitle}>어제</Text>{grouped.yesterday.map((n) => <NotificationCard key={n.id} {...(n as any)} />)}</>}
            {grouped.thisWeek.length > 0 && <><Text style={styles.sectionTitle}>이번 주</Text>{grouped.thisWeek.map((n) => <NotificationCard key={n.id} {...(n as any)} />)}</>}
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
