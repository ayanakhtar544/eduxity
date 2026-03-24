import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Platform, TouchableOpacity, 
  StatusBar, ActivityIndicator, RefreshControl, ScrollView, Alert, Keyboard 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// 🔥 ALL COMPONENTS IMPORTED HERE 🔥
import ResourcePreview from '../../components/ResourcePreview';
import PostCard from '../../components/FeedPost';
import SkeletonPost from '../../components/SkeletonPost';
import SidebarMenu from '../../components/SidebarMenu';
import FeedHeader from '../../components/FeedHeader';
import TopHeader from '../../components/TopHeader';
import CommentsModal from '../../components/CommentsModal';
import ImageViewerModal from '../../components/ImageViewerModal';
import { FormulaNinjaGame, AlgebraSprintGame } from '../../components/games/FoundationGames';
import { BrainMatchGame, SpeedMathGame, GuessElementGame, UnitMasterGame, SeriesSolverGame, WordScrambleGame, EquationBalancerGame, VectorDashGame, BioTimeAttackGame, BugHunterGame } from '../../components/games/GamesBundle';

// FIREBASE
import { auth, db } from '../../firebaseConfig';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, limit, addDoc, serverTimestamp, getDoc, where } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { registerForPushNotificationsAsync } from '../../helpers/notificationEngine'; 
import * as Haptics from 'expo-haptics'; 
import Animated, { Layout } from 'react-native-reanimated';

// 1. Aapki poori categories list (Global)
const ALL_CATEGORIES = ['General', 'JEE', 'NEET', 'UPSC', 'Coding', 'Notes', 'Exams'];

export default function FeedScreen() {
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [feedType, setFeedType] = useState<'FOR_YOU' | 'FOLLOWING'>('FOR_YOU');
  const [visibleImage, setVisibleImage] = useState<string | null>(null);
  
  // 🔥 YAHAN SELECTED CATEGORY STATE HAI 🔥
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [algoPosts, setAlgoPosts] = useState<any[]>([]);
  const [myFriends, setMyFriends] = useState<string[]>([]);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [postLimit, setPostLimit] = useState(15); 
  const [hasMorePosts, setHasMorePosts] = useState(true);

  // Comments State
  const [activeCommentPost, setActiveCommentPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const rawPostsRef = useRef<any[]>([]);
  const rawExamsRef = useRef<any[]>([]);
  const sentFriendsRef = useRef<string[]>([]);
  const recFriendsRef = useRef<string[]>([]);

  // 1. Fetch User Data & Network
  useEffect(() => {
    if (!currentUid) return;
    getDoc(doc(db, 'users', currentUid)).then((docSnap) => { 
      if (docSnap.exists()) setCurrentUserData(docSnap.data()); 
    });
    
    const updateFriendsList = () => setMyFriends([...sentFriendsRef.current, ...recFriendsRef.current]);

    const unsubSent = onSnapshot(query(collection(db, 'connections'), where('senderId', '==', currentUid)), (snap) => {
      sentFriendsRef.current = snap.docs.filter(d => d.data().status === 'accepted').map(d => d.data().receiverId);
      updateFriendsList();
    });
    const unsubRec = onSnapshot(query(collection(db, 'connections'), where('receiverId', '==', currentUid)), (recSnap) => {
      recFriendsRef.current = recSnap.docs.filter(d => d.data().status === 'accepted').map(d => d.data().senderId);
      updateFriendsList();
    });
    return () => { unsubSent(); unsubRec(); };
  }, [currentUid]);

  // 2. Fetch Notifications
  useEffect(() => {
    if (!currentUid) return;
    const unsub = onSnapshot(query(collection(db, 'notifications'), where('recipientId', '==', currentUid), where('isRead', '==', false)), (snapshot) => setUnreadCount(snapshot.docs.length));
    registerForPushNotificationsAsync(currentUid);
    return () => unsub();
  }, [currentUid]);

  // 3. Fetch Posts & Exams
  useEffect(() => {
    const combineAndSet = () => {
      const combined = [...rawPostsRef.current, ...rawExamsRef.current].sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setAllPosts(combined); setLoading(false); setRefreshing(false);
    };

    const unsubPosts = onSnapshot(query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(postLimit)), (snapshot) => {
      rawPostsRef.current = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHasMorePosts(snapshot.docs.length === postLimit);
      combineAndSet();
    });

    const unsubExams = onSnapshot(query(collection(db, 'exams_enterprise'), orderBy('createdAt', 'desc'), limit(5)), (snapshot) => {
      rawExamsRef.current = snapshot.docs.map(doc => ({
        id: doc.id, type: 'live_test', title: doc.data().title, category: 'Test Series', authorId: doc.data().authorId, authorName: doc.data().authorName || 'Scholar', authorAvatar: doc.data().authorAvatar || '', createdAt: doc.data().createdAt, ntaFormat: true, questions: doc.data().questions || [], settings: { totalDuration: doc.data().rules?.globalDuration || 180, antiCheat: doc.data().rules?.isStrict || false, negativeMarks: 1 }, likes: doc.data().likes || [], commentsCount: doc.data().commentsCount || 0
      }));
      combineAndSet();
    });
    return () => { unsubPosts(); unsubExams(); };
  }, [currentUid, postLimit]);

  // 4. Recommendation Engine
  useEffect(() => {
    if (!allPosts.length) { setAlgoPosts([]); return; }
    if (feedType === 'FOLLOWING') { setAlgoPosts(allPosts.filter(post => myFriends.includes(post.authorId) || post.authorId === currentUid)); return; }

    let smartPosts = allPosts.map(post => {
      let score = 0; let reason = "";
      const hoursOld = (Date.now() - (post.createdAt?.toMillis ? post.createdAt.toMillis() : Date.now())) / 3600000;
      if (post.type === 'live_test') { score += 10000; reason = "📝 Recommended Mock Test"; }
      if (myFriends.includes(post.authorId)) { score += 200; if(!reason) reason = "From your Network"; }
      score += ((post.likes?.length || 0) * 3) + ((post.commentsCount || 0) * 8);
      return { ...post, algoScore: score - (hoursOld * 2), algoReason: reason };
    }).sort((a, b) => b.algoScore - a.algoScore);

    const userTarget = currentUserData?.targetExam || currentUserData?.grade || 'JEE';
    if (userTarget === '9th' || userTarget === '10th' || userTarget === 'Foundation') {
      if (smartPosts.length >= 3) smartPosts.splice(2, 0, { id: 'game_formula_ninja', type: 'game_formula_ninja' });
      if (smartPosts.length >= 8) smartPosts.splice(7, 0, { id: 'game_algebra_sprint', type: 'game_algebra_sprint' });
      if (smartPosts.length >= 12) smartPosts.splice(11, 0, { id: 'game_speed_math_1', type: 'game_speed_math' });
    } else {
      if (smartPosts.length >= 3) smartPosts.splice(2, 0, { id: 'game_brain_match_1', type: 'game_brain_match' });
      if (smartPosts.length >= 8) smartPosts.splice(7, 0, { id: 'game_unit_master_1', type: 'game_unit_master' });
      if (smartPosts.length >= 12) smartPosts.splice(11, 0, { id: 'game_vector_dash_1', type: 'game_vector_dash' });
    }
    setAlgoPosts(smartPosts);
  }, [allPosts, feedType, myFriends, currentUserData]);

  // 5. Fetch Comments
  useEffect(() => {
    if (!activeCommentPost) { setComments([]); return; }
    const collName = activeCommentPost.type === 'live_test' ? 'exams_enterprise' : 'posts';
    const unsub = onSnapshot(query(collection(db, collName, activeCommentPost.id, 'comments'), orderBy('createdAt', 'asc')), (snapshot) => { setComments(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))); });
    return () => unsub();
  }, [activeCommentPost]);

  // Actions
  const handlePostComment = async () => {
    if (!newComment.trim() || !activeCommentPost || !currentUid || isSubmittingComment) return;
    setIsSubmittingComment(true); Keyboard.dismiss();
    try {
      const collName = activeCommentPost.type === 'live_test' ? 'exams_enterprise' : 'posts';
      await addDoc(collection(db, collName, activeCommentPost.id, 'comments'), { text: newComment.trim(), authorId: currentUid, authorName: auth.currentUser?.displayName || 'User', authorAvatar: auth.currentUser?.photoURL || '', createdAt: serverTimestamp() });
      await updateDoc(doc(db, collName, activeCommentPost.id), { commentsCount: (activeCommentPost.commentsCount || 0) + 1 });
      setNewComment(""); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) { Alert.alert("Network Issue", "Failed to post comment."); } 
    finally { setIsSubmittingComment(false); }
  };

  const handleLoadMore = () => { if (!loading && hasMorePosts) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPostLimit(prev => prev + 10); } };
  
  // 🔥 SMART FILTER ARRAY CREATION 🔥 (Ab user data aane ke baad update hoga)
  const userInterests = currentUserData?.interests || [];
  const displayFilters = [
    'All', 
    'General', 
    ...userInterests, 
    ...ALL_CATEGORIES.filter(tag => tag !== 'General' && !userInterests.includes(tag))
  ];

  const filteredPosts = selectedCategory === 'All' ? algoPosts : algoPosts.filter(post => post.category === selectedCategory);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* MODULAR COMPONENTS */}
      <SidebarMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} currentUid={currentUid} />
      <TopHeader setIsMenuOpen={setIsMenuOpen} unreadCount={unreadCount} />

      {/* FEED TABS */}
      <View style={styles.feedTabsContainer}>
        <TouchableOpacity style={[styles.feedTab, feedType === 'FOR_YOU' && styles.feedTabActive]} onPress={() => { setFeedType('FOR_YOU'); Haptics.selectionAsync(); }}>
          <Text style={[styles.feedTabText, feedType === 'FOR_YOU' && styles.feedTabTextActive]}>For You</Text>
          {feedType === 'FOR_YOU' && <Animated.View layout={Layout.springify()} style={styles.activeTabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.feedTab, feedType === 'FOLLOWING' && styles.feedTabActive]} onPress={() => { setFeedType('FOLLOWING'); Haptics.selectionAsync(); }}>
          <Text style={[styles.feedTabText, feedType === 'FOLLOWING' && styles.feedTabTextActive]}>Following</Text>
          {feedType === 'FOLLOWING' && <Animated.View layout={Layout.springify()} style={styles.activeTabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* CATEGORIES / FILTER TAGS */}
      {feedType === 'FOR_YOU' && (
        <View style={styles.categoryFilterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ paddingHorizontal: 15, paddingVertical: 12 }}
          >
            {displayFilters.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.filterPill, // 🔥 Corrected class name
                  selectedCategory === tag && styles.activeFilterPill // 🔥 Corrected state variable
                ]}
                onPress={() => {
                  setSelectedCategory(tag); // 🔥 Corrected function
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[
                  styles.filterPillText, // 🔥 Corrected class name
                  selectedCategory === tag && styles.activeFilterPillText // 🔥 Corrected state variable
                ]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* MAIN FEED LIST */}
      {loading && allPosts.length === 0 ? (
        <ScrollView style={{flex: 1}}><SkeletonPost /><SkeletonPost /></ScrollView>
      ) : (
        <FlatList
          data={filteredPosts} 
          keyExtractor={(item, index) => item.id ? item.id : `fallback_${index}`}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListHeaderComponent={<FeedHeader />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setPostLimit(15); }} colors={["#4f46e5"]} />}
          onEndReached={handleLoadMore} onEndReachedThreshold={0.5}
          ListFooterComponent={hasMorePosts && algoPosts.length > 0 ? <ActivityIndicator size="small" color="#4f46e5" style={{marginVertical: 20}} /> : null}
          initialNumToRender={4} maxToRenderPerBatch={4} windowSize={5} removeClippedSubviews={true}
          renderItem={({ item }) => {
            if (item.type === 'game_formula_ninja') return <FormulaNinjaGame />;
            if (item.type === 'game_algebra_sprint') return <AlgebraSprintGame />;
            if (item.type === 'game_brain_match') return <BrainMatchGame />;
            if (item.type === 'game_speed_math') return <SpeedMathGame />;
            if (item.type === 'game_guess_element') return <GuessElementGame />;
            if (item.type === 'game_unit_master') return <UnitMasterGame />;
            if (item.type === 'game_series_solver') return <SeriesSolverGame />;
            if (item.type === 'game_word_scramble') return <WordScrambleGame />;
            if (item.type === 'game_equation_balancer') return <EquationBalancerGame />;
            if (item.type === 'game_vector_dash') return <VectorDashGame />;
            if (item.type === 'game_bio_time') return <BioTimeAttackGame />;
            if (item.type === 'game_bug_hunter') return <BugHunterGame />;
            return (
              <PostCard 
                item={item} 
                currentUid={currentUid} 
                onOpenComments={setActiveCommentPost} 
                onImagePress={setVisibleImage} 
              />
            );
          }}
          ListEmptyComponent={!loading && allPosts.length === 0 ? (<View style={{alignItems: 'center', marginTop: 40}}><Ionicons name="planet-outline" size={60} color="#4f46e5" /><Text style={{fontWeight: '800', marginTop: 15}}>No posts found.</Text></View>) : null}
        />
      )}

      {/* SEPARATED MODALS */}
      <ImageViewerModal visibleImage={visibleImage} setVisibleImage={setVisibleImage} />
      
      <CommentsModal 
        activeCommentPost={activeCommentPost} setActiveCommentPost={setActiveCommentPost}
        comments={comments} newComment={newComment} setNewComment={setNewComment}
        handlePostComment={handlePostComment} isSubmittingComment={isSubmittingComment}
        currentUserAvatar={auth.currentUser?.photoURL}
      />

      <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={() => router.push('/create-post')}><View style={styles.fabInner}><Ionicons name="add" size={32} color="#fff" /></View></TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' }, 
  feedTabsContainer: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 20 },
  feedTab: { flex: 1, alignItems: 'center', paddingVertical: 14, position: 'relative' },
  feedTabActive: { },
  feedTabText: { fontSize: 15, fontWeight: '700', color: '#64748b' },
  feedTabTextActive: { color: '#0f172a', fontWeight: '900' },
  activeTabIndicator: { position: 'absolute', bottom: -1, width: 40, height: 4, backgroundColor: '#4f46e5', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  categoryFilterContainer: { backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#f1f5f9', borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  activeFilterPill: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  filterPillText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  activeFilterPillText: { color: '#fff' },
  fab: { position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 90, right: 20, zIndex: 100 },
  fabInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
});