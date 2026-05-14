import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image, StyleSheet, SafeAreaView, Platform, StatusBar, Dimensions, ActivityIndicator } from 'react-native';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../../App';
import { bookApi, PlantBookItem } from '../../services/api';

type EncyclopediaNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Encyclopedia'>,
  NativeStackNavigationProp<RootStackParamList>
>;
const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;
const CATEGORIES = ['전체','초보자용','다육식물','관엽식물','꽃/열매','공기정화'];

export function PlantEncyclopedia() {
  const navigation = useNavigation<EncyclopediaNavigationProp>();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('전체');
  const [plants, setPlants] = useState<PlantBookItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await bookApi.getAll();
      setPlants(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('도감 데이터를 불러오는데 실패했습니다:', error);
      setPlants([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleSearch = async () => {
    const keyword = q.trim();
    if (!keyword) { loadAll(); return; }
    setIsLoading(true);
    try {
      const data = await bookApi.search(keyword);
      setPlants(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('도감 검색에 실패했습니다:', error);
      setPlants([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff"/>
      <View style={s.appBar}><Text style={s.title}>식물도감</Text></View>
      <View style={s.searchSection}>
        <View style={s.searchBar}>
          <Search color="#9CA3AF" size={20}/>
          <TextInput style={s.searchInput} placeholder="식물 이름이나 학명 검색" placeholderTextColor="#9CA3AF" value={q} onChangeText={setQ} onSubmitEditing={handleSearch} returnKeyType="search"/>
        </View>
        <TouchableOpacity style={s.filterBtn} onPress={handleSearch}><SlidersHorizontal color="#374151" size={20}/></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catsScroll} style={{ maxHeight: 60 }}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity key={c} style={[s.catBadge, cat===c && s.catActive]} onPress={() => setCat(c)}>
            <Text style={[s.catText, cat===c && s.catTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView contentContainerStyle={s.gridContent}>
        {isLoading ? (
          <View style={s.loadingWrap}><ActivityIndicator size="large" color="#3a7d44"/></View>
        ) : plants.length === 0 ? (
          <Text style={s.emptyText}>조건에 맞는 식물이 없습니다.</Text>
        ) : (
          <View style={s.grid}>
            {plants.map(plant => (
              <TouchableOpacity key={plant.speciesCode} style={s.card} onPress={() => navigation.navigate('EncyclopediaDetail', { speciesCode: plant.speciesCode })}>
                <Image source={plant.imageUrl ? { uri: plant.imageUrl } : undefined} style={s.cardImage}/>
                <View style={s.cardInfo}>
                  <Text style={s.plantName}>{plant.name}</Text>
                  {plant.scientificName ? <Text style={s.plantSpecies}>{plant.scientificName}</Text> : null}
                  {plant.difficulty ? <View style={s.tag}><Text style={s.tagText}>{plant.difficulty}</Text></View> : null}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe:{ flex:1, backgroundColor:'#ffffff', paddingTop: Platform.OS==='android'?StatusBar.currentHeight:0 },
  appBar:{ paddingHorizontal:16, paddingVertical:16, backgroundColor:'#ffffff', borderBottomWidth:1, borderBottomColor:'#E5E7EB' },
  title:{ fontSize:20, fontWeight:'700', color:'#3a7d44' },
  searchSection:{ flexDirection:'row', paddingHorizontal:16, paddingVertical:12, gap:12, backgroundColor:'#ffffff' },
  searchBar:{ flex:1, flexDirection:'row', alignItems:'center', backgroundColor:'#F3F4F6', borderRadius:12, paddingHorizontal:12, height:44 },
  searchInput:{ flex:1, marginLeft:8, fontSize:15, color:'#111827' },
  filterBtn:{ width:44, height:44, backgroundColor:'#F3F4F6', borderRadius:12, alignItems:'center', justifyContent:'center' },
  catsScroll:{ paddingHorizontal:16, gap:8, paddingVertical:8 },
  catBadge:{ paddingHorizontal:16, paddingVertical:8, borderRadius:20, backgroundColor:'#F3F4F6', borderWidth:1, borderColor:'transparent', marginRight:8 },
  catActive:{ backgroundColor:'#E8F5E9', borderColor:'#7CCB8A' },
  catText:{ fontSize:14, fontWeight:'500', color:'#6B7280' },
  catTextActive:{ color:'#2E7D32', fontWeight:'600' },
  gridContent:{ padding:16, paddingBottom:100 },
  grid:{ flexDirection:'row', flexWrap:'wrap', justifyContent:'space-between' },
  card:{ width:cardWidth, backgroundColor:'#ffffff', borderRadius:16, marginBottom:16, overflow:'hidden', borderWidth:1, borderColor:'#E5E7EB', elevation:2 },
  cardImage:{ width:'100%', height:cardWidth, backgroundColor:'#F3F4F6' },
  cardInfo:{ padding:12 },
  plantName:{ fontSize:16, fontWeight:'700', color:'#111827' },
  plantSpecies:{ fontSize:12, color:'#6B7280', marginTop:2, fontStyle:'italic' },
  tag:{ alignSelf:'flex-start', backgroundColor:'#F3F4F6', paddingHorizontal:8, paddingVertical:4, borderRadius:6, marginTop:8 },
  tagText:{ fontSize:11, fontWeight:'600', color:'#4B5563' },
  loadingWrap:{ paddingVertical:60, alignItems:'center', justifyContent:'center' },
  emptyText:{ textAlign:'center', marginTop:60, color:'#6B7280', fontSize:14 },
});
