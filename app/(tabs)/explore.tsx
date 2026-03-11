import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity, StatusBar, TextInput, ActivityIndicator, Dimensions, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { auth, db } from '../../firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, Layout, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

export default function ChatListScreen() {
  const router = useRouter();
  const [activeUid, setActiveUid] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [chatList, setChatList] = useState<any[]>([]);

  const fabCreateScale = useSharedValue(1);
  const fabFindScale = useSharedValue(1);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setActiveUid(user ? user.uid : null);
    });
    return () => unsubscribe();
  }, []);

  // 🛡️ ULTRA-SAFE TIMESTAMP PARSER
  // Ye function kabhi crash nahi hone dega, chahe time null ho ya server update bacha ho
  const getSafeTime = (ts: any) => {
    if (!ts) return Date.now(); // Agar null hai, toh current time de do
    if (ts.toMillis) return ts.toMillis();
    if (ts.seconds) return ts.seconds * 1000;
    return Date.now();
  };

  // 📡 THE HYBRID ENGINE (Friends + Groups)
  useEffect(() => {
    if (!activeUid) return;

    let sentFriends: any[] = [];
    let recFriends: any[] = [];
    let myGroups: any[] = [];

    const updateChatList = () => {
      // 1. Single Friends
      const friendsData = [...sentFriends, ...recFriends].map(conn => {
        const isMeSender = conn.senderId === activeUid;
        return {
          id: conn.id,
          name: isMeSender ? conn.receiverName : conn.senderName,
          avatar: isMeSender ? conn.receiverAvatar : conn.senderAvatar,
          type: 'single',
          timestamp: getSafeTime(conn.timestamp), // 👈 Bulletproof
        };
      });

      // 2. Groups
      const groupsData = myGroups.map(group => ({
        id: group.id,
        name: group.name,
        avatar: group.avatar,
        type: 'group',
        timestamp: getSafeTime(group.lastMessageTime) || getSafeTime(group.createdAt), // 👈 Bulletproof
        memberCount: group.members?.length || 1
      }));

      // Merge & Sort by newest
      const combined = [...friendsData, ...groupsData].sort((a, b) => b.timestamp - a.timestamp);
      setChatList(combined);
      setLoading(false);
    };

    const connRef = collection(db, 'connections');
    const groupRef = collection(db, 'groups');

    // Fetch Friends
    const unsubSent = onSnapshot(query(connRef, where('senderId', '==', activeUid), where('status', '==', 'accepted')), snap => { sentFriends = snap.docs.map(d => ({ id: d.id, ...d.data() })); updateChatList(); });
    const unsubRec = onSnapshot(query(connRef, where('receiverId', '==', activeUid), where('status', '==', 'accepted')), snap => { recFriends = snap.docs.map(d => ({ id: d.id, ...d.data() })); updateChatList(); });
    
    // 🚨 FETCH MY GROUPS (With Error Logging just in case Firebase Rules block it)
    const unsubGroups = onSnapshot(
      query(groupRef, where('members', 'array-contains', activeUid)), 
      (snap) => { 
        myGroups = snap.docs.map(d => ({ id: d.id, ...d.data() })); 
        updateChatList(); 
      },
      (error) => {
        console.error("Groups fetch error:", error); // Agar permission error hoga toh yahan dikhega
      }
    );

    return () => { unsubSent(); unsubRec(); unsubGroups(); };
  }, [activeUid]);

  const filteredChats = chatList.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const animatedCreateStyle = useAnimatedStyle(() => ({ transform: [{ scale: fabCreateScale.value }] }));
  const animatedFindStyle = useAnimatedStyle(() => ({ transform: [{ scale: fabFindScale.value }] }));

  const renderChatItem = ({ item, index }: any) => (
    <Animated.View entering={FadeInUp.delay(index * 50)} layout={Layout.springify()}>
      <TouchableOpacity 
        style={styles.chatCard}
        activeOpacity={0.7}
        onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id, name: item.name, isGroup: item.type === 'group' ? 'true' : 'false' } })}
      >
        <Image source={{ uri: item.avatar }} style={styles.chatAvatar} />
        <View style={styles.chatInfo}>
          <Text style={styles.chatName}>{item.name}</Text>
          <Text style={styles.chatPreview} numberOfLines={1}>
            {item.type === 'group' ? `👥 Group • ${item.memberCount} Members` : `Tap to chat with ${item.name.split(' ')[0]}`}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.headerArea}>
        <Text style={styles.mainTitle}>Messages</Text>
      </View>

      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput 
            style={styles.searchInput} placeholder="Search chats or groups..." 
            placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listAreaVertical}
          renderItem={renderChatItem}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={60} color="#cbd5e1" />
              <Text style={styles.emptyText}>No chats or groups yet.</Text>
            </View>
          }
        />
      )}

      {/* 🔍 FIND GROUPS */}
      <Animated.View style={[styles.fabFindContainer, animatedFindStyle]}>
        <TouchableOpacity 
          style={styles.fabFind} activeOpacity={0.9}
          onPressIn={() => fabFindScale.value = withSpring(0.9)} onPressOut={() => fabFindScale.value = withSpring(1)}
          onPress={() => router.push('/find-groups')}
        >
          <Ionicons name="search" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </Animated.View>

      {/* ➕ CREATE GROUP */}
      <Animated.View style={[styles.fabCreateContainer, animatedCreateStyle]}>
        <TouchableOpacity 
          style={styles.fabCreate} activeOpacity={0.9}
          onPressIn={() => fabCreateScale.value = withSpring(0.9)} onPressOut={() => fabCreateScale.value = withSpring(1)}
          onPress={() => router.push('/create-group')}
        >
          <LinearGradient colors={['#4f46e5', '#2563eb']} style={styles.fabGradient}>
            <Ionicons name="people" size={24} color="#fff" />
            <View style={styles.miniPlusBadge}>
              <Ionicons name="add" size={12} color="#2563eb" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 10 : 20, paddingBottom: 10, backgroundColor: '#fff' },
  mainTitle: { fontSize: 28, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  searchWrapper: { paddingHorizontal: 20, paddingBottom: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f5f9' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', height: 46, borderRadius: 16, paddingHorizontal: 15 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#0f172a', fontWeight: '500' },
  listAreaVertical: { paddingBottom: 180 },
  chatCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f8fafc' },
  chatAvatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#f1f5f9' },
  chatInfo: { flex: 1, marginLeft: 15 },
  chatName: { fontSize: 17, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  chatPreview: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  emptyState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyText: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginTop: 15 },
  fabFindContainer: { position: 'absolute', bottom: Platform.OS === 'ios' ? 170 : 160, right: 20, zIndex: 10 },
  fabFind: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  fabCreateContainer: { position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 90, right: 20, zIndex: 10 },
  fabCreate: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden', elevation: 8, shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10 },
  fabGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  miniPlusBadge: { position: 'absolute', bottom: 12, right: 10, width: 14, height: 14, backgroundColor: '#fff', borderRadius: 7, justifyContent: 'center', alignItems: 'center' }
});