import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Platform, TouchableOpacity, 
  StatusBar, ActivityIndicator, RefreshControl, ScrollView, Alert, Keyboard, Dimensions, TextInput, Share, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';

import { useRewardStore } from '../../store/useRewardStore'; 

import BrandLogo from '../../components/BrandLogo';

// 🔥 ALL COMPONENTS
import ResourcePreview from '../../components/ResourcePreview';
import PostCard from '../../components/FeedPost';
import SkeletonPost from '../../components/SkeletonPost';
import SidebarMenu from '../../components/SidebarMenu';
import FeedHeader from '../../components/FeedHeader';
import TopHeader from '../../components/TopHeader';
import EduxityLoader from '../../components/EduxityLoader'; // Ensure this is imported
import CommentsModal from '../../components/CommentsModal';
import ImageViewerModal from '../../components/ImageViewerModal';
import { FormulaNinjaGame, AlgebraSprintGame } from '../../components/games/FoundationGames';
import { BrainMatchGame, SpeedMathGame, GuessElementGame, UnitMasterGame, SeriesSolverGame, WordScrambleGame, EquationBalancerGame, VectorDashGame, BioTimeAttackGame, BugHunterGame } from '../../components/games/GamesBundle';

// FIREBASE 
import { auth, db } from '../../firebaseConfig';
import { 
  collection, query, orderBy, onSnapshot, doc, updateDoc, 
  limit, addDoc, serverTimestamp, getDoc, where, getDocs, 
  startAfter, deleteField, arrayUnion // 🔥 deleteField aur arrayUnion add kiya
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { registerForPushNotificationsAsync } from '../../helpers/notificationEngine'; 
import * as Haptics from 'expo-haptics'; 
import Animated, { 
  useSharedValue, useAnimatedStyle, useAnimatedScrollHandler, 
  interpolate, Extrapolation, Layout, FadeInDown
} from 'react-native-reanimated';
import { personalizeFeedForUser } from '../../helpers/feedAlgorithm';
import { LinearGradient } from 'expo-linear-gradient';

const ALL_CATEGORIES = ['General', 'JEE', 'NEET', 'UPSC', 'Coding', 'Notes', 'Exams'];
const { width } = Dimensions.get('window');

const LOGO_HEADER_H = 60;
const TABS_H = 50;
const FILTERS_H = 60;
const TOTAL_HIDABLE_H = LOGO_HEADER_H + TABS_H + FILTERS_H;

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

// ==========================================
// 🚀 NATIVE PROMO COMPONENTS
// ==========================================

const PromoWaitlistCard = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleJoinWaitlist = async () => {
    if (!email.includes('@') || email.length < 5) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'waitlist'), {
        email: email.trim(),
        userUid: auth.currentUser?.uid || 'anonymous',
        createdAt: serverTimestamp(),
        source: 'feed_promo_detailed'
      });
      setSubmitted(true);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert("Error", "Could not join waitlist right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Animated.View entering={FadeInDown.springify()} style={styles.promoCardLarge}>
      <LinearGradient colors={['#0f172a', '#312e81', '#4f46e5']} style={styles.promoGradientLarge} start={{x:0, y:0}} end={{x:1, y:1}}>
        <View style={styles.promoBadge}><Text style={styles.promoBadgeText}>COMING SOON ON PLAY STORE AND APP STORE</Text></View>
        <Text style={styles.promoTitleLarge}>Eduxity App 📱</Text>
        <Text style={styles.promoSubLarge}>
          We are currently running as a powerful Web Platform, but our dedicated Android & iOS apps are in heavy development. Get ready to experience learning like never before.
        </Text>
        <View style={styles.promoFeaturesContainer}>
          <View style={styles.promoFeatureRow}><View style={styles.promoFeatureIcon}><Ionicons name="flash" size={16} color="#fde047" /></View><Text style={styles.promoFeatureText}>Lightning Fast Native Performance</Text></View>
          <View style={styles.promoFeatureRow}><View style={styles.promoFeatureIcon}><Ionicons name="notifications" size={16} color="#fde047" /></View><Text style={styles.promoFeatureText}>Instant Doubt & Reply Notifications</Text></View>
          <View style={styles.promoFeatureRow}><View style={styles.promoFeatureIcon}><Ionicons name="cloud-offline" size={16} color="#fde047" /></View><Text style={styles.promoFeatureText}>Offline Access to Saved Notes</Text></View>
        </View>
        <View style={styles.promoDivider} />
        <Text style={styles.promoCallToAction}>Drop your email to get early access & exclusive founder badges!</Text>
        {submitted ? (
          <View style={styles.successBoxLarge}><Ionicons name="checkmark-circle" size={24} color="#10b981" /><Text style={styles.successTextLarge}>You are on the Priority Waitlist! 🚀</Text></View>
        ) : (
          <View style={styles.promoInputRowLarge}>
            <TextInput style={styles.promoInputLarge} placeholder="Enter your email address" placeholderTextColor="#94a3b8" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
            <TouchableOpacity style={styles.promoBtnLarge} onPress={handleJoinWaitlist} disabled={loading}>{loading ? <ActivityIndicator size="small" color="#0f172a" /> : <Text style={styles.promoBtnTextLarge}>Notify Me</Text>}</TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

const PromoShareCard = () => {
  const handleShare = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try { await Share.share({ message: 'Join me on Eduxity - The ultimate student community! Build your study group, play multiplayer quizzes, and solve doubts together. 🚀 https://eduxity.com' }); } catch (error) { console.log(error); }
  };
  return (
    <Animated.View entering={FadeInDown.springify()} style={styles.promoPostCard}>
      <View style={styles.promoPostHeader}><View style={styles.promoPostAuthor}><View style={styles.promoSystemAvatar}><BrandLogo variant="medium" /></View><View><Text style={styles.promoPostAuthorName}>Eduxity Team <Ionicons name="checkmark-circle" size={14} color="#3b82f6" /></Text><Text style={styles.promoPostTime}>Announcement</Text></View></View></View>
      <Text style={styles.promoPostTitle}>Your Study Circle is Incomplete! 🌐</Text>
      <Text style={styles.promoPostText}>Eduxity is built for collaborative learning. When you invite your friends, classmates, and study partners, you unlock the true power of this platform.</Text>
      <View style={styles.promoPostBenefits}>
        <View style={styles.promoPostBenefitItem}><Ionicons name="checkmark-circle" size={18} color="#10b981" /><Text style={styles.promoPostBenefitText}>Solve complex doubts together in real-time</Text></View>
        <View style={styles.promoPostBenefitItem}><Ionicons name="checkmark-circle" size={18} color="#10b981" /><Text style={styles.promoPostBenefitText}>Compete in multiplayer study games</Text></View>
        <View style={styles.promoPostBenefitItem}><Ionicons name="checkmark-circle" size={18} color="#10b981" /><Text style={styles.promoPostBenefitText}>Share private notes and live test series</Text></View>
      </View>
      <TouchableOpacity style={styles.shareActionBtnLarge} onPress={handleShare}>
        <LinearGradient colors={['#ec4899', '#f43f5e']} style={styles.shareActionGradient} start={{x:0, y:0}} end={{x:1, y:1}}><Ionicons name="share-social" size={22} color="#fff" style={{ marginRight: 8 }} /><Text style={styles.shareActionTextLarge}>Share Invite Link</Text></LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ==========================================
// 🌟 MAIN FEED SCREEN
// ==========================================
export default function FeedScreen() {
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [feedType, setFeedType] = useState<'FOR_YOU' | 'FOLLOWING'>('FOR_YOU');
  const [visibleImage, setVisibleImage] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
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

  const scrollY = useSharedValue(0);
  const diffClampY = useSharedValue(0); 

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      const currentY = e.contentOffset.y;
      const diff = currentY - scrollY.value;
      if (currentY < 0) { diffClampY.value = 0; } 
      else { diffClampY.value = Math.max(0, Math.min(TOTAL_HIDABLE_H, diffClampY.value + diff)); }
      scrollY.value = currentY;
    }
  });

  const logoHeaderStyle = useAnimatedStyle(() => {
    const ty = interpolate(diffClampY.value, [0, FILTERS_H + TABS_H, TOTAL_HIDABLE_H], [0, 0, -LOGO_HEADER_H], Extrapolation.CLAMP);
    return { transform: [{ translateY: ty }] };
  });

  const tabsStyle = useAnimatedStyle(() => {
    const ty = interpolate(diffClampY.value, [0, FILTERS_H, FILTERS_H + TABS_H + LOGO_HEADER_H], [0, 0, -(TABS_H + LOGO_HEADER_H)], Extrapolation.CLAMP);
    return { transform: [{ translateY: ty }] };
  });

  const filterStyle = useAnimatedStyle(() => { return { transform: [{ translateY: -diffClampY.value }] }; });

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
  if (allPosts.length === 0) setLoading(true); // 🔥 Sirf first time skeleton aayega, silent refresh par nahi
  try {
      const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(POSTS_PER_PAGE));
      const examsQuery = query(collection(db, 'exams_enterprise'), orderBy('createdAt', 'desc'), limit(5));
      const [postsSnap, examsSnap] = await Promise.all([ getDocs(postsQuery), getDocs(examsQuery) ]);
      if (!postsSnap.empty) { setLastVisiblePost(postsSnap.docs[postsSnap.docs.length - 1]); } 
      else { setHasMorePosts(false); }
      
      let fetchedPosts = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetchedPosts = fetchedPosts.filter(post => post.type !== 'doubt');

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
        
        let fetchedNewPosts = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        fetchedNewPosts = fetchedNewPosts.filter(post => post.type !== 'doubt');

        setAllPosts(prevPosts => {
          const updated = [...prevPosts, ...fetchedNewPosts];
          return Array.from(new Map(updated.map(item => [item.id, item])).values());
        });
        setHasMorePosts(postsSnap.docs.length === POSTS_PER_PAGE);
      } else { setHasMorePosts(false); }
    } catch (error) { console.error("Load More Error: ", error); } finally { setLoadingMore(false); }
  };

// 🚀 TRIGGER 1: UPLOAD FIX (Jab bhi user is screen par wapas aayega, feed refresh hogi)
  useFocusEffect(
    useCallback(() => {
      if (currentUid) {
        fetchInitialFeed(); // Silent refresh
      }
    }, [currentUid])
  );

  // 🚀 TRIGGER 2: DELETE FIX (Agar user ne koi apni post delete ki, toh feed auto-refresh hogi)
  useEffect(() => {
    if (!currentUid) return;
    const q = query(collection(db, 'posts'), where('authorId', '==', currentUid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Check agar koi post database se udai gayi hai
      const hasRemovals = snapshot.docChanges().some(change => change.type === 'removed');
      if (hasRemovals) {
        fetchInitialFeed(); // Silent refresh
      }
    });
    return () => unsubscribe();
  }, [currentUid]);

  useEffect(() => {
    if (!allPosts.length) { setAlgoPosts([]); return; }
    if (feedType === 'FOLLOWING') { 
      const followingPosts = allPosts.filter(post => myFriends.includes(post.authorId) || post.authorId === currentUid);
      setAlgoPosts(followingPosts); return; 
    }
    const personalizedFeed = personalizeFeedForUser(allPosts, currentUserData, myFriends, currentUid as string);
    setAlgoPosts(personalizedFeed);
  }, [allPosts, feedType, myFriends, currentUserData]);

  const processedFeed = useMemo(() => {
    let filtered = [...algoPosts];
    if (selectedTag !== 'all') {
      filtered = filtered.filter(post => post.tags && post.tags.some((t: string) => t.toLowerCase() === selectedTag));
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d => 
        d.text?.toLowerCase().includes(query) || d.title?.toLowerCase().includes(query) || (d.tags && d.tags.some((tag: string) => tag.toLowerCase().includes(query)))
      );
    }
    const finalFeed: any[] = [];
    filtered.forEach((post, index) => {
      finalFeed.push(post);
      if (index === 4) finalFeed.push({ id: 'promo_waitlist', type: 'promo_waitlist' });
      if ((index + 1) % 10 === 0) finalFeed.push({ id: `promo_share_${index}`, type: 'promo_share' });
    });
    return finalFeed;
  }, [algoPosts, selectedTag, searchQuery]);

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

  // 👍 COMMENT REACTION LOGIC (LinkedIn Style)
  const handleCommentReaction = async (commentId: string, reactionType: string) => {
    if (!currentUid || !activeCommentPost) return;
    
    const collName = activeCommentPost.type === 'live_test' ? 'exams_enterprise' : 'posts';
    const commentRef = doc(db, collName, activeCommentPost.id, 'comments', commentId);

    try {
      if (reactionType === 'remove') {
        // User ne reaction hata diya
        await updateDoc(commentRef, {
          [`reactions.${currentUid}`]: deleteField()
        });
      } else {
        // Naya reaction set kiya (👍, ❤️, etc.)
        await updateDoc(commentRef, {
          [`reactions.${currentUid}`]: reactionType
        });
      }
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      console.error("Reaction Error:", e);
    }
  };

  // 💬 COMMENT REPLY LOGIC (Insta Style)
  const handleCommentReply = async (commentId: string, replyText: string) => {
    if (!currentUid || !activeCommentPost || !replyText.trim()) return;
    
    setIsSubmittingComment(true);
    const collName = activeCommentPost.type === 'live_test' ? 'exams_enterprise' : 'posts';
    const commentRef = doc(db, collName, activeCommentPost.id, 'comments', commentId);

    try {
      const newReply = {
        id: Math.random().toString(36).substr(2, 9), // Unique ID for reply
        authorId: currentUid,
        authorName: auth.currentUser?.displayName || 'Scholar',
        authorAvatar: auth.currentUser?.photoURL || '',
        text: replyText.trim(),
        createdAt: Date.now(), // Local timestamp for replies
      };

      await updateDoc(commentRef, {
        replies: arrayUnion(newReply)
      });

      setNewComment(""); // Input clear karo
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert("Error", "Reply send nahi ho paaya.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleLoadMore = () => { 
    if (!loading && !loadingMore && hasMorePosts) { fetchMorePosts(); } 
  };

  const userInterests = currentUserData?.interests || [];
  const popularTags = ['jee', 'neet', 'coding', 'doubts', 'notes'];
  const rawFilters = ['all', ...userInterests, ...popularTags];
  const displayFilters = [...new Set(rawFilters.map(t => t.toLowerCase()))];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SidebarMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} currentUid={currentUid} />

      <View style={{ flex: 1, position: 'relative' }}>
        
        {feedType === 'FOR_YOU' && (
          <Animated.View style={[styles.categoryFilterContainer, { zIndex: 1, top: LOGO_HEADER_H + TABS_H }, filterStyle]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15, paddingVertical: 12 }}>
              {displayFilters.map((tag) => (
                <TouchableOpacity key={tag} style={[styles.filterPill, selectedTag === tag && styles.activeFilterPill]} onPress={() => { setSelectedTag(tag); if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                  <Text style={[styles.filterPillText, selectedTag === tag && styles.activeFilterPillText]}>{tag.charAt(0).toUpperCase() + tag.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

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

        <Animated.View style={[styles.logoHeaderWrapper, { zIndex: 3, top: 0 }, logoHeaderStyle]}>
          <TopHeader setIsMenuOpen={setIsMenuOpen} unreadCount={unreadCount} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        </Animated.View>

       {/* 🔥 FEED LOAD HOTE TIME SKELETON UI (Premium Feel) */}
        {loading && allPosts.length === 0 ? (
          <ScrollView style={{flex: 1, paddingTop: TOTAL_HIDABLE_H}}>
            <SkeletonPost />
            <SkeletonPost />
            <SkeletonPost />
          </ScrollView>
        ) : (
          <AnimatedFlatList
            data={processedFeed} 
            keyExtractor={(item: any, index: number) => item.id ? item.id : `fallback_${index}`}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingTop: feedType === 'FOR_YOU' ? TOTAL_HIDABLE_H : LOGO_HEADER_H + TABS_H, paddingBottom: 100 }}
            ListHeaderComponent={<FeedHeader />}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setLastVisiblePost(null); fetchInitialFeed(); }} colors={["#4f46e5"]} tintColor="#4f46e5" progressViewOffset={TOTAL_HIDABLE_H} />}
            onEndReached={handleLoadMore} 
            onEndReachedThreshold={0.5}
            // 🔥 LOAD MORE PAR BHI EDUXITY LOADER
            ListFooterComponent={loadingMore ? (
              <View style={{ height: 100, justifyContent: 'center', alignItems: 'center' }}>
                <EduxityLoader />
              </View>
            ) : null}
            initialNumToRender={5} maxToRenderPerBatch={5} windowSize={5} removeClippedSubviews={true}
            renderItem={({ item }: { item: any }) => {
              if (item.type === 'promo_waitlist') return <PromoWaitlistCard />;
              if (item.type === 'promo_share') return <PromoShareCard />;
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
              return <PostCard item={item} currentUid={currentUid} onOpenComments={setActiveCommentPost} onImagePress={setVisibleImage} />;
            }}
            ListEmptyComponent={!loading && allPosts.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconBg}><Ionicons name="planet-outline" size={50} color="#4f46e5" /></View>
                <Text style={styles.emptyTitle}>Nothing to see here yet.</Text>
                <Text style={styles.emptySub}>Follow people or check your interests to see posts.</Text>
              </View>
            ) : null}
          />
        )}
      </View>

      <ImageViewerModal visibleImage={visibleImage} setVisibleImage={setVisibleImage} />
<CommentsModal 
  activeCommentPost={activeCommentPost} 
  setActiveCommentPost={setActiveCommentPost} 
  comments={comments} 
  newComment={newComment} 
  setNewComment={setNewComment} 
  handlePostComment={handlePostComment} 
  isSubmittingComment={isSubmittingComment} 
  currentUserAvatar={auth.currentUser?.photoURL}
  currentUid={currentUid} // 🔥 Ye zaroori hai reaction check karne ke liye
  handleReaction={handleCommentReaction} // 🔥 Pass reaction logic
  handleReply={handleCommentReply}       // 🔥 Pass reply logic
/>
      <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={() => router.push('/create-post')}>
        <View style={styles.fabInner}><Ionicons name="add" size={32} color="#fff" /></View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// 🎨 STYLES
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
  
  promoCardLarge: { marginHorizontal: 15, marginTop: 15, marginBottom: 10, borderRadius: 24, overflow: 'hidden', shadowColor: '#4f46e5', shadowOffset: {width:0, height:10}, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8 },
  promoGradientLarge: { padding: 25, borderRadius: 24 },
  promoBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  promoBadgeText: { color: '#f8fafc', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  promoTitleLarge: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 8 },
  promoSubLarge: { fontSize: 14, color: '#cbd5e1', lineHeight: 22, fontWeight: '500', marginBottom: 20 },
  promoFeaturesContainer: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 15, borderRadius: 16, marginBottom: 20 },
  promoFeatureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  promoFeatureIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  promoFeatureText: { color: '#f8fafc', fontSize: 14, fontWeight: '700' },
  promoDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 20 },
  promoCallToAction: { color: '#fde047', fontSize: 12, fontWeight: '800', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  promoInputRowLarge: { flexDirection: 'column', gap: 10 },
  promoInputLarge: { backgroundColor: '#fff', height: 50, borderRadius: 14, paddingHorizontal: 20, fontSize: 15, color: '#0f172a', fontWeight: '600' },
  promoBtnLarge: { backgroundColor: '#fde047', height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: '#fde047', shadowOffset: {width:0, height:4}, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
  promoBtnTextLarge: { color: '#0f172a', fontWeight: '900', fontSize: 16 },
  successBoxLarge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: 15, borderRadius: 14, borderWidth: 1, borderColor: '#10b981' },
  successTextLarge: { color: '#a7f3d0', fontWeight: '800', marginLeft: 10, fontSize: 14 },

  promoPostCard: { backgroundColor: '#fff', marginHorizontal: 15, marginTop: 15, marginBottom: 10, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  promoPostHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  promoPostAuthor: { flexDirection: 'row', alignItems: 'center' },
  promoSystemAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 2, borderColor: '#bfdbfe' },
  promoPostAuthorName: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  promoPostTime: { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 2 },
  promoPostTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginBottom: 8, lineHeight: 28 },
  promoPostText: { fontSize: 15, color: '#475569', lineHeight: 24, marginBottom: 20 },
  promoPostBenefits: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  promoPostBenefitItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  promoPostBenefitText: { color: '#334155', fontSize: 14, fontWeight: '700', marginLeft: 10 },
  shareActionBtnLarge: { borderRadius: 16, overflow: 'hidden', shadowColor: '#ec4899', shadowOffset: {width:0, height:6}, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  shareActionGradient: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16 },
  shareActionTextLarge: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },

  emptyState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyIconBg: { backgroundColor: '#eef2ff', padding: 20, borderRadius: 40, marginBottom: 15 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 5 },
  emptySub: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22 },

  fab: { position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 90, right: 20, zIndex: 100 },
  fabInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10 },
});