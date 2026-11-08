import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { API_URL, authHeaders, errorMessage } from '@/config/apiClient';

export const useFollow = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useAppStore((state) => state.user);

  const getAuthHeader = authHeaders;

  const followUser = async (followedUserId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/follows/follow`, {
        method: 'POST',
        headers: await getAuthHeader(),
        body: JSON.stringify({ followedUserId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(errorMessage(result, 'Request failed.'));
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const unfollowUser = async (followedUserId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/follows/follow`, {
        method: 'DELETE',
        headers: await getAuthHeader(),
        body: JSON.stringify({ followedUserId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(errorMessage(result, 'Request failed.'));
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async (targetUserId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/follows/follow-status/${targetUserId}`, {
        headers: await getAuthHeader()
      });
      const result = await response.json();
      if (!response.ok) throw new Error(errorMessage(result, 'Request failed.'));
      return result.isFollowing;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowingFeed = async (cursor?: string) => {
    setLoading(true);
    try {
      const query = cursor ? `?cursor=${cursor}` : '';
      const response = await fetch(`${API_URL}/follows/following-feed${query}`, {
        headers: await getAuthHeader()
      });
      const result = await response.json();
      if (!response.ok) throw new Error(errorMessage(result, 'Request failed.'));
      return result;
    } catch (err: any) {
      setError(err.message);
      return { items: [], nextCursor: null };
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestedUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/follows/community/suggested`, {
        headers: await getAuthHeader()
      });
      const result = await response.json();
      if (!response.ok) throw new Error(errorMessage(result, 'Request failed.'));
      return result;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const searchNetworkUsers = async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/follows/community/search?q=${encodeURIComponent(query)}`, {
        headers: await getAuthHeader()
      });
      const result = await response.json();
      if (!response.ok) throw new Error(errorMessage(result, 'Request failed.'));
      return result;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicProfile = async (userId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/follows/public-profile/${userId}`);
      const result = await response.json();
      if (!response.ok) throw new Error(errorMessage(result, 'Request failed.'));
      return result;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    followUser,
    unfollowUser,
    checkFollowStatus,
    fetchFollowingFeed,
    fetchSuggestedUsers,
    searchNetworkUsers,
    fetchPublicProfile,
  };
};
