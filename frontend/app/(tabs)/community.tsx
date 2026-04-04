import React from 'react';
import { View, StyleSheet } from 'react-native';
import CommunityView from '@/components/CommunityView';
import { useAppStore } from '@/store/useAppStore';

export default function CommunityScreen() {
  const isDarkMode = useAppStore((s: any) => s.isDarkMode);

  return (
    <View style={[styles.container, isDarkMode && { backgroundColor: '#1E1E1E' }]}>
      <CommunityView />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
});
