import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Platform, TouchableOpacity, 
  StatusBar, ActivityIndicator, RefreshControl, ScrollView, Alert, Keyboard 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// 🔥 ALL COMPONENTS IMPORTED HERE
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
import { collection, query, orderBy, onSnapshot, doc, updateDoc, limit, addDoc, serverTimestamp, getDoc, where, getDocs, startAfter } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { registerForPushNotificationsAsync } from '../../helpers/notificationEngine'; 
import * as Haptics from 'expo-haptics'; 
import Animated, { Layout } from 'react-native-reanimated';
import { personalizeFeedForUser } from '../../helpers/feedAlgorithm';

const ALL_CATEGORIES = ['General', 'JEE', 'NEET', 'UPSC', 'Coding', 'Notes', 'Exams'];

export default function FeedScreen() {
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [feedType, setFeedType] = useState<'FOR_YOU' | 'FOLLOWING'>('FOR_YOU');
  const [visibleImage, setVisibleImage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [algoPosts, setAlgoPosts] = useState<any[]>([]);
  const [myFriends, setMyFriends] = useState<string[]>([]);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // PAGINATION STATES 
  const [lastVisiblePost, setLastVisiblePost] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const POSTS_PER_PAGE = 15;

  const [activeCommentPost, setActiveCommentPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const sentFriendsRef = useRef<string[]>([]);
  const recFriendsRef = useRef<string[]>([]);

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

  useEffect(() => {
    if (!currentUid) return;
    const unsub = onSnapshot(query(collection(db, 'notifications'), where('recipientId', '==', currentUid), where('isRead', '==', false)), (snapshot) => setUnreadCount(snapshot.docs.length));
    registerForPushNotificationsAsync(currentUid);
    return () => unsub();
  }, [currentUid]);

  // ==========================================
  // 🔥 1. INITIAL FETCH 
  // ==========================================
  const fetchInitialFeed = async () => {
    try {
      // Abhi Normal Order by time rakha hai (Algorithm baad mein)
      const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(POSTS_PER_PAGE));
      const examsQuery = query(collection(db, 'exams_enterprise'), orderBy('createdAt', 'desc'), limit(5));

      const [postsSnap, examsSnap] = await Promise.all([ getDocs(postsQuery), getDocs(examsQuery) ]);

      if (!postsSnap.empty) { setLastVisiblePost(postsSnap.docs[postsSnap.docs.length - 1]); } 
      else { setHasMorePosts(false); }

      const fetchedPosts = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const fetchedExams = examsSnap.docs.map(doc => ({
        id: doc.id, type: 'live_test', title: doc.data().title, category: 'Test Series', 
        authorId: doc.data().authorId, authorName: doc.data().authorName || 'Scholar', 
        authorAvatar: doc.data().authorAvatar || '', createdAt: doc.data().createdAt, 
        ntaFormat: true, questions: doc.data().questions || [], 
        settings: { totalDuration: doc.data().rules?.globalDuration || 180, antiCheat: doc.data().rules?.isStrict || false, negativeMarks: 1 }, 
        likes: doc.data().likes || [], commentsCount: doc.data().commentsCount || 0,
        responses: doc.data().responses || {} // 🔥 TEST RESULT HERE
      }));

      const combined = [...fetchedPosts, ...fetchedExams].sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });

      setAllPosts(combined);
      setHasMorePosts(postsSnap.docs.length === POSTS_PER_PAGE);
    } catch (error) {
      console.error("Initial Fetch Error: ", error);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  // ==========================================
  // 🚀 2. FETCH MORE (Infinite Scroll)
  // ==========================================
  const fetchMorePosts = async () => {
    if (!hasMorePosts || loadingMore || !lastVisiblePost) return;

    try {
      setLoadingMore(true);
      const nextPostsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), startAfter(lastVisiblePost), limit(POSTS_PER_PAGE));
      const postsSnap = await getDocs(nextPostsQuery);

      if (!postsSnap.empty) {
        setLastVisiblePost(postsSnap.docs[postsSnap.docs.length - 1]);
        const fetchedNewPosts = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        setAllPosts(prevPosts => {
          const updated = [...prevPosts, ...fetchedNewPosts];
          return Array.from(new Map(updated.map(item => [item.id, item])).values());
        });
        setHasMorePosts(postsSnap.docs.length === POSTS_PER_PAGE);
      } else {
        setHasMorePosts(false);
      }
    } catch (error) {
      console.error("Load More Error: ", error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => { fetchInitialFeed(); }, [currentUid]);

  // ==========================================
  // 🔥 THE NEW INSTA-STYLE PERSONALIZATION ENGINE
  // ==========================================
  useEffect(() => {
    if (!allPosts.length) { 
      setAlgoPosts([]); 
      return; 
    }

    // Agar "Following" tab khula hai, toh sirf dosto ki post dikhao (Chronological order)
    if (feedType === 'FOLLOWING') { 
      const followingPosts = allPosts.filter(post => myFriends.includes(post.authorId) || post.authorId === currentUid);
      setAlgoPosts(followingPosts); 
      return; 
    }

    // 🚀 THE MAGIC HAPPENS HERE FOR "FOR_YOU" FEED 🚀
    // Humara naya AI engine saari posts ko is bache ke interests ke hisaab se re-rank karega
    const personalizedFeed = personalizeFeedForUser(allPosts, currentUserData, myFriends, currentUid as string);
    
    setAlgoPosts(personalizedFeed);

  }, [allPosts, feedType, myFriends, currentUserData]);

  useEffect(() => {
    if (!activeCommentPost) { setComments([]); return; }
    const collName = activeCommentPost.type === 'live_test' ? 'exams_enterprise' : 'posts';
    const unsub = onSnapshot(query(collection(db, collName, activeCommentPost.id, 'comments'), orderBy('createdAt', 'asc')), (snapshot) => { setComments(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))); });
    return () => unsub();
  }, [activeCommentPost]);

  const handlePostComment = async () => {
    if (!newComment.trim() || !activeCommentPost || !currentUid || isSubmittingComment) return;
    setIsSubmittingComment(true); Keyboard.dismiss();
    try {
      const collName = activeCommentPost.type === 'live_test' ? 'exams_enterprise' : 'posts';
      await addDoc(collection(db, collName, activeCommentPost.id, 'comments'), { text: newComment.trim(), authorId: currentUid, authorName: auth.currentUser?.displayName || 'User', authorAvatar: auth.currentUser?.photoURL || '', createdAt: serverTimestamp() });
      await updateDoc(doc(db, collName, activeCommentPost.id), { commentsCount: (activeCommentPost.commentsCount || 0) + 1 });
      setNewComment(""); 
      if(Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) { Alert.alert("Network Issue", "Failed to post comment."); } 
    finally { setIsSubmittingComment(false); }
  };

  const handleLoadMore = () => { 
    if (!loading && !loadingMore && hasMorePosts) { 
      if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); 
      fetchMorePosts(); 
    } 
  };
  
  const userInterests = currentUserData?.interests || [];
  const displayFilters = ['All', 'General', ...userInterests, ...ALL_CATEGORIES.filter(tag => tag !== 'General' && !userInterests.includes(tag))];
  const filteredPosts = selectedCategory === 'All' ? algoPosts : algoPosts.filter(post => post.category === selectedCategory);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SidebarMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} currentUid={currentUid} />
      <TopHeader setIsMenuOpen={setIsMenuOpen} unreadCount={unreadCount} />

      <View style={styles.feedTabsContainer}>
        <TouchableOpacity style={[styles.feedTab, feedType === 'FOR_YOU' && styles.feedTabActive]} onPress={() => { setFeedType('FOR_YOU'); if(Platform.OS !== 'web') Haptics.selectionAsync(); }}>
          <Text style={[styles.feedTabText, feedType === 'FOR_YOU' && styles.feedTabTextActive]}>For You</Text>
          {feedType === 'FOR_YOU' && <Animated.View layout={Layout.springify()} style={styles.activeTabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.feedTab, feedType === 'FOLLOWING' && styles.feedTabActive]} onPress={() => { setFeedType('FOLLOWING'); if(Platform.OS !== 'web') Haptics.selectionAsync(); }}>
          <Text style={[styles.feedTabText, feedType === 'FOLLOWING' && styles.feedTabTextActive]}>Following</Text>
          {feedType === 'FOLLOWING' && <Animated.View layout={Layout.springify()} style={styles.activeTabIndicator} />}
        </TouchableOpacity>
      </View>

      {feedType === 'FOR_YOU' && (
        <View style={styles.categoryFilterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15, paddingVertical: 12 }}>
            {displayFilters.map((tag) => (
              <TouchableOpacity key={tag} style={[styles.filterPill, selectedCategory === tag && styles.activeFilterPill]} onPress={() => { setSelectedCategory(tag); if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                <Text style={[styles.filterPillText, selectedCategory === tag && styles.activeFilterPillText]}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {loading && allPosts.length === 0 ? (
        <ScrollView style={{flex: 1}}><SkeletonPost /><SkeletonPost /></ScrollView>
      ) : (
        <FlatList
          data={filteredPosts} 
          keyExtractor={(item, index) => item.id ? item.id : `fallback_${index}`}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListHeaderComponent={<FeedHeader />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setLastVisiblePost(null); fetchInitialFeed(); }} colors={["#4f46e5"]} />}
          onEndReached={handleLoadMore} 
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color="#4f46e5" style={{marginVertical: 20}} /> : null}
          initialNumToRender={5} maxToRenderPerBatch={5} windowSize={5} removeClippedSubviews={true}
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
              <PostCard item={item} currentUid={currentUid} onOpenComments={setActiveCommentPost} onImagePress={setVisibleImage} />
            );
          }}
          ListEmptyComponent={!loading && allPosts.length === 0 ? (<View style={{alignItems: 'center', marginTop: 40}}><Ionicons name="planet-outline" size={60} color="#4f46e5" /><Text style={{fontWeight: '800', marginTop: 15}}>No posts found.</Text></View>) : null}
        />
      )}

      <ImageViewerModal visibleImage={visibleImage} setVisibleImage={setVisibleImage} />
      <CommentsModal activeCommentPost={activeCommentPost} setActiveCommentPost={setActiveCommentPost} comments={comments} newComment={newComment} setNewComment={setNewComment} handlePostComment={handlePostComment} isSubmittingComment={isSubmittingComment} currentUserAvatar={auth.currentUser?.photoURL} />
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