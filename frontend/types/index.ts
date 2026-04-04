/**
 * types/index.ts
 * Global interface and type definitions for the WearWise app.
 */

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
}

export interface ClothingItem {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  verified: boolean;
  score?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: any;
}
