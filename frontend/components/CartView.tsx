import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Trash2, ShoppingBag, CreditCard, Package, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { useClothes } from '@/hooks/useClothes';

const CartView = () => {
  const { cart, removeFromCart, clearCart, user, isDarkMode } = useAppStore();
  const dk = isDarkMode;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { checkout, loading: checkoutLoading } = useClothes();

  const total = cart.reduce((sum: number, item: any) => sum + (item.price || 0), 0);
  const totalFormatted = total.toFixed(2);

  const handleCheckout = async () => {
    if (cart.length === 0 || !user) return;
    
    try {
      const itemIds = cart.map((i: any) => i.id);
      await checkout(user.uid, itemIds);

      // Clear cart immediately
      clearCart();

      Alert.alert(
        '✨ Order Placed!',
        `Your order of ${totalFormatted} RON has been processed successfully. Items now appear in your wardrobe as "Bought"!`,
        [
          {
            text: 'Awesome! 🎉',
            onPress: () => {
              router.push('/(tabs)/profile');
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not process the order.');
    }
  };

  const handleRemoveItem = (id: string | number) => {
    removeFromCart(id);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }, dk && { backgroundColor: '#1E1E1E' }]}>
      {/* ─── HEADER ─── */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, dk && { backgroundColor: '#2B2B2B', borderColor: 'rgba(255,255,255,0.06)' }]} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={20} color={dk ? '#FFFFFF' : '#1A1A2E'} strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, dk && { color: '#FFFFFF' }]}>My Cart</Text>
          {cart.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{cart.length}</Text>
            </View>
          )}
        </View>

        {/* Placeholder to keep title centered */}
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingBottom: insets.bottom + 180 } // Increased padding to account for floating checkout bar
        ]}
      >
        {cart.length === 0 ? (
          /* ─── EMPTY STATE ─── */
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <ShoppingBag size={44} color="#9B59B6" strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>Cart is empty!</Text>
            <Text style={styles.emptySubtitle}>
              Explore the wardrobe and add clothes you love by Swiping Right ❤️
            </Text>
            <TouchableOpacity style={styles.discoverBtn} onPress={() => router.push('/(tabs)')} activeOpacity={0.85}>
              <Sparkles size={16} color="#F4C542" />
              <Text style={styles.discoverBtnText}>Discover Clothes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ─── CART ITEMS ─── */}
            <View style={styles.itemsList}>
              {cart.map((item: any, index: number) => (
                <TouchableOpacity
                  key={item.id || index}
                  style={[styles.cartCard, dk && { backgroundColor: '#2B2B2B', borderColor: 'rgba(255,255,255,0.05)' }]}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/item/${item.id}`)}
                >
                  {/* Product Image */}
                  <View style={styles.imageWrapper}>
                    <Image
                      source={{ uri: item.image || 'https://via.placeholder.com/100' }}
                      style={styles.itemImage}
                      resizeMode="cover"
                    />
                    {item.size ? (
                      <View style={styles.sizePill}>
                        <Text style={styles.sizeText}>{item.size.toUpperCase()}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Details */}
                  <View style={styles.itemDetails}>
                    <View style={styles.itemNameRow}>
                      <Text style={[styles.itemName, dk && { color: '#FFFFFF' }]} numberOfLines={1}>{item.name}</Text>
                      <TouchableOpacity
                        style={styles.deleteBtnSmall}
                        onPress={() => handleRemoveItem(item.id)}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={18} color="#E74C3C" strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                    
                    {item.seller && (
                      <Text style={styles.sellerText}>@{item.seller}</Text>
                    ) || (
                       <Text style={styles.sellerText}>@wearwise_store</Text>
                    )}
                    
                    <View style={styles.priceRow}>
                      <Text style={[styles.priceText, dk && { color: '#FFFFFF' }]}>
                        {item.price > 0 ? `${item.price.toFixed(2)} RON` : 'FREE / TRADE'}
                      </Text>
                      {item.distance !== undefined && (
                        <View style={styles.distanceBadge}>
                          <Text style={styles.distanceText}>{item.distance.toFixed(1)} km</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* ─── ORDER SUMMARY ─── */}
            <View style={[styles.summaryCard, dk && { backgroundColor: '#2B2B2B', borderColor: 'rgba(255,255,255,0.05)' }]}>
              <View style={styles.summaryHeader}>
                <Package size={18} color="#5A2D82" />
                <Text style={[styles.summaryTitle, dk && { color: '#FFFFFF' }]}>Order Summary</Text>
              </View>

              <View style={styles.summaryRows}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, dk && { color: 'rgba(255,255,255,0.5)' }]}>Products ({cart.length})</Text>
                  <Text style={[styles.summaryValue, dk && { color: '#FFFFFF' }]}>{totalFormatted} RON</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, dk && { color: 'rgba(255,255,255,0.5)' }]}>Home Delivery</Text>
                  <Text style={[styles.summaryValue, { color: '#27AE60' }]}>FREE</Text>
                </View>

                <View style={[styles.summaryRow, styles.totalRow, dk && { borderTopColor: 'rgba(255,255,255,0.08)' }]}>
                  <Text style={[styles.totalLabel, dk && { color: '#FFFFFF' }]}>Total to pay</Text>
                  <Text style={styles.totalValue}>{totalFormatted} RON</Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* ─── CHECKOUT BAR (Floating above Navbar) ─── */}
      {cart.length > 0 && (
        <View style={[
          styles.checkoutContainer, 
          { bottom: 100 + insets.bottom } // Lift it clearly above the BottomNav (usually ~80-90 high)
        ]}>
          <TouchableOpacity 
            style={[styles.checkoutBtn, checkoutLoading && { opacity: 0.7 }]} 
            onPress={handleCheckout} 
            activeOpacity={0.9}
            disabled={checkoutLoading}
          >
            <View style={styles.checkoutBtnGradient}>
              {checkoutLoading ? (
                <Text style={styles.checkoutText}>Processing...</Text>
              ) : (
                <>
                  <CreditCard size={20} color="#F4C542" strokeWidth={2.5} />
                  <Text style={styles.checkoutText}>Place Order • {totalFormatted} RON</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.glassBackground} />
        </View>
      )}
    </View>
  );
};

export default CartView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },

  // ── Header ─────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#FFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5A2D82',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(90,45,130,0.06)',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1A1A2E',
    letterSpacing: -0.5,
  },
  countBadge: {
    backgroundColor: 'rgba(142, 68, 173, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#8E44AD',
  },
  clearBtn: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(231,76,60,0.05)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(231,76,60,0.1)',
  },

  // ── Scroll Content ──────────────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  // ── Empty State ─────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIconBox: {
    width: 100,
    height: 100,
    backgroundColor: '#FFF',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#5A2D82',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(90,45,130,0.06)',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(26,26,46,0.55)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },
  discoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#5A2D82',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 22,
    shadowColor: '#5A2D82',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  discoverBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },

  // ── Items List ──────────────────────────────────────────────────────
  itemsList: {
    gap: 16,
    marginBottom: 32,
  },
  cartCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 12,
    shadowColor: '#5A2D82',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(90,45,130,0.05)',
  },
  imageWrapper: {
    position: 'relative',
  },
  itemImage: {
    width: 90,
    height: 110,
    borderRadius: 18,
    backgroundColor: '#F7F3FA',
  },
  sizePill: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sizeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#5A2D82',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 16,
    paddingVertical: 4,
    justifyContent: 'space-between',
  },
  itemNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A2E',
    flex: 1,
    marginRight: 8,
  },
  deleteBtnSmall: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(231,76,60,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(231,76,60,0.1)',
  },
  sellerText: {
    fontSize: 13,
    color: '#8E44AD',
    fontWeight: '700',
    marginTop: -4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A1A2E',
  },
  distanceBadge: {
    backgroundColor: 'rgba(142, 68, 173, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  distanceText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8E44AD',
  },

  // ── Order Summary ───────────────────────────────────────────────────
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(90,45,130,0.03)',
    shadowColor: '#5A2D82',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.05,
    shadowRadius: 25,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A1A2E',
  },
  summaryRows: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(26,26,46,0.5)',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(90,45,130,0.08)',
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1A1A2E',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#5A2D82',
  },

  // ── Checkout Bar ───────────────────────────────────────────────────
  checkoutContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 100,
  },
  glassBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 30,
    zIndex: -1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  checkoutBtn: {
    width: '100%',
    shadowColor: '#5A2D82',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  checkoutBtnGradient: {
    backgroundColor: '#5A2D82',
    paddingVertical: 20,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  checkoutText: {
    color: '#F4C542',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});