import React from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native'; // Folosim View și Text standard
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Heart, MessageCircle } from 'lucide-react-native';

const NOTIFICATIONS = [
  { id: '1', type: 'like', text: 'Someone liked your shared outfit!', time: '2m ago' },
  { id: '2', type: 'donation', text: 'Your donation request was accepted.', time: '1h ago' },
  { id: '3', type: 'message', text: 'New message from Maria regarding the jacket.', time: '3h ago' },
];

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
      </View>

      <FlatList
        data={NOTIFICATIONS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.notificationCard}>
            <View style={styles.iconContainer}>
              {item.type === 'like' && <Heart size={20} color="#8E44AD" fill="#8E44AD" />}
              {item.type === 'donation' && <Heart size={20} color="#F4C542" />}
              {item.type === 'message' && <MessageCircle size={20} color="#5A2D82" />}
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.notifText}>{item.text}</Text>
              <Text style={styles.timeText}>{item.time}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2B2B2B',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#5A2D82',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(90, 45, 130, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  notifText: {
    fontSize: 14,
    color: '#2B2B2B',
    fontWeight: '500',
  },
  timeText: {
    fontSize: 11,
    color: 'rgba(43, 43, 43, 0.4)',
    marginTop: 4,
  },
});