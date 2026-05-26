import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, TextInput, ScrollView, FlatList, TouchableOpacity, Image, StyleSheet, Platform, StatusBar, useWindowDimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, TrendingUp, Sparkles, Heart, BookOpen } from 'lucide-react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../../App';
import { bookApi, PlantBookItem } from '../../services/api';
import { useFavorites } from '../../lib/favoritesStore';

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
  { label: '전체',       key: 'all' },
  { label: '초보자용',   key: 'beginner' },
  { label: '다육식물',   key: 'succulent' },
  { label: '관엽식물',   key: 'foliage' },
  { label: '꽃/열매',    key: 'flower_fruit' },
];

const GRID_HORIZONTAL_PADDING = 16;
const CARD_GAP = 12;

// 인기 검색어 폴백: 도감이 비어있을 때 보여줄 기본 키워드
const FALLBACK_POPULAR = ['몬스테라', '산세베리아', '스킨답서스', '다육식물', '선인장', '고무나무'];
const POPULAR_SAMPLE_SIZE = 6;
const SUGGESTION_LIMIT = 6;

// 배열에서 N개 무작위 샘플 (중복 없이)
function sampleNames(items: PlantBookItem[], n: number): string[] {
  const names = Array.from(new Set(items.map((x) => x.plantName).filter(Boolean)));
  if (names.length <= n) return names;
  const out: string[] = [];
  const used = new Set<number>();
  while (out.length < n && used.size < names.length) {
    const idx = Math.floor(Math.random() * names.length);
    if (used.has(idx)) continue;
    used.add(idx);
    out.push(names[idx]);
  }
  return out;
}

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
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const favorites = useFavorites();
  const [popular, setPopular] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const allPlantsCacheRef = useRef<PlantBookItem[]>([]);

  const loadByCategory = useCallback(async (categoryKey: string) => {
    setIsLoading(true);
    try {
      const data = categoryKey === 'all'
        ? await bookApi.getAll()
        : await bookApi.getByCategory(categoryKey);
      const list = Array.isArray(data) ? data : [];
      setPlants(list);
      if (categoryKey === 'all' && list.length > 0) {
        allPlantsCacheRef.current = list;
        setPopular(sampleNames(list, POPULAR_SAMPLE_SIZE));
      }
    } catch (error) {
      console.error('도감 데이터를 불러오는데 실패했습니다:', error);
      setPlants([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadByCategory('all'); }, [loadByCategory]);

  // 화면에 그릴 목록: 헤더의 찜 토글이 켜져 있으면 현재 목록에서 찜한 항목만 필터링
  const displayedPlants = useMemo(() => {
    if (!favoriteOnly) return plants;
    return plants.filter((p) => favorites.has(p.speciesCode));
  }, [favoriteOnly, plants, favorites]);

  // 입력 중에는 백엔드 검색으로 추천어 갱신 (200ms 디바운스)
  useEffect(() => {
    const keyword = q.trim();
    if (!keyword) { setSuggestions([]); return; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const data = await bookApi.search(keyword);
        if (cancelled) return;
        const names = Array.from(new Set((data ?? []).map((x) => x.plantName).filter(Boolean))).slice(0, SUGGESTION_LIMIT);
        setSuggestions(names);
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    }, 200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [q]);

  const handleCategoryPress = (categoryKey: string) => {
    setCat(categoryKey);
    setQ('');
    loadByCategory(categoryKey);
  };

  const runSearch = async (keyword: string) => {
    if (!keyword) { loadByCategory(cat); return; }
    setIsLoading(true);
    setIsFocused(false);
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

  const handleSearch = () => runSearch(q.trim());

  const handleChipPress = (keyword: string) => {
    setQ(keyword);
    runSearch(keyword);
  };

  const handleFavoriteToggle = () => {
    setFavoriteOnly((prev) => !prev);
  };

  const handleBrowseAll = () => {
    setFavoriteOnly(false);
    setCat('all');
    setQ('');
    loadByCategory('all');
  };

  // 추천어 패널 표시 조건: 검색바 포커스 상태일 때만
  const keyword = q.trim();
  const showSuggestionPanel = isFocused;
  const popularChips = popular.length > 0 ? popular : FALLBACK_POPULAR;
  const favoriteCount = favorites.size;
  const emptyTitle = favoriteOnly
    ? favoriteCount === 0
      ? '아직 찜한 식물이 없어요'
      : '조건에 맞는 찜한 식물이 없어요'
    : '조건에 맞는 식물이 없습니다.';
  const favoriteEmptyDescription = favoriteCount === 0
    ? '마음에 드는 식물의 하트를 눌러\n나만의 위시리스트를 만들어보세요.'
    : '검색어나 카테고리 조건을 바꿔\n찜한 식물을 다시 찾아보세요.';

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff"/>
      <View style={s.appBar}>
        <Text style={s.title}>식물도감</Text>
        <TouchableOpacity
          style={[s.favoriteToggle, favoriteOnly && s.favoriteToggleActive]}
          onPress={handleFavoriteToggle}
          activeOpacity={0.85}
        >
          <Heart
            color={favoriteOnly ? '#ffffff' : '#2F6F3E'}
            fill={favoriteOnly ? '#ffffff' : 'transparent'}
            size={14}
          />
          <Text style={[s.favoriteToggleText, favoriteOnly && s.favoriteToggleTextActive]}>찜한 식물</Text>
          <View style={[s.favoriteCountBadge, favoriteOnly && s.favoriteCountBadgeActive]}>
            <Text style={[s.favoriteCountText, favoriteOnly && s.favoriteCountTextActive]}>{favoriteCount}</Text>
          </View>
        </TouchableOpacity>
      </View>
      <View style={s.searchSection}>
        <View style={s.searchBar}>
          <Search color="#9CA3AF" size={18}/>
          <TextInput
            style={s.searchInput}
            placeholder="5,000개 이상의 식물 종을 검색하세요"
            placeholderTextColor="#9CA3AF"
            value={q}
            onChangeText={setQ}
            onSubmitEditing={handleSearch}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 120)}
            returnKeyType="search"
          />
        </View>
      </View>
      {showSuggestionPanel && (
        <View style={s.suggestPanel}>
          <View style={s.suggestHeader}>
            {keyword ? (
              <><Sparkles color="#3a7d44" size={14}/><Text style={s.suggestTitle}>추천 검색어</Text></>
            ) : (
              <><TrendingUp color="#3a7d44" size={14}/><Text style={s.suggestTitle}>인기 검색어</Text></>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.suggestScroll} keyboardShouldPersistTaps="handled">
            {(keyword ? suggestions : popularChips).length === 0 ? (
              <Text style={s.suggestEmpty}>일치하는 식물이 없어요</Text>
            ) : (
              (keyword ? suggestions : popularChips).map((name) => (
                <TouchableOpacity key={name} style={s.suggestChip} onPress={() => handleChipPress(name)}>
                  <Text style={s.suggestChipText} numberOfLines={1}>{name}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}
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
      ) : displayedPlants.length === 0 ? (
        <View style={s.emptyState}>
          {favoriteOnly ? (
            <View style={s.emptyIconWrap}>
              <Heart color="#CBD5E1" size={30}/>
            </View>
          ) : null}
          <Text style={s.emptyTitle}>{emptyTitle}</Text>
          {favoriteOnly ? (
            <>
              <Text style={s.emptyDescription}>{favoriteEmptyDescription}</Text>
              <TouchableOpacity style={s.emptyCta} onPress={handleBrowseAll} activeOpacity={0.85}>
                <BookOpen color="#ffffff" size={15}/>
                <Text style={s.emptyCtaText}>도감 둘러보기</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      ) : (
        // numColumns가 바뀌면 FlatList는 key를 바꿔 강제 리마운트해야 함
        <FlatList
          key={`grid-${numColumns}`}
          data={displayedPlants}
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
  safe:{ flex:1, backgroundColor:'#F7F8F4', paddingTop: Platform.OS==='android'?StatusBar.currentHeight:0 },
  appBar:{ minHeight:52, paddingHorizontal:16, paddingVertical:10, backgroundColor:'#ffffff', borderBottomWidth:1, borderBottomColor:'#E5E7EB', flexDirection:'row', alignItems:'center', justifyContent:'space-between', gap:12 },
  title:{ fontSize:20, fontWeight:'700', color:'#3a7d44' },
  favoriteToggle:{ minHeight:32, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:4, paddingLeft:10, paddingRight:9, borderRadius:18, borderWidth:1, borderColor:'#2F6F3E', backgroundColor:'#ffffff' },
  favoriteToggleActive:{ backgroundColor:'#2F6F3E', borderColor:'#2F6F3E' },
  favoriteToggleText:{ fontSize:12, fontWeight:'700', color:'#2F6F3E' },
  favoriteToggleTextActive:{ color:'#ffffff' },
  favoriteCountBadge:{ minWidth:17, height:17, borderRadius:9, paddingHorizontal:5, alignItems:'center', justifyContent:'center', backgroundColor:'#E8F5E9' },
  favoriteCountBadgeActive:{ backgroundColor:'#ffffff' },
  favoriteCountText:{ fontSize:10, fontWeight:'800', color:'#2F6F3E' },
  favoriteCountTextActive:{ color:'#2F6F3E' },
  searchSection:{ flexDirection:'row', paddingHorizontal:16, paddingTop:14, paddingBottom:10, backgroundColor:'#F7F8F4' },
  searchBar:{ flex:1, flexDirection:'row', alignItems:'center', backgroundColor:'#ffffff', borderRadius:22, paddingHorizontal:16, height:44, borderWidth:1, borderColor:'#EEF0EC', ...Platform.select({ ios:{ shadowColor:'#000000', shadowOpacity:0.08, shadowRadius:8, shadowOffset:{ width:0, height:2 } }, android:{ elevation:2 } }) },
  searchInput:{ flex:1, marginLeft:8, fontSize:14, color:'#111827' },
  catsWrap:{ height:52, backgroundColor:'#F7F8F4' },
  catsScroll:{ paddingHorizontal:16, alignItems:'center', height:52 },
  catBadge:{ height:36, paddingHorizontal:16, borderRadius:20, backgroundColor:'#ffffff', borderWidth:1, borderColor:'#2F8A44', marginRight:8, alignItems:'center', justifyContent:'center' },
  catActive:{ backgroundColor:'#2F8A44', borderColor:'#2F8A44' },
  catText:{ fontSize:14, fontWeight:'600', color:'#2F8A44' },
  catTextActive:{ color:'#ffffff', fontWeight:'700' },
  card:{ backgroundColor:'#ffffff', borderRadius:16, overflow:'hidden', borderWidth:1, borderColor:'#E5E7EB', elevation:2 },
  cardImage:{ width:'100%', backgroundColor:'#F3F4F6' },
  cardInfo:{ padding:12 },
  plantName:{ fontSize:16, fontWeight:'700', color:'#111827' },
  plantSpecies:{ fontSize:12, color:'#6B7280', marginTop:2, fontStyle:'italic' },
  tag:{ alignSelf:'flex-start', backgroundColor:'#F3F4F6', paddingHorizontal:8, paddingVertical:4, borderRadius:6, marginTop:8 },
  tagText:{ fontSize:11, fontWeight:'600', color:'#4B5563' },
  loadingWrap:{ paddingVertical:60, alignItems:'center', justifyContent:'center' },
  emptyState:{ flex:1, alignItems:'center', justifyContent:'center', paddingHorizontal:32, paddingBottom:72 },
  emptyIconWrap:{ width:56, height:56, borderRadius:28, backgroundColor:'#ffffff', alignItems:'center', justifyContent:'center', marginBottom:18 },
  emptyTitle:{ textAlign:'center', color:'#111827', fontSize:15, fontWeight:'800', marginBottom:8 },
  emptyDescription:{ textAlign:'center', color:'#64748B', fontSize:13, lineHeight:20, marginBottom:20 },
  emptyCta:{ height:40, paddingHorizontal:18, borderRadius:20, backgroundColor:'#2F8A44', flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6 },
  emptyCtaText:{ color:'#ffffff', fontSize:14, fontWeight:'800' },
  suggestPanel:{ backgroundColor:'#ffffff', paddingTop:4, paddingBottom:8, borderBottomWidth:1, borderBottomColor:'#F3F4F6' },
  suggestHeader:{ flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:16, paddingVertical:6 },
  suggestTitle:{ fontSize:12, fontWeight:'600', color:'#3a7d44' },
  suggestScroll:{ paddingHorizontal:16, gap:8, alignItems:'center' },
  suggestEmpty:{ fontSize:13, color:'#9CA3AF', paddingVertical:6 },
  suggestChip:{ height:32, paddingHorizontal:12, borderRadius:16, backgroundColor:'#F1F8F2', borderWidth:1, borderColor:'#CDE8D3', alignItems:'center', justifyContent:'center' },
  suggestChipText:{ fontSize:13, fontWeight:'500', color:'#2E7D32' },
});
