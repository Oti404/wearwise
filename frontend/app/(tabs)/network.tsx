import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, UserPlus, Sparkles, X, MapPin, PackageOpen } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useFollow } from '@/hooks/useFollow';
import { useClothes } from '@/hooks/useClothes';
import { useAppStore } from '@/store/useAppStore';

export default function NetworkScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { fetchSuggestedUsers, searchNetworkUsers, loading: followLoading } = useFollow();
  const { fetchExploreFeed } = useClothes();
  
  const [users, setUsers] = useState<any[]>([]);
  const [trendingWardrobes, setTrendingWardrobes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const dk = useAppStore((state) => state.isDarkMode);
  // loading is true if follow is loading
  const loading = followLoading;

  useEffect(() => {
    loadContent();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        handleSearch(searchQuery);
      } else {
        setSearchResults(null);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const loadContent = async () => {
    // Parallell fetch to get both suggested users and explore feed for trending
    const [sugData, exploreData] = await Promise.all([
      fetchSuggestedUsers(),
      fetchExploreFeed()
    ]);
    
    setUsers(sugData || []);

    if (exploreData && exploreData.length > 0) {
      const userMap = new Map();
      exploreData.forEach((item: any) => {
        if (!item.owner || !item.owner.id) return;
        if (!userMap.has(item.owner.id)) {
          userMap.set(item.owner.id, {
            id: item.owner.id,
            owner: item.owner,
            distance: item.distance,
            items: []
          });
        }
        userMap.get(item.owner.id).items.push(item);
      });
      // Sort by closest distance and keep top 5
      const trending = Array.from(userMap.values())
        .sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 5);
      
      setTrendingWardrobes(trending);
    }
  };

  const handleSearch = async (query: string) => {
    const results = await searchNetworkUsers(query);
    setSearchResults(results);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.userCard, dk && styles.userCardDark]}
      onPress={() => router.push(`/user/${item.id}`)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.avatarUrl || item.previewImage || 'https://placehold.co/60/png' }}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Text style={[styles.userName, dk && styles.textDark]}>{item.firstName} {item.lastName}</Text>
        <Text style={styles.userStats}>{item.followersCount} followers</Text>
      </View>
      <View style={styles.viewBtn}>
        <Text style={styles.viewBtnText}>View</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }, dk && styles.containerDark]}>
      <View style={styles.header}>
        <View style={styles.headerTag}>
          <Search size={14} color="#F4C542" />
          <Text style={styles.tagText}>NETWORK</Text>
        </View>
        <Text style={[styles.title, dk && styles.textDark]}>Discover Users</Text>

        <View style={[styles.searchBox, dk && styles.searchBoxDark]}>
          <Search size={18} color={dk ? '#C084FC' : '#9B59B6'} />
          <TextInput
            style={[styles.searchInput, dk && styles.textDark]}
            placeholder="Search by name or email..."
            placeholderTextColor={dk ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color="gray" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && !searchResults && users.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#5A2D82" />
        </View>
      ) : (
        <FlatList
          data={searchResults !== null ? searchResults : users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View>
              {/* TRENDING WARDROBES CAROUSEL (Hidden during search) */}
              {searchResults === null && trendingWardrobes.length > 0 && (
                <View style={styles.trendingContainer}>
                  <View style={styles.trendingHeader}>
                    <Sparkles size={16} color="#F4C542" />
                    <Text style={[styles.trendingTitle, dk && styles.textDark]}>Trending Local Wardrobes</Text>
                  </View>
                  <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingLeft: 20, paddingRight: 10 }}
                    data={trendingWardrobes}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity 
                        style={[styles.trendingCard, dk && styles.trendingCardDark]}
                        activeOpacity={0.9}
                        onPress={() => router.push(`/user/${item.id}`)}
                      >
                        {/* Profile Info */}
                        <View style={styles.trendingUserRow}>
                          <Image source={{ uri: item.owner.avatarUrl || 'https://placehold.co/60/png' }} style={styles.trendingAvatar} />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.trendingName, dk && styles.textDark]} numberOfLines={1}>
                              {item.owner.firstName}
                            </Text>
                            <View style={styles.trendingMetaRow}>
                              <PackageOpen size={10} color="gray" />
                              <Text style={styles.trendingMetaText}>{item.items.length} items</Text>
                              {item.distance && (
                                <>
                                  <Text style={styles.trendingMetaDot}> • </Text>
                                  <MapPin size={10} color="gray" />
                                  <Text style={styles.trendingMetaText}>{Number(item.distance).toFixed(1)} km</Text>
                                </>
                              )}
                            </View>
                          </View>
                        </View>
                        
                        {/* 3 Images Collage Grid */}
                        <View style={styles.trendingImageGrid}>
                          {/* Left: Large Highlight Image */}
                          {item.items[0] && (
                            <Image 
                              source={{ uri: item.items[0].primaryImage || 'https://placehold.co/150/png' }} 
                              style={styles.trendingGridImgLarge}
                              resizeMode="cover"
                            />
                          )}
                          
                          {/* Right: Stack of 2 Smaller Images */}
                          <View style={styles.trendingGridSmallStack}>
                            {[1, 2].map((idx) => {
                              const imgItem = item.items[idx];
                              return (
                                <View key={idx} style={styles.trendingGridImgSmallContainer}>
                                  {imgItem ? (
                                    <Image 
                                      source={{ uri: imgItem.primaryImage || 'https://placehold.co/150/png' }} 
                                      style={styles.trendingGridImgSmall}
                                      resizeMode="cover"
                                    />
                                  ) : (
                                    <View style={[styles.trendingGridImgSmall, { backgroundColor: dk ? '#333' : '#F5F5F5' }]} />
                                  )}
                                </View>
                              );
                            })}
                          </View>
                        </View>
                        
                        <View style={styles.trendingFooter}>
                          <Text style={styles.trendingFooterText}>View Full Closet</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}

              <Text style={[styles.sectionTitle, dk && styles.textDark, { marginLeft: 20 }]}>
                {searchResults !== null ? `Search Results (${searchResults.length})` : 'Suggested For You'}
              </Text>
            </View>
          }
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.center}>
              <UserPlus size={48} color="rgba(43,43,43,0.2)" />
              <Text style={styles.emptyText}>
                {searchResults !== null ? 'No users found matching your search.' : 'No suggestions available.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  containerDark: { backgroundColor: '#1E1E1E' },
  header: { paddingHorizontal: 24, paddingBottom: 20 },
  headerTag: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  tagText: { fontSize: 10, fontWeight: '900', color: '#8E44AD', letterSpacing: 2 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#2B2B2B', letterSpacing: -1, marginBottom: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, paddingHorizontal: 16, height: 52, borderWidth: 1, borderColor: 'rgba(90,45,130,0.05)' },
  searchBoxDark: { backgroundColor: '#2B2B2B', borderColor: 'rgba(255,255,255,0.05)' },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, fontWeight: '500', color: '#1A1A2E' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E', marginBottom: 16 },
  textDark: { color: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, color: 'gray' },
  listContent: { paddingBottom: 100 },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 20, marginBottom: 12, marginHorizontal: 20 },
  userCardDark: { backgroundColor: '#2B2B2B' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EEE', marginRight: 16 },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  userStats: { fontSize: 13, color: 'gray' },
  viewBtn: { backgroundColor: '#5A2D82', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  viewBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  
  // Trending Wardrobes Styles
  trendingContainer: { marginBottom: 24, marginTop: 10 },
  trendingHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16, gap: 8 },
  trendingTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  trendingCard: { width: 260, backgroundColor: '#FFF', borderRadius: 24, padding: 16, marginRight: 16, shadowColor: '#5A2D82', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  trendingCardDark: { backgroundColor: '#2B2B2B', shadowColor: '#000', elevation: 0 },
  trendingUserRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  trendingAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12, backgroundColor: '#EEE' },
  trendingName: { fontSize: 15, fontWeight: '800', color: '#1A1A2E', marginBottom: 2 },
  trendingMetaRow: { flexDirection: 'row', alignItems: 'center' },
  trendingMetaText: { fontSize: 11, color: 'gray', marginLeft: 4 },
  trendingMetaDot: { fontSize: 11, color: 'gray', marginHorizontal: 2 },
  trendingImageGrid: { flexDirection: 'row', height: 116, gap: 6, borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  trendingGridImgLarge: { flex: 2, height: '100%', backgroundColor: '#EEE', borderRadius: 12 },
  trendingGridSmallStack: { flex: 1, gap: 6 },
  trendingGridImgSmallContainer: { flex: 1 },
  trendingGridImgSmall: { width: '100%', height: '100%', backgroundColor: '#EEE', borderRadius: 8 },
  trendingFooter: { alignItems: 'center', backgroundColor: 'rgba(90,45,130,0.05)', paddingVertical: 10, borderRadius: 12 },
  trendingFooterText: { fontSize: 12, fontWeight: '800', color: '#5A2D82' }
});
