import { ClothingItem, useClothes } from '@/hooks/useClothes';
import { useAppStore } from "@/store/useAppStore";
import { useRouter } from 'expo-router';
import { Bell, Heart, MapPin, RotateCcw, Search, ShoppingBag, SlidersHorizontal, Sparkles, X as XIcon, Menu } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FilterModal, { FilterState } from "./FilterModal";
import RadiusSelector from "./RadiusSelector";
import SwipeCard from "./SwipeCard";
import BASE_URL from '@/config/api';
import { useFollow } from '@/hooks/useFollow';
import FeedFollowing from './FeedFollowing';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 16:9 portrait card: height/width = 16/9
const CARD_HORIZONTAL_MARGIN = 16;
const CARD_WIDTH = SCREEN_WIDTH - CARD_HORIZONTAL_MARGIN * 2;
const CARD_HEIGHT = CARD_WIDTH * (16 / 9);

const SwipeView = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const swiperRef = useRef<Swiper<any>>(null);
  const { 
    radius, cart, skipped, addToCart, skipItem, resetFilters,
    addingItem, uploadProgress, isDarkMode, clothesUpdateTrigger 
  } = useAppStore();
  const dk = isDarkMode;

  const { fetchExploreFeed, error: fetchError, loading: fetchLoading } = useClothes();

  const [feedMode, setFeedMode] = useState<'fyp' | 'following'>('fyp');
  useFollow(); // imported for FeedFollowing component usage

  const [items, setItems] = useState<ClothingItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [deckKey, setDeckKey] = useState(0);
  const [availableHeight, setAvailableHeight] = useState(0);
  const [filterVisible, setFilterVisible] = useState(false);
  const [radiusVisible, setRadiusVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    modes: [],
    categories: [],
    sizes: [],
    conditions: [],
    sortBy: 'newest'
  });

  // --- STALE CLOSURE FIX: Use a ref to always have the latest state in swiper callbacks ---
  const stateRef = useRef({
    items, nextCursor, skipped, cart, loading: fetchLoading, currentCardIndex
  });

  useEffect(() => {
    stateRef.current = { items, nextCursor, skipped, cart, loading: fetchLoading, currentCardIndex };
  }, [items, nextCursor, skipped, cart, fetchLoading, currentCardIndex]);

  // Keep a separate ref for fetching to prevent duplicates even within the same render cycle
  const isFetchingRef = useRef(false);

  // Store the cards currently being swiped to prevent jumping
  const [deckItems, setDeckItems] = useState<ClothingItem[]>([]);

  useEffect(() => {
    // FeedFollowing component handles its own data — skip swipe deck fetch
    if (feedMode === 'following') return;

    console.log(`[SwipeView] 🚀 Initializing FYP feed...`);
    fetchExploreFeed(undefined, 10).then(res => {
      console.log(`[SwipeView] ✅ Initial Load: ${res.items.length} items. Cursor: ${res.nextCursor}`);
      setItems(res.items);
      setNextCursor(res.nextCursor);
    });
  }, [deckKey, clothesUpdateTrigger, feedMode]);

  const loadMoreCards = async () => {
    const { nextCursor: currentCursor } = stateRef.current;
    if (currentCursor && !isFetchingRef.current) {
      console.log(`[SwipeView] 🔄 Pre-fetching NEXT 10 items (Cursor: ${currentCursor})...`);
      isFetchingRef.current = true;
      try {
        const res = await fetchExploreFeed(currentCursor, 10);
        if (res.items.length > 0) {
          console.log(`[SwipeView] ✨ Appended ${res.items.length} items. Pool: ${items.length + res.items.length}`);
          setItems(prev => [...prev, ...res.items]);
          setNextCursor(res.nextCursor);
        } else {
          setNextCursor(null);
        }
      } finally {
        isFetchingRef.current = false;
      }
    }
  };

  const handleSwiped = (index: number) => {
    const { items: allFetched } = stateRef.current;
    const itemsLeft = allFetched.length - (index + 1);
    
    console.log(`[SwipeView] 👆 Swiped index ${index}. Items left in memory: ${itemsLeft}`);
    
    // Fetch earlier (threshold 6)
    if (itemsLeft <= 6) {
      loadMoreCards();
    }
  };

  const handleSwipedAll = async () => {
    const { nextCursor: currentCursor, items: allFetched, currentCardIndex: lastIndex } = stateRef.current;
    console.log(`[SwipeView] 🏁 All cards visually swiped. Index: ${lastIndex}. Pool: ${allFetched.length}. Cursor: ${!!currentCursor}`);
    
    // Logica de Re-Umplere:
    // 1. Daca avem haine in pool pe care inca nu le-am aratat in acest deck (Pool > Index)
    // 2. SAU daca am terminat tot ce aveam in pool dar mai exista pagini de adus (currentCursor)
    if (allFetched.length > lastIndex || currentCursor) {
      if (allFetched.length <= lastIndex && currentCursor) {
        // Suntem la finalul memoriei, dar mai sunt pagini pe server. Tragem restul!
        await loadMoreCards();
      }
      console.log(`[SwipeView] 🔄 Refreshing deckKey for next batch.`);
      setDeckKey(prev => prev + 1);
      setCurrentCardIndex(0);
    } else {
      // 3. Nu mai sunt haine noi deloc nici pe server. Re-aratam pe cele skipuite.
      console.log(`[SwipeView] ℹ️ Truly finished all items. Showing skipped collection.`);
      setDeckKey(prev => prev + 1);
      setCurrentCardIndex(0);
    }
  };

  const filteredItems = useMemo<ClothingItem[]>(() => {
    const rawCount = items.length;
    
    // 1. ELIMINĂM CE E ÎN COȘ (Regulă de bază)
    const afterCart = items.filter(item => !cart.find(c => c.id === item.id));

    // 2. APLICĂM FILTRELE ACTIVE (Search + Categorie + Mărime + etc.)
    const afterFilters = afterCart.filter(item => {
      // Search Box Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = (item.name || '').toLowerCase().includes(query);
        const matchesCategory = (item.category || '').toLowerCase().includes(query);
        if (!matchesName && !matchesCategory) return false;
      }
      // Modal Filters
      if (filters.modes.length > 0 && !filters.modes.includes(item.mode)) return false;
      if (filters.categories.length > 0 && !filters.categories.includes(item.category)) return false;
      if (filters.sizes.length > 0 && !filters.sizes.includes(item.size)) return false;
      if (filters.conditions.length > 0 && !filters.conditions.includes(item.condition)) return false;
      return true;
    });

    // 3. PRIORITIZĂM (Noutatea în față, Refuzurile la final)
    const unseen = afterFilters.filter(item => !skipped.includes(item.id!));
    const alreadySkipped = afterFilters.filter(item => skipped.includes(item.id!));
    const finalResult = [...unseen, ...alreadySkipped];

    // --- ADVANCED DEBUGGER ---
    console.group(`[WearWise DEBUGGER] - DeckKey: ${deckKey}`);
    console.log(`📦 MEMORIE (Pool): ${rawCount} haine`);
    console.log(`🛒 ÎN COȘ: ${cart.length} | ❌ REFUZATE (Session): ${skipped.length}`);
    console.log(`🔍 FILTRARE: ${afterFilters.length} / ${rawCount} trec de filtre`);
    console.log(`✨ BATCH SWIPE: ${unseen.length} noi | 🔄 ${alreadySkipped.length} recalculate`);
    console.log(`📍 INDEX CURENT: ${currentCardIndex + 1} / ${finalResult.length}`);
    const remainingToFetch = rawCount - (currentCardIndex + 1);
    console.log(`📥 NEXT FETCH ÎN: ${remainingToFetch - 6} swipe-uri (Threshold: 6)`);
    console.groupEnd();

    return finalResult;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, deckKey, cart, skipped, filters, searchQuery]);

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
    setFilterVisible(false);
    setDeckKey((prev: number) => prev + 1);
  };

  const handleSwipeRight = (index: number) => {
    const item = filteredItems[index];
    if (item && item.id) {
      addToCart({
        id: item.id,
        name: item.name,
        price: item.price || 0,
        image: (item.images && item.images.length > 0) ? item.images[0] : 'https://via.placeholder.com/400',
        seller: item.userId,
        size: item.size,
        distance: item.distance || 0,
      });
    }
  };

  const handleSwipeLeft = (index: number) => {
    const item = filteredItems[index];
    if (item && item.id) skipItem(item.id);
  };

  const resetDeck = () => {
    setDeckKey((prev: number) => prev + 1);
  };

  // Variabile animații adiționale (butoane) șterse

  const hasActiveFilters = filters.modes.length > 0 || filters.categories.length > 0
    || filters.sizes.length > 0 || filters.conditions.length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 90 }, dk && { backgroundColor: '#1E1E1E' }]}>
      {/* ─── DECORATIVE AURA BACKGROUND ─── */}
      <View style={[styles.auraContainer, { pointerEvents: 'none' as any }]}>
        <View style={styles.auraPurple} />
        <View style={styles.auraGold} />
      </View>

      {/* ─── HEADER (STATIC, ABOVE CARDS) ─── */}
      <View style={styles.header}>
        {/* Row 1: Title + Cart */}
        <View style={styles.topRow}>
          <View style={styles.titleContainer}>
            <TouchableOpacity onPress={() => {}} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Menu size={24} color={dk ? '#C084FC' : '#3B1C56'} strokeWidth={2.5} />
            </TouchableOpacity>
            {/* Feed Mode Tabs */}
            <View style={[styles.feedTabs, dk && { backgroundColor: '#2B2B2B' }]}>
              <TouchableOpacity
                style={[styles.feedTab, feedMode === 'fyp' && styles.feedTabActive, dk && feedMode === 'fyp' && { backgroundColor: '#5A2D82' }]}
                onPress={() => { if (feedMode !== 'fyp') { setFeedMode('fyp'); setDeckKey(k => k + 1); setCurrentCardIndex(0); }}}
                activeOpacity={0.8}
              >
                <Text style={[styles.feedTabText, feedMode === 'fyp' && styles.feedTabTextActive, dk && feedMode !== 'fyp' && { color: 'rgba(255,255,255,0.4)' }]}>
                  For You
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.feedTab, feedMode === 'following' && styles.feedTabActive, dk && feedMode === 'following' && { backgroundColor: '#5A2D82' }]}
                onPress={() => { if (feedMode !== 'following') { setFeedMode('following'); setDeckKey(k => k + 1); setCurrentCardIndex(0); }}}
                activeOpacity={0.8}
              >
                <Text style={[styles.feedTabText, feedMode === 'following' && styles.feedTabTextActive, dk && feedMode !== 'following' && { color: 'rgba(255,255,255,0.4)' }]}>
                  Following
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.headerActionBox}>
            {skipped.length > 0 && (
              <TouchableOpacity
                style={[styles.iconCircleBtn, { backgroundColor: '#FF4B4B15', borderColor: '#FF4B4B30' }]}
                onPress={() => {
                  resetFilters();
                  setItems([]); // Clear local cache to force a real backend refresh
                  setDeckKey(prev => prev + 1);
                }}
                activeOpacity={0.8}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
              >
                <RotateCcw size={20} color="#FF4B4B" strokeWidth={3} />
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.iconCircleBtn, dk && { backgroundColor: '#2B2B2B', borderColor: 'rgba(255,255,255,0.06)' }]} onPress={() => router.push('/notifications')} activeOpacity={0.8} hitSlop={{top: 5, bottom: 5, left: 5, right: 5}}>
              <Bell size={22} color={dk ? '#C084FC' : '#5A2D82'} strokeWidth={2.5} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.iconCircleBtn, dk && { backgroundColor: '#2B2B2B', borderColor: 'rgba(255,255,255,0.06)' }]} onPress={() => router.push('/(tabs)/cart')} activeOpacity={0.8} hitSlop={{top: 5, bottom: 5, left: 5, right: 5}}>
              <ShoppingBag size={22} color={dk ? '#C084FC' : '#5A2D82'} strokeWidth={2.5} />
              {cart.length > 0 && (
                <View style={[styles.cartBadge, { top: -4, right: -4 }]}>
                  <Text style={styles.cartBadgeText}>{cart.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Row 2: Search + Location + Filters */}
        <View style={styles.discoveryRow}>
          <View style={[styles.searchBox, dk && { backgroundColor: '#2B2B2B', borderColor: 'rgba(255,255,255,0.06)' }]}>
            <Search size={17} color={dk ? '#C084FC' : '#9B59B6'} />
            <TextInput
              style={[styles.searchInput, dk && { color: '#FFFFFF' }]}
              placeholder="Search unique items..."
              placeholderTextColor={dk ? 'rgba(192,132,252,0.45)' : 'rgba(90,45,130,0.35)'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <TouchableOpacity
            style={[styles.iconBtn, dk && { backgroundColor: '#2B2B2B', borderColor: 'rgba(255,255,255,0.06)' }, radiusVisible && styles.iconBtnActive, { borderRadius: 25 }]}
            onPress={() => setRadiusVisible(v => !v)}
          >
            <MapPin size={19} color={radiusVisible ? '#FFF' : (dk ? '#C084FC' : '#5A2D82')} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconBtn, dk && { backgroundColor: '#2B2B2B', borderColor: 'rgba(255,255,255,0.06)' }, hasActiveFilters && styles.iconBtnDot, { borderRadius: 25 }]}
            onPress={() => setFilterVisible(true)}
          >
            <SlidersHorizontal size={19} color={dk ? '#C084FC' : '#5A2D82'} strokeWidth={2.5} />
            {hasActiveFilters && <View style={styles.activeDot} />}
          </TouchableOpacity>
        </View>

        {/* Radius expander */}
        {radiusVisible && (
          <View style={styles.radiusExpander}>
            <RadiusSelector />
          </View>
        )}

        {/* Background Upload Progress */}
        {addingItem && (
          <View style={styles.bgUploadBar}>
            <View style={styles.bgUploadInfo}>
              <Sparkles size={12} color="#5A2D82" />
              <Text style={styles.bgUploadText}>
                {uploadProgress
                  ? `Loading item... ${uploadProgress.current}/${uploadProgress.total}`
                  : 'Finalizing addition...'}
              </Text>
            </View>
            {uploadProgress && (
              <View style={styles.bgProgressTrack}>
                <View
                  style={[
                    styles.bgProgressFill,
                    { width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }
                  ]}
                />
              </View>
            )}
          </View>
        )}
      </View>
      

      
      {/* Following Mode: vertical list feed — completely replaces swipe deck */}
      {feedMode === 'following' ? (
        <FeedFollowing style={{ flex: 1 }} />
      ) : (
      <View
        style={styles.cardArea}
        onLayout={(e) => {
          const { height } = e.nativeEvent.layout;
          if (height > 0) setAvailableHeight(height);
        }}
      >
        {filteredItems.length > 0 ? (
          <Swiper
            key={`${deckKey}-${items.length}-${radius}-${availableHeight > 0 ? 1 : 0}`}
            ref={swiperRef}
            cards={filteredItems}
            useViewOverflow={Platform.OS !== 'web'}
            renderCard={(card: ClothingItem) => (
              <SwipeCard
                item={card}
                cardWidth={CARD_WIDTH}
                cardHeight={availableHeight ? availableHeight - 20 : CARD_HEIGHT}
              />
            )}
            onSwiped={(index: number) => {
              setCurrentCardIndex(index + 1);
              handleSwiped(index);
            }}
            onSwipedLeft={(index: number) => {
              handleSwipeLeft(index);
            }}
            onSwipedRight={(index: number) => {
              handleSwipeRight(index);
            }}
            cardIndex={currentCardIndex}
            backgroundColor="transparent"
            stackSize={Math.min(filteredItems.length - currentCardIndex, 10) || 1}
            stackSeparation={14}
            animateCardOpacity
            disableTopSwipe
            disableBottomSwipe
            onSwipedAll={handleSwipedAll}
            // AICI ESTE MODIFICAREA PENTRU EFECTUL DE PENDUL (PIVOT SUS)
            // Joacă-te cu aceste valori (ex: 20deg, 30deg) pentru a face efectul mai extrem //todo
            outputRotationRange={['15deg', '0deg', '-15deg']}
            containerStyle={styles.swiperContainer}
            cardVerticalMargin={10}
            cardHorizontalMargin={CARD_HORIZONTAL_MARGIN}
            overlayLabels={{
              left: {
                element: (
                  <View style={styles.overlayIconLeft}>
                    <XIcon size={100} color="#FF4B4B" strokeWidth={4} />
                  </View>
                ),
                style: { wrapper: styles.overlayWLeft }
              },
              right: {
                element: (
                  <View style={styles.overlayIconRight}>
                    <Heart size={90} color="#ff90f0ff" fill="#ff90f0ff" strokeWidth={3} />
                  </View>
                ),
                style: { wrapper: styles.overlayWRight }
              }
            }}
          />
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <RotateCcw size={38} color="#F4C542" />
            </View>
            <Text style={styles.emptyTitle}>
              {fetchError ? 'Network Error' : 'Wardrobe explored!'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {fetchError
                ? `Could not connect to ${BASE_URL}.\nError: ${fetchError}`
                : feedMode === 'following'
                  ? `Follow some users in the Community tab to see their items here.`
                  : `We checked everything within a radius of ${radius}km.\nCheck back soon for updates!`}
            </Text>
            <TouchableOpacity style={styles.resetBtn} onPress={resetDeck} activeOpacity={0.8}>
              <Text style={styles.resetBtnText}>{fetchLoading ? 'LOADING...' : 'RELOAD FEED'}</Text>
              <Sparkles size={15} color="#F4C542" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        )}
      </View>
      )}

      {/* ─── FILTER MODAL ─── */}
      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        filters={filters}
        onApply={handleApplyFilters}
      />
    </View>
  );
};

export default SwipeView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    ...(Platform.OS === 'web' ? { height: '100dvh' as any, overflow: 'hidden' as any } : {}),
  },

  // ── Aura ──────────────────────────────────────────────────────────
  auraContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  auraPurple: {
    position: 'absolute',
    top: '5%',
    left: -120,
    width: 360,
    height: 360,
    backgroundColor: 'rgba(142,68,173,0.07)',
    borderRadius: 180,
  },
  auraGold: {
    position: 'absolute',
    bottom: '20%',
    right: -100,
    width: 340,
    height: 340,
    backgroundColor: 'rgba(244,197,66,0.06)',
    borderRadius: 170,
  },

  // ── Header ────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    zIndex: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#9B59B6',
    letterSpacing: 2.5,
  },
  titleText: {
    fontSize: 28,
    fontFamily: 'Quicksand_700Bold',
    color: '#3B1C56',
    letterSpacing: -0.5,
  },
  headerActionBox: {
    flexDirection: 'row',
    gap: 12,
  },
  iconCircleBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#FFF',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0px 6px 12px rgba(90, 45, 130, 0.12)' } as any,
      default: {
        shadowColor: '#5A2D82',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 4,
      }
    }),
    borderWidth: 1.5,
    borderColor: 'rgba(90,45,130,0.06)',
  },
  cartBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 20,
    height: 20,
    backgroundColor: '#F4C542',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#5A2D82',
  },
  discoveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
    ...Platform.select({
      web: { boxShadow: '0px 4px 10px rgba(90, 45, 130, 0.08)' } as any,
      default: {
        shadowColor: '#5A2D82',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
      }
    }),
    borderWidth: 1.5,
    borderColor: 'rgba(90,45,130,0.05)',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  iconBtn: {
    width: 50,
    height: 50,
    backgroundColor: '#FFF',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0px 4px 10px rgba(90, 45, 130, 0.08)' } as any,
      default: {
        shadowColor: '#5A2D82',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
      }
    }),
    borderWidth: 1.5,
    borderColor: 'rgba(90,45,130,0.05)',
  },
  iconBtnActive: {
    backgroundColor: '#5A2D82',
    borderColor: '#5A2D82',
  },
  iconBtnDot: {},
  activeDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 7,
    height: 7,
    backgroundColor: '#F4C542',
    borderRadius: 3.5,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  radiusExpander: {
    marginTop: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  bgUploadBar: {
    marginTop: 12,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(90,45,130,0.1)',
    ...Platform.select({
      web: { boxShadow: '0px 4px 8px rgba(90, 45, 130, 0.05)' } as any,
      default: {
        shadowColor: '#5A2D82',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }
    }),
  },
  bgUploadInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  bgUploadText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#5A2D82',
  },
  bgProgressTrack: {
    height: 4,
    backgroundColor: '#FAF7F2',
    borderRadius: 2,
    overflow: 'hidden',
  },
  bgProgressFill: {
    height: '100%',
    backgroundColor: '#F4C542',
    borderRadius: 2,
  },

  // ── Card Area ─────────────────────────────────────────────────────
  cardArea: {
    flex: 1,
    zIndex: 5,
  },
  swiperContainer: {
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web' ? { width: CARD_WIDTH, height: CARD_HEIGHT, alignSelf: 'center' as any } : {}),
  },

  // ── Action Row ────────────────────────────────────────────────────
  actionRow: {
    paddingHorizontal: 40,
    paddingTop: 8,
    zIndex: 10,
  },

  // ── Empty State ───────────────────────────────────────────────────
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    backgroundColor: '#FFF',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...Platform.select({
      web: { boxShadow: '0px 6px 12px rgba(90, 45, 130, 0.1)' } as any,
      default: {
        shadowColor: '#5A2D82',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
      }
    }),
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A1A2E',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(26,26,46,0.5)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5A2D82',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 22,
    gap: 10,
  },
  resetBtnText: {
    color: '#F4C542',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  // ── Swipe Overlays ────────────────────────────────────────────────
  overlayWLeft: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    marginTop: 40,
    marginLeft: -30,
  },
  overlayIconLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '15deg' }],
    ...Platform.select({
      web: { filter: 'drop-shadow(0px 8px 12px rgba(255, 75, 75, 0.4))' } as any,
      default: {
        shadowColor: '#FF4B4B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
      }
    }),
  },
 overlayWRight: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginTop: 60,
    marginLeft: 25, // <-- Modifică această valoare pentru a găsi poziția perfectă
  },
  overlayIconRight: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '0deg' }],
    ...Platform.select({
      web: { filter: 'drop-shadow(0px 8px 12px rgba(255, 144, 240, 1))' } as any,
      default: {
        shadowColor: '#ff90f0ff',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
      }
    }),
  },

  // ── Feed Mode Tabs ─────────────────────────────────────────────────
  feedTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(90,45,130,0.06)',
    borderRadius: 14,
    padding: 3,
    gap: 2,
  },
  feedTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 11,
  },
  feedTabActive: {
    backgroundColor: '#5A2D82',
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(90,45,130,0.25)' } as any,
      default: { shadowColor: '#5A2D82', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
    }),
  },
  feedTabText: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(90,45,130,0.5)',
    letterSpacing: 0.2,
  },
  feedTabTextActive: {
    color: '#F4C542',
  },
});