import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, StatusBar, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebaseConfig'; 
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

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

  // 🧠 3. SMART RECOMMENDATION ALGORITHM FOR TESTS
  useEffect(() => {
    if (!allTests.length) return;

    // A. Pehle wo tests alag karo jo attempt ho chuke hain
    const attempted = allTests.filter(t => t.responses && t.responses[currentUid!]);
    setHistoryTests(attempted);

    // B. Ab jo tests bach gaye unko smart rank karo
    const available = allTests.filter(t => !t.responses || !t.responses[currentUid!]);

    if (!currentUserData) {
      setSmartAvailableTests(available);
      return;
    }

    const targetExam = currentUserData.targetExam || currentUserData.grade || 'JEE';
    const interests = currentUserData.interests || [];

    const rankedTests = available.map(test => {
      let score = 0;
      let reason = "";

      // 🎯 1. Target Exam Match (Supreme Priority)
      if (test.category === targetExam || test.title?.includes(targetExam)) {
        score += 100;
        reason = `🎯 Highly Recommended for ${targetExam}`;
      }
      // 💡 2. Interest Match (Secondary Priority)
      else if (interests.includes(test.category) || (test.tags && test.tags.some((t: string) => interests.includes(t)))) {
        score += 50;
        reason = `💡 Based on your interest in ${test.category || 'this subject'}`;
      }

      // 🔥 3. Popularity Engine (Social Proof)
      const attemptCount = test.responses ? Object.keys(test.responses).length : 0;
      score += (attemptCount * 5); // Har bache ke test dene par 5 point badhenge
      if (attemptCount > 5 && !reason) {
        reason = `🔥 Popular among ${attemptCount} students`;
      }

      // ✨ 4. Freshness Gravity (Naye tests ko boost)
      const hoursOld = (Date.now() - (test.createdAt?.toMillis ? test.createdAt.toMillis() : Date.now())) / 3600000;
      if (hoursOld < 72) { // 3 din se naya
        score += 30;
        if (!reason) reason = `✨ Newly Added`;
      }

      return { 
        ...test, 
        algoScore: score, 
        algoReason: reason || "📚 Suggested for you" 
      };
    });

    // Score ke hisaab se descending order mein sort kardo
    rankedTests.sort((a, b) => b.algoScore - a.algoScore);
    
    setSmartAvailableTests(rankedTests);
  }, [allTests, currentUserData, currentUid]);

  // ==========================================
  // 🎨 RENDER: AVAILABLE TEST CARD (Now with Smart Tags)
  // ==========================================
  const renderAvailableTest = ({ item }: { item: any }) => (
    <View style={styles.testCard}>
      <LinearGradient colors={['#312e81', '#4f46e5']} style={styles.cardHeader}>
        
        {/* 🔥 SMART ALGO REASON BADGE 🔥 */}
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
          <View style={styles.badge}><Text style={styles.badgeText}>{item.ntaFormat ? 'NTA MOCK' : 'LIVE TEST'}</Text></View>
          {item.algoReason && (
             <View style={styles.algoBadge}>
               <Text style={styles.algoBadgeText}>{item.algoReason}</Text>
             </View>
          )}
        </View>

        <Text style={styles.testTitle}>{item.title}</Text>
        
        <View style={styles.metaRow}>
          <Ionicons name="help-circle-outline" size={14} color="#cbd5e1" />
          <Text style={styles.metaText}>{item.questions?.length || 0} Questions</Text>
          <Text style={styles.metaDot}>•</Text>
          <Ionicons name="time-outline" size={14} color="#cbd5e1" />
          <Text style={styles.metaText}>{item.settings?.totalDuration || 180} Mins</Text>
        </View>
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

  // ==========================================
  // 🎨 RENDER: HISTORY TEST CARD 
  // ==========================================
  const renderHistoryTest = ({ item }: { item: any }) => {
    const userResult = item.responses[currentUid!]; 
    const totalQ = item.questions?.length || 0;
    const maxMarks = totalQ * 4; 
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
            <Text style={styles.historyDate}>Completed</Text>
          </View>
          <View style={[styles.scoreCircle, { borderColor: progressColor }]}>
            <Text style={[styles.scoreText, { color: progressColor }]}>{score}</Text>
            <Text style={styles.maxScoreText}>/{maxMarks}</Text>
          </View>
        </View>
        
        <View style={styles.historyProgressBg}>
          <View style={[styles.historyProgressFill, { width: `${percentage}%`, backgroundColor: progressColor }]} />
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
            <Text style={styles.historyBtnOutlineText}>View Results</Text>
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

      {/* CONTENT LIST */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Loading smart tests...</Text>
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
              <Ionicons name={activeTab === 'AVAILABLE' ? "document-text-outline" : "time-outline"} size={60} color="#cbd5e1" />
              <Text style={styles.emptyText}>
                {activeTab === 'AVAILABLE' ? "No new tests available right now." : "You haven't attempted any tests yet."}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  backBtn: { padding: 5 }, headerTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderColor: 'transparent' },
  activeTab: { borderColor: '#4f46e5' },
  tabText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  activeTabText: { color: '#4f46e5', fontWeight: '900' },
  listContainer: { padding: 15, paddingBottom: 40 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  loadingText: { marginTop: 15, color: '#64748b', fontWeight: '600' },
  emptyText: { marginTop: 15, color: '#64748b', fontWeight: '600', fontSize: 16 },
  
  // Available Card Styles
  testCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 15, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { padding: 20 }, 
  badge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 10 },
  badgeText: { color: '#fde047', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  algoBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(253, 224, 71, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 10 },
  algoBadgeText: { color: '#fde047', fontSize: 10, fontWeight: '800' },
  testTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center' }, metaText: { color: '#cbd5e1', fontSize: 13, fontWeight: '600', marginLeft: 4 }, metaDot: { color: '#cbd5e1', marginHorizontal: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff' },
  authorText: { color: '#64748b', fontSize: 12, fontWeight: '700' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4f46e5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  // History Card Styles
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
  historyTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  historyDate: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  scoreCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  scoreText: { fontSize: 14, fontWeight: '900' }, maxScoreText: { fontSize: 9, color: '#94a3b8', fontWeight: '700', marginTop: -2 },
  historyProgressBg: { height: 6, backgroundColor: '#f1f5f9', marginHorizontal: 15, borderRadius: 3, overflow: 'hidden' },
  historyProgressFill: { height: '100%', borderRadius: 3 },
  historyFooter: { flexDirection: 'row', gap: 10, padding: 15 },
  historyBtnOutline: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', gap: 6 },
  historyBtnOutlineText: { color: '#4f46e5', fontWeight: '700', fontSize: 13 },
  historyBtnSolid: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: '#4f46e5', gap: 6 },
  historyBtnSolidText: { color: '#fff', fontWeight: '700', fontSize: 13 }
});