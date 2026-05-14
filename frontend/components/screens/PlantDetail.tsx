import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions, Platform, StatusBar } from 'react-native';
import { ChevronLeft, MoreVertical, Droplets, Sun, Thermometer, Calendar, PlusCircle, Settings } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
const { width } = Dimensions.get('window');
const SensorWidget = ({ label, value, icon, status }:any) => (
  <View style={s.sensorWidget}>{icon}<Text style={s.sensorValue}>{value}</Text><Text style={s.sensorLabel}>{label}</Text><View style={s.statusTag}><Text style={s.statusTagText}>{status}</Text></View></View>
);
export function PlantDetail() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content"/>
      <View style={s.header}>
        <TouchableOpacity style={s.headerBtn} onPress={()=>navigation.goBack()}><ChevronLeft color="#ffffff" size={28}/></TouchableOpacity>
        <TouchableOpacity style={s.headerBtn}><MoreVertical color="#ffffff" size={24}/></TouchableOpacity>
      </View>
      <ScrollView bounces={false} contentContainerStyle={{ backgroundColor:'#f5f5f0' }}>
        <View style={s.imageContainer}>
          <Image source={{ uri:'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=800' }} style={s.mainImage}/>
          <View style={s.overlay}/>
        </View>
        <View style={s.contentCard}>
          <View style={s.titleSection}>
            <View>
              <Text style={s.plantName}>몬스테라</Text>
              <Text style={s.plantSpecies}>Monstera Deliciosa</Text>
            </View>
            <TouchableOpacity style={s.actionBtn}>
              <Droplets color="#ffffff" size={20}/>
              <Text style={s.actionBtnText}>물주기</Text>
            </TouchableOpacity>
          </View>
          <View style={s.statusRow}>
            <View style={s.statusItem}><Calendar color="#6B7280" size={18}/><Text style={s.statusText}>D+128</Text></View>
            <View style={s.statusItem}><Droplets color="#3B82F6" size={18}/><Text style={s.statusText}>2일 전</Text></View>
          </View>
          <View style={s.sectionContainer}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>실시간 상태</Text>
              <TouchableOpacity onPress={()=>navigation.navigate('SensorDashboard')}><Text style={s.detailLink}>상세 보기</Text></TouchableOpacity>
            </View>
            <View style={s.sensorGrid}>
              <SensorWidget label="토양 수분" value="45%" icon={<Droplets color="#3B82F6" size={24}/>} status="적정"/>
              <SensorWidget label="주변 온도" value="24°C" icon={<Thermometer color="#EF4444" size={24}/>} status="좋음"/>
              <SensorWidget label="조도" value="Good" icon={<Sun color="#F59E0B" size={24}/>} status="충분"/>
            </View>
          </View>
          <View style={s.sectionContainer}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>성장 일지</Text>
              <TouchableOpacity onPress={()=>navigation.navigate('DiaryWrite')}><PlusCircle color="#3a7d44" size={24}/></TouchableOpacity>
            </View>
            <View style={s.diaryCard}>
              <Text style={s.diaryDate}>2024.05.20</Text>
              <Text style={s.diaryContent}>새 잎이 돋아나기 시작했어요! 너무 귀여워요.</Text>
            </View>
          </View>
          <TouchableOpacity style={s.secondaryBtn} onPress={()=>navigation.navigate('SensorRegister')}>
            <Settings color="#374151" size={20}/>
            <Text style={s.secondaryBtnText}>센서 및 장치 설정</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe:{ flex:1, backgroundColor:'#000' },
  header:{ position:'absolute', top:Platform.OS==='ios'?50:20, left:0, right:0, flexDirection:'row', justifyContent:'space-between', paddingHorizontal:16, zIndex:10 },
  headerBtn:{ width:40, height:40, borderRadius:20, backgroundColor:'rgba(0,0,0,0.3)', alignItems:'center', justifyContent:'center' },
  imageContainer:{ width, height:width*0.8, position:'relative' },
  mainImage:{ width:'100%', height:'100%' },
  overlay:{ ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(0,0,0,0.1)' },
  contentCard:{ marginTop:-30, backgroundColor:'#f5f5f0', borderTopLeftRadius:32, borderTopRightRadius:32, paddingHorizontal:20, paddingTop:32, paddingBottom:40 },
  titleSection:{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 },
  plantName:{ fontSize:28, fontWeight:'800', color:'#111827' },
  plantSpecies:{ fontSize:16, color:'#6B7280', fontStyle:'italic', marginTop:4 },
  actionBtn:{ flexDirection:'row', backgroundColor:'#3a7d44', paddingHorizontal:16, paddingVertical:10, borderRadius:20, alignItems:'center', gap:6 },
  actionBtnText:{ color:'#ffffff', fontWeight:'600', fontSize:14 },
  statusRow:{ flexDirection:'row', gap:16, marginBottom:32 },
  statusItem:{ flexDirection:'row', alignItems:'center', gap:6 },
  statusText:{ fontSize:14, color:'#4B5563', fontWeight:'500' },
  sectionContainer:{ marginBottom:28 },
  sectionHeader:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  sectionTitle:{ fontSize:18, fontWeight:'700', color:'#111827' },
  detailLink:{ color:'#3a7d44', fontSize:14, fontWeight:'600' },
  sensorGrid:{ flexDirection:'row', justifyContent:'space-between', gap:10 },
  sensorWidget:{ flex:1, backgroundColor:'#ffffff', borderRadius:20, padding:16, alignItems:'center', borderWidth:1, borderColor:'#E5E7EB' },
  sensorValue:{ fontSize:18, fontWeight:'700', color:'#111827', marginTop:8 },
  sensorLabel:{ fontSize:12, color:'#6B7280', marginTop:2 },
  statusTag:{ marginTop:8, paddingHorizontal:8, paddingVertical:2, borderRadius:8, backgroundColor:'#E8F5E9' },
  statusTagText:{ fontSize:10, fontWeight:'600', color:'#2E7D32' },
  diaryCard:{ backgroundColor:'#ffffff', borderRadius:16, padding:16, borderWidth:1, borderColor:'#E5E7EB' },
  diaryDate:{ fontSize:12, color:'#9CA3AF', marginBottom:6 },
  diaryContent:{ fontSize:14, color:'#374151', lineHeight:20 },
  secondaryBtn:{ flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, paddingVertical:14, borderRadius:16, borderWidth:1, borderColor:'#D1D5DB', marginTop:8 },
  secondaryBtnText:{ fontSize:14, color:'#374151', fontWeight:'600' },
});
