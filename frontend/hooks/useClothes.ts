import { useState } from 'react';
import { Platform } from 'react-native';
import { useAppStore } from '@/store/useAppStore';
import { supabase } from '@/config/supabase';

import BASE_URL from '@/config/api';

const API_URL = BASE_URL;

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
 * Works universally on Web and Expo Go (Android/iOS).
 */
const uploadSingleImage = async (
  localUri: string,
  userId: string,
  index: number
): Promise<string> => {
  const timestamp = Date.now();
  const path = `${userId}/${timestamp}_${index}.jpg`;
  console.log(`[useClothes] Uploading image ${index + 1} to Supabase storage at: clothes/${path}`);

  const response = await fetch(localUri);
  const blob = await response.blob();
  
  const { data, error } = await supabase
    .storage
    .from('clothes')
    .upload(path, blob, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw error;
  }
  
  const { data: publicUrlData } = supabase
    .storage
    .from('clothes')
    .getPublicUrl(path);

  console.log(`[useClothes] Image ${index + 1} uploaded:`, publicUrlData.publicUrl);
  return publicUrlData.publicUrl;
};

/**
 * Calculates distance between two points (lat/lng) in km using Haversine formula.
 */
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Earth radius in km
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
  const refreshClothes = useAppStore((state) => state.refreshClothes);

  /**
   * Uploads multiple local image URIs to Firebase Storage.
   * Returns array of public download URLs.
   */
  const uploadImages = async (localUris: string[], userId: string): Promise<string[]> => {
    const downloadUrls: string[] = [];
    const progress = { current: 0, total: localUris.length };
    setUploadProgress(progress);
    setGlobalUploadProgress(progress);

    for (let i = 0; i < localUris.length; i++) {
      const uri = localUris[i];
      // Skip if it's already a remote URL (not a local file)
      if (uri.startsWith('http://') || uri.startsWith('https://')) {
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
      // Step 1: Upload images to Firebase Storage
      console.log('[useClothes] Starting image upload. Count:', data.images.length);
      const imageUrls = await uploadImages(data.images, user.uid);
      console.log('[useClothes] All images uploaded. URLs:', imageUrls);

      // Step 2: Save item to backend/Firestore with real download URLs
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const response = await fetch(`${API_URL}/clothes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user.uid,
          ...data,
          images: imageUrls, // Always use the uploaded URLs
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error saving clothing item.');

      console.log('[useClothes] Clothing item saved successfully:', result.id);
      
      // Trigger global refresh for observers (Profile, Explore feed)
      refreshClothes();
      
      return result;
    } catch (err: any) {
      console.error('[useClothes] addClothes error:', err?.message);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
      setAddingItem(false);
      setUploadProgress(null);
      setGlobalUploadProgress(null);
    }
  };

  const fetchExploreFeed = async (cursor?: string, limit?: number) => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_URL}/clothes?excludeUser=${user?.uid || ''}`;
      if (cursor) url += `&cursor=${cursor}`;
      if (limit) url += `&limit=${limit}`;

      const response = await fetch(url);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error loading feed.');
      
      // result is now { items: ClothingItem[], nextCursor: string | null }
      let clothes = result.items as ClothingItem[];
      const nextCursor = result.nextCursor as string | null;

      // Calculate distances if user has location set
      if (user?.latitude && user?.longitude) {
        clothes = clothes.map(item => {
          if (item.latitude && item.longitude) {
            return {
              ...item,
              distance: calculateDistance(user.latitude!, user.longitude!, item.latitude, item.longitude)
            };
          }
          return item;
        });
      }

      return { items: clothes, nextCursor };
    } catch (err: any) {
      setError(err.message);
      return { items: [], nextCursor: null };
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
      const url = `${API_URL}/clothes/${id}`;
      console.log(`[useClothes] Fetching item details from: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Could not download clothing details.');
      }
      
      const item: ClothingItem = await response.json();
      return item;
    } catch (err: any) {
      console.error('Fetch item details error:', err);
      setError(err.message || 'An unknown error occurred.');
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
      if (!response.ok) throw new Error(result.error || 'Error processing the order.');
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
      if (!response.ok) throw new Error(result.error || 'Error re-listing the item.');
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

  const submitRating = async (ratingData: {
    raterId: string;
    targetUserId: string;
    itemId?: string;
    rating: number;
    comment?: string;
    notificationId?: string;
  }) => {
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

  const markAsSold = async (itemId: string) => {
    if (!user) throw new Error('Not authenticated.');
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const response = await fetch(`${API_URL}/clothes/${itemId}/sold`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not mark as sold.');
      refreshClothes();
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
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
    markAsSold,
  };
};