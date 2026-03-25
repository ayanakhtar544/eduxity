import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, StatusBar, ActivityIndicator, FlatList, Alert, Dimensions, ScrollView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { auth, db } from '../../firebaseConfig';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, onSnapshot, deleteDoc } from 'firebase/firestore'; 
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

// 🛑 IMPORTANT: Tumhara BADGES_LIST import hai, make sure path correct ho. 
// Agar abhi file nahi hai toh temporarily is line ko comment kar dena aur niche empty array pass kar dena.
import { BADGES_LIST } from '../../helpers/gamificationEngine'; 

const { width } = Dimensions.get('window');
const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';


export default function ProfileScreen() {
  const router = useRouter();
  const user = auth.currentUser;

  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const [myPosts, setMyPosts] = useState<any[]>([]); // Normal posts
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [myTests, setMyTests] = useState<any[]>([]); // Exam Engine Tests
  const [loadingTests, setLoadingTests] = useState(true);

  // ==========================================
  // 1. FETCH MY CREATED TESTS (Fix #3)
  // ==========================================
  useEffect(() => {
    const fetchMyCreatedTests = async () => {
      if (!user?.uid) return;
      try {
        const q = query(
          collection(db, 'exams_enterprise'), 
          where('authorId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const testsArray = querySnapshot.docs.map(doc => ({
          id: doc.id,
          // Adding a type flag so we know it's a test when rendering
          isExamEngineTest: true, 
          ...doc.data()
        }));
        setMyTests(testsArray);
      } catch (error) {
        console.error("Error fetching my tests: ", error);
      } finally {
        setLoadingTests(false);
      }
    };

    fetchMyCreatedTests();
  }, [user]);

  // ==========================================
  // 2. LIVE USER DATA LISTENER
  // ==========================================
  useEffect(() => {
    if (!user) return;
    
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      }
    });

    fetchProfileData();

    return () => unsubscribeUser();
  }, [user]);

  // ==========================================
  // 3. FETCH REAL POSTS DATA
  // ==========================================
  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // Fetch normal posts
      const postsQuery = query(collection(db, 'posts'), where('authorId', '==', user?.uid));
      const postsSnapshot = await getDocs(postsQuery);
      let fetchedMyPosts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetchedMyPosts.sort((a: any, b: any) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setMyPosts(fetchedMyPosts);

      // Fetch saved posts
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

  // ==========================================
  // 4. LOGOUT LOGIC (Fix #2)
  // ==========================================
  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to exit?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        style: "destructive", 
        onPress: async () => {
          try {
            await signOut(auth);
            router.replace('/login'); // Make sure your login route is correct
          } catch (error) {
            Alert.alert("Error", "Logout failed, please try again.");
            console.error(error);
          }
        }
      }
    ]);
  };

  // ==========================================
  // 5. DELETE POST LOGIC
  // ==========================================
  const handleDeleteFromProfile = async (postId: string) => {
    if (Platform.OS === 'web') {
      const confirmDelete = window.confirm("Delete Post? This will permanently remove it.");
      if (confirmDelete) {
        try {
          await deleteDoc(doc(db, 'posts', postId));
          setMyPosts(prev => prev.filter(p => p.id !== postId));
        } catch (error) {
          alert("Could not delete post.");
        }
      }
    } else {
      Alert.alert("Delete Post?", "This will permanently remove the post from Eduxity.", [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'posts', postId));
              setMyPosts(prev => prev.filter(p => p.id !== postId));
            } catch (error) {
              Alert.alert("Error", "Could not delete post.");
            }
          }
        }
      ]);
    }
  };

  // ==========================================
  // 6. RENDERERS FOR LIST (Mixes Posts & Tests)
  // ==========================================
  
  // Create a combined list of posts and tests for the "My Posts" tab
  const combinedFeed = [...myTests, ...myPosts].sort((a: any, b: any) => {
    // Basic sorting if timestamps exist
    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return timeB - timeA;
  });

  const renderFeedItem = ({ item, index }: { item: any, index: number }) => {
    
    // --- RENDER TEST CARD ---
    if (item.isExamEngineTest) {
      return (
        <Animated.View entering={FadeInDown.delay(index * 100).springify()} style={styles.testCard}>
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => router.push(`/test-analytics/${item.id}`)}
          >
            <View style={styles.testCardHeader}>
              <View style={styles.testBadgeContainer}>
                <Ionicons name="school" size={14} color="#10b981" />
                <Text style={styles.testBadgeTxt}>CBT EXAM</Text>
              </View>
              <Text style={styles.testCategory}>{item.category || 'TEST'}</Text>
            </View>
            
            <Text style={styles.testCardTitle} numberOfLines={2}>{item.title}</Text>
            
            <View style={styles.testCardFooter}>
              <View style={styles.testFooterStat}>
                <Ionicons name="list" size={14} color="#64748b" />
                <Text style={styles.testFooterTxt}>{item.questions?.length || 0} Qs</Text>
              </View>
              <View style={styles.testFooterStat}>
                <Ionicons name="time" size={14} color="#64748b" />
                <Text style={styles.testFooterTxt}>{item.rules?.globalDuration || 0} Mins</Text>
              </View>
              <View style={[styles.testFooterStat, {backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6}]}>
                <Ionicons name="people" size={14} color="#16a34a" />
                <Text style={[styles.testFooterTxt, {color: '#16a34a', fontWeight: 'bold'}]}>
                  {Object.keys(item.responses || {}).length} Attempts
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    }

    // --- RENDER NORMAL POST CARD ---
    return (
      <Animated.View entering={FadeInDown.delay(index * 100).springify()} style={styles.miniPostCard}>
        <View style={styles.miniPostHeader}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <View style={styles.badgeContainer}>
              <Ionicons 
                name={item.type === 'code' ? 'code-slash' : item.type === 'poll' ? 'stats-chart' : item.type === 'resource' ? 'book' : item.type === 'image' ? 'image' : 'text'} 
                size={14} color="#4f46e5" 
              />
              <Text style={styles.miniPostType}>{item.type?.toUpperCase() || 'POST'}</Text>
            </View>
            <Text style={styles.miniPostLikes}>❤️ {item.likes?.length || 0}</Text>
          </View>

          {activeTab === 'posts' && (
            <TouchableOpacity onPress={() => handleDeleteFromProfile(item.id)} style={styles.deleteMiniBtn}>
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.miniPostText} numberOfLines={2}>
          {item.title || item.text || item.codeSnippet || "Media Post..."}
        </Text>
      </Animated.View>
    );
  };

  // ==========================================
  // 🎮 REAL GAMIFICATION MATHS
  // ==========================================
  const gami = userData?.gamification || {};
  const currentLevel = gami.level || 1;
  const currentXp = gami.xp || 0;
  
  const prevLevelXp = Math.pow(currentLevel - 1, 2) * 100;
  const nextLevelXp = Math.pow(currentLevel, 2) * 100;
  
  const xpEarnedInCurrentLevel = currentXp - prevLevelXp;
  const xpNeededForNextLevel = nextLevelXp - prevLevelXp;
  const xpPercentage = Math.min(Math.max((xpEarnedInCurrentLevel / xpNeededForNextLevel) * 100, 0), 100);

  const userBadgeIds = gami.badges || [];
  // Note: if BADGES_LIST is not available, replace with []
  const unlockedBadges = BADGES_LIST ? BADGES_LIST.filter((b:any) => userBadgeIds.includes(b.id)) : [];

  const currentStreak = gami.currentStreak || 0;
  const eduCoins = gami.eduCoins || 0;
  const totalLikes = gami.stats?.likesReceived || 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* --- 🔝 TOP ACTION BAR --- */}
      <View style={styles.topBar}>
        <Text style={styles.username}>@{user?.displayName?.replace(/\s/g, '').toLowerCase() || 'student'}</Text>
        <View style={styles.topIcons}>
          {/* 🔥 EDIT ICON FIX (#1) */}
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/edit-profile')}>
            <Ionicons name="pencil-outline" size={24} color="#0f172a" />
          </TouchableOpacity>
          {/* 🔥 LOGOUT ICON FIX (#2) */}
          <TouchableOpacity style={styles.iconBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={26} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={activeTab === 'posts' ? combinedFeed : savedPosts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshing={loading}
        onRefresh={() => { fetchProfileData(); }}
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
                  <Ionicons name="school" size={14} color="#4f46e5" />
                  <Text style={styles.roleText}>{userData?.roleDetail || 'Community Member'}</Text>
                </View>

                {/* 🎮 REAL XP PROGRESS BAR */}
                <View style={styles.xpContainer}>
                  <View style={styles.xpHeader}>
                    <Text style={styles.xpText}>Level {currentLevel} Progress</Text>
                    <Text style={styles.xpValues}>{currentXp} / {nextLevelXp} XP</Text>
                  </View>
                  <View style={styles.xpBarBackground}>
                    <View style={[styles.xpBarFill, { width: `${xpPercentage}%` }]} />
                  </View>
                </View>
              </View>
            </View>

            {/* --- 🎖️ BADGES VAULT --- */}
            <View style={styles.badgesCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>My Badges</Text>
                <Text style={styles.badgeCount}>{unlockedBadges.length} / {BADGES_LIST ? BADGES_LIST.length : 0}</Text>
              </View>
              
              {unlockedBadges.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesScroll}>
                  {unlockedBadges.map((badge:any, idx:number) => (
                    <Animated.View entering={FadeIn.delay(idx * 100)} key={badge.id} style={styles.badgeItem}>
                      <Text style={styles.badgeEmoji}>{badge.icon}</Text>
                      <Text style={styles.badgeName}>{badge.name}</Text>
                    </Animated.View>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.noBadgesContainer}>
                  <Ionicons name="shield-checkmark-outline" size={30} color="#cbd5e1" />
                  <Text style={styles.noBadgesText}>Complete tasks to unlock badges!</Text>
                </View>
              )}
            </View>

            {/* --- 🔥 REAL STATS DASHBOARD --- */}
            <View style={styles.highlightCardsContainer}>
              <View style={[styles.highlightCard, { backgroundColor: '#fff7ed', borderColor: '#ffedd5' }]}>
                <Text style={styles.highlightEmoji}>🔥</Text>
                <Text style={styles.highlightValue}>{currentStreak}</Text>
                <Text style={styles.highlightLabel}>Day Streak</Text>
              </View>
              <View style={[styles.highlightCard, { backgroundColor: '#fefce8', borderColor: '#fef9c3' }]}>
                <Text style={styles.highlightEmoji}>🪙</Text>
                <Text style={styles.highlightValue}>{eduCoins}</Text>
                <Text style={styles.highlightLabel}>EduCoins</Text>
              </View>
              <View style={[styles.highlightCard, { backgroundColor: '#fdf2f8', borderColor: '#fce7f3' }]}>
                <Text style={styles.highlightEmoji}>❤️</Text>
                <Text style={styles.highlightValue}>{totalLikes}</Text>
                <Text style={styles.highlightLabel}>Total Likes</Text>
              </View>
            </View>

            {/* --- 📍 ABOUT CARD --- */}
            <View style={styles.aboutCard}>
              <Text style={styles.cardTitle}>About Me</Text>
              {userData?.bio ? <Text style={styles.bioText}>{userData.bio}</Text> : <Text style={styles.bioText}>No bio added yet.</Text>}
              
              <View style={styles.infoRowGrid}>
                {userData?.institutionName && (
                  <View style={styles.infoRow}>
                    <Ionicons name="business" size={16} color="#64748b" />
                    <Text style={styles.infoText}>{userData.institutionName}</Text>
                  </View>
                )}
                {(userData?.city || userData?.state) && (
                  <View style={styles.infoRow}>
                    <Ionicons name="location" size={16} color="#64748b" />
                    <Text style={styles.infoText}>{[userData?.city, userData?.state].filter(Boolean).join(', ')}</Text>
                  </View>
                )}
              </View>

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

            {/* --- 🗂️ TAB SELECTOR --- */}
            <View style={styles.tabContainer}>
              <TouchableOpacity style={[styles.tabBtn, activeTab === 'posts' && styles.activeTabBtn]} onPress={() => setActiveTab('posts')}>
                <Ionicons name="grid-outline" size={20} color={activeTab === 'posts' ? '#4f46e5' : '#64748b'} />
                <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>My Creation ({combinedFeed.length})</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.tabBtn, activeTab === 'saved' && styles.activeTabBtn]} onPress={() => setActiveTab('saved')}>
                <Ionicons name="bookmark-outline" size={20} color={activeTab === 'saved' ? '#4f46e5' : '#64748b'} />
                <Text style={[styles.tabText, activeTab === 'saved' && styles.activeTabText]}>Saved ({savedPosts.length})</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={renderFeedItem}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name={activeTab === 'posts' ? "document-text-outline" : "bookmarks-outline"} size={60} color="#cbd5e1" />
            <Text style={styles.emptyText}>{activeTab === 'posts' ? "You haven't posted or created tests yet." : "No saved posts."}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 ULTRA-PREMIUM STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  username: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  topIcons: { flexDirection: 'row', gap: 15 },
  iconBtn: { padding: 4 },

  headerWrapper: { backgroundColor: '#f8fafc', paddingBottom: 10 },

  // Profile Header
  profileSection: { flexDirection: 'row', padding: 20, alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f5f9' },
  avatarWrapper: { position: 'relative', marginRight: 20 },
  profileAvatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#e2e8f0' },
  levelBadge: { position: 'absolute', bottom: -5, alignSelf: 'center', backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 2, borderColor: '#fff', shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.2, shadowRadius: 4 },
  levelText: { color: '#fbbf24', fontSize: 11, fontWeight: '900' },
  
  profileDetails: { flex: 1 },
  fullName: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
  roleContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 12 },
  roleText: { fontSize: 13, color: '#4f46e5', fontWeight: '800', marginLeft: 6 },
  
  // Real XP Bar
  xpContainer: { width: '100%', backgroundColor: '#f8fafc', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  xpText: { fontSize: 11, fontWeight: '800', color: '#64748b', textTransform: 'uppercase' },
  xpValues: { fontSize: 11, fontWeight: '800', color: '#4f46e5' },
  xpBarBackground: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
  xpBarFill: { height: '100%', backgroundColor: '#4f46e5', borderRadius: 4 },

  // Real Stats Cards
  highlightCardsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, marginTop: 15 },
  highlightCard: { width: (width - 50) / 3, paddingVertical: 15, borderRadius: 16, alignItems: 'center', borderWidth: 1 },
  highlightEmoji: { fontSize: 26, marginBottom: 5 },
  highlightValue: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  highlightLabel: { fontSize: 11, fontWeight: '800', color: '#64748b', marginTop: 2, textTransform: 'uppercase' },

  // Badges Vault
  badgesCard: { backgroundColor: '#fff', marginHorizontal: 15, marginTop: 15, paddingVertical: 15, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  badgeCount: { fontSize: 12, fontWeight: '800', color: '#4f46e5', backgroundColor: '#e0e7ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgesScroll: { paddingHorizontal: 15, gap: 12 },
  badgeItem: { alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#f1f5f9', width: 80 },
  badgeEmoji: { fontSize: 28, marginBottom: 6 },
  badgeName: { fontSize: 10, fontWeight: '800', color: '#475569', textAlign: 'center' },
  noBadgesContainer: { alignItems: 'center', paddingVertical: 10 },
  noBadgesText: { fontSize: 13, color: '#94a3b8', fontWeight: '600', marginTop: 8 },

  // About Card
  aboutCard: { backgroundColor: '#fff', marginHorizontal: 15, marginTop: 15, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  bioText: { fontSize: 14, color: '#334155', lineHeight: 22, marginTop: 10, marginBottom: 15, fontWeight: '500' },
  infoRowGrid: { gap: 10, marginBottom: 15 },
  infoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  infoText: { fontSize: 13, color: '#475569', marginLeft: 8, fontWeight: '700' },
  socialLinksRow: { flexDirection: 'row', gap: 15, marginBottom: 15, paddingTop: 15, borderTopWidth: 1, borderColor: '#f1f5f9' },
  socialIcon: { marginRight: 5 },
  interestsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestTag: { backgroundColor: '#e0e7ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  interestTagText: { fontSize: 12, fontWeight: '800', color: '#4f46e5' },

  // Tabs
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0', marginTop: 15 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15 },
  activeTabBtn: { borderBottomWidth: 3, borderBottomColor: '#4f46e5' },
  tabText: { fontSize: 14, fontWeight: '800', color: '#64748b', marginLeft: 8 },
  activeTabText: { color: '#4f46e5' },

  // Mini Posts List (For Normal Posts)
  miniPostCard: { backgroundColor: '#fff', marginHorizontal: 15, marginTop: 12, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  miniPostHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badgeContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  miniPostType: { fontSize: 10, fontWeight: '900', color: '#4f46e5', marginLeft: 6 },
  miniPostLikes: { fontSize: 12, fontWeight: '800', color: '#475569', marginLeft: 10 },
  deleteMiniBtn: { backgroundColor: '#fef2f2', padding: 6, borderRadius: 10 },
  miniPostText: { fontSize: 15, color: '#1e293b', lineHeight: 22, fontWeight: '500' },

  // New Test Card UI
  testCard: { backgroundColor: '#fff', marginHorizontal: 15, marginTop: 12, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#4f46e5', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  testCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  testBadgeContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  testBadgeTxt: { fontSize: 10, fontWeight: '900', color: '#10b981', marginLeft: 4, letterSpacing: 0.5 },
  testCategory: { fontSize: 11, fontWeight: '800', color: '#64748b' },
  testCardTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a', marginBottom: 12, lineHeight: 22 },
  testCardFooter: { flexDirection: 'row', gap: 15, paddingTop: 10, borderTopWidth: 1, borderColor: '#f1f5f9', alignItems: 'center' },
  testFooterStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  testFooterTxt: { fontSize: 12, fontWeight: '800', color: '#64748b' },

  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { marginTop: 15, fontSize: 15, fontWeight: '700', color: '#94a3b8' }
});