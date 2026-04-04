import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Folosește URL-ul și API Key-ul din procesul tău backend sau direct.
// TODO: Replace with environment variables or hardcoded dev variables.
const supabaseUrl = 'https://lswpaueetyseadjpxoyi.supabase.co';
const supabaseAnonKey = 'sb_publishable_hxSiIMk4apgQCAUKcSaU4g_KjMbgfP6';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
