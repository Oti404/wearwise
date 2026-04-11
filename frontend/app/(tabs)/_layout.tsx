import { Tabs } from 'expo-router';
import React from 'react';
import { BottomNav } from '@/components/BottomNav'; // Importăm componenta ta

export default function TabLayout() {
  return (
    <Tabs
      // Această linie este cheia: înlocuim bara implicită cu cea creată de tine
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

      {/* 2. Ecranul de Donații */}
      <Tabs.Screen
        name="donations"
        options={{
          title: 'Donations',
        }}
      />

      {/* 3. Ecranul de Activitate/Notificări */}
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