import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl, Platform, ScrollView, Linking, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { auth, db } from '../../firebaseConfig';
import { 
  collection, query, orderBy, onSnapshot, doc, updateDoc, 
  arrayUnion, arrayRemove, limit, addDoc, serverTimestamp, getDoc, where, deleteDoc
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; 
import { registerForPushNotificationsAsync } from '../../helpers/notificationEngine'; 
import { processAction } from '../../helpers/gamificationEngine'; 
import * as Haptics from 'expo-haptics'; // Added for premium feel
import Animated, { FadeInDown, Layout, useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolate, Extrapolation } from 'react-native-reanimated';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
const CATEGORIES = ['All', 'General', 'JEE Warriors', 'Coding Group', 'Doubts', 'Resources'];

const timeAgo = (timestamp: number | undefined) => {
  if (!timestamp) return 'Just now';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// ==========================================
// 🃏 INLINE FLASHCARD PLAYER COMPONENT
// ==========================================
const InlineFlashcardPlayer = ({ cardsData, title }: { cardsData: any[], title: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const flipAnim = useSharedValue(0);

  if (!cardsData || cardsData.length === 0) return null;

  const currentCard = cardsData[currentIndex];

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipAnim.value, [0, 180], [0, 180], Extrapolation.CLAMP);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden',
      zIndex: flipAnim.value < 90 ? 1 : 0,
      opacity: flipAnim.value < 90 ? 1 : 0,
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipAnim.value, [0, 180], [180, 360], Extrapolation.CLAMP);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden',
      zIndex: flipAnim.value > 90 ? 1 : 0,
      opacity: flipAnim.value > 90 ? 1 : 0,
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0
    };
  });

  const handleFlip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsFlipped(!isFlipped);
    flipAnim.value = withTiming(isFlipped ? 0 : 180, { duration: 400 });
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentIndex < cardsData.length - 1) {
      flipAnim.value = 0;
      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    flipAnim.value = 0;
    setIsFlipped(false);
    setCurrentIndex(0);
    setIsFinished(false);
  };

  if (isFinished) {
    return (
      <View style={styles.inlineFlashcardContainer}>
        <View style={styles.flashcardFinish}>
          <Ionicons name="trophy" size={50} color="#fde047" />
          <Text style={styles.finishDeckTitle}>Deck Completed!</Text>
          <Text style={styles.finishDeckSub}>You revised {cardsData.length} cards.</Text>
          <TouchableOpacity style={styles.restartDeckBtn} onPress={handleRestart}>
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.restartDeckText}>Revise Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.inlineFlashcardContainer}>
      <View style={styles.inlineFlashcardHeader}>
        <Text style={styles.inlineFlashcardTitle} numberOfLines={1}>{title || 'Revision Deck'}</Text>
        <Text style={styles.inlineFlashcardCount}>{currentIndex + 1} / {cardsData.length}</Text>
      </View>

      <View style={styles.inlineCardArea}>
        {/* FRONT */}
        <Animated.View style={[styles.inlineCard, styles.inlineCardFront, frontStyle]}>
          <Text style={styles.inlineCardCategory}>Question</Text>
          <ScrollView contentContainerStyle={styles.inlineScrollCenter}>
            <Text style={styles.inlineCardQuestion}>{currentCard?.q}</Text>
          </ScrollView>
          <TouchableOpacity style={styles.inlineFlipBtn} onPress={handleFlip}>
            <Ionicons name="refresh" size={16} color="#fff" style={{marginRight: 5}}/>
            <Text style={styles.inlineFlipText}>Tap to see Answer</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* BACK */}
        <Animated.View style={[styles.inlineCard, styles.inlineCardBack, backStyle]}>
          <Text style={styles.inlineCardCategory}>Answer</Text>
          <ScrollView contentContainerStyle={styles.inlineScrollCenter}>
            <Text style={styles.inlineCardAnswer}>{currentCard?.a}</Text>
          </ScrollView>
          <View style={styles.inlineCardActions}>
            <TouchableOpacity style={[styles.inlineActionBtn, {backgroundColor: '#ef4444'}]} onPress={handleNext}>
              <Text style={styles.inlineActionText}>Forgot</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.inlineActionBtn, {backgroundColor: '#10b981'}]} onPress={handleNext}>
              <Text style={styles.inlineActionText}>Knew It</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

// ==========================================
// 🔥 THE PREMIUM POST CARD 
// ==========================================
const PostCard = ({ item, currentUid }: any) => {
  const router = useRouter();
  const isLiked = item.likes?.includes(currentUid);
  const isSaved = item.savedBy?.includes(currentUid);
  const userVoteIndex = item.voters ? item.voters[currentUid] : undefined;
  const hasVoted = userVoteIndex !== undefined;

  const likeScale = useSharedValue(1);
  const saveScale = useSharedValue(1);

  const sendNotification = async () => {
    if (item.authorId === currentUid) return;
    try {
      await addDoc(collection(db, 'notifications'), {
        recipientId: item.authorId,
        senderId: currentUid,
        senderName: auth.currentUser?.displayName || 'User',
        senderAvatar: auth.currentUser?.photoURL || '',
        type: 'like',
        postId: item.id,
        isRead: false,
        createdAt: serverTimestamp()
      });
    } catch (error) { console.log(error); }
  };

  const handleLike = async () => {
    if (!currentUid) return;
    likeScale.value = withSpring(0.7, {}, () => { likeScale.value = withSpring(1); });
    try {
      const postRef = doc(db, 'posts', item.id);
      if (isLiked) {
        await updateDoc(postRef, { likes: arrayRemove(currentUid) });
      } else {
        await updateDoc(postRef, { likes: arrayUnion(currentUid) });
        await sendNotification(); 
        if (item.authorId !== currentUid) {
           await processAction(item.authorId, 'RECEIVE_LIKE');
        }
      }
    } catch (error) { console.log("Like error:", error); }
  };

  const handleSave = async () => {
    if (!currentUid) return;
    saveScale.value = withSpring(0.7, {}, () => { saveScale.value = withSpring(1); });
    try {
      const postRef = doc(db, 'posts', item.id);
      if (isSaved) await updateDoc(postRef, { savedBy: arrayRemove(currentUid) });
      else await updateDoc(postRef, { savedBy: arrayUnion(currentUid) });
    } catch (error) { console.log("Save error:", error); }
  };

  const handleDeletePost = async () => {
    if (Platform.OS === 'web') {
      const confirmDelete = window.confirm("Are you sure you want to delete this post?");
      if (confirmDelete) {
        try { await deleteDoc(doc(db, 'posts', item.id)); } catch (error) { alert("Could not delete."); }
      }
    } else {
      Alert.alert("Delete Post?", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => {
            try { await deleteDoc(doc(db, 'posts', item.id)); } catch (error) { Alert.alert("Error", "Could not delete."); }
          }
        }
      ]);
    }
  };

  const handleVote = async (optIndex: number) => {
    if (hasVoted || !currentUid) return; 
    try {
      const postRef = doc(db, 'posts', item.id);
      const updatedPollOptions = [...item.pollOptions];
      updatedPollOptions[optIndex].votes += 1;
      await updateDoc(postRef, {
        pollOptions: updatedPollOptions,
        totalVotes: (item.totalVotes || 0) + 1,
        [`voters.${currentUid}`]: optIndex
      });
      await processAction(currentUid, 'POLL_ANSWER');
    } catch (error) { console.log("Vote error:", error); }
  };

  const animatedLikeStyle = useAnimatedStyle(() => ({ transform: [{ scale: likeScale.value }] }));
  const animatedSaveStyle = useAnimatedStyle(() => ({ transform: [{ scale: saveScale.value }] }));

  return (
    <Animated.View entering={FadeInDown.duration(400).springify()} layout={Layout.springify()} style={styles.postCard}>
      
      {item.algoReason && (
        <View style={styles.algoReasonBar}>
          <Ionicons name="sparkles" size={14} color="#6366f1" />
          <Text style={styles.algoReasonText}>{item.algoReason}</Text>
        </View>
      )}

      <View style={styles.postHeader}>
        <TouchableOpacity onPress={() => router.push(`/user/${item.authorId}`)}>
          <Image source={{ uri: item.authorAvatar || DEFAULT_AVATAR }} style={styles.avatar} />
        </TouchableOpacity>
        
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{item.authorName}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            {item.category && (
              <View style={styles.categoryBadge}>
                {item.type === 'code' && <Ionicons name="code-slash" size={10} color="#fff" style={{ marginRight: 4 }} />}
                {item.pollMode === 'quiz' && <Ionicons name="school" size={10} color="#fff" style={{ marginRight: 4 }} />}
                {item.type === 'resource' && <Ionicons name="book" size={10} color="#fff" style={{ marginRight: 4 }} />}
                {item.type === 'flashcard' && <Ionicons name="layers" size={10} color="#fff" style={{ marginRight: 4 }} />}
                <Text style={styles.categoryBadgeText}>{item.category}</Text>
              </View>
            )}
            <Text style={styles.timeText}>• {timeAgo(item.createdAt?.toMillis())}</Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          {item.authorId === currentUid ? (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDeletePost}>
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.moreBtn}>
              <Ionicons name="ellipsis-horizontal" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {item.text ? <Text style={styles.postText}>{item.text}</Text> : null}

      {/* 🃏 RENDER INLINE FLASHCARD IF TYPE IS FLASHCARD */}
      {item.type === 'flashcard' && item.cardsData && (
        <InlineFlashcardPlayer cardsData={item.cardsData} title={item.title} />
      )}

      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.tags.map((tag: string, idx: number) => (
            <View key={idx} style={styles.tagPill}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {item.type === 'image' && item.imageUrl ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.imageUrl }} style={styles.postImage} resizeMode="cover" />
        </View>
      ) : null}

      {item.type === 'code' && item.codeSnippet ? (
        <View style={styles.codeBlockContainer}>
          <View style={styles.macWindowHeader}>
            <View style={styles.macDots}>
              <View style={[styles.macDot, { backgroundColor: '#ff5f56' }]} /><View style={[styles.macDot, { backgroundColor: '#ffbd2e' }]} /><View style={[styles.macDot, { backgroundColor: '#27c93f' }]} />
            </View>
            <Text style={styles.codeLanguage}>{item.language || 'Code'}</Text>
          </View>
          <Text style={styles.codeText}>{item.codeSnippet}</Text>
        </View>
      ) : null}

      {item.type === 'poll' && item.pollOptions ? (
        <View style={styles.pollContainer}>
          <View style={styles.pollHeader}>
            <View style={[styles.liveIndicator, item.pollMode === 'quiz' && { backgroundColor: '#8b5cf6' }]} />
            <Text style={[styles.liveText, item.pollMode === 'quiz' && { color: '#8b5cf6' }]}>
              {item.pollMode === 'quiz' ? 'LIVE QUIZ' : 'LIVE POLL'}
            </Text>
          </View>
          {item.pollOptions.map((opt: any, idx: number) => {
            const totalVotes = item.totalVotes || 0; 
            const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
            let barColor = '#e0f2fe'; let textColor = '#0f172a'; let icon = null;
            if (hasVoted) {
              if (idx === userVoteIndex) { barColor = '#bae6fd'; textColor = '#0369a1'; }
            }
            if (hasVoted) {
              return (
                <View key={idx} style={[styles.pollOptionResult, idx === userVoteIndex && { borderWidth: 1, borderColor: '#3b82f6' }]}>
                  <Animated.View style={[styles.pollFill, { width: `${percentage}%`, backgroundColor: barColor }]} />
                  <View style={styles.pollContent}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}><Text style={[styles.pollOptionText, { color: textColor }]}>{opt.text}</Text>{icon}</View>
                    <Text style={[styles.pollPercentage, { color: textColor }]}>{percentage}%</Text>
                  </View>
                </View>
              );
            } else {
              return (
                <TouchableOpacity key={idx} style={styles.pollOptionBtn} activeOpacity={0.7} onPress={() => handleVote(idx)}>
                  <Text style={styles.pollOptionBtnText}>{opt.text}</Text>
                </TouchableOpacity>
              );
            }
          })}
          <Text style={styles.pollTotalVotes}>{item.totalVotes || 0} votes {hasVoted ? '• Results visible' : ''}</Text>
        </View>
      ) : null}

      {item.type === 'resource' && (
        <View style={styles.resourceContainer}>
          <View style={styles.resourceHeader}>
            <View style={styles.resourceIcon}>
              <Ionicons name="document-text" size={22} color="#4f46e5" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.resourceTitle} numberOfLines={1}>{item.title || 'Study Material'}</Text>
              <Text style={styles.resourceSub}>{item.fileUrl ? 'Drive Document' : 'AI Smart Notes'}</Text>
            </View>
            {item.fileUrl && (
              <TouchableOpacity style={styles.downloadBtn} onPress={() => Linking.openURL(item.fileUrl)}>
                <Ionicons name="cloud-download" size={16} color="#fff" />
                <Text style={styles.downloadText}>Save</Text>
              </TouchableOpacity>
            )}
          </View>

          {item.fileUrl && item.fileUrl.includes('drive.google.com') ? (
            <View style={styles.pdfPreviewBox}>
              {Platform.OS === 'web' ? (
                // @ts-ignore
                <iframe src={item.fileUrl.replace(/\/view.*$/, '/preview')} style={{ width: '100%', height: '100%', border: 'none' }} title="PDF Preview" />
              ) : (
                <WebView source={{ uri: item.fileUrl.replace(/\/view.*$/, '/preview') }} style={{ flex: 1 }} startInLoadingState={true} renderLoading={() => <View style={styles.loaderCenter}><ActivityIndicator size="small" color="#4f46e5" /></View>} />
              )}
            </View>
          ) : item.structuredText ? (
            <TouchableOpacity style={styles.smartNotePreview} onPress={() => router.push(`/resources/view/${item.id}`)} activeOpacity={0.8}>
               <Ionicons name="scan-circle" size={40} color="#ec4899" />
               <Text style={styles.smartNoteText}>Read AI Smart Notes</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      <View style={styles.actionBar}>
        <View style={styles.actionLeft}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.7}>
            <Animated.View style={animatedLikeStyle}><Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? "#ef4444" : "#475569"} /></Animated.View>
            <Text style={[styles.actionText, isLiked && { color: '#ef4444', fontWeight: '700' }]}>{item.likes?.length || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={() => router.push(`/post/${item.id}`)}>
            <Ionicons name="chatbubble-outline" size={22} color="#475569" />
            <Text style={styles.actionText}>{item.commentsCount || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <Ionicons name="share-social-outline" size={22} color="#475569" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleSave} activeOpacity={0.7} style={styles.saveBtn}>
          <Animated.View style={animatedSaveStyle}><Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={24} color={isSaved ? "#4f46e5" : "#475569"} /></Animated.View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// ==========================================
// 🔥 MAIN FEED SCREEN 
// ==========================================
export default function FeedScreen() {
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;
  
  const [posts, setPosts] = useState<any[]>([]);
  const [algoPosts, setAlgoPosts] = useState<any[]>([]); 
  const [otherStories, setOtherStories] = useState<any[]>([]);
  const [myStory, setMyStory] = useState<any>(null);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [myFriends, setMyFriends] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUid) return;
    const q = query(
      collection(db, 'notifications'), 
      where('recipientId', '==', currentUid),
      where('isRead', '==', false)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.docs.length);
    });
    return () => unsub();
  }, [currentUid]);

  useEffect(() => {
    if (currentUid) registerForPushNotificationsAsync(currentUid);
  }, [currentUid]);

  useEffect(() => {
    if (!currentUid) return;
    const fetchMyData = async () => {
      const docSnap = await getDoc(doc(db, 'users', currentUid));
      if (docSnap.exists()) setCurrentUserData(docSnap.data());
    };
    fetchMyData();

    const unsubSent = onSnapshot(query(collection(db, 'connections'), where('senderId', '==', currentUid)), (snap) => {
      const sent = snap.docs.filter(d => d.data().status === 'accepted').map(d => d.data().receiverId);
      const unsubRec = onSnapshot(query(collection(db, 'connections'), where('receiverId', '==', currentUid)), (recSnap) => {
        const rec = recSnap.docs.filter(d => d.data().status === 'accepted').map(d => d.data().senderId);
        setMyFriends([...sent, ...rec]);
      });
      return () => unsubRec();
    });
    return () => unsubSent();
  }, [currentUid]);

  useEffect(() => {
    const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(100));
    const unsubPosts = onSnapshot(postsQuery, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false); setRefreshing(false);
    });

    const storiesQuery = query(collection(db, 'stories'), orderBy('createdAt', 'desc'), limit(30));
    const unsubStories = onSnapshot(storiesQuery, (snapshot) => {
      const allStories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const uniqueUsersMap = new Map();
      allStories.forEach(story => { if (!uniqueUsersMap.has(story.authorId)) uniqueUsersMap.set(story.authorId, story); });
      const groupedStories = Array.from(uniqueUsersMap.values());
      setMyStory(groupedStories.find(s => s.authorId === currentUid) || null);
      setOtherStories(groupedStories.filter(s => s.authorId !== currentUid));
    });

    return () => { unsubPosts(); unsubStories(); };
  }, [currentUid]);

  useEffect(() => {
    if (!posts.length) return;
    const calculateScoreAndReason = (post: any) => {
      let score = 0; let reason = "";
      if (myFriends.includes(post.authorId)) { score += 100; reason = "From your Network"; }
      const myInterests: string[] = currentUserData?.interests || [];
      const postCategory = post.category || "";
      if (myInterests.some(i => i.toLowerCase().includes(postCategory.toLowerCase())) && !reason) { score += 50; reason = "Suggested for You"; }
      const likesCount = post.likes?.length || 0;
      const commentsCount = post.commentsCount || 0;
      score += (likesCount * 2) + (commentsCount * 5);
      if (likesCount > 10 && !reason) reason = "Popular on Eduxity";
      const hoursOld = (Date.now() - (post.createdAt?.toMillis() || Date.now())) / (1000 * 60 * 60);
      if (hoursOld < 24) score += 20;
      return { score, reason };
    };

    let smartPosts = posts.map(post => {
      const { score, reason } = calculateScoreAndReason(post);
      return { ...post, algoScore: score, algoReason: reason };
    });
    smartPosts.sort((a, b) => b.algoScore - a.algoScore);
    setAlgoPosts(smartPosts);
  }, [posts, currentUserData, myFriends]);

  const onRefresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); };
  const filteredPosts = selectedCategory === 'All' ? algoPosts : algoPosts.filter(post => post.category === selectedCategory);

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.storiesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15 }}>
          <TouchableOpacity style={styles.storyWrapper} activeOpacity={0.8} onPress={() => !myStory && router.push('/create-story')}>
            <View style={[styles.storyRing, { borderColor: myStory ? '#ec4899' : '#e2e8f0' }]}>
              <Image source={{ uri: auth.currentUser?.photoURL || DEFAULT_AVATAR }} style={styles.storyAvatar} />
            </View>
            {!myStory && <View style={styles.addStoryBadge}><Ionicons name="add" size={14} color="#fff" /></View>}
            <Text style={styles.storyName}>Your Story</Text>
          </TouchableOpacity>
          {otherStories.map((story) => (
            <TouchableOpacity key={story.id} style={styles.storyWrapper} activeOpacity={0.8}>
              <View style={[styles.storyRing, { borderColor: '#4f46e5' }]}><Image source={{ uri: story.authorAvatar || DEFAULT_AVATAR }} style={styles.storyAvatar} /></View>
              <Text style={styles.storyName} numberOfLines={1}>{story.authorName}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.createPostContainer}>
        <View style={styles.createInputRow}>
          <Image source={{ uri: auth.currentUser?.photoURL || DEFAULT_AVATAR }} style={styles.createAvatar} />
          <TouchableOpacity style={styles.fakeInput} onPress={() => router.push('/create-post')} activeOpacity={0.9}>
            <Text style={styles.fakeInputText}>What's on your mind?{"\n"}Share a doubt, tip, or achievement...</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.createActionsRow}>
          <TouchableOpacity style={styles.createActionBtn} onPress={() => router.push({ pathname: '/create-post', params: { type: 'image' } })}>
            <Ionicons name="camera" size={20} color="#10b981" />
            <Text style={styles.createActionText}>Media</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.createActionBtn} onPress={() => router.push({ pathname: '/create-post', params: { type: 'poll' } })}>
            <Ionicons name="stats-chart" size={18} color="#3b82f6" />
            <Text style={styles.createActionText}>Poll</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.createActionBtn} onPress={() => router.push({ pathname: '/create-post', params: { type: 'flashcard' } })}>
            <Ionicons name="layers" size={18} color="#ec4899" />
            <Text style={styles.createActionText}>Deck</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.mainHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.logoBox}><Ionicons name="school" size={22} color="#fff" /></View>
          <Text style={styles.brandName}>Eduxity</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/search-users')}>
            <Ionicons name="search" size={24} color="#0f172a" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/notification')}>
             <Ionicons name="notifications-outline" size={24} color="#0f172a" />
             {unreadCount > 0 && (
               <Animated.View style={styles.notificationBadge}>
                 <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
               </Animated.View>
             )}
         </TouchableOpacity>
        </View>
      </View>

      <View style={styles.categoryFilterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15, paddingVertical: 12 }}>
          {CATEGORIES.map((cat, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.filterPill, selectedCategory === cat && styles.activeFilterPill]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterPillText, selectedCategory === cat && styles.activeFilterPillText]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>
      ) : (
        <FlatList
          data={filteredPosts} 
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ backgroundColor: '#f1f5f9', paddingBottom: 100 }}
          ListHeaderComponent={renderHeader}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4f46e5"]} />}
          renderItem={({ item }) => <PostCard item={item} currentUid={currentUid} />}
          ListEmptyComponent={
            <View style={styles.emptyFilterState}>
              <Ionicons name="funnel-outline" size={50} color="#cbd5e1" />
              <Text style={styles.emptyText}>No posts found in &quot;{selectedCategory}&quot;</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={() => router.push('/create-post')}>
        <View style={styles.fabInner}><Ionicons name="add" size={32} color="#fff" /></View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' }, 
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  mainHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 15, paddingTop: Platform.OS === 'ios' ? 10 : 15, paddingBottom: 12, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  logoBox: { backgroundColor: '#4f46e5', padding: 6, borderRadius: 10, marginRight: 10 },
  brandName: { fontSize: 24, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  headerIcons: { flexDirection: 'row', gap: 15 },
  iconBtn: { padding: 4, position: 'relative' },
  notificationBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#ef4444', width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#fff' },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },

  categoryFilterContainer: { backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#f1f5f9', borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  activeFilterPill: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  filterPillText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  activeFilterPillText: { color: '#fff' },

  headerSection: { paddingBottom: 10 },
  storiesContainer: { backgroundColor: '#fff', paddingTop: 15, paddingBottom: 15, marginBottom: 10 },
  storyWrapper: { alignItems: 'center', marginRight: 18, position: 'relative' },
  storyRing: { padding: 3, borderRadius: 40, borderWidth: 2 },
  storyAvatar: { width: 66, height: 66, borderRadius: 33 },
  storyName: { fontSize: 12, fontWeight: '600', color: '#1e293b', marginTop: 6, maxWidth: 74, textAlign: 'center' },
  addStoryBadge: { position: 'absolute', bottom: 22, right: 0, backgroundColor: '#4f46e5', borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  
  createPostContainer: { backgroundColor: '#fff', padding: 15, marginBottom: 10 },
  createInputRow: { flexDirection: 'row', alignItems: 'center' },
  createAvatar: { width: 44, height: 44, borderRadius: 22 },
  fakeInput: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, marginLeft: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  fakeInputText: { color: '#94a3b8', fontSize: 14, fontWeight: '500', lineHeight: 20 },
  createActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderColor: '#f1f5f9' },
  createActionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },
  createActionText: { marginLeft: 8, fontSize: 13, fontWeight: '700', color: '#334155' },
  
  postCard: { backgroundColor: '#fff', marginHorizontal: 10, marginTop: 10, marginBottom: 5, borderRadius: 16, overflow: 'hidden', elevation: 2, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  algoReasonBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef2ff', paddingHorizontal: 15, paddingVertical: 8 },
  algoReasonText: { fontSize: 11, fontWeight: '800', color: '#4f46e5', marginLeft: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  postHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingTop: 15, marginBottom: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#e2e8f0' },
  authorInfo: { flex: 1, marginLeft: 12 },
  authorName: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4f46e5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  categoryBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff', textTransform: 'uppercase' },
  timeText: { fontSize: 12, color: '#94a3b8', marginLeft: 6, fontWeight: '600' },
  
  headerRightActions: { flexDirection: 'row', alignItems: 'center' },
  moreBtn: { padding: 5 },
  deleteBtn: { padding: 6, backgroundColor: '#fef2f2', borderRadius: 20, marginLeft: 5 },
  
  postText: { fontSize: 15, color: '#334155', lineHeight: 24, paddingHorizontal: 15, marginBottom: 12 },
  
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, marginBottom: 12, gap: 8 },
  tagPill: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  tagText: { color: '#4f46e5', fontSize: 12, fontWeight: '700' },

  imageContainer: { width: '100%', backgroundColor: '#f8fafc' },
  postImage: { width: '100%', height: 350 }, 
  
  codeBlockContainer: { marginHorizontal: 15, backgroundColor: '#0f172a', borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  macWindowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#1e293b' },
  macDots: { flexDirection: 'row', gap: 6 }, macDot: { width: 10, height: 10, borderRadius: 5 },
  codeLanguage: { color: '#38bdf8', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  codeText: { color: '#e2e8f0', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 13, padding: 15, lineHeight: 22 },
  
  pollContainer: { marginHorizontal: 15, backgroundColor: '#f8fafc', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 15 },
  pollHeader: { flexDirection: 'row', alignItems: 'center', position: 'absolute', top: 15, right: 15, zIndex: 10 },
  liveIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444', marginRight: 4 }, liveText: { fontSize: 10, fontWeight: '800', color: '#ef4444' },
  pollOptionBtn: { backgroundColor: '#fff', paddingVertical: 14, paddingHorizontal: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#cbd5e1' },
  pollOptionBtnText: { fontSize: 14, fontWeight: '700', color: '#1e293b', textAlign: 'center' },
  pollOptionResult: { height: 48, backgroundColor: '#f1f5f9', borderRadius: 10, marginBottom: 10, overflow: 'hidden', justifyContent: 'center' },
  pollFill: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: '#e0f2fe' },
  pollContent: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, zIndex: 10 },
  pollOptionText: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  pollPercentage: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  pollTotalVotes: { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 5, textAlign: 'right' },

  resourceContainer: { marginHorizontal: 15, marginBottom: 15, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  resourceHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fafaf9', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  resourceIcon: { backgroundColor: '#e0e7ff', padding: 10, borderRadius: 10 },
  resourceTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  resourceSub: { fontSize: 12, color: '#64748b', marginTop: 2, fontWeight: '600' },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4f46e5', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  downloadText: { color: '#fff', fontSize: 12, fontWeight: '800', marginLeft: 4 },
  pdfPreviewBox: { height: 280, width: '100%', backgroundColor: '#f8fafc', position: 'relative' },
  loaderCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  smartNotePreview: { height: 140, backgroundColor: '#fdf2f8', justifyContent: 'center', alignItems: 'center' },
  smartNoteText: { marginTop: 10, color: '#be185d', fontWeight: '800', fontSize: 15 },
  
  // 🃏 INLINE FLASHCARD STYLES
  inlineFlashcardContainer: { marginHorizontal: 15, marginBottom: 15, backgroundColor: '#020617', borderRadius: 20, overflow: 'hidden', elevation: 5, shadowColor: '#4f46e5', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 10 },
  inlineFlashcardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#0f172a', borderBottomWidth: 1, borderColor: '#1e293b' },
  inlineFlashcardTitle: { color: '#f8fafc', fontSize: 15, fontWeight: '800', flex: 1, marginRight: 10 },
  inlineFlashcardCount: { color: '#818cf8', fontSize: 12, fontWeight: '900', backgroundColor: '#1e1b4b', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  inlineCardArea: { height: 240, position: 'relative', padding: 20, justifyContent: 'center', alignItems: 'center' },
  inlineCard: { width: '100%', height: '100%', backgroundColor: '#1e293b', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  inlineCardFront: { backgroundColor: '#1e293b' },
  inlineCardBack: { backgroundColor: '#312e81', borderColor: '#4338ca' },
  inlineCardCategory: { position: 'absolute', top: 15, color: '#94a3b8', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  inlineScrollCenter: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  inlineCardQuestion: { color: '#f8fafc', fontSize: 20, fontWeight: '800', textAlign: 'center', lineHeight: 28 },
  inlineCardAnswer: { color: '#c7d2fe', fontSize: 18, fontWeight: '700', textAlign: 'center', lineHeight: 26 },
  inlineFlipBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#334155', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 15 },
  inlineFlipText: { color: '#cbd5e1', fontSize: 11, fontWeight: '700' },
  inlineCardActions: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 15, gap: 10 },
  inlineActionBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  inlineActionText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  flashcardFinish: { height: 240, justifyContent: 'center', alignItems: 'center', padding: 20 },
  finishDeckTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 10 },
  finishDeckSub: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginTop: 4, marginBottom: 20 },
  restartDeckBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4f46e5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  restartDeckText: { color: '#fff', fontSize: 13, fontWeight: '800', marginLeft: 6 },

  actionBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 12, borderTopWidth: 1, borderColor: '#f1f5f9', backgroundColor: '#fafaf9' },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionText: { marginLeft: 6, fontSize: 14, fontWeight: '700', color: '#475569' },
  saveBtn: { padding: 5 },
  
  emptyFilterState: { alignItems: 'center', marginTop: 40, paddingHorizontal: 40, paddingVertical: 40, backgroundColor: '#fff', marginHorizontal: 15, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  emptyText: { fontSize: 16, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginTop: 15 },
  
  fab: { position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 90, right: 20, zIndex: 100 },
  fabInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
});