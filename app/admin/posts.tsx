import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, 
  Alert, RefreshControl, Platform, StatusBar, ScrollView, TextInput, Keyboard 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

// FIREBASE
import { db } from '../../firebaseConfig';
import { collection, query, orderBy, getDocs, doc, deleteDoc, limit } from 'firebase/firestore';

// 🗂️ FILTER CATEGORIES
const FILTER_TYPES = [
  { id: 'ALL', label: 'All Types' },
  { id: 'concept_micro', label: 'Concepts 💡' },
  { id: 'quiz_mcq', label: 'MCQs 🎯' },
  { id: 'flashcard', label: 'Flashcards 🃏' },
  { id: 'mini_game_match', label: 'Match Games 🧩' },
  { id: 'quiz_tf', label: 'True/False ⚖️' }
];

const FILTER_CLASSES = ['ALL', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'Dropper'];
const FILTER_DIFFICULTIES = ['ALL', 'Easy', 'Medium', 'Advanced', 'Hard', 'Hardcore'];

export default function AdminAIPostsScreen() {
  const router = useRouter();
  
  // 💾 RAW DATA STATE
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 🔍 ADVANCED FILTER STATES
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedDiff, setSelectedDiff] = useState('ALL');

  // 📡 FETCH AI POSTS (GOD MODE)
  const fetchAIPosts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'ai_feed_items'), orderBy('createdAt', 'desc'), limit(300)); // Increased limit for better filtering
      const snap = await getDocs(q);
      const fetchedData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllPosts(fetchedData);
    } catch (error) {
      console.error("Admin Fetch Error: ", error);
      Alert.alert("Error", "Failed to load posts.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAIPosts();
  }, []);

  // 🧠 THE DEEP FILTER ENGINE (Instant Multi-level filtering)
  const filteredPosts = useMemo(() => {
    return allPosts.filter(post => {
      // 1. Type Match
      if (selectedType !== 'ALL' && post.type !== selectedType) return false;

      // 2. Class Match (Checking userClass field saved in DB)
      if (selectedClass !== 'ALL') {
        const postClass = post.userClass || 'Not specified';
        // Relaxed match string logic
        if (!postClass.toLowerCase().includes(selectedClass.toLowerCase().replace('class ', ''))) return false;
      }

      // 3. Difficulty Match
      if (selectedDiff !== 'ALL') {
        const postDiff = post.difficulty || 'Medium';
        if (!postDiff.toLowerCase().includes(selectedDiff.toLowerCase())) return false;
      }

      // 4. Deep Keyword Search
      if (searchQuery.trim() !== '') {
        const queryText = searchQuery.toLowerCase();
        const safeContentString = JSON.stringify(post.content || {}).toLowerCase();
        const topicString = (post.topic || '').toLowerCase();
        
        if (!topicString.includes(queryText) && !safeContentString.includes(queryText)) return false;
      }

      return true; // Post survives the gauntlet!
    });
  }, [allPosts, searchQuery, selectedType, selectedClass, selectedDiff]);

  // Active Filter Count
  const activeFilterCount = (selectedType !== 'ALL' ? 1 : 0) + (selectedClass !== 'ALL' ? 1 : 0) + (selectedDiff !== 'ALL' ? 1 : 0);

  // 🗑️ ADMIN DELETE
  const handleAdminDelete = (postId: string) => {
    Alert.alert("Delete Post", "Permanently delete this AI generated post?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          try {
            await deleteDoc(doc(db, 'ai_feed_items', postId));
            setAllPosts(prev => prev.filter(p => p.id !== postId)); 
          } catch (error) { Alert.alert("Error", "Could not delete the post."); }
        }
      }
    ]);
  };

  // 🧠 THE X-RAY RENDERER (Unchanged, perfectly handles content)
  const renderDetailedContent = (type: string, content: any) => {
    if (!content) return <Text style={styles.errorText}>No Content Found</Text>;
    switch (type) {
      case 'concept_micro': return (<View style={styles.contentBlock}><Text style={styles.contentTitle}>{content.title}</Text><Text style={styles.contentText}>{content.explanation}</Text></View>);
      case 'flashcard': return (<View style={styles.contentBlock}><View style={styles.qaBox}><Text style={styles.qaLabel}>FRONT (Q):</Text><Text style={styles.contentText}>{content.front}</Text></View><View style={[styles.qaBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', marginTop: 8 }]}><Text style={[styles.qaLabel, { color: '#16a34a' }]}>BACK (A):</Text><Text style={styles.contentText}>{content.back}</Text></View></View>);
      case 'quiz_mcq': return (<View style={styles.contentBlock}><Text style={styles.questionText}>Q: {content.question}</Text><View style={styles.optionsList}>{content.options?.map((opt: string, idx: number) => { const isCorrect = idx === content.correctAnswerIndex; return (<View key={idx} style={[styles.adminOptionBtn, isCorrect && styles.adminOptionCorrect]}><Text style={[styles.adminOptionText, isCorrect && { color: '#16a34a', fontWeight: '800' }]}>{String.fromCharCode(65 + idx)}. {opt} {isCorrect && '✅'}</Text></View>); })}</View><Text style={styles.explanationText}>💡 Expl: {content.explanation}</Text></View>);
      case 'quiz_tf': return (<View style={styles.contentBlock}><Text style={styles.questionText}>Statement: {content.statement}</Text><View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 10 }}><Text style={styles.qaLabel}>Answer: </Text><View style={[styles.tfBadge, content.isTrue ? styles.tfTrue : styles.tfFalse]}><Text style={styles.tfBadgeText}>{content.isTrue ? 'TRUE' : 'FALSE'}</Text></View></View><Text style={styles.explanationText}>💡 Expl: {content.explanation}</Text></View>);
      case 'mini_game_match': return (<View style={styles.contentBlock}><Text style={styles.qaLabel}>Match Pairs:</Text>{content.pairs?.map((pair: any, idx: number) => (<View key={idx} style={styles.pairRow}><View style={styles.termBox}><Text style={styles.termText}>{pair.term}</Text></View><Ionicons name="swap-horizontal" size={16} color="#94a3b8" style={{ marginHorizontal: 5 }} /><View style={styles.defBox}><Text style={styles.defText}>{pair.definition}</Text></View></View>))}</View>);
      default: return <Text style={styles.errorText}>Unknown Format</Text>;
    }
  };

  // 🎨 RENDER FULL CARD
  const renderPostItem = ({ item, index }: { item: any, index: number }) => {
    let badgeColor = '#e2e8f0'; let textColor = '#475569';
    if(item.type === 'concept_micro') { badgeColor = '#e0f2fe'; textColor = '#0369a1'; }
    if(item.type === 'flashcard') { badgeColor = '#f3e8ff'; textColor = '#7e22ce'; }
    if(item.type === 'quiz_mcq') { badgeColor = '#dcfce7'; textColor = '#15803d'; }
    if(item.type === 'quiz_tf') { badgeColor = '#fef3c7'; textColor = '#b45309'; }
    if(item.type === 'mini_game_match') { badgeColor = '#e0e7ff'; textColor = '#4338ca'; }

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()} style={styles.postCard}>
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5 }}>
            <View style={[styles.badge, { backgroundColor: badgeColor }]}><Text style={[styles.badgeText, { color: textColor }]}>{item.type?.replace('_', ' ').toUpperCase()}</Text></View>
            <Text style={styles.topicBadge}>{item.topic || 'General'}</Text>
          </View>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleAdminDelete(item.id)}><Ionicons name="trash" size={18} color="#ef4444" /></TouchableOpacity>
        </View>
        <View style={styles.contentWrapper}>{renderDetailedContent(item.type, item.content)}</View>
        <View style={styles.cardFooter}>
          <View style={{flexDirection: 'row', gap: 10}}>
            <Text style={styles.metaText}>📚 {item.userClass || 'Class NA'}</Text>
            <Text style={styles.metaText}>🔥 {item.difficulty || 'Medium'}</Text>
          </View>
          <Text style={styles.metaText}>ID: {item.id.slice(0,6)}</Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      
      {/* 🔝 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#0f172a" /></TouchableOpacity>
        <View><Text style={styles.headerTitle}>God Mode: Data Hub</Text><Text style={styles.headerSubTitle}>{filteredPosts.length} Results Found</Text></View>
        <View style={{ width: 40 }} /> 
      </View>

      {/* 🔍 SEARCH & FILTER BAR */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput 
            style={styles.searchInput} placeholder="Search topics, questions..." placeholderTextColor="#94a3b8"
            value={searchQuery} onChangeText={setSearchQuery} returnKeyType="search" onSubmitEditing={() => Keyboard.dismiss()}
          />
          {searchQuery.length > 0 && (<TouchableOpacity onPress={() => setSearchQuery('')}><Ionicons name="close-circle" size={20} color="#cbd5e1" /></TouchableOpacity>)}
        </View>
        <TouchableOpacity 
          style={[styles.filterToggleBtn, showFilters && styles.filterToggleBtnActive]} 
          onPress={() => { if(Platform.OS!=='web') Haptics.selectionAsync(); setShowFilters(!showFilters); }}
        >
          <Ionicons name="options" size={24} color={showFilters ? "#fff" : "#0f172a"} />
          {activeFilterCount > 0 && !showFilters && (
            <View style={styles.filterDot}><Text style={{color:'#fff', fontSize: 10, fontWeight: 'bold'}}>{activeFilterCount}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      {/* 🎛️ ADVANCED FILTER DRAWER (Collapsible) */}
      {showFilters && (
        <Animated.View entering={ZoomIn.duration(200)} style={styles.advancedFiltersDrawer}>
          
          <Text style={styles.filterLabel}>Class / Grade</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            {FILTER_CLASSES.map(cls => (
              <TouchableOpacity key={cls} style={[styles.chip, selectedClass === cls && styles.chipActive]} onPress={() => setSelectedClass(cls)}>
                <Text style={[styles.chipText, selectedClass === cls && styles.chipTextActive]}>{cls}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.filterLabel}>Difficulty Level</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            {FILTER_DIFFICULTIES.map(diff => (
              <TouchableOpacity key={diff} style={[styles.chip, selectedDiff === diff && styles.chipActive]} onPress={() => setSelectedDiff(diff)}>
                <Text style={[styles.chipText, selectedDiff === diff && styles.chipTextActive]}>{diff}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.filterLabel}>Content Format</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            {FILTER_TYPES.map(type => (
              <TouchableOpacity key={type.id} style={[styles.chip, selectedType === type.id && styles.chipActive]} onPress={() => setSelectedType(type.id)}>
                <Text style={[styles.chipText, selectedType === type.id && styles.chipTextActive]}>{type.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {activeFilterCount > 0 && (
            <TouchableOpacity 
              style={styles.clearFiltersBtn} 
              onPress={() => { setSelectedType('ALL'); setSelectedClass('ALL'); setSelectedDiff('ALL'); }}
            >
              <Ionicons name="refresh" size={16} color="#ef4444" style={{marginRight: 5}}/>
              <Text style={styles.clearFiltersText}>Reset All Filters</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}

      {/* 📜 LIST */}
      {loading && !refreshing ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>
      ) : (
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={renderPostItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAIPosts(); }} tintColor="#4f46e5" />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="funnel-outline" size={60} color="#cbd5e1" />
              <Text style={styles.emptyText}>No data matches these exact filters.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' }, 
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0', zIndex: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', textAlign: 'center' },
  headerSubTitle: { fontSize: 13, fontWeight: '700', color: '#4f46e5', textAlign: 'center', marginTop: 2 },
  
  // 🔍 Search & Filter Core
  searchSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingTop: 15, paddingBottom: 10, backgroundColor: '#fff' },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 15, height: 48, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', marginRight: 10 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#0f172a', fontWeight: '600' },
  filterToggleBtn: { width: 48, height: 48, backgroundColor: '#f8fafc', borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', position: 'relative' },
  filterToggleBtnActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  filterDot: { position: 'absolute', top: -5, right: -5, backgroundColor: '#ef4444', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  
  // 🎛️ Advanced Drawer
  advancedFiltersDrawer: { backgroundColor: '#fff', paddingHorizontal: 15, paddingBottom: 15, borderBottomWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity: 0.05, shadowRadius: 5, zIndex: 5, elevation: 3 },
  filterLabel: { fontSize: 12, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginTop: 15, marginBottom: 8 },
  chipsScroll: { gap: 8, paddingRight: 20 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#f8fafc', borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  chipText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  chipTextActive: { color: '#fff' },
  clearFiltersBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, paddingVertical: 10, backgroundColor: '#fef2f2', borderRadius: 12, borderWidth: 1, borderColor: '#fca5a5' },
  clearFiltersText: { color: '#ef4444', fontWeight: '800', fontSize: 14 },

  listContainer: { padding: 15, paddingBottom: 100 },
  postCard: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderColor: '#f1f5f9' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  topicBadge: { fontSize: 12, fontWeight: '800', color: '#64748b', backgroundColor: '#e2e8f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  deleteBtn: { backgroundColor: '#fee2e2', padding: 8, borderRadius: 10 },
  
  contentWrapper: { padding: 15 },
  contentBlock: { gap: 10 },
  contentTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  contentText: { fontSize: 15, color: '#334155', lineHeight: 24, fontWeight: '500' },
  
  qaBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  qaLabel: { fontSize: 11, fontWeight: '900', color: '#64748b', marginBottom: 4 },
  
  questionText: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 10 },
  optionsList: { gap: 6 },
  adminOptionBtn: { padding: 10, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  adminOptionCorrect: { backgroundColor: '#dcfce7', borderColor: '#86efac' },
  adminOptionText: { fontSize: 14, color: '#334155', fontWeight: '600' },
  explanationText: { fontSize: 13, color: '#64748b', fontWeight: '600', marginTop: 10, fontStyle: 'italic', backgroundColor: '#f1f5f9', padding: 10, borderRadius: 8 },
  
  tfBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  tfTrue: { backgroundColor: '#dcfce7' },
  tfFalse: { backgroundColor: '#fee2e2' },
  tfBadgeText: { fontSize: 12, fontWeight: '900', color: '#0f172a' },
  
  pairRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  termBox: { flex: 1, backgroundColor: '#f1f5f9', padding: 10, borderRadius: 8 },
  termText: { fontSize: 13, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
  defBox: { flex: 2, backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  defText: { fontSize: 13, color: '#475569', fontWeight: '600' },
  errorText: { color: '#ef4444', fontWeight: 'bold' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#f8fafc', borderTopWidth: 1, borderColor: '#f1f5f9' },
  metaText: { fontSize: 11, fontWeight: '800', color: '#94a3b8', backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0' },

  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 15, fontSize: 15, fontWeight: '700', color: '#94a3b8', textAlign: 'center', paddingHorizontal: 40 }
});