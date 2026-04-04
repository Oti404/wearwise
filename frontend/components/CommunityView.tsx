import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  Dimensions,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Users, Sparkles, ChevronRight, UserPlus, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { useFollow, PublicUser } from '@/hooks/useFollow';
import { useClothes, ClothingItem } from '@/hooks/useClothes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 2;
const GRID_COLS = 3;
const TILE_SIZE = (SCREEN_WIDTH - GRID_GAP * (GRID_COLS + 1)) / GRID_COLS;

// ────────────────────────────────────────────────────────────────────────────
// Sub-component: UserCard (horizontal scroll suggested)
// ────────────────────────────────────────────────────────────────────────────
function UserCard({ user, onFollowToggle }: { user: PublicUser; onFollowToggle: (id: string) => void }) {
  const [following, setFollowing] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const dk = useAppStore((s: any) => s.isDarkMode);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    setFollowing(prev => !prev);
    onFollowToggle(user.id);
  };

  const displayName = `${user.firstName || ''}${user.lastName ? ' ' + user.lastName : ''}`.trim() || 'WearWise User';
  const initials = (user.firstName?.[0] || '') + (user.lastName?.[0] || '');

  return (
    <View style={[styles.userCard, dk && { backgroundColor: '#2B2B2B' }]}>
      {user.avatarUrl ? (
        <Image source={{ uri: user.avatarUrl }} style={styles.userCardAvatar} />
      ) : (
        <View style={[styles.userCardAvatarPlaceholder, { backgroundColor: '#5A2D82' }]}>
          <Text style={styles.avatarInitials}>{initials.toUpperCase() || '?'}</Text>
        </View>
      )}
      {user.previewImage && (
        <Image source={{ uri: user.previewImage }} style={styles.userCardBg} blurRadius={2} />
      )}
      <View style={styles.userCardOverlay} />
      <Text style={styles.userCardName} numberOfLines={1}>{displayName}</Text>
      <Text style={styles.userCardFollowers}>{user.followersCount} followers</Text>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[styles.followBtn, following && styles.followBtnActive]}
          onPress={handlePress}
          activeOpacity={0.85}
        >
          {following ? (
            <Check size={12} color="#5A2D82" strokeWidth={3} />
          ) : (
            <UserPlus size={12} color="#FFF" strokeWidth={2.5} />
          )}
          <Text style={[styles.followBtnText, following && styles.followBtnTextActive]}>
            {following ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Sub-component: SearchResultCard
// ────────────────────────────────────────────────────────────────────────────
function SearchResultCard({ user, onPress }: { user: PublicUser; onPress: () => void }) {
  const dk = useAppStore((s: any) => s.isDarkMode);
  const displayName = `${user.firstName || ''}${user.lastName ? ' ' + user.lastName : ''}`.trim() || 'WearWise User';
  const initials = (user.firstName?.[0] || '') + (user.lastName?.[0] || '');

  return (
    <TouchableOpacity
      style={[styles.searchResult, dk && { backgroundColor: '#2B2B2B', borderColor: 'rgba(255,255,255,0.06)' }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {user.avatarUrl ? (
        <Image source={{ uri: user.avatarUrl }} style={styles.searchResultAvatar} />
      ) : (
        <View style={[styles.searchResultAvatarPlaceholder, { backgroundColor: '#5A2D82' }]}>
          <Text style={styles.searchResultInitials}>{initials.toUpperCase() || '?'}</Text>
        </View>
      )}
      <View style={styles.searchResultInfo}>
        <Text style={[styles.searchResultName, dk && { color: '#FFFFFF' }]}>{displayName}</Text>
        <Text style={styles.searchResultMeta}>
          {user.followersCount} followers{user.city ? ` · ${user.city}` : ''}
        </Text>
      </View>
      <ChevronRight size={16} color={dk ? 'rgba(255,255,255,0.3)' : 'rgba(43,43,43,0.3)'} />
    </TouchableOpacity>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main: CommunityView
// ────────────────────────────────────────────────────────────────────────────
export default function CommunityView() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDarkMode, user } = useAppStore();
  const dk = isDarkMode;

  const { getSuggestedUsers, searchUsers, followUser, unfollowUser } = useFollow();
  const { fetchExploreFeed } = useClothes();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PublicUser[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<PublicUser[]>([]);
  const [discoverItems, setDiscoverItems] = useState<ClothingItem[]>([]);
  const [loadingSuggested, setLoadingSuggested] = useState(true);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadSuggested();
    loadDiscover();
  }, []);

  const loadSuggested = async () => {
    setLoadingSuggested(true);
    try {
      const users = await getSuggestedUsers(15);
      setSuggestedUsers(users);
    } finally {
      setLoadingSuggested(false);
    }
  };

  const loadDiscover = async () => {
    try {
      const result = await fetchExploreFeed(undefined, 30);
      setDiscoverItems(result.items);
    } catch {}
  };

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      const results = await searchUsers(searchQuery.trim());
      setSearchResults(results);
    }, 350);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [searchQuery]);

  const handleFollowToggle = useCallback(async (userId: string) => {
    const currentlyFollowing = followingMap[userId];
    setFollowingMap(prev => ({ ...prev, [userId]: !currentlyFollowing }));
    if (currentlyFollowing) {
      await unfollowUser(userId);
    } else {
      await followUser(userId);
    }
  }, [followingMap]);

  const handleUserPress = (userId: string) => {
    router.push({ pathname: '/user/[id]', params: { id: userId } });
  };

  const isSearching = searchQuery.trim().length > 0;

  return (
    <View style={[styles.container, dk && { backgroundColor: '#1E1E1E' }]}>
      {/* Aura background */}
      <View style={[styles.auraContainer, { pointerEvents: 'none' as any }]}>
        <View style={[styles.auraPurple, dk && { backgroundColor: 'rgba(192,132,252,0.04)' }]} />
        <View style={[styles.auraGold, dk && { backgroundColor: 'rgba(244,197,66,0.03)' }]} />
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }, dk && { backgroundColor: '#1A1A2E' }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerTitle, dk && { color: '#FFFFFF' }]}>Community</Text>
            <Text style={[styles.headerSubtitle, dk && { color: 'rgba(255,255,255,0.4)' }]}>Discover people & styles</Text>
          </View>
          <View style={[styles.communityBadge, dk && { backgroundColor: 'rgba(192,132,252,0.12)' }]}>
            <Users size={16} color={dk ? '#C084FC' : '#5A2D82'} strokeWidth={2.5} />
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBar, dk && { backgroundColor: '#2B2B2B', borderColor: 'rgba(255,255,255,0.08)' }]}>
          <Search size={18} color={dk ? '#C084FC' : '#9B59B6'} strokeWidth={2} />
          <TextInput
            style={[styles.searchInput, dk && { color: '#FFFFFF' }]}
            placeholder="Search for users or styles..."
            placeholderTextColor={dk ? 'rgba(192,132,252,0.4)' : 'rgba(90,45,130,0.35)'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={{ color: dk ? 'rgba(255,255,255,0.4)' : 'rgba(43,43,43,0.3)', fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Results */}
        {isSearching ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, dk && { color: '#FFFFFF' }]}>
              {searchResults.length > 0 ? `Results for "${searchQuery}"` : `Searching...`}
            </Text>
            {searchResults.length > 0 ? (
              searchResults.map(u => (
                <SearchResultCard key={u.id} user={u} onPress={() => handleUserPress(u.id)} />
              ))
            ) : (
              <View style={styles.emptySearch}>
                <Text style={[styles.emptySearchText, dk && { color: 'rgba(255,255,255,0.3)' }]}>No users found.</Text>
              </View>
            )}
          </View>
        ) : (
          <>
            {/* Suggested For You */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Sparkles size={14} color="#F4C542" />
                <Text style={[styles.sectionTitle, dk && { color: '#FFFFFF' }]}>Suggested for You</Text>
              </View>

              {loadingSuggested ? (
                <ActivityIndicator color="#5A2D82" style={{ marginVertical: 20 }} />
              ) : suggestedUsers.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.suggestedScroll}
                  decelerationRate="fast"
                >
                  {suggestedUsers.map(u => (
                    <TouchableOpacity key={u.id} onPress={() => handleUserPress(u.id)} activeOpacity={0.85}>
                      <UserCard
                        user={u}
                        onFollowToggle={handleFollowToggle}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.emptySearch}>
                  <Text style={[styles.emptySearchText, dk && { color: 'rgba(255,255,255,0.3)' }]}>
                    No suggestions yet. Start exploring!
                  </Text>
                </View>
              )}
            </View>

            {/* Discover Grid */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, dk && { color: '#FFFFFF' }]}>Discover</Text>
                <Text style={[styles.sectionCount, dk && { color: 'rgba(255,255,255,0.3)' }]}>
                  {discoverItems.length} items
                </Text>
              </View>

              <View style={styles.discoverGrid}>
                {discoverItems.map((item, idx) => {
                  const img = item.images?.[0];
                  const ownerName = item.owner
                    ? `${item.owner.firstName || ''}`.trim()
                    : null;
                  const isSold = item.status === 'sold';

                  return (
                    <TouchableOpacity
                      key={item.id || idx}
                      style={styles.gridTile}
                      onPress={() => item.id && router.push({ pathname: '/item/[id]', params: { id: item.id } })}
                      activeOpacity={0.88}
                    >
                      <Image
                        source={{ uri: img || 'https://via.placeholder.com/150' }}
                        style={styles.gridImage}
                        resizeMode="cover"
                      />
                      {/* Sold overlay */}
                      {isSold && (
                        <View style={styles.soldOverlay}>
                          <Text style={styles.soldText}>SOLD</Text>
                        </View>
                      )}
                      {/* Bottom gradient info */}
                      <View style={styles.tileGradient}>
                        {ownerName && (
                          <Text style={styles.tileOwner} numberOfLines={1}>{ownerName}</Text>
                        )}
                        <Text style={styles.tilePrice} numberOfLines={1}>
                          {item.mode === 'donate' ? 'Free' : item.mode === 'trade' ? 'Trade' : `${item.price} RON`}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {discoverItems.length === 0 && (
                <View style={styles.emptySearch}>
                  <ActivityIndicator color="#5A2D82" />
                  <Text style={[styles.emptySearchText, { marginTop: 12 }, dk && { color: 'rgba(255,255,255,0.3)' }]}>
                    Loading items...
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  auraContainer: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  auraPurple: {
    position: 'absolute', top: '5%', right: -80,
    width: 280, height: 280, backgroundColor: 'rgba(142,68,173,0.06)', borderRadius: 140,
  },
  auraGold: {
    position: 'absolute', bottom: '30%', left: -60,
    width: 240, height: 240, backgroundColor: 'rgba(244,197,66,0.05)', borderRadius: 120,
  },

  // Header
  header: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(90,45,130,0.06)',
    zIndex: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Quicksand_700Bold',
    color: '#3B1C56',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(90,45,130,0.5)',
    marginTop: 2,
  },
  communityBadge: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(90,45,130,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(90,45,130,0.08)',
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(90,45,130,0.08)' } as any,
      default: {
        shadowColor: '#5A2D82',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
      },
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
  },

  // Scroll Content
  scrollContent: { paddingTop: 20 },

  // Section
  section: { marginBottom: 32, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1A1A2E',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(43,43,43,0.4)',
    marginLeft: 'auto',
  },

  // Suggested Scroll
  suggestedScroll: { paddingRight: 20, gap: 12 },

  // User Card
  userCard: {
    width: 130,
    borderRadius: 20,
    backgroundColor: '#FFF',
    overflow: 'hidden',
    padding: 14,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(90,45,130,0.06)',
    ...Platform.select({
      web: { boxShadow: '0px 4px 16px rgba(90,45,130,0.1)' } as any,
      default: {
        shadowColor: '#5A2D82',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 4,
      },
    }),
  },
  userCardBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  userCardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'transparent',
  },
  userCardAvatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#5A2D82',
  },
  userCardAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 20, fontWeight: '900', color: '#FFF' },
  userCardName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A1A2E',
    textAlign: 'center',
    maxWidth: 110,
  },
  userCardFollowers: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(43,43,43,0.4)',
  },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#5A2D82',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    marginTop: 2,
  },
  followBtnActive: {
    backgroundColor: 'rgba(90,45,130,0.08)',
    borderWidth: 1.5,
    borderColor: '#5A2D82',
  },
  followBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  followBtnTextActive: { color: '#5A2D82' },

  // Search Results
  searchResult: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(90,45,130,0.05)',
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(90,45,130,0.06)' } as any,
      default: {
        shadowColor: '#5A2D82',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      },
    }),
  },
  searchResultAvatar: { width: 48, height: 48, borderRadius: 16 },
  searchResultAvatarPlaceholder: {
    width: 48, height: 48, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  searchResultInitials: { fontSize: 16, fontWeight: '900', color: '#FFF' },
  searchResultInfo: { flex: 1 },
  searchResultName: { fontSize: 15, fontWeight: '800', color: '#1A1A2E', marginBottom: 2 },
  searchResultMeta: { fontSize: 12, fontWeight: '600', color: 'rgba(43,43,43,0.4)' },

  // Discover Grid
  discoverGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    marginHorizontal: -20,
    paddingHorizontal: GRID_GAP,
  },
  gridTile: {
    width: TILE_SIZE,
    height: TILE_SIZE * 1.25,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  gridImage: { width: '100%', height: '100%' },
  soldOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldText: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 3 },
  tileGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  tileOwner: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: 1 },
  tilePrice: { fontSize: 12, fontWeight: '900', color: '#FFF' },

  // Empty States
  emptySearch: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptySearchText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(43,43,43,0.4)',
  },
});
