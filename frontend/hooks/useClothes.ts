import { useState } from 'react';
import { Platform } from 'react-native';
import { useAppStore } from '@/store/useAppStore';
import { supabase } from '@/config/supabaseClient';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://wearwise-api.onrender.com';

export interface ClothingItem {
  id?: string;
  userId: string;
  name: string;
  description: string;
  images: string[];
  category: string;
  size: string;
  condition: string;
  mode: 'trade' | 'sell' | 'both' | 'donate';
  price: number | null;
  status: 'active' | 'hidden' | 'sold' | 'deleted';
  buyerId?: string;
  createdAt?: any;
  distance?: number;
  latitude?: number;
  longitude?: number;
  owner?: {
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}

/**
 * Uploads a single local image URI to Supabase Storage.
 */
const uploadSingleImage = async (
  localUri: string,
  userId: string,
  index: number
): Promise<string> => {
  const timestamp = Date.now();
  const fileName = `${timestamp}_${index}.jpg`;
  const filePath = `${userId}/${fileName}`;
  
  console.log(`[useClothes] Uploading image to Supabase at: clothes/${filePath}`);

  const response = await fetch(localUri);
  const blob = await response.blob();
  
  const { data, error } = await supabase.storage
    .from('clothes')
    .upload(filePath, blob, {
      contentType: 'image/jpeg',
      upsert: true
    });
    
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('clothes')
    .getPublicUrl(filePath);
    
  return publicUrl;
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const useClothes = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const user = useAppStore((state) => state.user);
  const setAddingItem = useAppStore((state) => state.setAddingItem);
  const setGlobalUploadProgress = useAppStore((state) => state.setUploadProgress);

  const uploadImages = async (localUris: string[], userId: string): Promise<string[]> => {
    const downloadUrls: string[] = [];
    const progress = { current: 0, total: localUris.length };
    setUploadProgress(progress);
    setGlobalUploadProgress(progress);

    for (let i = 0; i < localUris.length; i++) {
      const uri = localUris[i];
      if (uri.startsWith('http')) {
        downloadUrls.push(uri);
      } else {
        const url = await uploadSingleImage(uri, userId, i);
        downloadUrls.push(url);
      }
      const newProgress = { current: i + 1, total: localUris.length };
      setUploadProgress(newProgress);
      setGlobalUploadProgress(newProgress);
    }

    setUploadProgress(null);
    setGlobalUploadProgress(null);
    return downloadUrls;
  };

  const addClothes = async (data: Omit<ClothingItem, 'id' | 'userId' | 'status' | 'createdAt'>) => {
    if (!user) {
      setError('You must be logged in to add clothes.');
      return null;
    }

    setLoading(true);
    setAddingItem(true);
    setError(null);
    try {
      const imageUrls = await uploadImages(data.images, user.uid);
      const response = await fetch(`${API_URL}/clothes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          ...data,
          images: imageUrls,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error saving clothing item.');
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
      setAddingItem(false);
    }
  };

  const fetchExploreFeed = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/clothes?excludeUser=${user?.uid || ''}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error loading feed.');
      
      let clothes = result.items || []; // Backend returns { items, nextCursor }

      if (user?.latitude && user?.longitude) {
        clothes = clothes.map((item: any) => {
          if (item.latitude && item.longitude) {
            return {
              ...item,
              distance: calculateDistance(user.latitude!, user.longitude!, item.latitude, item.longitude)
            };
          }
          return item;
        });
      }

      return clothes;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCloset = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/user-closet/${userId}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error loading wardrobe.');
      return result as ClothingItem[];
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchItemDetails = async (id: string): Promise<ClothingItem | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/clothes/${id}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const checkout = async (userId: string, items: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, items }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reList = async (userId: string, itemId: string, updates?: Partial<ClothingItem>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/re-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, itemId, updates }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async (userId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/notifications/${userId}`);
      if (!response.ok) throw new Error('Could not load notifications.');
      return await response.json();
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const submitRating = async (ratingData: any) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ratingData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRatings = async (userId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/user-ratings/${userId}`);
      if (!response.ok) throw new Error('Could not load ratings.');
      return await response.json();
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    uploadProgress,
    addClothes,
    fetchExploreFeed,
    fetchUserCloset,
    fetchItemDetails,
    checkout,
    reList,
    fetchNotifications,
    submitRating,
    fetchUserRatings,
  };
};