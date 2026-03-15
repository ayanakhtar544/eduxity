import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  SafeAreaView, StatusBar, ActivityIndicator, Image, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebaseConfig';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function TestHistoryScreen() {
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;

  const [activeTab, setActiveTab] = useState<'attempted' | 'created'>('attempted');
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTests();
  }, [activeTab]);

  const fetchTests = async () => {
    if (!currentUid) return;
    setLoading(true);
    try {
      let q;
      if (activeTab === 'created') {
        // Sirf wo test jo maine banaye hain
        q = query(
          collection(db, 'posts'), 
          where('type', '==', 'live_test'),
          where('authorId', '==', currentUid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        setTests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } else {
        // Wo tests jisme maine attempt kiya hai (App thodi smart search karegi)
        // Note: For large scale, maintaining a separate 'attempts' collection is better
        q = query(
          collection(db, 'posts'), 
          where('type', '==', 'live_test'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const allTests = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        // Filter in frontend for now to find where results[currentUid] exists
        const myAttempts = allTests.filter(t => t.results && t.results[currentUid]);
        setTests(myAttempts);
      }
    } catch (error) {
      console.log("Error fetching tests", error);
    } finally {
      setLoading(false);
    }
  };

  const renderTestCard = ({ item, index }: any) => {
    const isCreatedByMe = activeTab === 'created';
    const myResult = item.results ? item.results[currentUid as string] : null;

    return (
      <Animated.View entering={FadeInDown.delay(index * 100).springify()} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconBg}><Ionicons name="radio-button-on" size={16} color="#4f46e5" /></View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.testTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.testCategory}>{item.category} • {item.questions?.length} Qs</Text>
          </View>
        </View>

        {isCreatedByMe ? (
          // CREATOR VIEW (Teacher Dashboard)
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{item.totalAttempts || 0}</Text>
              <Text style={styles.statLabel}>Attempts</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{item.settings?.timerPerQuestion}s</Text>
              <Text style={styles.statLabel}>Per Question</Text>
            </View>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/post/${item.id}`)}>
              <Text style={styles.actionBtnText}>View Post</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // STUDENT VIEW (Attempt History)
          <View style={styles.resultBox}>
            <View style={{ flex: 1 }}>
              <Text style={styles.resultLabel}>My Score</Text>
              <Text style={styles.resultScore}>{myResult?.score} <Text style={{fontSize: 14, color: '#94a3b8'}}>/ {item.questions?.length * 4}</Text></Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={[styles.badge, myResult?.isKicked ? styles.badgeRed : styles.badgeGreen]}>
                <Text style={[styles.badgeText, myResult?.isKicked ? styles.badgeTextRed : styles.badgeTextGreen]}>
                  {myResult?.isKicked ? "Kicked (Cheating)" : "Completed"}
                </Text>
              </View>
              <Text style={styles.resultDate}>
                {new Date(myResult?.timestamp).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* 🔝 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Test History</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 🗂️ TABS */}
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'attempted' && styles.activeTab]} onPress={() => setActiveTab('attempted')}>
          <Text style={[styles.tabText, activeTab === 'attempted' && styles.activeTabText]}>Attempted</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'created' && styles.activeTab]} onPress={() => setActiveTab('created')}>
          <Text style={[styles.tabText, activeTab === 'created' && styles.activeTabText]}>Created by Me</Text>
        </TouchableOpacity>
      </View>

      {/* 📜 LIST */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>
      ) : (
        <FlatList
          data={tests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={renderTestCard}
          ListEmptyComponent={
            <Animated.View entering={FadeInUp} style={styles.emptyState}>
              <View style={styles.emptyIcon}><Ionicons name="folder-open" size={40} color="#cbd5e1" /></View>
              <Text style={styles.emptyText}>No Tests Found</Text>
              <Text style={styles.emptySub}>
                {activeTab === 'created' ? "You haven't created any live tests yet." : "You haven't attempted any tests yet."}
              </Text>
            </Animated.View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 10 : 20, paddingBottom: 15, backgroundColor: '#fff' },
  backBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 12 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 15, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderColor: 'transparent' },
  activeTab: { borderColor: '#4f46e5' },
  tabText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  activeTabText: { color: '#4f46e5' },

  listContent: { padding: 15, paddingBottom: 50 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderColor: '#f1f5f9', paddingBottom: 10 },
  iconBg: { backgroundColor: '#e0e7ff', padding: 10, borderRadius: 12 },
  testTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 2 },
  testCategory: { fontSize: 12, color: '#64748b', fontWeight: '600', textTransform: 'uppercase' },
  
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: 12, borderRadius: 12 },
  statBox: { alignItems: 'center' },
  statVal: { fontSize: 16, fontWeight: '900', color: '#4f46e5' },
  statLabel: { fontSize: 11, color: '#64748b', fontWeight: '700', marginTop: 2 },
  actionBtn: { backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  resultBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  resultLabel: { fontSize: 12, color: '#64748b', fontWeight: '700', textTransform: 'uppercase' },
  resultScore: { fontSize: 24, fontWeight: '900', color: '#10b981' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 5 },
  badgeGreen: { backgroundColor: '#dcfce7' },
  badgeTextGreen: { color: '#16a34a', fontSize: 10, fontWeight: '900' },
  badgeRed: { backgroundColor: '#fee2e2' },
  badgeTextRed: { color: '#ef4444', fontSize: 10, fontWeight: '900' },
  resultDate: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },

  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { backgroundColor: '#f1f5f9', padding: 20, borderRadius: 40, marginBottom: 15 },
  emptyText: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 5 },
  emptySub: { fontSize: 14, color: '#64748b', textAlign: 'center' }
});