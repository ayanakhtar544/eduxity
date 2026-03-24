import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebaseConfig';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';

export default function TestHistoryScreen() {
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;
  const [historyTests, setHistoryTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentUid) return;
      try {
        // Fetch all exams
        const q = query(collection(db, 'exams_enterprise'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const allExams = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // 🔥 FILTER: Sirf wo test dikhao jisme user ka UID 'responses' object mein hai
        const attemptedExams = allExams.filter(exam => exam.responses && exam.responses[currentUid]);
        
        setHistoryTests(attemptedExams);
      } catch (error) {
        console.error("Error fetching test history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [currentUid]);

  const renderHistoryCard = ({ item }: { item: any }) => {
    const userResult = item.responses[currentUid!];
    const totalQ = item.questions?.length || 0;
    const maxMarks = totalQ * 4; // Assuming 4 marks per question
    const score = userResult.score || 0;
    const percentage = maxMarks > 0 ? Math.round((score / maxMarks) * 100) : 0;

    let progressColor = '#ef4444'; // Red for poor
    if (percentage >= 40) progressColor = '#f59e0b'; // Yellow for average
    if (percentage >= 75) progressColor = '#10b981'; // Green for excellent

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.testTitle}>{item.title}</Text>
            <Text style={styles.testDate}>Attempted Recently</Text>
          </View>
          <View style={[styles.scoreCircle, { borderColor: progressColor }]}>
            <Text style={[styles.scoreText, { color: progressColor }]}>{score}</Text>
            <Text style={styles.maxScoreText}>/{maxMarks}</Text>
          </View>
        </View>

        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: progressColor }]} />
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.outlineBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/test-analytics/${item.id}`);
            }}
          >
            <Ionicons name="analytics-outline" size={16} color="#4f46e5" />
            <Text style={styles.outlineBtnText}>View Results</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.solidBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push(`/test/${item.id}`);
            }}
          >
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.solidBtnText}>Reattempt</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Test History</Text>
        <View style={{ width: 24 }} /> 
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Loading your past tests...</Text>
        </View>
      ) : (
        <FlatList
          data={historyTests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={renderHistoryCard}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Ionicons name="time-outline" size={60} color="#cbd5e1" />
              <Text style={styles.emptyText}>You haven't attempted any tests yet.</Text>
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
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  listContainer: { padding: 15, paddingBottom: 100 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  loadingText: { marginTop: 15, color: '#64748b', fontWeight: '600' },
  emptyText: { marginTop: 15, color: '#64748b', fontWeight: '600', fontSize: 16 },
  
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0', elevation: 2, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.05, shadowRadius: 6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
  testTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  testDate: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  scoreCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  scoreText: { fontSize: 15, fontWeight: '900' },
  maxScoreText: { fontSize: 10, color: '#94a3b8', fontWeight: '700', marginTop: -2 },
  progressBg: { height: 6, backgroundColor: '#f1f5f9', marginHorizontal: 15, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  actionRow: { flexDirection: 'row', gap: 10, padding: 15 },
  outlineBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', gap: 6 },
  outlineBtnText: { color: '#4f46e5', fontWeight: '800', fontSize: 13 },
  solidBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#4f46e5', gap: 6 },
  solidBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 }
});