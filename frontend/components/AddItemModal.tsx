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
import { X, Camera, ImagePlus, Type, Tag, AlignLeft, Trash2 } from "lucide-react-native";

// Asigură-te că ruta către datele tale este corectă
import { myClosetItems, type ClothingItem } from "@/data/clothes"; 

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddItemModal({ isOpen, onClose }: AddItemModalProps) {
  // ─── FORM STATES ───
  const [isPublishing, setIsPublishing] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

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
    }
  };

  // ─── SAVE HANDLER ───
  const handlePublish = () => {
    if (!image || !name) return; 

    setIsPublishing(true);

    const newItem: ClothingItem = {
      id: Math.random().toString(36).substr(2, 9), 
      name: name,
      price: parseFloat(price) || 0,
      image: image,
      category: "Newly Added", 
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

  const isFormValid = image !== null && name.trim().length > 0;

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
            <Text style={styles.headerTitle}>New Item</Text>
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
              
              {image ? (
                <View style={styles.imagePreviewWrapper}>
                  <Image source={{ uri: image }} style={styles.imagePreview} />
                  <TouchableOpacity 
                    style={styles.deleteImageBtn}
                    onPress={() => setImage(null)}
                  >
                    <Trash2 size={20} color="#EF4444" />
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
                  Add to Closet
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
  imagePreviewWrapper: {
    width: '100%',
    aspectRatio: 1,
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