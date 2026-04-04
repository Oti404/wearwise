import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowRight, Cloud, Sparkles, X,
  ShoppingBag, ArrowRightLeft, HeartHandshake, Layers, CheckCircle2,
  ChevronRight
} from 'lucide-react-native';
import { myClosetItems, type ClothingItem, type ListingType } from "@/data/clothes";

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 3; // Grid cu 3 coloane

// ── Configuration ──────────────────────────────────────────────────────────

const LISTING_OPTIONS: {
  value: ListingType;
  label: string;
  sublabel: string;
  icon: any;
  accent: string;
  lightBg: string;
}[] = [
  { value: "buy", label: "Buy", sublabel: "List for direct purchase", icon: ShoppingBag, accent: "#5A2D82", lightBg: "#F3EBF7" },
  { value: "trade", label: "Trade", sublabel: "Accept fashion swaps", icon: ArrowRightLeft, accent: "#F4C542", lightBg: "#FFF9E6" },
  { value: "trade_buy", label: "Hybrid", sublabel: "Accept cash or swap", icon: Layers, accent: "#8E44AD", lightBg: "#F7F0FA" },
  { value: "donate", label: "Donate", sublabel: "Give away for free", icon: HeartHandshake, accent: "#10b981", lightBg: "#ECFDF5" },
];

const BADGE_STYLES: Record<ListingType, { bg: string; color: string; label: string } | null> = {
  buy: { bg: "#5A2D82", color: "#FFF", label: "BUY" },
  trade: { bg: "#F4C542", color: "#5A2D82", label: "TRADE" },
  trade_buy: { bg: "#8E44AD", color: "#FFF", label: "HYBRID" },
  donate: { bg: "#10b981", color: "#FFF", label: "DONATE" },
  wardrobe: null,
};

// ── Item Modal (Action Sheet) ──────────────────────────────────────────────

function ItemModal({ item, visible, onClose }: { item: ClothingItem | null; visible: boolean; onClose: () => void }) {
  if (!item) return null;
  const [selected, setSelected] = useState<ListingType>(item.listing);
  const [isSaving, setIsSaving] = useState(false);

  // Rezolvare sursă imagine
  const imageSource = typeof item.image === 'string' ? { uri: item.image } : item.image;

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      item.listing = selected;
      setIsSaving(false);
      onClose();
    }, 1000);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.dismissArea} onPress={onClose} activeOpacity={1} />
        
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderInfo}>
              <View style={styles.modalImageWrapper}>
                <Image 
                  source={imageSource} 
                  style={styles.modalItemImage} 
                  resizeMode="cover"
                />
                <View style={styles.modalSizeBadge}>
                  <Text style={styles.modalSizeText}>{item.size}</Text>
                </View>
              </View>
              <View style={styles.modalTextInfo}>
                <Text style={styles.modalStatusLabel}>Editing Item</Text>
                <Text style={styles.modalItemName} numberOfLines={1}>{item.name}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#2B2B2B" />
            </TouchableOpacity>
          </View>

          {/* Options Grid */}
          <View style={styles.optionsList}>
            {LISTING_OPTIONS.map((opt) => {
              const isActive = selected === opt.value;
              const Icon = opt.icon;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setSelected(opt.value)}
                  style={[styles.optionCard, isActive && { backgroundColor: opt.lightBg }]}
                  activeOpacity={0.8}
                >
                  <View style={[styles.optionIconBox, isActive && styles.optionIconActive]}>
                    <Icon size={20} color={isActive ? "#5A2D82" : "rgba(43,43,43,0.3)"} />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={[styles.optionLabel, isActive && { color: "#5A2D82" }]}>{opt.label}</Text>
                    <Text style={styles.optionSublabel}>{opt.sublabel}</Text>
                  </View>
                  {isActive ? <CheckCircle2 size={20} color="#5A2D82" /> : <ChevronRight size={18} color="rgba(43,43,43,0.1)" />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]} 
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#F4C542" />
            ) : (
              <View style={styles.saveBtnInner}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
                <Sparkles size={14} color="#F4C542" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Closet Component ────────────────────────────────────────────────────

export default function ClosetGallery() {
  const insets = useSafeAreaInsets();
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
          <View>
            <View style={styles.headerTag}>
              <View style={styles.tagPulse} />
              <Text style={styles.tagText}>Private Collection</Text>
            </View>
            <Text style={styles.title}>Closet</Text>
          </View>
          
          <View style={styles.headerRight}>
            <View style={styles.syncBadge}>
              <Cloud size={10} color="#5A2D82" />
              <Text style={styles.syncText}>Synced</Text>
            </View>
            <Text style={styles.itemCount}>{myClosetItems.length} items total</Text>
          </View>
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {myClosetItems.map((item: ClothingItem) => {
            const badge = BADGE_STYLES[item.listing];
            const imageSource = typeof item.image === 'string' ? { uri: item.image } : item.image;

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.9}
                onPress={() => setSelectedItem(item)}
                style={styles.gridItem}
              >
                <Image 
                  source={imageSource} 
                  style={styles.gridImage} 
                  resizeMode="cover"
                />
                {badge && (
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                )}
                <View style={styles.gridOverlay}>
                  <Text style={styles.gridItemName} numberOfLines={1}>{item.name}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Discover CTA */}
        <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.8}>
          <View style={styles.ctaIconBox}>
            <Sparkles size={16} color="#5A2D82" />
          </View>
          <Text style={styles.ctaText}>Discover Styles</Text>
          <ArrowRight size={16} color="rgba(244, 197, 66, 0.5)" />
        </TouchableOpacity>

      </ScrollView>

      <ItemModal 
        item={selectedItem} 
        visible={!!selectedItem} 
        onClose={() => setSelectedItem(null)} 
      />
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  header: {
    paddingHorizontal: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  headerTag: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  tagPulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F4C542', marginRight: 8 },
  tagText: { fontSize: 10, fontWeight: '900', color: '#8E44AD', textTransform: 'uppercase', letterSpacing: 1.5 },
  title: { fontSize: 42, fontWeight: '900', color: '#2B2B2B', letterSpacing: -2 },
  headerRight: { alignItems: 'flex-end' },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(90, 45, 130, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 4,
  },
  syncText: { fontSize: 9, fontWeight: '900', color: '#5A2D82', textTransform: 'uppercase' },
  itemCount: { fontSize: 10, fontWeight: '700', color: 'rgba(43,43,43,0.3)', textTransform: 'uppercase' },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8 },
  gridItem: {
    width: COLUMN_WIDTH,
    aspectRatio: 4/5,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  gridImage: { width: '100%', height: '100%' },
  statusBadge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, zIndex: 5 },
  statusBadgeText: { fontSize: 6, fontWeight: '900' },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(43,43,43,0.4)',
  },
  gridItemName: { color: '#FFF', fontSize: 8, fontWeight: '900', textTransform: 'uppercase' },
  
  ctaBtn: {
    marginHorizontal: 28,
    marginTop: 40,
    backgroundColor: '#5A2D82',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 32,
    gap: 12,
    shadowColor: '#5A2D82',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 10,
  },
  ctaIconBox: { backgroundColor: '#FFF', padding: 6, borderRadius: 10 },
  ctaText: { color: '#F4C542', fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(43,43,43,0.6)', justifyContent: 'flex-end' },
  dismissArea: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  modalContent: {
    backgroundColor: '#FAF7F2',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 32,
    paddingBottom: 48,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  modalHeaderInfo: { flexDirection: 'row', gap: 16 },
  modalImageWrapper: { position: 'relative' },
  modalItemImage: { width: 64, height: 80, borderRadius: 16, borderWidth: 2, borderColor: '#FFF' },
  modalSizeBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: '#F4C542',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFF',
    zIndex: 10,
  },
  modalSizeText: { fontSize: 9, fontWeight: '900', color: '#5A2D82' },
  modalTextInfo: { justifyContent: 'center' },
  modalStatusLabel: { fontSize: 10, fontWeight: '900', color: '#8E44AD', textTransform: 'uppercase', letterSpacing: 2 },
  modalItemName: { fontSize: 20, fontWeight: '900', color: '#2B2B2B', width: 150 },
  closeBtn: { padding: 8, backgroundColor: '#FFF', borderRadius: 20 },
  optionsList: { gap: 12, marginBottom: 32 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 24,
    gap: 16,
  },
  optionIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F9F9F9', alignItems: 'center', justifyContent: 'center' },
  optionIconActive: { backgroundColor: '#FFF' },
  optionTextContainer: { flex: 1 },
  optionLabel: { fontSize: 14, fontWeight: '900', color: '#2B2B2B', textTransform: 'uppercase' },
  optionSublabel: { fontSize: 10, color: 'rgba(43,43,43,0.5)', marginTop: 2 },
  saveBtn: {
    backgroundColor: '#5A2D82',
    paddingVertical: 20,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5A2D82',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 5,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  saveBtnText: { color: '#F4C542', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3 },
});