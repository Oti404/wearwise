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
import { Camera, X, Tag, Ruler, DollarSign, Sparkles, Heart, MapPin, ArrowRightLeft } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useClothes, ClothingItem } from '@/hooks/useClothes';
import { LocationPicker } from '@/components/LocationPicker';
import { useAppStore } from '@/store/useAppStore';

const ResaleScreen = () => {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAppStore();
  const { fetchItemDetails, reList, loading: apiLoading } = useClothes();

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'Tricouri',
    size: 'M',
    condition: 'Nou',
    mode: 'sell' as 'trade' | 'sell' | 'both' | 'donate',
    price: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    address: '',
  });

  const [images, setImages] = useState<string[]>([]);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const loadItem = async () => {
      if (!id) return;
      try {
        const item = await fetchItemDetails(id as string);
        if (!item) throw new Error('Nonexistent item');
        setForm({
          name: item.name,
          description: item.description || '',
          category: item.category,
          size: item.size,
          condition: item.condition,
          mode: item.mode,
          price: item.price ? item.price.toString() : '',
          latitude: user?.latitude || item.latitude,
          longitude: user?.longitude || item.longitude,
          address: user?.latitude ? 'Your location' : '', 
        });
        setImages(item.images || []);
      } catch (err: any) {
        Alert.alert('Error', 'Could not load item details.');
        router.back();
      } finally {
        setIsFetching(false);
      }
    };
    loadItem();
  }, [id]);

  const handleSave = async () => {
    if (!user?.uid || !id) return;
    if (!form.name || !form.mode) {
      Alert.alert('Error', 'Please fill in the name and listing mode.');
      return;
    }

    if ((form.mode === 'sell' || form.mode === 'both') && !form.price) {
      Alert.alert('Error', 'Please enter the selling price.');
      return;
    }

    try {
      const updates = {
        name: form.name,
        description: form.description,
        category: form.category,
        size: form.size,
        condition: form.condition,
        mode: form.mode,
        price: form.price ? parseFloat(form.price) : null,
        latitude: form.latitude,
        longitude: form.longitude,
      };

      await reList(user.uid, id as string, updates);
      
      Alert.alert('Success', 'The item was relisted with new details! ✨', [
        { text: 'Awesome!', onPress: () => router.push('/(tabs)/profile') }
      ]);
    } catch (err: any) {
      Alert.alert('Relist error', err.message);
    }
  };

  if (isFetching) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#5A2D82" />
        <Text style={styles.loadingText}>Loading details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.auraPurple} />
      <View style={styles.auraGold} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <X size={24} color="#2B2B2B" strokeWidth={3} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Relist Product</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Photos Preview (Static for resale usually, unless we want to allow new photos) */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <Text style={styles.sectionCount}>{images.length} Photos</Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll} contentContainerStyle={{ paddingRight: 24 }}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.previewImage} />
                {index === 0 && (
                   <View style={styles.mainPhotoBadge}>
                      <Text style={styles.mainPhotoText}>COVER</Text>
                   </View>
                )}
              </View>
            ))}
          </ScrollView>

          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Item Name</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={form.name}
                  onChangeText={(v) => setForm({ ...form, name: v })}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Description</Text>
              <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  multiline
                  numberOfLines={4}
                  value={form.description}
                  onChangeText={(v) => setForm({ ...form, description: v })}
                />
              </View>
            </View>

            {/* Price Input */}
            <View style={styles.priceGroup}>
              <Text style={styles.label}>Your resale price (RON)</Text>
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

            <View style={styles.divider} />
            
            <View style={styles.infoBox}>
               <Sparkles size={16} color="#F4C542" />
               <Text style={styles.infoText}>
                 Relisting will move the product to your buy list and make it visible to others.
               </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.saveBtn, apiLoading && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={apiLoading}
            activeOpacity={0.8}
          >
            {apiLoading ? (
               <ActivityIndicator color="#5A2D82" />
            ) : (
               <>
                 <Text style={styles.saveBtnText}>Relist Now</Text>
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
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, color: '#5A2D82', fontWeight: '700' },
  auraPurple: { position: 'absolute', top: 0, right: -50, width: 250, height: 250, backgroundColor: 'rgba(142, 68, 173, 0.05)', borderRadius: 125 },
  auraGold: { position: 'absolute', top: '30%', left: -70, width: 280, height: 280, backgroundColor: 'rgba(244, 197, 66, 0.04)', borderRadius: 140 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20, zIndex: 10 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#2B2B2B', letterSpacing: -0.5 },
  backBtn: { width: 44, height: 44, backgroundColor: '#FFF', borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 12, fontWeight: '900', color: '#2B2B2B', textTransform: 'uppercase', letterSpacing: 2 },
  sectionCount: { fontSize: 10, fontWeight: '900', color: 'rgba(90, 45, 130, 0.3)', letterSpacing: 1 },
  imageScroll: { flexDirection: 'row', marginBottom: 32 },
  imageWrapper: { width: 100, height: 140, marginRight: 16, position: 'relative' },
  previewImage: { width: '100%', height: '100%', borderRadius: 28, borderWidth: 2, borderColor: '#FFF' },
  mainPhotoBadge: { position: 'absolute', bottom: 8, left: 8, right: 8, backgroundColor: 'rgba(90, 45, 130, 0.9)', borderRadius: 8, paddingVertical: 4, alignItems: 'center' },
  mainPhotoText: { color: '#F4C542', fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  formCard: { backgroundColor: '#FFF', borderRadius: 32, padding: 24, shadowColor: '#5A2D82', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 2 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 9, fontWeight: '900', color: 'rgba(43, 43, 43, 0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, paddingLeft: 4 },
  inputWrapper: { backgroundColor: '#FAF7F2', borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(90, 45, 130, 0.04)', overflow: 'hidden' },
  input: { paddingHorizontal: 20, paddingVertical: 16, fontSize: 16, fontWeight: '700', color: '#2B2B2B' },
  textAreaWrapper: { minHeight: 100 },
  textArea: { height: 100, textAlignVertical: 'top' },
  priceGroup: { marginTop: 8 },
  priceInputWrapper: { flexDirection: 'row', alignItems: 'center', paddingLeft: 20, backgroundColor: 'rgba(244, 197, 66, 0.05)', borderColor: 'rgba(244, 197, 66, 0.2)' },
  currencySymbol: { fontSize: 12, fontWeight: '900', color: '#F4C542', marginRight: 4 },
  divider: { height: 1.5, backgroundColor: 'rgba(90, 45, 130, 0.05)', marginVertical: 24 },
  infoBox: { flexDirection: 'row', backgroundColor: 'rgba(90, 45, 130, 0.03)', padding: 16, borderRadius: 20, gap: 12, alignItems: 'center' },
  infoText: { flex: 1, fontSize: 12, color: '#5A2D82', fontWeight: '600', lineHeight: 18 },
  saveBtn: { marginTop: 32, height: 70, backgroundColor: '#F4C542', borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, shadowColor: '#F4C542', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 6 },
  saveBtnDisabled: { backgroundColor: 'rgba(244, 197, 66, 0.4)' },
  saveBtnText: { color: '#5A2D82', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});

export default ResaleScreen;
