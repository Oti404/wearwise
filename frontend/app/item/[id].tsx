import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  MapPin,
  Ruler,
  Tag,
  Info,
  ArrowRightLeft,
  ShoppingBag,
  Gift,
  Heart,
  Star,
  ShieldCheck,
} from 'lucide-react-native';
import { useClothes, ClothingItem } from '@/hooks/useClothes';
import { useAppStore } from '@/store/useAppStore';

const { width } = Dimensions.get('window');

export default function ItemDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fetchItemDetails, loading, error: apiError } = useClothes();
  const addToCart = useAppStore((state) => state.addToCart);
  const cart = useAppStore((state) => state.cart);

  const [item, setItem] = useState<ClothingItem | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const isInCart = cart.some((c) => String(c.id) === String(id));

  useEffect(() => {
    loadItem();
  }, [id]);

  const loadItem = async () => {
    if (!id) return;
    setNotFound(false);
    const data = await fetchItemDetails(id);
    if (data) {
      setItem(data);
    } else {
      // If we got null and there's no apiError, it was likely a 404
      setNotFound(true);
    }
  };

  const handleScroll = (event: any) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / width);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const handleAddToCart = () => {
    if (!item) return;
    addToCart({
      id: item.id!,
      name: item.name,
      price: item.price || 0,
      image: (item.images && item.images.length > 0) ? item.images[0] : 'https://via.placeholder.com/400',
      seller: item.userId,
      size: item.size,
      distance: item.distance || 0,
    });
    // Return to the main swipe screen
    router.replace('/(tabs)');
  };

  const renderModeBadge = (mode: string) => {
    switch (mode) {
      case 'trade':
        return (
          <View style={[styles.badge, styles.tradeBadge]}>
            <ArrowRightLeft size={12} color="#FAF7F2" />
            <Text style={styles.badgeText}>TRADE ONLY</Text>
          </View>
        );
      case 'sell':
        return (
          <View style={[styles.badge, styles.buyBadge]}>
            <ShoppingBag size={12} color="#5A2D82" />
            <Text style={[styles.badgeText, { color: '#5A2D82' }]}>BUY</Text>
          </View>
        );
      case 'donate':
        return (
          <View style={[styles.badge, styles.donateBadge]}>
            <Gift size={12} color="#FAF7F2" />
            <Text style={styles.badgeText}>DONATION</Text>
          </View>
        );
      case 'both':
        return (
          <View style={[styles.badge, styles.bothBadge]}>
            <ArrowRightLeft size={12} color="#5A2D82" />
            <ShoppingBag size={12} color="#5A2D82" />
            <Text style={[styles.badgeText, { color: '#5A2D82' }]}>TRADE / SALE</Text>
          </View>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#5A2D82" />
      </View>
    );
  }

  if (notFound || apiError || !item) {
    const errorMsg = notFound 
      ? 'The item could not be found (maybe it was deleted).' 
      : (apiError || 'An unknown error occurred.');

    return (
      <View style={styles.centerContainer}>
        <View style={styles.errorIconBox}>
          <Info size={40} color="#E74C3C" />
        </View>
        <Text style={styles.errorTextTitle}>Oops!</Text>
        <Text style={styles.errorText}>{errorMsg}</Text>
        
        <TouchableOpacity style={styles.backButtonCenter} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back to Wardrobe</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.backButtonCenter, { backgroundColor: 'transparent', marginTop: 10 }]} 
          onPress={() => loadItem()}
        >
          <Text style={[styles.backButtonText, { color: '#5A2D82' }]}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayImages = item.images?.length > 0 ? item.images : ['https://via.placeholder.com/600'];

  return (
    <View style={styles.container}>
      <ScrollView 
        bounces={false} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        
        {/* CAROUSEL IMAGINI */}
        <View style={styles.carouselContainer}>
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            snapToInterval={width}
            decelerationRate="fast"
          >
            {displayImages.map((imgUrl, index) => (
              <View key={index} style={styles.carouselImageContainer}>
                <Image
                  source={{ uri: imgUrl }}
                  style={styles.carouselImage}
                  resizeMode="cover"
                />
              </View>
            ))}
          </ScrollView>

          {/* BUTON DE BACK PESTE IMAGINE */}
          <TouchableOpacity 
            style={[styles.backButtonOverlay, { top: insets.top + 10 }]}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color="#2B2B2B" strokeWidth={3} />
          </TouchableOpacity>

          {/* INDICATOR DE IMAGINI */}
          {displayImages.length > 1 && (
            <View style={styles.imageCountBadge}>
              <Text style={styles.imageCountText}>{activeIndex + 1} / {displayImages.length}</Text>
            </View>
          )}

          {/* DOTS PAGINATION */}
          {displayImages.length > 1 && (
            <View style={styles.dotsContainer}>
              {displayImages.map((_, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.dot, 
                    activeIndex === i ? styles.activeDot : styles.inactiveDot
                  ]} 
                />
              ))}
            </View>
          )}
        </View>

        {/* INFORMAȚII */}
        <View style={styles.detailsContainer}>
          <View style={styles.headerRow}>
            {renderModeBadge(item.mode)}
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Investment</Text>
              <Text style={styles.priceValue}>
                {item.mode === 'donate' ? 'FREE' : (item.price ? `${item.price} RON` : 'TRADE')}
              </Text>
            </View>
          </View>

          <Text style={styles.title}>{item.name}</Text>
          
          <View style={styles.specGrid}>
            <View style={styles.specItem}>
              <View style={styles.specIconBox}>
                <Tag size={18} color="#5A2D82" />
              </View>
              <View>
                <Text style={styles.specLabel}>CATEGORY</Text>
                <Text style={styles.specValue}>{item.category}</Text>
              </View>
            </View>

            <View style={styles.specItem}>
              <View style={styles.specIconBox}>
                <Ruler size={18} color="#5A2D82" />
              </View>
              <View>
                <Text style={styles.specLabel}>SIZE</Text>
                <Text style={styles.specValue}>{item.size}</Text>
              </View>
            </View>

            <View style={styles.specItem}>
              <View style={styles.specIconBox}>
                <ShieldCheck size={18} color="#5A2D82" />
              </View>
              <View>
                <Text style={styles.specLabel}>CONDITION</Text>
                <Text style={styles.specValue}>{item.condition}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Item Story</Text>
          <Text style={styles.descriptionText}>
            {item.description || 'This item doesn\'t have a description, but it\'s certainly waiting for a fresh start!'}
          </Text>

          {item.distance !== undefined && (
             <View style={styles.locationCard}>
                <View style={styles.locationIconBox}>
                   <MapPin size={24} color="#5A2D82" fill="#F4C542" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.locationTitle}>Where is it?</Text>
                  <Text style={styles.locationValue}>Approximately {item.distance.toFixed(1)} km away from you</Text>
                </View>
             </View>
          )}

          <View style={styles.divider} />

          {/* OWNER CARD */}
          <Text style={styles.sectionTitle}>Added by</Text>
          <TouchableOpacity style={styles.ownerCard} activeOpacity={0.7}>
             <View style={styles.ownerAvatarWrapper}>
                {item.owner?.avatarUrl ? (
                  <Image source={{ uri: item.owner.avatarUrl }} style={styles.ownerAvatar} />
                ) : (
                  <View style={styles.ownerAvatarPlaceholder}>
                     <Text style={styles.ownerInitial}>
                       {item.owner?.firstName?.[0] || 'U'}
                     </Text>
                  </View>
                )}
                <View style={styles.ownerStatusDot} />
             </View>
             <View style={{ flex: 1 }}>
                <Text style={styles.ownerName}>
                  {item.owner?.firstName} {item.owner?.lastName}
                </Text>
                <View style={styles.ownerRatingRow}>
                   <Star size={12} color="#F4C542" fill="#F4C542" />
                   <Text style={styles.ownerRatingText}>4.9 (24 completed trades)</Text>
                </View>
             </View>
             <ChevronLeft size={20} color="#5A2D82" style={{ transform: [{ rotate: '180deg' }] }} opacity={0.3} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* FIXED BOTTOM ACTION BAR */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
         <TouchableOpacity style={styles.favoriteBtn}>
            <Heart size={24} color="#5A2D82" />
         </TouchableOpacity>
         
         <TouchableOpacity 
            style={[styles.primaryActionBtn, isInCart && styles.disabledBtn]} 
            onPress={handleAddToCart}
            disabled={isInCart}
          >
            <Text style={[styles.primaryActionText, isInCart && styles.disabledBtnText]}>
              {isInCart ? 'ALREADY IN CART' : (item.mode === 'sell' ? 'ADD TO CART' : 'PROPOSE TRADE')}
            </Text>
         </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  centerContainer: { flex: 1, backgroundColor: '#FAF7F2', justifyContent: 'center', alignItems: 'center' },
  backButtonCenter: { padding: 12, backgroundColor: '#5A2D82', borderRadius: 12, minWidth: 200, alignItems: 'center' },
  backButtonText: { color: '#FFF', fontWeight: 'bold' },
  errorIconBox: { backgroundColor: 'rgba(231, 76, 60, 0.1)', padding: 20, borderRadius: 100, marginBottom: 20 },
  errorTextTitle: { fontSize: 24, fontWeight: '900', color: '#2B2B2B', marginBottom: 8 },
  errorText: { fontSize: 16, color: 'rgba(43, 43, 43, 0.6)', textAlign: 'center', paddingHorizontal: 40, marginBottom: 32 },
  carouselContainer: { width: '100%', height: width * 1.3, position: 'relative', backgroundColor: '#F0EBE3' },
  carouselImageContainer: { width: width, height: width * 1.3, justifyContent: 'center', alignItems: 'center' },
  carouselImage: { width: width, height: width * 1.3 },
  dotsContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    backgroundColor: '#5A2D82',
    width: 20,
  },
  inactiveDot: {
    backgroundColor: 'rgba(90, 45, 130, 0.2)',
  },
  backButtonOverlay: {
    position: 'absolute',
    left: 20,
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  imageCountBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backdropFilter: 'blur(10px)',
  },
  imageCountText: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  detailsContainer: {
    padding: 24,
    backgroundColor: '#FAF7F2',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -40,
    // Add subtle shadow to the top curve
    shadowColor: '#5A2D82',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 6 },
  tradeBadge: { backgroundColor: '#5A2D82' },
  buyBadge: { backgroundColor: '#F4C542' },
  donateBadge: { backgroundColor: '#E74C3C' },
  bothBadge: { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#5A2D82' },
  badgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5, color: '#FAF7F2' },
  priceContainer: { alignItems: 'flex-end' },
  priceLabel: { fontSize: 9, color: 'rgba(43, 43, 43, 0.4)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  priceValue: { fontSize: 32, fontWeight: '900', color: '#5A2D82', marginTop: -2 },
  title: { fontSize: 28, fontWeight: '900', color: '#2B2B2B', lineHeight: 32, marginBottom: 24 },
  specGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  specItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  specIconBox: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(90, 45, 130, 0.05)', alignItems: 'center', justifyContent: 'center' },
  specLabel: { fontSize: 8, fontWeight: '900', color: 'rgba(43, 43, 43, 0.4)', letterSpacing: 0.5 },
  specValue: { fontSize: 13, fontWeight: '800', color: '#2B2B2B' },
  divider: { height: 1.5, backgroundColor: 'rgba(90, 45, 130, 0.06)', marginVertical: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#2B2B2B', marginBottom: 16 },
  descriptionText: { fontSize: 15, color: 'rgba(43, 43, 43, 0.7)', lineHeight: 24, fontWeight: '500' },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 24,
    marginTop: 40,
    gap: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(90, 45, 130, 0.04)',
    shadowColor: '#5A2D82',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 15,
    elevation: 2,
  },
  locationIconBox: { width: 50, height: 50, borderRadius: 16, backgroundColor: 'rgba(244, 197, 66, 0.1)', alignItems: 'center', justifyContent: 'center' },
  locationTitle: { fontSize: 10, fontWeight: '900', color: 'rgba(43, 43, 43, 0.4)', textTransform: 'uppercase', letterSpacing: 1 },
  locationValue: { fontSize: 15, fontWeight: '800', color: '#5A2D82' },
  ownerCard: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: '#FFF',
     padding: 16,
     borderRadius: 24,
     gap: 16,
     borderWidth: 1.5,
     borderColor: 'rgba(90, 45, 130, 0.04)',
  },
  ownerAvatarWrapper: {
     width: 54,
     height: 54,
     position: 'relative',
  },
  ownerAvatar: {
     width: '100%',
     height: '100%',
     borderRadius: 18,
  },
  ownerAvatarPlaceholder: {
     width: '100%',
     height: '100%',
     borderRadius: 18,
     backgroundColor: '#5A2D82',
     alignItems: 'center',
     justifyContent: 'center',
  },
  ownerInitial: { color: '#FAF7F2', fontSize: 20, fontWeight: '900' },
  ownerStatusDot: {
     position: 'absolute',
     bottom: -2,
     right: -2,
     width: 14,
     height: 14,
     borderRadius: 7,
     backgroundColor: '#2ECC71',
     borderWidth: 2.5,
     borderColor: '#FFF',
  },
  ownerName: { fontSize: 16, fontWeight: '900', color: '#2B2B2B' },
  ownerRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ownerRatingText: { fontSize: 11, color: 'rgba(43, 43, 43, 0.5)', fontWeight: '700' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1.5,
    borderColor: 'rgba(90, 45, 130, 0.05)',
    gap: 12,
  },
  favoriteBtn: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(90, 45, 130, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtn: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#F4C542',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    backgroundColor: 'rgba(90, 45, 130, 0.1)',
  },
  primaryActionText: { color: '#5A2D82', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  disabledBtnText: {
    color: 'rgba(90, 45, 130, 0.4)',
  },
});
