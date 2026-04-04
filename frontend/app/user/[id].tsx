import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Star,
  MapPin,
  ShoppingBag,
  ArrowRightLeft,
  Sparkles,
  UserPlus,
  Check,
  Users,
  Package,
} from 'lucide-react-native';
import { useAppStore } from '@/store/useAppStore';
import { useFollow, PublicProfile } from '@/hooks/useFollow';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_COLS = 3;
const GRID_GAP = 2;
const TILE_SIZE = (SCREEN_WIDTH - GRID_GAP * (GRID_COLS + 1)) / GRID_COLS;

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDarkMode, user: currentUser } = useAppStore();
  const dk = isDarkMode;

  const { getPublicProfile, checkFollowStatus, followUser, unfollowUser, loading } = useFollow();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'items' | 'about'>('items');

  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!id) return;
    loadProfile();
    checkStatus();
  }, [id]);

  const loadProfile = async () => {
    if (!id) return;
    const data = await getPublicProfile(id as string);
    setProfile(data);
  };

  const checkStatus = async () => {
    if (!id || !currentUser) return;
    const status = await checkFollowStatus(id as string);
    setIsFollowing(status);
  };

  const handleFollowToggle = async () => {
    if (!id || followLoading) return;

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 140, useNativeDriver: true }),
    ]).start();

    setFollowLoading(true);
    const prev = isFollowing;
    setIsFollowing(!prev); // Optimistic update
    if (prev) {
      const ok = await unfollowUser(id as string);
      if (!ok) setIsFollowing(prev); // rollback
      else if (profile) setProfile({ ...profile, followersCount: Math.max(0, profile.followersCount - 1) });
    } else {
      const ok = await followUser(id as string);
      if (!ok) setIsFollowing(prev);
      else if (profile) setProfile({ ...profile, followersCount: profile.followersCount + 1 });
    }
    setFollowLoading(false);
  };

  const isOwnProfile = currentUser && profile && currentUser.uid === profile.authUid;

  if (loading && !profile) {
    return (
      <View style={[styles.loadingContainer, dk && { backgroundColor: '#1E1E1E' }]}>
        <ActivityIndicator size="large" color="#5A2D82" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.loadingContainer, dk && { backgroundColor: '#1E1E1E' }]}>
        <Text style={[styles.errorText, dk && { color: '#FFFFFF' }]}>User not found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayName = `${profile.firstName || ''}${profile.lastName ? ' ' + profile.lastName : ''}`.trim() || 'WearWise User';
  const initials = (profile.firstName?.[0] || '') + (profile.lastName?.[0] || '');
  const totalActivity = (profile.salesCount || 0) + (profile.tradesCount || 0) + (profile.donationsCount || 0);

  return (
    <View style={[styles.container, dk && { backgroundColor: '#1E1E1E' }]}>
      {/* Back button */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }, dk && { backgroundColor: 'rgba(26,26,46,0.95)' }]}>
        <TouchableOpacity
          style={[styles.topBarBtn, dk && { backgroundColor: '#2B2B2B' }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color={dk ? '#C084FC' : '#5A2D82'} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, dk && { color: '#FFFFFF' }]} numberOfLines={1}>{displayName}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Profile Header */}
        <View style={[styles.profileHeader, dk && { backgroundColor: '#1A1A2E' }]}>
          {/* Avatar + Stats row */}
          <View style={styles.avatarStatsRow}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              {profile.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} resizeMode="cover" />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: '#5A2D82' }]}>
                  <Text style={styles.avatarInitials}>{initials.toUpperCase() || '?'}</Text>
                </View>
              )}
              {/* Rating badge */}
              <View style={[styles.ratingBadge, dk && { backgroundColor: '#2B2B2B', borderColor: 'rgba(255,255,255,0.1)' }]}>
                <Star size={9} color="#F4C542" fill="#F4C542" />
                <Text style={[styles.ratingText, dk && { color: '#FFFFFF' }]}>{(profile.rating || 0).toFixed(1)}</Text>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statNum, dk && { color: '#FFFFFF' }]}>{profile.items?.length || 0}</Text>
                <Text style={[styles.statLabel, dk && { color: 'rgba(255,255,255,0.4)' }]}>POSTS</Text>
              </View>
              <View style={[styles.statDivider, dk && { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
              <TouchableOpacity
                style={styles.statItem}
                onPress={() => router.push({ pathname: '/user/connections', params: { userId: id, type: 'followers' } })}
                activeOpacity={0.7}
              >
                <Text style={[styles.statNum, dk && { color: '#FFFFFF' }]}>{profile.followersCount}</Text>
                <Text style={[styles.statLabel, dk && { color: 'rgba(255,255,255,0.4)' }]}>FOLLOWERS</Text>
              </TouchableOpacity>
              <View style={[styles.statDivider, dk && { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
              <TouchableOpacity
                style={styles.statItem}
                onPress={() => router.push({ pathname: '/user/connections', params: { userId: id, type: 'following' } })}
                activeOpacity={0.7}
              >
                <Text style={[styles.statNum, dk && { color: '#FFFFFF' }]}>{profile.followingCount}</Text>
                <Text style={[styles.statLabel, dk && { color: 'rgba(255,255,255,0.4)' }]}>FOLLOWING</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Name + Location */}
          <Text style={[styles.displayName, dk && { color: '#FFFFFF' }]}>{displayName}</Text>
          {profile.city && (
            <View style={styles.locationRow}>
              <MapPin size={12} color="#F4C542" />
              <Text style={[styles.locationText, dk && { color: 'rgba(255,255,255,0.6)' }]}>{profile.city}</Text>
            </View>
          )}

          {/* Activity pills */}
          <View style={styles.activityRow}>
            {(profile.salesCount || 0) > 0 && (
              <View style={[styles.activityPill, { backgroundColor: 'rgba(39,174,96,0.1)' }]}>
                <ShoppingBag size={10} color="#27AE60" />
                <Text style={[styles.activityPillText, { color: '#27AE60' }]}>{profile.salesCount} sold</Text>
              </View>
            )}
            {(profile.tradesCount || 0) > 0 && (
              <View style={[styles.activityPill, { backgroundColor: 'rgba(90,45,130,0.1)' }]}>
                <ArrowRightLeft size={10} color="#5A2D82" />
                <Text style={[styles.activityPillText, { color: '#5A2D82' }]}>{profile.tradesCount} trades</Text>
              </View>
            )}
            {totalActivity > 0 && (
              <View style={[styles.activityPill, { backgroundColor: 'rgba(244,197,66,0.12)' }]}>
                <Sparkles size={10} color="#F4C542" />
                <Text style={[styles.activityPillText, { color: '#B8860B' }]}>{totalActivity > 10 ? 'Eco Hero' : 'Eco Explorer'}</Text>
              </View>
            )}
          </View>

          {/* Follow / Edit button */}
          {!isOwnProfile && (
            <Animated.View style={[styles.followBtnContainer, { transform: [{ scale: scaleAnim }] }]}>
              <TouchableOpacity
                style={[
                  styles.followButton,
                  isFollowing && styles.followingButton,
                  dk && isFollowing && { backgroundColor: 'rgba(192,132,252,0.12)', borderColor: '#C084FC' },
                  followLoading && { opacity: 0.7 },
                ]}
                onPress={handleFollowToggle}
                activeOpacity={0.85}
                disabled={followLoading}
              >
                {followLoading ? (
                  <ActivityIndicator size="small" color={isFollowing ? '#5A2D82' : '#FFF'} />
                ) : isFollowing ? (
                  <>
                    <Check size={16} color={dk ? '#C084FC' : '#5A2D82'} strokeWidth={3} />
                    <Text style={[styles.followButtonText, styles.followingButtonText, dk && { color: '#C084FC' }]}>Following</Text>
                  </>
                ) : (
                  <>
                    <UserPlus size={16} color="#FFF" strokeWidth={2.5} />
                    <Text style={styles.followButtonText}>Follow</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {/* Items Grid */}
        {profile.items && profile.items.length > 0 ? (
          <View style={styles.grid}>
            {profile.items.map((item, idx) => {
              const img = item.images?.[0] || item.primaryImage;
              const isSold = item.status === 'sold';
              return (
                <TouchableOpacity
                  key={item.id || idx}
                  style={styles.gridTile}
                  onPress={() => item.id && router.push({ pathname: '/item/[id]', params: { id: item.id } })}
                  activeOpacity={0.85}
                >
                  <Image
                    source={{ uri: img || 'https://via.placeholder.com/150' }}
                    style={styles.gridImage}
                    resizeMode="cover"
                  />
                  {isSold && (
                    <View style={styles.soldOverlay}>
                      <Text style={styles.soldText}>SOLD</Text>
                    </View>
                  )}
                  <View style={styles.tileFooter}>
                    <Text style={styles.tilePrice} numberOfLines={1}>
                      {item.mode === 'donate' ? 'FREE' : item.mode === 'trade' ? 'TRADE' : `${item.price} RON`}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Package size={40} color={dk ? 'rgba(255,255,255,0.15)' : 'rgba(43,43,43,0.12)'} />
            <Text style={[styles.emptyTitle, dk && { color: 'rgba(255,255,255,0.5)' }]}>No items yet.</Text>
            <Text style={[styles.emptySubtitle, dk && { color: 'rgba(255,255,255,0.3)' }]}>
              {displayName} hasn't posted anything yet.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF7F2' },
  errorText: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 20 },
  backBtn: { backgroundColor: '#5A2D82', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16 },
  backBtnText: { color: '#FFF', fontWeight: '900', fontSize: 14 },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(90,45,130,0.05)',
    zIndex: 10,
  },
  topBarBtn: {
    width: 44, height: 44, borderRadius: 16,
    backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(90,45,130,0.08)',
  },
  topBarTitle: { fontSize: 17, fontWeight: '900', color: '#1A1A2E', flex: 1, textAlign: 'center', marginHorizontal: 10 },

  // Profile Header
  profileHeader: {
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(90,45,130,0.05)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  avatarStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 16,
  },
  avatarContainer: { position: 'relative' },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#5A2D82',
  },
  avatarPlaceholder: {
    width: 88, height: 88, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontSize: 32, fontWeight: '900', color: '#FFF' },
  ratingBadge: {
    position: 'absolute', bottom: -4, right: -4,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#FFF', paddingHorizontal: 7, paddingVertical: 4,
    borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(90,45,130,0.08)',
  },
  ratingText: { fontSize: 10, fontWeight: '900', color: '#5A2D82' },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 20, fontWeight: '900', color: '#1A1A2E' },
  statLabel: { fontSize: 8, fontWeight: '900', color: 'rgba(43,43,43,0.4)', letterSpacing: 0.5, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(90,45,130,0.08)' },

  displayName: { fontSize: 22, fontWeight: '900', color: '#1A1A2E', marginBottom: 6, letterSpacing: -0.3 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12 },
  locationText: { fontSize: 12, fontWeight: '700', color: '#5A2D82' },

  activityRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16 },
  activityPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  },
  activityPillText: { fontSize: 11, fontWeight: '800' },

  followBtnContainer: { width: '100%' },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#5A2D82',
    paddingVertical: 14,
    borderRadius: 20,
    ...Platform.select({
      web: { boxShadow: '0px 6px 16px rgba(90,45,130,0.25)' } as any,
      default: {
        shadowColor: '#5A2D82',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 6,
      },
    }),
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#5A2D82',
    ...Platform.select({
      web: { boxShadow: 'none' } as any,
      default: { shadowOpacity: 0, elevation: 0 },
    }),
  },
  followButtonText: { fontSize: 15, fontWeight: '900', color: '#FFF', letterSpacing: 0.3 },
  followingButtonText: { color: '#5A2D82' },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    paddingHorizontal: GRID_GAP,
    marginTop: GRID_GAP,
  },
  gridTile: {
    width: TILE_SIZE,
    height: TILE_SIZE * 1.25,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  gridImage: { width: '100%', height: '100%' },
  soldOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldText: { fontSize: 14, fontWeight: '900', color: '#FFF', letterSpacing: 3 },
  tileFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  tilePrice: { fontSize: 11, fontWeight: '900', color: '#FFF' },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    marginTop: 20,
  },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: '#2B2B2B', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, fontWeight: '500', color: 'rgba(43,43,43,0.4)', textAlign: 'center', lineHeight: 22 },
});
