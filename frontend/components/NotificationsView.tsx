import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Heart,
  ArrowRightLeft,
  BellRing,
  CheckCircle2,
  Sparkles,
  Star,
} from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useClothes } from '@/hooks/useClothes';
import { useAppStore } from '@/store/useAppStore';
import { RatingModal } from './RatingModal';

export function NotificationsView() {
  const insets = useSafeAreaInsets();
  const { user, isDarkMode } = useAppStore();
  const dk = isDarkMode;
  const { fetchNotifications, submitRating, loading } = useClothes();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Rating State
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<any>(null);

  const loadNotifications = async () => {
    if (!user?.uid) return;
    const data = await fetchNotifications(user.uid);
    setNotifications(data || []);
  };

  useEffect(() => {
    loadNotifications();
  }, [user?.uid]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = (notif: any) => {
    if (notif.type === 'rating_request' && notif.status === 'pending') {
      setSelectedNotif(notif);
      setRatingModalVisible(true);
    }
  };

  const handleRatingSubmit = async (rating: number, comment: string) => {
    if (!user?.uid || !selectedNotif) return;
    
    try {
      await submitRating({
        raterId: user.uid,
        targetUserId: selectedNotif.sellerId,
        itemId: selectedNotif.itemId,
        rating,
        comment,
        notificationId: selectedNotif.id,
      });
      // Refresh list to show completed status
      await loadNotifications();
    } catch (err) {
      console.error('Rating error:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'trade_offer':
        return <View style={[styles.iconBox, { backgroundColor: 'rgba(142, 68, 173, 0.1)' }]}><ArrowRightLeft size={20} color="#8E44AD" strokeWidth={2.5} /></View>;
      case 'like':
        return <View style={[styles.iconBox, { backgroundColor: 'rgba(244, 197, 66, 0.2)' }]}><Heart size={20} color="#5A2D82" fill="#5A2D82" /></View>;
      case 'buy_success':
      case 'sale_notification':
        return <View style={[styles.iconBox, { backgroundColor: 'rgba(90, 45, 130, 0.1)' }]}><CheckCircle2 size={20} color="#5A2D82" strokeWidth={2.5} /></View>;
      case 'rating_request':
      case 'rating_received':
        return <View style={[styles.iconBox, { backgroundColor: 'rgba(244, 197, 66, 0.2)' }]}><Star size={20} color="#F4C542" fill="#F4C542" /></View>;
      default:
        return <View style={[styles.iconBox, { backgroundColor: 'rgba(43, 43, 43, 0.05)' }]}><BellRing size={20} color="#2B2B2B" /></View>;
    }
  };

  const formatTime = (createdAt: any) => {
    if (!createdAt) return '';
    return 'Recent'; 
  };

  return (
    <View style={[styles.container, dk && { backgroundColor: '#1E1E1E' }]}>
      {/* Premium Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }, dk && { backgroundColor: '#1A1A2E', borderBottomColor: 'rgba(255,255,255,0.05)' }]}>
        <View>
          <View style={styles.headerTag}>
            <Sparkles size={14} color="#F4C542" />
            <Text style={styles.tagText}>Activitate</Text>
          </View>
          <Text style={[styles.title, dk && { color: '#FFFFFF' }]}>Notificări</Text>
        </View>
        <TouchableOpacity 
          style={styles.markReadBtn} 
          activeOpacity={0.7} 
          onPress={loadNotifications}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#5A2D82" />
          ) : (
            <Text style={styles.markReadText}>Reîmprospătează</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Notification List */}
      <ScrollView 
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5A2D82" />
        }
      >
        {notifications.length === 0 && !loading && (
          <View style={styles.emptyContainer}>
             <BellRing size={48} color="rgba(43, 43, 43, 0.1)" />
             <Text style={styles.emptyText}>Nu ai nicio notificare momentan.</Text>
          </View>
        )}

        {notifications.map((notification, i) => (
          <Animated.View 
            key={notification.id}
            entering={FadeInUp.delay(i * 100).springify()}
          >
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => handleNotificationPress(notification)}
              style={[
                styles.card,
                notification.unread
                  ? [styles.unreadCard, dk && { backgroundColor: '#2B2B2B', borderColor: 'rgba(255,255,255,0.06)' }]
                  : [styles.readCard, dk && { backgroundColor: 'rgba(43,43,43,0.4)' }],
                notification.status === 'completed' && { opacity: 0.5 }
              ]}
            >
              {/* Unread Vertical Indicator */}
              {notification.unread && <View style={styles.unreadIndicator} />}

              {/* Icon */}
              <View style={styles.iconContainer}>
                {getNotificationIcon(notification.type)}
              </View>

              {/* Content */}
              <View style={styles.content}>
                <View style={styles.cardHeader}>
                  <Text style={[
                    styles.cardTitle,
                    { fontWeight: notification.unread ? '900' : '700', opacity: notification.unread ? 1 : 0.7 },
                    dk && { color: '#FFFFFF' }
                  ]}>
                    {notification.title}
                  </Text>
                  <Text style={styles.timeText}>{formatTime(notification.createdAt)}</Text>
                </View>
                <Text style={[
                  styles.messageText,
                  { color: dk ? 'rgba(255,255,255,0.75)' : '#2B2B2B', opacity: notification.unread ? 1 : 0.6 }
                ]}>
                  {notification.status === 'completed' ? 'Evaluare trimisă ✅' : notification.message}
                </Text>

                {notification.type === 'rating_request' && notification.status === 'pending' && (
                  <View style={styles.actionPrompt}>
                    <Text style={styles.actionText}>Apasă pentru a evalua</Text>
                  </View>
                )}
              </View>

              {/* Unread Dot */}
              {notification.unread && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          </Animated.View>
        ))}

        {/* End of updates */}
        {notifications.length > 0 && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>Sfârșitul actualizărilor</Text>
          </View>
        )}
      </ScrollView>

      <RatingModal 
        visible={ratingModalVisible}
        onClose={() => setRatingModalVisible(false)}
        onSubmit={handleRatingSubmit}
        itemName={selectedNotif?.message?.match(/'(.*?)'/)?.[1]}
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
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(90, 45, 130, 0.05)',
    zIndex: 2,
    ...Platform.select({
      ios: { shadowColor: '#5A2D82', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 20 },
      android: { elevation: 4 }
    })
  },
  headerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#8E44AD',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2B2B2B',
    letterSpacing: -1,
  },
  markReadBtn: {
    backgroundColor: 'rgba(90, 45, 130, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  markReadText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#5A2D82',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  listPadding: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 120,
  },
  card: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 30,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  unreadCard: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(90, 45, 130, 0.05)',
    ...Platform.select({
      ios: { shadowColor: '#5A2D82', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 25 },
      android: { elevation: 3 }
    })
  },
  readCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'transparent',
    opacity: 0.8,
  },
  unreadIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: '#F4C542',
  },
  iconContainer: {
    marginRight: 16,
    marginTop: 2,
  },
  iconBox: {
    padding: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 14,
    color: '#2B2B2B',
    flex: 1,
    paddingRight: 10,
  },
  timeText: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(43, 43, 43, 0.3)',
    textTransform: 'uppercase',
  },
  messageText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  unreadDot: {
    position: 'absolute',
    right: 16,
    top: '50%',
    width: 10,
    height: 10,
    backgroundColor: '#F4C542',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(43, 43, 43, 0.2)',
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    gap: 16,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(43, 43, 43, 0.4)',
    fontWeight: '600',
  },
  actionPrompt: {
    marginTop: 8,
    backgroundColor: 'rgba(244, 197, 66, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  actionText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#F4C542',
    textTransform: 'uppercase',
  },
});