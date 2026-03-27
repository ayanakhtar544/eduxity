import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, TextInput, ActivityIndicator, Platform 
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { auth, db } from '../../firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInDown, Layout, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// 🔥 TERI BRAND LOGO IMPORT KIYI HAI YAHAN
import BrandLogo from '../../components/BrandLogo';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

// 🕒 SMART TIME FORMATTER (WhatsApp Style)
const formatChatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (isYesterday) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString([], { day: '2-digit', month: 'short', year: '2-digit' });
  }
};

export default function ChatListScreen() {
  const router = useRouter();
  const [activeUid, setActiveUid] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'All' | 'Direct' | 'Groups'>('All');
  
  const [rawConnections, setRawConnections] = useState<any[]>([]);
  const [rawGroups, setRawGroups] = useState<any[]>([]);

  const fabCreateScale = useSharedValue(1);
  const fabFindScale = useSharedValue(1);

  // 1. AUTH LISTENER
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setActiveUid(user ? user.uid : null);
    });
    return () => unsubscribe();
  }, []);

  // 🛡️ SAFE TIMESTAMP EXTRACTOR
  const getSafeTime = (ts: any) => {
    if (!ts) return 0;
    if (ts.toMillis) return ts.toMillis();
    if (ts.seconds) return ts.seconds * 1000;
    return Date.now();
  };

  // 📡 2. BULLETPROOF FIREBASE SYNC ENGINE
  useEffect(() => {
    if (!activeUid) return;

    // Use refs to avoid continuous state updates inside listeners
    let sentConns: any[] = [];
    let recConns: any[] = [];

    const updateConnectionsState = () => {
      const combined = [...sentConns, ...recConns];
      setRawConnections(combined);
    };

    const connRef = collection(db, 'connections');
    const groupRef = collection(db, 'groups');

    // Fetch Sent Friends
    const unsubSent = onSnapshot(query(connRef, where('senderId', '==', activeUid), where('status', '==', 'accepted')), snap => { 
      sentConns = snap.docs.map(d => ({ id: d.id, ...d.data() })); 
      updateConnectionsState(); 
    });

    // Fetch Received Friends
    const unsubRec = onSnapshot(query(connRef, where('receiverId', '==', activeUid), where('status', '==', 'accepted')), snap => { 
      recConns = snap.docs.map(d => ({ id: d.id, ...d.data() })); 
      updateConnectionsState(); 
    });
    
    // Fetch Groups
    const unsubGroups = onSnapshot(query(groupRef, where('members', 'array-contains', activeUid)), snap => { 
      setRawGroups(snap.docs.map(d => ({ id: d.id, ...d.data() }))); 
      setLoading(false); // Groups load -> remove loader
    }, (err) => {
      console.error("Groups sync error:", err);
      setLoading(false);
    });

    // Fallback stop loader if takes too long
    setTimeout(() => setLoading(false), 3000);

    return () => { unsubSent(); unsubRec(); unsubGroups(); };
  }, [activeUid]);

  // 🧠 3. SMART DATA MERGER & FILTERING (useMemo for Performance)
  const chatList = useMemo(() => {
    // Format Connections
    const friendsData = rawConnections.map(conn => {
      const isMeSender = conn.senderId === activeUid;
      return {
        id: conn.id,
        name: isMeSender ? conn.receiverName : conn.senderName,
        avatar: isMeSender ? conn.receiverAvatar : conn.senderAvatar,
        type: 'direct',
        lastMessage: conn.lastMessage || `Say hi to ${isMeSender ? conn.receiverName?.split(' ')[0] : conn.senderName?.split(' ')[0]}! 👋`,
        timestamp: getSafeTime(conn.lastMessageTime) || getSafeTime(conn.timestamp),
        unreadCount: conn.unreadCount || 0
      };
    });

    // Format Groups
    const groupsData = rawGroups.map(group => ({
      id: group.id,
      name: group.name,
      avatar: group.avatar || group.icon, // 🔥 Fallback for older groups
      type: 'group',
      lastMessage: group.lastMessage || `Tap to see latest updates in ${group.name}`,
      timestamp: getSafeTime(group.lastMessageTime) || getSafeTime(group.createdAt) || 1,
      memberCount: group.members?.length || 1,
      unreadCount: group.unreadCount || 0
    }));

    let combined = [...friendsData, ...groupsData].sort((a, b) => b.timestamp - a.timestamp);

    // Apply Tab Filter
    if (activeTab === 'Direct') combined = combined.filter(c => c.type === 'direct');
    if (activeTab === 'Groups') combined = combined.filter(c => c.type === 'group');

    // Apply Search Filter
    if (searchQuery) combined = combined.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return combined;
  }, [rawConnections, rawGroups, activeTab, searchQuery, activeUid]);

  // --- ANIMATIONS ---
  const animatedCreateStyle = useAnimatedStyle(() => ({ transform: [{ scale: fabCreateScale.value }] }));
  const animatedFindStyle = useAnimatedStyle(() => ({ transform: [{ scale: fabFindScale.value }] }));

  // --- RENDERING ---
  const renderChatItem = ({ item, index }: any) => {
    const timeFormatted = item.timestamp > 1 ? formatChatTime(item.timestamp) : '';
    
    return (
      <Animated.View entering={FadeInUp.delay(Math.min(index * 50, 500))} layout={Layout.springify()}>
        <TouchableOpacity 
          style={styles.chatCard} activeOpacity={0.7}
          onPress={() => {
            Haptics.selectionAsync();
            router.push({ pathname: '/chat/[id]', params: { id: item.id, name: item.name, isGroup: item.type === 'group' ? 'true' : 'false' } });
          }}
        >
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: item.avatar || DEFAULT_AVATAR }} style={styles.chatAvatar} />
            {item.type === 'group' && <View style={styles.groupIconBadge}><Ionicons name="people" size={10} color="#fff" /></View>}
          </View>
          
          <View style={styles.chatInfo}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatName} numberOfLines={1}>{item.name}</Text>
              <Text style={[styles.chatTime, item.unreadCount > 0 && {color: '#2563eb', fontWeight: '800'}]}>{timeFormatted}</Text>
            </View>
            
            <View style={styles.chatFooter}>
              <Text style={[styles.chatPreview, item.unreadCount > 0 && {color: '#0f172a', fontWeight: '700'}]} numberOfLines={1}>
                {item.lastMessage}
              </Text>
              {item.unreadCount > 0 && (
                <View style={styles.unreadBadge}><Text style={styles.unreadText}>{item.unreadCount}</Text></View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* 🔥 LOGO AUR TITLE YAHAN HAIN */}
      <View style={styles.headerArea}>
        <View style={styles.titleRow}>
          <BrandLogo variant="medium" />
          <Text style={styles.mainTitle}>Messages</Text>
        </View>
        <TouchableOpacity style={styles.headerIcon} onPress={() => router.push('/find-groups')}>
          <Ionicons name="search" size={24} color="#0f172a" />
        </TouchableOpacity>
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

      {/* 🔥 SMART TABS */}
      <View style={styles.tabsContainer}>
        {['All', 'Direct', 'Groups'].map((tab) => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tabPill, activeTab === tab && styles.tabPillActive]} 
            onPress={() => { Haptics.selectionAsync(); setActiveTab(tab as any); }}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>
      ) : (
        <FlatList
          data={chatList}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listAreaVertical}
          renderItem={renderChatItem}
          ListEmptyComponent={
            <Animated.View entering={FadeInDown} style={styles.emptyState}>
              <View style={styles.emptyIconBg}><Ionicons name="chatbubbles-outline" size={50} color="#3b82f6" /></View>
              <Text style={styles.emptyText}>No {activeTab.toLowerCase()} chats yet.</Text>
              <Text style={styles.emptySubText}>Start a conversation or join a new study group!</Text>
            </Animated.View>
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
          <Ionicons name="search" size={24} color="#2563eb" />
        </TouchableOpacity>
      </Animated.View>

      {/* ➕ CREATE GROUP */}
      <Animated.View style={[styles.fabCreateContainer, animatedCreateStyle]}>
        <TouchableOpacity 
          style={styles.fabCreate} activeOpacity={0.9}
          onPressIn={() => fabCreateScale.value = withSpring(0.9)} onPressOut={() => fabCreateScale.value = withSpring(1)}
          onPress={() => router.push('/create-group')}
        >
          <LinearGradient colors={['#2563eb', '#1d4ed8']} style={styles.fabGradient}>
            <Ionicons name="people" size={24} color="#fff" />
            <View style={styles.miniPlusBadge}><Ionicons name="add" size={12} color="#2563eb" /></View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // 🔥 HEADER STYLES UPDATED FOR LOGO
  headerArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 10 : 20, paddingBottom: 10, backgroundColor: '#fff' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mainTitle: { fontSize: 28, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  headerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  
  searchWrapper: { paddingHorizontal: 20, paddingBottom: 10, backgroundColor: '#fff' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', height: 46, borderRadius: 16, paddingHorizontal: 15 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#0f172a', fontWeight: '500' },
  
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderColor: '#f1f5f9', gap: 10 },
  tabPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  tabPillActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  tabTextActive: { color: '#fff' },

  listAreaVertical: { paddingBottom: 180 },
  chatCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f8fafc' },
  
  avatarWrapper: { position: 'relative' },
  chatAvatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#f1f5f9' },
  groupIconBadge: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#3b82f6', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  
  chatInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  chatName: { fontSize: 17, fontWeight: '800', color: '#0f172a', flex: 1, paddingRight: 10 },
  chatTime: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  
  chatFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatPreview: { fontSize: 14, color: '#64748b', fontWeight: '500', flex: 1, paddingRight: 10 },
  unreadBadge: { backgroundColor: '#2563eb', minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  
  emptyState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyIconBg: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyText: { fontSize: 18, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
  emptySubText: { fontSize: 14, fontWeight: '500', color: '#64748b', textAlign: 'center', marginTop: 10, lineHeight: 20 },
  
  fabFindContainer: { position: 'absolute', bottom: Platform.OS === 'ios' ? 170 : 160, right: 20, zIndex: 10 },
  fabFind: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  fabCreateContainer: { position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 90, right: 20, zIndex: 10 },
  fabCreate: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden', elevation: 8, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10 },
  fabGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  miniPlusBadge: { position: 'absolute', bottom: 12, right: 10, width: 14, height: 14, backgroundColor: '#fff', borderRadius: 7, justifyContent: 'center', alignItems: 'center' }
});