import { useState } from 'react';
import { supabase } from '@/config/supabase';
import BASE_URL from '@/config/api';

const API_URL = BASE_URL;

export interface PublicUser {
  id: string;
  authUid: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  city?: string;
  followersCount: number;
  followingCount: number;
  salesCount?: number;
  previewImage?: string;
}

export interface PublicProfile extends PublicUser {
  rating?: number;
  reviewCount?: number;
  tradesCount?: number;
  donationsCount?: number;
  items: Array<{
    id: string;
    name: string;
    price: number;
    category: string;
    size: string;
    condition: string;
    mode: string;
    status: string;
    images: string[];
    primaryImage?: string;
    createdAt?: any;
  }>;
}

export const useFollow = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeader = async (): Promise<Record<string, string>> => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const followUser = async (followedUserId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_URL}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ followedUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to follow user.');
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unfollowUser = async (followedUserId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_URL}/follow`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ followedUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to unfollow user.');
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async (targetUserId: string): Promise<boolean> => {
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_URL}/follow-status/${targetUserId}`, { headers: headers as any });
      if (!res.ok) return false;
      const data = await res.json();
      return data.isFollowing ?? false;
    } catch {
      return false;
    }
  };

  const getSuggestedUsers = async (limit = 20): Promise<PublicUser[]> => {
    setLoading(true);
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_URL}/community/suggested?limit=${limit}`, { headers: headers as any });
      if (!res.ok) return [];
      return await res.json();
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query: string): Promise<PublicUser[]> => {
    if (!query.trim()) return [];
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/community/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) return [];
      return await res.json();
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getPublicProfile = async (userId: string): Promise<PublicProfile | null> => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/public-profile/${userId}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getFollowingFeed = async (cursor?: string, limit = 10) => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeader();
      let url = `${API_URL}/following-feed?limit=${limit}`;
      if (cursor) url += `&cursor=${cursor}`;
      const res = await fetch(url, { headers: headers as any });
      if (!res.ok) throw new Error('Failed to load following feed.');
      return await res.json() as { items: any[]; nextCursor: string | null };
    } catch (err: any) {
      setError(err.message);
      return { items: [], nextCursor: null };
    } finally {
      setLoading(false);
    }
  };

  const getFollowers = async (userId: string): Promise<PublicUser[]> => {
    try {
      const res = await fetch(`${API_URL}/followers/${userId}`);
      if (!res.ok) return [];
      return await res.json();
    } catch { return []; }
  };

  const getFollowing = async (userId: string): Promise<PublicUser[]> => {
    try {
      const res = await fetch(`${API_URL}/following/${userId}`);
      if (!res.ok) return [];
      return await res.json();
    } catch { return []; }
  };

  return {
    loading,
    error,
    followUser,
    unfollowUser,
    checkFollowStatus,
    getSuggestedUsers,
    searchUsers,
    getPublicProfile,
    getFollowingFeed,
    getFollowers,
    getFollowing,
  };
};
