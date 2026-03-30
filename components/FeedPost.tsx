import ResourcePreview from './ResourcePreview';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, Linking, Alert, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../firebaseConfig';
import { collection, doc, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp, deleteDoc, runTransaction } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { processAction } from '../helpers/gamificationEngine';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, Layout, useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolate, Extrapolation } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { useRewardStore } from '../store/useRewardStore'; 

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

export const timeAgo = (timestamp: number | undefined) => {
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
// 🃏 INLINE FLASHCARD PLAYER
// ==========================================
const InlineFlashcardPlayer = ({ cardsData, title }: { cardsData: any[], title: string }) => {
  const [deck, setDeck] = useState([...cardsData]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const flipAnim = useSharedValue(0);

  useEffect(() => { 
    setDeck([...cardsData]); 
    setCurrentIndex(0); 
    setIsFlipped(false); 
    setIsFinished(false); 
    flipAnim.value = 0; 
  }, [cardsData]);

  if (!deck || deck.length === 0) return null;
  const currentCard = deck[currentIndex];

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipAnim.value, [0, 180], [0, 180], Extrapolation.CLAMP);
    return { transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }], backfaceVisibility: 'hidden', zIndex: flipAnim.value < 90 ? 1 : 0, opacity: flipAnim.value < 90 ? 1 : 0 };
  });
  
  const backStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipAnim.value, [0, 180], [180, 360], Extrapolation.CLAMP);
    return { transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }], backfaceVisibility: 'hidden', zIndex: flipAnim.value > 90 ? 1 : 0, opacity: flipAnim.value > 90 ? 1 : 0, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 };
  });

  const handleFlip = () => { 
    if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); 
    setIsFlipped(!isFlipped); 
    flipAnim.value = withTiming(isFlipped ? 0 : 180, { duration: 400 }); 
  };

  const handleAction = (knewIt: boolean) => {
    if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); 
    let nextDeck = [...deck];
    if (!knewIt) { 
      const failedCard = nextDeck[currentIndex]; 
      nextDeck.push(failedCard); 
      setDeck(nextDeck); 
    }
    if (currentIndex < nextDeck.length - 1) { 
      flipAnim.value = 0; 
      setIsFlipped(false); 
      setCurrentIndex(prev => prev + 1); 
    } else { 
      setIsFinished(true); 
    } 
  };

  const handleRestart = () => { 
    if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); 
    flipAnim.value = 0; setIsFlipped(false); setCurrentIndex(0); setIsFinished(false); setDeck([...cardsData]); 
  };

  if (isFinished) {
    return (
      <View style={styles.inlineFlashcardContainer}>
        <View style={styles.flashcardFinish}>
          <Ionicons name="trophy" size={50} color="#fde047" />
          <Text style={styles.finishDeckTitle}>Deck Completed!</Text>
          <Text style={styles.finishDeckSub}>You revised {deck.length} cards today.</Text>
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
        <Text style={styles.inlineFlashcardCount}>{currentIndex + 1} / {deck.length}</Text>
      </View>
      <View style={styles.inlineCardArea}>
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
        <Animated.View style={[styles.inlineCard, styles.inlineCardBack, backStyle]}>
          <Text style={styles.inlineCardCategory}>Answer</Text>
          <ScrollView contentContainerStyle={styles.inlineScrollCenter}>
            <Text style={styles.inlineCardAnswer}>{currentCard?.a}</Text>
          </ScrollView>
          <View style={styles.inlineCardActions}>
            <TouchableOpacity style={[styles.inlineActionBtn, {backgroundColor: '#ef4444'}]} onPress={() => handleAction(false)}>
              <Text style={styles.inlineActionText}>Forgot</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.inlineActionBtn, {backgroundColor: '#10b981'}]} onPress={() => handleAction(true)}>
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
const PostCard = React.memo(({ item, currentUid, onOpenComments, onImagePress }: any) => {
  const router = useRouter();
  const showReward = useRewardStore((state) => state.showReward);
  
  const [localIsLiked, setLocalIsLiked] = useState(item.likes?.includes(currentUid));
  const [localLikeCount, setLocalLikeCount] = useState(item.likes?.length || 0);
  const [localIsSaved, setLocalIsSaved] = useState(item.savedBy?.includes(currentUid));

  // 🗳️ Optimistic Poll States
  const [localPollOptions, setLocalPollOptions] = useState(item.pollOptions);
  const [localTotalVotes, setLocalTotalVotes] = useState(item.totalVotes || 0);
  const [localUserVote, setLocalUserVote] = useState(item.voters ? item.voters[currentUid] : undefined);
  const hasVoted = localUserVote !== undefined;

  useEffect(() => {
    setLocalIsLiked(item.likes?.includes(currentUid));
    setLocalLikeCount(item.likes?.length || 0);
    setLocalIsSaved(item.savedBy?.includes(currentUid));
    setLocalPollOptions(item.pollOptions);
    setLocalTotalVotes(item.totalVotes || 0);
    setLocalUserVote(item.voters ? item.voters[currentUid] : undefined);
  }, [item.likes, item.savedBy, item.pollOptions, item.totalVotes, item.voters, currentUid]);

  const likeScale = useSharedValue(1);
  const saveScale = useSharedValue(1);
  const collectionName = item.type === 'live_test' ? 'exams_enterprise' : 'posts';

  const sendNotification = async () => {
    if (item.authorId === currentUid || !item.authorId) return;
    try { await addDoc(collection(db, 'notifications'), { recipientId: item.authorId, senderId: currentUid, senderName: auth.currentUser?.displayName || 'User', senderAvatar: auth.currentUser?.photoURL || '', type: 'like', postId: item.id, isRead: false, createdAt: serverTimestamp() }); } catch (error) {}
  };

  const handleLike = async () => {
    if (!currentUid) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    likeScale.value = withSpring(1.3, { damping: 5, stiffness: 200 }, () => { likeScale.value = withSpring(1); });

    const wasLiked = localIsLiked;
    setLocalIsLiked(!wasLiked);
    setLocalLikeCount((prev: number) => wasLiked ? prev - 1 : prev + 1);

    try {
      const postRef = doc(db, collectionName, item.id);
      if (wasLiked) { await updateDoc(postRef, { likes: arrayRemove(currentUid) }); } 
      else { 
        await updateDoc(postRef, { likes: arrayUnion(currentUid) }); 
        await sendNotification(); 
        if (item.authorId && item.authorId !== currentUid) { await processAction(item.authorId, 'RECEIVE_LIKE'); } 
      }
    } catch (error) {
      setLocalIsLiked(wasLiked);
      setLocalLikeCount((prev: number) => wasLiked ? prev + 1 : prev - 1);
    }
  };

  const handleSave = async () => {
    if (!currentUid) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    saveScale.value = withSpring(1.3, { damping: 5, stiffness: 200 }, () => { saveScale.value = withSpring(1); });

    const wasSaved = localIsSaved;
    setLocalIsSaved(!wasSaved);

    try {
      const postRef = doc(db, collectionName, item.id);
      if (wasSaved) await updateDoc(postRef, { savedBy: arrayRemove(currentUid) });
      else await updateDoc(postRef, { savedBy: arrayUnion(currentUid) });
    } catch (error) { setLocalIsSaved(wasSaved); }
  };

  const handleShare = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const domain = "https://eduxity.vercel.app"; 
    const postLink = `${domain}/post/${item.id}`; 
    let contentTitle = item.title || item.text || "an interesting post";
    if (contentTitle.length > 60) contentTitle = contentTitle.substring(0, 60) + "...";
    const message = `Check out this on Eduxity:\n\n"${contentTitle}"\n\nShared by ${item.authorName || 'Scholar'}\n\nView full post here:\n${postLink}`;
    try { Share.share({ message: message, url: postLink, title: "Eduxity Study Hub" }); } catch (error) {}
  };

  const handleVote = async (optIndex: number) => {
    if (hasVoted || !currentUid) return; 
    
    // Check if it's a Quiz and give respective feedback
    const isQuiz = item.hasCorrectAnswer;
    const isCorrectChoice = localPollOptions[optIndex].isCorrect;

    if (Platform.OS !== 'web') {
       if (isQuiz) {
           if (isCorrectChoice) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
           else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
       } else {
           Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
       }
    }
    
    const previousOptions = [...(localPollOptions || [])];
    const previousTotal = localTotalVotes;
    const previousVote = localUserVote;

    const newOptions = previousOptions.map((opt: any, idx: number) => {
      if (idx === optIndex) return { ...opt, votes: (opt.votes || 0) + 1 };
      return opt;
    });
    
    setLocalPollOptions(newOptions);
    setLocalTotalVotes(previousTotal + 1);
    setLocalUserVote(optIndex);

    try {
      const postRef = doc(db, 'posts', item.id);
      await runTransaction(db, async (transaction) => {
        const postDoc = await transaction.get(postRef);
        if (!postDoc.exists()) throw new Error("Post does not exist!");
        const data = postDoc.data();
        if (data.voters && data.voters[currentUid] !== undefined) return;
        
        const newTotalVotes = (data.totalVotes || 0) + 1;
        const updatedPollOptions = [...data.pollOptions];
        updatedPollOptions[optIndex].votes = (updatedPollOptions[optIndex].votes || 0) + 1;
        
        transaction.update(postRef, { pollOptions: updatedPollOptions, totalVotes: newTotalVotes, [`voters.${currentUid}`]: optIndex });
      });

      // Agar quiz me sahi jawab diya toh zyada XP de sakte hain, par currently POLL_ANSWER chala rahe hain
      const actionToTrigger = (isQuiz && isCorrectChoice) ? 'POLL_ANSWER' : 'POLL_ANSWER';
      const result = await processAction(currentUid, actionToTrigger);
      if (result && result.success) { showReward({ xpEarned: result.xpEarned, coinsEarned: result.coinsEarned, leveledUp: result.leveledUp, newLevel: result.newLevel, newBadges: result.newBadges }); }
    } catch (error) { 
      setLocalPollOptions(previousOptions); setLocalTotalVotes(previousTotal); setLocalUserVote(previousVote);
      Alert.alert("Oops!", "Could not register your vote."); 
    }
  };

  const navigateToProfile = () => { if(item.authorId && item.authorId !== 'admin') router.push(`/user/${item.authorId}`); };
  const navigateToPost = () => { router.push(`/post/${item.id}`); };

  const animatedLikeStyle = useAnimatedStyle(() => ({ transform: [{ scale: likeScale.value }] }));
  const animatedSaveStyle = useAnimatedStyle(() => ({ transform: [{ scale: saveScale.value }] }));

  const hasAttemptedTest = item.type === 'live_test' && item.responses && item.responses[currentUid];

  return (
    <Animated.View entering={FadeInDown.duration(400).springify()} layout={Layout.springify()} style={styles.postCard}>
      {item.algoReason && (<View style={styles.algoReasonBar}><Ionicons name="sparkles" size={14} color="#6366f1" /><Text style={styles.algoReasonText}>{item.algoReason}</Text></View>)}
      
      <View style={styles.postHeader}>
        <TouchableOpacity onPress={navigateToProfile} activeOpacity={0.8}><Image source={{ uri: item.authorAvatar || DEFAULT_AVATAR }} style={styles.avatar} contentFit="cover" transition={200} /></TouchableOpacity>
        <View style={styles.authorInfo}>
          <TouchableOpacity onPress={navigateToProfile} activeOpacity={0.8}><Text style={styles.authorName}>{item.authorName || 'Scholar'}</Text></TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            {item.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{item.category}</Text>
              </View>
            )}
            <Text style={styles.timeText}>• {timeAgo(item.createdAt?.toMillis ? item.createdAt.toMillis() : Date.now())}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity activeOpacity={0.95} onPress={navigateToPost}>
        {item.text ? <Text style={styles.postText}>{item.text}</Text> : null}
        
        {item.type === 'flashcard' && item.cardsData && (<InlineFlashcardPlayer cardsData={item.cardsData} title={item.title} />)}
        
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.map((tag: string, idx: number) => (
              <View key={idx} style={styles.tagPill}><Text style={styles.tagText}>#{tag}</Text></View>
            ))}
          </View>
        )}
        
        {item.type === 'image' && item.imageUrl ? (
          <View style={styles.imageContainer}><Image source={{ uri: item.imageUrl }} style={styles.postImage} contentFit="cover" transition={300} /></View>
        ) : null}
        
        
      </TouchableOpacity>

      {/* ========================================== */}
      {/* 🟢 POLL & QUIZ RENDERER (SMART UI) */}
      {/* ========================================== */}
      {item.type === 'poll' && localPollOptions ? (
        <View style={styles.pollContainer}>
          {/* Header Label depending on Quiz or Poll */}
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
            <Ionicons name={item.hasCorrectAnswer ? "help-circle" : "stats-chart"} size={16} color="#64748b" />
            <Text style={{fontSize: 12, fontWeight: '800', color: '#64748b', marginLeft: 6, textTransform: 'uppercase'}}>
              {item.hasCorrectAnswer ? "Quiz Question" : "Community Poll"}
            </Text>
          </View>

          {localPollOptions.map((opt: any, idx: number) => {
            const totalVotes = localTotalVotes || 0; 
            const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
            
            if (hasVoted) {
              const isQuiz = item.hasCorrectAnswer;
              let bgColor = '#f1f5f9'; // Default Gray
              let fillBg = '#e2e8f0'; // Default Gray fill
              let borderColor = 'transparent';
              let icon = null;

              if (isQuiz) {
                // QUIZ LOGIC
                if (opt.isCorrect) {
                  // Jo sahi answer tha usko Green karo, chahe user ne chuna ho ya nahi
                  bgColor = '#dcfce7'; 
                  fillBg = '#bbf7d0'; 
                  borderColor = '#22c55e';
                  icon = <Ionicons name="checkmark-circle" size={18} color="#22c55e" style={{marginRight: 8}}/>;
                } else if (idx === localUserVote && !opt.isCorrect) {
                  // User ne galat chuna, toh Red karo
                  bgColor = '#fee2e2'; 
                  fillBg = '#fecaca'; 
                  borderColor = '#ef4444';
                  icon = <Ionicons name="close-circle" size={18} color="#ef4444" style={{marginRight: 8}}/>;
                }
              } else {
                // NORMAL POLL LOGIC
                if (idx === localUserVote) {
                  bgColor = '#f1f5f9';
                  fillBg = '#bae6fd'; // Blue fill
                  borderColor = '#3b82f6';
                }
              }

              return (
                <View key={idx} style={[styles.pollOptionResult, { backgroundColor: bgColor, borderWidth: 1, borderColor: borderColor }]}>
                  <Animated.View style={[styles.pollFill, { width: `${percentage}%`, backgroundColor: fillBg }]} />
                  <View style={styles.pollContent}>
                    <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                      {icon}
                      <Text style={[styles.pollOptionText, isQuiz && opt.isCorrect && {color: '#166534', fontWeight: '800'}]} numberOfLines={2}>
                        {opt.text}
                      </Text>
                    </View>
                    <Text style={[styles.pollPercentage, isQuiz && opt.isCorrect && {color: '#166534'}]}>{percentage}%</Text>
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
          
          <Text style={{fontSize: 11, color: '#94a3b8', marginTop: 8, textAlign: 'right', fontWeight: '600'}}>
            {localTotalVotes} {localTotalVotes === 1 ? 'vote' : 'votes'}
          </Text>
        </View>
      ) : null}

    {/* LIVE TEST */}
      {item.type === 'live_test' && (
        <View style={styles.liveTestContainer}>
          <LinearGradient colors={['#312e81', '#4f46e5']} style={styles.liveTestBg}>
            <View style={styles.testHeaderRow}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Ionicons name="radio-button-on" size={16} color="#fde047" />
                <Text style={styles.testLiveText}>{item.ntaFormat ? 'NTA MOCK TEST' : 'LIVE TEST'}</Text>
              </View>
              {hasAttemptedTest && (
                <View style={{backgroundColor: '#10b981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8}}>
                  <Text style={{color: '#fff', fontSize: 10, fontWeight: '900'}}>ATTEMPTED</Text>
                </View>
              )}
            </View>
            <Text style={styles.testTitle}>{item.title}</Text>
            <View style={styles.testInfoRow}>
              <Ionicons name="list-outline" size={14} color="#cbd5e1" />
              <Text style={styles.testInfoText}>{item.questions?.length || 0} Qs</Text>
              <Ionicons name="time-outline" size={14} color="#cbd5e1" style={{marginLeft: 10}}/>
              <Text style={styles.testInfoText}>{item.settings?.totalDuration || 180} Min</Text>
            </View>

            {/* 🔴 YAHAN SE CHANGES HAIN (Button Logic) */}
            <View style={{flexDirection: 'row', gap: 10, marginTop: 10, flexWrap: 'wrap'}}>
              
              {hasAttemptedTest ? (
                <>
                  {/* VIEW RESULT BUTTON */}
                  <TouchableOpacity style={[styles.startTestBtn, {flex: 1}]} activeOpacity={0.8} onPress={() => router.push(`/test/${item.id}`)}>
                    <Text style={styles.startTestBtnText}>View Result</Text>
                    <Ionicons name="stats-chart" size={16} color="#4f46e5" />
                  </TouchableOpacity>
                  
                  {/* REATTEMPT BUTTON */}
                  <TouchableOpacity 
                    style={[styles.startTestBtn, {flex: 1, backgroundColor: '#eef2ff'}]} 
                    activeOpacity={0.8} 
                    onPress={() => router.push({ pathname: '/test/[id]', params: { id: item.id, reattempt: 'true' } })}
                  >
                    <Text style={[styles.startTestBtnText, {color: '#4338ca'}]}>Reattempt</Text>
                    <Ionicons name="refresh" size={16} color="#4338ca" />
                  </TouchableOpacity>
                </>
              ) : (
                /* FRESH ATTEMPT BUTTON */
                <TouchableOpacity style={[styles.startTestBtn, {flex: 1}]} activeOpacity={0.8} onPress={() => router.push(`/test/${item.id}`)}>
                  <Text style={styles.startTestBtnText}>Attempt Test</Text>
                  <Ionicons name="arrow-forward" size={18} color="#4f46e5" />
                </TouchableOpacity>
              )}

              {/* 👑 VIEW ANALYTICS BUTTON (Sirf Admin/Creator ke liye) */}
              {item.authorId === currentUid && (
                <TouchableOpacity 
                  style={styles.analyticsBtn} 
                  activeOpacity={0.8} 
                  onPress={() => router.push(`/test-analysis/${item.id}`)}
                >
                  <Ionicons name="analytics" size={18} color="#fff" />
                  <Text style={styles.analyticsBtnText}>Analytics</Text>
                </TouchableOpacity>
              )}

            </View>
            {/* 🔴 CHANGES END */}

          </LinearGradient>
        </View>
      )}

      {item.type === 'resource' && (
        <View style={styles.resourceContainer}>
          <View style={styles.resourceHeader}>
            <View style={styles.resourceIcon}><Ionicons name="book" size={22} color="#4f46e5" /></View>
            <View style={{ flex: 1, marginLeft: 12 }}><Text style={styles.resourceTitle} numberOfLines={1}>{item.title || 'Study Material'}</Text><Text style={styles.resourceSub}>Learning Resource</Text></View>
            {item.fileUrl && (<TouchableOpacity style={styles.downloadBtn} onPress={() => Linking.openURL(item.fileUrl)}><Ionicons name="open-outline" size={16} color="#fff" /><Text style={styles.downloadText}>Open</Text></TouchableOpacity>)}
          </View>
          {item.fileUrl && (<ResourcePreview url={item.fileUrl} />)}
        </View>
      )}

      {/* 🚀 UPGRADED ACTION BAR */}
      <View style={styles.actionBar}>
        <View style={styles.actionLeft}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.7}>
            <Animated.View style={animatedLikeStyle}><Ionicons name={localIsLiked ? "heart" : "heart-outline"} size={26} color={localIsLiked ? "#ef4444" : "#64748b"} /></Animated.View>
            <Text style={[styles.actionText, localIsLiked && { color: '#ef4444', fontWeight: '800' }]}>{localLikeCount}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={() => onOpenComments && onOpenComments(item)}>
            <Ionicons name="chatbubble-outline" size={24} color="#64748b" />
            <Text style={styles.actionText}>{item.commentsCount || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleSave} activeOpacity={0.7} style={styles.saveBtn}>
          <Animated.View style={animatedSaveStyle}><Ionicons name={localIsSaved ? "bookmark" : "bookmark-outline"} size={26} color={localIsSaved ? "#4f46e5" : "#64748b"} /></Animated.View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}, (prevProps, nextProps) => {
  return prevProps.item.id === nextProps.item.id && prevProps.item.likes?.length === nextProps.item.likes?.length && prevProps.item.commentsCount === nextProps.item.commentsCount && prevProps.item.savedBy?.length === nextProps.item.savedBy?.length && prevProps.currentUid === nextProps.currentUid;
});

PostCard.displayName = 'PostCard';
export default PostCard;

const styles = StyleSheet.create({
  postCard: { backgroundColor: '#fff', marginHorizontal: 10, marginTop: 10, marginBottom: 5, borderRadius: 16, overflow: 'hidden', elevation: 2, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  algoReasonBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef2ff', paddingHorizontal: 15, paddingVertical: 8 },
  algoReasonText: { fontSize: 11, fontWeight: '800', color: '#4f46e5', marginLeft: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  postHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingTop: 15, marginBottom: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#e2e8f0' },
  authorInfo: { flex: 1, marginLeft: 12 }, authorName: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  categoryBadge: { backgroundColor: '#4f46e5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  categoryBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff', textTransform: 'uppercase' },
  timeText: { fontSize: 12, color: '#94a3b8', marginLeft: 6, fontWeight: '600' },
  postText: { fontSize: 15, color: '#334155', lineHeight: 24, paddingHorizontal: 15, marginBottom: 12 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, marginBottom: 12, gap: 8 },
  tagPill: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  tagText: { color: '#4f46e5', fontSize: 12, fontWeight: '700' },
  imageContainer: { width: '100%', backgroundColor: '#f8fafc' }, postImage: { width: '100%', height: 350 }, 
  codeBlockContainer: { marginHorizontal: 15, backgroundColor: '#0f172a', borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  macWindowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#1e293b' },
  macDots: { flexDirection: 'row', gap: 6 }, macDot: { width: 10, height: 10, borderRadius: 5 },
  codeLanguage: { color: '#38bdf8', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  codeText: { color: '#e2e8f0', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 13, padding: 15, lineHeight: 22 },
  
  // 🟢 PREMIUM POLL STYLES UPDATED
  pollContainer: { marginHorizontal: 15, backgroundColor: '#fff', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 15 },
  pollOptionBtn: { backgroundColor: '#f8fafc', paddingVertical: 16, paddingHorizontal: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  pollOptionBtnText: { fontSize: 15, fontWeight: '700', color: '#1e293b', textAlign: 'center' },
  pollOptionResult: { minHeight: 48, borderRadius: 12, marginBottom: 10, overflow: 'hidden', justifyContent: 'center', paddingVertical: 12 },
  pollFill: { position: 'absolute', top: 0, bottom: 0, left: 0 },
  pollContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, zIndex: 10 },
  pollOptionText: { fontSize: 14, fontWeight: '700', color: '#0f172a', paddingRight: 10 }, 
  pollPercentage: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  
  liveTestContainer: { marginHorizontal: 15, marginBottom: 15, borderRadius: 16, overflow: 'hidden' },
  liveTestBg: { padding: 20 }, testHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  testLiveText: { color: '#fde047', fontWeight: '900', fontSize: 12, letterSpacing: 1 }, testTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 8 },
  testInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 10 }, testInfoText: { color: '#cbd5e1', fontWeight: '700', fontSize: 13 },
  resourceContainer: { marginHorizontal: 15, marginBottom: 15, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  resourceHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fafaf9', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  resourceIcon: { backgroundColor: '#e0e7ff', padding: 10, borderRadius: 10 }, resourceTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' }, resourceSub: { fontSize: 12, color: '#64748b', marginTop: 2, fontWeight: '600' },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4f46e5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }, downloadText: { color: '#fff', fontSize: 12, fontWeight: '800', marginLeft: 4 },
  inlineFlashcardContainer: { marginHorizontal: 15, marginBottom: 15, backgroundColor: '#020617', borderRadius: 20, overflow: 'hidden' },
  inlineFlashcardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#0f172a' },
  inlineFlashcardTitle: { color: '#f8fafc', fontSize: 14, fontWeight: '800', flex: 1 }, inlineFlashcardCount: { color: '#818cf8', fontSize: 11, fontWeight: '900' },
  inlineCardArea: { height: 200, padding: 20 },
  inlineCard: { width: '100%', height: '100%', borderRadius: 16, padding: 20, alignItems: 'center', justifyContent: 'center' },
  inlineCardFront: { backgroundColor: '#1e293b' }, inlineCardBack: { backgroundColor: '#312e81' }, inlineCardCategory: { position: 'absolute', top: 10, color: '#94a3b8', fontSize: 9, fontWeight: '800' },
  inlineScrollCenter: { flexGrow: 1, justifyContent: 'center' }, inlineCardQuestion: { color: '#f8fafc', fontSize: 18, fontWeight: '800', textAlign: 'center' }, inlineCardAnswer: { color: '#c7d2fe', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  inlineFlipBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#334155', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, marginTop: 10 }, inlineFlipText: { color: '#cbd5e1', fontSize: 10, fontWeight: '700' },
  inlineCardActions: { flexDirection: 'row', width: '100%', marginTop: 10, gap: 10 }, inlineActionBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' }, inlineActionText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  flashcardFinish: { height: 200, justifyContent: 'center', alignItems: 'center' }, finishDeckTitle: { color: '#fff', fontSize: 18, fontWeight: '900' }, finishDeckSub: { color: '#94a3b8', fontSize: 12 },
  restartDeckBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4f46e5', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 15, marginTop: 15 }, restartDeckText: { color: '#fff', fontSize: 12, fontWeight: '800', marginLeft: 5 },
  actionBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 12, borderTopWidth: 1, borderColor: '#f1f5f9' },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 25 }, 
  actionBtn: { flexDirection: 'row', alignItems: 'center' }, 
  actionText: { marginLeft: 6, fontSize: 14, fontWeight: '700', color: '#64748b' }, 
  saveBtn: { padding: 5 }, 
  // TEST BUTTONS
  startTestBtn: { backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 10 }, 
  startTestBtnText: { color: '#4f46e5', fontWeight: '900', fontSize: 13, marginRight: 8 },
  
  // 🔥 NAYA ANALYTICS BUTTON STYLE
  analyticsBtn: { backgroundColor: '#f59e0b', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 10, shadowColor: '#f59e0b', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 5 },
  analyticsBtnText: { color: '#fff', fontWeight: '900', fontSize: 13, marginLeft: 6 },

  
});