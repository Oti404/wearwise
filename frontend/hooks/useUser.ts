import { useState } from 'react';
import { supabase } from '@/config/supabaseClient';
import { useAppStore } from '@/store/useAppStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export interface User {
  uid: string;
  email: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  avatarUrl?: string;
  latitude?: number;
  longitude?: number;
}

export const useUser = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const login = useAppStore((state) => state.login);

  /**
   * Uploads a single local image URI to Supabase Storage for the profile avatar.
   */
  const uploadAvatarImage = async (localUri: string, userId: string): Promise<string> => {
    const timestamp = Date.now();
    const fileName = `avatar_${timestamp}.jpg`;
    const filePath = `${userId}/${fileName}`;
    
    console.log(`[useUser] Uploading avatar to Supabase at: avatars/${filePath}`);

    try {
      const response = await fetch(localUri);
      const blob = await response.blob();
      
      const { data, error: storageError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });
        
      if (storageError) throw storageError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      return publicUrl;
    } catch (err: any) {
      console.error('[useUser] uploadAvatarImage error:', err.message);
      throw err;
    }
  };

  const updateProfile = async (uid: string, updates: Partial<User>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/user/${uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Eroare la actualizarea profilului.');

      login(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const changeAvatar = async (uid: string, localUri: string) => {
    setLoading(true);
    setError(null);
    try {
      const downloadUrl = await uploadAvatarImage(localUri, uid);
      return await updateProfile(uid, { avatarUrl: downloadUrl });
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
    updateProfile,
    changeAvatar,
  };
};