// Location: app/user/[id].tsx
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  ActivityIndicator, ScrollView, Platform, StatusBar, Dimensions
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn, Layout } from 'react-native-reanimated';

// 🔥 FIREBASE IMPORTS
import { db, auth } from '../../firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';

// Gamification Badges
import { BADGES_LIST } from '../../helpers/gamificationEngine';

import EduxityLoader from '../../components/EduxityLoader'; 

const { width } = Dimensions.get('window');

export default function CompleteProfileScreen() {
  const { id } = useLocalSearchParams(); 
  const router = useRouter();
  
  const currentUid = auth.currentUser?.uid;
  const isOwnProfile = currentUid === id;

  const [profileUser, setProfileUser] = useState<any>(null);
  const [combinedPosts, setCombinedPosts] = useState<any[]>([]); // Posts + Tests
  const [loading, setLoading] = useState(true);
  
  const [connectionStatus, setConnectionStatus] = useState('none'); 
  const [isActionLoading, setIsActionLoading] = useState(false);

  // ==========================================
  // 📡 1. FETCH PROFILE, POSTS, TESTS & CONNECTIONS
  // ==========================================
  useEffect(() => {
    if (!id) return;

    const fetchAllData = async () => {
      try {
        // 1. Fetch User Info
        const userDoc = await getDoc(doc(db, 'users', id as string));
        if (userDoc.exists()) {
          setProfileUser({ id: userDoc.id, ...userDoc.data() });
        }

        // 2. Fetch Actual Posts
        const postsQuery = query(collection(db, 'posts'), where('authorId', '==', id));
        const postsSnapshot = await getDocs(postsQuery);
        const fetchedPosts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 3. Fetch Created Tests
        const testsQuery = query(collection(db, 'exams_enterprise'), where('authorId', '==', id));
        const testsSnapshot = await getDocs(testsQuery);
        const fetchedTests = testsSnapshot.docs.map(doc => ({
          id: doc.id,
          isExamEngineTest: true,
          type: 'live_test',
          ...doc.data()
        }));

        // 4. Combine & Sort
        const allData = [...fetchedPosts, ...fetchedTests];
        allData.sort((a: any, b: any) => {
           const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
           const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
           return timeB - timeA;
        });
        setCombinedPosts(allData);

        // 5. Check Connection
        if (!isOwnProfile && currentUid) {
          const conn1 = await getDoc(doc(db, 'connections', `${currentUid}_${id}`));
          const conn2 = await getDoc(doc(db, 'connections', `${id}_${currentUid}`));

          if (conn1.exists()) {
            setConnectionStatus(conn1.data().status === 'accepted' ? 'friends' : 'pending');
          } else if (conn2.exists()) {
            setConnectionStatus(conn2.data().status === 'accepted' ? 'friends' : 'pending');
          }
        }
      } catch (error) {
        console.error("Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [id, currentUid]);

  // ==========================================
  // 🎮 2. FRIEND REQUEST LOGIC
  // ==========================================
  const handleConnect = async () => {
    if (!currentUid || !profileUser) return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    setIsActionLoading(true);
    try {
      const connectionId = `${currentUid}_${profileUser.id}`;
      await setDoc(doc(db, 'connections', connectionId), {
        senderId: currentUid,
        receiverId: profileUser.id,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setConnectionStatus('pending');
    } catch (e) {
      alert("Could not send request.");
    } finally {
      setIsActionLoading(false);
    }
  };

  if (loading) return <EduxityLoader />;
  if (!profileUser) return <View style={styles.center}><Text style={styles.errorTxt}>User not found in Eduxity</Text></View>;

  // --- Profile Variables ---
  const name = profileUser.displayName || profileUser.name || "Student";
  const avatar = profileUser.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
  const studentClass = profileUser.class || "N/A";
  const exam = profileUser.targetExam || "General";
  const interests = profileUser.interests || ['Tech', 'Science', 'Gaming'];
  const userLevel = profileUser.gamification?.level || profileUser.level || 1;
  const userBadgeIds = profileUser.gamification?.badges || [];
  const unlockedBadges = BADGES_LIST ? BADGES_LIST.filter((b:any) => userBadgeIds.includes(b.id)) : [];

  // 🚀 POST NAVIGATION
  const navigateToPost = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  // ==========================================
  // 🃏 3. DYNAMIC CONTENT RENDERER
  // ==========================================
  const renderItemContent = (post: any) => {
    // TEST UI
    if (post.isExamEngineTest || post.type === 'live_test') {
      return (
        <View style={styles.testCardInner}>
          <View style={styles.testBadgeContainer}>
            <Ionicons name="school" size={12} color="#10b981" />
            <Text style={styles.testBadgeTxt}>CBT EXAM</Text>
          </View>
          <Text style={styles.testCardTitle} numberOfLines={2}>{post.title}</Text>
          <View style={styles.testCardFooter}>
            <Text style={styles.testFooterTxt}><Ionicons name="list" size={12}/> {post.questions?.length || 0} Qs</Text>
            <Text style={styles.testFooterTxt}><Ionicons name="time" size={12}/> {post.rules?.globalDuration || 0} Min</Text>
          </View>
        </View>
      );
    }

    // RESOURCE / FLASHCARD UI
    if (post.type === 'resource' || post.type === 'flashcard') {
      return (
        <View style={styles.resourceCardInner}>
          <View style={styles.resourceHeaderRow}>
            <Ionicons name={post.type === 'resource' ? "book" : "layers"} size={16} color="#ec4899" />
            <Text style={styles.resourceBadgeTxt}>{post.type === 'resource' ? "Notes" : "Flashcard"}</Text>
          </View>
          <Text style={styles.resourceTitle}>{post.title || post.text}</Text>
          {post.text ? <Text style={styles.postContent} numberOfLines={2}>{post.text}</Text> : null}
        </View>
      );
    }

    // POLL UI
    if (post.type === 'poll') {
      return (
        <View style={styles.pollCardInner}>
          <Text style={styles.postContent}>{post.text}</Text>
          <View style={styles.pollOptionsContainer}>
            {post.pollOptions?.map((opt:any, idx:number) => (
              <View key={idx} style={styles.pollOptionView}>
                <Text style={styles.pollOptionText}>{opt.text}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    }

    // CODE UI
    if (post.type === 'code') {
      return (
        <View>
          <Text style={styles.postContent}>{post.text}</Text>
          <View style={styles.codeSnippetBox}>
             <Text style={styles.codeLangText}>{post.language}</Text>
             <Text style={styles.codeText} numberOfLines={4}>{post.codeSnippet}</Text>
          </View>
        </View>
      );
    }

    // DEFAULT (Text + Image)
    return (
      <View>
        <Text style={styles.postContent}>{post.text || post.content}</Text>
        {post.imageUrl && <Image source={{uri: post.imageUrl}} style={styles.postImage} />}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* 🔙 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{width: 40}} /> 
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* 🟢 TOP SECTION: Avatar, Name, Level, Class */}
        <Animated.View entering={FadeInDown.duration(400)} layout={Layout.springify()} style={styles.topSection}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: avatar }} style={styles.avatar} />
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>Lv.{userLevel}</Text>
            </View>
          </View>
          
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.username}>@{profileUser.username || name.toLowerCase().replace(/\s/g, '')}</Text>

          <View style={styles.academicRow}>
            <View style={styles.academicPill}>
              <Ionicons name="school" size={14} color="#4f46e5" />
              <Text style={styles.academicText}>{studentClass}</Text>
            </View>
            <View style={[styles.academicPill, {backgroundColor: '#fffbeb', borderColor: '#fef3c7'}]}>
              <Ionicons name="book" size={14} color="#d97706" />
              <Text style={[styles.academicText, {color: '#d97706'}]}>{exam}</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.divider} />

        {/* 🏆 BADGES SECTION */}
        <Animated.View entering={FadeInDown.delay(50)} style={styles.section}>
          <View style={styles.sectionHeaderRow}>
             <Text style={styles.sectionTitle}>Unlocked Badges</Text>
             <Text style={styles.countBadge}>{unlockedBadges.length}</Text>
          </View>
          
          {unlockedBadges.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesScroll}>
              {unlockedBadges.map((badge:any, idx:number) => (
                <View key={idx} style={styles.badgeItem}>
                  {/* 🔥 FIX APPLIED HERE: <Text> replaced with <Image> */}
                  <Image 
                    source={typeof badge.icon === 'number' || typeof badge.icon === 'object' ? badge.icon : { uri: badge.icon }} 
                    style={styles.badgeImage} 
                    contentFit="contain"
                  />
                  <Text style={styles.badgeName}>{badge.name}</Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyBadges}>
              <Text style={styles.emptyBadgesText}>No badges unlocked yet.</Text>
            </View>
          )}
        </Animated.View>

        <View style={styles.divider} />

        {/* 🟡 INTERESTS SECTION */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>Topics of Interest</Text>
          <View style={styles.tagsContainer}>
            {interests.map((interest: string, index: number) => (
              <View key={index} style={styles.interestTag}>
                <Text style={styles.interestTagText}>#{interest}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <View style={styles.divider} />

        {/* 🔴 USER'S ACTUAL ACTIVITY */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <View style={styles.postsHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <Text style={styles.postCountText}>{combinedPosts.length} Items</Text>
          </View>

          {combinedPosts.length === 0 ? (
            <View style={styles.emptyPosts}>
              <Ionicons name="document-text-outline" size={40} color="#cbd5e1" />
              <Text style={styles.emptyPostsText}>No activity found.</Text>
            </View>
          ) : (
            combinedPosts.map((post, idx) => (
               <TouchableOpacity 
                 key={post.id || idx} 
                 activeOpacity={0.9} 
                 onPress={() => navigateToPost(post.id)}
             >
                
              <View key={post.id || idx} style={styles.postCard}>
                
                <View style={styles.postTopRow}>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Image source={{uri: avatar}} style={styles.postAvatar} />
                    <View>
                      <Text style={styles.postAuthorName}>{name}</Text>
                      <Text style={styles.postTime}>
                        {post.createdAt ? new Date(post.createdAt.toMillis()).toLocaleDateString() : 'Recently'}
                      </Text>
                    </View>
                  </View>
                </View>
                
                {/* 🃏 DYNAMIC RENDERER CALL */}
                {renderItemContent(post)}

                <View style={styles.postMetrics}>
                  <View style={styles.metricItem}>
                    <Ionicons name="flash-outline" size={16} color="#64748b" />
                    {/* 🔥 LIKES/BOOSTS FIX (.length is applied) */}
                    <Text style={styles.metricText}>
                      {Array.isArray(post.boosts) ? post.boosts.length : (Array.isArray(post.likes) ? post.likes.length : 0)}
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Ionicons name="chatbubble-outline" size={16} color="#64748b" />
                    <Text style={styles.metricText}>{post.commentsCount || post.answersCount || post.comments || 0}</Text>
                  </View>
                </View>

              </View>
              </TouchableOpacity>
            ))
          )}
        </Animated.View>

      </ScrollView>

      {/* 🟤 BOTTOM ACTION BAR (Smart Routing) */}
      <View style={styles.bottomAction}>
        {isOwnProfile ? (
          <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/settings/edit-profile')}>
            <Ionicons name="pencil" size={20} color="#0f172a" style={{marginRight: 8}} />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        ) : connectionStatus === 'friends' ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push(`/chat/${profileUser.id}`)}>
            <Ionicons name="chatbubbles" size={20} color="#fff" style={{marginRight: 8}} />
            <Text style={styles.primaryBtnText}>Message {name}</Text>
          </TouchableOpacity>
        ) : connectionStatus === 'pending' ? (
          <TouchableOpacity style={styles.pendingBtn} disabled>
            <Ionicons name="time" size={20} color="#64748b" style={{marginRight: 8}} />
            <Text style={styles.pendingBtnText}>Request Pending</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleConnect} disabled={isActionLoading}>
            <Ionicons name="person-add" size={20} color="#fff" style={{marginRight: 8}} />
            <Text style={styles.primaryBtnText}>{isActionLoading ? 'Sending...' : 'Send Friend Request'}</Text>
          </TouchableOpacity>
        )}
      </View>

    </SafeAreaView>
  );
}

// ==========================================
// 🎨 STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorTxt: { fontSize: 16, fontWeight: '700', color: '#94a3b8' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  iconBtn: { padding: 10, borderRadius: 12, backgroundColor: '#f8fafc' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  
  scrollContent: { paddingHorizontal: 20, paddingBottom: 110 },
  
  topSection: { alignItems: 'center', marginTop: 25 },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatar: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#f1f5f9', borderWidth: 3, borderColor: '#e2e8f0' },
  levelBadge: { position: 'absolute', bottom: -5, alignSelf: 'center', backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 2, borderColor: '#fff' },
  levelBadgeText: { color: '#fbbf24', fontSize: 11, fontWeight: '900' },
  
  name: { fontSize: 24, fontWeight: '900', color: '#0f172a', textAlign: 'center' },
  username: { fontSize: 14, fontWeight: '600', color: '#94a3b8', marginTop: 4 },
  
  academicRow: { flexDirection: 'row', gap: 10, marginTop: 15 },
  academicPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef2ff', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#e0e7ff' },
  academicText: { fontSize: 13, fontWeight: '800', color: '#4f46e5', marginLeft: 6 },

  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 25 },

  section: { paddingHorizontal: 5 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a', letterSpacing: 0.5 },
  countBadge: { marginLeft: 10, backgroundColor: '#f1f5f9', color: '#64748b', fontSize: 12, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  
  // Badges Vault
  badgesScroll: { gap: 12 },
  badgeItem: { alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', width: 75 },
  // 🔥 STYLE ADDED FOR IMAGE
  badgeImage: { width: 35, height: 35, marginBottom: 6 }, 
  badgeName: { fontSize: 10, fontWeight: '800', color: '#475569', textAlign: 'center' },
  emptyBadges: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 12, alignItems: 'center' },
  emptyBadgesText: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },

  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  interestTag: { backgroundColor: '#f8fafc', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  interestTagText: { color: '#475569', fontSize: 13, fontWeight: '700' },

  postsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  postCountText: { fontSize: 13, fontWeight: '700', color: '#4f46e5', backgroundColor: '#eef2ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  
  // Post Card Base
  postCard: { backgroundColor: '#fff', padding: 16, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  postTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  postAvatar: { width: 34, height: 34, borderRadius: 17, marginRight: 10, backgroundColor: '#e2e8f0' },
  postAuthorName: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  postTime: { fontSize: 11, fontWeight: '600', color: '#94a3b8', marginTop: 2 },
  postContent: { fontSize: 14, color: '#334155', lineHeight: 22, fontWeight: '500' },
  postImage: { width: '100%', height: 200, borderRadius: 12, marginTop: 15, resizeMode: 'cover' },
  
  // Dynamic Content UIs
  testCardInner: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 5 },
  testBadgeContainer: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, marginBottom: 8 },
  testBadgeTxt: { fontSize: 9, fontWeight: '900', color: '#10b981', marginLeft: 4 },
  testCardTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  testCardFooter: { flexDirection: 'row', gap: 15, marginTop: 10 },
  testFooterTxt: { fontSize: 12, fontWeight: '700', color: '#64748b' },

  resourceCardInner: { backgroundColor: '#fffbf1', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#fef3c7', marginTop: 5 },
  resourceHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  resourceBadgeTxt: { fontSize: 11, fontWeight: '800', color: '#ec4899', marginLeft: 4, textTransform: 'uppercase' },
  resourceTitle: { fontSize: 15, fontWeight: '900', color: '#9d174d', marginBottom: 4 },

  pollCardInner: { marginTop: 5 },
  pollOptionsContainer: { marginTop: 10, gap: 8 },
  pollOptionView: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  pollOptionText: { fontSize: 13, fontWeight: '600', color: '#334155' },

  codeSnippetBox: { backgroundColor: '#0f172a', padding: 12, borderRadius: 12, marginTop: 10 },
  codeLangText: { color: '#38bdf8', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginBottom: 6 },
  codeText: { color: '#e2e8f0', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 12, lineHeight: 18 },

  postMetrics: { flexDirection: 'row', marginTop: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12, gap: 20 },
  metricItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metricText: { fontSize: 13, fontWeight: '700', color: '#64748b' },

  emptyPosts: { alignItems: 'center', padding: 30, backgroundColor: '#f8fafc', borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  emptyPostsText: { marginTop: 10, fontSize: 14, fontWeight: '600', color: '#94a3b8' },

  bottomAction: { position: 'absolute', bottom: 0, width: '100%', padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingBottom: Platform.OS === 'ios' ? 35 : 20, shadowColor: '#000', shadowOffset:{width:0,height:-5}, shadowOpacity:0.05, shadowRadius:10, elevation:10 },
  primaryBtn: { flexDirection: 'row', backgroundColor: '#4f46e5', paddingVertical: 18, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  pendingBtn: { flexDirection: 'row', backgroundColor: '#f8fafc', paddingVertical: 18, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  pendingBtnText: { color: '#64748b', fontSize: 16, fontWeight: '800' },
  editBtn: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 18, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#e2e8f0' },
  editBtnText: { color: '#0f172a', fontSize: 16, fontWeight: '900' }
});