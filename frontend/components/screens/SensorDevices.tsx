import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Platform, StatusBar, LayoutAnimation, UIManager } from 'react-native';
import { ArrowLeft, Cpu, Battery, BatteryLow, Plus, ChevronRight, ChevronDown, Power, AlertCircle, Signal } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) UIManager.setLayoutAnimationEnabledExperimental(true);
const devices = [
  { id:'d1', nickname:'거실 창가 센서', mac:'AA:BB:CC:DD:EE:01', plantName:'몬스테라 델리시오사', online:true, battery:78, signal:4, firmware:'v1.4.2', ssid:'Home_WiFi_5G', lastSync:'방금 전', threshold:30, duration:3000 },
  { id:'d2', nickname:'베란다 센서',    mac:'AA:BB:CC:DD:EE:02', plantName:'연결된 식물 없음',    online:false, battery:15, signal:1, firmware:'v1.4.0', ssid:'Home_WiFi_2.4G', lastSync:'2일 전', threshold:40, duration:5000 },
];
export function SensorDevices() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [devList, setDevList] = useState(devices);
  const [expanded, setExpanded] = useState<string|null>(devices[0]?.id||null);
  const [confirmId, setConfirmId] = useState<string|null>(null);
  const toggle = (id:string) => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setExpanded(expanded===id?null:id); setConfirmId(null); };
  const remove = (id:string) => { setDevList(d=>d.filter(x=>x.id!==id)); setConfirmId(null); };
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff"/>
      <View style={s.appBar}>
        <TouchableOpacity style={s.iconBtn} onPress={()=>navigation.goBack()}><ArrowLeft color="#374151" size={24}/></TouchableOpacity>
        <Text style={s.headerTitle}>기기 관리</Text>
        <TouchableOpacity style={s.iconBtn} onPress={()=>navigation.navigate('SensorRegister')}><Plus color="#3a7d44" size={24}/></TouchableOpacity>
      </View>
      <ScrollView style={s.container} contentContainerStyle={s.scroll}>
        {devList.map(d => {
          const isExp = expanded===d.id; const isConf = confirmId===d.id;
          return (
            <View key={d.id} style={[s.card, isExp&&s.cardExp]}>
              <TouchableOpacity style={s.cardHeader} onPress={()=>toggle(d.id)} activeOpacity={0.7}>
                <View style={s.headerLeft}>
                  <View style={[s.statusDot,{backgroundColor:d.online?'#10B981':'#D1D5DB'}]}/>
                  <View>
                    <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
                      <Text style={s.nickname}>{d.nickname}</Text>
                      <View style={d.online?s.onlineBadge:s.offlineBadge}><Text style={d.online?s.onlineBadgeText:s.offlineBadgeText}>{d.online?'온라인':'오프라인'}</Text></View>
                    </View>
                    <Text style={s.mac}>{d.mac}</Text>
                  </View>
                </View>
                {isExp?<ChevronDown size={20} color="#9CA3AF"/>:<ChevronRight size={20} color="#9CA3AF"/>}
              </TouchableOpacity>
              {isExp && (
                <View style={s.expandedContent}>
                  <View style={s.statsRow}>
                    <View style={s.statBox}>{d.battery>20?<Battery size={16} color="#10B981"/>:<BatteryLow size={16} color="#EF4444"/>}<Text style={s.statLabel}>배터리</Text><Text style={s.statValue}>{d.battery}%</Text></View>
                    <View style={s.statBox}><Signal size={16} color={d.online?'#3B82F6':'#9CA3AF'}/><Text style={s.statLabel}>신호</Text><Text style={s.statValue}>{d.online?`${d.signal}/4`:'-'}</Text></View>
                    <View style={s.statBox}><Cpu size={16} color="#8B5CF6"/><Text style={s.statLabel}>펌웨어</Text><Text style={s.statValue}>{d.firmware}</Text></View>
                  </View>
                  <View style={s.infoList}>
                    {[['연결된 식물',d.plantName],['Wi-Fi',d.ssid],['마지막 동기화',d.lastSync]].map(([label,value])=>(
                      <View key={label} style={s.infoRow}><Text style={s.infoLabel}>{label}</Text><Text style={s.infoValue}>{value}</Text></View>
                    ))}
                  </View>
                  {isConf ? (
                    <View style={s.confirmBox}>
                      <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:12}}><AlertCircle size={16} color="#EF4444"/><Text style={s.confirmText}>정말 삭제하시겠습니까?</Text></View>
                      <View style={{flexDirection:'row',gap:8}}>
                        <TouchableOpacity style={s.cancelBtn} onPress={()=>setConfirmId(null)}><Text style={s.cancelBtnText}>취소</Text></TouchableOpacity>
                        <TouchableOpacity style={s.removeBtn} onPress={()=>remove(d.id)}><Text style={s.removeBtnText}>연결 해제</Text></TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity style={s.initRemoveBtn} onPress={()=>setConfirmId(d.id)}>
                      <Power size={16} color="#EF4444" style={{marginRight:8}}/><Text style={s.initRemoveText}>기기 연결 해제</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#ffffff',paddingTop:Platform.OS==='android'?StatusBar.currentHeight:0},
  appBar:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#E5E7EB'},
  iconBtn:{padding:8}, headerTitle:{fontSize:18,fontWeight:'700',color:'#111827'},
  container:{flex:1,backgroundColor:'#F9FAFB'}, scroll:{padding:16,paddingBottom:40},
  card:{backgroundColor:'#ffffff',borderRadius:16,marginBottom:12,borderWidth:1,borderColor:'#E5E7EB',overflow:'hidden'},
  cardExp:{borderColor:'#7CCB8A',elevation:2},
  cardHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:16},
  headerLeft:{flexDirection:'row',alignItems:'center'},
  statusDot:{width:10,height:10,borderRadius:5,marginRight:12},
  nickname:{fontSize:16,fontWeight:'700',color:'#111827'},
  onlineBadge:{backgroundColor:'#D1FAE5',paddingHorizontal:6,paddingVertical:2,borderRadius:6},
  onlineBadgeText:{fontSize:10,fontWeight:'600',color:'#059669'},
  offlineBadge:{backgroundColor:'#F3F4F6',paddingHorizontal:6,paddingVertical:2,borderRadius:6},
  offlineBadgeText:{fontSize:10,fontWeight:'600',color:'#6B7280'},
  mac:{fontSize:12,color:'#9CA3AF',fontFamily:Platform.OS==='ios'?'Menlo':'monospace'},
  expandedContent:{paddingHorizontal:16,paddingBottom:16},
  statsRow:{flexDirection:'row',justifyContent:'space-between',gap:8,marginTop:4},
  statBox:{flex:1,backgroundColor:'#F9FAFB',borderRadius:12,paddingVertical:12,alignItems:'center',justifyContent:'center'},
  statLabel:{fontSize:11,color:'#9CA3AF',marginBottom:2,marginTop:4},
  statValue:{fontSize:14,fontWeight:'700',color:'#111827'},
  infoList:{gap:16,marginVertical:16},
  infoRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  infoLabel:{fontSize:14,color:'#6B7280'}, infoValue:{fontSize:14,fontWeight:'500',color:'#111827'},
  confirmBox:{backgroundColor:'#FEF2F2',borderRadius:12,padding:16,borderWidth:1,borderColor:'#FECACA'},
  confirmText:{fontSize:14,fontWeight:'600',color:'#991B1B'},
  cancelBtn:{flex:1,backgroundColor:'#ffffff',borderWidth:1,borderColor:'#E5E7EB',borderRadius:8,paddingVertical:10,alignItems:'center'},
  cancelBtnText:{fontSize:14,fontWeight:'600',color:'#374151'},
  removeBtn:{flex:1,backgroundColor:'#EF4444',borderRadius:8,paddingVertical:10,alignItems:'center'},
  removeBtnText:{fontSize:14,fontWeight:'600',color:'#ffffff'},
  initRemoveBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',backgroundColor:'#ffffff',borderWidth:1,borderColor:'#E5E7EB',borderRadius:12,paddingVertical:14},
  initRemoveText:{fontSize:14,fontWeight:'600',color:'#EF4444'},
});
