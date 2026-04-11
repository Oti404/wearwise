import { useState } from 'react';
import { supabase } from '@/config/supabaseClient';
import { useAppStore } from '@/store/useAppStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const getErrorMessage = (err: any) => {
  if (err.message && err.message.includes('invalid-credential')) {
    return 'Credentiale invalide.';
  }
  return err.message || 'A apărut o eroare neașteptată.';
};

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loginAppStore = useAppStore((state) => state.login);
  const logoutAppStore = useAppStore((state) => state.logout);

  const signUp = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    parola: string;
    tara: string;
    localitate: string;
    adresa: string;
    phone: string;
    latitude?: number;
    longitude?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.parola,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
          }
        }
      });

      if (authError) throw authError;
      const user = authData.user;
      if (!user) throw new Error('Error creating account.');

      console.log('[useAuth] Calling backend /register...');
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          country: data.tara,
          city: data.localitate,
          address: data.adresa,
          latitude: data.latitude,
          longitude: data.longitude,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error registering profile.');

      loginAppStore(result.userData);
      return result.userData;
    } catch (err: any) {
      const msg = getErrorMessage(err);
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (identifier: string, parola: string) => {
    setLoading(true);
    setError(null);
    try {
      let email = identifier;

      if (!identifier.includes('@')) {
        const response = await fetch(`${API_URL}/user/${identifier}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Phone number not found.');
        email = result.email;
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: parola,
      });

      if (authError) throw authError;

      const profileResponse = await fetch(`${API_URL}/user/${data.user.id}`);
      const profileData = await profileResponse.json();
      
      if (profileResponse.ok) {
        loginAppStore(profileData);
        return profileData;
      } else {
        throw new Error('User data not found.');
      }
    } catch (err: any) {
      const msg = getErrorMessage(err);
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      logoutAppStore();
    } catch (err: any) {
      setError(getErrorMessage(err));
    }
  };

  return { signUp, signIn, signOut, loading, error };
};

