import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  MapPin,
  Star,
  PackageOpen,
  Users,
  UserPlus,
  UserCheck,
  ShoppingBag,
  ArrowRightLeft,
  Gift,
  Search,
} from 'lucide-react-native';
import { useFollow } from '@/hooks/useFollow';
import { useClothes, ClothingItem } from '@/hooks/useClothes';
import { useAppStore } from '@/store/useAppStore';

type Rating = { rating: number; comment?: string; createdAt?: string; raterName?: string };

const { width } = Dimensions.get('window');

export default function PublicProfileScreen() {
  const { id: targetUserId } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dk = useAppStore((state) => state.isDarkMode);
  
  const { fetchPublicProfile, followUser, unfollowUser, checkFollowStatus, loading: followLoading } = useFollow();
  const { fetchUserCloset, fetchUserRatings } = useClothes();

  const [profile, setProfile] = useState<any>(null);
  const [closet, setCloset] = useState<ClothingItem[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (targetUserId) {
      loadProfileData();
    }
  }, [targetUserId]);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const [profileData, closetData, followStatus, ratingsData] = await Promise.all([
        fetchPublicProfile(targetUserId!),
        fetchUserCloset(targetUserId!),
        checkFollowStatus(targetUserId!),
        fetchUserRatings(targetUserId!),
      ]);

      if (profileData) {
        setProfile(profileData);
      }
      setCloset(closetData || []);
      setIsFollowing(followStatus);
      setRatings(Array.isArray(ratingsData) ? ratingsData : []);
    } catch (err) {
      console.error('[PublicProfile] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!targetUserId) return;
    try {
      if (isFollowing) {
        await unfollowUser(targetUserId);
        setIsFollowing(false);
        setProfile((prev: any) => ({ ...prev, followersCount: (prev?.followersCount || 1) - 1 }));
      } else {
        await followUser(targetUserId);
        setIsFollowing(true);
        setProfile((prev: any) => ({ ...prev, followersCount: (prev?.followersCount || 0) + 1 }));
      }
    } catch (err) {
      console.error('[PublicProfile] Follow toggle error:', err);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, dk && styles.containerDark]}>
        <ActivityIndicator size="large" color="#5A2D82" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.center, dk && styles.containerDark]}>
        <Search size={48} color="rgba(43,43,43,0.1)" />
        <Text style={[styles.errorText, dk && styles.textDark]}>User not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, dk && styles.containerDark]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        
        {/* Header / Avatar Section */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color={dk ? "#FFF" : "#2B2B2B"} strokeWidth={3} />
          </TouchableOpacity>
          
          <View style={styles.profileMain}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarBorder}>
                <Image 
                  source={{ uri: profile.avatarUrl || 'https://placehold.co/150/png' }} 
                  style={styles.avatar} 
                />
              </View>
              {profile.isOnline && <View style={styles.onlineDot} />}
            </View>
            
            <Text style={[styles.name, dk && styles.textDark]}>
              {profile.firstName} {profile.lastName}
            </Text>
            
            <View style={styles.locationRow}>
              <MapPin size={12} color="#F4C542" />
              <Text style={styles.locationText}>{profile.city || 'Digital Nomad'}</Text>
            </View>

            <View style={styles.ratingBadge}>
              <Star size={10} color="#F4C542" fill="#F4C542" />
              <Text style={styles.ratingText}>
                {ratings.length > 0
                  ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)
                  : '—'}
              </Text>
              <Text style={styles.reviewCount}>({ratings.length} reviews)</Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, dk && styles.textDark]}>{closet.length}</Text>
            <Text style={styles.statLabel}>CLOTHES</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, dk && styles.textDark]}>{profile.followersCount || 0}</Text>
            <Text style={styles.statLabel}>FOLLOWERS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, dk && styles.textDark]}>{profile.followingCount || 0}</Text>
            <Text style={styles.statLabel}>FOLLOWING</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsBox}>
          <TouchableOpacity 
            style={[styles.followBtn, isFollowing && styles.followingBtn]} 
            onPress={handleFollowToggle}
            activeOpacity={0.8}
          >
            {isFollowing ? (
              <UserCheck size={18} color="#FFF" />
            ) : (
              <UserPlus size={18} color="#FFF" />
            )}
            <Text style={styles.followBtnText}>
              {isFollowing ? 'FOLLOWING' : 'FOLLOW'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.messageBtn, dk && styles.messageBtnDark]}>
            <Text style={[styles.messageBtnText, dk && styles.textDark]}>MESSAGE</Text>
          </TouchableOpacity>
        </View>

        {/* Bio Section */}
        {profile.bio && (
          <View style={styles.bioSection}>
            <Text style={[styles.sectionTitle, dk && styles.textDark]}>About</Text>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        )}

        {/* Wardrobe Section */}
        <View style={styles.wardrobeSection}>
          <View style={styles.wardrobeHeader}>
            <PackageOpen size={18} color="#5A2D82" />
            <Text style={[styles.sectionTitle, dk && styles.textDark]}>Wardrobe Highlights</Text>
          </View>
          
          {closet.length > 0 ? (
            <View style={styles.grid}>
              {closet.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.card, dk && styles.cardDark]}
                  onPress={() => router.push(`/item/${item.id}`)}
                >
                  <Image 
                    source={{ uri: (item.images && item.images.length > 0) ? item.images[0] : 'https://placehold.co/300x400/png' }} 
                    style={styles.cardIdmg} 
                  />
                  <View style={styles.cardBadges}>
                    {(item.mode === 'trade' || item.mode === 'both') && (
                      <View style={[styles.badge, { backgroundColor: '#8E44AD' }]}>
                        <ArrowRightLeft size={8} color="#FFF" />
                      </View>
                    )}
                    {(item.mode === 'sell' || item.mode === 'both') && (
                      <View style={[styles.badge, { backgroundColor: '#F4C542' }]}>
                        <ShoppingBag size={8} color="#2B2B2B" />
                      </View>
                    )}
                    {item.mode === 'donate' && (
                      <View style={[styles.badge, { backgroundColor: '#E74C3C' }]}>
                        <Gift size={8} color="#FFF" />
                      </View>
                    )}
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.itemName, dk && styles.textDark]} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.itemPrice}>
                      {item.mode === 'donate' ? 'FREE' : (item.price ? `${item.price} RON` : 'TRADE')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCloset}>
              <Users size={32} color="rgba(43,43,43,0.1)" />
              <Text style={styles.emptyClosetText}>This user hasn't shared any items yet.</Text>
            </View>
          )}
        </View>

        {/* Reviews Section */}
        {ratings.length > 0 && (
          <View style={styles.reviewsSection}>
            <Text style={[styles.sectionTitle, dk && styles.textDark]}>Reviews</Text>
            {ratings.slice(0, 5).map((r, i) => (
              <View key={i} style={[styles.reviewCard, dk && styles.cardDark]}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewStars}>
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} size={12} color="#F4C542" fill={s <= r.rating ? '#F4C542' : 'transparent'} />
                    ))}
                  </View>
                  {r.raterName && (
                    <Text style={styles.reviewerName}>{r.raterName}</Text>
                  )}
                </View>
                {r.comment ? (
                  <Text style={[styles.reviewComment, dk && { color: 'rgba(255,255,255,0.7)' }]}>{r.comment}</Text>
                ) : null}
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  containerDark: { backgroundColor: '#1E1E1E' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 18, fontWeight: '700', marginTop: 16, color: '#2B2B2B' },
  textDark: { color: '#FFF' },
  backBtn: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#5A2D82', borderRadius: 12 },
  backBtnText: { color: '#FFF', fontWeight: 'bold' },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  backButton: { width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  profileMain: { alignItems: 'center' },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatarBorder: { width: 104, height: 104, borderRadius: 36, borderWidth: 3, borderColor: '#5A2D82', padding: 3, backgroundColor: '#FFF' },
  avatar: { width: '100%', height: '100%', borderRadius: 32 },
  onlineDot: { position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: '#2ECC71', borderWidth: 4, borderColor: '#FAF7F2' },
  name: { fontSize: 24, fontWeight: '900', color: '#2B2B2B', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  locationText: { fontSize: 12, color: 'gray', fontWeight: '600' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(90,45,130,0.05)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  ratingText: { fontSize: 12, fontWeight: '900', color: '#5A2D82' },
  reviewCount: { fontSize: 10, color: 'gray' },
  statsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 24, gap: 20 },
  statItem: { alignItems: 'center', minWidth: 80 },
  statValue: { fontSize: 20, fontWeight: '900', color: '#2B2B2B' },
  statLabel: { fontSize: 9, fontWeight: '900', color: 'gray', letterSpacing: 1 },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(90,45,130,0.1)' },
  actionsBox: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 32 },
  followBtn: { flex: 1, height: 52, backgroundColor: '#5A2D82', borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: '#5A2D82', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 5 },
  followingBtn: { backgroundColor: '#8E44AD' },
  followBtnText: { color: '#FFF', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  messageBtn: { flex: 1, height: 52, backgroundColor: '#FFF', borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(90,45,130,0.1)' },
  messageBtnDark: { backgroundColor: '#2B2B2B', borderColor: 'rgba(255,255,255,0.05)' },
  messageBtnText: { color: '#5A2D82', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  bioSection: { paddingHorizontal: 24, marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1A1A2E', marginBottom: 12 },
  bioText: { fontSize: 14, color: 'gray', lineHeight: 22 },
  wardrobeSection: { paddingHorizontal: 20 },
  wardrobeHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: { width: (width - 40 - 16) / 2, backgroundColor: '#FFF', borderRadius: 24, padding: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardDark: { backgroundColor: '#2B2B2B' },
  cardIdmg: { width: '100%', height: 180, borderRadius: 18, backgroundColor: '#EEE' },
  cardBadges: { position: 'absolute', top: 16, right: 16, flexDirection: 'row', gap: 4 },
  badge: { width: 22, height: 22, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { paddingVertical: 10, paddingHorizontal: 4 },
  itemName: { fontSize: 14, fontWeight: '800', color: '#2B2B2B', marginBottom: 4 },
  itemPrice: { fontSize: 12, fontWeight: '900', color: '#5A2D82' },
  emptyCloset: { alignItems: 'center', paddingVertical: 40, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 24, borderStyle: 'dashed', borderWidth: 1, borderColor: '#5A2D82' },
  emptyClosetText: { marginTop: 12, color: 'gray', fontSize: 13 },
  reviewsSection: { paddingHorizontal: 20, marginTop: 32, paddingBottom: 20 },
  reviewCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewerName: { fontSize: 11, fontWeight: '700', color: 'gray' },
  reviewComment: { fontSize: 13, color: '#2B2B2B', lineHeight: 18 },
});
