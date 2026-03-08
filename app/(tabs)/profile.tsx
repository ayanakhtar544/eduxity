import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  SafeAreaView, StatusBar, ActivityIndicator, FlatList, Alert, Dimensions 
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../../firebaseConfig';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeInDown, SlideInRight } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

export default function ProfileScreen() {
  const router = useRouter();
  const user = auth.currentUser;

  // 🧠 State Management
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchProfileData();
    }
  }, [user]);

  // 🚀 FETCH ASLI DATA
  const fetchUserData = async () => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        setUserData(userDocSnap.data());
      }
    } catch (error) {
      console.log("Error fetching user data:", error);
    }
  };

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const postsQuery = query(collection(db, 'posts'), where('authorId', '==', user?.uid));
      const postsSnapshot = await getDocs(postsQuery);
      let fetchedMyPosts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetchedMyPosts.sort((a: any, b: any) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setMyPosts(fetchedMyPosts);

      const savedQuery = query(collection(db, 'posts'), where('savedBy', 'array-contains', user?.uid));
      const savedSnapshot = await getDocs(savedQuery);
      let fetchedSavedPosts = savedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetchedSavedPosts.sort((a: any, b: any) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setSavedPosts(fetchedSavedPosts);
    } catch (error) {
      console.log("Error fetching profile posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: async () => { await signOut(auth); router.replace('/auth'); } }
    ]);
  };

  const renderMiniPost = ({ item, index }: { item: any, index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()} style={styles.miniPostCard}>
      <View style={styles.miniPostHeader}>
        <View style={styles.badgeContainer}>
          <Ionicons name={item.type === 'code' ? 'code-slash' : item.type === 'poll' ? 'stats-chart' : item.type === 'image' ? 'image' : 'text'} size={14} color="#2563eb" />
          <Text style={styles.miniPostType}>{item.type.toUpperCase()}</Text>
        </View>
        <Text style={styles.miniPostLikes}>❤️ {item.likes?.length || 0}</Text>
      </View>
      <Text style={styles.miniPostText} numberOfLines={2}>
        {item.text || item.codeSnippet || "Media Post..."}
      </Text>
    </Animated.View>
  );

  // 🎮 GAMIFICATION LOGIC
  const currentLevel = userData?.stats?.level || 1;
  const currentXp = userData?.stats?.xp || 0;
  const nextLevelXp = currentLevel * 1000;
  const xpPercentage = Math.min((currentXp / nextLevelXp) * 100, 100);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* --- 🔝 TOP ACTION BAR --- */}
      <View style={styles.topBar}>
        <Text style={styles.username}>@{user?.displayName?.replace(/\s/g, '').toLowerCase() || 'student'}</Text>
        <View style={styles.topIcons}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/edit-profile')}>
            <Ionicons name="settings-outline" size={24} color="#0f172a" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={26} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={activeTab === 'posts' ? myPosts : savedPosts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshing={loading}
        onRefresh={() => { fetchUserData(); fetchProfileData(); }}
        ListHeaderComponent={
          <View style={styles.headerWrapper}>
            
            {/* --- 👤 MAIN PROFILE HEADER --- */}
            <View style={styles.profileSection}>
              <View style={styles.avatarWrapper}>
                <Image source={{ uri: user?.photoURL || DEFAULT_AVATAR }} style={styles.profileAvatar} />
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>Lvl {currentLevel}</Text>
                </View>
              </View>
              
              <View style={styles.profileDetails}>
                <Text style={styles.fullName}>{user?.displayName || 'Eduxity User'}</Text>
                
                <View style={styles.roleContainer}>
                  <Ionicons name="school" size={14} color="#2563eb" />
                  <Text style={styles.roleText}>{userData?.roleDetail || 'Community Member'}</Text>
                </View>

                {/* XP Progress Bar */}
                <View style={styles.xpContainer}>
                  <View style={styles.xpHeader}>
                    <Text style={styles.xpText}>XP Progress</Text>
                    <Text style={styles.xpValues}>{currentXp} / {nextLevelXp}</Text>
                  </View>
                  <View style={styles.xpBarBackground}>
                    <View style={[styles.xpBarFill, { width: `${xpPercentage}%` }]} />
                  </View>
                </View>
              </View>
            </View>

            {/* --- 📍 ABOUT & DEMOGRAPHICS CARD --- */}
            <View style={styles.aboutCard}>
              {userData?.bio ? <Text style={styles.bioText}>{userData.bio}</Text> : null}
              
              <View style={styles.infoRowGrid}>
                {userData?.institutionName ? (
                  <View style={styles.infoRow}>
                    <Ionicons name="business" size={16} color="#64748b" />
                    <Text style={styles.infoText}>{userData.institutionName}</Text>
                  </View>
                ) : null}
                
                {(userData?.city || userData?.state) ? (
                  <View style={styles.infoRow}>
                    <Ionicons name="location" size={16} color="#64748b" />
                    <Text style={styles.infoText}>
                      {[userData?.city, userData?.state].filter(Boolean).join(', ')}
                    </Text>
                  </View>
                ) : null}

                {userData?.dob ? (
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar" size={16} color="#64748b" />
                    <Text style={styles.infoText}>Born {userData.dob}</Text>
                  </View>
                ) : null}
              </View>

              {/* Social Links (Will be added from Edit Profile) */}
              {(userData?.githubLink || userData?.linkedinLink || userData?.instagramLink) && (
                <View style={styles.socialLinksRow}>
                  {userData.githubLink && <TouchableOpacity><Ionicons name="logo-github" size={24} color="#0f172a" style={styles.socialIcon}/></TouchableOpacity>}
                  {userData.linkedinLink && <TouchableOpacity><Ionicons name="logo-linkedin" size={24} color="#0077b5" style={styles.socialIcon}/></TouchableOpacity>}
                  {userData.instagramLink && <TouchableOpacity><Ionicons name="logo-instagram" size={24} color="#e1306c" style={styles.socialIcon}/></TouchableOpacity>}
                </View>
              )}

              {userData?.interests && userData.interests.length > 0 && (
                <View style={styles.interestsContainer}>
                  {userData.interests.map((interest: string, index: number) => (
                    <View key={index} style={styles.interestTag}>
                      <Text style={styles.interestTagText}>{interest}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* --- 🔥 LIVE CONSISTENCY DASHBOARD --- */}
            <View style={styles.highlightCardsContainer}>
              <View style={[styles.highlightCard, { backgroundColor: '#fff3cd' }]}>
                <Text style={styles.highlightEmoji}>🔥</Text>
                <Text style={styles.highlightValue}>{userData?.stats?.streak || 0}</Text>
                <Text style={styles.highlightLabel}>Streak</Text>
              </View>
              <View style={[styles.highlightCard, { backgroundColor: '#d1fae5' }]}>
                <Text style={styles.highlightEmoji}>🎯</Text>
                <Text style={styles.highlightValue}>{userData?.stats?.accuracy || 0}%</Text>
                <Text style={styles.highlightLabel}>Accuracy</Text>
              </View>
              <View style={[styles.highlightCard, { backgroundColor: '#dbeafe' }]}>
                <Text style={styles.highlightEmoji}>📝</Text>
                <Text style={styles.highlightValue}>{userData?.stats?.totalSolved || 0}</Text>
                <Text style={styles.highlightLabel}>Solved</Text>
              </View>
            </View>

            {/* --- 🗂️ TAB SELECTOR --- */}
            <View style={styles.tabContainer}>
              <TouchableOpacity style={[styles.tabBtn, activeTab === 'posts' && styles.activeTabBtn]} onPress={() => setActiveTab('posts')}>
                <Ionicons name="grid-outline" size={20} color={activeTab === 'posts' ? '#2563eb' : '#64748b'} />
                <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>Posts ({myPosts.length})</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.tabBtn, activeTab === 'saved' && styles.activeTabBtn]} onPress={() => setActiveTab('saved')}>
                <Ionicons name="bookmark-outline" size={20} color={activeTab === 'saved' ? '#2563eb' : '#64748b'} />
                <Text style={[styles.tabText, activeTab === 'saved' && styles.activeTabText]}>Saved ({savedPosts.length})</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={renderMiniPost}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name={activeTab === 'posts' ? "document-text-outline" : "bookmarks-outline"} size={60} color="#cbd5e1" />
            <Text style={styles.emptyText}>{activeTab === 'posts' ? "No posts yet." : "No saved posts."}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 PREMIUM STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f5f9' },
  username: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  topIcons: { flexDirection: 'row', gap: 15 },
  iconBtn: { padding: 5 },

  headerWrapper: { backgroundColor: '#f8fafc', paddingBottom: 10 },

  profileSection: { flexDirection: 'row', padding: 20, alignItems: 'center', backgroundColor: '#fff' },
  avatarWrapper: { position: 'relative', marginRight: 20 },
  profileAvatar: { width: 86, height: 86, borderRadius: 43, borderWidth: 3, borderColor: '#2563eb' },
  levelBadge: { position: 'absolute', bottom: -5, alignSelf: 'center', backgroundColor: '#0f172a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 2, borderColor: '#fff' },
  levelText: { color: '#fbbf24', fontSize: 10, fontWeight: '900' },
  
  profileDetails: { flex: 1 },
  fullName: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  
  roleContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 12 },
  roleText: { fontSize: 13, color: '#2563eb', fontWeight: '700', marginLeft: 6 },
  
  xpContainer: { width: '100%' },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  xpText: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  xpValues: { fontSize: 11, fontWeight: '800', color: '#0f172a' },
  xpBarBackground: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
  xpBarFill: { height: '100%', backgroundColor: '#fbbf24', borderRadius: 4 },

  aboutCard: { backgroundColor: '#fff', marginHorizontal: 15, marginTop: 10, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  bioText: { fontSize: 14, color: '#334155', lineHeight: 22, marginBottom: 15, fontWeight: '500' },
  
  infoRowGrid: { gap: 8, marginBottom: 15 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoText: { fontSize: 13, color: '#475569', marginLeft: 8, fontWeight: '600' },

  socialLinksRow: { flexDirection: 'row', gap: 15, marginBottom: 15, paddingTop: 10, borderTopWidth: 1, borderColor: '#f1f5f9' },
  socialIcon: { marginRight: 5 },

  interestsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestTag: { backgroundColor: '#f8fafc', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  interestTagText: { fontSize: 12, fontWeight: '700', color: '#475569' },

  highlightCardsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#fff', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f1f5f9', marginTop: 15 },
  highlightCard: { width: (width - 50) / 3, paddingVertical: 15, borderRadius: 16, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  highlightEmoji: { fontSize: 24, marginBottom: 5 },
  highlightValue: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  highlightLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', marginTop: 2 },

  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f5f9' },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15 },
  activeTabBtn: { borderBottomWidth: 2, borderBottomColor: '#2563eb' },
  tabText: { fontSize: 14, fontWeight: '700', color: '#64748b', marginLeft: 8 },
  activeTabText: { color: '#2563eb' },

  miniPostCard: { backgroundColor: '#fff', marginHorizontal: 15, marginTop: 15, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  miniPostHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badgeContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  miniPostType: { fontSize: 10, fontWeight: '800', color: '#2563eb', marginLeft: 6 },
  miniPostLikes: { fontSize: 12, fontWeight: '700', color: '#475569' },
  miniPostText: { fontSize: 14, color: '#1e293b', lineHeight: 20 },

  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { marginTop: 15, fontSize: 16, fontWeight: '600', color: '#94a3b8' }
});