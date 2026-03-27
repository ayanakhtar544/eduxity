// Location: app/tests.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, StatusBar, RefreshControl, Platform, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebaseConfig'; 
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// 🔥 ADVANCED FILTERS CONFIG
const FILTER_CATEGORIES = [
  { id: 'ALL', label: 'All Tests' },
  { id: 'NTA', label: 'NTA Format' },
  { id: 'POPULAR', label: 'Trending 🔥' },
  { id: 'QUICK', label: 'Quick (15m) ⚡' },
  { id: 'JEE', label: 'JEE' },
  { id: 'NEET', label: 'NEET' },
  { id: 'CLASS_11', label: 'Class 11' },
  { id: 'CLASS_12', label: 'Class 12' },
  { id: 'CLASS_10', label: 'Class 10' },
  { id: 'CLASS_9', label: 'Class 9' }
];

export default function TestsHubScreen() {
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;

  const [activeTab, setActiveTab] = useState<'AVAILABLE' | 'HISTORY'>('AVAILABLE');
  const [allTests, setAllTests] = useState<any[]>([]);
  const [smartAvailableTests, setSmartAvailableTests] = useState<any[]>([]);
  const [historyTests, setHistoryTests] = useState<any[]>([]);
  
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 🔎 FILTERS & SEARCH
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  // 🔥 1. FETCH USER DATA (For Recommendation Algorithm)
  useEffect(() => {
    if (!currentUid) return;
    const fetchUser = async () => {
      const docSnap = await getDoc(doc(db, 'users', currentUid));
      if (docSnap.exists()) setCurrentUserData(docSnap.data());
    };
    fetchUser();
  }, [currentUid]);

  // 🔥 2. FETCH ALL TESTS
  const fetchTests = async () => {
    if (!currentUid) return;
    try {
      const q = query(collection(db, 'exams_enterprise'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const testsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllTests(testsData);
    } catch (error) {
      console.error("Error fetching tests:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [currentUid]);

  // 🧠 3. SMART RECOMMENDATION & FILTER ENGINE (UPGRADED)
  useEffect(() => {
    if (!allTests.length) return;

    // A. Attempted tests separation
    const attempted = allTests.filter(t => t.responses && t.responses[currentUid!]);
    setHistoryTests(attempted);

    // B. Available tests
    let available = allTests.filter(t => !t.responses || !t.responses[currentUid!]);

    // C. Apply Search (Text Based)
    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      available = available.filter(t => 
        t.title?.toLowerCase().includes(queryLower) || 
        t.category?.toLowerCase().includes(queryLower) ||
        (t.tags && t.tags.some((tag: string) => tag.toLowerCase().includes(queryLower)))
      );
    }
    
    // D. Apply Advanced Filters
    if (selectedFilter !== 'ALL') {
      if (selectedFilter === 'NTA') {
        available = available.filter(t => t.ntaFormat === true);
      } else if (selectedFilter === 'QUICK') {
        available = available.filter(t => (t.duration || t.settings?.totalDuration) <= 15);
      } else if (selectedFilter === 'POPULAR') {
        available = available.filter(t => Object.keys(t.responses || {}).length > 2); // Set to 2 for easier testing
      } else if (selectedFilter.startsWith('CLASS_')) {
        const classNum = selectedFilter.split('_')[1];
        available = available.filter(t => 
          t.category?.includes(classNum) || 
          t.title?.includes(`Class ${classNum}`) || 
          (t.tags && t.tags.includes(`Class ${classNum}`))
        );
      } else {
        // For JEE, NEET, etc.
        available = available.filter(t => 
          t.category?.toUpperCase() === selectedFilter || 
          t.title?.toUpperCase().includes(selectedFilter) ||
          (t.tags && t.tags.includes(selectedFilter))
        );
      }
    }

    // E. Algorithm Ranking Logic (Only if no strict filter is applied to maintain relevance)
    if (!currentUserData) {
      setSmartAvailableTests(available);
      return;
    }

    const targetExam = currentUserData.targetExam || currentUserData.grade || 'JEE';
    const userClass = currentUserData.class || '';
    const interests = currentUserData.interests || [];

    const rankedTests = available.map(test => {
      let score = 0;
      let reason = "";
      let matchPercent = 30; // Base match

      const titleUpper = test.title?.toUpperCase() || "";
      const categoryUpper = test.category?.toUpperCase() || "";
      const tags = test.tags || [];

      // 🎯 1. Target Exam & Class Match (HIGHEST PRIORITY)
      const matchesExam = categoryUpper.includes(targetExam.toUpperCase()) || titleUpper.includes(targetExam.toUpperCase());
      const matchesClass = userClass && (titleUpper.includes(userClass) || tags.includes(userClass));

      if (matchesExam && matchesClass) {
        score += 200;
        matchPercent += 65;
        reason = `🎯 Perfect Match For You`;
      } else if (matchesExam) {
        score += 100;
        matchPercent += 45;
        reason = `🎯 Target Exam Match`;
      } else if (matchesClass) {
        score += 80;
        matchPercent += 40;
        reason = `📚 Relevant to your Class`;
      }
      
      // 💡 2. Interest Match
      if (!reason && (interests.includes(test.category) || tags.some((t: string) => interests.includes(t)))) {
        score += 50;
        matchPercent += 25;
        reason = `💡 Based on your interests`;
      }

      // 🔥 3. Popularity Boost
      const attemptCount = test.responses ? Object.keys(test.responses).length : 0;
      score += (attemptCount * 5); 
      if (attemptCount > 5 && !reason) {
        reason = `🔥 Highly Attempted`;
        matchPercent += 15;
      }

      // ✨ 4. Freshness
      const hoursOld = (Date.now() - (test.createdAt?.toMillis ? test.createdAt.toMillis() : Date.now())) / 3600000;
      if (hoursOld < 48) {
        score += 30;
        if (!reason) reason = `✨ Newly Added`;
      }

      return { 
        ...test, 
        algoScore: score, 
        algoReason: reason || "📚 Recommended",
        matchPercent: Math.min(matchPercent, 99) 
      };
    });

    // Sort by Algo Score (Highest first)
    rankedTests.sort((a, b) => b.algoScore - a.algoScore);
    setSmartAvailableTests(rankedTests);
  }, [allTests, currentUserData, currentUid, searchQuery, selectedFilter]);

  // ==========================================
  // 🎨 RENDER: AVAILABLE TEST CARD 
  // ==========================================
  const renderAvailableTest = ({ item }: { item: any }) => {
    const maxMarks = item.questions?.reduce((sum: number, q: any) => sum + (parseInt(q.posMarks) || 4), 0) || 0;

    return (
      <View style={styles.testCard}>
        <LinearGradient colors={['#312e81', '#4f46e5']} style={styles.cardHeader} start={{x:0, y:0}} end={{x:1, y:1}}>
          
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12}}>
            <View style={styles.badge}><Text style={styles.badgeText}>{item.ntaFormat ? 'NTA MOCK TEST' : (item.category || 'LIVE TEST').toUpperCase()}</Text></View>
            <View style={styles.matchBadge}>
              <Ionicons name="flash" size={10} color="#6ee7b7" style={{marginRight: 3}}/>
              <Text style={styles.matchBadgeText}>{item.matchPercent}% Match</Text>
            </View>
          </View>

          <Text style={styles.testTitle}>{item.title}</Text>
          
          <View style={styles.metaRow}>
            <Ionicons name="list-outline" size={14} color="#cbd5e1" />
            <Text style={styles.metaText}>{item.questions?.length || 0} Qs</Text>
            <Text style={styles.metaDot}>•</Text>
            <Ionicons name="time-outline" size={14} color="#cbd5e1" />
            <Text style={styles.metaText}>{item.duration || item.settings?.totalDuration || 15} Mins</Text>
            <Text style={styles.metaDot}>•</Text>
            <Ionicons name="star-outline" size={14} color="#cbd5e1" />
            <Text style={styles.metaText}>{maxMarks} Marks</Text>
          </View>
          
          {item.algoReason && (
             <View style={styles.algoBadge}>
               <Ionicons name="sparkles" size={12} color="#fde047" style={{marginRight: 4}}/>
               <Text style={styles.algoBadgeText}>{item.algoReason}</Text>
             </View>
          )}
        </LinearGradient>
        
        <View style={styles.cardFooter}>
          <Text style={styles.authorText}>By {item.authorName || 'Scholar'}</Text>
          <TouchableOpacity 
            style={styles.actionBtn} 
            activeOpacity={0.8}
            onPress={() => {
              if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/test/${item.id}`);
            }}
          >
            <Text style={styles.actionBtnText}>Attempt Now</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" style={{marginLeft: 4}}/>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ==========================================
  // 🎨 RENDER: HISTORY TEST CARD 
  // ==========================================
  const renderHistoryTest = ({ item }: { item: any }) => {
    const userResult = item.responses[currentUid!]; 
    const maxMarks = item.questions?.reduce((sum: number, q: any) => sum + (parseInt(q.posMarks) || 4), 0) || 0;
    const score = userResult.score || 0;
    const percentage = maxMarks > 0 ? Math.round((score / maxMarks) * 100) : 0;

    let progressColor = '#ef4444'; 
    if (percentage >= 40) progressColor = '#f59e0b'; 
    if (percentage >= 75) progressColor = '#10b981'; 

    return (
      <View style={[styles.testCard, { borderColor: '#e2e8f0', borderWidth: 1 }]}>
        <View style={styles.historyHeader}>
          <View style={{flex: 1}}>
            <Text style={styles.historyTitle}>{item.title}</Text>
            <Text style={styles.historyDate}>Completed • {percentage}% Accuracy</Text>
          </View>
          <View style={[styles.scoreCircle, { borderColor: progressColor }]}>
            <Text style={[styles.scoreText, { color: progressColor }]}>{score}</Text>
            <Text style={styles.maxScoreText}>/{maxMarks}</Text>
          </View>
        </View>
        
        <View style={styles.historyProgressBg}>
          <View style={[styles.historyProgressFill, { width: `${Math.max(percentage, 5)}%`, backgroundColor: progressColor }]} />
        </View>

        <View style={styles.historyFooter}>
          <TouchableOpacity 
            style={styles.historyBtnOutline}
            activeOpacity={0.7}
            onPress={() => {
              if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/test-analytics/${item.id}`);
            }} 
          >
            <Ionicons name="analytics-outline" size={16} color="#4f46e5" />
            <Text style={styles.historyBtnOutlineText}>Analytics</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.historyBtnSolid}
            activeOpacity={0.7}
            onPress={() => {
              if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push(`/test/${item.id}`);
            }}
          >
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.historyBtnSolidText}>Reattempt</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tests Hub</Text>
        <View style={{ width: 24 }} /> 
      </View>

      {/* DYNAMIC TABS */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'AVAILABLE' && styles.activeTab]} 
          onPress={() => { setActiveTab('AVAILABLE'); if(Platform.OS !== 'web') Haptics.selectionAsync(); }}
        >
          <Text style={[styles.tabText, activeTab === 'AVAILABLE' && styles.activeTabText]}>
            Available ({smartAvailableTests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'HISTORY' && styles.activeTab]} 
          onPress={() => { setActiveTab('HISTORY'); if(Platform.OS !== 'web') Haptics.selectionAsync(); }}
        >
          <Text style={[styles.tabText, activeTab === 'HISTORY' && styles.activeTabText]}>
            My History ({historyTests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* SEARCH & FILTERS (Visible only on Available Tab) */}
      {activeTab === 'AVAILABLE' && (
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#94a3b8" />
            <TextInput 
              style={styles.searchInput}
              placeholder="Search tests by name or topic..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94a3b8"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={{padding: 5}}>
                <Ionicons name="close-circle" size={20} color="#cbd5e1" />
              </TouchableOpacity>
            )}
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {FILTER_CATEGORIES.map((filter) => (
              <TouchableOpacity 
                key={filter.id}
                style={[styles.filterBtn, selectedFilter === filter.id && styles.filterBtnActive]}
                onPress={() => {
                  if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedFilter(filter.id);
                }}
              >
                <Text style={[styles.filterBtnText, selectedFilter === filter.id && styles.filterBtnTextActive]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* CONTENT LIST */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Curating tests for you...</Text>
        </View>
      ) : (
        <FlatList
          data={activeTab === 'AVAILABLE' ? smartAvailableTests : historyTests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={activeTab === 'AVAILABLE' ? renderAvailableTest : renderHistoryTest}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTests(); }} colors={["#4f46e5"]} />}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Ionicons name={activeTab === 'AVAILABLE' ? "search-outline" : "time-outline"} size={60} color="#cbd5e1" />
              <Text style={styles.emptyText}>
                {activeTab === 'AVAILABLE' ? "No tests match your current filters." : "You haven't attempted any tests yet."}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// STYLES
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#fff' },
  backBtn: { padding: 5 }, headerTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  
  // Tabs
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f5f9' },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderColor: 'transparent' },
  activeTab: { borderColor: '#4f46e5' },
  tabText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  activeTabText: { color: '#4f46e5', fontWeight: '900' },

  // Search & Filters
  searchSection: { backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 15, height: 48, marginBottom: 12 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#0f172a', height: '100%', fontWeight: '500' },
  filterScroll: { gap: 10, paddingBottom: 5, paddingRight: 20 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  filterBtnActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  filterBtnText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  filterBtnTextActive: { color: '#fff' },

  listContainer: { padding: 15, paddingBottom: 40 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  loadingText: { marginTop: 15, color: '#64748b', fontWeight: '600' },
  emptyText: { marginTop: 15, color: '#64748b', fontWeight: '600', fontSize: 15 },
  
  // Available Card Styles
  testCard: { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', marginBottom: 16, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  cardHeader: { padding: 20 }, 
  badge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  badgeText: { color: '#fde047', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  matchBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  matchBadgeText: { color: '#6ee7b7', fontSize: 11, fontWeight: '800' },
  algoBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(253, 224, 71, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginTop: 15 },
  algoBadgeText: { color: '#fde047', fontSize: 12, fontWeight: '700' },
  testTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 12, lineHeight: 28 },
  metaRow: { flexDirection: 'row', alignItems: 'center' }, metaText: { color: '#cbd5e1', fontSize: 13, fontWeight: '700', marginLeft: 6 }, metaDot: { color: '#cbd5e1', marginHorizontal: 10, fontWeight: '900' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff' },
  authorText: { color: '#64748b', fontSize: 13, fontWeight: '700' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4f46e5', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // History Card Styles
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  historyTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  historyDate: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  scoreCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  scoreText: { fontSize: 16, fontWeight: '900' }, maxScoreText: { fontSize: 10, color: '#94a3b8', fontWeight: '700', marginTop: -2 },
  historyProgressBg: { height: 6, backgroundColor: '#f1f5f9', marginHorizontal: 18, borderRadius: 3, overflow: 'hidden' },
  historyProgressFill: { height: '100%', borderRadius: 3 },
  historyFooter: { flexDirection: 'row', gap: 12, padding: 18 },
  historyBtnOutline: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', gap: 6 },
  historyBtnOutlineText: { color: '#4f46e5', fontWeight: '800', fontSize: 14 },
  historyBtnSolid: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#4f46e5', gap: 6 },
  historyBtnSolidText: { color: '#fff', fontWeight: '800', fontSize: 14 }
});