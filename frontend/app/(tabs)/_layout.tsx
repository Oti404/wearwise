import { Tabs } from 'expo-router';
import React from 'react';
import { BottomNav } from '@/components/BottomNav';

export default function TabLayout() {
  return (
    <Tabs
      // Replace the default tab bar with the custom bottom navigation
      tabBar={(props) => <BottomNav {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      
      {/* 1. Ecranul principal (Swipe) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Swipe',
        }}
      />

      {/* 2. Ecranul de Network */}
      <Tabs.Screen
        name="network"
        options={{
          title: 'Network',
        }}
      />

      {/* 3. Activity / notifications screen */}
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Activity',
        }}
      />

      {/* 5. Profil */}

      {/* 5. Ecranul de Profil */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}