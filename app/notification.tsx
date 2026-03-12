import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, 
  SafeAreaView, ActivityIndicator, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

export default function NotificationScreen() {
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUid) return;

    // 📡 FETCH REAL-TIME NOTIFICATIONS
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', currentUid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUid]);

  // 🖱️ MARK AS READ & NAVIGATE
  const handleNotificationPress = async (item: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Mark as read in Firebase
    if (!item.isRead) {
      try {
        await updateDoc(doc(db, 'notifications', item.id), { isRead: true });
      } catch (error) { console.log("Error marking read:", error); }
    }

    // Navigation Logic
    if (item.postId) {
      router.push(`/post/${item.postId}`);
    } else if (item.senderId) {
      router.push(`/user/${item.senderId}`);
    }
  };

  // ✅ MARK ALL AS READ
  const markAllAsRead = async () => {
    if (notifications.length === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    try {
      const batch = writeBatch(db);
      notifications.forEach((notif) => {
        if (!notif.isRead) {
          const notifRef = doc(db, 'notifications', notif.id);
          batch.update(notifRef, { isRead: true });
        }
      });
      await batch.commit();
    } catch (error) { console.log(error); }
  };

  // 🕒 TIME FORMATTER
  const timeAgo = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const seconds = Math.floor((Date.now() - timestamp.toMillis()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'like': return { name: 'heart', color: '#ef4444', bg: '#fef2f2' };
      case 'comment': return { name: 'chatbubble', color: '#3b82f6', bg: '#eff6ff' };
      case 'follow': return { name: 'person-add', color: '#10b981', bg: '#ecfdf5' };
      case 'mention': return { name: 'at', color: '#8b5cf6', bg: '#f5f3ff' };
      default: return { name: 'notifications', color: '#f59e0b', bg: '#fffbeb' };
    }
  };

  const renderNotification = ({ item, index }: { item: any, index: number }) => {
    const iconData = getNotificationIcon(item.type);
    
    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()} layout={Layout.springify()}>
        <TouchableOpacity 
          style={[styles.notificationCard, !item.isRead && styles.unreadCard]} 
          activeOpacity={0.7} 
          onPress={() => handleNotificationPress(item)}
        >
          <View style={styles.avatarContainer}>
            <Image source={{ uri: item.senderAvatar || DEFAULT_AVATAR }} style={styles.avatar} />
            <View style={[styles.typeIconBadge, { backgroundColor: iconData.bg }]}>
              <Ionicons name={iconData.name as any} size={10} color={iconData.color} />
            </View>
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.notificationText}>
              <Text style={styles.boldText}>{item.senderName}</Text> 
              {item.type === 'like' && ' liked your post.'}
              {item.type === 'comment' && ' commented on your post.'}
              {item.type === 'follow' && ' started following you.'}
              {item.type === 'mention' && ' mentioned you in a comment.'}
            </Text>
            <Text style={styles.timeText}>{timeAgo(item.createdAt)}</Text>
          </View>

          {!item.isRead && <View style={styles.unreadDot} />}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* 🔝 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAllAsRead} style={styles.markReadBtn}>
          <Ionicons name="checkmark-done-circle-outline" size={24} color="#4f46e5" />
        </TouchableOpacity>
      </View>

      {/* 📜 LIST */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={renderNotification}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBg}>
                <Ionicons name="notifications-off-outline" size={50} color="#94a3b8" />
              </View>
              <Text style={styles.emptyText}>No notifications yet</Text>
              <Text style={styles.emptySubText}>When someone interacts with you, it will show up here.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingTop: Platform.OS === 'ios' ? 10 : 20, paddingBottom: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  backBtn: { padding: 5, backgroundColor: '#f1f5f9', borderRadius: 12 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a', letterSpacing: 0.5 },
  markReadBtn: { padding: 5 },

  listContent: { padding: 15, paddingBottom: 40 },
  
  notificationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  unreadCard: { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' }, // Light indigo for unread
  
  avatarContainer: { position: 'relative', marginRight: 15 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#e2e8f0' },
  typeIconBadge: { position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  
  textContainer: { flex: 1 },
  notificationText: { fontSize: 14, color: '#1e293b', lineHeight: 20 },
  boldText: { fontWeight: '800', color: '#0f172a' },
  timeText: { fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: '600' },
  
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4f46e5', marginLeft: 10 },
  
  emptyState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyIconBg: { backgroundColor: '#f1f5f9', padding: 25, borderRadius: 50, marginBottom: 20 },
  emptyText: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  emptySubText: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22 }
});