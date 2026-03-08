import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, FlatList, Image, 
  TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../firebaseConfig';
import { collection, getDocs, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

export default function SearchUsersScreen() {
  const router = useRouter();
  const currentUser = auth.currentUser;

  // 🧠 State Management
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Track sent requests temporarily in UI
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  // 🚀 Fetch Users (We fetch a batch of users for fast local filtering)
  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      // Fetching up to 100 recent users for the "Suggested" list
      const usersQuery = query(collection(db, 'users'));
      const snapshot = await getDocs(usersQuery);
      
      let usersList: any[] = [];
      snapshot.forEach(doc => {
        // Khud ko search list me nahi dikhana hai
        if (doc.id !== currentUser?.uid) {
          usersList.push({ id: doc.id, ...doc.data() });
        }
      });

      setAllUsers(usersList);
      setFilteredUsers(usersList); // Initially show all as suggestions
      setLoading(false);
    } catch (error) {
      console.log("Error fetching users:", error);
      setLoading(false);
    }
  };

  // 🔍 Real-time Search Filter Engine
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredUsers(allUsers);
    } else {
      const lowerCaseQuery = text.toLowerCase();
      const filtered = allUsers.filter(user => 
        (user.displayName && user.displayName.toLowerCase().includes(lowerCaseQuery)) ||
        (user.role && user.role.toLowerCase().includes(lowerCaseQuery)) ||
        (user.city && user.city.toLowerCase().includes(lowerCaseQuery))
      );
      setFilteredUsers(filtered);
    }
  };

  // 🤝 SEND CONNECTION REQUEST
  const sendRequest = async (targetUser: any) => {
    if (!currentUser) return;

    // UI Update instantly for snappy feel
    setSentRequests(prev => new Set(prev).add(targetUser.id));

    try {
      await addDoc(collection(db, 'notifications'), {
        recipientId: targetUser.id,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Eduxity User',
        senderAvatar: currentUser.photoURL || DEFAULT_AVATAR,
        type: 'friend_request',
        status: 'pending', // Pending state
        isRead: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.log("Request Error:", error);
      Alert.alert("Error", "Could not send request.");
      // Revert UI if failed
      setSentRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(targetUser.id);
        return newSet;
      });
    }
  };

  // 🎨 USER CARD RENDERER
  const renderUserCard = ({ item, index }: any) => {
    const isRequested = sentRequests.has(item.id);

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()} style={styles.userCard}>
        <Image source={{ uri: item.photoURL || DEFAULT_AVATAR }} style={styles.avatar} />
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.displayName || 'Unknown User'}</Text>
          {item.role && <Text style={styles.userRole} numberOfLines={1}>{item.role}</Text>}
          {item.city && <Text style={styles.userCity}><Ionicons name="location" size={10} /> {item.city}</Text>}
        </View>

        <TouchableOpacity 
          style={[styles.connectBtn, isRequested && styles.requestedBtn]}
          onPress={() => sendRequest(item)}
          disabled={isRequested}
        >
          <Ionicons name={isRequested ? "checkmark" : "person-add"} size={14} color={isRequested ? "#64748b" : "#fff"} />
          <Text style={[styles.connectBtnText, isRequested && styles.requestedBtnText]}>
            {isRequested ? 'Requested' : 'Connect'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* 🔝 HEADER & SEARCH BAR */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#0f172a" />
        </TouchableOpacity>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search students, mentors, skills..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color="#cbd5e1" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 📋 RESULTS LIST */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>
          {searchQuery.trim() === '' ? 'Suggested Connections' : 'Search Results'}
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={renderUserCard}
            contentContainerStyle={{ paddingBottom: 50 }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={60} color="#cbd5e1" />
                <Text style={styles.emptyText}>No users found</Text>
                <Text style={styles.emptySubText}>Try searching with a different name or role.</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 PREMIUM STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  backBtn: { padding: 5, marginRight: 10 },
  
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#0f172a' },
  clearBtn: { padding: 4 },

  content: { flex: 1, paddingHorizontal: 15, paddingTop: 15 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#64748b', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 0.5 },

  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#f1f5f9', marginRight: 15 },
  
  userInfo: { flex: 1, marginRight: 10 },
  userName: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  userRole: { fontSize: 13, color: '#2563eb', fontWeight: '600', marginBottom: 2 },
  userCity: { fontSize: 11, color: '#64748b', fontWeight: '500' },

  connectBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  connectBtnText: { color: '#fff', fontSize: 13, fontWeight: '700', marginLeft: 4 },
  
  requestedBtn: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  requestedBtnText: { color: '#64748b' },

  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginTop: 15 },
  emptySubText: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 8 }
});