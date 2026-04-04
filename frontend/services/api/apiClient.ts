import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { CONSTANTS } from '../../constants';

/**
 * apiClient.ts
 * Centralized API client using Axios.
 * Handles base URL, auth tokens, and error interceptors.
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.initializeInterceptors();
  }

  private initializeInterceptors() {
    // Request Interceptor (e.g., adding Auth Token)
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // You can fetch the token from AsyncStorage/Store here
        // const token = await AsyncStorage.getItem('auth_token');
        // if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response Interceptor (Global error handling)
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response.data,
      (error: AxiosError) => {
        // Log error to monitoring service (Sentry, etc.)
        console.error('[API Error]:', error.response?.status, error.message);
        
        // Handle global error states (e.g. 401 Unauthorized)
        if (error.response?.status === 401) {
          // Redirect to login or refresh token
        }

        return Promise.reject(error.response?.data || error.message);
      }
    );
  }

  public get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance.get(url, config);
  }

  public post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance.post(url, data, config);
  }

  public put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance.put(url, data, config);
  }

  public delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance.delete(url, config);
  }
}

export const api = new ApiClient();
