import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  ActivityIndicator, ScrollView, Platform, StatusBar 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

// 🔥 FIREBASE IMPORTS
import { db, auth } from '../../firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';

export default function CompleteProfileScreen() {
  const { id } = useLocalSearchParams(); 
  const router = useRouter();
  
  const currentUid = auth.currentUser?.uid;
  const isOwnProfile = currentUid === id;

  // States
  const [profileUser, setProfileUser] = useState<any>(null);
  const [recentPosts, setRecentPosts] = useState<any[]>([]); // Real posts store karne ke liye
  const [loading, setLoading] = useState(true);
  
  // connectionStatus: 'none' | 'pending' | 'friends'
  const [connectionStatus, setConnectionStatus] = useState('none'); 
  const [isActionLoading, setIsActionLoading] = useState(false);

  // ==========================================
  // 📡 1. FETCH PROFILE, POSTS & CONNECTIONS
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

        // 2. Fetch Actual Posts from this User
        // Firebase index error se bachne ke liye hum simple where() lagakar locally sort karenge
        const postsQuery = query(collection(db, 'posts'), where('authorId', '==', id));
        const postsSnapshot = await getDocs(postsQuery);
        
        const fetchedPosts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Local sorting by timestamp (newest first)
        fetchedPosts.sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setRecentPosts(fetchedPosts);

        // 3. Check Connection (Friends / Pending)
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
      console.error(e);
      alert("Could not send request.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // ==========================================
  // 🧠 3. DATA FALLBACKS & PREPARATION
  // ==========================================
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>;
  if (!profileUser) return <View style={styles.center}><Text style={styles.errorTxt}>User not found in Eduxity</Text></View>;

  const name = profileUser.displayName || profileUser.name || "Student";
  const avatar = profileUser.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
  const studentClass = profileUser.class || "N/A";
  const exam = profileUser.targetExam || "General";
  
  // Level Calculation (Fallback if not in DB)
  const userLevel = profileUser.level || Math.max(1, Math.floor(recentPosts.length / 3) + 1);
  
  // Interests Data (Fallback array if user hasn't set them)
  const interests = profileUser.interests || ['Tech', 'Science', 'Gaming', 'Startup'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* 🔙 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#0f172a" />
        </TouchableOpacity>
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

        {/* 🟡 INTERESTS SECTION */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.tagsContainer}>
            {interests.map((interest: string, index: number) => (
              <View key={index} style={styles.interestTag}>
                <Text style={styles.interestTagText}>#{interest}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <View style={styles.divider} />

        {/* 🔴 USER'S ACTUAL POSTS */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <View style={styles.postsHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <Text style={styles.postCountText}>{recentPosts.length} Posts</Text>
          </View>

          {recentPosts.length === 0 ? (
            <View style={styles.emptyPosts}>
              <Ionicons name="document-text-outline" size={40} color="#cbd5e1" />
              <Text style={styles.emptyPostsText}>No posts shared yet.</Text>
            </View>
          ) : (
            recentPosts.map((post, idx) => (
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
                  <Ionicons name="ellipsis-vertical" size={18} color="#94a3b8" />
                </View>
                
                <Text style={styles.postContent}>{post.content || post.text || 'Shared a post.'}</Text>
                
                {post.imageUrl && (
                  <Image source={{uri: post.imageUrl}} style={styles.postImage} />
                )}

                <View style={styles.postMetrics}>
                  <View style={styles.metricItem}>
                    <Ionicons name="heart-outline" size={18} color="#64748b" />
                    <Text style={styles.metricText}>{post.likes || 0}</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Ionicons name="chatbubble-outline" size={18} color="#64748b" />
                    <Text style={styles.metricText}>{post.comments || 0}</Text>
                  </View>
                </View>
              </View>
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
  iconBtn: { padding: 10, borderRadius: 12 },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  
  scrollContent: { paddingHorizontal: 20, paddingBottom: 110 },
  
  // TOP SECTION
  topSection: { alignItems: 'center', marginTop: 20 },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatar: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#f1f5f9', borderWidth: 3, borderColor: '#fff' },
  levelBadge: { position: 'absolute', bottom: -5, alignSelf: 'center', backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 2, borderColor: '#fff', shadowColor: '#ef4444', shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: {width: 0, height: 3} },
  levelBadgeText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  
  name: { fontSize: 24, fontWeight: '900', color: '#0f172a', textAlign: 'center' },
  username: { fontSize: 14, fontWeight: '600', color: '#94a3b8', marginTop: 2 },
  
  academicRow: { flexDirection: 'row', gap: 10, marginTop: 15 },
  academicPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef2ff', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#e0e7ff' },
  academicText: { fontSize: 13, fontWeight: '800', color: '#4f46e5', marginLeft: 6 },

  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 25 },

  section: { paddingHorizontal: 5 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a', marginBottom: 15, letterSpacing: 0.5 },
  
  // INTERESTS
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  interestTag: { backgroundColor: '#f8fafc', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  interestTagText: { color: '#475569', fontSize: 13, fontWeight: '700' },

  // POSTS
  postsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  postCountText: { fontSize: 13, fontWeight: '700', color: '#4f46e5', backgroundColor: '#eef2ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  
  postCard: { backgroundColor: '#fff', padding: 18, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10, elevation: 2 },
  postTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  postAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  postAuthorName: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  postTime: { fontSize: 11, fontWeight: '600', color: '#94a3b8', marginTop: 2 },
  postContent: { fontSize: 14, color: '#334155', lineHeight: 22, fontWeight: '500' },
  postImage: { width: '100%', height: 200, borderRadius: 12, marginTop: 15, resizeMode: 'cover' },
  
  postMetrics: { flexDirection: 'row', marginTop: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 15, gap: 20 },
  metricItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metricText: { fontSize: 13, fontWeight: '700', color: '#64748b' },

  emptyPosts: { alignItems: 'center', padding: 30, backgroundColor: '#f8fafc', borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  emptyPostsText: { marginTop: 10, fontSize: 14, fontWeight: '600', color: '#94a3b8' },

  // BOTTOM ACTION
  bottomAction: { position: 'absolute', bottom: 0, width: '100%', padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingBottom: Platform.OS === 'ios' ? 35 : 20 },
  primaryBtn: { flexDirection: 'row', backgroundColor: '#4f46e5', paddingVertical: 18, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#4f46e5', shadowOpacity: 0.3, shadowOffset: {width: 0, height: 5}, shadowRadius: 10, elevation: 5 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  pendingBtn: { flexDirection: 'row', backgroundColor: '#f1f5f9', paddingVertical: 18, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  pendingBtnText: { color: '#64748b', fontSize: 16, fontWeight: '800' },
  editBtn: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 18, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#e2e8f0' },
  editBtnText: { color: '#0f172a', fontSize: 16, fontWeight: '900' }
});