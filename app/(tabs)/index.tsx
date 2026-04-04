import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Platform, TouchableOpacity, 
  StatusBar, ActivityIndicator, RefreshControl, Dimensions, Modal, ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics'; 
import Animated, { 
  useSharedValue, useAnimatedStyle, useAnimatedScrollHandler, 
  interpolate, Extrapolation, Layout, FadeInDown, ZoomIn, 
  withTiming, withSequence 
} from 'react-native-reanimated';

import { onAuthStateChanged } from 'firebase/auth';

// FIREBASE 
import { auth, db } from '../../firebaseConfig';
import { 
  collection, query, orderBy, getDocs, startAfter, limit, where,
  doc, updateDoc, arrayUnion, arrayRemove, getDoc 
} from 'firebase/firestore';

// AI SERVICE
import { AIGeneratorService } from '../../lib/services/aiGeneratorService';

// COMPONENTS
import SidebarMenu from '../../components/SidebarMenu';
import TopHeader from '../../components/TopHeader';
// ⚠️ MAKE SURE EDUXITY LOADER EXISTS OR REMOVE THIS LINE IF IT CAUSES ERROR
import EduxityLoader from '../../components/EduxityLoader'; 

const { width } = Dimensions.get('window');
const LOGO_HEADER_H = 60;
const TABS_H = 50;
const TOTAL_HIDABLE_H = LOGO_HEADER_H + TABS_H;
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

// ==========================================
// 🔖 REUSABLE BOOKMARK BUTTON
// ==========================================
const BookmarkButton = ({ item, currentUid }: { item: any, currentUid: string | undefined }) => {
  const [isSaved, setIsSaved] = useState(item.savedBy?.includes(currentUid) || false);

  const toggleSave = async () => {
    if (!currentUid || !item.id) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newState = !isSaved;
    setIsSaved(newState); 

    const postRef = doc(db, 'ai_feed_items', item.id);
    try {
      if (newState) await updateDoc(postRef, { savedBy: arrayUnion(currentUid) });
      else await updateDoc(postRef, { savedBy: arrayRemove(currentUid) });
    } catch (e) { setIsSaved(!newState); }
  };

  return (
    <TouchableOpacity onPress={toggleSave} style={{ padding: 4, marginLeft: 10 }}>
      <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={22} color={isSaved ? "#4f46e5" : "#94a3b8"} />
    </TouchableOpacity>
  );
};

// ==========================================
// 🧠 1. CONCEPT MICRO 
// ==========================================
const AIConceptMicro = ({ item, currentUid }: { item: any, currentUid: string | undefined }) => {
    const [revealed, setRevealed] = useState(false);
    const safeContent = typeof item.content === 'object' && item.content !== null ? item.content : {};
    return (
      <Animated.View entering={FadeInDown.springify()} style={styles.aiCard}>
        <View style={styles.cardHeaderRow}>
          <View style={[styles.typeBadge, {backgroundColor: 'rgba(56, 189, 248, 0.1)'}]}><Ionicons name="flash" size={14} color="#38bdf8" /><Text style={[styles.typeText, {color: '#38bdf8'}]}>Concept</Text></View>
          <View style={{flexDirection: 'row', alignItems: 'center'}}><Text style={styles.topicText}>{item.topic || 'Revision'}</Text><BookmarkButton item={item} currentUid={currentUid} /></View>
        </View>
        <Text style={styles.conceptTitle}>{safeContent.title || item.topic}</Text>
        {!revealed ? (
          <TouchableOpacity onPress={() => setRevealed(true)} style={styles.revealBtn}><Text style={styles.revealBtnText}>Tap to reveal 🔓</Text></TouchableOpacity>
        ) : (<Animated.View entering={ZoomIn}><Text style={styles.conceptBody}>{safeContent.explanation || item.content}</Text></Animated.View>)}
      </Animated.View>
    );
};

// ==========================================
// 🃏 2. BASIC FLIP FLASHCARD
// ==========================================
const AIFlashcard = ({ item, currentUid }: { item: any, currentUid: string | undefined }) => {
    const flipAnim = useSharedValue(0);
    const frontAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ rotateY: `${interpolate(flipAnim.value, [0, 1], [0, 180])}deg` }], backfaceVisibility: 'hidden', zIndex: flipAnim.value < 0.5 ? 1 : 0 }));
    const backAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ rotateY: `${interpolate(flipAnim.value, [0, 1], [180, 360])}deg` }], backfaceVisibility: 'hidden', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: flipAnim.value > 0.5 ? 1 : 0 }));
    
    const handleFlip = () => { 
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      flipAnim.value = withTiming(flipAnim.value === 0 ? 1 : 0, { duration: 500 }); 
    };
    
    const safeContent = typeof item.content === 'object' && item.content !== null ? item.content : {};
    return (
      <Animated.View entering={FadeInDown.springify()} style={[styles.aiCard, { perspective: 1000 }]}>
        <View style={styles.cardHeaderRow}>
          <View style={[styles.typeBadge, {backgroundColor: 'rgba(167, 139, 250, 0.1)'}]}><Ionicons name="copy" size={14} color="#a78bfa" /><Text style={[styles.typeText, {color: '#a78bfa'}]}>Flashcard</Text></View>
          <View style={{flexDirection: 'row', alignItems: 'center'}}><Text style={styles.topicText}>{item.topic}</Text><BookmarkButton item={item} currentUid={currentUid} /></View>
        </View>
        <TouchableOpacity activeOpacity={1} onPress={handleFlip} style={styles.flashcardContainer}>
          <Animated.View style={[styles.flashcardFace, frontAnimatedStyle]}><Text style={styles.flashcardQText}>{safeContent.front}</Text><Text style={styles.tapPrompt}>Tap to flip 🔄</Text></Animated.View>
          <Animated.View style={[styles.flashcardFace, styles.flashcardBack, backAnimatedStyle]}><Text style={styles.flashcardAText}>{safeContent.back}</Text></Animated.View>
        </TouchableOpacity>
      </Animated.View>
    );
};

// ==========================================
// 🎯 3. QUIZ MCQ
// ==========================================
const AIQuizCard = ({ item, currentUid, onCorrect, onWrong }: { item: any, currentUid: string | undefined, onCorrect: ()=>void, onWrong: ()=>void }) => {
    const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
    const shakeAnim = useSharedValue(0);
    const safeContent = typeof item.content === 'object' && item.content !== null ? item.content : {};
    const correctIdx = safeContent.correctAnswerIndex ?? 0;
    
    const animatedShake = useAnimatedStyle(() => ({ transform: [{ translateX: shakeAnim.value }] }));

    const handleSelect = (idx: number) => { 
      if (selectedOpt !== null) return; 
      setSelectedOpt(idx); 
      if (idx === correctIdx) {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onCorrect(); 
      } else {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        shakeAnim.value = withSequence(withTiming(10, {duration: 50}), withTiming(-10, {duration: 50}), withTiming(0, {duration: 50}));
        onWrong(); 
      }
    };

    return (
      <Animated.View entering={FadeInDown.springify()} style={styles.aiCard}>
        <View style={styles.cardHeaderRow}>
          <View style={[styles.typeBadge, {backgroundColor: 'rgba(16, 185, 129, 0.1)'}]}><Ionicons name="help-circle" size={14} color="#10b981" /><Text style={[styles.typeText, {color: '#10b981'}]}>Quiz</Text></View>
          <View style={{flexDirection: 'row', alignItems: 'center'}}><Text style={styles.topicText}>{item.topic}</Text><BookmarkButton item={item} currentUid={currentUid} /></View>
        </View>
        <Text style={styles.quizQuestion}>{safeContent.question}</Text>
        <Animated.View style={[styles.optionsContainer, animatedShake]}>
          {(safeContent.options || ["A","B","C","D"]).map((opt: string, idx: number) => {
            let optStyle = styles.optionBtn; let textStyle = styles.optionText;
            if (selectedOpt !== null) { 
              if (idx === correctIdx) { optStyle = [styles.optionBtn, styles.optionCorrect]; textStyle = [styles.optionText, {color: '#fff'}]; } 
              else if (idx === selectedOpt) { optStyle = [styles.optionBtn, styles.optionWrong]; textStyle = [styles.optionText, {color: '#fff'}]; } 
            }
            return (<TouchableOpacity key={idx} style={optStyle} onPress={() => handleSelect(idx)}><Text style={textStyle}>{opt}</Text></TouchableOpacity>);
          })}
        </Animated.View>
        {selectedOpt !== null && (<Animated.View entering={ZoomIn} style={[styles.explanationBox, {borderColor: selectedOpt === correctIdx ? '#10b981' : '#ef4444', borderWidth: 1}]}><Text style={[styles.expTitle, {color: selectedOpt === correctIdx ? '#10b981' : '#ef4444'}]}>{selectedOpt === correctIdx ? 'Spot On! 🎯' : 'Almost! 💡'}</Text><Text style={styles.expText}>{safeContent.explanation}</Text></Animated.View>)}
      </Animated.View>
    );
};

// ==========================================
// ⚡️ 4. TRUE / FALSE
// ==========================================
const AIQuizTF = ({ item, currentUid, onCorrect, onWrong }: { item: any, currentUid: string | undefined, onCorrect: ()=>void, onWrong: ()=>void }) => {
    const [selectedOpt, setSelectedOpt] = useState<boolean | null>(null);
    const safeContent = typeof item.content === 'object' && item.content !== null ? item.content : {};
    const isTrue = safeContent.isTrue ?? true;

    const handleSelect = (val: boolean) => { 
      if (selectedOpt !== null) return; 
      setSelectedOpt(val); 
      if (val === isTrue) {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onCorrect(); 
      } else {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        onWrong(); 
      }
    };

    return (
      <Animated.View entering={FadeInDown.springify()} style={styles.aiCard}>
        <View style={styles.cardHeaderRow}>
          <View style={[styles.typeBadge, {backgroundColor: 'rgba(245, 158, 11, 0.1)'}]}><Ionicons name="git-compare" size={14} color="#f59e0b" /><Text style={[styles.typeText, {color: '#f59e0b'}]}>True or False</Text></View>
          <View style={{flexDirection: 'row', alignItems: 'center'}}><Text style={styles.topicText}>{item.topic}</Text><BookmarkButton item={item} currentUid={currentUid} /></View>
        </View>
        <Text style={styles.quizQuestion}>{safeContent.statement}</Text>
        <View style={{flexDirection: 'row', gap: 10}}>
          <TouchableOpacity style={[styles.optionBtn, {flex: 1, alignItems: 'center'}, selectedOpt === true && (isTrue ? styles.optionCorrect : styles.optionWrong)]} onPress={() => handleSelect(true)}><Text style={[styles.optionText, selectedOpt === true && {color: '#fff'}]}>True</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.optionBtn, {flex: 1, alignItems: 'center'}, selectedOpt === false && (!isTrue ? styles.optionCorrect : styles.optionWrong)]} onPress={() => handleSelect(false)}><Text style={[styles.optionText, selectedOpt === false && {color: '#fff'}]}>False</Text></TouchableOpacity>
        </View>
        {selectedOpt !== null && (<Animated.View entering={ZoomIn} style={[styles.explanationBox, {borderColor: selectedOpt === isTrue ? '#10b981' : '#ef4444', borderWidth: 1}]}><Text style={[styles.expTitle, {color: selectedOpt === isTrue ? '#10b981' : '#ef4444'}]}>{selectedOpt === isTrue ? 'Perfect! 🔥' : 'Nope! 💡'}</Text><Text style={styles.expText}>{safeContent.explanation}</Text></Animated.View>)}
      </Animated.View>
    );
};

// ==========================================
// 🧩 5. MEMORY FLIP MATCH GAME (Fixed FlatList Bug)
// ==========================================
const AIMiniGameMatch = ({ item, currentUid, onCorrect }: { item: any, currentUid: string | undefined, onCorrect: ()=>void }) => {
  let originalPairs: any[] = [];
  if (item.content) {
    if (Array.isArray(item.content.pairs)) originalPairs = item.content.pairs;
    else if (Array.isArray(item.content)) originalPairs = item.content; 
  }
  
  const [cards, setCards] = useState<any[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);

  useEffect(() => {
    if (originalPairs.length > 0) {
      let deck: any[] = [];
      originalPairs.forEach((pair: any, index: number) => {
        const termText = pair.term || pair.word || pair.question || "Term";
        const defText = pair.definition || pair.meaning || pair.answer || "Definition";
        deck.push({ id: `term-${index}`, matchId: index, text: termText, type: 'term' });
        deck.push({ id: `def-${index}`, matchId: index, text: defText, type: 'def' });
      });
      deck.sort(() => Math.random() - 0.5);
      
      setCards(deck);
      setFlippedIndices([]); 
      setMatchedIds([]);     
    }
  }, [item.id]); // 🔥 Important for FlatList recycling

  const handleCardTap = (index: number) => {
    if (flippedIndices.length === 2 || flippedIndices.includes(index) || matchedIds.includes(cards[index].matchId)) return;
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    
    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      const card1 = cards[newFlipped[0]];
      const card2 = cards[newFlipped[1]];

      if (card1.matchId === card2.matchId) {
        setTimeout(() => {
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setMatchedIds(prev => [...prev, card1.matchId]);
          setFlippedIndices([]);
          if (matchedIds.length + 1 === originalPairs.length) onCorrect(); 
        }, 500);
      } else {
        setTimeout(() => {
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setFlippedIndices([]); 
        }, 1000);
      }
    }
  };

  const isGameWon = matchedIds.length === originalPairs.length && originalPairs.length > 0;

  if (originalPairs.length === 0) {
    return (
      <Animated.View entering={FadeInDown.springify()} style={styles.aiCard}>
        <Text style={styles.topicText}>Game data corrupted. Swipe to skip.</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.springify()} style={styles.aiCard}>
      <View style={styles.cardHeaderRow}>
        <View style={[styles.typeBadge, {backgroundColor: '#eef2ff'}]}>
          <Ionicons name="game-controller" size={14} color="#4f46e5" />
          <Text style={[styles.typeText, {color: '#4f46e5'}]}>Memory Match</Text>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Text style={styles.topicText}>Matched: {matchedIds.length}/{originalPairs.length}</Text>
          <BookmarkButton item={item} currentUid={currentUid} />
        </View>
      </View>

      {isGameWon ? (
        <Animated.View entering={ZoomIn} style={{alignItems: 'center', padding: 20}}>
          <Ionicons name="trophy" size={50} color="#f59e0b" />
          <Text style={{fontSize: 18, fontWeight: '900', color: '#b45309', marginTop: 10}}>Mind Blown! 🎉</Text>
        </Animated.View>
      ) : (
        <View>
          <Text style={styles.quizQuestion}>Flip cards to find matching pairs!</Text>
          <View style={styles.memoryGrid}>
            {cards.map((card, idx) => {
              const isFlipped = flippedIndices.includes(idx) || matchedIds.includes(card.matchId);
              const isMatched = matchedIds.includes(card.matchId);
              return (
                <TouchableOpacity 
                  key={idx} activeOpacity={0.8} onPress={() => handleCardTap(idx)} 
                  style={[styles.memoryCard, isFlipped && styles.memoryCardFlipped, isMatched && styles.memoryCardMatched]}
                >
                  <Text style={[styles.memoryCardText, (isFlipped || isMatched) && {color: isMatched ? '#fff' : '#0f172a'}]}>
                    {isFlipped ? card.text : '❓'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </Animated.View>
  );
};

// ==========================================
// 🌟 MAIN AI FEED SCREEN (FIREBASE FIXED)
// ==========================================
export default function AILearningFeedScreen() {
  const router = useRouter();
  
  // 🔥 FIX 1: Firebase Realtime Auth State
  const [currentUid, setCurrentUid] = useState<string | undefined>(auth.currentUser?.uid);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("✅ User Authenticated:", user.uid);
        setCurrentUid(user.uid);
      } else {
        console.log("❌ No User Logged In");
      }
    });
    return () => unsubscribe();
  }, []);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // 🔥 FIX 2: Default to FOR_YOU taaki database ke saare posts turant dikhe
  const [feedType, setFeedType] = useState<'FOR_YOU' | 'PERSONALIZED'>('FOR_YOU'); 
  
  const [searchQuery, setSearchQuery] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);

  // HISTORY & FILTERS
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyTopics, setHistoryTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const [aiPosts, setAIPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [streak, setStreak] = useState(0); 
  const [wrongStreak, setWrongStreak] = useState(0); 
  
  const [lastVisiblePost, setLastVisiblePost] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true); 
  const POSTS_PER_PAGE = 15;

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

  const logoHeaderStyle = useAnimatedStyle(() => ({ transform: [{ translateY: interpolate(diffClampY.value, [0, TABS_H, TOTAL_HIDABLE_H], [0, 0, -LOGO_HEADER_H], Extrapolation.CLAMP) }] }));
  const tabsStyle = useAnimatedStyle(() => ({ transform: [{ translateY: interpolate(diffClampY.value, [0, 0, TABS_H + LOGO_HEADER_H], [0, 0, -(TABS_H + LOGO_HEADER_H)], Extrapolation.CLAMP) }] }));

  // 🚀 ALGORITHMS
  const rankForYouFeed = (posts: any[], profile: any) => {
    if (!profile) return posts;
    return posts.sort((a, b) => {
      let scoreA = 0; let scoreB = 0;
      if (a.examContext && profile.targetExam && a.examContext.includes(profile.targetExam)) scoreA += 50;
      if (b.examContext && profile.targetExam && b.examContext.includes(profile.targetExam)) scoreB += 50;
      return scoreB - scoreA; 
    });
  };

  const organizeMySpace = (posts: any[]) => {
    const typeWeight: any = { 'concept_micro': 1, 'flashcard': 2, 'quiz_tf': 3, 'mini_game_match': 4, 'quiz_mcq': 5 };
    return posts.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      if (Math.abs(timeA - timeB) < 10000) return (typeWeight[a.type] || 99) - (typeWeight[b.type] || 99);
      return timeB - timeA; 
    });
  };

  // 📡 FETCH INITIAL FEED
  const fetchInitialFeed = async () => {
    if (!currentUid) {
        console.log("⏳ Waiting for UID...");
        return; 
    }
    
    console.log("📡 Fetching posts from Firebase for tab:", feedType);
    setLoading(true); 
    
    try {
      let profileData = userProfile;
      if (!profileData) {
        const userDoc = await getDoc(doc(db, 'users', currentUid));
        if (userDoc.exists()) { profileData = userDoc.data(); setUserProfile(profileData); }
      }

      const q = query(collection(db, 'ai_feed_items'), orderBy('createdAt', 'desc'), limit(POSTS_PER_PAGE * 2));
      const snap = await getDocs(q);
      
      console.log(`📦 Found ${snap.docs.length} raw posts in database.`);
      
      if (!snap.empty) { 
        setLastVisiblePost(snap.docs[snap.docs.length - 1]); 
        let fetchedData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (feedType === 'PERSONALIZED') {
          fetchedData = fetchedData.filter((item: any) => item.userId === currentUid);
          if (selectedTopic) fetchedData = fetchedData.filter((item: any) => item.topic === selectedTopic);
          fetchedData = organizeMySpace(fetchedData);
          setHasMorePosts(true); 
        } else {
          fetchedData = rankForYouFeed(fetchedData, profileData);
          setHasMorePosts(snap.docs.length >= POSTS_PER_PAGE);
        }
        
        console.log(`✅ Displaying ${fetchedData.length} posts after filtering.`);
        setAIPosts(fetchedData);
      } else { 
        console.log("⚠️ No posts found in 'ai_feed_items' collection.");
        setAIPosts([]); 
        setHasMorePosts(feedType === 'PERSONALIZED'); 
      }
    } catch (error) { 
        console.error("❌ Firebase Fetch Error: ", error); 
    } 
    finally { 
        setLoading(false); 
        setRefreshing(false); 
    }
  };

  useFocusEffect(useCallback(() => { 
      if(currentUid) { fetchInitialFeed(); } 
  }, [currentUid, feedType, selectedTopic]));

  // 🚀 INFINITE AI GENERATOR
  const fetchMorePosts = async () => {
    if (loadingMore || !currentUid) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoadingMore(true);

    try {
      const nextQ = query(collection(db, 'ai_feed_items'), orderBy('createdAt', 'desc'), startAfter(lastVisiblePost || 0), limit(POSTS_PER_PAGE * 2));
      const snap = await getDocs(nextQ);
      let newData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (feedType === 'PERSONALIZED') {
        newData = newData.filter((item: any) => item.userId === currentUid);
        if (selectedTopic) newData = newData.filter((item: any) => item.topic === selectedTopic);
        newData = organizeMySpace(newData);
      } else {
        newData = rankForYouFeed(newData, userProfile);
      }
      
      if (feedType === 'PERSONALIZED' && newData.length < 5) {
        console.log("🤖 Forcing AI Engine to build MORE...");
        const aiTopic = selectedTopic || [...new Set(aiPosts.slice(0, 5).map(p => p.topic))].join(', ') || "Advanced Revisions";
        
        let dynamicDifficulty = userProfile?.level || "Medium";
        let dynamicPrompt = "Generate advanced continuation questions.";
        if (streak >= 3) { dynamicDifficulty = "Hard"; dynamicPrompt = "User is on a winning streak! Give highly tricky questions."; } 
        else if (wrongStreak >= 2) { dynamicDifficulty = "Easy"; dynamicPrompt = "User is struggling. Explain basic foundations simply."; }

        const success = await AIGeneratorService.processMaterialAndGenerateFeed({
          subject: "Deep Learning", topic: aiTopic, examType: userProfile?.targetExam || "Revision", goal: "practice", 
          time: "15 Min", difficulty: dynamicDifficulty, contentPreferences: [], hasFiles: false, fileNames: [], directText: dynamicPrompt
        });

        if (success) {
          const freshQ = query(collection(db, 'ai_feed_items'), orderBy('createdAt', 'desc'), limit(POSTS_PER_PAGE * 2));
          const freshSnap = await getDocs(freshQ);
          if (!freshSnap.empty) {
             let freshData = freshSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((item: any) => item.userId === currentUid);
             if (selectedTopic) freshData = freshData.filter((item: any) => item.topic === selectedTopic);
             freshData = organizeMySpace(freshData); 
             if (freshData.length > 0) {
               setLastVisiblePost(freshSnap.docs[freshSnap.docs.length - 1]);
               setAIPosts(prev => [...prev, ...newData, ...freshData]);
             }
          }
        }
        setHasMorePosts(true); 
      } else if (newData.length > 0) {
        setLastVisiblePost(snap.docs[snap.docs.length - 1]);
        setAIPosts(prev => [...prev, ...newData]);
        setHasMorePosts(feedType === 'PERSONALIZED' ? true : snap.docs.length >= POSTS_PER_PAGE);
      } else {
        setHasMorePosts(feedType === 'PERSONALIZED');
      }
    } catch (error) { setHasMorePosts(false); } 
    finally { setLoadingMore(false); }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <SidebarMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} currentUid={currentUid} />

      {/* 📜 HISTORY MODAL */}
      <Modal visible={showHistoryModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>My History Vault 🕰️</Text>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)}><Ionicons name="close-circle" size={28} color="#94a3b8" /></TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Select a past topic to dive back in.</Text>
            
            <ScrollView style={{ marginTop: 15 }} showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={[styles.historyItem, !selectedTopic && styles.historyItemActive]} onPress={() => { setSelectedTopic(null); setShowHistoryModal(false); }}>
                <Text style={[styles.historyText, !selectedTopic && {color: '#fff'}]}>🌍 All Topics (Mixed)</Text>
              </TouchableOpacity>
              {historyTopics.map((topic, idx) => (
                <TouchableOpacity key={idx} style={[styles.historyItem, selectedTopic === topic && styles.historyItemActive]} onPress={() => { setSelectedTopic(topic); setShowHistoryModal(false); }}>
                  <Text style={[styles.historyText, selectedTopic === topic && {color: '#fff'}]}>📚 {topic}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={{ flex: 1, position: 'relative' }}>
        <Animated.View style={[styles.feedTabsContainer, { zIndex: 2, top: LOGO_HEADER_H, justifyContent: 'space-between' }, tabsStyle]}>
          <View style={{flexDirection: 'row', flex: 1}}>
            <TouchableOpacity style={[styles.feedTab, feedType === 'FOR_YOU' && styles.feedTabActive]} onPress={() => { setFeedType('FOR_YOU'); setSelectedTopic(null); }}>
              <Text style={[styles.feedTabText, feedType === 'FOR_YOU' && styles.feedTabTextActive]}>For You</Text>
              {feedType === 'FOR_YOU' && <Animated.View layout={Layout.springify()} style={styles.activeTabIndicator} />}
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.feedTab, feedType === 'PERSONALIZED' && styles.feedTabActive]} onPress={() => { setFeedType('PERSONALIZED'); }}>
              <Text style={[styles.feedTabText, feedType === 'PERSONALIZED' && styles.feedTabTextActive]}>My Space</Text>
              {feedType === 'PERSONALIZED' && <Animated.View layout={Layout.springify()} style={styles.activeTabIndicator} />}
            </TouchableOpacity>
          </View>

          {feedType === 'PERSONALIZED' && (
            <TouchableOpacity style={styles.historyBtn} onPress={() => setShowHistoryModal(true)}>
              <Ionicons name="time" size={18} color="#4f46e5" />
              <Text style={styles.historyBtnTxt}>History</Text>
            </TouchableOpacity>
          )}

          {feedType !== 'PERSONALIZED' && streak > 0 && (
            <Animated.View entering={ZoomIn} style={styles.streakBox}>
              <Ionicons name="flame" size={18} color="#f97316" /><Text style={styles.streakText}>{streak}</Text>
            </Animated.View>
          )}
        </Animated.View>

        <Animated.View style={[styles.logoHeaderWrapper, { zIndex: 3, top: 0 }, logoHeaderStyle]}>
          <TopHeader setIsMenuOpen={setIsMenuOpen} unreadCount={0} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        </Animated.View>

        {/* --- FLATLIST --- */}
        {loading && aiPosts.length === 0 ? (
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            {/* Fallback ActivityIndicator incase EduxityLoader is missing */}
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text style={{color: '#64748b', marginTop: 10, fontWeight: '600'}}>Loading {selectedTopic ? selectedTopic : 'My Space'}...</Text>
          </View>
        ) : (
          <AnimatedFlatList
            data={aiPosts} 
            keyExtractor={(item: any, index: number) => `${item.id}-${index}`}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingTop: LOGO_HEADER_H + TABS_H + 20, paddingBottom: 120 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setLastVisiblePost(null); fetchInitialFeed(); }} tintColor="#4f46e5" />}
            
            ListFooterComponent={
              hasMorePosts && !loading ? (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <TouchableOpacity style={styles.loadMoreBtn} onPress={fetchMorePosts} disabled={loadingMore}>
                    {loadingMore ? <ActivityIndicator color="#fff" /> : <Text style={styles.loadMoreText}>Dive Deeper 🚀</Text>}
                  </TouchableOpacity>
                </View>
              ) : null
            }
            
            renderItem={({ item }: { item: any }) => {
              const onCorrect = () => { setStreak(s=>s+1); setWrongStreak(0); };
              const onWrong = () => { setStreak(0); setWrongStreak(w=>w+1); };

              switch(item.type) {
                case 'concept_micro': return <AIConceptMicro item={item} currentUid={currentUid} />;
                case 'flashcard': return <AIFlashcard item={item} currentUid={currentUid} />;
                case 'quiz_mcq': return <AIQuizCard item={item} currentUid={currentUid} onCorrect={onCorrect} onWrong={onWrong} />;
                case 'quiz_tf': return <AIQuizTF item={item} currentUid={currentUid} onCorrect={onCorrect} onWrong={onWrong} />;
                case 'mini_game_match': return <AIMiniGameMatch item={item} currentUid={currentUid} onCorrect={onCorrect} />;
                default: return null; 
              }
            }}
          />
        )}
      </View>
      <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={() => router.push('/resources')}><View style={styles.fabInner}><Ionicons name="sparkles" size={28} color="#fde047" /></View></TouchableOpacity>
    </SafeAreaView>
  );
}

// STYLES
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' }, 
  logoHeaderWrapper: { position: 'absolute', width: '100%', height: LOGO_HEADER_H, backgroundColor: '#f8fafc' },
  feedTabsContainer: { position: 'absolute', width: '100%', height: TABS_H, flexDirection: 'row', backgroundColor: '#f8fafc', borderBottomWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 20, alignItems: 'center' },
  feedTab: { flex: 1, alignItems: 'center', paddingVertical: 14, position: 'relative' },
  feedTabText: { fontSize: 15, fontWeight: '700', color: '#64748b' },
  feedTabTextActive: { color: '#0f172a', fontWeight: '900' },
  activeTabIndicator: { position: 'absolute', bottom: -1, width: 40, height: 4, backgroundColor: '#4f46e5', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  
  historyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#c7d2fe' },
  historyBtnTxt: { fontSize: 12, fontWeight: '800', color: '#4f46e5', marginLeft: 4 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', height: '60%', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, shadowColor: '#000', shadowOffset: {width: 0, height: -5}, shadowOpacity: 0.1, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  modalSub: { fontSize: 14, color: '#64748b', marginTop: 5, fontWeight: '500' },
  historyItem: { padding: 16, backgroundColor: '#f8fafc', borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  historyItemActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  historyText: { fontSize: 15, fontWeight: '700', color: '#334155' },

  streakBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffedd5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#fdba74' },
  streakText: { fontSize: 16, fontWeight: '900', color: '#ea580c', marginLeft: 4 },
  
  aiCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 20, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#94a3b8', shadowOffset: {width:0, height:6}, shadowOpacity: 0.1, shadowRadius: 15, elevation: 4 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  typeText: { fontSize: 12, fontWeight: '800', marginLeft: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  topicText: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  
  conceptTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 15, lineHeight: 28 },
  conceptBody: { fontSize: 16, color: '#334155', lineHeight: 26, fontWeight: '600', backgroundColor: '#f1f5f9', padding: 15, borderRadius: 16, marginTop: 10 },
  revealBtn: { backgroundColor: '#eef2ff', padding: 15, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#c7d2fe', borderStyle: 'dashed' },
  revealBtnText: { fontSize: 15, fontWeight: '800', color: '#4f46e5' },
  
  flashcardContainer: { position: 'relative', width: '100%', minHeight: 200 },
  flashcardFace: { backgroundColor: '#f1f5f9', borderRadius: 20, minHeight: 200, justifyContent: 'center', alignItems: 'center', padding: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  flashcardBack: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  flashcardQText: { fontSize: 18, fontWeight: '800', color: '#1e293b', textAlign: 'center', marginBottom: 20 },
  flashcardAText: { fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 26 },
  tapPrompt: { fontSize: 13, color: '#94a3b8', fontWeight: '700', position: 'absolute', bottom: 15 },
  
  quizQuestion: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 15, lineHeight: 26 },
  optionsContainer: { gap: 10 },
  optionBtn: { padding: 16, borderRadius: 16, backgroundColor: '#f8fafc', borderWidth: 2, borderColor: '#e2e8f0' },
  optionText: { fontSize: 15, fontWeight: '700', color: '#334155' },
  optionCorrect: { backgroundColor: '#10b981', borderColor: '#10b981' },
  optionWrong: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  
  explanationBox: { marginTop: 15, backgroundColor: '#f1f5f9', padding: 15, borderRadius: 16 },
  expTitle: { fontSize: 14, fontWeight: '900', marginBottom: 5 },
  expText: { fontSize: 14, color: '#475569', lineHeight: 22, fontWeight: '500' },
  
  memoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  memoryCard: { width: '48%', height: 100, backgroundColor: '#f1f5f9', borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#e2e8f0', padding: 10 },
  memoryCardFlipped: { backgroundColor: '#eef2ff', borderColor: '#4f46e5' },
  memoryCardMatched: { backgroundColor: '#10b981', borderColor: '#10b981' },
  memoryCardText: { fontSize: 14, fontWeight: '800', color: '#94a3b8', textAlign: 'center' },
  
  fab: { position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 90, right: 20, zIndex: 100 },
  fabInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', elevation: 10 },
  loadMoreBtn: { backgroundColor: '#0f172a', paddingHorizontal: 30, paddingVertical: 14, borderRadius: 20, elevation: 4, minWidth: 200, alignItems: 'center' },
  loadMoreText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});