import { useState } from 'react';
import { supabase } from '@/config/supabase';
import { useAppStore } from '@/store/useAppStore';
import BASE_URL from '@/config/api';

const API_URL = BASE_URL;

const getErrorMessage = (err: any) => {
  // Translate common Supabase Auth errors if needed
  if (err?.message === 'User already registered') return 'This email address is already in use.';
  if (err?.message === 'Invalid login credentials') return 'The email or password entered is incorrect.';
  return err?.message || 'An unexpected error occurred.';
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
      // 1. Create user in Supabase Auth (Client Side)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.parola,
      });
      
      if (authError) throw authError;
      const user = authData.user;
      if (!user) throw new Error('Error creating account.');

      console.log('[useAuth] Calling backend /register...');
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.id, // Supabase Auth UUID
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
      console.log('[useAuth] Backend /register response:', response.status, result);
      
      if (!response.ok) {
        throw new Error(result.error || 'Error registering profile.');
      }

      // 3. Update app store
      loginAppStore(result.userData);
      return result.userData;
    } catch (err: any) {
      console.error('[useAuth] signUp error - message:', err?.message);
      const msg = getErrorMessage(err);
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (identifier: string, parola: string) => {
    console.log('[useAuth] signIn started for:', identifier);
    setLoading(true);
    setError(null);
    try {
      let email = identifier;

      if (!identifier.includes('@')) {
        console.log('[useAuth] Identifier is phone, resolving email...');
        const response = await fetch(`${API_URL}/user/${identifier}`);
        const result = await response.json();
        console.log('[useAuth] Phone resolve response:', response.status);
        if (!response.ok) throw new Error(result.error || 'Phone number not found.');
        email = result.email;
      }

      console.log('[useAuth] Signing in with Supabase Auth...');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: parola,
      });

      if (authError) throw authError;
      const user = authData.user;
      if (!user) throw new Error('Authentication error.');

      console.log('[useAuth] Fetching profile from backend /user/' + user.id);
      const profileResponse = await fetch(`${API_URL}/user/${user.id}`);
      const profileData = await profileResponse.json();
      console.log('[useAuth] Profile response:', profileResponse.status);
      
      if (profileResponse.ok) {
        loginAppStore(profileData);
        return profileData;
      } else {
        throw new Error('User data not found.');
      }
    } catch (err: any) {
      console.error('[useAuth] signIn error - message:', err?.message);
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
