import React, { useState } from "react";
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  ActivityIndicator
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { X, Camera, ImagePlus, Type, Tag, AlignLeft, Trash2, Sparkles } from "lucide-react-native";

// Asigură-te că ruta către datele tale este corectă
import { myClosetItems, type ClothingItem } from "@/data/clothes"; 
import BASE_URL from "@/config/api";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddItemModal({ isOpen, onClose }: AddItemModalProps) {
  // ─── FORM STATES ───
  const [isPublishing, setIsPublishing] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'fail' | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Other");
  const [description, setDescription] = useState("");

  const CATEGORIES = ['T-shirts', 'Pants', 'Dresses', 'Outerwear', 'Accessories', 'Footwear', 'Other'];

  // ─── IMAGE UPLOAD HANDLERS ───
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Avem nevoie de permisiunea ta pentru a folosi camera!');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      analyzeImage(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Avem nevoie de permisiunea ta pentru a accesa galeria!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      analyzeImage(result.assets[0].uri);
    }
  };

  // ─── AI ANALYSIS ───
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiWarning, setAiWarning] = useState<string | null>(null);

  const analyzeImage = async (uri: string) => {
    if (!uri) return;
    console.log(`[AI Debug] Starting analysis for URI: ${uri}`);
    setIsAnalyzing(true);
    setVerificationStatus('pending');
    setAiWarning(null);

    try {
      // ─── UNIVERSAL BLOB FETCH ───
      // Works on Web (blob: URIs) and Mobile (file: URIs)
      const responseBlob = await fetch(uri);
      const blob = await responseBlob.blob();

      const formData = new FormData();
      const filename = uri.split('/').pop() || 'photo.jpg';

      console.log(`[AI Debug] Creating FormData - Filename: ${filename}, Blob Size: ${blob.size} bytes`);
      
      formData.append('image', blob, filename);

      console.log(`[AI Debug] Sending request to: ${BASE_URL}/ai/analyze with method POST`);
      const response = await fetch(`${BASE_URL}/ai/analyze`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error(`[AI Debug] Server error: ${response.status}`);
        throw new Error("Backend unavailable");
      }
      
      const result = await response.json();
      console.log(`[AI Debug] Received results:`, JSON.stringify(result, null, 2));
      
      if (result.ai_suggestions) {
        console.log(`[AI Debug] AI Conclusions - Safe: ${result.ai_suggestions.is_safe}, Clothing: ${result.is_clothing}`);
        
        if (!result.ai_suggestions.is_safe || !result.is_clothing) {
          console.warn("[AI Debug] Verification FAILED");
          setAiWarning("AI suggests this item might be inappropriate or not clothing.");
          setVerificationStatus('fail');
        } else {
          console.log("[AI Debug] Verification SUCCESS");
          setVerificationStatus('success');
        }
        
        // Auto-fill
        console.log(`[AI Debug] Auto-completing: Name='${result.ai_suggestions.name}', Category='${result.ai_suggestions.category}'`);
        if (!name.trim()) setName(result.ai_suggestions.name);
        if (!description.trim()) setDescription(result.ai_suggestions.description);
        if (result.ai_suggestions.category) setCategory(result.ai_suggestions.category);
      }
    } catch (err) {
      console.error("[AI Debug] Analysis error:", err);
      setVerificationStatus('fail');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ─── SAVE HANDLER ───
  const handlePublish = () => {
    if (!image || !name) return; 

    if (verificationStatus === 'fail') {
      alert("AI suggests this item is not clothing. Please use a different photo.");
      return;
    }

    setIsPublishing(true);

    const newItem: ClothingItem = {
      id: Math.random().toString(36).substr(2, 9), 
      name: name,
      price: parseFloat(price) || 0,
      image: image,
      category: category, 
      size: "M", 
      seller: "Ambra", 
      distance: 0,
      listing: parseFloat(price) > 0 ? 'buy' : 'trade', 
    };

    // Simulăm un proces de upload/salvare
    setTimeout(() => {
      myClosetItems.unshift(newItem);

      setIsPublishing(false);
      setImage(null);
      setName("");
      setPrice("");
      setDescription("");
      onClose();
    }, 1200);
  };

  const isFormValid = image !== null && name.trim().length > 0 && verificationStatus !== 'fail';

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        
        <View style={styles.modalContent}>
          
          {/* ─── HEADER ─── */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>New in Wardrobe</Text>
              {verificationStatus && (
                <View style={[
                  styles.statusBadge, 
                  verificationStatus === 'success' ? styles.statusBadgeSuccess : 
                  verificationStatus === 'fail' ? styles.statusBadgeFail : styles.statusBadgePending
                ]}>
                  <Text style={styles.statusBadgeText}>
                    {verificationStatus === 'success' ? 'AI Verified' : 
                     verificationStatus === 'fail' ? (image ? 'Check Image' : 'No Image') : 'Scanning...'}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#2B2B2B" opacity={0.4} />
            </TouchableOpacity>
          </View>

          {/* ─── SCROLLABLE FORM CONTENT ─── */}
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
          >
            {/* 1. IMAGE SECTION */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Product Photo *</Text>

              {isAnalyzing && (
                <View style={styles.scanningOverlay}>
                  <ActivityIndicator color="#5A2D82" size="small" />
                  <Text style={styles.scanningText}>AI is scanning your item...</Text>
                </View>
              )}

              {aiWarning && (
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>{aiWarning}</Text>
                </View>
              )}
              
              {image ? (
                <View style={styles.imagePreviewContainer}>
                  <View style={styles.imagePreviewWrapper}>
                    <Image source={{ uri: image }} style={styles.imagePreview} />
                    <TouchableOpacity 
                      style={styles.deleteImageBtn}
                      onPress={() => setImage(null)}
                    >
                      <Trash2 size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  {/* AI VERIFY BUTTON */}
                  <TouchableOpacity 
                    style={[styles.aiVerifyBtn, isAnalyzing && styles.aiVerifyBtnDisabled]} 
                    onPress={() => analyzeImage(image)}
                    disabled={isAnalyzing}
                  >
                    <Sparkles size={16} color="#FFF" />
                    <Text style={styles.aiVerifyBtnText}>Verify with AI ✨</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoButtonsRow}>
                  <TouchableOpacity style={styles.photoBtnCamera} onPress={takePhoto}>
                    <View style={styles.iconWrapperCamera}><Camera size={24} color="#5A2D82" /></View>
                    <Text style={styles.photoBtnTextCamera}>Take Photo</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.photoBtnGallery} onPress={pickImage}>
                    <View style={styles.iconWrapperGallery}><ImagePlus size={24} color="#8E44AD" /></View>
                    <Text style={styles.photoBtnTextGallery}>From Gallery</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* 2. ITEM NAME */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Type size={12} color="rgba(43,43,43,0.4)" />
                <Text style={styles.label}>Item Name *</Text>
              </View>
              <TextInput 
                value={name}
                onChangeText={setName}
                placeholder="e.g. Vintage Leather Jacket"
                placeholderTextColor="#D1D5DB"
                style={styles.textInput}
              />
            </View>

            {/* 2.5 CATEGORY (AI SUGGESTED) */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Tag size={12} color="rgba(43,43,43,0.4)" />
                <Text style={styles.label}>Category</Text>
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
              >
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      category === cat && styles.categoryChipActive
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      category === cat && styles.categoryChipTextActive
                    ]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* 3. PRICE */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Tag size={12} color="rgba(43,43,43,0.4)" />
                <Text style={styles.label}>Asking Price</Text>
              </View>
              <View style={styles.priceInputWrapper}>
                <TextInput 
                  value={price}
                  onChangeText={setPrice}
                  placeholder="0"
                  placeholderTextColor="#D1D5DB"
                  keyboardType="numeric"
                  style={[styles.textInput, styles.priceInput]}
                />
                <View style={styles.currencyBadge}>
                  <Text style={styles.currencyText}>RON</Text>
                </View>
              </View>
              <Text style={styles.helperText}>Leave at 0 for Trade / Donation only.</Text>
            </View>

            {/* 4. DESCRIPTION */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <AlignLeft size={12} color="rgba(43,43,43,0.4)" />
                <Text style={styles.label}>Short Description</Text>
              </View>
              <TextInput 
                value={description}
                onChangeText={setDescription}
                placeholder="Size, condition, or why you are letting it go..."
                placeholderTextColor="#D1D5DB"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={[styles.textInput, styles.textArea]}
              />
            </View>
          </ScrollView>

          {/* ─── FOOTER & SAVE BUTTON ─── */}
          <View style={styles.footer}>
            <TouchableOpacity 
              disabled={!isFormValid || isPublishing}
              onPress={handlePublish}
              style={[
                styles.publishBtn,
                isPublishing && styles.publishBtnActive,
                (!isFormValid && !isPublishing) && styles.publishBtnDisabled
              ]}
            >
              {isPublishing ? (
                <>
                  <Text style={styles.publishBtnTextActive}>Publishing </Text>
                  <ActivityIndicator color="#FFF" size="small" style={{ marginLeft: 8 }} />
                </>
              ) : (
                <Text style={[
                  styles.publishBtnText, 
                  (!isFormValid && !isPublishing) && styles.publishBtnTextDisabled
                ]}>
                  {isAnalyzing ? "AI Scanning..." : verificationStatus === 'fail' ? "Invalid Item" : "Add to Closet"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(43,43,43,0.6)',
  },
  modalContent: {
    backgroundColor: '#FAF7F2',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      }
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(90,45,130,0.05)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#2B2B2B',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeSuccess: {
    backgroundColor: '#E8F5E9',
  },
  statusBadgeFail: {
    backgroundColor: '#FFEBEE',
  },
  statusBadgePending: {
    backgroundColor: '#F3E5F5',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#2B2B2B',
  },
  closeBtn: {
    padding: 10,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  scrollContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: 'rgba(43,43,43,0.4)',
    letterSpacing: 1.5,
  },
  scanningOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(90, 45, 130, 0.05)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  scanningText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5A2D82',
  },
  warningBox: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.2)',
  },
  warningText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E74C3C',
    textAlign: 'center',
  },
  imagePreviewContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  imagePreviewWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    borderWidth: 4,
    borderColor: '#FFF',
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  deleteImageBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 12,
    borderRadius: 20,
  },
  photoButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoBtnCamera: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(90,45,130,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperCamera: {
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  photoBtnTextCamera: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#5A2D82',
  },
  photoBtnGallery: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 24,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(90,45,130,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrapperGallery: {
    padding: 12,
    backgroundColor: 'rgba(142,68,173,0.05)',
    borderRadius: 16,
    marginBottom: 8,
  },
  photoBtnTextGallery: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#8E44AD',
  },
  textInput: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2B2B2B',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(90,45,130,0.1)',
  },
  categoryChipActive: {
    backgroundColor: '#5A2D82',
    borderColor: '#5A2D82',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5A2D82',
  },
  categoryChipTextActive: {
    color: '#FFF',
  },
  priceInputWrapper: {
    justifyContent: 'center',
  },
  priceInput: {
    fontSize: 18,
    color: '#5A2D82',
    fontWeight: '900',
    paddingRight: 60,
  },
  currencyBadge: {
    position: 'absolute',
    right: 16,
    backgroundColor: 'rgba(244,197,66,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currencyText: {
    color: '#5A2D82',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  helperText: {
    fontSize: 9,
    fontWeight: '500',
    color: 'rgba(43,43,43,0.4)',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  textArea: {
    height: 100,
    fontWeight: '500',
  },
  footer: {
    padding: 24,
    paddingTop: 16,
    backgroundColor: '#FAF7F2',
    borderTopWidth: 1,
    borderTopColor: 'rgba(90,45,130,0.05)',
  },
  publishBtn: {
    backgroundColor: '#5A2D82',
    paddingVertical: 20,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#5A2D82',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  aiVerifyBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#5A2D82',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#5A2D82',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  aiVerifyBtnDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.1,
  },
  aiVerifyBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  publishBtnActive: {
    backgroundColor: '#10b981',
  },
  publishBtnDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  publishBtnText: {
    color: '#F4C542',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  publishBtnTextActive: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  publishBtnTextDisabled: {
    color: '#9CA3AF',
  }
});