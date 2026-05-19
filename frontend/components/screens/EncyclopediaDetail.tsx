import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Platform, StatusBar, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { ChevronLeft, Heart, Droplets, Sun, Thermometer, CloudRain, Plus, SquarePen } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { bookApi, plantApi, getUserId, PlantBookDetail } from '../../services/api';
const { width } = Dimensions.get('window');
const CareCard = ({ icon, label, value }:any) => (
  <View style={s.careCard}><View style={s.careIcon}>{icon}</View><Text style={s.careLabel}>{label}</Text><Text style={s.careValue}>{value}</Text></View>
);
export function EncyclopediaDetail() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'EncyclopediaDetail'>>();
  const { speciesCode } = route.params;

  const [plant, setPlant] = useState<PlantBookDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await bookApi.getById(speciesCode);
        if (mounted) setPlant(data ?? null);
      } catch (error) {
        console.error('도감 상세 정보를 불러오는데 실패했습니다:', error);
        if (mounted) setPlant(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [speciesCode]);

  const handleDiaryPress = async () => {
    if (!plant) return;

    const userId = getUserId();
    if (userId == null) {
      Alert.alert('오류', '로그인이 필요해요.');
      return;
    }

    try {
      const myPlants = await plantApi.getMyPlants(userId);
      const match = myPlants.find(
        (p) => p.speciesCode != null && Number(p.speciesCode) === plant.speciesCode
      );

      if (match) {
        navigation.navigate('DiaryWrite', { plantId: match.myPlantId });
      } else {
        Alert.alert(
          '식물 등록 필요',
          `${plant.plantName}이(가) 아직 등록되어 있지 않아요. 먼저 등록할까요?`,
          [
            { text: '취소', style: 'cancel' },
            {
              text: '등록하러 가기',
              onPress: () => navigation.navigate('AddPlant', {
                speciesCode: plant.speciesCode,
                plantName: plant.plantName,
              }),
            },
          ]
        );
      }
    } catch (e) {
      Alert.alert('오류', e instanceof Error ? e.message : '식물 정보를 가져오지 못했어요.');
    }
  };

  if (isLoading) {
    return (
      <View style={s.center}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff"/>
        <ActivityIndicator size="large" color="#3a7d44"/>
      </View>
    );
  }

  if (!plant) {
    return (
      <View style={s.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff"/>
        <View style={s.floatingHeader}>
          <TouchableOpacity style={s.headerBtn} onPress={()=>navigation.goBack()}><ChevronLeft color="#111827" size={24}/></TouchableOpacity>
        </View>
        <View style={s.center}><Text style={s.errorText}>식물 정보를 불러올 수 없습니다.</Text></View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent/>
      <View style={s.floatingHeader}>
        <TouchableOpacity style={s.headerBtn} onPress={()=>navigation.goBack()}><ChevronLeft color="#111827" size={24}/></TouchableOpacity>
        <TouchableOpacity style={s.headerBtn}><Heart color="#EF4444" size={24}/></TouchableOpacity>
      </View>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        <View style={s.imageContainer}>
          {plant.imageUrl ? (
            <Image source={{ uri: plant.imageUrl }} style={s.heroImage}/>
          ) : (
            <View style={[s.heroImage, s.heroPlaceholder]}/>
          )}
        </View>
        <View style={s.sheet}>
          <View style={s.titleRow}>
            <View style={{flex:1,paddingRight:16}}>
              <Text style={s.plantName}>{plant.plantName}</Text>
            </View>
            {plant.careLevel ? (
              <View style={s.diffBadge}><Text style={s.diffText}>{plant.careLevel}</Text></View>
            ) : null}
          </View>
          <View style={s.section}>
            <Text style={s.sectionTitle}>관리 가이드</Text>
            <View style={s.careGrid}>
              {plant.watering ? (
                <CareCard icon={<Droplets color="#3B82F6" size={20}/>} label="물주기" value={plant.watering}/>
              ) : null}
              {plant.sunlight ? (
                <CareCard icon={<Sun color="#F59E0B" size={20}/>} label="햇빛" value={plant.sunlight}/>
              ) : null}
              {plant.temperature ? (
                <CareCard icon={<Thermometer color="#EF4444" size={20}/>} label="적정 온도" value={plant.temperature}/>
              ) : null}
              {plant.humidity ? (
                <CareCard icon={<CloudRain color="#0EA5E9" size={20}/>} label="적정 습도" value={plant.humidity}/>
              ) : null}
            </View>
          </View>
          <View style={s.actionContainer}>
            <TouchableOpacity
              style={s.primaryBtn}
              onPress={()=>navigation.navigate('AddPlant', {
                speciesCode: plant.speciesCode,
                plantName: plant.plantName,
              })}
            >
              <Plus color="#ffffff" size={20}/><Text style={s.primaryBtnText}>내 식물로 등록하기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.secondaryBtn} onPress={handleDiaryPress}>
              <SquarePen color="#3a7d44" size={18}/><Text style={s.secondaryBtnText}>성장 기록 쓰기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#ffffff' },
  floatingHeader:{ position:'absolute', top:Platform.OS==='android'?StatusBar.currentHeight!+10:50, left:0, right:0, flexDirection:'row', justifyContent:'space-between', paddingHorizontal:16, zIndex:10 },
  headerBtn:{ width:44, height:44, borderRadius:22, backgroundColor:'rgba(255,255,255,0.9)', alignItems:'center', justifyContent:'center', elevation:3 },
  scrollContent:{ flexGrow:1, paddingBottom:40 },
  imageContainer:{ width, height:width*1.1 },
  heroImage:{ width:'100%', height:'100%', resizeMode:'cover' },
  sheet:{ marginTop:-40, backgroundColor:'#ffffff', borderTopLeftRadius:32, borderTopRightRadius:32, paddingHorizontal:24, paddingTop:32 },
  titleRow:{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 },
  plantName:{ fontSize:26, fontWeight:'800', color:'#111827', marginBottom:4 },
  scientificName:{ fontSize:14, color:'#6B7280', fontStyle:'italic' },
  diffBadge:{ backgroundColor:'#F0FDF4', paddingHorizontal:12, paddingVertical:6, borderRadius:12, borderWidth:1, borderColor:'#BBF7D0' },
  diffText:{ fontSize:13, fontWeight:'700', color:'#16A34A' },
  desc:{ fontSize:15, lineHeight:24, color:'#4B5563', marginBottom:32 },
  section:{ marginBottom:32 }, sectionTitle:{ fontSize:18, fontWeight:'700', color:'#111827', marginBottom:16 },
  careGrid:{ flexDirection:'row', flexWrap:'wrap', justifyContent:'space-between', gap:12 },
  careCard:{ width:(width-48-12)/2, backgroundColor:'#ffffff', borderRadius:20, padding:16, borderWidth:1, borderColor:'#F3F4F6', elevation:1, marginBottom:12 },
  careIcon:{ width:40, height:40, borderRadius:20, backgroundColor:'#F9FAFB', alignItems:'center', justifyContent:'center', marginBottom:12 },
  careLabel:{ fontSize:12, color:'#9CA3AF', marginBottom:4, fontWeight:'500' },
  careValue:{ fontSize:14, fontWeight:'600', color:'#374151', lineHeight:20 },
  actionContainer:{ gap:12, marginTop:8 },
  primaryBtn:{ flexDirection:'row', backgroundColor:'#3a7d44', height:56, borderRadius:16, alignItems:'center', justifyContent:'center', gap:8 },
  primaryBtnText:{ color:'#ffffff', fontSize:16, fontWeight:'700' },
  secondaryBtn:{ flexDirection:'row', backgroundColor:'#f5f5f0', borderWidth:1, borderColor:'rgba(58,125,68,0.3)', height:56, borderRadius:16, alignItems:'center', justifyContent:'center', gap:8 },
  secondaryBtnText:{ color:'#3a7d44', fontSize:16, fontWeight:'700' },
  center:{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#ffffff' },
  errorText:{ fontSize:15, color:'#6B7280' },
  heroPlaceholder:{ backgroundColor:'#E5E7EB' },
  tipBox:{ backgroundColor:'#F0FDF4', padding:14, borderRadius:12, borderWidth:1, borderColor:'#BBF7D0' },
  tipText:{ fontSize:14, color:'#166534', lineHeight:20 },
});
