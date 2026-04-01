import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Platform, TouchableOpacity, 
  StatusBar, ActivityIndicator, RefreshControl, Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics'; 
import Animated, { 
  useSharedValue, useAnimatedStyle, useAnimatedScrollHandler, 
  interpolate, Extrapolation, Layout, FadeInDown, ZoomIn, 
  withTiming, withSequence 
} from 'react-native-reanimated';

// FIREBASE 
import { auth, db } from '../../firebaseConfig';
import { 
  collection, query, orderBy, getDocs, startAfter, limit, where,
  doc, updateDoc, arrayUnion, arrayRemove 
} from 'firebase/firestore';

// AI SERVICE
import { AIGeneratorService } from '../../lib/services/aiGeneratorService';

// COMPONENTS
import SidebarMenu from '../../components/SidebarMenu';
import TopHeader from '../../components/TopHeader';
import EduxityLoader from '../../components/EduxityLoader'; 

const { width } = Dimensions.get('window');
const LOGO_HEADER_H = 60;
const TABS_H = 50;
const TOTAL_HIDABLE_H = LOGO_HEADER_H + TABS_H;
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

// 🎲 Smart Shuffler
const shuffleArray = (array: any[]) => {
  let shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// ==========================================
// 🔖 REUSABLE BOOKMARK BUTTON (Optimistic UI)
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
      if (newState) {
        await updateDoc(postRef, { savedBy: arrayUnion(currentUid) });
      } else {
        await updateDoc(postRef, { savedBy: arrayRemove(currentUid) });
      }
    } catch (e) {
      console.error("Save error:", e);
      setIsSaved(!newState); // Revert on error
    }
  };

  return (
    <TouchableOpacity onPress={toggleSave} style={{ padding: 4, marginLeft: 10 }} activeOpacity={0.7}>
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
  const title = safeContent.title || item.topic || "Secret Concept 🔥";
  const explanation = safeContent.explanation || (typeof item.content === 'string' ? item.content : "Tap to learn.");

  return (
    <Animated.View entering={FadeInDown.springify()} style={styles.aiCard}>
      <View style={styles.cardHeaderRow}>
        <View style={[styles.typeBadge, {backgroundColor: 'rgba(56, 189, 248, 0.1)'}]}>
          <Ionicons name="flash" size={14} color="#38bdf8" />
          <Text style={[styles.typeText, {color: '#38bdf8'}]}>Must Know</Text>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Text style={styles.topicText}>{item.topic || 'Revision'}</Text>
          <BookmarkButton item={item} currentUid={currentUid} />
        </View>
      </View>
      
      <Text style={styles.conceptTitle}>🤔 {title}</Text>
      
      {!revealed ? (
        <TouchableOpacity activeOpacity={0.8} onPress={() => { if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setRevealed(true); }} style={styles.revealBtn}>
          <Text style={styles.revealBtnText}>Tap to reveal the secret 🔓</Text>
        </TouchableOpacity>
      ) : (
        <Animated.View entering={ZoomIn}>
          <Text style={styles.conceptBody}>💡 {explanation}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
};

// ==========================================
// 🃏 2. FLASHCARD
// ==========================================
const AIFlashcard = ({ item, currentUid }: { item: any, currentUid: string | undefined }) => {
  const flipAnim = useSharedValue(0);

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const spinVal = interpolate(flipAnim.value, [0, 1], [0, 180]);
    return { transform: [{ rotateY: `${spinVal}deg` }], backfaceVisibility: 'hidden', zIndex: flipAnim.value < 0.5 ? 1 : 0 };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const spinVal = interpolate(flipAnim.value, [0, 1], [180, 360]);
    return { transform: [{ rotateY: `${spinVal}deg` }], backfaceVisibility: 'hidden', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: flipAnim.value > 0.5 ? 1 : 0 };
  });

  const handleFlip = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    flipAnim.value = withTiming(flipAnim.value === 0 ? 1 : 0, { duration: 500 });
  };

  const safeContent = typeof item.content === 'object' && item.content !== null ? item.content : {};
  const frontText = safeContent.front || "Question missing...";
  const backText = safeContent.back || "Answer missing...";

  return (
    <Animated.View entering={FadeInDown.springify()} style={[styles.aiCard, { perspective: 1000 }]}>
      <View style={styles.cardHeaderRow}>
        <View style={[styles.typeBadge, {backgroundColor: 'rgba(167, 139, 250, 0.1)'}]}>
          <Ionicons name="copy" size={14} color="#a78bfa" />
          <Text style={[styles.typeText, {color: '#a78bfa'}]}>Flashcard</Text>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Text style={styles.topicText}>{item.topic || 'Revision'}</Text>
          <BookmarkButton item={item} currentUid={currentUid} />
        </View>
      </View>
      
      <TouchableOpacity activeOpacity={1} onPress={handleFlip} style={styles.flashcardContainer}>
        <Animated.View style={[styles.flashcardFace, frontAnimatedStyle]}>
          <Text style={styles.flashcardQText}>{frontText}</Text>
          <Text style={styles.tapPrompt}>Tap card to flip 🔄</Text>
        </Animated.View>
        <Animated.View style={[styles.flashcardFace, styles.flashcardBack, backAnimatedStyle]}>
          <Text style={styles.flashcardAText}>{backText}</Text>
        </Animated.View>
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
  const options = safeContent.options || ["A", "B", "C", "D"];
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
      shakeAnim.value = withSequence(withTiming(15, {duration: 50}), withTiming(-15, {duration: 50}), withTiming(0, {duration: 50}));
      onWrong();
    }
  };

  return (
    <Animated.View entering={FadeInDown.springify()} style={styles.aiCard}>
      <View style={styles.cardHeaderRow}>
        <View style={[styles.typeBadge, {backgroundColor: 'rgba(16, 185, 129, 0.1)'}]}>
          <Ionicons name="help-circle" size={14} color="#10b981" />
          <Text style={[styles.typeText, {color: '#10b981'}]}>Quiz</Text>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Text style={styles.topicText}>{item.topic || 'Revision'}</Text>
          <BookmarkButton item={item} currentUid={currentUid} />
        </View>
      </View>
      
      <Text style={styles.quizQuestion}>{safeContent.question || "Loading question..."}</Text>
      
      <Animated.View style={[styles.optionsContainer, animatedShake]}>
        {options.map((opt: string, idx: number) => {
          let optStyle = styles.optionBtn;
          let textStyle = styles.optionText;
          if (selectedOpt !== null) {
             if (idx === correctIdx) {
               optStyle = [styles.optionBtn, styles.optionCorrect];
               textStyle = [styles.optionText, {color: '#fff'}];
             } else if (idx === selectedOpt) {
               optStyle = [styles.optionBtn, styles.optionWrong];
               textStyle = [styles.optionText, {color: '#fff'}];
             }
          }
          return (
            <TouchableOpacity key={idx} activeOpacity={0.7} style={optStyle} onPress={() => handleSelect(idx)}>
              <Text style={textStyle}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </Animated.View>
      {selectedOpt !== null && (
        <Animated.View entering={ZoomIn} style={[styles.explanationBox, {borderColor: selectedOpt === correctIdx ? '#10b981' : '#ef4444', borderWidth: 1}]}>
          <Text style={[styles.expTitle, {color: selectedOpt === correctIdx ? '#10b981' : '#ef4444'}]}>
            {selectedOpt === correctIdx ? 'Spot On! 🎯' : 'Almost! 💡'}
          </Text>
          <Text style={styles.expText}>{safeContent.explanation}</Text>
        </Animated.View>
      )}
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
        <View style={[styles.typeBadge, {backgroundColor: 'rgba(245, 158, 11, 0.1)'}]}>
          <Ionicons name="git-compare" size={14} color="#f59e0b" />
          <Text style={[styles.typeText, {color: '#f59e0b'}]}>True or False</Text>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Text style={styles.topicText}>{item.topic || 'Revision'}</Text>
          <BookmarkButton item={item} currentUid={currentUid} />
        </View>
      </View>

      <Text style={styles.quizQuestion}>{safeContent.statement || "Loading..."}</Text>

      <View style={{flexDirection: 'row', gap: 10}}>
        <TouchableOpacity style={[styles.optionBtn, {flex: 1, alignItems: 'center'}, selectedOpt === true && (isTrue ? styles.optionCorrect : styles.optionWrong)]} onPress={() => handleSelect(true)}>
          <Text style={[styles.optionText, selectedOpt === true && {color: '#fff'}]}>True</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.optionBtn, {flex: 1, alignItems: 'center'}, selectedOpt === false && (!isTrue ? styles.optionCorrect : styles.optionWrong)]} onPress={() => handleSelect(false)}>
          <Text style={[styles.optionText, selectedOpt === false && {color: '#fff'}]}>False</Text>
        </TouchableOpacity>
      </View>

      {selectedOpt !== null && (
        <Animated.View entering={ZoomIn} style={[styles.explanationBox, {borderColor: selectedOpt === isTrue ? '#10b981' : '#ef4444', borderWidth: 1}]}>
          <Text style={[styles.expTitle, {color: selectedOpt === isTrue ? '#10b981' : '#ef4444'}]}>{selectedOpt === isTrue ? 'Perfect! 🔥' : 'Nope! 💡'}</Text>
          <Text style={styles.expText}>{safeContent.explanation}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
};

// ==========================================
// 🧩 5. MATCH GAME
// ==========================================
const AIMiniGameMatch = ({ item, currentUid, onCorrect }: { item: any, currentUid: string | undefined, onCorrect: ()=>void }) => {
  const safeContent = typeof item.content === 'object' && item.content !== null ? item.content : {};
  const originalPairs = safeContent.pairs || [];
  
  const [shuffledTerms, setShuffledTerms] = useState<any[]>([]);
  const [shuffledDefs, setShuffledDefs] = useState<any[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  
  useEffect(() => {
    if (originalPairs.length > 0) {
      setShuffledTerms([...originalPairs].sort(() => Math.random() - 0.5));
      setShuffledDefs([...originalPairs].sort(() => Math.random() - 0.5));
    }
  }, []);

  const handleTermTap = (term: string) => {
    if (matchedPairs.includes(term)) return; 
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setSelectedTerm(term === selectedTerm ? null : term); 
  };

  const handleDefTap = (def: string) => {
    if (!selectedTerm) return; 
    const correctPair = originalPairs.find((p: any) => p.term === selectedTerm);
    if (correctPair && correctPair.definition === def) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMatchedPairs([...matchedPairs, selectedTerm]);
      setSelectedTerm(null);
      if (matchedPairs.length + 1 === originalPairs.length) onCorrect(); 
    } else {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setSelectedTerm(null); 
    }
  };

  const isGameWon = matchedPairs.length === originalPairs.length && originalPairs.length > 0;

  return (
    <Animated.View entering={FadeInDown.springify()} style={styles.aiCard}>
      <View style={styles.cardHeaderRow}>
        <View style={[styles.typeBadge, {backgroundColor: 'rgba(99, 102, 241, 0.1)'}]}>
          <Ionicons name="game-controller" size={14} color="#6366f1" />
          <Text style={[styles.typeText, {color: '#6366f1'}]}>Match Game</Text>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Text style={styles.topicText}>{matchedPairs.length}/{originalPairs.length} Matched</Text>
          <BookmarkButton item={item} currentUid={currentUid} />
        </View>
      </View>

      {isGameWon ? (
        <Animated.View entering={ZoomIn} style={styles.gameWonBox}>
          <Ionicons name="trophy" size={50} color="#f59e0b" />
          <Text style={styles.gameWonText}>Perfect Match! 🎉</Text>
        </Animated.View>
      ) : (
        <Text style={styles.quizQuestion}>Tap a Term, then tap its matching Definition:</Text>
      )}

      {!isGameWon && originalPairs.length > 0 && (
        <View style={styles.matchGameContainer}>
          <View style={styles.matchColumn}>
            {shuffledTerms.map((pair, idx) => {
              const isMatched = matchedPairs.includes(pair.term);
              const isSelected = selectedTerm === pair.term;
              return (
                <TouchableOpacity key={`term-${idx}`} disabled={isMatched} onPress={() => handleTermTap(pair.term)} style={[styles.matchBubble, isSelected && styles.matchBubbleSelected, isMatched && styles.matchBubbleMatched]}>
                  <Text style={[styles.matchBubbleText, isMatched && {color: '#fff'}]}>{pair.term}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.matchColumn}>
            {shuffledDefs.map((pair, idx) => {
              const parentTerm = originalPairs.find((p: any) => p.definition === pair.definition)?.term;
              const isMatched = matchedPairs.includes(parentTerm);
              return (
                <TouchableOpacity key={`def-${idx}`} disabled={isMatched} onPress={() => handleDefTap(pair.definition)} style={[styles.matchBubbleDef, isMatched && styles.matchBubbleMatched]}>
                  <Text style={[styles.matchBubbleDefText, isMatched && {color: '#fff'}]}>{pair.definition}</Text>
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
// 🌟 MAIN AI FEED SCREEN
// ==========================================
export default function AILearningFeedScreen() {
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [feedType, setFeedType] = useState<'FOR_YOU' | 'PERSONALIZED'>('FOR_YOU');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [aiPosts, setAIPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [streak, setStreak] = useState(0); 
  
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

  const logoHeaderStyle = useAnimatedStyle(() => {
    const ty = interpolate(diffClampY.value, [0, TABS_H, TOTAL_HIDABLE_H], [0, 0, -LOGO_HEADER_H], Extrapolation.CLAMP);
    return { transform: [{ translateY: ty }] };
  });

  const tabsStyle = useAnimatedStyle(() => {
    const ty = interpolate(diffClampY.value, [0, 0, TABS_H + LOGO_HEADER_H], [0, 0, -(TABS_H + LOGO_HEADER_H)], Extrapolation.CLAMP);
    return { transform: [{ translateY: ty }] };
  });

  const fetchInitialFeed = async () => {
    if (!currentUid) return;
    setLoading(true); 
    try {
      const q = query(collection(db, 'ai_feed_items'), orderBy('createdAt', 'desc'), limit(POSTS_PER_PAGE * 2));
      const snap = await getDocs(q);
      if (!snap.empty) { 
        setLastVisiblePost(snap.docs[snap.docs.length - 1]); 
        let fetchedData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (feedType === 'PERSONALIZED') fetchedData = fetchedData.filter((item: any) => item.userId === currentUid);
        else fetchedData = shuffleArray(fetchedData);
        setAIPosts(fetchedData);
        setHasMorePosts(snap.docs.length >= POSTS_PER_PAGE);
      } else { 
        setAIPosts([]); setHasMorePosts(false); 
      }
    } catch (error) { console.error("Fetch Error: ", error); } 
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchInitialFeed(); }, [currentUid, feedType]));

  const fetchMorePosts = async () => {
    if (loadingMore || !currentUid) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoadingMore(true);

    try {
      const nextQ = query(collection(db, 'ai_feed_items'), orderBy('createdAt', 'desc'), startAfter(lastVisiblePost || 0), limit(POSTS_PER_PAGE * 2));
      const snap = await getDocs(nextQ);
      let newData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (feedType === 'PERSONALIZED') newData = newData.filter((item: any) => item.userId === currentUid);
      else newData = shuffleArray(newData); 
      
      if (newData.length > 0) {
        setLastVisiblePost(snap.docs[snap.docs.length - 1]);
        setAIPosts(prev => [...prev, ...newData]);
        setHasMorePosts(snap.docs.length >= POSTS_PER_PAGE);
      } else if (feedType === 'PERSONALIZED') { 
        console.log("Empty My Space. AI generating fresh posts...");
        const recentTopics = [...new Set(aiPosts.slice(0, 5).map(p => p.topic))].join(', ') || "General Science";
        const success = await AIGeneratorService.processMaterialAndGenerateFeed({
          subject: "Continuous Learning", topic: recentTopics, examType: "Revision Mode", goal: "practice", time: "15 Min", difficulty: "Medium", contentPreferences: [], hasFiles: false, fileNames: [], directText: "Generate advanced continuation topics."
        });

        if (success) {
          const freshQ = query(collection(db, 'ai_feed_items'), orderBy('createdAt', 'desc'), limit(POSTS_PER_PAGE * 2));
          const freshSnap = await getDocs(freshQ);
          if (!freshSnap.empty) {
             let freshData = freshSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((item: any) => item.userId === currentUid);
             if (freshData.length > 0) {
               setLastVisiblePost(freshSnap.docs[freshSnap.docs.length - 1]);
               setAIPosts(prev => [...prev, ...freshData]);
               setHasMorePosts(true); 
             }
          }
        } else setHasMorePosts(false);
      } else setHasMorePosts(false); 
    } catch (error) { setHasMorePosts(false); } 
    finally { setLoadingMore(false); }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <SidebarMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} currentUid={currentUid} />

      <View style={{ flex: 1, position: 'relative' }}>
        <Animated.View style={[styles.feedTabsContainer, { zIndex: 2, top: LOGO_HEADER_H, justifyContent: 'space-between' }, tabsStyle]}>
          <View style={{flexDirection: 'row', flex: 1}}>
            <TouchableOpacity style={[styles.feedTab, feedType === 'FOR_YOU' && styles.feedTabActive]} onPress={() => { setFeedType('FOR_YOU'); if(Platform.OS !== 'web') Haptics.selectionAsync(); }}>
              <Text style={[styles.feedTabText, feedType === 'FOR_YOU' && styles.feedTabTextActive]}>For You</Text>
              {feedType === 'FOR_YOU' && <Animated.View layout={Layout.springify()} style={styles.activeTabIndicator} />}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.feedTab, feedType === 'PERSONALIZED' && styles.feedTabActive]} onPress={() => { setFeedType('PERSONALIZED'); if(Platform.OS !== 'web') Haptics.selectionAsync(); }}>
              <Text style={[styles.feedTabText, feedType === 'PERSONALIZED' && styles.feedTabTextActive]}>My Space</Text>
              {feedType === 'PERSONALIZED' && <Animated.View layout={Layout.springify()} style={styles.activeTabIndicator} />}
            </TouchableOpacity>
          </View>
          {streak > 0 && (
            <Animated.View entering={ZoomIn} style={styles.streakBox}>
              <Ionicons name="flame" size={18} color="#f97316" />
              <Text style={styles.streakText}>{streak}</Text>
            </Animated.View>
          )}
        </Animated.View>

        <Animated.View style={[styles.logoHeaderWrapper, { zIndex: 3, top: 0 }, logoHeaderStyle]}>
          <TopHeader setIsMenuOpen={setIsMenuOpen} unreadCount={0} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        </Animated.View>

        {loading && aiPosts.length === 0 ? (
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><EduxityLoader /><Text style={{color: '#64748b', marginTop: 10, fontWeight: '600'}}>Mixing your brain fuel...</Text></View>
        ) : (
          <AnimatedFlatList
            data={aiPosts} 
            keyExtractor={(item: any, index: number) => `${item.id}-${index}`}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingTop: LOGO_HEADER_H + TABS_H + 20, paddingBottom: 120 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setLastVisiblePost(null); fetchInitialFeed(); }} tintColor="#4f46e5" />}
            
            ListFooterComponent={
              hasMorePosts && !loading && aiPosts.length > 0 ? (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <TouchableOpacity style={styles.loadMoreBtn} onPress={fetchMorePosts} disabled={loadingMore}>
                    {loadingMore ? <ActivityIndicator color="#fff" /> : <Text style={styles.loadMoreText}>Load More Posts 🚀</Text>}
                  </TouchableOpacity>
                </View>
              ) : (aiPosts.length > 0 && !loadingMore ? <View style={{ paddingVertical: 30, alignItems: 'center' }}><Text style={{ color: '#94a3b8', fontWeight: '700' }}>You've caught up! ✨</Text></View> : null)
            }
            
            renderItem={({ item }: { item: any }) => {
              switch(item.type) {
                case 'concept_micro': return <AIConceptMicro item={item} currentUid={currentUid} />;
                case 'flashcard': return <AIFlashcard item={item} currentUid={currentUid} />;
                case 'quiz_mcq': return <AIQuizCard item={item} currentUid={currentUid} onCorrect={() => setStreak(s=>s+1)} onWrong={() => setStreak(0)} />;
                case 'quiz_tf': return <AIQuizTF item={item} currentUid={currentUid} onCorrect={() => setStreak(s=>s+1)} onWrong={() => setStreak(0)} />;
                case 'mini_game_match': return <AIMiniGameMatch item={item} currentUid={currentUid} onCorrect={() => setStreak(s=>s+1)} />;
                default: return null; 
              }
            }}
            
            ListEmptyComponent={!loading ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconBg}><Ionicons name="planet-outline" size={50} color="#4f46e5" /></View>
                <Text style={styles.emptyTitle}>Your feed is hungry</Text>
                <TouchableOpacity style={styles.uploadBtn} onPress={() => router.push('/resources')}><Ionicons name="sparkles" size={20} color="#fff" style={{marginRight: 8}}/><Text style={{color: '#fff', fontWeight: '800', fontSize: 16}}>Create Magic</Text></TouchableOpacity>
              </View>
            ) : null}
          />
        )}
      </View>

      <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={() => router.push('/resources')}>
        <View style={styles.fabInner}><Ionicons name="sparkles" size={28} color="#fde047" /></View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' }, 
  logoHeaderWrapper: { position: 'absolute', width: '100%', height: LOGO_HEADER_H, backgroundColor: '#f8fafc' },
  feedTabsContainer: { position: 'absolute', width: '100%', height: TABS_H, flexDirection: 'row', backgroundColor: '#f8fafc', borderBottomWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 20, alignItems: 'center' },
  feedTab: { flex: 1, alignItems: 'center', paddingVertical: 14, position: 'relative' },
  feedTabText: { fontSize: 15, fontWeight: '700', color: '#64748b' },
  feedTabTextActive: { color: '#0f172a', fontWeight: '900' },
  activeTabIndicator: { position: 'absolute', bottom: -1, width: 40, height: 4, backgroundColor: '#4f46e5', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
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
  matchGameContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  matchColumn: { flex: 1, gap: 10 },
  matchBubble: { backgroundColor: '#f1f5f9', padding: 15, borderRadius: 16, borderWidth: 2, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', minHeight: 70 },
  matchBubbleSelected: { borderColor: '#6366f1', backgroundColor: '#e0e7ff' },
  matchBubbleMatched: { backgroundColor: '#10b981', borderColor: '#10b981' },
  matchBubbleText: { fontSize: 14, fontWeight: '800', color: '#475569', textAlign: 'center' },
  matchBubbleDef: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', minHeight: 70 },
  matchBubbleDefText: { fontSize: 12, fontWeight: '600', color: '#64748b', textAlign: 'center' },
  gameWonBox: { alignItems: 'center', backgroundColor: '#fef3c7', padding: 30, borderRadius: 20, borderWidth: 2, borderColor: '#fcd34d' },
  gameWonText: { fontSize: 20, fontWeight: '900', color: '#b45309', marginTop: 10 },
  explanationBox: { marginTop: 15, backgroundColor: '#f1f5f9', padding: 15, borderRadius: 16 },
  expTitle: { fontSize: 14, fontWeight: '900', marginBottom: 5 },
  expText: { fontSize: 14, color: '#475569', lineHeight: 22, fontWeight: '500' },
  emptyState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyIconBg: { backgroundColor: '#eef2ff', padding: 25, borderRadius: 40, marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a', marginBottom: 10, textAlign: 'center' },
  uploadBtn: { flexDirection: 'row', backgroundColor: '#4f46e5', paddingHorizontal: 30, paddingVertical: 16, borderRadius: 20, elevation: 5 },
  fab: { position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 90, right: 20, zIndex: 100 },
  fabInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15 },
  loadMoreBtn: { backgroundColor: '#0f172a', paddingHorizontal: 30, paddingVertical: 14, borderRadius: 20, elevation: 4, minWidth: 200, alignItems: 'center' },
  loadMoreText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});