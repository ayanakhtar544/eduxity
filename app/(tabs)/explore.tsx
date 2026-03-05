// File: app/(tabs)/explore.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export default function ExploreScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'groups'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Study Groups</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/create-group')}>
          <Text style={styles.addBtnText}>+ Create</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: any) => (
            <TouchableOpacity 
              style={styles.chatRow} 
              onPress={() => router.push(`/chat/${item.id}?name=${item.name}`)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.chatInfo}>
                <Text style={styles.chatName}>{item.name}</Text>
                <Text style={styles.lastMessage} numberOfLines={1}>{item.description || 'Welcome to the group!'}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>Koi group nahi mila. Ek naya banao! 🚀</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#1E3A8A' },
  addBtn: { backgroundColor: '#EFF6FF', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#2563EB', fontWeight: 'bold' },
  chatRow: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F9FAFB', alignItems: 'center' },
  avatar: { width: 55, height: 55, borderRadius: 15, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  avatarText: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  chatInfo: { flex: 1 },
  chatName: { fontSize: 17, fontWeight: '700', color: '#111827' },
  lastMessage: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#94A3B8' }
});