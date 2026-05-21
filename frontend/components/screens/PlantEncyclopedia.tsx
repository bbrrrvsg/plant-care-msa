import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, FlatList, TouchableOpacity, Image, StyleSheet, Platform, StatusBar, useWindowDimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

// 화면 너비별 컬럼 수: 모바일 2 → 태블릿 3 → 작은 데스크탑 4 → 와이드 5
function getNumColumns(width: number): number {
  if (width >= 1280) return 5;
  if (width >= 960) return 4;
  if (width >= 640) return 3;
  return 2;
}

// 칩 라벨 → 백엔드 카테고리 키 (BookController @RequestParam category)
const CATEGORIES: { label: string; key: string }[] = [
  { label: '전체',     key: 'all' },
  { label: '초보자용', key: 'beginner' },
  { label: '다육식물', key: 'succulent' },
  { label: '관엽식물', key: 'foliage' },
  { label: '꽃/열매',  key: 'flower_fruit' },
];

const GRID_HORIZONTAL_PADDING = 16;
const CARD_GAP = 12;

export function PlantEncyclopedia() {
  const navigation = useNavigation<EncyclopediaNavigationProp>();
  const { width } = useWindowDimensions();
  const numColumns = getNumColumns(width);
  const cardWidth = useMemo(
    () => (width - GRID_HORIZONTAL_PADDING * 2 - CARD_GAP * (numColumns - 1)) / numColumns,
    [width, numColumns]
  );
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [plants, setPlants] = useState<PlantBookItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadByCategory = useCallback(async (categoryKey: string) => {
    setIsLoading(true);
    try {
      const data = categoryKey === 'all'
        ? await bookApi.getAll()
        : await bookApi.getByCategory(categoryKey);
      setPlants(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('도감 데이터를 불러오는데 실패했습니다:', error);
      setPlants([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadByCategory('all'); }, [loadByCategory]);

  const handleCategoryPress = (categoryKey: string) => {
    setCat(categoryKey);
    setQ('');
    loadByCategory(categoryKey);
  };

  const handleSearch = async () => {
    const keyword = q.trim();
    if (!keyword) { loadByCategory(cat); return; }
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
      <View style={s.catsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catsScroll}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity key={c.key} style={[s.catBadge, cat===c.key && s.catActive]} onPress={() => handleCategoryPress(c.key)}>
              <Text style={[s.catText, cat===c.key && s.catTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      {isLoading ? (
        <View style={s.loadingWrap}><ActivityIndicator size="large" color="#3a7d44"/></View>
      ) : plants.length === 0 ? (
        <Text style={s.emptyText}>조건에 맞는 식물이 없습니다.</Text>
      ) : (
        // numColumns가 바뀌면 FlatList는 key를 바꿔 강제 리마운트해야 함
        <FlatList
          key={`grid-${numColumns}`}
          data={plants}
          keyExtractor={(item) => String(item.speciesCode)}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? { gap: CARD_GAP, paddingHorizontal: GRID_HORIZONTAL_PADDING } : undefined}
          contentContainerStyle={{ paddingVertical: 16, paddingBottom: 100 }}
          ItemSeparatorComponent={() => <View style={{ height: CARD_GAP }} />}
          initialNumToRender={numColumns * 4}
          windowSize={5}
          removeClippedSubviews
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[s.card, { width: cardWidth }]}
              onPress={() => navigation.navigate('EncyclopediaDetail', { speciesCode: item.speciesCode })}
            >
              <Image source={item.imageUrl ? { uri: item.imageUrl } : undefined} style={[s.cardImage, { height: cardWidth }]}/>
              <View style={s.cardInfo}>
                <Text style={s.plantName} numberOfLines={1}>{item.plantName}</Text>
                {item.careLevel ? <View style={s.tag}><Text style={s.tagText}>{item.careLevel}</Text></View> : null}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
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
  catsWrap:{ height:56, backgroundColor:'#ffffff' },
  catsScroll:{ paddingHorizontal:16, alignItems:'center', height:56 },
  catBadge:{ height:36, paddingHorizontal:16, borderRadius:20, backgroundColor:'#F3F4F6', borderWidth:1, borderColor:'transparent', marginRight:8, alignItems:'center', justifyContent:'center' },
  catActive:{ backgroundColor:'#E8F5E9', borderColor:'#7CCB8A' },
  catText:{ fontSize:14, fontWeight:'500', color:'#6B7280' },
  catTextActive:{ color:'#2E7D32', fontWeight:'600' },
  card:{ backgroundColor:'#ffffff', borderRadius:16, overflow:'hidden', borderWidth:1, borderColor:'#E5E7EB', elevation:2 },
  cardImage:{ width:'100%', backgroundColor:'#F3F4F6' },
  cardInfo:{ padding:12 },
  plantName:{ fontSize:16, fontWeight:'700', color:'#111827' },
  plantSpecies:{ fontSize:12, color:'#6B7280', marginTop:2, fontStyle:'italic' },
  tag:{ alignSelf:'flex-start', backgroundColor:'#F3F4F6', paddingHorizontal:8, paddingVertical:4, borderRadius:6, marginTop:8 },
  tagText:{ fontSize:11, fontWeight:'600', color:'#4B5563' },
  loadingWrap:{ paddingVertical:60, alignItems:'center', justifyContent:'center' },
  emptyText:{ textAlign:'center', marginTop:60, color:'#6B7280', fontSize:14 },
});
