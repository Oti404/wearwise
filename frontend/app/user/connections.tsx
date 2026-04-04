import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, UserPlus, Check, Users } from 'lucide-react-native';
import { useAppStore } from '@/store/useAppStore';
import { useFollow, PublicUser } from '@/hooks/useFollow';

export default function ConnectionsScreen() {
  const { userId, type } = useLocalSearchParams<{ userId: string; type: 'followers' | 'following' }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDarkMode, user: currentUser } = useAppStore();
  const dk = isDarkMode;

  const { getFollowers, getFollowing, followUser, unfollowUser, loading } = useFollow();
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!userId) return;
    loadUsers();
  }, [userId, type]);

  const loadUsers = async () => {
    if (!userId) return;
    const data = type === 'followers'
      ? await getFollowers(userId as string)
      : await getFollowing(userId as string);
    setUsers(data);
  };

  const handleFollowToggle = async (targetId: string) => {
    const currently = followingMap[targetId];
    setFollowingMap(prev => ({ ...prev, [targetId]: !currently }));
    if (currently) {
      await unfollowUser(targetId);
    } else {
      await followUser(targetId);
    }
  };

  const title = type === 'followers' ? 'Followers' : 'Following';

  const renderUser = ({ item }: { item: PublicUser }) => {
    const displayName = `${item.firstName || ''}${item.lastName ? ' ' + item.lastName : ''}`.trim() || 'WearWise User';
    const initials = (item.firstName?.[0] || '') + (item.lastName?.[0] || '');
    const isMe = currentUser?.uid === item.authUid;
    const following = followingMap[item.id];

    return (
      <TouchableOpacity
        style={[styles.userRow, dk && { backgroundColor: '#2B2B2B', borderColor: 'rgba(255,255,255,0.06)' }]}
        onPress={() => router.push({ pathname: '/user/[id]', params: { id: item.id } })}
        activeOpacity={0.75}
      >
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: '#5A2D82' }]}>
            <Text style={styles.initials}>{initials.toUpperCase() || '?'}</Text>
          </View>
        )}

        <View style={styles.userInfo}>
          <Text style={[styles.displayName, dk && { color: '#FFFFFF' }]}>{displayName}</Text>
          <Text style={[styles.meta, dk && { color: 'rgba(255,255,255,0.35)' }]}>
            {item.followersCount} followers{item.city ? ` · ${item.city}` : ''}
          </Text>
        </View>

        {!isMe && (
          <TouchableOpacity
            style={[styles.followBtn, following && styles.followBtnActive, dk && following && { borderColor: '#C084FC' }]}
            onPress={() => handleFollowToggle(item.id)}
            activeOpacity={0.8}
          >
            {following ? (
              <Check size={13} color={dk ? '#C084FC' : '#5A2D82'} strokeWidth={3} />
            ) : (
              <UserPlus size={13} color="#FFF" strokeWidth={2.5} />
            )}
            <Text style={[styles.followBtnText, following && styles.followBtnTextActive, dk && following && { color: '#C084FC' }]}>
              {following ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, dk && { backgroundColor: '#1E1E1E' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }, dk && { backgroundColor: '#1A1A2E', borderBottomColor: 'rgba(255,255,255,0.05)' }]}>
        <TouchableOpacity
          style={[styles.backBtn, dk && { backgroundColor: '#2B2B2B' }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color={dk ? '#C084FC' : '#5A2D82'} strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Users size={16} color={dk ? '#C084FC' : '#5A2D82'} />
          <Text style={[styles.headerTitle, dk && { color: '#FFFFFF' }]}>{title}</Text>
          <View style={[styles.countBadge, dk && { backgroundColor: 'rgba(192,132,252,0.12)' }]}>
            <Text style={[styles.countText, dk && { color: '#C084FC' }]}>{users.length}</Text>
          </View>
        </View>

        <View style={{ width: 44 }} />
      </View>

      {/* List */}
      {loading && users.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5A2D82" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          renderItem={renderUser}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Users size={48} color={dk ? 'rgba(255,255,255,0.1)' : 'rgba(43,43,43,0.1)'} />
              <Text style={[styles.emptyText, dk && { color: 'rgba(255,255,255,0.35)' }]}>
                {type === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(90,45,130,0.05)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 16,
    backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(90,45,130,0.08)',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1A1A2E' },
  countBadge: {
    backgroundColor: 'rgba(90,45,130,0.07)',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8,
  },
  countText: { fontSize: 11, fontWeight: '900', color: '#5A2D82' },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingTop: 12, paddingHorizontal: 16 },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(90,45,130,0.05)',
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(90,45,130,0.05)' } as any,
      default: {
        shadowColor: '#5A2D82',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      },
    }),
  },
  avatar: { width: 52, height: 52, borderRadius: 18, borderWidth: 2, borderColor: '#5A2D82' },
  avatarPlaceholder: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 18, fontWeight: '900', color: '#FFF' },
  userInfo: { flex: 1 },
  displayName: { fontSize: 15, fontWeight: '800', color: '#1A1A2E', marginBottom: 3 },
  meta: { fontSize: 12, fontWeight: '600', color: 'rgba(43,43,43,0.4)' },

  followBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#5A2D82',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14,
  },
  followBtnActive: {
    backgroundColor: 'transparent',
    borderWidth: 1.5, borderColor: '#5A2D82',
  },
  followBtnText: { fontSize: 11, fontWeight: '900', color: '#FFF' },
  followBtnTextActive: { color: '#5A2D82' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 16 },
  emptyText: { fontSize: 15, fontWeight: '600', color: 'rgba(43,43,43,0.35)' },
});
