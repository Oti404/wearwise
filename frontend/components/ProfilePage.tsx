import React, { useState, useEffect } from 'react';
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
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Settings,
  Plus,
  Camera,
  Star,
  ArrowRightLeft,
  Sparkles,
  MapPin,
  LogOut,
  ShoppingBag,
  Gift,
  User,
  Clock,
  Moon,
  X,
  ChevronRight,
} from 'lucide-react-native';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/hooks/useAuth';
import { useClothes, ClothingItem } from '@/hooks/useClothes';
import { useUser } from '@/hooks/useUser';
import { LocationPicker } from './LocationPicker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const API_URL = 'https://wearwise-api.onrender.com';

export function ProfilePage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, login, isDarkMode, setDarkMode } = useAppStore();
  const { signOut } = useAuth();
  const { fetchUserCloset, loading: clothesLoading } = useClothes();
  const { changeAvatar, updateProfile, loading: avatarLoading } = useUser();
  
  const [closet, setCloset] = useState<ClothingItem[]>([]);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const dk = isDarkMode;

  useEffect(() => {
    if (user?.uid && !user.firstName) {
      setIsProfileLoading(true);
      fetch(`${API_URL}/user/${user.uid}`)
        .then(async (res) => {
          const data = await res.json();
          if (res.ok && data?.firstName) login(data);
        })
        .catch((e) => console.error('[ProfilePage] refetch failed:', e))
        .finally(() => setIsProfileLoading(false));
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) fetchUserCloset(user.uid).then(setCloset);
  }, [user?.uid]);

  const handleReList = (itemId: string) => {
    router.push({ pathname: '/resale/[id]', params: { id: itemId } });
  };

  const avatarSource = user?.avatarUrl
    ? { uri: user.avatarUrl }
    : { uri: 'https://github.com/identicons/ambra.png' };

  const handlePickAvatar = async () => {
    if (!user?.uid) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      });
      if (!result.canceled && result.assets.length > 0) {
        await changeAvatar(user.uid, result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('[ProfilePage] avatar error:', error);
    }
  };

  return (
    <View style={[styles.container, dk && { backgroundColor: '#1E1E1E' }]}>
      {!dk && <View style={styles.auraPurple} />}
      {!dk && <View style={styles.auraGold} />}

      {/* ─── SETTINGS MODAL ─── */}
      <Modal
        visible={isSettingsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsSettingsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setIsSettingsOpen(false)}
          />
          <View style={[styles.modalSheet, dk && { backgroundColor: '#2B2B2B' }]}>
            <View style={[styles.modalHandle, dk && { backgroundColor: 'rgba(255,255,255,0.15)' }]} />

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, dk && { color: '#FFFFFF' }]}>Settings</Text>
              <TouchableOpacity onPress={() => setIsSettingsOpen(false)} style={styles.modalCloseBtn}>
                <X size={20} color={dk ? 'rgba(255,255,255,0.5)' : '#9CA3AF'} />
              </TouchableOpacity>
            </View>

            {/* Edit Profile */}
            <TouchableOpacity
              style={[styles.modalRow, dk && { borderBottomColor: 'rgba(255,255,255,0.07)' }]}
              activeOpacity={0.75}
              onPress={() => { setIsSettingsOpen(false); Alert.alert('Edit Profile', 'Coming soon!'); }}
            >
              <View style={[styles.modalRowIcon, dk && { backgroundColor: 'rgba(192,132,252,0.12)' }]}>
                <User size={18} color={dk ? '#C084FC' : '#5A2D82'} />
              </View>
              <Text style={[styles.modalRowLabel, dk && { color: '#FFFFFF' }]}>Edit Profile</Text>
              <ChevronRight size={18} color={dk ? 'rgba(255,255,255,0.3)' : 'rgba(43,43,43,0.3)'} />
            </TouchableOpacity>

            {/* Istoric */}
            <TouchableOpacity
              style={[styles.modalRow, dk && { borderBottomColor: 'rgba(255,255,255,0.07)' }]}
              activeOpacity={0.75}
              onPress={() => { setIsSettingsOpen(false); Alert.alert('Istoric', 'Istoricul cumpărăturilor și vânzărilor — coming soon!'); }}
            >
              <View style={[styles.modalRowIcon, dk && { backgroundColor: 'rgba(244,197,66,0.12)' }]}>
                <Clock size={18} color={dk ? '#F4C542' : '#5A2D82'} />
              </View>
              <Text style={[styles.modalRowLabel, dk && { color: '#FFFFFF' }]}>Istoric (cumpărări / vânzări)</Text>
              <ChevronRight size={18} color={dk ? 'rgba(255,255,255,0.3)' : 'rgba(43,43,43,0.3)'} />
            </TouchableOpacity>

            {/* Dark Theme toggle */}
            <View style={[styles.modalRow, { borderBottomWidth: 0 }]}>
              <View style={[styles.modalRowIcon, dk && { backgroundColor: 'rgba(192,132,252,0.12)' }]}>
                <Moon size={18} color={dk ? '#C084FC' : '#5A2D82'} />
              </View>
              <Text style={[styles.modalRowLabel, dk && { color: '#FFFFFF' }]}>Dark Theme</Text>
              <Switch
                value={isDarkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: 'rgba(43,43,43,0.15)', true: '#7C3AED' }}
                thumbColor={isDarkMode ? '#C084FC' : '#FFF'}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── HEADER ─── */}
      <View style={[
        styles.header,
        { paddingTop: insets.top + 10 },
        dk && { backgroundColor: '#1A1A2E', borderBottomColor: 'rgba(255,255,255,0.05)' },
      ]}>
        <View style={styles.headerContent}>
          <View style={styles.userInfoRow}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarGradient}>
                <View style={styles.avatarInner}>
                  <Image
                    source={avatarSource}
                    style={[styles.avatarImage, avatarLoading && { opacity: 0.5 }]}
                    resizeMode="cover"
                  />
                  {avatarLoading && (
                    <View style={StyleSheet.absoluteFillObject}>
                      <ActivityIndicator size="small" color="#5A2D82" />
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={[styles.cameraBtn, dk && { backgroundColor: '#2B2B2B', borderColor: 'rgba(255,255,255,0.08)' }]}
                activeOpacity={0.8}
                onPress={handlePickAvatar}
                disabled={avatarLoading}
              >
                <Camera size={10} color={dk ? '#C084FC' : '#5A2D82'} strokeWidth={3} />
              </TouchableOpacity>
            </View>

            <View style={styles.nameContainer}>
              {isProfileLoading ? (
                <ActivityIndicator size="small" color="#5A2D82" />
              ) : (
                <View style={styles.nameSection}>
                  <Text style={[styles.userName, dk && { color: '#FFFFFF' }]}>
                    {user?.firstName && user?.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : (user?.email?.split('@')[0] || 'WearWise User')}
                  </Text>
                  <View style={styles.reputationRow}>
                    <View style={[styles.locationContainer, dk && { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                      <MapPin size={12} color="#F4C542" />
                      <Text style={[styles.userLocation, dk && { color: '#FFFFFF' }]}>
                        {user?.city || user?.address || 'Location not set'}
                      </Text>
                    </View>
                    <View style={[styles.ratingBadge, dk && { backgroundColor: '#2B2B2B', borderColor: 'rgba(255,255,255,0.08)' }]}>
                      <Star size={10} color="#F4C542" fill="#F4C542" />
                      <Text style={[styles.ratingValue, dk && { color: '#FFFFFF' }]}>{user?.rating || '0.0'}</Text>
                      <Text style={styles.reviewCount}>({user?.reviewCount || 0})</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[styles.settingsBtn, dk && { backgroundColor: '#2B2B2B', borderColor: 'rgba(255,255,255,0.08)' }]}
              onPress={signOut}
            >
              <LogOut size={20} color="#E74C3C" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.settingsBtn, dk && { backgroundColor: '#2B2B2B', borderColor: 'rgba(255,255,255,0.08)' }]}
              onPress={() => setIsSettingsOpen(true)}
            >
              <Settings size={20} color={dk ? '#C084FC' : 'rgba(43,43,43,0.4)'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <LocationPicker
        visible={isMapVisible}
        onClose={() => setIsMapVisible(false)}
        initialLocation={user?.latitude ? {
          latitude: user.latitude,
          longitude: user.longitude!,
          address: user.address
        } : undefined}
        onConfirm={(loc) => {
          if (user?.uid) {
            updateProfile(user.uid, {
              address: loc.address,
              latitude: loc.latitude,
              longitude: loc.longitude,
              city: loc.city || loc.address.split(',')[0],
            });
          }
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {/* Stats Bar */}
        <View style={[styles.statsBar, dk && { backgroundColor: '#2B2B2B', borderColor: 'rgba(255,255,255,0.05)' }]}>
          <View style={styles.statItem}>
            <View style={[styles.statIconCircle, { backgroundColor: dk ? 'rgba(142,68,173,0.18)' : 'rgba(90,45,130,0.1)' }]}>
              <ArrowRightLeft size={14} color={dk ? '#8E44AD' : '#5A2D82'} />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={[styles.statNumber, dk && { color: '#FFFFFF' }]}>{user?.tradesCount || 0}</Text>
              <Text style={[styles.statLabel, dk && { color: '#8E44AD' }]}>TRADES</Text>
            </View>
          </View>

          <View style={[styles.statDivider, dk && { backgroundColor: 'rgba(255,255,255,0.08)' }]} />

          <View style={styles.statItem}>
            <View style={[styles.statIconCircle, { backgroundColor: dk ? 'rgba(244,197,66,0.15)' : 'rgba(244,197,66,0.1)' }]}>
              <Gift size={14} color="#F4C542" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={[styles.statNumber, dk && { color: '#FFFFFF' }]}>{user?.donationsCount || 0}</Text>
              <Text style={[styles.statLabel, dk && { color: '#F4C542' }]}>DONATIONS</Text>
            </View>
          </View>

          <View style={[styles.statDivider, dk && { backgroundColor: 'rgba(255,255,255,0.08)' }]} />

          <View style={styles.statItem}>
            <View style={[styles.statIconCircle, { backgroundColor: dk ? 'rgba(39,174,96,0.15)' : 'rgba(39,174,96,0.1)' }]}>
              <Sparkles size={14} color="#27AE60" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={[styles.statNumber, dk && { color: '#FFFFFF' }]}>
                {(user?.tradesCount || 0) + (user?.donationsCount || 0) + (user?.salesCount || 0)}
              </Text>
              <Text style={[styles.statLabel, dk && { color: '#27AE60' }]}>SAVED</Text>
            </View>
          </View>
        </View>

        <View style={styles.rankContainer}>
          <Sparkles size={16} color="#F4C542" />
          <Text style={styles.rankTitle}>Circular Rank:</Text>
          <Text style={styles.rankName}>
            {((user?.tradesCount || 0) + (user?.donationsCount || 0) + (user?.salesCount || 0)) > 10
              ? 'Eco Hero' : 'Eco Explorer'}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={() => router.push('/add-item')}
            style={styles.addItemBtn}
            activeOpacity={0.9}
          >
            <Plus size={18} color="#F4C542" strokeWidth={3} />
            <Text style={styles.addItemText}>ADD ITEM</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.editBtn, dk && { backgroundColor: '#2B2B2B', borderColor: 'rgba(255,255,255,0.08)' }]}
            onPress={() => Alert.alert('Edit Profile', 'Coming soon!')}
          >
            <Text style={[styles.editBtnText, dk && { color: '#C084FC' }]}>EDIT</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.galleryContainer}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, dk && { color: '#FFFFFF' }]}>Your Wardrobe</Text>
            <View style={[styles.countBadge, dk && { backgroundColor: 'rgba(192,132,252,0.12)' }]}>
              <Text style={[styles.countText, dk && { color: '#C084FC' }]}>{closet.length} ITEMS</Text>
            </View>
          </View>

          {closet.length > 0 ? (
            <View style={styles.closetGrid}>
              {closet.map((item, index) => {
                const isTrade = item.mode === 'trade' || item.mode === 'both';
                const isSell = item.mode === 'sell' || item.mode === 'both';
                const isDonate = item.mode === 'donate';
                const isSold = item.status === 'sold';
                const isBoughtByMe = item.buyerId === user?.uid;

                return (
                  <TouchableOpacity
                    key={item.id || index}
                    style={[styles.closetItem, dk && { backgroundColor: '#2B2B2B', borderColor: 'rgba(255,255,255,0.05)' }]}
                    activeOpacity={0.8}
                    onPress={() => item.id && router.push({ pathname: '/item/[id]', params: { id: item.id } })}
                  >
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: (item.images && item.images.length > 0) ? item.images[0] : 'https://via.placeholder.com/150' }}
                        style={styles.closetImage}
                      />
                      <View style={styles.cardBadgeContainer}>
                        {isBoughtByMe ? (
                          <View style={[styles.cardBadge, { backgroundColor: '#27AE60', width: 60 }]}>
                            <Text style={styles.badgeTextSmall}>BOUGHT</Text>
                          </View>
                        ) : isSold ? (
                          <View style={[styles.cardBadge, { backgroundColor: '#E74C3C', width: 50 }]}>
                            <Text style={styles.badgeTextSmall}>SOLD</Text>
                          </View>
                        ) : isDonate ? (
                          <View style={[styles.cardBadge, { backgroundColor: '#E74C3C' }]}>
                            <Gift size={8} color="#FFF" fill="#FFF" />
                          </View>
                        ) : (
                          <>
                            {isTrade && (
                              <View style={[styles.cardBadge, { backgroundColor: '#8E44AD' }]}>
                                <ArrowRightLeft size={8} color="#FFF" />
                              </View>
                            )}
                            {isSell && (
                              <View style={[styles.cardBadge, { backgroundColor: '#F4C542' }]}>
                                <ShoppingBag size={8} color="#2B2B2B" />
                              </View>
                            )}
                          </>
                        )}
                      </View>
                      {isBoughtByMe && (
                        <TouchableOpacity
                          style={styles.reListOverlay}
                          onPress={(e) => { e.stopPropagation(); if (item.id) handleReList(item.id); }}
                          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                          activeOpacity={0.7}
                        >
                          <ArrowRightLeft size={12} color="#F4C542" strokeWidth={3} />
                          <Text style={styles.reListText}>RESALE</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <View style={styles.closetItemInfo}>
                      <Text style={[styles.closetItemName, dk && { color: '#FFFFFF' }]} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.closetItemPrice}>
                        {isBoughtByMe ? 'IN WARDROBE' : isSold ? 'SOLD' : item.mode === 'trade' ? 'TRADE' : item.mode === 'donate' ? 'DONATION' : `${item.price} RON`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={[styles.emptyContainer, dk && { backgroundColor: 'rgba(43,43,43,0.5)', borderColor: 'rgba(255,255,255,0.08)' }]}>
              <Sparkles size={40} color={dk ? 'rgba(255,255,255,0.1)' : 'rgba(43,43,43,0.1)'} />
              <Text style={[styles.sectionPlaceholder, dk && { color: 'rgba(255,255,255,0.3)' }]}>Your wardrobe is empty.</Text>
              <TouchableOpacity onPress={() => router.push('/add-item')}>
                <Text style={[styles.emptyActionText, dk && { color: '#C084FC' }]}>Add your first item</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  auraPurple: { position: 'absolute', top: 0, right: 0, width: 200, height: 200, backgroundColor: 'rgba(142,68,173,0.08)', borderRadius: 100 },
  auraGold: { position: 'absolute', top: '10%', left: -50, width: 180, height: 180, backgroundColor: 'rgba(244,197,66,0.08)', borderRadius: 90 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 44,
    paddingTop: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.12, shadowRadius: 20 },
      android: { elevation: 20 },
    }),
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(43,43,43,0.15)', alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#1A1A2E', letterSpacing: -0.5 },
  modalCloseBtn: { padding: 6 },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(43,43,43,0.06)',
    gap: 14,
  },
  modalRowIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(90,45,130,0.08)', alignItems: 'center', justifyContent: 'center' },
  modalRowLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1A1A2E' },

  // Header
  header: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(90,45,130,0.05)',
    zIndex: 30,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 15 },
  userInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrapper: { position: 'relative' },
  avatarGradient: { width: 64, height: 64, borderRadius: 22, padding: 2, backgroundColor: '#5A2D82' },
  avatarInner: { flex: 1, borderRadius: 20, backgroundColor: '#FFF', overflow: 'hidden', borderWidth: 2, borderColor: '#FFF' },
  avatarImage: { width: '100%', height: '100%' },
  cameraBtn: {
    position: 'absolute', bottom: -2, right: -2,
    backgroundColor: '#FFF', padding: 8, borderRadius: 12,
    borderWidth: 1.5, borderColor: 'rgba(90,45,130,0.1)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  nameContainer: { justifyContent: 'center' },
  nameSection: { gap: 4 },
  userName: { fontSize: 20, fontWeight: '900', color: '#2B2B2B', letterSpacing: -0.5 },
  locationContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(90,45,130,0.05)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, alignSelf: 'flex-start' },
  userLocation: { fontSize: 11, fontWeight: '800', color: '#5A2D82', letterSpacing: 0.2 },
  reputationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12, gap: 4, borderWidth: 1, borderColor: 'rgba(90,45,130,0.05)' },
  ratingValue: { fontSize: 10, fontWeight: '900', color: '#5A2D82' },
  reviewCount: { fontSize: 9, fontWeight: '600', color: 'rgba(43,43,43,0.4)' },
  settingsBtn: { padding: 10, backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#F3F4F6' },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 },

  // Stats Bar
  statsBar: {
    flexDirection: 'row', backgroundColor: '#FFF', padding: 20, borderRadius: 30, marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(90,45,130,0.05)',
    shadowColor: '#5A2D82', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.03, shadowRadius: 20, elevation: 2,
  },
  statItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  statIconCircle: { width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statTextContainer: { justifyContent: 'center' },
  statNumber: { fontSize: 16, fontWeight: '900', color: '#1A1A2E' },
  statLabel: { fontSize: 8, fontWeight: '900', color: 'rgba(26,26,46,0.4)', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(90,45,130,0.08)' },

  // Rank
  rankContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A2E', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, marginBottom: 24, gap: 10 },
  rankTitle: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  rankName: { fontSize: 14, fontWeight: '900', color: '#F4C542' },

  // Actions
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 35 },
  addItemBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#5A2D82', paddingVertical: 16, borderRadius: 20, gap: 10,
    shadowColor: '#5A2D82', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 5,
  },
  addItemText: { color: '#F4C542', fontWeight: '900', fontSize: 10, letterSpacing: 1.2 },
  editBtn: { width: 60, height: 60, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(90,45,130,0.08)' },
  editBtnText: { color: '#5A2D82', fontWeight: '900', fontSize: 10, letterSpacing: 1 },

  // Gallery
  galleryContainer: { width: '100%' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#2B2B2B', letterSpacing: 0.5, textTransform: 'uppercase' },
  countBadge: { backgroundColor: 'rgba(90,45,130,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  countText: { fontSize: 8, fontWeight: '900', color: '#5A2D82', letterSpacing: 1 },
  closetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  closetItem: {
    width: (width - 48 - 16) / 2, marginBottom: 24, backgroundColor: '#FFF', borderRadius: 24, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
  },
  imageContainer: { width: '100%', height: 180, position: 'relative', backgroundColor: '#F3F4F6' },
  closetImage: { width: '100%', height: '100%' },
  cardBadgeContainer: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', gap: 4 },
  cardBadge: { width: 22, height: 22, borderRadius: 8, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  badgeTextSmall: { fontSize: 7, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
  reListOverlay: {
    position: 'absolute', bottom: 10, right: 10, backgroundColor: '#5A2D82',
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 12, gap: 6, borderWidth: 1, borderColor: 'rgba(244,197,66,0.3)',
    shadowColor: '#5A2D82', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  reListText: { fontSize: 8, fontWeight: '900', color: '#F4C542', letterSpacing: 1 },
  closetItemInfo: { padding: 12 },
  closetItemName: { fontSize: 13, fontWeight: '700', color: '#2B2B2B', marginBottom: 2 },
  closetItemPrice: { fontSize: 11, fontWeight: '900', color: '#5A2D82' },
  emptyContainer: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: 60,
    backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 30,
    borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(90,45,130,0.1)',
  },
  sectionPlaceholder: { color: 'rgba(43,43,43,0.3)', fontSize: 14, fontWeight: '700', marginTop: 12 },
  emptyActionText: { color: '#5A2D82', fontSize: 12, fontWeight: '900', marginTop: 8, textDecorationLine: 'underline' },
});