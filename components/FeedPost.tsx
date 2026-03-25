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
import { useRewardStore } from '../store/useRewardStore'; // 🔥 Reward Store

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
// 🃏 INLINE FLASHCARD PLAYER (Cleaned up!)
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
// 🔥 THE PREMIUM POST CARD (Logic Correctly Placed Here)
// ==========================================
const PostCard = React.memo(({ item, currentUid, onOpenComments, onImagePress }: any) => {
  const router = useRouter();
  const showReward = useRewardStore((state) => state.showReward);
  
  // ⚡ Optimistic UI States (Likes & Saves)
  const [localIsLiked, setLocalIsLiked] = useState(item.likes?.includes(currentUid));
  const [localLikeCount, setLocalLikeCount] = useState(item.likes?.length || 0);
  const [localIsSaved, setLocalIsSaved] = useState(item.savedBy?.includes(currentUid));

  // 🗳️ Optimistic UI States (Polls)
  const [localPollOptions, setLocalPollOptions] = useState(item.pollOptions);
  const [localTotalVotes, setLocalTotalVotes] = useState(item.totalVotes || 0);
  const [localUserVote, setLocalUserVote] = useState(item.voters ? item.voters[currentUid] : undefined);
  const hasVoted = localUserVote !== undefined;

  // Sync state if props change from DB
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

  // ❤️ OPTIMISTIC LIKE LOGIC
  const handleLike = async () => {
    if (!currentUid) return;
    
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    likeScale.value = withSpring(1.3, { damping: 5, stiffness: 200 }, () => { likeScale.value = withSpring(1); });

    const wasLiked = localIsLiked;
    setLocalIsLiked(!wasLiked);
    setLocalLikeCount((prev: number) => wasLiked ? prev - 1 : prev + 1);

    try {
      const postRef = doc(db, collectionName, item.id);
      if (wasLiked) { 
        await updateDoc(postRef, { likes: arrayRemove(currentUid) }); 
      } else { 
        await updateDoc(postRef, { likes: arrayUnion(currentUid) }); 
        await sendNotification(); 
        if (item.authorId && item.authorId !== currentUid) { 
          await processAction(item.authorId, 'RECEIVE_LIKE'); 
        } 
      }
    } catch (error) {
      setLocalIsLiked(wasLiked);
      setLocalLikeCount((prev: number) => wasLiked ? prev + 1 : prev - 1);
    }
  };

  // 📑 OPTIMISTIC SAVE LOGIC
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
    } catch (error) {
      setLocalIsSaved(wasSaved); 
    }
  };

  // 📤 NATIVE SHARE FEATURE
  const handleShare = async () => {
    try {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const contentToShare = item.text || item.title || "Check out this amazing post!";
      const result = await Share.share({
        message: `Look what ${item.authorName || 'someone'} shared on Eduxity:\n\n"${contentToShare}"\n\nJoin us and learn together!`,
      });
    } catch (error) {
      Alert.alert("Error", "Could not share the post.");
    }
  };

  const handleDeletePost = async () => {
    if (Platform.OS === 'web') { if (window.confirm("Are you sure?")) { try { await deleteDoc(doc(db, 'posts', item.id)); } catch (error) {} } } 
    else { Alert.alert("Delete Post?", "Are you sure?", [ { text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: async () => { try { await deleteDoc(doc(db, 'posts', item.id)); } catch (error) {} } } ]); }
  };

  // 🗳️ POLL VOTE LOGIC (Optimistic + Reward Trigger)
  const handleVote = async (optIndex: number) => {
    if (hasVoted || !currentUid) return; 

    // ⚡ OPTIMISTIC UPDATE: Instant UI Change
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
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
        
        transaction.update(postRef, { 
          pollOptions: updatedPollOptions, 
          totalVotes: newTotalVotes, 
          [`voters.${currentUid}`]: optIndex 
        });
      });

      // 🔥 REWARD TRIGGER ON SUCCESSFUL VOTE
      const result = await processAction(currentUid, 'POLL_ANSWER');
      if (result && result.success) {
         showReward({
            xpEarned: result.xpEarned,
            coinsEarned: result.coinsEarned,
            leveledUp: result.leveledUp,
            newLevel: result.newLevel,
            newBadges: result.newBadges
         });
      }
    } catch (error) { 
      // Revert if fails
      setLocalPollOptions(previousOptions);
      setLocalTotalVotes(previousTotal);
      setLocalUserVote(previousVote);
      Alert.alert("Oops!", "Could not register your vote."); 
    }
  };

  const navigateToProfile = () => { if(item.authorId && item.authorId !== 'admin') router.push(`/user/${item.authorId}`); };

  const animatedLikeStyle = useAnimatedStyle(() => ({ transform: [{ scale: likeScale.value }] }));
  const animatedSaveStyle = useAnimatedStyle(() => ({ transform: [{ scale: saveScale.value }] }));

  const hasAttemptedTest = item.type === 'live_test' && item.responses && item.responses[currentUid];
  const userResult = hasAttemptedTest ? item.responses[currentUid] : null;

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
                {item.type === 'code' && <Ionicons name="code-slash" size={10} color="#fff" style={{ marginRight: 4 }} />}
                {item.pollMode === 'quiz' && <Ionicons name="school" size={10} color="#fff" style={{ marginRight: 4 }} />}
                {item.type === 'resource' && <Ionicons name="book" size={10} color="#fff" style={{ marginRight: 4 }} />}
                {item.type === 'flashcard' && <Ionicons name="layers" size={10} color="#fff" style={{ marginRight: 4 }} />}
                {item.type === 'live_test' && <Ionicons name="timer" size={10} color="#fff" style={{ marginRight: 4 }} />}
                <Text style={styles.categoryBadgeText}>{item.category}</Text>
              </View>
            )}
            <Text style={styles.timeText}>• {timeAgo(item.createdAt?.toMillis ? item.createdAt.toMillis() : Date.now())}</Text>
          </View>
        </View>
        <View style={styles.headerRightActions}>
          {item.authorId === currentUid ? (<TouchableOpacity style={styles.deleteBtn} onPress={handleDeletePost}><Ionicons name="trash-outline" size={18} color="#ef4444" /></TouchableOpacity>) : (<TouchableOpacity style={styles.moreBtn}><Ionicons name="ellipsis-horizontal" size={20} color="#94a3b8" /></TouchableOpacity>)}
        </View>
      </View>

      {item.text ? <Text style={styles.postText}>{item.text}</Text> : null}
      
      {item.type === 'flashcard' && item.cardsData && (<InlineFlashcardPlayer cardsData={item.cardsData} title={item.title} />)}
      
      {item.tags && item.tags.length > 0 && (<View style={styles.tagsContainer}>{item.tags.map((tag: string, idx: number) => (<View key={idx} style={styles.tagPill}><Text style={styles.tagText}>#{tag}</Text></View>))}</View>)}
      
      {item.type === 'image' && item.imageUrl ? (
        <TouchableOpacity activeOpacity={0.9} onPress={() => onImagePress && onImagePress(item.imageUrl)}>
          <View style={styles.imageContainer}><Image source={{ uri: item.imageUrl }} style={styles.postImage} contentFit="cover" transition={300} /></View>
        </TouchableOpacity>
      ) : null}
      
      {item.type === 'code' && item.codeSnippet ? (<View style={styles.codeBlockContainer}><View style={styles.macWindowHeader}><View style={styles.macDots}><View style={[styles.macDot, { backgroundColor: '#ff5f56' }]} /><View style={[styles.macDot, { backgroundColor: '#ffbd2e' }]} /><View style={[styles.macDot, { backgroundColor: '#27c93f' }]} /></View><Text style={styles.codeLanguage}>{item.language || 'Code'}</Text></View><Text style={styles.codeText}>{item.codeSnippet}</Text></View>) : null}

      {/* 🔥 LIVE TEST RENDERER */}
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
              <Ionicons name="help-circle-outline" size={14} color="#cbd5e1" />
              <Text style={styles.testInfoText}>{item.questions?.length || 0} Questions</Text>
              <Text style={styles.testInfoText}>•</Text>
              <Ionicons name="time-outline" size={14} color="#cbd5e1" />
              <Text style={styles.testInfoText}>{item.settings?.isTimerEnabled ? `${item.settings.timerTimerPerQuestion}s/Q` : `${item.settings?.totalDuration || 180} Mins`}</Text>
            </View>

            {hasAttemptedTest ? (
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 5 }}>
                <TouchableOpacity style={[styles.startTestBtn, { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)' }]} activeOpacity={0.8} onPress={() => router.push(`/test-analytics/${item.id}`)}>
                  <Ionicons name="analytics" size={18} color="#fff" style={{marginRight: 6}} />
                  <Text style={[styles.startTestBtnText, { color: '#fff' }]}>Result</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.startTestBtn, { flex: 1 }]} activeOpacity={0.8} onPress={() => router.push(`/test/${item.id}`)}>
                  <Ionicons name="refresh" size={18} color="#4f46e5" style={{marginRight: 6}} />
                  <Text style={styles.startTestBtnText}>Reattempt</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.startTestBtn} activeOpacity={0.8} onPress={() => router.push(`/test/${item.id}`)}>
                <Text style={styles.startTestBtnText}>Attempt Test Now</Text>
                <Ionicons name="arrow-forward" size={18} color="#4f46e5" />
              </TouchableOpacity>
            )}
          </LinearGradient>
          {hasAttemptedTest && (
            <Text style={styles.attemptsText}>Your Last Score: {userResult.score} Marks</Text>
          )}
        </View>
      )}

      {/* 🗳️ POLL RENDERER */}
      {item.type === 'poll' && localPollOptions ? (
        <View style={styles.pollContainer}>
          <View style={styles.pollHeader}>
            <View style={[styles.liveIndicator, item.pollMode === 'quiz' && { backgroundColor: '#8b5cf6' }]} />
            <Text style={[styles.liveText, item.pollMode === 'quiz' && { color: '#8b5cf6' }]}>{item.pollMode === 'quiz' ? 'LIVE QUIZ' : 'LIVE POLL'}</Text>
          </View>
          
          {localPollOptions.map((opt: any, idx: number) => {
            const totalVotes = localTotalVotes || 0; 
            const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
            let barColor = '#e0f2fe'; let textColor = '#0f172a';
            
            if (hasVoted) { if (idx === localUserVote) { barColor = '#bae6fd'; textColor = '#0369a1'; } }
            
            if (hasVoted) {
              return (
                <View key={idx} style={[styles.pollOptionResult, idx === localUserVote && { borderWidth: 1, borderColor: '#3b82f6' }]}>
                  <Animated.View style={[styles.pollFill, { width: `${percentage}%`, backgroundColor: barColor }]} />
                  <View style={styles.pollContent}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Text style={[styles.pollOptionText, { color: textColor }]}>{opt.text}</Text>
                    </View>
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
          <Text style={styles.pollTotalVotes}>{localTotalVotes || 0} votes {hasVoted ? '• Results visible' : ''}</Text>
        </View>
      ) : null}

      {/* 📚 RESOURCE RENDERER */}
      {item.type === 'resource' && (
        <View style={styles.resourceContainer}>
          <View style={styles.resourceHeader}>
            <View style={styles.resourceIcon}><Ionicons name={item.fileUrl?.includes('drive.google.com') ? "logo-google-drive" : "document-text"} size={22} color="#4f46e5" /></View>
            <View style={{ flex: 1, marginLeft: 12 }}><Text style={styles.resourceTitle} numberOfLines={1}>{item.title || 'Study Material'}</Text><Text style={styles.resourceSub}>{item.fileUrl?.includes('drive.google.com') ? 'Google Drive Document' : item.fileUrl?.includes('youtube.com') || item.fileUrl?.includes('youtu.be') ? 'Video Tutorial' : 'Learning Resource'}</Text></View>
            {item.fileUrl && (<TouchableOpacity style={styles.downloadBtn} onPress={() => Linking.openURL(item.fileUrl)}><Ionicons name="open-outline" size={16} color="#fff" /><Text style={styles.downloadText}>Open</Text></TouchableOpacity>)}
          </View>
          {item.fileUrl ? (<ResourcePreview url={item.fileUrl} />) : item.structuredText ? (<TouchableOpacity style={styles.smartNotePreview} onPress={() => router.push(`/resources/view/${item.id}`)} activeOpacity={0.8}><Ionicons name="scan-circle" size={40} color="#ec4899" /><Text style={styles.smartNoteText}>Read AI Smart Notes</Text></TouchableOpacity>) : null}
        </View>
      )}

      {/* 🔥 THE NEW ACTION BAR */}
      <View style={styles.actionBar}>
        <View style={styles.actionLeft}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.7}>
            <Animated.View style={animatedLikeStyle}>
              <Ionicons name={localIsLiked ? "heart" : "heart-outline"} size={26} color={localIsLiked ? "#ef4444" : "#64748b"} />
            </Animated.View>
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
          <Animated.View style={animatedSaveStyle}>
            <Ionicons name={localIsSaved ? "bookmark" : "bookmark-outline"} size={26} color={localIsSaved ? "#4f46e5" : "#64748b"} />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}, (prevProps, nextProps) => {
  return ( 
    prevProps.item.id === nextProps.item.id && 
    prevProps.item.likes?.length === nextProps.item.likes?.length && 
    prevProps.item.commentsCount === nextProps.item.commentsCount && 
    prevProps.item.savedBy?.length === nextProps.item.savedBy?.length &&
    prevProps.currentUid === nextProps.currentUid
  );
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
  categoryBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4f46e5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  categoryBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff', textTransform: 'uppercase' },
  timeText: { fontSize: 12, color: '#94a3b8', marginLeft: 6, fontWeight: '600' },
  headerRightActions: { flexDirection: 'row', alignItems: 'center' },
  moreBtn: { padding: 5 }, deleteBtn: { padding: 6, backgroundColor: '#fef2f2', borderRadius: 20, marginLeft: 5 },
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
  pollContainer: { marginHorizontal: 15, backgroundColor: '#f8fafc', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 15 },
  pollHeader: { flexDirection: 'row', alignItems: 'center', position: 'absolute', top: 15, right: 15, zIndex: 10 },
  liveIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444', marginRight: 4 }, liveText: { fontSize: 10, fontWeight: '800', color: '#ef4444' },
  pollOptionBtn: { backgroundColor: '#fff', paddingVertical: 14, paddingHorizontal: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#cbd5e1' },
  pollOptionBtnText: { fontSize: 14, fontWeight: '700', color: '#1e293b', textAlign: 'center' },
  pollOptionResult: { height: 48, backgroundColor: '#f1f5f9', borderRadius: 10, marginBottom: 10, overflow: 'hidden', justifyContent: 'center' },
  pollFill: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: '#e0f2fe' },
  pollContent: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, zIndex: 10 },
  pollOptionText: { fontSize: 14, fontWeight: '700', color: '#0f172a' }, pollPercentage: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  pollTotalVotes: { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 5, textAlign: 'right' },
  liveTestContainer: { marginHorizontal: 15, marginBottom: 15, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff', shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  liveTestBg: { padding: 20 }, testHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  testLiveText: { color: '#fde047', fontWeight: '900', fontSize: 12, marginLeft: 4, letterSpacing: 1 }, testTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 8 },
  testInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 5 }, testInfoText: { color: '#cbd5e1', fontWeight: '700', fontSize: 13, marginRight: 10 },
  startTestBtn: { backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 12 }, startTestBtnText: { color: '#4f46e5', fontWeight: '900', fontSize: 15, marginRight: 8 },
  attemptsText: { textAlign: 'center', color: '#64748b', fontSize: 12, fontWeight: '700', paddingVertical: 10, backgroundColor: '#f8fafc' },
  resourceContainer: { marginHorizontal: 15, marginBottom: 15, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  resourceHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fafaf9', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  resourceIcon: { backgroundColor: '#e0e7ff', padding: 10, borderRadius: 10 }, resourceTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' }, resourceSub: { fontSize: 12, color: '#64748b', marginTop: 2, fontWeight: '600' },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4f46e5', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }, downloadText: { color: '#fff', fontSize: 12, fontWeight: '800', marginLeft: 4 },
  smartNotePreview: { height: 140, backgroundColor: '#fdf2f8', justifyContent: 'center', alignItems: 'center' }, smartNoteText: { marginTop: 10, color: '#be185d', fontWeight: '800', fontSize: 15 },
  inlineFlashcardContainer: { marginHorizontal: 15, marginBottom: 15, backgroundColor: '#020617', borderRadius: 20, overflow: 'hidden', elevation: 5, shadowColor: '#4f46e5', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 10 },
  inlineFlashcardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#0f172a', borderBottomWidth: 1, borderColor: '#1e293b' },
  inlineFlashcardTitle: { color: '#f8fafc', fontSize: 15, fontWeight: '800', flex: 1, marginRight: 10 }, inlineFlashcardCount: { color: '#818cf8', fontSize: 12, fontWeight: '900', backgroundColor: '#1e1b4b', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  inlineCardArea: { height: 240, position: 'relative', padding: 20, justifyContent: 'center', alignItems: 'center' },
  inlineCard: { width: '100%', height: '100%', backgroundColor: '#1e293b', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  inlineCardFront: { backgroundColor: '#1e293b' }, inlineCardBack: { backgroundColor: '#312e81', borderColor: '#4338ca' }, inlineCardCategory: { position: 'absolute', top: 15, color: '#94a3b8', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  inlineScrollCenter: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' }, inlineCardQuestion: { color: '#f8fafc', fontSize: 20, fontWeight: '800', textAlign: 'center', lineHeight: 28 }, inlineCardAnswer: { color: '#c7d2fe', fontSize: 18, fontWeight: '700', textAlign: 'center', lineHeight: 26 },
  inlineFlipBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#334155', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 15 }, inlineFlipText: { color: '#cbd5e1', fontSize: 11, fontWeight: '700' },
  inlineCardActions: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 15, gap: 10 }, inlineActionBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' }, inlineActionText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  flashcardFinish: { height: 240, justifyContent: 'center', alignItems: 'center', padding: 20 }, finishDeckTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 10 }, finishDeckSub: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginTop: 4, marginBottom: 20 },
  restartDeckBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4f46e5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 }, restartDeckText: { color: '#fff', fontSize: 13, fontWeight: '800', marginLeft: 6 },
  actionBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 14, borderTopWidth: 1, borderColor: '#f1f5f9', backgroundColor: '#fff' },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 28 }, 
  actionBtn: { flexDirection: 'row', alignItems: 'center' }, 
  actionText: { marginLeft: 6, fontSize: 14, fontWeight: '700', color: '#64748b' }, 
  saveBtn: { padding: 5 }
});