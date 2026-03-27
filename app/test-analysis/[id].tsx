// Location: app/test-analysis/[id].tsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  ActivityIndicator, ScrollView, StatusBar, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig'; 
import * as Haptics from 'expo-haptics';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

export default function TestAnalysisScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;

  const [testData, setTestData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<any[]>([]);

  // ==========================================
  // 🚀 1. FETCH TEST DATA & RESPONSES
  // ==========================================
  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'exams_enterprise', id as string);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTestData(data);

          // Firebase se responses Map ko Array me convert karna
          if (data.responses) {
            const rawResponses = Object.entries(data.responses).map(([uid, val]: any) => ({
              uid,
              ...val
            }));

            // 🏆 SORTING ALGORITHM: Pehle Score zyada ho, agar score same ho toh Time kam laga ho
            rawResponses.sort((a, b) => {
              if (b.score !== a.score) return b.score - a.score;
              return (a.timeTaken || 0) - (b.timeTaken || 0);
            });

            setParticipants(rawResponses);
          }
        }
      } catch (error) {
        console.error("Error fetching analysis:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [id]);

  // ==========================================
  // 🧠 2. SMART MATHS & ANALYTICS
  // ==========================================
  const stats = useMemo(() => {
    if (participants.length === 0) return { total: 0, average: 0, maxScore: 0, topper: null };

    const total = participants.length;
    const totalScoreSum = participants.reduce((acc, curr) => acc + (curr.score || 0), 0);
    const average = (totalScoreSum / total).toFixed(1);
    const topper = participants[0]; // Kyunki array already sorted hai

    return { total, average, maxScore: topper.score, topper };
  }, [participants]);

  const maxPossibleMarks = testData?.questions?.length || 0; // Assuming 1 mark per question (Update as per your logic)

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Generating Analytics...</Text>
      </View>
    );
  }

  if (!testData) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="warning" size={40} color="#cbd5e1" />
        <Text style={styles.errorText}>Test data not found.</Text>
        <TouchableOpacity style={styles.backBtnError} onPress={() => router.back()}>
          <Text style={{color: '#fff', fontWeight: '800'}}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* 🌌 DARK PREMIUM HEADER */}
      <View style={styles.headerBg}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Test Analytics</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.testName} numberOfLines={1}>{testData.title}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {participants.length === 0 ? (
          <Animated.View entering={FadeInDown} style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={60} color="#cbd5e1" />
            <Text style={styles.emptyText}>No one has attempted this test yet.</Text>
            <Text style={styles.emptySub}>Share the test link with your students to see analytics here.</Text>
          </Animated.View>
        ) : (
          <>
            {/* 📊 1. STATS CARDS */}
            <View style={styles.statsGrid}>
              <Animated.View entering={FadeInDown.delay(100)} style={styles.statCard}>
                <View style={[styles.statIconBg, { backgroundColor: '#e0e7ff' }]}>
                  <Ionicons name="people" size={20} color="#4f46e5" />
                </View>
                <Text style={styles.statValue}>{stats.total}</Text>
                <Text style={styles.statLabel}>Participants</Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(200)} style={styles.statCard}>
                <View style={[styles.statIconBg, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="calculator" size={20} color="#ec4899" />
                </View>
                <Text style={styles.statValue}>{stats.average} <Text style={styles.statSmall}>/ {maxPossibleMarks}</Text></Text>
                <Text style={styles.statLabel}>Avg. Score</Text>
              </Animated.View>
            </View>

            {/* 👑 2. THE TOPPER SPOTLIGHT */}
            {stats.topper && (
              <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.topperCard}>
                <LinearGradient colors={['#f59e0b', '#fbbf24']} style={styles.topperGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
                  <View style={styles.crownIcon}><Ionicons name="trophy" size={24} color="#f59e0b" /></View>
                  <Text style={styles.topperTag}>RANK 1 • TOPPER</Text>
                  <Image source={{ uri: stats.topper.userAvatar || DEFAULT_AVATAR }} style={styles.topperAvatar} />
                  <Text style={styles.topperName}>{stats.topper.userName || 'Scholar'}</Text>
                  <View style={styles.topperScoreRow}>
                    <Text style={styles.topperScore}>{stats.topper.score} <Text style={{fontSize: 14, color: '#fff', opacity: 0.8}}>Marks</Text></Text>
                  </View>
                </LinearGradient>
              </Animated.View>
            )}

            {/* 📝 3. FULL LEADERBOARD */}
            <View style={styles.listHeaderRow}>
              <Text style={styles.listHeaderTitle}>All Results</Text>
              <Text style={styles.listHeaderSub}>{participants.length} Students</Text>
            </View>

            <View style={styles.leaderboardContainer}>
              {participants.map((p, index) => {
                const isTopper = index === 0;
                return (
                  <Animated.View key={p.uid} entering={FadeInUp.delay(400 + (index * 50))} layout={Layout.springify()} style={styles.studentRow}>
                    <View style={styles.rankCircle}>
                      <Text style={[styles.rankText, isTopper && {color: '#f59e0b'}]}>#{index + 1}</Text>
                    </View>
                    <Image source={{ uri: p.userAvatar || DEFAULT_AVATAR }} style={styles.studentAvatar} />
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName} numberOfLines={1}>{p.userName || 'Student'}</Text>
                      {p.timeTaken && <Text style={styles.studentTime}>Time: {Math.floor(p.timeTaken / 60)}m {p.timeTaken % 60}s</Text>}
                    </View>
                    <View style={styles.scorePill}>
                      <Text style={styles.scorePillText}>{p.score}</Text>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 PREMIUM STYLING
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { marginTop: 15, color: '#64748b', fontWeight: '700' },
  errorText: { marginTop: 15, color: '#0f172a', fontWeight: '800', fontSize: 16 },
  backBtnError: { marginTop: 20, backgroundColor: '#4f46e5', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },

  // HEADER
  headerBg: { backgroundColor: '#0f172a', paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingTop: Platform.OS === 'ios' ? 10 : 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  testName: { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginTop: 10, paddingHorizontal: 20, fontWeight: '500' },

  scrollContent: { padding: 20, paddingBottom: 100 },

  // EMPTY STATE
  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 30 },
  emptyText: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginTop: 15, textAlign: 'center' },
  emptySub: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 8, lineHeight: 20 },

  // STATS GRID
  statsGrid: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#fff', padding: 20, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  statIconBg: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  statSmall: { fontSize: 14, color: '#94a3b8', fontWeight: '600' },
  statLabel: { fontSize: 13, color: '#64748b', fontWeight: '600', marginTop: 4 },

  // TOPPER SPOTLIGHT
  topperCard: { marginBottom: 25, borderRadius: 24, overflow: 'hidden', shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  topperGradient: { padding: 25, alignItems: 'center', position: 'relative' },
  crownIcon: { position: 'absolute', top: 15, right: 15, backgroundColor: '#fff', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  topperTag: { color: '#78350f', fontSize: 12, fontWeight: '900', letterSpacing: 1, marginBottom: 15 },
  topperAvatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#fff', marginBottom: 15, backgroundColor: '#fef3c7' },
  topperName: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 5 },
  topperScoreRow: { backgroundColor: 'rgba(0,0,0,0.15)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 15, marginTop: 5 },
  topperScore: { color: '#fff', fontSize: 18, fontWeight: '900' },

  // LEADERBOARD LIST
  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15 },
  listHeaderTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  listHeaderSub: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  
  leaderboardContainer: { backgroundColor: '#fff', borderRadius: 20, padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  studentRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  rankCircle: { width: 30, alignItems: 'center' },
  rankText: { fontSize: 14, fontWeight: '900', color: '#64748b' },
  studentAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e2e8f0', marginLeft: 5 },
  studentInfo: { flex: 1, marginLeft: 12 },
  studentName: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  studentTime: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginTop: 2 },
  scorePill: { backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  scorePillText: { color: '#4f46e5', fontWeight: '900', fontSize: 14 },
});