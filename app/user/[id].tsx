import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  ScrollView, ActivityIndicator, SafeAreaView, Dimensions, StatusBar 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';

const { width } = Dimensions.get('window');

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams(); 
  const router = useRouter();
  
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Stats'); 
  const [isFollowing, setIsFollowing] = useState(false);

  const currentUserId = auth.currentUser?.uid;

  // 🚀 Fetch User Data from Firebase
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!id) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', id as string));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          if (data.followers && currentUserId && data.followers.includes(currentUserId)) {
            setIsFollowing(true);
          }
        }
      } catch (error) {
        console.log("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [id, currentUserId]);

  // 🤝 Follow / Unfollow Logic
  const toggleFollow = async () => {
    if (!currentUserId || !userData) return;
    
    const userRef = doc(db, 'users', id as string);
    const currentUserRef = doc(db, 'users', currentUserId);

    try {
      if (isFollowing) {
        setIsFollowing(false);
        setUserData((prev: any) => ({ ...prev, followerCount: Math.max(0, (prev.followerCount || 1) - 1) }));
        await updateDoc(userRef, { followers: arrayRemove(currentUserId), followerCount: userData.followerCount - 1 });
        await updateDoc(currentUserRef, { following: arrayRemove(id) });
      } else {
        setIsFollowing(true);
        setUserData((prev: any) => ({ ...prev, followerCount: (prev.followerCount || 0) + 1 }));
        await updateDoc(userRef, { followers: arrayUnion(currentUserId), followerCount: (userData.followerCount || 0) + 1 });
        await updateDoc(currentUserRef, { following: arrayUnion(id) });
      }
    } catch (error) {
      console.log("Follow toggle error:", error);
    }
  };

  // 🛑 SAFETY CHECK: Pehle loading aur null check, uske baad variables nikalenge
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.loaderContainer}>
        <Ionicons name="person-circle-outline" size={80} color="#cbd5e1" />
        <Text style={{ marginTop: 10, fontSize: 18, color: '#64748b', fontWeight: 'bold' }}>User not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, padding: 10, backgroundColor: '#f1f5f9', borderRadius: 10 }}>
          <Text style={{ fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ✅ Aab safely variables nikal sakte hain kyunki userData exist karta hai
  const level = userData.gamification?.level || 1;
  const xp = userData.gamification?.xp || 0;
  const eduCoins = userData.gamification?.eduCoins || 0;
  const currentStreak = userData.gamification?.currentStreak || 0;
  const solvedQuestions = userData.gamification?.solvedQuestions || 0;
  const totalPosts = userData.postCount || 0;
  
  // Dummy data fallback for UI presentation
  const targetExam = userData.targetExam || 'JEE Advanced';
  const bio = userData.bio || 'Future IITian 🚀 | Keep grinding!';
  const subjects = userData.topSubjects || ['Physics', 'Mathematics', 'Chemistry'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* 🎨 COVER PHOTO */}
        <View style={styles.coverPhotoContainer}>
          <Image 
            source={{ uri: userData.coverPhoto || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1000&auto=format&fit=crop' }} 
            style={styles.coverPhoto} 
          />
          <LinearGradient colors={['rgba(0,0,0,0.5)', 'transparent']} style={styles.headerGradient}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuBtn}>
              <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* 👤 PROFILE INFO SECTION */}
        <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.profileInfoContainer}>
          
          {/* Avatar (Overlapping Cover) */}
          <View style={styles.avatarWrapper}>
            <Image 
              source={{ uri: userData.avatar || `https://ui-avatars.com/api/?name=${userData.name}&size=200` }} 
              style={styles.avatar} 
            />
            {/* Real Level Badge */}
            <View style={styles.levelBadge}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>LVL {level}</Text>
            </View>
            {/* Fire Streak Badge */}
            {currentStreak > 0 && (
              <View style={styles.streakBadge}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#d97706' }}>🔥 {currentStreak}</Text>
              </View>
            )}
          </View>

          {/* Name & Target */}
          <View style={styles.nameSection}>
            <Text style={styles.userName}>{userData.name}</Text>
            <Text style={styles.userTagline}>🎯 Target: {targetExam}</Text>
            <Text style={styles.userBio}>{bio}</Text>
          </View>

          {/* 👥 SOCIAL STATS (Posts, Followers, Following) */}
          <View style={styles.socialStatsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{totalPosts}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{userData.followerCount || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{userData.followingCount || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          {/* 🎮 GAMIFICATION STATS ROW (The Flex Zone) */}
          <View style={styles.gamificationRow}>
            <View style={styles.gamificationBox}>
              <Ionicons name="star" size={20} color="#f59e0b" />
              <Text style={styles.gamificationValue}>{level}</Text>
              <Text style={styles.gamificationLabel}>Rank</Text>
            </View>
            <View style={styles.gamificationBox}>
              <Ionicons name="flash" size={20} color="#3b82f6" />
              <Text style={styles.gamificationValue}>{xp}</Text>
              <Text style={styles.gamificationLabel}>Total XP</Text>
            </View>
            <View style={styles.gamificationBox}>
              <Ionicons name="cash" size={20} color="#10b981" />
              <Text style={styles.gamificationValue}>{eduCoins}</Text>
              <Text style={styles.gamificationLabel}>Coins</Text>
            </View>
          </View>

          {/* 🔘 ACTION BUTTONS */}
          {currentUserId !== id && (
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={[styles.primaryBtn, isFollowing ? styles.followingBtn : {}]} 
                onPress={toggleFollow}
              >
                <Ionicons name={isFollowing ? "checkmark" : "person-add"} size={18} color={isFollowing ? "#1e293b" : "#fff"} />
                <Text style={[styles.primaryBtnText, isFollowing ? { color: '#1e293b' } : {}]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push(`/chat/private/${id}`)}>
                <Ionicons name="chatbubble-ellipses" size={18} color="#1e293b" />
                <Text style={styles.secondaryBtnText}>Message</Text>
              </TouchableOpacity>
            </View>
          )}

        </Animated.View>

        {/* 📑 TAB NAVIGATION */}
        <View style={styles.tabContainer}>
          {['Stats', 'Badges', 'About'].map((tab) => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 📄 TAB CONTENT */}
        <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.tabContent}>
          
          {/* 📊 STATS TAB (Super Detailed) */}
          {activeTab === 'Stats' && (
            <View style={styles.contentSection}>
              <Text style={styles.sectionTitle}>Academic Performance</Text>
              
              <View style={styles.detailedStatsGrid}>
                {/* Total Solved */}
                <View style={styles.detailedStatCard}>
                  <View style={[styles.iconWrapper, {backgroundColor: '#e0e7ff'}]}>
                    <Ionicons name="checkbox" size={24} color="#4f46e5" />
                  </View>
                  <Text style={styles.detailedStatValue}>{solvedQuestions}</Text>
                  <Text style={styles.detailedStatLabel}>Questions Solved</Text>
                </View>

                {/* Fire Streak */}
                <View style={styles.detailedStatCard}>
                  <View style={[styles.iconWrapper, {backgroundColor: '#ffedd5'}]}>
                    <Ionicons name="flame" size={24} color="#ea580c" />
                  </View>
                  <Text style={styles.detailedStatValue}>{currentStreak} Days</Text>
                  <Text style={styles.detailedStatLabel}>Current Streak</Text>
                </View>

                {/* Homeworks */}
                <View style={styles.detailedStatCard}>
                  <View style={[styles.iconWrapper, {backgroundColor: '#dcfce7'}]}>
                    <Ionicons name="folder-open" size={24} color="#16a34a" />
                  </View>
                  <Text style={styles.detailedStatValue}>{userData.homeworkCompleted || 0}</Text>
                  <Text style={styles.detailedStatLabel}>Homeworks Done</Text>
                </View>

                {/* Avg Score */}
                <View style={styles.detailedStatCard}>
                  <View style={[styles.iconWrapper, {backgroundColor: '#fce7f3'}]}>
                    <Ionicons name="analytics" size={24} color="#db2777" />
                  </View>
                  <Text style={styles.detailedStatValue}>{userData.averageScore || '0%'}</Text>
                  <Text style={styles.detailedStatLabel}>Avg. Test Score</Text>
                </View>
              </View>
            </View>
          )}

          {/* 🏅 BADGES TAB */}
          {activeTab === 'Badges' && (
            <View style={styles.contentSection}>
              <Text style={styles.sectionTitle}>Earned Badges</Text>
              <View style={styles.badgesGrid}>
                <View style={styles.badgeItem}>
                  <LinearGradient colors={['#fde68a', '#f59e0b']} style={styles.badgeIconBg}>
                    <Ionicons name="flame" size={32} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.badgeName}>Streak Master</Text>
                </View>
                <View style={styles.badgeItem}>
                  <LinearGradient colors={['#bfdbfe', '#3b82f6']} style={styles.badgeIconBg}>
                    <Ionicons name="school" size={32} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.badgeName}>Topper</Text>
                </View>
                <View style={styles.badgeItem}>
                  <LinearGradient colors={['#fecdd3', '#e11d48']} style={styles.badgeIconBg}>
                    <Ionicons name="heart" size={32} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.badgeName}>Helper</Text>
                </View>
              </View>
            </View>
          )}

          {/* ℹ️ ABOUT TAB */}
          {activeTab === 'About' && (
            <View style={styles.contentSection}>
              <Text style={styles.sectionTitle}>Strong Subjects</Text>
              <View style={styles.skillsContainer}>
                {subjects.map((sub: string, index: number) => (
                  <View key={index} style={styles.skillBadge}>
                    <Text style={styles.skillText}>{sub}</Text>
                  </View>
                ))}
              </View>

              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Personal Info</Text>
              <View style={styles.infoRow}>
                <Ionicons name="location" size={20} color="#64748b" />
                <Text style={styles.infoText}>{userData.location || 'India'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="calendar" size={20} color="#64748b" />
                <Text style={styles.infoText}>Joined {userData.createdAt ? new Date(userData.createdAt.toDate()).toLocaleDateString() : 'recently'}</Text>
              </View>
            </View>
          )}

        </Animated.View>
        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  
  coverPhotoContainer: { height: 180, width: '100%', position: 'relative' },
  coverPhoto: { width: '100%', height: '100%', resizeMode: 'cover' },
  headerGradient: { position: 'absolute', top: 0, width: '100%', height: 90, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, paddingTop: 40 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  menuBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },

  profileInfoContainer: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, paddingHorizontal: 20, paddingBottom: 20, alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 10 },
  
  avatarWrapper: { position: 'relative', marginTop: -50, marginBottom: 10 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#fff', backgroundColor: '#e2e8f0' },
  levelBadge: { position: 'absolute', bottom: -5, alignSelf: 'center', backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 2, borderColor: '#fff' },
  streakBadge: { position: 'absolute', top: -5, right: -10, backgroundColor: '#fef3c7', borderRadius: 15, padding: 5, elevation: 2, borderWidth: 1, borderColor: '#f59e0b' },

  nameSection: { alignItems: 'center', marginBottom: 20 },
  userName: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  userTagline: { fontSize: 14, color: '#2563eb', fontWeight: '700', marginTop: 4 },
  userBio: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 8, paddingHorizontal: 20, lineHeight: 18 },

  socialStatsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%', marginBottom: 15 },
  statBox: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  statLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: '#e2e8f0' },

  gamificationRow: { flexDirection: 'row', backgroundColor: '#f8fafc', padding: 15, borderRadius: 16, width: '100%', justifyContent: 'space-around', marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  gamificationBox: { alignItems: 'center' },
  gamificationValue: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginTop: 4 },
  gamificationLabel: { fontSize: 11, color: '#64748b', fontWeight: '700', marginTop: 2 },

  actionRow: { flexDirection: 'row', justifyContent: 'center', width: '100%', gap: 10 },
  primaryBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  followingBtn: { backgroundColor: '#e2e8f0' },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 14, marginLeft: 6 },
  secondaryBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#f1f5f9', paddingVertical: 12, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  secondaryBtnText: { color: '#1e293b', fontWeight: '800', fontSize: 14, marginLeft: 6 },

  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', marginTop: 10, paddingHorizontal: 10, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  tabBtn: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderColor: 'transparent' },
  tabBtnActive: { borderColor: '#2563eb' },
  tabText: { fontSize: 14, fontWeight: '700', color: '#94a3b8' },
  tabTextActive: { color: '#2563eb' },

  tabContent: { padding: 20 },
  contentSection: { backgroundColor: '#fff', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 15 },

  detailedStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  detailedStatCard: { width: '48%', backgroundColor: '#f8fafc', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  iconWrapper: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  detailedStatValue: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  detailedStatLabel: { fontSize: 11, color: '#64748b', fontWeight: '600', marginTop: 2 },

  badgesGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  badgeItem: { alignItems: 'center' },
  badgeIconBg: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 8, elevation: 3 },
  badgeName: { fontSize: 11, fontWeight: '700', color: '#475569' },

  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillBadge: { backgroundColor: '#dbeafe', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  skillText: { color: '#2563eb', fontWeight: '700', fontSize: 12 },
  
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infoText: { fontSize: 14, color: '#475569', fontWeight: '500', marginLeft: 10 },
});