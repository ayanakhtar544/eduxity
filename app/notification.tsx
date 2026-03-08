import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity, 
  SafeAreaView, StatusBar, ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

export default function NotificationsScreen() {
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🚀 FETCH REAL-TIME NOTIFICATIONS
  useEffect(() => {
    if (!currentUid) return;

    const notifQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', currentUid),
      // orderBy('createdAt', 'desc') // Ensure you have a Firestore Index for this!
    );

    const unsubscribe = onSnapshot(notifQuery, (snapshot) => {
      let fetchedNotifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sorting locally to avoid immediate Firestore Index Error during development
      fetchedNotifs.sort((a: any, b: any) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      
      setNotifications(fetchedNotifs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUid]);

  // 👀 MARK AS READ LOGIC
  const handleNotificationPress = async (item: any) => {
    // Agar notification unread hai, toh usko pehle Read mark karo
    if (!item.isRead) {
      try {
        await updateDoc(doc(db, 'notifications', item.id), { isRead: true });
      } catch (error) {
        console.log("Error updating notification status:", error);
      }
    }

    // Navigation Logic based on Type
    if (item.type === 'like' || item.type === 'comment' || item.type === 'post') {
      // router.push(`/post/${item.postId}`); // Agar single post page banaya hai
      router.back(); 
    } else if (item.type === 'friend_request' || item.type === 'friend_accept') {
      router.push('/(tabs)/network'); // Network page pe bhej do
    }
  };

  // 🎨 DYNAMIC UI ENGINE FOR DIFFERENT NOTIFICATION TYPES
  const getNotificationConfig = (type: string) => {
    switch (type) {
      case 'like':
        return { icon: 'heart', color: '#ef4444', text: 'liked your post.' };
      case 'comment':
        return { icon: 'chatbubble', color: '#3b82f6', text: 'commented on your post.' };
      case 'post':
        return { icon: 'document-text', color: '#10b981', text: 'published a new post.' };
      case 'friend_request':
        return { icon: 'person-add', color: '#f59e0b', text: 'sent you a connection request.' };
      case 'friend_accept':
        return { icon: 'checkmark-circle', color: '#10b981', text: 'accepted your connection request.' };
      default:
        return { icon: 'notifications', color: '#64748b', text: 'interacted with you.' };
    }
  };

  const renderItem = ({ item, index }: any) => {
    const config = getNotificationConfig(item.type);
    
    // Time Formatting
    const timeAgo = item.createdAt 
      ? new Date(item.createdAt.toDate()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) 
      : 'Just now';

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
        <TouchableOpacity 
          style={[styles.notificationCard, !item.isRead && styles.unreadCard]} 
          activeOpacity={0.7}
          onPress={() => handleNotificationPress(item)}
        >
          {/* Avatar Area */}
          <View style={styles.avatarContainer}>
            <Image source={{ uri: item.senderAvatar || DEFAULT_AVATAR }} style={styles.avatar} />
            <View style={[styles.iconBadge, { backgroundColor: config.color }]}>
              <Ionicons name={config.icon as any} size={10} color="#fff" />
            </View>
          </View>

          {/* Text Content */}
          <View style={styles.contentContainer}>
            <Text style={styles.notificationText}>
              <Text style={styles.boldText}>{item.senderName}</Text> {config.text}
            </Text>
            <Text style={[styles.timeText, !item.isRead && { color: '#2563eb', fontWeight: '600' }]}>
              {timeAgo}
            </Text>
          </View>

          {/* Unread Dot Indicator */}
          {!item.isRead && <View style={styles.unreadDot} />}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* 🔝 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={styles.backBtn}>
          <Ionicons name="checkmark-done" size={22} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {/* 📋 NOTIFICATIONS LIST */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={60} color="#cbd5e1" />
              <Text style={styles.emptyText}>No notifications yet</Text>
              <Text style={styles.emptySubText}>When someone interacts with you, you&apos;ll see it here.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 PREMIUM STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 15, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  backBtn: { padding: 5 },

  notificationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  unreadCard: { backgroundColor: '#eff6ff' }, // Light blue background for unread

  avatarContainer: { position: 'relative', marginRight: 15 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#e2e8f0' },
  iconBadge: { position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },

  contentContainer: { flex: 1 },
  notificationText: { fontSize: 14, color: '#1e293b', lineHeight: 20 },
  boldText: { fontWeight: '800', color: '#0f172a' },
  timeText: { fontSize: 12, color: '#64748b', marginTop: 4 },

  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2563eb', marginLeft: 10 },

  emptyState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyText: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginTop: 15 },
  emptySubText: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 8, lineHeight: 22 }
});