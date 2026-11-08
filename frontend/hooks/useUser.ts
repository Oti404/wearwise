import { useState } from 'react';
import { API_URL, authHeaders, errorMessage, uploadImage } from '@/config/apiClient';
import { useAppStore } from '@/store/useAppStore';

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

  const updateProfile = async (uid: string, updates: Partial<User>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/user/${uid}`, {
        method: 'PATCH',
        headers: await authHeaders(),
        body: JSON.stringify(updates),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(errorMessage(result, 'Could not update your profile.'));

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
      const downloadUrl = await uploadImage(localUri);
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