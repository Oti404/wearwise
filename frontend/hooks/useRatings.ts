import { useState, useCallback } from 'react';
import BASE_URL from '@/config/api';

export interface Rating {
  id: string;
  raterId: string;
  targetUserId: string;
  itemId?: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export const useRatings = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRatings = useCallback(async (userId: string): Promise<Rating[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/user-ratings/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch ratings');
      }
      const data = await response.json();
      return data;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const submitRating = async (ratingData: {
    raterId: string;
    targetUserId: string;
    itemId?: string;
    rating: number;
    comment: string;
    notificationId?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ratingData),
      });
      if (!response.ok) {
        throw new Error('Failed to submit rating');
      }
      return await response.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchUserRatings,
    submitRating,
    loading,
    error,
  };
};
