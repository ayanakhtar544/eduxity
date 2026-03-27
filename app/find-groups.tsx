// Location: app/find-groups.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  StatusBar, TextInput, ActivityIndicator, Alert, ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { auth, db } from '../firebaseConfig'; // Check if path is correct
import { collection, query, where, onSnapshot, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight, Layout } from 'react-native-reanimated';
import { Image } from 'expo-image'; // Use expo-image for better performance
import { useUserStore } from '../store/useUserStore'; 

// 🏷️ Categories for manual filtering
const CATEGORIES = ['All', 'JEE', 'NEET', 'Coding', 'Boards', 'UPSC', 'Gaming'];

export default function FindGroupsScreen() {
  const router = useRouter();
  const currentUserUid = auth.currentUser?.uid;
  
  // Get current user's data to power the recommendation engine
  const { userData } = useUserStore(); 

  const [allGroups, setAllGroups] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  // 📡 1. FETCH ALL PUBLIC GROUPS
  useEffect(() => {
    if (!currentUserUid) return;
    
    // Yahan ensure karo ki tumhare groups me 'type' property set ho, ya is query ko hata do agar sab public hain
    // Filhal main normal fetch de raha hu saare groups ka taaki koi data miss na ho
    const q = query(collection(db, 'groups')); 

    const unsubscribe = onSnapshot(q, (snap) => {
      const groupList = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllGroups(groupList);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error fetching groups:", error);
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
      await updateDoc(groupRef, {
        members: arrayUnion(currentUserUid),
        participants: arrayUnion(currentUserUid) // Support both schemas
      });
      
      Alert.alert("Welcome! 🎉", `Tum ab ${groupName} ka hissa ho.`);
    } catch (error) {
      console.error("Join Group Error:", error);
      Alert.alert("Error", "Group join karne mein dikkat aayi.");
    } finally {
      setJoiningId(null);
    }
  };

  // 🧠 3. THE RECOMMENDATION ENGINE (Smart Sorting & Filtering)
  const { recommendedGroups, trendingGroups, exploreGroups } = useMemo(() => {
    let filtered = allGroups;

    // A. Apply Search & Category Filters first
    if (searchQuery) {
      filtered = filtered.filter(g => (g.name || '').toLowerCase().includes(searchQuery.toLowerCase()));
    } else if (activeCategory !== 'All') {
      filtered = filtered.filter(g => 
        (g.category === activeCategory) ||
        (g.tags && g.tags.includes(activeCategory)) || 
        (g.name || '').toLowerCase().includes(activeCategory.toLowerCase())
      );
    }

    // B. Trending Logic (Top 5 groups with most members)
    const trending = [...allGroups]
      .sort((a, b) => (b.members?.length || 0) - (a.members?.length || 0))
      .slice(0, 5);

    // C. Recommendation Logic (Matches user's Target Exam or Class)
    const userTarget = userData?.targetExam || 'JEE'; // Default fallback
    const recommended = allGroups.filter(g => 
      !g.members?.includes(currentUserUid) && // Don't recommend already joined groups
      ((g.category === userTarget) || (g.tags && g.tags.includes(userTarget)) || (g.name || '').includes(userTarget))
    ).slice(0, 5);

    return { 
      recommendedGroups: recommended, 
      trendingGroups: trending, 
      exploreGroups: filtered 
    };
  }, [allGroups, searchQuery, activeCategory, userData, currentUserUid]);


  // ==========================================
  // 🎨 UI COMPONENTS
  // ==========================================

  const renderHorizontalCard = (item: any, isRecommended = false) => {
    const isMember = item.members?.includes(currentUserUid);
    const groupAvatar = item.icon || item.avatar || `https://ui-avatars.com/api/?name=${item.name}&background=4f46e5&color=fff&size=200`;

    return (
      <Animated.View entering={FadeInRight} key={item.id} style={[styles.hCard, isRecommended && styles.hCardPremium]}>
        <Image source={{ uri: groupAvatar }} style={styles.hCardAvatar} />
        <View style={styles.hCardInfo}>
          <Text style={[styles.hCardName, isRecommended && {color: '#fff'}]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.hCardMembers, isRecommended && {color: '#e0e7ff'}]}>
            <Ionicons name="people" size={12} /> {item.members?.length || 1} Members
          </Text>
        </View>
        
        {isMember ? (
          <View style={[styles.joinBtnSmall, {backgroundColor: isRecommended ? 'rgba(255,255,255,0.2)' : '#f1f5f9'}]}>
            <Ionicons name="checkmark" size={16} color={isRecommended ? "#fff" : "#10b981"} />
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.joinBtnSmall, isRecommended ? {backgroundColor: '#fff'} : {backgroundColor: '#4f46e5'}]}
            onPress={() => handleJoinGroup(item.id, item.name)}
            disabled={joiningId === item.id}
          >
            {joiningId === item.id ? <ActivityIndicator size="small" color={isRecommended ? "#4f46e5" : "#fff"} /> : <Ionicons name="add" size={20} color={isRecommended ? "#4f46e5" : "#fff"} />}
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  const renderVerticalCard = ({ item, index }: any) => {
    const isMember = item.members?.includes(currentUserUid);
    const groupAvatar = item.icon || item.avatar || `https://ui-avatars.com/api/?name=${item.name}&background=4f46e5&color=fff&size=200`;

    return (
      <Animated.View entering={FadeInDown.delay(index * 50)} layout={Layout.springify()} style={styles.vCard}>
        <Image source={{ uri: groupAvatar }} style={styles.vCardAvatar} />
        <View style={styles.vCardInfo}>
          <Text style={styles.vCardName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.vCardDesc} numberOfLines={1}>{item.description || 'A great community to learn and grow.'}</Text>
          <View style={styles.tagRow}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.members?.length || 1} Members</Text>
            </View>
            {item.category && (
              <View style={[styles.tag, {marginLeft: 8, backgroundColor: '#eef2ff'}]}>
                <Text style={[styles.tagText, {color: '#4f46e5'}]}>{item.category}</Text>
              </View>
            )}
          </View>
        </View>

        {isMember ? (
          <TouchableOpacity style={styles.joinedBadge} disabled>
            <Text style={styles.joinedText}>Joined</Text>
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

  const ListHeader = () => (
    <View>
      {/* Search Bar */}
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

      {/* Categories Horizontal Scroll */}
      {!searchQuery && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.catChip, activeCategory === cat && styles.catChipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ✨ RECOMMENDED SECTION */}
      {!searchQuery && activeCategory === 'All' && recommendedGroups.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={20} color="#4f46e5" />
            <Text style={styles.sectionTitle}>For You ({userData?.targetExam || 'Top Picks'})</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 15 }}>
            {recommendedGroups.map(g => renderHorizontalCard(g, true))}
          </ScrollView>
        </View>
      )}

      {/* 🔥 TRENDING SECTION */}
      {!searchQuery && activeCategory === 'All' && trendingGroups.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flame" size={20} color="#ef4444" />
            <Text style={styles.sectionTitle}>Trending Now</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 15 }}>
            {trendingGroups.map(g => renderHorizontalCard(g, false))}
          </ScrollView>
        </View>
      )}

      {/* 🌐 EXPLORE ALL HEADER */}
      <View style={[styles.sectionHeader, { paddingHorizontal: 20, marginTop: 10 }]}>
        <Ionicons name="globe-outline" size={20} color="#0f172a" />
        <Text style={styles.sectionTitle}>{searchQuery ? 'Search Results' : 'Explore All'}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* 🔝 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discover</Text>
        <TouchableOpacity style={styles.backBtn}>
          <Ionicons name="compass-outline" size={24} color="#0f172a" />
        </TouchableOpacity>
      </View>

      {/* 📜 MAIN LIST */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>
      ) : (
        <FlatList
          data={exploreGroups}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ListHeader}
          renderItem={renderVerticalCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="planet-outline" size={80} color="#cbd5e1" />
              <Text style={styles.emptyText}>Oops! Koi group nahi mila. Filters change karke try karo.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 SENIOR DEV STYLES (Clean & Premium)
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f5f9' },
  backBtn: { padding: 8, backgroundColor: '#f8fafc', borderRadius: 12 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', letterSpacing: 0.5 },
  
  searchWrapper: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10, backgroundColor: '#fff' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', height: 50, borderRadius: 16, paddingHorizontal: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#0f172a', fontWeight: '600' },
  
  categoryScroll: { paddingHorizontal: 20, paddingBottom: 15, backgroundColor: '#fff', gap: 10 },
  catChip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  catChipActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  catText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  catTextActive: { color: '#fff' },

  section: { marginTop: 15, paddingBottom: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12, gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Horizontal Card Styles
  hCard: { width: 220, backgroundColor: '#fff', padding: 15, borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  hCardPremium: { backgroundColor: '#4f46e5', borderColor: '#4f46e5', shadowColor: '#4f46e5', shadowOpacity: 0.3 },
  hCardAvatar: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#f1f5f9', marginBottom: 12 },
  hCardInfo: { marginBottom: 15 },
  hCardName: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  hCardMembers: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  joinBtnSmall: { alignSelf: 'flex-start', padding: 8, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

  // Vertical Card Styles
  listContainer: { paddingBottom: 100 },
  vCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, marginHorizontal: 20, marginBottom: 12, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 8, elevation: 1 },
  vCardAvatar: { width: 60, height: 60, borderRadius: 20, backgroundColor: '#f1f5f9' },
  vCardInfo: { flex: 1, marginLeft: 15 },
  vCardName: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  vCardDesc: { fontSize: 13, color: '#64748b', fontWeight: '500', marginBottom: 8 },
  tagRow: { flexDirection: 'row' },
  tag: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  
  joinBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, marginLeft: 10 },
  joinBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  joinedBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, marginLeft: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  joinedText: { color: '#64748b', fontSize: 14, fontWeight: '800' },

  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyText: { color: '#94a3b8', fontSize: 15, fontWeight: '600', textAlign: 'center', marginTop: 15, lineHeight: 22 }
});