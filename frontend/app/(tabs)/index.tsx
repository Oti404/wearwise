import React from 'react';
import { View, StyleSheet } from 'react-native';
import SwipeView from '@/components/SwipeView';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      {/* Main swipe feed */}
      <SwipeView />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
});