import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { X, Check, SlidersHorizontal, MapPin } from 'lucide-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface FilterState {
  modes: string[];
  categories: string[];
  sizes: string[];
  conditions: string[];
  sortBy: string;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
}

const CATEGORIES = ['T-shirts', 'Pants', 'Dresses', 'Outerwear', 'Accessories', 'Footwear', 'Other'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const CONDITIONS = ['New with tags', 'Like new', 'Good', 'Used'];
const MODES = [
  { id: 'trade', label: 'Trade' },
  { id: 'sell', label: 'Buy' },
  { id: 'donate', label: 'Donate' }
];
const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest arrival' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
  { id: 'distance', label: 'Closest' }
];

const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, filters, onApply }) => {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  const toggleFilter = (key: keyof FilterState, value: string) => {
    setLocalFilters(prev => {
      const current = prev[key] as string[];
      const next = current.includes(value)
        ? current.filter((v: string) => v !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
  };

  const resetFilters = () => {
    setLocalFilters({
      modes: [],
      categories: [],
      sizes: [],
      conditions: [],
      sortBy: 'newest'
    });
  };

  const SelectionChip = ({ 
    label, 
    selected, 
    onPress 
  }: { 
    label: string, 
    selected: boolean, 
    onPress: () => void 
  }) => (
    <TouchableOpacity 
      style={[styles.chip, selected && styles.chipSelected]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
      {selected && <Check size={14} color="#5A2D82" strokeWidth={3} />}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color="#2B2B2B" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Filter Clothes</Text>
            <TouchableOpacity onPress={resetFilters}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Sort Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sort by</Text>
              <View style={styles.chipRow}>
                {SORT_OPTIONS.map(opt => (
                  <SelectionChip
                    key={opt.id}
                    label={opt.label}
                    selected={localFilters.sortBy === opt.id}
                    onPress={() => setLocalFilters(prev => ({ ...prev, sortBy: opt.id }))}
                  />
                ))}
              </View>
            </View>

            {/* Mode Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Listing Mode</Text>
              <View style={styles.chipRow}>
                {MODES.map(mode => (
                  <SelectionChip
                    key={mode.id}
                    label={mode.label}
                    selected={localFilters.modes.includes(mode.id)}
                    onPress={() => toggleFilter('modes', mode.id)}
                  />
                ))}
              </View>
            </View>

            {/* Category Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <View style={styles.chipRow}>
                {CATEGORIES.map(cat => (
                  <SelectionChip
                    key={cat}
                    label={cat}
                    selected={localFilters.categories.includes(cat)}
                    onPress={() => toggleFilter('categories', cat)}
                  />
                ))}
              </View>
            </View>

            {/* Sizes Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sizes</Text>
              <View style={styles.chipRow}>
                {SIZES.map(size => (
                  <SelectionChip
                    key={size}
                    label={size}
                    selected={localFilters.sizes.includes(size)}
                    onPress={() => toggleFilter('sizes', size)}
                  />
                ))}
              </View>
            </View>

            {/* Condition Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Condition</Text>
              <View style={styles.chipRow}>
                {CONDITIONS.map(cond => (
                  <SelectionChip
                    key={cond}
                    label={cond}
                    selected={localFilters.conditions.includes(cond)}
                    onPress={() => toggleFilter('conditions', cond)}
                  />
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer Apply Button */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.applyBtn} 
              onPress={() => onApply(localFilters)}
              activeOpacity={0.8}
            >
              <Text style={styles.applyText}>APPLY FILTERS</Text>
              <SlidersHorizontal size={20} color="#5A2D82" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FAF7F2',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    height: SCREEN_HEIGHT * 0.85,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(90, 45, 130, 0.05)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#2B2B2B',
  },
  closeBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#FFF',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(90, 45, 130, 0.05)',
  },
  resetText: {
    color: '#8E44AD',
    fontWeight: '800',
    fontSize: 14,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2B2B2B',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: 'rgba(90, 45, 130, 0.04)',
    gap: 10,
  },
  chipSelected: {
    backgroundColor: '#F4C542',
    borderColor: '#F4C542',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '800',
    color: 'rgba(43, 43, 43, 0.6)',
  },
  chipTextSelected: {
    color: '#5A2D82',
  },
  footer: {
    padding: 24,
    backgroundColor: '#FFF',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(90, 45, 130, 0.05)',
  },
  applyBtn: {
    height: 64,
    backgroundColor: '#F4C542',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#F4C542',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  applyText: {
    color: '#5A2D82',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
});

export default FilterModal;
