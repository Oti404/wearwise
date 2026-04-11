import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Link, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserCircle, Layers, HeartHandshake } from 'lucide-react-native';
import { useAppStore } from '@/store/useAppStore';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

export function BottomNav({ state, descriptors, navigation }: BottomTabBarProps) {
  const setView = useAppStore((s: any) => s.setView);
  const isDarkMode = useAppStore((s: any) => s.isDarkMode);
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const dk = isDarkMode;
  const inactiveColor = dk ? 'rgba(255,255,255,0.35)' : 'rgba(43,43,43,0.4)';
  const activeColor   = dk ? '#C084FC' : '#5A2D82';

  const checkIsActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.includes(path)) return true;
    return false;
  };

  return (
    <View style={[
      styles.container,
      { paddingBottom: Math.max(insets.bottom, 10) },
      dk && { backgroundColor: '#252525' },
    ]}>
      <View style={styles.navRow}>

        {/* Donations */}
        <Link href="./donations" asChild>
          <TouchableOpacity style={styles.navItem}>
            <HeartHandshake
              size={22}
              color={checkIsActive('donations') ? activeColor : inactiveColor}
              strokeWidth={checkIsActive('donations') ? 2.5 : 2}
            />
            <Text style={[styles.navText, { color: checkIsActive('donations') ? activeColor : inactiveColor }]}>
              Donations
            </Text>
          </TouchableOpacity>
        </Link>

        {/* Swipe (center) */}
        <Link href="/" asChild onPress={() => setView('swipe')}>
          <TouchableOpacity style={styles.centerItem} activeOpacity={0.9}>
            <View style={[
              styles.centerCircle,
              checkIsActive('/') ? styles.centerCircleActive : styles.centerCircleInactive,
              dk && { borderColor: '#252525' },
            ]}>
              <Layers
                size={26}
                color={checkIsActive('/') ? '#F4C542' : '#FAF7F2'}
                strokeWidth={checkIsActive('/') ? 2.5 : 2}
              />
            </View>
            <Text style={[styles.centerText, { color: checkIsActive('/') ? activeColor : inactiveColor }]}>
              Swipe
            </Text>
          </TouchableOpacity>
        </Link>

        {/* Profile */}
        <Link href="./profile" asChild>
          <TouchableOpacity style={styles.navItem}>
            <UserCircle
              size={22}
              color={checkIsActive('profile') ? activeColor : inactiveColor}
              strokeWidth={checkIsActive('profile') ? 2.5 : 2}
            />
            <Text style={[styles.navText, { color: checkIsActive('profile') ? activeColor : inactiveColor }]}>
              Profile
            </Text>
          </TouchableOpacity>
        </Link>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignSelf: 'center',
    maxWidth: 448,
    backgroundColor: '#FAF7F2',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Platform.select({
      web: { boxShadow: '0px -10px 20px rgba(90,45,130,0.1)' } as any,
      default: { shadowColor: '#5A2D82', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 20 },
    }),
    zIndex: 50,
  },
  navRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 80, gap: 48 },
  navItem: { width: 64, alignItems: 'center', justifyContent: 'center', gap: 4 },
  navText: { fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  centerItem: { width: 80, alignItems: 'center', justifyContent: 'flex-start', top: -24 },
  centerCircle: {
    width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center',
    borderWidth: 5, borderColor: '#FAF7F2',
    ...Platform.select({
      web: { boxShadow: '0px 8px 10px rgba(90,45,130,0.25)' } as any,
      default: { shadowColor: '#5A2D82', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 10 },
    }),
  },
  centerCircleActive: { backgroundColor: '#5A2D82' },
  centerCircleInactive: { backgroundColor: '#8E44AD' },
  centerText: { position: 'absolute', bottom: -16, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 },
});