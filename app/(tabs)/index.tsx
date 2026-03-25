import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Platform, TouchableOpacity, 
  StatusBar, ActivityIndicator, RefreshControl, ScrollView, Alert, Keyboard, Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useRewardStore } from '../../store/useRewardStore'; // 👈 Ye add karna zaroori hai

// 🔥 ALL COMPONENTS IMPORTED HERE (As per your original code)
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
import Animated, { 
  useSharedValue, useAnimatedStyle, useAnimatedScrollHandler, 
  interpolate, Extrapolation, Layout 
} from 'react-native-reanimated';
import { personalizeFeedForUser } from '../../helpers/feedAlgorithm';

const ALL_CATEGORIES = ['General', 'JEE', 'NEET', 'UPSC', 'Coding', 'Notes', 'Exams'];
const { width } = Dimensions.get('window');

// Header Parts Height Constants
const LOGO_HEADER_H = 60;
const TABS_H = 50;
const FILTERS_H = 60;
const TOTAL_HIDABLE_H = LOGO_HEADER_H + TABS_H + FILTERS_H;

// Create Animated FlatList
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export default function FeedScreen() {
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;

  // --- YOUR ORIGINAL STATES ---
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

  // ==========================================
  // 🎢 MAGIC SCROLL ANIMATION LOGIC
  // ==========================================
  const scrollY = useSharedValue(0);
  const diffClampY = useSharedValue(0); // This handles the hide-on-scroll-down, show-on-scroll-up

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      const currentY = e.contentOffset.y;
      const diff = currentY - scrollY.value;

      if (currentY < 0) {
        diffClampY.value = 0; // Don't hide when bouncing at the top
      } else {
        // We clamp it between 0 and 170 (Total header height)
        diffClampY.value = Math.max(0, Math.min(TOTAL_HIDABLE_H, diffClampY.value + diff));
      }
      scrollY.value = currentY;
    }
  });

  // 1. Top Logo Header Style (Hides last)
  const logoHeaderStyle = useAnimatedStyle(() => {
    const ty = interpolate(diffClampY.value, [0, FILTERS_H + TABS_H, TOTAL_HIDABLE_H], [0, 0, -LOGO_HEADER_H], Extrapolation.CLAMP);
    return { transform: [{ translateY: ty }] };
  });

  // 2. Tabs Style (Hides second)
  const tabsStyle = useAnimatedStyle(() => {
    const ty = interpolate(diffClampY.value, [0, FILTERS_H, FILTERS_H + TABS_H + LOGO_HEADER_H], [0, 0, -(TABS_H + LOGO_HEADER_H)], Extrapolation.CLAMP);
    return { transform: [{ translateY: ty }] };
  });

  // 3. Filter Style (Hides first)
  const filterStyle = useAnimatedStyle(() => {
    return { transform: [{ translateY: -diffClampY.value }] };
  });

  // --- YOUR ORIGINAL EFFECTS (100% Intact) ---
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

  const fetchInitialFeed = async () => {
    try {
      const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(POSTS_PER_PAGE));
      const examsQuery = query(collection(db, 'exams_enterprise'), orderBy('createdAt', 'desc'), limit(5));
      const [postsSnap, examsSnap] = await Promise.all([ getDocs(postsQuery), getDocs(examsQuery) ]);
      if (!postsSnap.empty) { setLastVisiblePost(postsSnap.docs[postsSnap.docs.length - 1]); } 
      else { setHasMorePosts(false); }
      const fetchedPosts = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const fetchedExams = examsSnap.docs.map(doc => ({
        id: doc.id, type: 'live_test', title: doc.data().title, category: 'Exams', 
        authorId: doc.data().authorId, authorName: doc.data().authorName || 'Scholar', 
        authorAvatar: doc.data().authorAvatar || '', createdAt: doc.data().createdAt, 
        ntaFormat: true, questions: doc.data().questions || [], 
        settings: { totalDuration: doc.data().rules?.globalDuration || 180, antiCheat: doc.data().rules?.isStrict || false, negativeMarks: 1 }, 
        likes: doc.data().likes || [], commentsCount: doc.data().commentsCount || 0,
        responses: doc.data().responses || {}
      }));
      const combined = [...fetchedPosts, ...fetchedExams].sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setAllPosts(combined);
      setHasMorePosts(postsSnap.docs.length === POSTS_PER_PAGE);
    } catch (error) { console.error("Initial Fetch Error: ", error); } finally { setLoading(false); setRefreshing(false); }
  };

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
      } else { setHasMorePosts(false); }
    } catch (error) { console.error("Load More Error: ", error); } finally { setLoadingMore(false); }
  };

  useEffect(() => { fetchInitialFeed(); }, [currentUid]);

  useEffect(() => {
    if (!allPosts.length) { setAlgoPosts([]); return; }
    if (feedType === 'FOLLOWING') { 
      const followingPosts = allPosts.filter(post => myFriends.includes(post.authorId) || post.authorId === currentUid);
      setAlgoPosts(followingPosts); return; 
    }
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
    } catch (e) { Alert.alert("Network Issue", "Failed to post comment."); } finally { setIsSubmittingComment(false); }
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SidebarMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} currentUid={currentUid} />

      <View style={{ flex: 1, position: 'relative' }}>
        
        {/* ========================================== */}
        {/* 🏔️ THE ANIMATED HEADER COMPONENTS          */}
        {/* ========================================== */}

        {/* 3. FILTERS BAR (Hides First) */}
        {feedType === 'FOR_YOU' && (
          <Animated.View style={[styles.categoryFilterContainer, { zIndex: 1, top: LOGO_HEADER_H + TABS_H }, filterStyle]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15, paddingVertical: 12 }}>
              {displayFilters.map((tag) => (
                <TouchableOpacity key={tag} style={[styles.filterPill, selectedCategory === tag && styles.activeFilterPill]} onPress={() => { setSelectedCategory(tag); if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                  <Text style={[styles.filterPillText, selectedCategory === tag && styles.activeFilterPillText]}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* 2. TABS BAR (Hides Second) */}
        <Animated.View style={[styles.feedTabsContainer, { zIndex: 2, top: LOGO_HEADER_H }, tabsStyle]}>
          <TouchableOpacity style={[styles.feedTab, feedType === 'FOR_YOU' && styles.feedTabActive]} onPress={() => { setFeedType('FOR_YOU'); if(Platform.OS !== 'web') Haptics.selectionAsync(); }}>
            <Text style={[styles.feedTabText, feedType === 'FOR_YOU' && styles.feedTabTextActive]}>For You</Text>
            {feedType === 'FOR_YOU' && <Animated.View layout={Layout.springify()} style={styles.activeTabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.feedTab, feedType === 'FOLLOWING' && styles.feedTabActive]} onPress={() => { setFeedType('FOLLOWING'); if(Platform.OS !== 'web') Haptics.selectionAsync(); }}>
            <Text style={[styles.feedTabText, feedType === 'FOLLOWING' && styles.feedTabTextActive]}>Following</Text>
            {feedType === 'FOLLOWING' && <Animated.View layout={Layout.springify()} style={styles.activeTabIndicator} />}
          </TouchableOpacity>
        </Animated.View>

        {/* 1. TOP LOGO HEADER (Hides Last) */}
        <Animated.View style={[styles.logoHeaderWrapper, { zIndex: 3, top: 0 }, logoHeaderStyle]}>
          <TopHeader setIsMenuOpen={setIsMenuOpen} unreadCount={unreadCount} />
        </Animated.View>

        {/* ========================================== */}
        {/* 🔵 THE SCROLLING FEED                      */}
        {/* ========================================== */}
        {loading && allPosts.length === 0 ? (
          <ScrollView style={{flex: 1, paddingTop: TOTAL_HIDABLE_H}}><SkeletonPost /><SkeletonPost /></ScrollView>
        ) : (
          <AnimatedFlatList
            data={filteredPosts} 
            keyExtractor={(item: any, index: number) => item.id ? item.id : `fallback_${index}`}
            
            // 🎢 ATTACH SCROLL HANDLER
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            
            // Padding to ensure first content is visible below headers
            contentContainerStyle={{ 
              paddingTop: feedType === 'FOR_YOU' ? TOTAL_HIDABLE_H : LOGO_HEADER_H + TABS_H, 
              paddingBottom: 100 
            }}
            
            ListHeaderComponent={<FeedHeader />}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={() => { setRefreshing(true); setLastVisiblePost(null); fetchInitialFeed(); }} 
                colors={["#4f46e5"]} 
                progressViewOffset={TOTAL_HIDABLE_H}
              />
            }
            onEndReached={handleLoadMore} 
            onEndReachedThreshold={0.5}
            ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color="#4f46e5" style={{marginVertical: 20}} /> : null}
            initialNumToRender={5} maxToRenderPerBatch={5} windowSize={5} removeClippedSubviews={true}
            renderItem={({ item }: { item: any }) => {
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
            ListEmptyComponent={!loading && allPosts.length === 0 ? (
              <View style={{alignItems: 'center', marginTop: 40}}>
                <Ionicons name="planet-outline" size={60} color="#4f46e5" />
                <Text style={{fontWeight: '800', marginTop: 15}}>No posts found.</Text>
              </View>
            ) : null}
          />
        )}
      </View>

      <ImageViewerModal visibleImage={visibleImage} setVisibleImage={setVisibleImage} />
      <CommentsModal activeCommentPost={activeCommentPost} setActiveCommentPost={setActiveCommentPost} comments={comments} newComment={newComment} setNewComment={setNewComment} handlePostComment={handlePostComment} isSubmittingComment={isSubmittingComment} currentUserAvatar={auth.currentUser?.photoURL} />
      <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={() => router.push('/create-post')}><View style={styles.fabInner}><Ionicons name="add" size={32} color="#fff" /></View></TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' }, 
  logoHeaderWrapper: { position: 'absolute', width: '100%', height: LOGO_HEADER_H, backgroundColor: '#fff' },
  feedTabsContainer: { position: 'absolute', width: '100%', height: TABS_H, flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 20 },
  feedTab: { flex: 1, alignItems: 'center', paddingVertical: 14, position: 'relative' },
  feedTabText: { fontSize: 15, fontWeight: '700', color: '#64748b' },
  feedTabTextActive: { color: '#0f172a', fontWeight: '900' },
  activeTabIndicator: { position: 'absolute', bottom: -1, width: 40, height: 4, backgroundColor: '#4f46e5', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  categoryFilterContainer: { position: 'absolute', width: '100%', height: FILTERS_H, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#f1f5f9', borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  activeFilterPill: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  filterPillText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  activeFilterPillText: { color: '#fff' },
  fab: { position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 90, right: 20, zIndex: 100 },
  fabInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
});