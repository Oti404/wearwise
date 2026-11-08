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
import { Camera, Plus, X, Tag, Ruler, Info, DollarSign, Sparkles, Check, AlertCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { AuthButton } from '@/components/AuthUI';
import { useClothes } from '@/hooks/useClothes';
import { useAppStore } from '@/store/useAppStore';
import { API_URL, getAuthToken } from '@/config/apiClient';

type ImageValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid';

interface ImageValidation {
  status: ImageValidationStatus;
  error?: string;
}

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
    mode: 'sell' as 'sell',
    price: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });

  const [images, setImages] = useState<string[]>([]);
  const [imageValidations, setImageValidations] = useState<ImageValidation[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  // Auto-fill location from user profile
  useEffect(() => {
    if (user?.latitude && user?.longitude) {
      setForm(prev => ({
        ...prev,
        latitude: user.latitude,
        longitude: user.longitude,
      }));
    }
  }, [user]);

  const allImagesValid = images.length > 0
    && imageValidations.length === images.length
    && imageValidations.every(v => v.status === 'valid');
  const anyValidating = imageValidations.some(v => v.status === 'validating');
  const anyInvalid = imageValidations.some(v => v.status === 'invalid');
  const canSave = allImagesValid && !isSaving && !loading && !!form.name && !!form.price;

  const validateImage = async (uri: string, index: number) => {
    setImageValidations(prev => {
      const next = [...prev];
      next[index] = { status: 'validating' };
      return next;
    });

    try {
      const formData = new FormData();
      const blob = await (await fetch(uri)).blob();
      formData.append('image', blob, `image_${index}.jpg`);

      const token = await getAuthToken();
      const aiRes = await fetch(`${API_URL}/ai/analyze`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!aiRes.ok) {
        const errBody = await aiRes.json().catch(() => ({}));
        throw new Error(errBody.message || `Server error (${aiRes.status})`);
      }

      const result = await aiRes.json();
      const isClothing = result.is_clothing === true;
      const isSafe = result.ai_suggestions?.is_safe === true;
      const isValid = isClothing && isSafe;

      setImageValidations(prev => {
        const next = [...prev];
        next[index] = {
          status: isValid ? 'valid' : 'invalid',
          error: !isClothing
            ? 'Not a clothing item'
            : !isSafe
            ? 'Image content not allowed'
            : undefined,
        };
        return next;
      });

      // Auto-fill form fields from the first valid image
      if (isValid && result.ai_suggestions && !autoFilled) {
        const { name, category, description } = result.ai_suggestions;
        setForm(prev => ({
          ...prev,
          name: prev.name || name || '',
          category: category || prev.category,
          description: prev.description || description || '',
        }));
        setAutoFilled(true);
      }
    } catch (err: any) {
      setImageValidations(prev => {
        const next = [...prev];
        next[index] = { status: 'invalid', error: err.message || 'Could not reach AI service' };
        return next;
      });
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const newUris = result.assets.map(a => a.uri);
      const startIndex = images.length;
      setImages(prev => [...prev, ...newUris]);
      newUris.forEach((uri, i) => validateImage(uri, startIndex + i));
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageValidations(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!form.name || images.length === 0) {
      Alert.alert('Error', 'Please add at least one photo and a name for the product.');
      return;
    }
    if (!form.price) {
      Alert.alert('Error', 'Please enter the selling price.');
      return;
    }

    setIsSaving(true);
    try {
      await addClothes({
        ...form,
        images,
        price: form.price ? parseFloat(form.price) : null,
      });
      router.replace('/(tabs)/profile');
    } catch (err: any) {
      Alert.alert('Error saving', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getSaveBtnLabel = () => {
    if (uploadProgress) return `Uploading... ${uploadProgress.current}/${uploadProgress.total}`;
    if (isSaving || loading) return 'Saving...';
    if (images.length === 0) return 'Add an image to continue';
    if (anyValidating) return 'Validating images...';
    if (anyInvalid) return 'Fix invalid images to continue';
    if (!allImagesValid) return 'Validate images to continue';
    if (!form.name) return 'Add an item name to continue';
    if (!form.price) return 'Enter the selling price to continue';
    return 'Save Item';
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
        <Text style={styles.headerTitle}>List an Item</Text>
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

          {/* Validation Status Banner */}
          <View style={[
            styles.statusBanner,
            anyValidating && styles.statusBannerValidating,
            anyInvalid && styles.statusBannerInvalid,
            allImagesValid && styles.statusBannerValid,
          ]}>
            {anyValidating && <ActivityIndicator size="small" color="#5A2D82" style={{ marginRight: 8 }} />}
            {anyInvalid && <AlertCircle size={14} color="#E74C3C" style={{ marginRight: 8 }} />}
            {allImagesValid && <Check size={14} color="#27AE60" strokeWidth={3} style={{ marginRight: 8 }} />}
            <Text style={[
              styles.statusBannerText,
              anyValidating && { color: '#5A2D82' },
              anyInvalid && { color: '#E74C3C' },
              allImagesValid && { color: '#27AE60' },
            ]}>
              {images.length === 0
                ? 'Upload at least one image to continue'
                : anyValidating
                ? 'Analyzing your images...'
                : anyInvalid
                ? 'One or more images are invalid'
                : 'All images validated'}
            </Text>
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

                {/* Validation overlay */}
                {imageValidations[index]?.status === 'validating' && (
                  <View style={styles.imgOverlayValidating}>
                    <ActivityIndicator size="small" color="#FFF" />
                  </View>
                )}
                {imageValidations[index]?.status === 'valid' && (
                  <View style={styles.imgBadgeValid}>
                    <Check size={10} color="#FFF" strokeWidth={3} />
                  </View>
                )}
                {imageValidations[index]?.status === 'invalid' && (
                  <View style={styles.imgOverlayInvalid}>
                    <X size={14} color="#FFF" strokeWidth={3} />
                    <Text style={styles.imgOverlayError} numberOfLines={2}>
                      {imageValidations[index].error || 'Invalid image'}
                    </Text>
                    <TouchableOpacity
                      style={styles.retryBtn}
                      onPress={() => validateImage(images[index], index)}
                    >
                      <Text style={styles.retryBtnText}>RETRY</Text>
                    </TouchableOpacity>
                  </View>
                )}

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

          {/* AI auto-fill notice */}
          {autoFilled && (
            <View style={styles.autoFillNote}>
              <Sparkles size={12} color="#5A2D82" />
              <Text style={styles.autoFillNoteText}>AI-suggested fields — review before saving.</Text>
            </View>
          )}

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
              <Text style={styles.label}>Description</Text>
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

            {/* Price Input */}
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
          </View>

          {/* Upload Progress */}
          {uploadProgress && (
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <ActivityIndicator size="small" color="#5A2D82" />
                <Text style={styles.progressTitle}>Uploading...</Text>
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
            style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canSave}
            activeOpacity={0.8}
          >
            {isSaving || loading || !!uploadProgress ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <ActivityIndicator color="#5A2D82" />
                <Text style={styles.saveBtnText}>{getSaveBtnLabel()}</Text>
              </View>
            ) : (
              <>
                <Text style={styles.saveBtnText}>{getSaveBtnLabel()}</Text>
                {canSave && <Sparkles size={18} color="#5A2D82" strokeWidth={2.5} />}
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
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(43,43,43,0.04)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(43,43,43,0.06)',
  },
  statusBannerValidating: {
    backgroundColor: 'rgba(90,45,130,0.06)',
    borderColor: 'rgba(90,45,130,0.12)',
  },
  statusBannerValid: {
    backgroundColor: 'rgba(39,174,96,0.06)',
    borderColor: 'rgba(39,174,96,0.15)',
  },
  statusBannerInvalid: {
    backgroundColor: 'rgba(231,76,60,0.06)',
    borderColor: 'rgba(231,76,60,0.15)',
  },
  statusBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(43,43,43,0.45)',
  },
  imgOverlayValidating: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26,26,46,0.55)',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imgBadgeValid: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#27AE60',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  imgOverlayInvalid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(231,76,60,0.85)',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 4,
  },
  imgOverlayError: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 13,
  },
  retryBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  retryBtnText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  autoFillNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(90,45,130,0.05)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(90,45,130,0.1)',
  },
  autoFillNoteText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5A2D82',
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
