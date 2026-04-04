import React from 'react';
import { View, StyleSheet } from 'react-native';
import SwipeView from '@/components/SwipeView'; // Importăm componenta creată de tine

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      {/* Randăm componenta principală de swipe */}
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