import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, 
  Dimensions, Alert, ActivityIndicator, Platform 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, useAnimatedStyle, withSpring, withTiming, 
  interpolate, Extrapolation, runOnJS, Easing 
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { processAction } from '../../../helpers/gamificationEngine';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.3; 

export default function FlashcardScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  // 🧠 STATES
  const [cards, setCards] = useState<any[]>([]);
  const [deckTitle, setDeckTitle] = useState('Loading...');
  const [loading, setLoading] = useState(true);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [isFinished, setIsFinished] = useState(false);
  const [claiming, setClaiming] = useState(false);

  // 🌀 REANIMATED SHARED VALUES
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const flipValue = useSharedValue(0); 
  const scale = useSharedValue(1);

  // ==========================================
  // 📡 FETCH FLASHCARDS FROM FIREBASE
  // ==========================================
  useEffect(() => {
    const fetchDeck = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'posts', id as string);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.type === 'flashcard' && data.cardsData) {
            setCards(data.cardsData);
            setDeckTitle(data.title || 'Revision Deck');
          } else {
            Alert.alert('Error', 'Invalid Flashcard Data');
            router.back();
          }
        } else {
          Alert.alert('Not Found', 'This deck has been deleted.');
          router.back();
        }
      } catch (error) {
        console.log(error);
        Alert.alert('Error', 'Could not load flashcards.');
      } finally {
        setLoading(false);
      }
    };

    fetchDeck();
  }, [id]);

  const currentCard = cards[currentIndex];

  // ==========================================
  // 🃏 3D FLIP LOGIC
  // ==========================================
  const toggleFlip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isFlipped) {
      flipValue.value = withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) });
      setIsFlipped(false);
    } else {
      flipValue.value = withTiming(180, { duration: 400, easing: Easing.inOut(Easing.ease) });
      setIsFlipped(true);
    }
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipValue.value, [0, 180], [0, 180], Extrapolation.CLAMP);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden',
      zIndex: flipValue.value < 90 ? 1 : 0,
      opacity: flipValue.value < 90 ? 1 : 0,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipValue.value, [0, 180], [180, 360], Extrapolation.CLAMP);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden',
      zIndex: flipValue.value > 90 ? 1 : 0,
      opacity: flipValue.value > 90 ? 1 : 0,
    };
  });

  // ==========================================
  // 👉 TINDER SWIPE GESTURE LOGIC
  // ==========================================
  const nextCard = (direction: 'right' | 'left') => {
    if (direction === 'right') {
      setScore(s => ({ ...s, correct: s.correct + 1 }));
    } else {
      setScore(s => ({ ...s, incorrect: s.incorrect + 1 }));
    }

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      translateX.value = 0;
      translateY.value = 0;
      flipValue.value = 0;
      scale.value = 1;
      setIsFlipped(false);
    } else {
      setIsFinished(true);
    }
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      scale.value = withTiming(1.05); 
    })
    .onUpdate((event) => {
      if (!isFlipped) return;
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      if (!isFlipped) {
        runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Warning);
        return;
      }
      
      scale.value = withTiming(1);
      if (translateX.value > SWIPE_THRESHOLD) {
        translateX.value = withSpring(width + 100, { velocity: 50 });
        runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
        runOnJS(nextCard)('right');
      } else if (translateX.value < -SWIPE_THRESHOLD) {
        translateX.value = withSpring(-width - 100, { velocity: 50 });
        runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Error);
        runOnJS(nextCard)('left');
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const swipeAnimatedStyle = useAnimatedStyle(() => {
    const rotateZ = interpolate(translateX.value, [-width / 2, width / 2], [-15, 15], Extrapolation.CLAMP);
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotateZ: `${rotateZ}deg` },
        { scale: scale.value }
      ],
    };
  });

  const rightOverlayStyle = useAnimatedStyle(() => ({ opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP) }));
  const leftOverlayStyle = useAnimatedStyle(() => ({ opacity: interpolate(translateX.value, [0, -SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP) }));

  // ==========================================
  // 🏆 GAMIFICATION REWARD SYSTEM
  // ==========================================
  const handleClaimReward = async () => {
    if (!auth.currentUser) { router.back(); return; }
    setClaiming(true);
    const totalXP = (score.correct * 10) + (score.incorrect * 2);
    
    try {
      const reward = await processAction(auth.currentUser.uid, 'STUDY_SESSION'); 
      Alert.alert("Awesome Work! 🎉", `You revised ${cards.length} cards and earned +${reward?.xpEarned || totalXP} XP!`);
      router.back();
    } catch (e) {
      console.log(e);
      router.back();
    }
  };

  // ==========================================
  // 🎨 RENDER STATES
  // ==========================================
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={{color: '#94a3b8', marginTop: 10, fontWeight: '700'}}>Loading Deck...</Text>
      </View>
    );
  }

  if (isFinished) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.finishContainer}>
          <View style={styles.finishIconBg}>
            <Ionicons name="trophy" size={80} color="#fde047" />
          </View>
          <Text style={styles.finishTitle}>Deck Completed!</Text>
          <Text style={styles.finishSub}>Great job revising {cards.length} cards.</Text>

          <View style={styles.statsRow}>
            <View style={[styles.statBox, { borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Text style={[styles.statNum, { color: '#10b981' }]}>{score.correct}</Text>
              <Text style={styles.statLabel}>Remembered</Text>
            </View>
            <View style={[styles.statBox, { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
              <Text style={[styles.statNum, { color: '#ef4444' }]}>{score.incorrect}</Text>
              <Text style={styles.statLabel}>Review Later</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.claimBtn} onPress={handleClaimReward} disabled={claiming}>
            <LinearGradient colors={['#4f46e5', '#ec4899']} style={styles.claimGradient} start={{x:0, y:0}} end={{x:1, y:0}}>
              {claiming ? <ActivityIndicator color="#fff" /> : <Text style={styles.claimText}>Claim XP Reward 🎁</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        
        {/* 🔝 TOP HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close" size={28} color="#94a3b8" />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>{deckTitle} • {currentIndex + 1}/{cards.length}</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${((currentIndex) / cards.length) * 100}%` }]} />
            </View>
          </View>
        </View>

        {/* 🃏 FLASHCARD AREA */}
        <View style={styles.cardArea}>
          {currentCard && (
            <GestureDetector gesture={panGesture}>
              <Animated.View style={[styles.cardWrapper, swipeAnimatedStyle]}>
                
                {/* SWIPE OVERLAYS */}
                <Animated.View style={[styles.overlay, styles.overlayRight, rightOverlayStyle]}>
                  <Ionicons name="checkmark-circle" size={80} color="#10b981" />
                </Animated.View>
                <Animated.View style={[styles.overlay, styles.overlayLeft, leftOverlayStyle]}>
                  <Ionicons name="close-circle" size={80} color="#ef4444" />
                </Animated.View>

                {/* FRONT OF CARD (Question) */}
                <Animated.View style={[styles.card, styles.cardFront, frontAnimatedStyle]}>
                  <Text style={styles.cardCategory}>Question</Text>
                  <Text style={styles.cardQuestion}>{currentCard.q}</Text>
                  <TouchableOpacity style={styles.tapToFlipBtn} onPress={toggleFlip} activeOpacity={0.8}>
                    <Ionicons name="refresh" size={18} color="#64748b" style={{ marginRight: 5 }} />
                    <Text style={styles.tapToFlipText}>Tap to reveal answer</Text>
                  </TouchableOpacity>
                </Animated.View>

                {/* BACK OF CARD (Answer) */}
                <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
                  <Text style={styles.cardCategory}>Answer</Text>
                  <ScrollView contentContainerStyle={styles.answerScroll}>
                    <Text style={styles.cardAnswer}>{currentCard.a}</Text>
                  </ScrollView>
                  {!isFlipped && (
                    <TouchableOpacity style={styles.tapToFlipBtn} onPress={toggleFlip} activeOpacity={0.8}>
                      <Ionicons name="refresh" size={18} color="#64748b" style={{ marginRight: 5 }} />
                      <Text style={styles.tapToFlipText}>Tap to see question</Text>
                    </TouchableOpacity>
                  )}
                  
                  {isFlipped && (
                    <View style={styles.swipeHintContainer}>
                      <Ionicons name="arrow-back" size={16} color="#ef4444" />
                      <Text style={styles.swipeHintText}>Swipe to judge</Text>
                      <Ionicons name="arrow-forward" size={16} color="#10b981" />
                    </View>
                  )}
                </Animated.View>

              </Animated.View>
            </GestureDetector>
          )}
        </View>

        {/* 🎛️ MANUAL CONTROLS */}
        <View style={styles.footerControls}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.actionBtnLeft, !isFlipped && { opacity: 0.3 }]} 
            disabled={!isFlipped}
            onPress={() => {
              translateX.value = withSpring(-width - 100);
              setTimeout(() => nextCard('left'), 300);
            }}
          >
            <Ionicons name="close" size={32} color="#ef4444" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.flipBtn} onPress={toggleFlip}>
            <Ionicons name="refresh" size={28} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, styles.actionBtnRight, !isFlipped && { opacity: 0.3 }]} 
            disabled={!isFlipped}
            onPress={() => {
              translateX.value = withSpring(width + 100);
              setTimeout(() => nextCard('right'), 300);
            }}
          >
            <Ionicons name="checkmark" size={32} color="#10b981" />
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// STYLES
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' }, 
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 15 },
  backBtn: { padding: 5 },
  progressContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 20 },
  progressText: { color: '#cbd5e1', fontSize: 13, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  progressBarBg: { width: '100%', height: 6, backgroundColor: '#1e293b', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#4f46e5', borderRadius: 3 },
  cardArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  cardWrapper: { width: width * 0.85, height: height * 0.6, position: 'relative' },
  card: { position: 'absolute', width: '100%', height: '100%', backgroundColor: '#0f172a', borderRadius: 30, padding: 30, borderWidth: 1, borderColor: '#1e293b', shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10, alignItems: 'center', justifyContent: 'center' },
  cardFront: { backgroundColor: '#0f172a' },
  cardBack: { backgroundColor: '#1e1b4b', borderColor: '#312e81' }, 
  cardCategory: { position: 'absolute', top: 20, color: '#64748b', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2 },
  cardQuestion: { color: '#f8fafc', fontSize: 28, fontWeight: '800', textAlign: 'center', lineHeight: 40 },
  answerScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  cardAnswer: { color: '#c7d2fe', fontSize: 24, fontWeight: '600', textAlign: 'center', lineHeight: 36 },
  tapToFlipBtn: { position: 'absolute', bottom: 30, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  tapToFlipText: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
  swipeHintContainer: { position: 'absolute', bottom: 30, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  swipeHintText: { color: '#94a3b8', fontSize: 12, fontWeight: '800', marginHorizontal: 10, textTransform: 'uppercase' },
  overlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, borderRadius: 30, justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  overlayRight: { backgroundColor: 'rgba(16, 185, 129, 0.2)', borderWidth: 4, borderColor: '#10b981' },
  overlayLeft: { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderWidth: 4, borderColor: '#ef4444' },
  footerControls: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', paddingHorizontal: 40, paddingBottom: Platform.OS === 'ios' ? 40 : 20, paddingTop: 20 },
  actionBtn: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', borderWidth: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 },
  actionBtnLeft: { borderColor: '#ef4444' },
  actionBtnRight: { borderColor: '#10b981' },
  flipBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center', shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 10 },
  finishContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  finishIconBg: { backgroundColor: 'rgba(253, 224, 71, 0.1)', padding: 30, borderRadius: 60, marginBottom: 30 },
  finishTitle: { fontSize: 32, fontWeight: '900', color: '#f8fafc', marginBottom: 10 },
  finishSub: { fontSize: 16, color: '#94a3b8', fontWeight: '500', marginBottom: 40 },
  statsRow: { flexDirection: 'row', gap: 20, marginBottom: 50 },
  statBox: { width: 120, paddingVertical: 25, borderRadius: 20, alignItems: 'center', borderWidth: 1 },
  statNum: { fontSize: 36, fontWeight: '900', marginBottom: 5 },
  statLabel: { fontSize: 12, color: '#cbd5e1', fontWeight: '700', textTransform: 'uppercase' },
  claimBtn: { width: '100%', borderRadius: 20, overflow: 'hidden' },
  claimGradient: { paddingVertical: 18, alignItems: 'center' },
  claimText: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 }
});