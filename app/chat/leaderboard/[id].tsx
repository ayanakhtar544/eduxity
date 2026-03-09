import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInDown, Layout } from 'react-native-reanimated';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

export default function LeaderboardScreen() {
  const { id } = useLocalSearchParams(); // Group ID
  const router = useRouter();
  
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🚀 FETCH TOP STUDENTS DATA
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // As a CTO trick: Hum abhi ke liye saare users fetch kar rahe hain aur unko unke "xp" (experience points) ya "score" ke hisaab se sort karenge.
        // Asli app me tum group specific scores bhi use kar sakte ho.
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('xp', 'desc'), limit(20)); // Dummy XP field assume kar rahe hain
        const snapshot = await getDocs(q);
        
        let usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Agar XP data nahi hai, toh dummy random XP daal dete hain UI test karne ke liye
        if (usersData.length > 0 && !usersData[0].xp) {
          usersData = usersData.map((u, index) => ({ ...u, xp: 1000 - (index * 45) }));
        }

        setLeaderboard(usersData);
      } catch (error) {
        console.log("Leaderboard Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text style={{ marginTop: 10, color: '#64748b', fontWeight: 'bold' }}>Loading Ranks...</Text>
      </View>
    );
  }

  // 🥇 THE PODIUM LOGIC (Top 3)
  const topThree = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  return (
    <SafeAreaView style={styles.container}>
      {/* 🔝 HEADER */}
      <LinearGradient colors={['#1e3a8a', '#1e40af']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Group Leaderboard</Text>
        <Ionicons name="trophy" size={24} color="#fde047" />
      </LinearGradient>

      {/* 🏆 THE PODIUM (Top 3 Students) */}
      {topThree.length >= 3 && (
        <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.podiumContainer}>
          
          {/* 🥈 Rank 2 */}
          <View style={[styles.podiumItem, { marginTop: 40 }]}>
            <Image source={{ uri: topThree[1]?.avatar || `https://ui-avatars.com/api/?name=${topThree[1]?.name}` }} style={[styles.podiumAvatar, { borderColor: '#cbd5e1' }]} />
            <View style={styles.badgeWrapper}><Text style={styles.badgeText}>2</Text></View>
            <Text style={styles.podiumName} numberOfLines={1}>{topThree[1]?.name?.split(' ')[0]}</Text>
            <Text style={styles.podiumXP}>{topThree[1]?.xp} XP</Text>
            <LinearGradient colors={['#e2e8f0', '#94a3b8']} style={[styles.podiumStand, { height: 100 }]} />
          </View>

          {/* 🥇 Rank 1 (The King) */}
          <View style={[styles.podiumItem, { zIndex: 10 }]}>
            <Ionicons name="recording" size={30} color="#f59e0b" style={{ position: 'absolute', top: -35, zIndex: 20 }} />
            <Image source={{ uri: topThree[0]?.avatar || `https://ui-avatars.com/api/?name=${topThree[0]?.name}` }} style={[styles.podiumAvatar, styles.kingAvatar]} />
            <View style={[styles.badgeWrapper, { backgroundColor: '#f59e0b' }]}><Text style={[styles.badgeText, { color: '#fff' }]}>1</Text></View>
            <Text style={[styles.podiumName, { fontSize: 16, fontWeight: '900', color: '#1e293b' }]} numberOfLines={1}>{topThree[0]?.name?.split(' ')[0]}</Text>
            <Text style={[styles.podiumXP, { color: '#f59e0b', fontWeight: '900' }]}>{topThree[0]?.xp} XP</Text>
            <LinearGradient colors={['#fde68a', '#f59e0b']} style={[styles.podiumStand, { height: 140 }]} />
          </View>

          {/* 🥉 Rank 3 */}
          <View style={[styles.podiumItem, { marginTop: 60 }]}>
            <Image source={{ uri: topThree[2]?.avatar || `https://ui-avatars.com/api/?name=${topThree[2]?.name}` }} style={[styles.podiumAvatar, { borderColor: '#fed7aa' }]} />
            <View style={[styles.badgeWrapper, { backgroundColor: '#fdba74' }]}><Text style={styles.badgeText}>3</Text></View>
            <Text style={styles.podiumName} numberOfLines={1}>{topThree[2]?.name?.split(' ')[0]}</Text>
            <Text style={styles.podiumXP}>{topThree[2]?.xp} XP</Text>
            <LinearGradient colors={['#ffedd5', '#fdba74']} style={[styles.podiumStand, { height: 80 }]} />
          </View>
        </Animated.View>
      )}

      {/* 📜 THE REST OF THE LIST */}
      <View style={styles.listContainer}>
        <FlatList
          data={remaining}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInUp.delay(index * 100).duration(400).springify()} layout={Layout.springify()}>
              <TouchableOpacity 
                style={styles.listItem} 
                activeOpacity={0.7}
                onPress={() => router.push(`/user/${item.id}`)} // Seedha uski profile par bhejo!
              >
                <Text style={styles.listRank}>{index + 4}</Text>
                <Image source={{ uri: item.avatar || `https://ui-avatars.com/api/?name=${item.name}` }} style={styles.listAvatar} />
                <View style={{ flex: 1, marginLeft: 15 }}>
                  <Text style={styles.listName}>{item.name}</Text>
                  <Text style={styles.listSubText}>Consistent Learner</Text>
                </View>
                <View style={styles.xpBadge}>
                  <Text style={styles.xpText}>{item.xp} XP</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 FAANG-LEVEL STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingTop: 40, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  backBtn: { padding: 5 },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: '900', color: '#fff', marginLeft: 10 },

  podiumContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', marginTop: 30, paddingHorizontal: 20 },
  podiumItem: { alignItems: 'center', width: '30%', marginHorizontal: 5 },
  podiumAvatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 3, backgroundColor: '#fff' },
  kingAvatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#f59e0b' },
  badgeWrapper: { position: 'absolute', top: 45, backgroundColor: '#fff', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  badgeText: { fontSize: 12, fontWeight: '900', color: '#64748b' },
  podiumName: { marginTop: 15, fontSize: 13, fontWeight: '800', color: '#475569' },
  podiumXP: { fontSize: 11, fontWeight: '700', color: '#64748b', marginTop: 2, marginBottom: 8 },
  podiumStand: { width: '100%', borderTopLeftRadius: 16, borderTopRightRadius: 16, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 5 },

  listContainer: { flex: 1, backgroundColor: '#fff', marginTop: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 20, elevation: 10 },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  listRank: { fontSize: 16, fontWeight: '900', color: '#94a3b8', width: 25 },
  listAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#e2e8f0' },
  listName: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  listSubText: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  xpBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  xpText: { color: '#d97706', fontWeight: '800', fontSize: 13 },
});