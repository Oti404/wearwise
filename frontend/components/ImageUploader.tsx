import React, { useState } from 'react';
import { View, Button, Image, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';

export default function ImageUploader() {
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const selectAndUploadImage = async () => {
    try {
      // 1. Selectăm imaginea din telefon
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 1,
      });

      if (result.didCancel || !result.assets || result.assets.length === 0) {
        return;
      }

      const originalUri = result.assets[0].uri;
      if (!originalUri) return;

      setImageUri(originalUri);
      setLoading(true);

      // 2. REDIMENSIONARE (Esențial pentru a menține costurile zero la 100k poze)
      // Reducem la max 800x800, calitate 80%, format JPEG
      const resizedImage = await ImageResizer.createResizedImage(
        originalUri,
        800,
        800,
        'JPEG',
        80
      );

      // 3. Generăm un nume unic pentru fișier
      const fileName = `wearwise_${Date.now()}.jpg`;
      const storageRef = storage().ref(`outfits/${fileName}`);

      // 4. Upload către Firebase Storage
      await storageRef.putFile(resizedImage.uri);

      // 5. Obținem link-ul public (Download URL)
      const downloadUrl = await storageRef.getDownloadURL();

      // 6. Salvăm link-ul în Firestore
      await firestore().collection('photos').add({
        name: fileName,
        imageUrl: downloadUrl,
        createdAt: firestore.FieldValue.serverTimestamp(),
        category: 'general'
      });

      Alert.alert('Succes!', 'Imaginea a fost optimizată și urcată cu succes.');
    } catch (error) {
      console.error('Eroare la upload:', error);
      Alert.alert('Eroare', 'Nu am putut urca imaginea.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>WearWise Upload Test</Text>
      
      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.preview} />
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button title="Alege și Urcă Poză" onPress={selectAndUploadImage} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  preview: {
    width: 200,
    height: 200,
    marginBottom: 20,
    borderRadius: 10,
    resizeMode: 'cover',
  },
});