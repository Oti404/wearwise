import { useState } from 'react';
import { API_URL, setAuthToken, clearAuthToken, errorMessage } from '@/config/apiClient';
import { useAppStore } from '@/store/useAppStore';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loginAppStore = useAppStore((state) => state.login);
  const logoutAppStore = useAppStore((state) => state.logout);

  /** Stores the session returned by /auth/register or /auth/login. */
  const startSession = async (response: Response, fallback: string) => {
    const result = await response.json();
    if (!response.ok) throw new Error(errorMessage(result, fallback));
    await setAuthToken(result.token);
    loginAppStore(result.user);
    return result.user;
  };

  const run = async <T,>(action: () => Promise<T>): Promise<T> => {
    setLoading(true);
    setError(null);
    try {
      return await action();
    } catch (err: any) {
      const msg = err?.message || 'An unexpected error occurred.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const signUp = (data: {
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
  }) => run(async () => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        password: data.parola,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        city: data.localitate,
      }),
    });
    return startSession(response, 'Could not create your account.');
  });

  // identifier: email address or phone number; the backend resolves either.
  const signIn = (identifier: string, parola: string) => run(async () => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password: parola }),
    });
    return startSession(response, 'Invalid email, phone number or password.');
  });

  const signOut = async () => {
    await clearAuthToken();
    logoutAppStore();
  };

  return { signUp, signIn, signOut, loading, error };
};
