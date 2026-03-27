import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  TextInput, StatusBar, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import Animated, { FadeInDown } from 'react-native-reanimated';

const SUBJECTS = ['All', 'Physics', 'Chemistry', 'Maths', 'Biology'];

export default function StudyVaultScreen() {
  const router = useRouter();
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');

  // 🚀 FETCH ONLY 'RESOURCE' POSTS
  useEffect(() => {
    // Sirf wo posts layenge jo 'resource' hain
    const q = query(collection(db, 'posts'), where('type', '==', 'resource'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let fetchedData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Client-side sorting (To avoid Firebase Index errors for now)
      fetchedData.sort((a: any, b: any) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      
      setResources(fetchedData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 🔍 FILTER LOGIC (Search by Title/Tags + Subject Filter)
  const filteredResources = resources.filter(res => {
    const matchesSearch = 
      res.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      res.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesSubject = selectedSubject === 'All' || res.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  // 🃏 RESOURCE CARD COMPONENT
  const renderResourceCard = ({ item, index }: { item: any, index: number }) => {
    const isDriveLink = item.fileUrl && item.fileUrl.includes('http');
    
    return (
      <Animated.View entering={FadeInDown.delay(index * 100).duration(400).springify()}>
        <TouchableOpacity 
          style={styles.card} 
          activeOpacity={0.7}
          onPress={() => router.push(`/resources/view/${item.id}`)}
        >
          {/* Left Icon Base */}
          <View style={[styles.iconBox, { backgroundColor: isDriveLink ? '#e0f2fe' : '#fce7f3' }]}>
            <Ionicons 
               name={isDriveLink ? "cloud" : "sparkles"} 
               size={28} 
               color={isDriveLink ? "#0284c7" : "#db2777"} 
            />
          </View>

          {/* Content */}
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.subjectBadge}>
                <Text style={styles.subjectText}>{item.subject}</Text>
              </View>
              {/* Type Tag */}
              <View style={[styles.typeTag, { backgroundColor: isDriveLink ? '#f1f5f9' : '#fff1f2' }]}>
               <Ionicons 
                  name={isDriveLink ? "cloud" : "flash"} 
                  size={28} 
                 color={isDriveLink ? "#0284c7" : "#db2777"} 
                />
                <Text style={[styles.typeText, { color: isDriveLink ? "#64748b" : "#e11d48" }]}>
                  {isDriveLink ? 'Drive Link' : 'Smart Note'}
                </Text>
              </View>
            </View>
            
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            
            {/* 🏷️ TAGS DISPLAY (Up to 3 tags) */}
            {item.tags && item.tags.length > 0 && (
              <View style={styles.tagsRow}>
                {item.tags.slice(0, 3).map((tag: string, idx: number) => (
                  <Text key={idx} style={styles.tagText}>#{tag}</Text>
                ))}
                {item.tags.length > 3 && <Text style={styles.tagText}>+{item.tags.length - 3}</Text>}
              </View>
            )}
            
            <View style={styles.cardFooter}>
              <Text style={styles.authorText}>By {item.authorName?.split(' ')[0]}</Text>
              <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* 🔝 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Study Vault 📚</Text>
      </View>

      {/* 🔍 SEARCH BAR */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94a3b8" />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search notes, PYQs or #tags..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#cbd5e1" />
          </TouchableOpacity>
        )}
      </View>

      {/* 🏷️ CATEGORY FILTER */}
      <View style={styles.filterWrapper}>
        <FlatList 
          horizontal
          showsHorizontalScrollIndicator={false}
          data={SUBJECTS}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.filterPill, selectedSubject === item && styles.activeFilterPill]}
              onPress={() => setSelectedSubject(item)}
            >
              <Text style={[styles.filterText, selectedSubject === item && styles.activeFilterText]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* 📚 RESOURCES LIST */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>
      ) : (
        <FlatList
          data={filteredResources}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={renderResourceCard}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={60} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>Vault is Empty</Text>
              <Text style={styles.emptySub}>No resources found. Be the first to share notes!</Text>
            </View>
          }
        />
      )}
      

      {/* ➕ FLOATING ACTION BUTTON */}
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.9} 
        onPress={() => router.push('/create-post?type=resource')}
      >
        <Ionicons name="cloud-upload" size={24} color="#fff" />
        <Text style={styles.fabText}>Add Notes</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

// ==========================================
// 🎨 STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 15, paddingTop: 10, paddingBottom: 15 },
  backBtn: { padding: 5, marginRight: 10 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a' },

  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 15, marginTop: 5, paddingHorizontal: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', height: 50 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#1e293b' },

  filterWrapper: { marginTop: 15, paddingBottom: 10 },
  filterList: { paddingHorizontal: 15, gap: 10 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#cbd5e1' },
  activeFilterPill: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  activeFilterText: { color: '#fff' },

  listContent: { padding: 15, paddingBottom: 100 },
  
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#f1f5f9', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  iconBox: { width: 60, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cardContent: { flex: 1, justifyContent: 'center' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  subjectBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  subjectText: { fontSize: 10, fontWeight: '800', color: '#475569', textTransform: 'uppercase' },
  typeTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, gap: 4 },
  typeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 6, lineHeight: 22 },
  
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  tagText: { fontSize: 11, color: '#2563eb', fontWeight: '600', backgroundColor: '#eff6ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  authorText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },

  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginTop: 15 },
  emptySub: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 8, lineHeight: 20 },

  fab: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#2563eb', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderRadius: 30, elevation: 5, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '800', marginLeft: 8 }
});