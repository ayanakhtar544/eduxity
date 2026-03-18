import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity, 
 StatusBar, TextInput, ActivityIndicator, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { auth, db } from '../firebaseConfig';
import { collection, query, where, onSnapshot, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

export default function FindGroupsScreen() {
  const router = useRouter();
  const currentUserUid = auth.currentUser?.uid;

  const [groups, setGroups] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  // 📡 1. STRICT PUBLIC GROUPS FETCHING
  useEffect(() => {
    if (!currentUserUid) return;
    
    // Sirf Public groups aayenge
    const q = query(collection(db, 'groups'), where('type', '==', 'public'));

    const unsubscribe = onSnapshot(q, (snap) => {
      const groupList = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGroups(groupList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserUid]);

  // 🤝 2. JOIN GROUP LOGIC
  const handleJoinGroup = async (groupId: string, groupName: string) => {
    if (!currentUserUid) return;
    setJoiningId(groupId);

    try {
      const groupRef = doc(db, 'groups', groupId);
      // arrayUnion ensures tum 2 baar add na ho jao
      await updateDoc(groupRef, {
        members: arrayUnion(currentUserUid)
      });
      
      Alert.alert("Welcome! 🎉", `Tum ab ${groupName} ka hissa ho.`);
    } catch (error) {
      console.error("Join Group Error:", error);
      Alert.alert("Error", "Group join karne mein dikkat aayi.");
    } finally {
      setJoiningId(null);
    }
  };

  const filteredGroups = groups.filter(g => 
    g.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderGroupCard = ({ item, index }: any) => {
    // Check agar user already member hai
    const isMember = item.members && item.members.includes(currentUserUid);

    return (
      <Animated.View entering={FadeInDown.delay(index * 50)} layout={Layout.springify()} style={styles.card}>
        <Image source={{ uri: item.avatar }} style={styles.groupAvatar} />
        <View style={styles.groupInfo}>
          <Text style={styles.groupName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.memberCount}>
            <Ionicons name="people" size={12} color="#64748b" /> {item.members?.length || 1} Members
          </Text>
        </View>

        {isMember ? (
          <TouchableOpacity style={styles.joinedBadge} disabled>
            <Text style={styles.joinedText}>Joined</Text>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.joinBtn} 
            onPress={() => handleJoinGroup(item.id, item.name)}
            disabled={joiningId === item.id}
          >
            {joiningId === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.joinBtnText}>Join</Text>
            )}
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discover Groups</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search communities..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>
      ) : (
        <FlatList
          data={filteredGroups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroupCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="planet-outline" size={60} color="#cbd5e1" />
              <Text style={styles.emptyText}>Abhi koi public group nahi hai. Apna naya group banao!</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f5f9' },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  searchWrapper: { padding: 20, backgroundColor: '#fff' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', height: 50, borderRadius: 16, paddingHorizontal: 15 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#0f172a', fontWeight: '600' },
  listContainer: { padding: 20, paddingBottom: 100 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 20, marginBottom: 15, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  groupAvatar: { width: 55, height: 55, borderRadius: 18, backgroundColor: '#f1f5f9' },
  groupInfo: { flex: 1, marginLeft: 15 },
  groupName: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  memberCount: { fontSize: 13, color: '#64748b', fontWeight: '600', marginTop: 4 },
  joinBtn: { backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14 },
  joinBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  joinedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: '#d1fae5' },
  joinedText: { color: '#10b981', fontSize: 14, fontWeight: '800' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#94a3b8', fontSize: 15, fontWeight: '600', textAlign: 'center', marginTop: 15, paddingHorizontal: 40 }
});