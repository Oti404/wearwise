import '../patch-console';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Platform } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import { API_URL, getAuthToken, clearAuthToken } from '@/config/apiClient';
import { useAppStore } from '@/store/useAppStore';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFonts, Quicksand_400Regular, Quicksand_500Medium, Quicksand_700Bold } from '@expo-google-fonts/quicksand';
import { Mali_400Regular, Mali_500Medium, Mali_600SemiBold, Mali_700Bold } from '@expo-google-fonts/mali';
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { PlayfairDisplay_700Bold, PlayfairDisplay_900Black } from '@expo-google-fonts/playfair-display';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = {
  anchor: '(tabs)',
};

// Loading screen shown while the stored session is verified
function AuthLoadingScreen() {
  return (
    <View style={loadingStyles.container}>
      <Text style={loadingStyles.brand}>
        <Text style={loadingStyles.brandAccent}>W</Text>ear<Text style={loadingStyles.brandAccent}>W</Text>ise
      </Text>
      <ActivityIndicator size="large" color="#5A2D82" style={{ marginTop: 24 }} />
      <Text style={loadingStyles.subtitle}>Checking your session...</Text>
    </View>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: 42,
    fontWeight: '900',
    color: '#2B2B2B',
    letterSpacing: -1.5,
  },
  brandAccent: {
    color: '#8E44AD',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 14,
    color: 'rgba(43, 43, 43, 0.4)',
    fontWeight: '600',
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isLoggedIn, login, logout, _hasHydrated } = useAppStore();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  // Blur the focused element on navigation: avoids the browser's `aria-hidden` focus warning
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl && typeof activeEl.blur === 'function') {
        activeEl.blur();
      }
    }
  }, [segments]);
  // =============================================================

  const [fontsLoaded] = useFonts({
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_700Bold,
    Mali_400Regular,
    Mali_500Medium,
    Mali_600SemiBold,
    Mali_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_900Black,
  });

  const [isLayoutMounted, setIsLayoutMounted] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthLoading) {
        console.warn('[Layout] Safety timeout: forcing loading to false.');
        setIsAuthLoading(false);
      }
    }, 10000); 
    return () => clearTimeout(timer);
  }, [isAuthLoading]);

  useEffect(() => {
    setIsLayoutMounted(true);
  }, []);

  // Restore the session from the stored token. Login/logout afterwards go through useAuth,
  // which updates the store directly, so no auth listener is needed.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const token = await getAuthToken();
      if (!token) {
        logout();
        if (!cancelled) setIsAuthLoading(false);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (response.ok) {
          const { user } = await response.json();
          login(user);
        } else if (response.status === 401) {
          // Expired or revoked token: force a fresh sign-in.
          await clearAuthToken();
          logout();
        }
      } catch {
        // Network error or timeout: keep the persisted profile so the app still opens offline.
        console.warn('[Layout] Could not verify session; using cached profile.');
      } finally {
        clearTimeout(timeoutId);
        if (!cancelled) setIsAuthLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (isAuthLoading || !isLayoutMounted || !navigationState?.key || !_hasHydrated) {
      return;
    }

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';
    
    if (!isLoggedIn && !inAuthGroup) {
      router.replace('/login');
    } else if (isLoggedIn && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isLoggedIn, isAuthLoading, segments, navigationState?.key, isLayoutMounted, _hasHydrated]);

  if (!fontsLoaded) {
    return null;
  }

  if (isAuthLoading || !_hasHydrated) {
    return (
      <SafeAreaProvider>
        <AuthLoadingScreen />
        <StatusBar style="auto" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {Platform.OS === 'web' && (
          <style type="text/css">{`
            html, body, #root {
              height: 100dvh !important;
            }
          `}</style>
        )}
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="add-item" />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal', headerShown: true }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}