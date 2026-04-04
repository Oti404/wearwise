import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  HeartHandshake,
  Plus,
  MapPin,
  Gift,
  Trash2,
  Sparkles,
  ArrowRight
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { useClothes, ClothingItem } from '@/hooks/useClothes';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export function DonationsView() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const user = useAppStore((state) => state.user);
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const dk = isDarkMode;
  const { fetchUserCloset } = useClothes();

  const [items, setItems] = useState<ClothingItem[]>([]);

  useEffect(() => {
    if (user?.uid) {
      loadDonationBasket();
    }
  }, [user]);

  const loadDonationBasket = async () => {
    if (!user?.uid) return;
    const allItems = await fetchUserCloset(user.uid);
    const donations = allItems.filter(item => item.mode === 'donate');
    setItems(donations);
  };

  const removeFromDonations = (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    setItems(updated);
  };

  const donationCenters = [
    { id: 1, name: "Crucea Roșie Română", distance: "1.2 km", address: "Str. George Coșbuc nr. 3" },
    { id: 2, name: "Container Caritas", distance: "2.5 km", address: "Parcarea Mărăști" },
  ];

  return (
    <View style={[styles.container, dk && { backgroundColor: '#1E1E1E' }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* PREMIUM HEADER */}
        <LinearGradient
          colors={dk ? ['#1A1A2E', '#12122A'] : ['#5A2D82', '#3D1B5E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerGradient, { paddingTop: insets.top + 20 }]}
        >
          <View style={styles.headerTop}>
            <View>
              <View style={styles.headerTitleRow}>
                <View style={styles.headerIconBg}>
                  <HeartHandshake size={24} color="#F4C542" />
                </View>
                <Text style={styles.headerTitle}>Donations</Text>
              </View>
              <Text style={styles.headerSubtitle}>
                Turn your wardrobe into a positive change. Every piece matters.
              </Text>
            </View>
          </View>

          {/* IMPACT CARD */}
          <View style={[styles.impactCard, dk && { backgroundColor: '#2B2B2B' }]}>
            <View>
              <Text style={styles.impactTag}>YOUR IMPACT</Text>
              <Text style={[styles.impactValue, dk && { color: '#FFFFFF' }]}>
                {items.length}
                <Text style={[styles.impactUnit, dk && { color: 'rgba(255,255,255,0.4)' }]}> ITEMS</Text>
              </Text>
            </View>
            <View style={styles.impactIconBox}>
              <Gift size={28} color="#5A2D82" strokeWidth={2.5} />
            </View>
          </View>
        </LinearGradient>

        {/* DONATION BASKET */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Donation Basket</Text>
            <TouchableOpacity 
              style={styles.addButton}
              activeOpacity={0.8}
              onPress={() => router.push('/add-item')}
            >
              <Plus size={16} color="#5A2D82" strokeWidth={3} />
              <Text style={styles.addButtonText}>ADD</Text>
            </TouchableOpacity>
          </View>

          {items.length > 0 ? (
            <View style={styles.grid}>
              {items.map((item) => {
                const imageUrl = item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/150';
                const imageSource = typeof imageUrl === 'string' ? { uri: imageUrl } : imageUrl;

                return (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[styles.itemCard, dk && { backgroundColor: '#2B2B2B', borderColor: 'rgba(255,255,255,0.06)' }]}
                    activeOpacity={0.9}
                    onPress={() => item.id && router.push({ pathname: '/item/[id]', params: { id: item.id } })}
                  >
                    <View style={styles.imageContainer}>
                      <Image 
                        source={imageSource} 
                        style={styles.itemImage} 
                        resizeMode="cover"
                      />
                      <LinearGradient
                        colors={['rgba(0,0,0,0.3)', 'transparent']}
                        style={styles.imageGradientOverlay}
                      />
                      <TouchableOpacity 
                        style={styles.deleteBtn}
                        activeOpacity={0.7}
                        onPress={() => item.id && removeFromDonations(item.id)}
                      >
                        <Trash2 size={16} color="#E74C3C" strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemName, dk && { color: '#FFFFFF' }]} numberOfLines={1}>{item.name}</Text>
                      <View style={styles.itemMeta}>
                        <Text style={styles.metaText}>{item.category}</Text>
                        <View style={styles.metaDot} />
                        <Text style={styles.metaText}>Mărimea {item.size}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <Sparkles size={36} color="#8E44AD" strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyTitle}>Nothing here yet</Text>
              <Text style={styles.emptyText}>
                Your wardrobe is waiting for a kind gesture. Add items to your donation bag.
              </Text>
            </View>
          )}

          {/* CONFIRM BUTTON */}
          <View style={[styles.confirmBtnShadowWrapper, items.length === 0 && styles.confirmBtnDisabledWrapper]}>
            <TouchableOpacity 
              activeOpacity={0.85}
              disabled={items.length === 0}
              style={{ overflow: 'hidden', borderRadius: 24 }}
            >
              <LinearGradient
                colors={
                  items.length === 0
                    ? ['#E5E7EB', '#D1D5DB']
                    : dk
                      ? ['#4A2266', '#341550']
                      : ['#5A2D82', '#431966']
                }
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.confirmBtnGradient}
              >
                <Text style={[styles.confirmBtnText, items.length === 0 && { color: '#9CA3AF' }, dk && items.length > 0 && { color: '#FFFFFF' }]}>
                  CONFIRM DONATION
                </Text>
                {items.length > 0 && (
                  <View style={styles.confirmBadge}>
                    <Text style={styles.confirmBadgeText}>{items.length}</Text>
                  </View>
                )}
                {items.length > 0 && <ArrowRight size={20} color="#F4C542" style={{ marginLeft: 4 }} />}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* DROP-OFF LOCATIONS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Drop-off Locations</Text>
          <View style={styles.centersContainer}>
            {donationCenters.map((center) => (
              <TouchableOpacity key={center.id} style={[styles.centerCard, dk && { backgroundColor: '#2B2B2B', borderColor: 'rgba(255,255,255,0.06)' }]} activeOpacity={0.8}>
                <View style={styles.centerIconBox}>
                  <MapPin size={24} color="#8E44AD" />
                </View>
                <View style={styles.centerInfo}>
                  <Text style={[styles.centerName, dk && { color: '#FFFFFF' }]}>{center.name}</Text>
                  <Text style={[styles.centerAddress, dk && { color: 'rgba(255,255,255,0.45)' }]}>{center.address}</Text>
                </View>
                <View style={styles.distanceBadge}>
                  <Text style={styles.distanceText}>{center.distance}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCFBF8' },
  scrollContent: { paddingBottom: 140 },
  headerGradient: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerTop: { marginBottom: 30 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerIconBg: {
    backgroundColor: 'rgba(244, 197, 66, 0.2)',
    padding: 10,
    borderRadius: 16,
  },
  headerTitle: { 
    fontSize: 34, 
    fontFamily: 'PlayfairDisplay_700Bold', 
    color: '#FAF7F2', 
    letterSpacing: -0.5 
  },
  headerSubtitle: { 
    color: 'rgba(250, 247, 242, 0.85)', 
    fontSize: 15,
    fontFamily: 'Outfit_500Medium', 
    marginTop: 12, 
    lineHeight: 22 
  },
  impactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      web: { boxShadow: '0 12px 30px rgba(61, 27, 94, 0.4)' } as any,
      default: { shadowColor: '#3D1B5E', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 25, elevation: 15 }
    }),
  },
  impactTag: { 
    color: '#F4C542', 
    fontSize: 11, 
    fontFamily: 'Outfit_700Bold', 
    letterSpacing: 2 
  },
  impactValue: { 
    color: '#2B2B2B', 
    fontSize: 40, 
    fontFamily: 'Manrope_800ExtraBold', 
    marginTop: 2 
  },
  impactUnit: { 
    fontSize: 16, 
    color: 'rgba(43, 43, 43, 0.4)', 
    fontFamily: 'Manrope_600SemiBold' 
  },
  impactIconBox: { 
    backgroundColor: 'rgba(244, 197, 66, 0.2)', 
    padding: 16, 
    borderRadius: 20 
  },
  section: { paddingHorizontal: 24, marginTop: 40 },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 24 
  },
  sectionTitle: { 
    fontSize: 22, 
    fontFamily: 'PlayfairDisplay_700Bold', 
    color: '#2B2B2B', 
    letterSpacing: 0.2 
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4C542',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 6,
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(244, 197, 66, 0.4)' } as any,
      default: { shadowColor: '#F4C542', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 }
    }),
  },
  addButtonText: { 
    fontSize: 12, 
    fontFamily: 'Outfit_700Bold', 
    color: '#5A2D82', 
    letterSpacing: 1 
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  itemCard: {
    width: (width - 48 - 16) / 2,
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' } as any,
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 4 }
    }),
    borderWidth: 1,
    borderColor: 'rgba(90, 45, 130, 0.04)',
  },
  imageContainer: { 
    width: '100%', 
    height: 180, 
    backgroundColor: '#F8F6F2', 
    position: 'relative'
  },
  itemImage: { width: '100%', height: '100%' },
  imageGradientOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 60,
  },
  deleteBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 14,
    zIndex: 10,
    ...Platform.select({
      web: { boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)' } as any,
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }
    }),
  },
  itemInfo: { padding: 16, paddingTop: 14 },
  itemName: { 
    fontSize: 16, 
    fontFamily: 'Outfit_600SemiBold', 
    color: '#2B2B2B', 
    marginBottom: 4 
  },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { 
    fontSize: 12, 
    fontFamily: 'Manrope_600SemiBold', 
    color: '#8E9196' 
  },
  metaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#F4C542' },
  emptyContainer: {
    paddingVertical: 70,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#EAE1F1',
  },
  emptyIconBox: { 
    backgroundColor: 'rgba(142, 68, 173, 0.05)', 
    padding: 24, 
    borderRadius: 28, 
    marginBottom: 20 
  },
  emptyTitle: { 
    fontSize: 18, 
    fontFamily: 'PlayfairDisplay_700Bold', 
    color: '#2B2B2B', 
    marginBottom: 8 
  },
  emptyText: { 
    color: '#8E9196', 
    fontSize: 14, 
    textAlign: 'center', 
    fontFamily: 'Outfit_500Medium', 
    paddingHorizontal: 40,
    lineHeight: 22 
  },
  confirmBtnShadowWrapper: {
    marginTop: 36,
    ...Platform.select({
      web: { boxShadow: '0 12px 24px rgba(90, 45, 130, 0.25)' } as any,
      default: { shadowColor: '#5A2D82', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 8 }
    }),
  },
  confirmBtnDisabledWrapper: {
    ...Platform.select({ web: { boxShadow: 'none' } as any, default: { shadowOpacity: 0, elevation: 0 }})
  },
  confirmBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  confirmBtnText: { 
    color: '#F4C542', 
    fontSize: 14, 
    fontFamily: 'Outfit_700Bold', 
    letterSpacing: 2 
  },
  confirmBadge: { 
    backgroundColor: 'rgba(244, 197, 66, 0.2)', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 8 
  },
  confirmBadgeText: { 
    color: '#F4C542', 
    fontSize: 12, 
    fontFamily: 'Manrope_800ExtraBold' 
  },
  centersContainer: { gap: 16, marginTop: 4 },
  centerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 24,
    ...Platform.select({
      web: { boxShadow: '0 6px 16px rgba(0, 0, 0, 0.03)' } as any,
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.03, shadowRadius: 12, elevation: 2 }
    }),
    borderWidth: 1,
    borderColor: 'rgba(90, 45, 130, 0.04)',
  },
  centerIconBox: { 
    width: 48, 
    height: 48, 
    backgroundColor: 'rgba(142, 68, 173, 0.08)', 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  centerInfo: { flex: 1, marginLeft: 16 },
  centerName: { 
    fontSize: 16, 
    fontFamily: 'Outfit_600SemiBold', 
    color: '#2B2B2B', 
    marginBottom: 2 
  },
  centerAddress: { 
    fontSize: 12, 
    color: '#8E9196', 
    fontFamily: 'Manrope_500Medium' 
  },
  distanceBadge: { 
    backgroundColor: 'rgba(90, 45, 130, 0.06)', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12 
  },
  distanceText: { 
    fontSize: 11, 
    fontFamily: 'Outfit_700Bold', 
    color: '#5A2D82' 
  },
});