import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert, StatusBar } from 'react-native';
import { ArrowLeft, Camera, Calendar, Clock, Leaf, Check } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { addDiaryEntry } from '../../lib/diaryStore';
const myPlants = [{ id:'1', name:'몬스테라 델리시오사', emoji:'🌿' },{ id:'2', name:'산세베리아', emoji:'🪴' },{ id:'3', name:'보스턴 고사리', emoji:'🌱' },{ id:'4', name:'다육이 삼총사', emoji:'🌵' }];
const entryTypes = [{ id:'growth', label:'성장 기록', color:'#3a7d44' },{ id:'care', label:'일상 관리', color:'#0ea5e9' },{ id:'watering', label:'물주기', color:'#0284c7' },{ id:'repot', label:'분갈이', color:'#a16207' },{ id:'bloom', label:'개화', color:'#db2777' },{ id:'issue', label:'이상 증상', color:'#dc2626' }];
const today = new Date(); const pad = (n:number)=>String(n).padStart(2,'0');
const defaultDate = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
const defaultTime = `${pad(today.getHours())}:${pad(today.getMinutes())}`;
export function DiaryWrite() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [sel, setSel] = useState(myPlants[0].id);
  const [type, setType] = useState(entryTypes[0].id);
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [note, setNote] = useState('');
  const canSubmit = note.trim().length > 0;
  const handleSubmit = () => {
    if (!canSubmit) return;
    const plant = myPlants.find(p=>p.id===sel)!;
    const t = entryTypes.find(t=>t.id===type)!;
    addDiaryEntry({ date, time, plant:plant.name, image:'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400', note, type:t.label, source:'manual' });
    Alert.alert('성공','기록이 저장되었습니다.',[{ text:'확인', onPress:()=>navigation.navigate('MainTabs',{ screen:'Diary' }) }]);
  };
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff"/>
      <View style={s.appBar}>
        <TouchableOpacity style={s.iconBtn} onPress={()=>navigation.goBack()}><ArrowLeft color="#374151" size={24}/></TouchableOpacity>
        <Text style={s.headerTitle}>새 기록 쓰기</Text>
        <View style={{width:40}}/>
      </View>
      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}>
        <ScrollView style={s.container} contentContainerStyle={s.scroll}>
          <TouchableOpacity style={s.photoUpload}>
            <View style={s.photoInner}><Camera color="#9CA3AF" size={32}/><Text style={s.photoText}>사진 추가하기</Text></View>
          </TouchableOpacity>
          <View style={s.section}>
            <Text style={s.sectionTitle}>어떤 식물의 기록인가요?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hScroll}>
              {myPlants.map(p=>{
                const active = sel===p.id;
                return (
                  <TouchableOpacity key={p.id} onPress={()=>setSel(p.id)} style={[s.plantChip, active&&s.plantChipActive]}>
                    <Text style={s.plantEmoji}>{p.emoji}</Text>
                    <Text style={[s.plantChipText, active&&s.plantChipTextActive]}>{p.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
          <View style={s.section}>
            <Text style={s.sectionTitle}>기록 종류</Text>
            <View style={s.typeGrid}>
              {entryTypes.map(t=>{
                const active = type===t.id;
                return (
                  <TouchableOpacity key={t.id} onPress={()=>setType(t.id)} style={[s.typeChip, active&&{ backgroundColor:t.color, borderColor:t.color }]}>
                    {active&&<Check color="#ffffff" size={14} style={{marginRight:4}}/>}
                    <Text style={[s.typeChipText, active&&{color:'#ffffff'}]}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View style={s.rowSection}>
            <View style={s.halfInput}>
              <Text style={s.sectionTitle}>날짜</Text>
              <View style={s.dtWrapper}><Calendar color="#9CA3AF" size={18} style={s.dtIcon}/><TextInput style={s.dtInput} value={date} onChangeText={setDate} keyboardType="numeric"/></View>
            </View>
            <View style={s.halfInput}>
              <Text style={s.sectionTitle}>시간</Text>
              <View style={s.dtWrapper}><Clock color="#9CA3AF" size={18} style={s.dtIcon}/><TextInput style={s.dtInput} value={time} onChangeText={setTime} keyboardType="numeric"/></View>
            </View>
          </View>
          <View style={s.section}>
            <Text style={s.sectionTitle}>내용</Text>
            <View style={[s.taWrapper, note.length>0&&s.taActive]}>
              <TextInput style={s.ta} placeholder="식물의 상태나 해주고 싶은 말을 적어보세요..." placeholderTextColor="#9CA3AF" multiline numberOfLines={6} textAlignVertical="top" value={note} onChangeText={(t)=>{ if(t.length<=500) setNote(t); }}/>
            </View>
            <View style={s.taFooter}>
              <View style={{flexDirection:'row',alignItems:'center'}}><Leaf color="#7CCB8A" size={12}/><Text style={s.hint}> 작은 변화도 소중한 기록이 돼요</Text></View>
              <Text style={s.hint}>{note.length}/500</Text>
            </View>
          </View>
        </ScrollView>
        <View style={s.bottomBar}>
          <TouchableOpacity style={[s.submitBtn, !canSubmit&&s.submitDisabled]} onPress={handleSubmit} disabled={!canSubmit}>
            <Text style={[s.submitText, !canSubmit&&{color:'#9CA3AF'}]}>기록 저장하기</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe:{ flex:1, backgroundColor:'#ffffff', paddingTop:Platform.OS==='android'?StatusBar.currentHeight:0 },
  appBar:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:8, paddingVertical:12, backgroundColor:'#ffffff', borderBottomWidth:1, borderBottomColor:'#E5E7EB' },
  iconBtn:{ padding:8 }, headerTitle:{ fontSize:18, fontWeight:'700', color:'#111827' },
  container:{ flex:1, backgroundColor:'#ffffff' }, scroll:{ padding:20, paddingBottom:40 },
  photoUpload:{ backgroundColor:'#F9FAFB', borderWidth:2, borderStyle:'dashed', borderColor:'#D1D5DB', borderRadius:24, height:160, alignItems:'center', justifyContent:'center', marginBottom:24 },
  photoInner:{ alignItems:'center' }, photoText:{ marginTop:12, fontSize:14, fontWeight:'500', color:'#6B7280' },
  section:{ marginBottom:28 }, sectionTitle:{ fontSize:15, fontWeight:'600', color:'#374151', marginBottom:12 },
  hScroll:{ gap:12, paddingRight:20 },
  plantChip:{ flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingVertical:10, backgroundColor:'#F9FAFB', borderWidth:2, borderColor:'transparent', borderRadius:20, marginRight:10 },
  plantChipActive:{ backgroundColor:'#F0FDF4', borderColor:'#7CCB8A' }, plantEmoji:{ fontSize:16, marginRight:8 },
  plantChipText:{ fontSize:14, fontWeight:'500', color:'#6B7280' }, plantChipTextActive:{ color:'#2E7D32', fontWeight:'600' },
  typeGrid:{ flexDirection:'row', flexWrap:'wrap', gap:10 },
  typeChip:{ flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingVertical:10, backgroundColor:'#ffffff', borderWidth:1, borderColor:'#D1D5DB', borderRadius:20, marginRight:8, marginBottom:8 },
  typeChipText:{ fontSize:14, fontWeight:'500', color:'#4B5563' },
  rowSection:{ flexDirection:'row', gap:16, marginBottom:28 }, halfInput:{ flex:1, marginRight:8 },
  dtWrapper:{ flexDirection:'row', alignItems:'center', backgroundColor:'#F9FAFB', borderWidth:1, borderColor:'#E5E7EB', borderRadius:16, paddingHorizontal:16, height:48 },
  dtIcon:{ marginRight:8 }, dtInput:{ flex:1, fontSize:15, color:'#111827' },
  taWrapper:{ backgroundColor:'#F9FAFB', borderWidth:1, borderColor:'#E5E7EB', borderRadius:20, padding:16 }, taActive:{ backgroundColor:'#ffffff', borderColor:'#7CCB8A' },
  ta:{ fontSize:15, color:'#111827', minHeight:120 },
  taFooter:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop:8, paddingHorizontal:4 },
  hint:{ fontSize:12, color:'#9CA3AF' },
  bottomBar:{ backgroundColor:'rgba(245,245,240,0.95)', borderTopWidth:1, borderTopColor:'rgba(229,231,235,0.6)', paddingHorizontal:20, paddingVertical:16 },
  submitBtn:{ backgroundColor:'#2d5a27', paddingVertical:16, borderRadius:16, alignItems:'center', justifyContent:'center' },
  submitDisabled:{ backgroundColor:'#E5E7EB' }, submitText:{ color:'#ffffff', fontSize:16, fontWeight:'600' },
});
