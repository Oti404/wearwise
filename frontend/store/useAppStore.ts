import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Definim structura unui obiect din coș
interface CartItem {
  id: string | number;
  name: string;
  price: number;
  image: string;
  seller: string;
  size: string;
  distance: number;
}

interface User {
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
  rating?: number;
  reviewCount?: number;
  tradesCount?: number;
  donationsCount?: number;
  salesCount?: number;
}

interface AppState {
  // Navigare
  view: 'swipe' | 'profile' | 'notifications' | 'donations' | 'cart';
  setView: (view: 'swipe' | 'profile' | 'notifications' | 'donations' | 'cart') => void;
  
  // Autentificare
  isLoggedIn: boolean;
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;

  // Coș de cumpărături
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string | number) => void;
  clearCart: () => void;

  // Filtrare și Radius
  radius: number;
  setRadius: (value: number) => void;
  skipped: (string | number)[];
  skipItem: (id: string | number) => void;
  resetFilters: () => void;
  
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  // Background Addition
  addingItem: boolean;
  uploadProgress: { current: number; total: number } | null;
  setAddingItem: (state: boolean) => void;
  setUploadProgress: (progress: { current: number; total: number } | null) => void;

  // Dark Mode
  isDarkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Valori inițiale
      view: 'swipe',
      isLoggedIn: false,
      user: null,
      cart: [],
      radius: 5,
      skipped: [],

      // Acțiuni Navigare
      setView: (view) => set({ view }),

      // Acțiuni Autentificare
      login: (userData) => set({ isLoggedIn: true, user: userData }),
      logout: () => set({ isLoggedIn: false, user: null }),

      // Acțiuni Coș
      addToCart: (item) => set((state) => ({ 
        cart: [...state.cart, item] 
      })),

      removeFromCart: (id) => set((state) => ({ 
        cart: state.cart.filter((item) => String(item.id) !== String(id)) 
      })),

      clearCart: () => set({ cart: [] }),

      // Acțiuni Radius și Skip (Filtrare)
      setRadius: (value) => set({ radius: value }),

      skipItem: (id) => set((state) => ({ 
        skipped: [...state.skipped, id] 
      })),

      resetFilters: () => set({ 
        skipped: [], 
        radius: 5 
      }),
      
      // Hydration tracking
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      // Background Addition
      addingItem: false,
      uploadProgress: null,
      setAddingItem: (state) => set({ addingItem: state }),
      setUploadProgress: (progress) => set({ uploadProgress: progress }),

      // Dark Mode
      isDarkMode: false,
      setDarkMode: (val) => set({ isDarkMode: val }),
    }),
    {
      name: 'wearwise-storage',
      storage: createJSONStorage(() => 
        typeof window !== 'undefined' ? AsyncStorage : {
          getItem: async () => null,
          setItem: async () => {},
          removeItem: async () => {},
        }
      ),
      onRehydrateStorage: (state) => {
        return () => state?.setHasHydrated(true);
      },
      partialize: (state) => ({ 
        cart: state.cart,
        user: state.user,
        isLoggedIn: state.isLoggedIn,
        radius: state.radius,
        skipped: state.skipped,
        isDarkMode: state.isDarkMode,
      }),
    }
  )
);