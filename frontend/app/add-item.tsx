import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, Plus, X, Tag, Ruler, Info, DollarSign, ArrowRightLeft, Sparkles, Heart, MapPin } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { AuthButton } from '@/components/AuthUI';
import { useClothes } from '@/hooks/useClothes';
import { LocationPicker } from '@/components/LocationPicker';
import { useAppStore } from '@/store/useAppStore';

const AddItemScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAppStore();
  const { addClothes, loading, uploadProgress } = useClothes();

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'Tricouri',
    size: 'M',
    condition: 'Nou',
    mode: '' as 'trade' | 'sell' | 'both' | 'donate',
    price: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    address: '',
  });

  const [images, setImages] = useState<string[]>([]);
  const [isMapVisible, setIsMapVisible] = useState(false);

  // Auto-fill location from user profile
  useEffect(() => {
    if (user?.latitude && user?.longitude) {
      setForm(prev => ({
        ...prev,
        latitude: user.latitude,
        longitude: user.longitude,
        address: 'Your profile location', // Fallback label
      }));
    }
  }, [user]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const newImages = result.assets.map(asset => asset.uri);
      setImages([...images, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!form.name || images.length === 0 || !form.mode) {
      Alert.alert('Error', 'Please add at least one photo and a name for the product.');
      return;
    }

    if ((form.mode === 'sell' || form.mode === 'both') && !form.price) {
      Alert.alert('Error', 'Please enter the selling price.');
      return;
    }

    try {
      const { address, ...cleanForm } = form;
      addClothes({
        ...cleanForm,
        images, // local URIs — useClothes will upload them to Firebase Storage
        price: form.price ? parseFloat(form.price) : null,
      }).catch(err => {
        console.error('[AddItem] Background save failed:', err);
        // We could show a global notification here if needed
      });
      
      // Close immediately for instant feedback
      router.back();
    } catch (err: any) {
      Alert.alert('Error saving', err.message);
    }
  };

  // Progress label shown during image upload
  const getProgressLabel = () => {
    if (uploadProgress) {
      return `Uploading images... ${uploadProgress.current}/${uploadProgress.total}`;
    }
    if (loading) return 'Saving...';
    return 'Save Item';
  };

  const renderModeOption = (mode: 'trade' | 'sell' | 'both' | 'donate', label: string, iconElement: React.ReactNode) => {
    const isActive = form.mode === mode;
    return (
      <TouchableOpacity
        style={[styles.modeOption, isActive && styles.modeOptionActive]}
        onPress={() => setForm({ ...form, mode })}
      >
        {iconElement}
        <Text style={[styles.modeLabel, isActive && styles.modeLabelActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* BACKGROUND DECORATIVE AURA */}
      <View style={styles.auraPurple} />
      <View style={styles.auraGold} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <X size={24} color="#2B2B2B" strokeWidth={3} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New in Wardrobe</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Photos Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <Text style={styles.sectionCount}>{images.length} / 5</Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll} contentContainerStyle={{ paddingRight: 24 }}>
            <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImage} activeOpacity={0.8}>
              <View style={styles.addPhotoIconBox}>
                <Camera size={28} color="#5A2D82" />
                <View style={styles.addPhotoPlus}>
                  <Plus size={12} color="#FAF7F2" strokeWidth={4} />
                </View>
              </View>
              <Text style={styles.addPhotoText}>Add</Text>
            </TouchableOpacity>
            
            {images.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removeImage(index)}>
                  <X size={10} color="#FFF" strokeWidth={3} />
                </TouchableOpacity>
                {index === 0 && (
                   <View style={styles.mainPhotoBadge}>
                      <Text style={styles.mainPhotoText}>COVER</Text>
                   </View>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Form Content in a Premium Card */}
          <View style={styles.formCard}>
            {/* Basic Info */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Item Name</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Eg. Vintage Nike T-shirt"
                  placeholderTextColor="rgba(43, 43, 43, 0.3)"
                  value={form.name}
                  onChangeText={(v) => setForm({ ...form, name: v })}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Item Story (Description)</Text>
              <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Tell us more about this item..."
                  placeholderTextColor="rgba(43, 43, 43, 0.3)"
                  multiline
                  numberOfLines={4}
                  value={form.description}
                  onChangeText={(v) => setForm({ ...form, description: v })}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}><Tag size={12} color="#5A2D82" /> Category</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="T-shirts..."
                    placeholderTextColor="rgba(43, 43, 43, 0.3)"
                    value={form.category}
                    onChangeText={(v) => setForm({ ...form, category: v })}
                  />
                </View>
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}><Ruler size={12} color="#5A2D82" /> Size</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="M, 42, L..."
                    placeholderTextColor="rgba(43, 43, 43, 0.3)"
                    value={form.size}
                    onChangeText={(v) => setForm({ ...form, size: v })}
                  />
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Location Section */}
            <Text style={styles.smallSectionTitle}>Where can we find you?</Text>
            <TouchableOpacity 
              style={styles.locationCard}
              onPress={() => setIsMapVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.locationIconBox}>
                <MapPin size={22} color="#5A2D82" fill="#F4C542" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.locationTitle}>
                  {form.address ? 'Location Set' : 'Choose Location on Map'}
                </Text>
                <Text style={styles.locationSubtitle} numberOfLines={1}>
                  {form.address || 'Help the buyer know where the item is located.'}
                </Text>
              </View>
              <View style={styles.arrowBox}>
                 <Sparkles size={14} color="#F4C542" />
              </View>
            </TouchableOpacity>

            <LocationPicker 
              visible={isMapVisible}
              onClose={() => setIsMapVisible(false)}
              initialLocation={form.latitude ? { latitude: form.latitude, longitude: form.longitude!, address: form.address } : undefined}
              onConfirm={(loc) => {
                setForm({ 
                  ...form, 
                  latitude: loc.latitude, 
                  longitude: loc.longitude, 
                  address: loc.address,
                });
              }}
            />

            <View style={styles.divider} />

            {/* Mode Selection */}
            <Text style={styles.smallSectionTitle}>How do you want to offer it?</Text>
            <View style={styles.modeGrid}>
              {renderModeOption('trade', 'Trade', <ArrowRightLeft size={18} color={form.mode === 'trade' ? '#FAF7F2' : '#5A2D82'} />)}
              {renderModeOption('sell', 'Buy', <DollarSign size={18} color={form.mode === 'sell' ? '#FAF7F2' : '#5A2D82'} />)}
              {renderModeOption('both', 'Both', <Sparkles size={18} color={form.mode === 'both' ? '#FAF7F2' : '#5A2D82'} />)}
              {renderModeOption('donate', 'Donate', <Heart size={18} color={form.mode === 'donate' ? '#FAF7F2' : '#E74C3C'} />)}
            </View>

            {/* Price Input */}
            {(form.mode === 'sell' || form.mode === 'both') && (
              <View style={styles.priceGroup}>
                <Text style={styles.label}>Desired Price (RON)</Text>
                <View style={[styles.inputWrapper, styles.priceInputWrapper]}>
                  <Text style={styles.currencySymbol}>RON</Text>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={form.price}
                    onChangeText={(v) => setForm({ ...form, price: v })}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Upload Progress */}
          {uploadProgress && (
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <ActivityIndicator size="small" color="#5A2D82" />
                <Text style={styles.progressTitle}>Uploading Item...</Text>
                <Text style={styles.progressDetail}>{uploadProgress.current}/{uploadProgress.total}</Text>
              </View>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    { width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }
                  ]}
                />
              </View>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.saveBtn, (loading || !!uploadProgress) && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={loading || !!uploadProgress}
            activeOpacity={0.8}
          >
            {loading || !!uploadProgress ? (
               <ActivityIndicator color="#5A2D82" />
            ) : (
               <>
                 <Text style={styles.saveBtnText}>{getProgressLabel()}</Text>
                 <Sparkles size={18} color="#5A2D82" strokeWidth={2.5} />
               </>
            )}
          </TouchableOpacity>
          
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  // BACKGROUND AURA
  auraPurple: {
    position: 'absolute',
    top: 0,
    right: -50,
    width: 250,
    height: 250,
    backgroundColor: 'rgba(142, 68, 173, 0.05)',
    borderRadius: 125,
  },
  auraGold: {
    position: 'absolute',
    top: '30%',
    left: -70,
    width: 280,
    height: 280,
    backgroundColor: 'rgba(244, 197, 66, 0.04)',
    borderRadius: 140,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2B2B2B',
    letterSpacing: -0.5,
  },
  backBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#FFF',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#2B2B2B',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  sectionCount: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(90, 45, 130, 0.3)',
    letterSpacing: 1,
  },
  imageScroll: {
    flexDirection: 'row',
    marginBottom: 32,
    marginLeft: -4, // Counterbalance padding for alignment
  },
  addPhotoBtn: {
    width: 100,
    height: 140,
    backgroundColor: 'rgba(90, 45, 130, 0.03)',
    borderRadius: 28,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(90, 45, 130, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  addPhotoIconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#5A2D82',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  addPhotoPlus: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F4C542',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  addPhotoText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#5A2D82',
    marginTop: 12,
    letterSpacing: 0.5,
  },
  imageWrapper: {
    width: 100,
    height: 140,
    marginRight: 16,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#E74C3C',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  mainPhotoBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(90, 45, 130, 0.9)',
    borderRadius: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  mainPhotoText: {
    color: '#F4C542',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#5A2D82',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(43, 43, 43, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    paddingLeft: 4,
  },
  inputWrapper: {
    backgroundColor: '#FAF7F2',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(90, 45, 130, 0.04)',
    overflow: 'hidden',
  },
  input: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: '700',
    color: '#2B2B2B',
  },
  textAreaWrapper: {
    minHeight: 120,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  row: {
    flexDirection: 'row',
  },
  divider: {
    height: 1.5,
    backgroundColor: 'rgba(90, 45, 130, 0.05)',
    marginVertical: 24,
  },
  smallSectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#5A2D82',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  locationCard: {
    backgroundColor: '#FAF7F2',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(244, 197, 66, 0.2)',
  },
  locationIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F4C542',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#2B2B2B',
  },
  locationSubtitle: {
    fontSize: 11,
    color: 'rgba(43, 43, 43, 0.4)',
    fontWeight: '600',
    marginTop: 2,
  },
  arrowBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(90, 45, 130, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  modeOption: {
    width: '48%',
    backgroundColor: '#FAF7F2',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(90, 45, 130, 0.04)',
  },
  modeOptionActive: {
    backgroundColor: '#5A2D82',
    borderColor: '#5A2D82',
    shadowColor: '#5A2D82',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  modeLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#5A2D82',
  },
  modeLabelActive: {
    color: '#FAF7F2',
  },
  priceGroup: {
    marginTop: 24,
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    backgroundColor: 'rgba(244, 197, 66, 0.05)',
    borderColor: 'rgba(244, 197, 66, 0.2)',
  },
  currencySymbol: {
    fontSize: 12,
    fontWeight: '900',
    color: '#F4C542',
    marginRight: 4,
  },
  progressCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginTop: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(90, 45, 130, 0.05)',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  progressTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
    color: '#2B2B2B',
  },
  progressDetail: {
    fontSize: 12,
    fontWeight: '900',
    color: '#5A2D82',
  },
  track: {
    height: 8,
    backgroundColor: '#FAF7F2',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#F4C542',
    borderRadius: 4,
  },
  saveBtn: {
    marginTop: 32,
    height: 70,
    backgroundColor: '#F4C542',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#F4C542',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 6,
  },
  saveBtnDisabled: {
    backgroundColor: 'rgba(244, 197, 66, 0.4)',
    shadowOpacity: 0.1,
  },
  saveBtnText: {
    color: '#5A2D82',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
});

export default AddItemScreen;
