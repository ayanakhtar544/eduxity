import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  ActivityIndicator, SafeAreaView, StatusBar, ScrollView, Dimensions, Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams(); 
  const router = useRouter();
  
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchUser = async () => {
      try {
        const docRef = doc(db, 'users', id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      } catch (error) {
        console.log("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  }

  if (!userData) {
    return <View style={styles.center}><Text style={styles.errorText}>User not found</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* 🎨 COVER PHOTO & HEADER */}
        <View style={styles.coverContainer}>
          <LinearGradient colors={['#1e3a8a', '#3b82f6', '#93c5fd']} style={styles.coverImage} />
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* 👤 PROFILE INFO SECTION */}
        <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: userData.profilePic || `https://ui-avatars.com/api/?name=${userData.name}` }} style={styles.avatar} />
          </View>
          
          <Text style={styles.name}>{userData.name}</Text>
          <Text style={styles.username}>@{userData.username || `user_${userData.uid.substring(0,5)}`}</Text>
          
          <Text style={styles.bio}>
            {userData.bio || "JEE/NEET Aspirant 🚀 | Hard work beats talent when talent doesn't work hard."}
          </Text>

          {/* 📊 STATS BOARD */}
          <View style={styles.statsBoard}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{userData.level || 1}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{userData.xp || 0}</Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{userData.class || '11th'}</Text>
              <Text style={styles.statLabel}>Class</Text>
            </View>
          </View>

          {/* 🤝 ACTION BUTTONS */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.connectBtn} activeOpacity={0.8}>
              <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.btnGradient}>
                <Ionicons name="person-add" size={18} color="#fff" />
                <Text style={styles.connectBtnText}>Connect</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.messageBtn} activeOpacity={0.8}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#3b82f6" />
            </TouchableOpacity>
          </View>

        </Animated.View>

        {/* 🏆 RECENT ACHIEVEMENTS / POSTS (Dummy UI for now) */}
        <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.emptyActivityBox}>
            <Ionicons name="school-outline" size={40} color="#cbd5e1" />
            <Text style={styles.emptyActivityText}>No recent activity found.</Text>
          </View>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

// --- 🎨 INSTAGRAM LEVEL STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#94a3b8', fontWeight: '700' },
  
  coverContainer: { height: 160, position: 'relative' },
  coverImage: { flex: 1 },
  backBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, left: 15, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  
  profileSection: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30, paddingHorizontal: 20, alignItems: 'center', paddingBottom: 25, elevation: 5, shadowColor: '#000', shadowOffset: {width: 0, height: -2}, shadowOpacity: 0.1, shadowRadius: 10 },
  avatarWrapper: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginTop: -55, elevation: 5, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.15, shadowRadius: 10, borderWidth: 4, borderColor: '#fff' },
  avatar: { width: 102, height: 102, borderRadius: 51, backgroundColor: '#e2e8f0' },
  
  name: { fontSize: 24, fontWeight: '900', color: '#0f172a', marginTop: 12 },
  username: { fontSize: 14, color: '#3b82f6', fontWeight: '700', marginTop: 2 },
  bio: { fontSize: 14, color: '#475569', textAlign: 'center', marginTop: 15, paddingHorizontal: 20, lineHeight: 22 },
  
  statsBoard: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 20, paddingVertical: 15, width: '100%', marginTop: 20, justifyContent: 'space-evenly', alignItems: 'center' },
  statBox: { alignItems: 'center', flex: 1 },
  statNumber: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  statLabel: { fontSize: 11, color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginTop: 4 },
  statDivider: { width: 1, height: 30, backgroundColor: '#cbd5e1' },
  
  actionRow: { flexDirection: 'row', width: '100%', marginTop: 20, gap: 15 },
  connectBtn: { flex: 1, borderRadius: 14, overflow: 'hidden', elevation: 3, shadowColor: '#2563eb', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.2, shadowRadius: 8 },
  btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  connectBtnText: { color: '#fff', fontSize: 15, fontWeight: '800', marginLeft: 8 },
  messageBtn: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#bfdbfe' },
  
  achievementsSection: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 15 },
  emptyActivityBox: { backgroundColor: '#fff', borderRadius: 20, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  emptyActivityText: { fontSize: 14, color: '#94a3b8', fontWeight: '600', marginTop: 10 },
});