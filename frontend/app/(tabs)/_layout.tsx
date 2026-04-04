import { Tabs } from 'expo-router';
import React from 'react';
import { BottomNav } from '@/components/BottomNav';

export default function TabLayout() {
  return (
    <Tabs
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

      {/* 2. Community Feed */}
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
        }}
      />

      {/* 3. Ecranul de Activitate/Notificări */}
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Activity',
        }}
      />

      {/* 4. Ecranul de Profil */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
