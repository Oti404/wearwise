import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ShoppingBag, ArrowRightLeft, Sparkles, Users } from 'lucide-react-native';
import { useAppStore } from '@/store/useAppStore';
import { useFollow } from '@/hooks/useFollow';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FeedItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  size: string;
  condition: string;
  mode: string;
  status: string;
  images: string[];
  primaryImage?: string;
  createdAt?: any;
  userId: string;
  owner?: {
    id: string;
    authUid: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    rating?: number;
    followersCount?: number;
  } | null;
}

function FeedCard({ item }: { item: FeedItem }) {
  const router = useRouter();
  const dk = useAppStore((s: any) => s.isDarkMode);

  const isSold = item.status === 'sold';
  const displayName = item.owner
    ? `${item.owner.firstName || ''}${item.owner.lastName ? ' ' + item.owner.lastName : ''}`.trim()
    : 'WearWise User';
  const initials = (item.owner?.firstName?.[0] || '') + (item.owner?.lastName?.[0] || '');
  const img = item.images?.[0] || item.primaryImage;

  const modeLabel = item.mode === 'donate' ? 'FREE' : item.mode === 'trade' ? 'TRADE' : `${item.price} RON`;
  const modeColor = item.mode === 'donate' ? '#27AE60' : item.mode === 'trade' ? '#8E44AD' : '#1A1A2E';

  return (
    <View style={[styles.card, dk && { backgroundColor: '#2B2B2B', borderColor: 'rgba(255,255,255,0.05)' }]}>
      {/* Card Header: User info */}
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => item.owner?.id && router.push({ pathname: '/user/[id]', params: { id: item.owner.id } })}
        activeOpacity={0.75}
      >
        {item.owner?.avatarUrl ? (
          <Image source={{ uri: item.owner.avatarUrl }} style={styles.ownerAvatar} />
        ) : (
          <View style={[styles.ownerAvatarPlaceholder, { backgroundColor: '#5A2D82' }]}>
            <Text style={styles.ownerInitials}>{initials.toUpperCase() || '?'}</Text>
          </View>
        )}
        <View style={styles.ownerInfo}>
          <Text style={[styles.ownerName, dk && { color: '#FFFFFF' }]}>{displayName}</Text>
          <Text style={[styles.ownerMeta, dk && { color: 'rgba(255,255,255,0.4)' }]}>
            {item.category} · {item.condition}
          </Text>
        </View>
        {item.mode === 'donate' && (
          <View style={styles.donateTag}>
            <Sparkles size={10} color="#27AE60" />
            <Text style={styles.donateTagText}>FREE</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Photo */}
      <TouchableOpacity
        onPress={() => item.id && router.push({ pathname: '/item/[id]', params: { id: item.id } })}
        activeOpacity={0.95}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: img || 'https://via.placeholder.com/400' }}
            style={styles.itemImage}
            resizeMode="cover"
          />
          {isSold && (
            <View style={styles.soldOverlay}>
              <Text style={styles.soldText}>SOLD</Text>
            </View>
          )}
          {/* Size badge */}
          <View style={[styles.sizeBadge, dk && { backgroundColor: 'rgba(43,43,43,0.9)' }]}>
            <Text style={styles.sizeText}>{item.size}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Card Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <Text style={[styles.itemName, dk && { color: '#FFFFFF' }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.itemPrice, { color: modeColor }]}>{modeLabel}</Text>
        </View>

        {!isSold && (
          <TouchableOpacity
            style={[styles.actionBtn, item.mode === 'trade' && styles.tradeBtn, item.mode === 'donate' && styles.donateBtn]}
            activeOpacity={0.85}
            onPress={() => item.id && router.push({ pathname: '/item/[id]', params: { id: item.id } })}
          >
            {item.mode === 'trade' ? (
              <ArrowRightLeft size={14} color="#FFF" strokeWidth={2.5} />
            ) : item.mode === 'donate' ? (
              <Sparkles size={14} color="#FFF" strokeWidth={2.5} />
            ) : (
              <ShoppingBag size={14} color="#FFF" strokeWidth={2.5} />
            )}
            <Text style={styles.actionBtnText}>
              {item.mode === 'trade' ? 'Trade' : item.mode === 'donate' ? 'Take it' : 'Buy'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

interface FeedFollowingProps {
  style?: any;
}

export default function FeedFollowing({ style }: FeedFollowingProps) {
  const insets = useSafeAreaInsets();
  const dk = useAppStore((s: any) => s.isDarkMode);
  const { getFollowingFeed } = useFollow();

  const [items, setItems] = useState<FeedItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const result = await getFollowingFeed(undefined, 10);
      setItems(result.items);
      setNextCursor(result.nextCursor);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!nextCursor || loading) return;
    setLoading(true);
    try {
      const result = await getFollowingFeed(nextCursor, 10);
      setItems(prev => [...prev, ...result.items]);
      setNextCursor(result.nextCursor);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await getFollowingFeed(undefined, 10);
      setItems(result.items);
      setNextCursor(result.nextCursor);
    } finally {
      setRefreshing(false);
    }
  }, []);

  if (loading && items.length === 0) {
    return (
      <View style={[styles.loadingContainer, style, dk && { backgroundColor: '#1E1E1E' }]}>
        <ActivityIndicator size="large" color="#5A2D82" />
      </View>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <View style={[styles.emptyContainer, style, dk && { backgroundColor: '#1E1E1E' }]}>
        <View style={[styles.emptyIconBox, dk && { backgroundColor: '#2B2B2B' }]}>
          <Users size={36} color={dk ? 'rgba(255,255,255,0.15)' : 'rgba(43,43,43,0.12)'} />
        </View>
        <Text style={[styles.emptyTitle, dk && { color: '#FFFFFF' }]}>No posts yet</Text>
        <Text style={[styles.emptySubtitle, dk && { color: 'rgba(255,255,255,0.35)' }]}>
          Follow people in the Community tab to see their items here.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <FeedCard item={item} />}
      contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
      style={[style, dk && { backgroundColor: '#1E1E1E' }]}
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5A2D82" />
      }
      ListFooterComponent={
        loading && items.length > 0 ? (
          <ActivityIndicator color="#5A2D82" style={{ marginVertical: 20 }} />
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF7F2' },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#FAF7F2',
  },
  emptyIconBox: {
    width: 88, height: 88, borderRadius: 28,
    backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    ...Platform.select({
      web: { boxShadow: '0px 6px 16px rgba(90,45,130,0.08)' } as any,
      default: {
        shadowColor: '#5A2D82',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
      },
    }),
  },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#1A1A2E', marginBottom: 8 },
  emptySubtitle: {
    fontSize: 14, fontWeight: '500', color: 'rgba(43,43,43,0.4)',
    textAlign: 'center', lineHeight: 22,
  },

  listContent: { paddingTop: 8, paddingHorizontal: 16 },

  // Card
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(90,45,130,0.05)',
    ...Platform.select({
      web: { boxShadow: '0px 4px 16px rgba(90,45,130,0.08)' } as any,
      default: {
        shadowColor: '#5A2D82',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  ownerAvatar: { width: 44, height: 44, borderRadius: 16, borderWidth: 2, borderColor: '#5A2D82' },
  ownerAvatarPlaceholder: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  ownerInitials: { fontSize: 14, fontWeight: '900', color: '#FFF' },
  ownerInfo: { flex: 1 },
  ownerName: { fontSize: 14, fontWeight: '800', color: '#1A1A2E', marginBottom: 2 },
  ownerMeta: { fontSize: 11, fontWeight: '600', color: 'rgba(43,43,43,0.4)' },
  donateTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(39,174,96,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
  },
  donateTagText: { fontSize: 10, fontWeight: '900', color: '#27AE60' },

  imageContainer: {
    width: '100%',
    height: SCREEN_WIDTH - 32,
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  itemImage: { width: '100%', height: '100%' },
  soldOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  soldText: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: 4 },
  sizeBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  sizeText: { fontSize: 11, fontWeight: '900', color: '#5A2D82' },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    paddingTop: 12,
  },
  footerLeft: { flex: 1, marginRight: 12 },
  itemName: { fontSize: 16, fontWeight: '900', color: '#1A1A2E', marginBottom: 3, letterSpacing: -0.3 },
  itemPrice: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },

  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#5A2D82', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16,
    ...Platform.select({
      web: { boxShadow: '0px 4px 10px rgba(90,45,130,0.25)' } as any,
      default: {
        shadowColor: '#5A2D82', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25, shadowRadius: 10, elevation: 4,
      },
    }),
  },
  tradeBtn: { backgroundColor: '#8E44AD' },
  donateBtn: { backgroundColor: '#27AE60' },
  actionBtnText: { fontSize: 13, fontWeight: '900', color: '#FFF' },
});
