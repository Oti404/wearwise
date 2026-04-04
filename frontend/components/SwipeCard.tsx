import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Heart, X, MapPin, ShoppingBag, ArrowRightLeft, Gift, Tag } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ClothingItem } from "@/hooks/useClothes";
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SwipeCardProps {
  item: ClothingItem;
  cardWidth?: number;
  cardHeight?: number;
}

const SwipeCard = ({ item, cardWidth, cardHeight }: SwipeCardProps) => {
  const router = useRouter();

  if (!item) return null;

  const imageUrl = item.images && item.images.length > 0
    ? item.images[0]
    : 'https://via.placeholder.com/400x711';
  const imageSource = typeof imageUrl === 'string' ? { uri: imageUrl } : imageUrl;

  const W = cardWidth ?? SCREEN_WIDTH - 32;
  const H = cardHeight ?? W * (16 / 9);

  const isTrade = item.mode === 'trade' || item.mode === 'both';
  const isBuy = item.mode === 'sell' || item.mode === 'both';
  const isDonate = item.mode === 'donate';

  return (
    <TouchableOpacity
      activeOpacity={0.97}
      onPress={() => item.id && router.push({ pathname: '/item/[id]', params: { id: item.id } })}
      style={[styles.cardTouchable, { width: W, height: H }]}
    >
      <View style={[styles.card, { width: W, height: H }]}>
        {/* ── Main Image ── */}
        <Image
          source={imageSource}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />

        {/* ── Gradient Overlay ── */}
        <LinearGradient
          colors={['transparent', 'rgba(58,28,86,0.95)']}
          style={styles.gradientBottom}
        />

        {/* ── Mode Badges (top-left) ── */}
        <View style={styles.badgesContainer}>
          {isTrade && (
            <View style={[styles.badge, styles.tradeBadge]}>
              <ArrowRightLeft size={9} color="#FFF" />
              <Text style={[styles.badgeText, { color: '#FFF' }]}>TRADE</Text>
            </View>
          )}
          {isBuy && (
            <View style={[styles.badge, styles.buyBadge]}>
              <Text style={styles.badgeText}>BUY</Text>
            </View>
          )}
          {isDonate && (
            <View style={[styles.badge, styles.donateBadge]}>
              <Gift size={9} color="#FAF7F2" />
              <Text style={styles.badgeText}>DONATE</Text>
            </View>
          )}
        </View>

        {/* ── Info Overlay (bottom) ── */}
        <View style={styles.infoOverlay}>
          <View style={styles.infoContent}>
            
            <View style={styles.titlePriceRow}>
              <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.priceText}>
                {(item.price !== null && item.price !== undefined && item.price > 0)
                  ? `${item.price}\nRON`
                  : item.mode === 'donate' ? 'DONATE' : 'TRADE'}
              </Text>
            </View>

            {item.distance !== undefined && (
              <View style={styles.distanceRow}>
                <MapPin size={11} color="#FFF" />
                <Text style={styles.distanceText}>{item.distance.toFixed(1)} km away</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default SwipeCard;

const styles = StyleSheet.create({
  cardTouchable: {
    alignSelf: 'center',
  },
  card: {
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#1A1A2E',
    ...Platform.select({
      web: {
        boxShadow: '0px 20px 28px rgba(0,0,0,0.22)',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.22,
        shadowRadius: 28,
        elevation: 12,
      }
    }),
  },

  // ── Gradient ─────────────────────────────────────────
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
  },

  // ── Badges ─────────────────────────────────────────────────────
  badgesContainer: {
    position: 'absolute',
    top: 18,
    left: 18,
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 5,
  },
  tradeBadge: {
    backgroundColor: '#5A2D82',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  buyBadge: {
    backgroundColor: '#F4C542',
    borderWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  donateBadge: {
    backgroundColor: '#E74C3C',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#3B1C56',
    letterSpacing: 0.5,
  },

  // ── Info Overlay ────────────────────────────────────────────────
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 22,
    paddingTop: 40,
  },
  infoContent: {
    gap: 2,
  },
  titlePriceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
  },
  itemName: {
    flex: 1,
    fontSize: 26,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFF',
    lineHeight: 30,
    ...Platform.select({
      web: {
        textShadow: '0px 1px 2px rgba(0,0,0,0.4)',
      } as any,
      default: {
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      }
    }),
  },
  priceText: {
    fontSize: 22,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 24,
    ...Platform.select({
      web: {
        textShadow: '0px 1px 2px rgba(0,0,0,0.4)',
      } as any,
      default: {
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      }
    }),
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  distanceText: {
    fontSize: 12,
    color: '#FFF',
    opacity: 0.9,
  },
});