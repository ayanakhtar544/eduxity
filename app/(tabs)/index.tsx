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
import * as Haptics from 'expo-haptics'; 
import Animated, { FadeInDown, Layout, useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolate, Extrapolation, SlideInLeft, SlideOutLeft, FadeIn, FadeOut } from 'react-native-reanimated';

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
// 🃏 INLINE FLASHCARD PLAYER
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
    return { transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }], backfaceVisibility: 'hidden', zIndex: flipAnim.value < 90 ? 1 : 0, opacity: flipAnim.value < 90 ? 1 : 0 };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipAnim.value, [0, 180], [180, 360], Extrapolation.CLAMP);
    return { transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }], backfaceVisibility: 'hidden', zIndex: flipAnim.value > 90 ? 1 : 0, opacity: flipAnim.value > 90 ? 1 : 0, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 };
  });

  const handleFlip = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsFlipped(!isFlipped); flipAnim.value = withTiming(isFlipped ? 0 : 180, { duration: 400 }); };
  const handleNext = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); if (currentIndex < cardsData.length - 1) { flipAnim.value = 0; setIsFlipped(false); setCurrentIndex(prev => prev + 1); } else { setIsFinished(true); } };
  const handleRestart = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); flipAnim.value = 0; setIsFlipped(false); setCurrentIndex(0); setIsFinished(false); };

  if (isFinished) {
    return (
      <View style={styles.inlineFlashcardContainer}>
        <View style={styles.flashcardFinish}>
          <Ionicons name="trophy" size={50} color="#fde047" />
          <Text style={styles.finishDeckTitle}>Deck Completed!</Text>
          <Text style={styles.finishDeckSub}>You revised {cardsData.length} cards.</Text>
          <TouchableOpacity style={styles.restartDeckBtn} onPress={handleRestart}><Ionicons name="refresh" size={16} color="#fff" /><Text style={styles.restartDeckText}>Revise Again</Text></TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.inlineFlashcardContainer}>
      <View style={styles.inlineFlashcardHeader}><Text style={styles.inlineFlashcardTitle} numberOfLines={1}>{title || 'Revision Deck'}</Text><Text style={styles.inlineFlashcardCount}>{currentIndex + 1} / {cardsData.length}</Text></View>
      <View style={styles.inlineCardArea}>
        <Animated.View style={[styles.inlineCard, styles.inlineCardFront, frontStyle]}><Text style={styles.inlineCardCategory}>Question</Text><ScrollView contentContainerStyle={styles.inlineScrollCenter}><Text style={styles.inlineCardQuestion}>{currentCard?.q}</Text></ScrollView><TouchableOpacity style={styles.inlineFlipBtn} onPress={handleFlip}><Ionicons name="refresh" size={16} color="#fff" style={{marginRight: 5}}/><Text style={styles.inlineFlipText}>Tap to see Answer</Text></TouchableOpacity></Animated.View>
        <Animated.View style={[styles.inlineCard, styles.inlineCardBack, backStyle]}><Text style={styles.inlineCardCategory}>Answer</Text><ScrollView contentContainerStyle={styles.inlineScrollCenter}><Text style={styles.inlineCardAnswer}>{currentCard?.a}</Text></ScrollView><View style={styles.inlineCardActions}><TouchableOpacity style={[styles.inlineActionBtn, {backgroundColor: '#ef4444'}]} onPress={handleNext}><Text style={styles.inlineActionText}>Forgot</Text></TouchableOpacity><TouchableOpacity style={[styles.inlineActionBtn, {backgroundColor: '#10b981'}]} onPress={handleNext}><Text style={styles.inlineActionText}>Knew It</Text></TouchableOpacity></View></Animated.View>
      </View>
    </View>
  );
};

// ==========================================
// 🎮 GAME 1: BRAIN MATCH (DYNAMIC POOL)
// ==========================================
const MASTER_PAIRS = [
  {pId: 'A', t1: "Force", t2: "M × A"}, {pId: 'B', t1: "Power", t2: "Work/Time"}, {pId: 'C', t1: "Ohm's Law", t2: "V = IR"},
  {pId: 'D', t1: "Kinetic Energy", t2: "½mv²"}, {pId: 'E', t1: "Water", t2: "H2O"}, {pId: 'F', t1: "Gravity", t2: "9.8 m/s²"},
  {pId: 'G', t1: "Speed of Light", t2: "3×10⁸ m/s"}, {pId: 'H', t1: "PI (π)", t2: "3.1415"}, {pId: 'I', t1: "Density", t2: "Mass/Vol"},
  {pId: 'J', t1: "Benzene", t2: "C6H6"}, {pId: 'K', t1: "Newton's 3rd", t2: "Action=Reaction"}, {pId: 'L', t1: "Current", t2: "Ampere"}
];

const MemoryCard = ({ item, isFlipped, isMatched, onPress }: any) => {
  const flipAnim = useSharedValue(0);
  useEffect(() => { flipAnim.value = withTiming(isFlipped || isMatched ? 180 : 0, { duration: 300 }); }, [isFlipped, isMatched]);
  const frontStyle = useAnimatedStyle(() => ({ transform: [{ perspective: 1000 }, { rotateY: `${interpolate(flipAnim.value, [0, 180], [0, 180], Extrapolation.CLAMP)}deg` }], zIndex: flipAnim.value < 90 ? 1 : 0, opacity: flipAnim.value < 90 ? 1 : 0 }));
  const backStyle = useAnimatedStyle(() => ({ transform: [{ perspective: 1000 }, { rotateY: `${interpolate(flipAnim.value, [0, 180], [180, 360], Extrapolation.CLAMP)}deg` }], zIndex: flipAnim.value > 90 ? 1 : 0, opacity: flipAnim.value > 90 ? 1 : 0, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }));
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.memCardContainer}>
      <Animated.View style={[styles.memCardFront, frontStyle]}><Ionicons name="help-outline" size={32} color="#4f46e5" /></Animated.View>
      <Animated.View style={[styles.memCardBack, isMatched && styles.memCardMatched, backStyle]}><Text style={styles.memCardText}>{item.text}</Text></Animated.View>
    </TouchableOpacity>
  );
};

const BrainMatchGame = () => {
  const [cards, setCards] = useState<any[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [won, setWon] = useState(false);

  const initGame = () => {
    const shuffledPairs = [...MASTER_PAIRS].sort(() => Math.random() - 0.5).slice(0, 3);
    let newCards: any[] = [];
    shuffledPairs.forEach((p, i) => {
      newCards.push({ id: `f_${i}`, pairId: p.pId, text: p.t1 });
      newCards.push({ id: `b_${i}`, pairId: p.pId, text: p.t2 });
    });
    setCards(newCards.sort(() => Math.random() - 0.5));
    setFlippedIndices([]); setMatchedIds([]); setWon(false);
  };
  useEffect(() => { initGame(); }, []);

  const handleTap = (index: number) => {
    if (flippedIndices.length === 2 || flippedIndices.includes(index) || matchedIds.includes(cards[index].pairId)) return;
    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);
    if (newFlipped.length === 2) {
      if (cards[newFlipped[0]].pairId === cards[newFlipped[1]].pairId) {
        setMatchedIds(prev => {
          const newMatches = [...prev, cards[newFlipped[0]].pairId];
          if (newMatches.length === 3) setTimeout(() => { setWon(true); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }, 500);
          return newMatches;
        });
        setFlippedIndices([]); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTimeout(() => setFlippedIndices([]), 800);
      }
    } else { Haptics.selectionAsync(); }
  };

  return (
    <Animated.View entering={FadeInDown.springify()} style={styles.gameCard}>
      <View style={styles.gameHeader}><View style={styles.gameTitleRow}><Ionicons name="game-controller" size={20} color="#ec4899" /><Text style={[styles.gameTitle, { color: '#ec4899' }]}>BRAIN MATCH</Text></View><Text style={styles.gameSubtitle}>Match the pairs! 🧠</Text></View>
      {!won ? (
        <View style={styles.memGrid}>{cards.map((card, index) => <MemoryCard key={index} item={card} isFlipped={flippedIndices.includes(index)} isMatched={matchedIds.includes(card.pairId)} onPress={() => handleTap(index)} />)}</View>
      ) : (
        <Animated.View entering={FadeInDown} style={styles.gameWinArea}><Ionicons name="trophy" size={60} color="#fde047" /><Text style={styles.gameWinTitle}>Mastermind! 🎓</Text><TouchableOpacity style={styles.claimBtnGame} onPress={initGame}><Text style={styles.claimBtnGameText}>Play Another Round</Text></TouchableOpacity></Animated.View>
      )}
    </Animated.View>
  );
};

// ==========================================
// 🧮 GAME 2: SPEED MATH (INFINITE DYNAMIC)
// ==========================================
const SpeedMathGame = () => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<number[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');

  const generateMathProblem = () => {
    const operators = ['+', '-', '*'];
    const op = operators[Math.floor(Math.random() * operators.length)];
    let num1 = Math.floor(Math.random() * 20) + 1;
    let num2 = Math.floor(Math.random() * 15) + 1;
    let ans = 0;
    if (op === '+') ans = num1 + num2;
    if (op === '-') { if (num2 > num1) { let temp = num1; num1 = num2; num2 = temp; } ans = num1 - num2; }
    if (op === '*') { num1 = Math.floor(Math.random() * 12) + 2; num2 = Math.floor(Math.random() * 12) + 2; ans = num1 * num2; }
    setQuestion(`${num1} ${op} ${num2} = ?`);
    setCorrectAnswer(ans);
    let opts = new Set<number>([ans]);
    while (opts.size < 4) {
      const offset = Math.floor(Math.random() * 10) - 5;
      if (offset !== 0 && ans + offset > 0) opts.add(ans + offset);
    }
    setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
    setGameState('playing');
  };
  useEffect(() => { generateMathProblem(); }, []);

  return (
    <Animated.View entering={FadeInDown.springify()} style={[styles.gameCard, { borderColor: '#38bdf8' }]}>
      <View style={styles.gameHeader}><View style={styles.gameTitleRow}><Ionicons name="calculator" size={20} color="#38bdf8" /><Text style={[styles.gameTitle, { color: '#38bdf8' }]}>SPEED MATH</Text></View><Text style={styles.gameSubtitle}>Solve it fast! ⚡</Text></View>
      {gameState === 'playing' ? (
        <View style={styles.mathArea}><Text style={styles.mathQuestion}>{question}</Text><View style={styles.mathGrid}>{options.map((opt, i) => (<TouchableOpacity key={i} style={styles.mathOptionBtn} onPress={() => { if(opt===correctAnswer){Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setGameState('won');}else{Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); setGameState('lost');} }}><Text style={styles.mathOptionText}>{opt}</Text></TouchableOpacity>))}</View></View>
      ) : (
        <View style={styles.gameWinArea}><Ionicons name={gameState === 'won' ? "checkmark-circle" : "close-circle"} size={60} color={gameState === 'won' ? "#10b981" : "#ef4444"} /><Text style={styles.gameWinTitle}>{gameState === 'won' ? "Quick Maffs! 🧠" : "Wrong Answer!"}</Text><TouchableOpacity style={[styles.claimBtnGame, { backgroundColor: '#38bdf8' }]} onPress={generateMathProblem}><Text style={styles.claimBtnGameText}>Next Question</Text></TouchableOpacity></View>
      )}
    </Animated.View>
  );
};

// ==========================================
// 🧪 GAME 3: GUESS THE ELEMENT 
// ==========================================
const PERIODIC_TABLE = [
  { sym: 'H', name: 'Hydrogen' }, { sym: 'He', name: 'Helium' }, { sym: 'Li', name: 'Lithium' }, { sym: 'C', name: 'Carbon' },
  { sym: 'N', name: 'Nitrogen' }, { sym: 'O', name: 'Oxygen' }, { sym: 'Na', name: 'Sodium' }, { sym: 'Mg', name: 'Magnesium' },
  { sym: 'Fe', name: 'Iron' }, { sym: 'Cu', name: 'Copper' }, { sym: 'Zn', name: 'Zinc' }, { sym: 'Ag', name: 'Silver' },
  { sym: 'Au', name: 'Gold' }, { sym: 'Hg', name: 'Mercury' }, { sym: 'Pb', name: 'Lead' }, { sym: 'K', name: 'Potassium' }
];

const GuessElementGame = () => {
  const [element, setElement] = useState(PERIODIC_TABLE[0]);
  const [options, setOptions] = useState<string[]>([]);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');

  const generateQuestion = () => {
    const correctObj = PERIODIC_TABLE[Math.floor(Math.random() * PERIODIC_TABLE.length)];
    setElement(correctObj);
    let opts = new Set<string>([correctObj.name]);
    while(opts.size < 4) { opts.add(PERIODIC_TABLE[Math.floor(Math.random() * PERIODIC_TABLE.length)].name); }
    setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
    setGameState('playing');
  };
  useEffect(() => { generateQuestion(); }, []);

  return (
    <Animated.View entering={FadeInDown.springify()} style={[styles.gameCard, { borderColor: '#10b981' }]}>
      <View style={styles.gameHeader}><View style={styles.gameTitleRow}><Ionicons name="flask" size={20} color="#10b981" /><Text style={[styles.gameTitle, { color: '#10b981' }]}>GUESS ELEMENT</Text></View><Text style={styles.gameSubtitle}>Identify the Symbol 🧪</Text></View>
      {gameState === 'playing' ? (
        <View style={styles.mathArea}><View style={styles.elementBox}><Text style={styles.elementSymbol}>{element.sym}</Text></View><View style={styles.mathGrid}>{options.map((opt, i) => (<TouchableOpacity key={i} style={[styles.mathOptionBtn, { borderColor: '#10b981' }]} onPress={() => { if(opt === element.name) setGameState('won'); else setGameState('lost'); }}><Text style={styles.mathOptionText}>{opt}</Text></TouchableOpacity>))}</View></View>
      ) : (
        <View style={styles.gameWinArea}><Ionicons name={gameState === 'won' ? "star" : "skull"} size={60} color={gameState === 'won' ? "#fde047" : "#ef4444"} /><Text style={styles.gameWinTitle}>{gameState === 'won' ? "Genius Chemist!" : "It was " + element.name}</Text><TouchableOpacity style={[styles.claimBtnGame, { backgroundColor: '#10b981' }]} onPress={generateQuestion}><Text style={styles.claimBtnGameText}>Play Again</Text></TouchableOpacity></View>
      )}
    </Animated.View>
  );
};

// ==========================================
// 📏 GAME 4: UNIT MASTER 
// ==========================================
const SI_UNITS = [
  { q: 'Force', u: 'Newton (N)' }, { q: 'Work / Energy', u: 'Joule (J)' }, { q: 'Power', u: 'Watt (W)' },
  { q: 'Pressure', u: 'Pascal (Pa)' }, { q: 'Electric Current', u: 'Ampere (A)' }, { q: 'Resistance', u: 'Ohm (Ω)' },
  { q: 'Capacitance', u: 'Farad (F)' }, { q: 'Inductance', u: 'Henry (H)' }, { q: 'Magnetic Flux', u: 'Weber (Wb)' },
  { q: 'Magnetic Field', u: 'Tesla (T)' }, { q: 'Frequency', u: 'Hertz (Hz)' }, { q: 'Luminous Intensity', u: 'Candela (cd)' }
];

const UnitMasterGame = () => {
  const [question, setQuestion] = useState(SI_UNITS[0]);
  const [options, setOptions] = useState<string[]>([]);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');

  const generateQuestion = () => {
    const correctObj = SI_UNITS[Math.floor(Math.random() * SI_UNITS.length)];
    setQuestion(correctObj);
    let opts = new Set<string>([correctObj.u]);
    while(opts.size < 4) { opts.add(SI_UNITS[Math.floor(Math.random() * SI_UNITS.length)].u); }
    setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
    setGameState('playing');
  };
  useEffect(() => { generateQuestion(); }, []);

  return (
    <Animated.View entering={FadeInDown.springify()} style={[styles.gameCard, { borderColor: '#a855f7' }]}>
      <View style={styles.gameHeader}><View style={styles.gameTitleRow}><Ionicons name="speedometer" size={20} color="#a855f7" /><Text style={[styles.gameTitle, { color: '#a855f7' }]}>UNIT MASTER</Text></View><Text style={styles.gameSubtitle}>Find the SI Unit 📏</Text></View>
      {gameState === 'playing' ? (
        <View style={styles.mathArea}><Text style={styles.unitQuestion}>What is the SI unit of{"\n"}<Text style={{color: '#a855f7'}}>{question.q}</Text>?</Text><View style={styles.mathGrid}>{options.map((opt, i) => (<TouchableOpacity key={i} style={[styles.mathOptionBtn, { borderColor: '#a855f7' }]} onPress={() => { if(opt === question.u) setGameState('won'); else setGameState('lost'); }}><Text style={styles.mathOptionText}>{opt}</Text></TouchableOpacity>))}</View></View>
      ) : (
        <View style={styles.gameWinArea}><Ionicons name={gameState === 'won' ? "medal" : "close-circle"} size={60} color={gameState === 'won' ? "#a855f7" : "#ef4444"} /><Text style={styles.gameWinTitle}>{gameState === 'won' ? "Physics Pro!" : `Answer: ${question.u}`}</Text><TouchableOpacity style={[styles.claimBtnGame, { backgroundColor: '#a855f7' }]} onPress={generateQuestion}><Text style={styles.claimBtnGameText}>Next Question</Text></TouchableOpacity></View>
      )}
    </Animated.View>
  );
};

// ==========================================
// 🔢 GAME 5: SERIES SOLVER
// ==========================================
const SeriesSolverGame = () => {
  const [series, setSeries] = useState("");
  const [options, setOptions] = useState<number[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');

  const generateSeries = () => {
    const type = Math.random();
    let arr = [];
    let ans = 0;
    
    if (type < 0.4) { // AP
      const start = Math.floor(Math.random() * 10) + 1;
      const diff = Math.floor(Math.random() * 5) + 2;
      arr = [start, start+diff, start+diff*2, start+diff*3];
      ans = start+diff*4;
    } else if (type < 0.8) { // Squares
      const start = Math.floor(Math.random() * 5) + 2;
      arr = [start*start, (start+1)*(start+1), (start+2)*(start+2), (start+3)*(start+3)];
      ans = (start+4)*(start+4);
    } else { // GP
      const start = Math.floor(Math.random() * 3) + 2;
      const ratio = 2;
      arr = [start, start*ratio, start*ratio*ratio, start*ratio*ratio*ratio];
      ans = start*ratio*ratio*ratio*ratio;
    }

    setSeries(`${arr.join(', ')}, ?`);
    setCorrectAnswer(ans);

    let opts = new Set<number>([ans]);
    while(opts.size < 4) {
      const fakeAns = ans + (Math.floor(Math.random() * 10) - 5);
      if (fakeAns !== ans && fakeAns > 0) opts.add(fakeAns);
    }
    setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
    setGameState('playing');
  };
  useEffect(() => { generateSeries(); }, []);

  return (
    <Animated.View entering={FadeInDown.springify()} style={[styles.gameCard, { borderColor: '#f97316' }]}>
      <View style={styles.gameHeader}><View style={styles.gameTitleRow}><Ionicons name="analytics" size={20} color="#f97316" /><Text style={[styles.gameTitle, { color: '#f97316' }]}>SERIES SOLVER</Text></View><Text style={styles.gameSubtitle}>Find the next number 🔢</Text></View>
      {gameState === 'playing' ? (
        <View style={styles.mathArea}><Text style={[styles.mathQuestion, {color: '#f97316'}]}>{series}</Text><View style={styles.mathGrid}>{options.map((opt, i) => (<TouchableOpacity key={i} style={[styles.mathOptionBtn, { borderColor: '#f97316' }]} onPress={() => { if(opt === correctAnswer) setGameState('won'); else setGameState('lost'); }}><Text style={styles.mathOptionText}>{opt}</Text></TouchableOpacity>))}</View></View>
      ) : (
        <View style={styles.gameWinArea}><Ionicons name={gameState === 'won' ? "bulb" : "alert-circle"} size={60} color={gameState === 'won' ? "#fde047" : "#ef4444"} /><Text style={styles.gameWinTitle}>{gameState === 'won' ? "Big Brain!" : `Answer: ${correctAnswer}`}</Text><TouchableOpacity style={[styles.claimBtnGame, { backgroundColor: '#f97316' }]} onPress={generateSeries}><Text style={styles.claimBtnGameText}>Play Again</Text></TouchableOpacity></View>
      )}
    </Animated.View>
  );
};

// ==========================================
// 🔠 GAME 6: SCIENCE SCRAMBLE
// ==========================================
const SCIENCE_WORDS = ["KINEMATICS", "GRAVITATION", "FRICTION", "MOMENTUM", "ELECTRON", "PROTON", "ISOTOPE", "TITRATION", "POLYGON", "CALCULUS", "ALGEBRA", "GENETICS", "BOTANY"];

const WordScrambleGame = () => {
  const [scrambled, setScrambled] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');

  const generateScramble = () => {
    const word = SCIENCE_WORDS[Math.floor(Math.random() * SCIENCE_WORDS.length)];
    setCorrectAnswer(word);
    let arr = word.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setScrambled(arr.join(' '));

    let opts = new Set<string>([word]);
    while(opts.size < 4) { opts.add(SCIENCE_WORDS[Math.floor(Math.random() * SCIENCE_WORDS.length)]); }
    setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
    setGameState('playing');
  };
  useEffect(() => { generateScramble(); }, []);

  return (
    <Animated.View entering={FadeInDown.springify()} style={[styles.gameCard, { borderColor: '#f43f5e' }]}>
      <View style={styles.gameHeader}><View style={styles.gameTitleRow}><Ionicons name="text" size={20} color="#f43f5e" /><Text style={[styles.gameTitle, { color: '#f43f5e' }]}>SCIENCE SCRAMBLE</Text></View><Text style={styles.gameSubtitle}>Unjumble the word 🔠</Text></View>
      {gameState === 'playing' ? (
        <View style={styles.mathArea}><Text style={[styles.mathQuestion, {fontSize: 28, color: '#f43f5e'}]}>{scrambled}</Text><View style={styles.mathGrid}>{options.map((opt, i) => (<TouchableOpacity key={i} style={[styles.mathOptionBtn, { borderColor: '#f43f5e', paddingVertical: 12 }]} onPress={() => { if(opt === correctAnswer) setGameState('won'); else setGameState('lost'); }}><Text style={[styles.mathOptionText, {fontSize: 14}]}>{opt}</Text></TouchableOpacity>))}</View></View>
      ) : (
        <View style={styles.gameWinArea}><Ionicons name={gameState === 'won' ? "ribbon" : "close"} size={60} color={gameState === 'won' ? "#fde047" : "#ef4444"} /><Text style={styles.gameWinTitle}>{gameState === 'won' ? "Vocab King!" : `Answer: ${correctAnswer}`}</Text><TouchableOpacity style={[styles.claimBtnGame, { backgroundColor: '#f43f5e' }]} onPress={generateScramble}><Text style={styles.claimBtnGameText}>Next Word</Text></TouchableOpacity></View>
      )}
    </Animated.View>
  );
};

// ==========================================
// ⚖️ GAME 7: EQUATION BALANCER (NEW)
// ==========================================
const EquationBalancerGame = () => {
  const [equation, setEquation] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');

  const generateEquation = () => {
    const ops = ['+', '-', '*'];
    const op1 = ops[Math.floor(Math.random() * ops.length)];
    const op2 = ops[Math.floor(Math.random() * ops.length)];
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    const n3 = Math.floor(Math.random() * 10) + 1;

    // Use JS eval safely since we control the string
    let result = eval(`${n1} ${op1} ${n2} ${op2} ${n3}`);

    setEquation(`${n1} _ ${n2} _ ${n3} = ${result}`);
    setCorrectAnswer(`${op1}, ${op2}`);

    let opts = new Set<string>([`${op1}, ${op2}`]);
    while(opts.size < 4) {
      opts.add(`${ops[Math.floor(Math.random() * ops.length)]}, ${ops[Math.floor(Math.random() * ops.length)]}`);
    }
    setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
    setGameState('playing');
  };
  useEffect(() => { generateEquation(); }, []);

  return (
    <Animated.View entering={FadeInDown.springify()} style={[styles.gameCard, { borderColor: '#8b5cf6' }]}>
      <View style={styles.gameHeader}><View style={styles.gameTitleRow}><Ionicons name="git-compare" size={20} color="#8b5cf6" /><Text style={[styles.gameTitle, { color: '#8b5cf6' }]}>EQUATION BALANCER</Text></View><Text style={styles.gameSubtitle}>Find the missing signs ⚖️</Text></View>
      {gameState === 'playing' ? (
        <View style={styles.mathArea}><Text style={[styles.mathQuestion, {color: '#8b5cf6', fontSize: 28}]}>{equation}</Text><View style={styles.mathGrid}>{options.map((opt, i) => (<TouchableOpacity key={i} style={[styles.mathOptionBtn, { borderColor: '#8b5cf6' }]} onPress={() => { if(opt === correctAnswer) setGameState('won'); else setGameState('lost'); }}><Text style={styles.mathOptionText}>{opt}</Text></TouchableOpacity>))}</View></View>
      ) : (
        <View style={styles.gameWinArea}><Ionicons name={gameState === 'won' ? "shield-checkmark" : "skull"} size={60} color={gameState === 'won' ? "#10b981" : "#ef4444"} /><Text style={styles.gameWinTitle}>{gameState === 'won' ? "Balanced!" : `Answer: ${correctAnswer}`}</Text><TouchableOpacity style={[styles.claimBtnGame, { backgroundColor: '#8b5cf6' }]} onPress={generateEquation}><Text style={styles.claimBtnGameText}>Play Again</Text></TouchableOpacity></View>
      )}
    </Animated.View>
  );
};

// ==========================================
// 🧭 GAME 8: PHYSICS VECTOR DASH (NEW)
// ==========================================
const VectorDashGame = () => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<number[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');

  const generateVector = () => {
    const f1 = Math.floor(Math.random() * 20) + 5;
    const f2 = Math.floor(Math.random() * 20) + 5;
    const direction = Math.random() > 0.5 ? 'Same' : 'Opposite';
    
    let ans = 0;
    if (direction === 'Same') {
      setQuestion(`${f1}N Right & ${f2}N Right`);
      ans = f1 + f2;
    } else {
      setQuestion(`${f1}N Right & ${f2}N Left`);
      ans = Math.abs(f1 - f2);
    }

    setCorrectAnswer(ans);
    let opts = new Set<number>([ans]);
    while(opts.size < 4) {
      let fake = ans + (Math.floor(Math.random() * 10) - 5);
      if (fake !== ans && fake >= 0) opts.add(fake);
    }
    setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
    setGameState('playing');
  };
  useEffect(() => { generateVector(); }, []);

  return (
    <Animated.View entering={FadeInDown.springify()} style={[styles.gameCard, { borderColor: '#14b8a6' }]}>
      <View style={styles.gameHeader}><View style={styles.gameTitleRow}><Ionicons name="compass" size={20} color="#14b8a6" /><Text style={[styles.gameTitle, { color: '#14b8a6' }]}>VECTOR DASH</Text></View><Text style={styles.gameSubtitle}>Net Force? 🧭</Text></View>
      {gameState === 'playing' ? (
        <View style={styles.mathArea}><Text style={[styles.mathQuestion, {color: '#14b8a6', fontSize: 24}]}>{question}</Text><View style={styles.mathGrid}>{options.map((opt, i) => (<TouchableOpacity key={i} style={[styles.mathOptionBtn, { borderColor: '#14b8a6' }]} onPress={() => { if(opt === correctAnswer) setGameState('won'); else setGameState('lost'); }}><Text style={styles.mathOptionText}>{opt} N</Text></TouchableOpacity>))}</View></View>
      ) : (
        <View style={styles.gameWinArea}><Ionicons name={gameState === 'won' ? "flash" : "close"} size={60} color={gameState === 'won' ? "#fde047" : "#ef4444"} /><Text style={styles.gameWinTitle}>{gameState === 'won' ? "Force Master!" : `Answer: ${correctAnswer}N`}</Text><TouchableOpacity style={[styles.claimBtnGame, { backgroundColor: '#14b8a6' }]} onPress={generateVector}><Text style={styles.claimBtnGameText}>Next Question</Text></TouchableOpacity></View>
      )}
    </Animated.View>
  );
};

// ==========================================
// 🧬 GAME 9: BIOLOGY T/F (TIME ATTACK) (NEW)
// ==========================================
const BIO_FACTS = [
  { q: "Mitochondria is the powerhouse of the cell.", ans: true },
  { q: "Humans have 24 pairs of chromosomes.", ans: false }, // 23 pairs
  { q: "DNA contains Uracil.", ans: false }, // RNA contains Uracil
  { q: "Arteries carry oxygenated blood.", ans: true }, // Except pulmonary artery
  { q: "Photosynthesis occurs in mitochondria.", ans: false }, // Chloroplast
  { q: "White blood cells fight infections.", ans: true }
];

const BioTimeAttackGame = () => {
  const [question, setQuestion] = useState(BIO_FACTS[0]);
  const [timeLeft, setTimeLeft] = useState(5);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');

  const startGame = () => {
    setQuestion(BIO_FACTS[Math.floor(Math.random() * BIO_FACTS.length)]);
    setTimeLeft(5);
    setGameState('playing');
  };
  useEffect(() => { startGame(); }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;
    if (timeLeft <= 0) { setGameState('lost'); return; }
    const timer = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, gameState]);

  return (
    <Animated.View entering={FadeInDown.springify()} style={[styles.gameCard, { borderColor: '#22c55e' }]}>
      <View style={styles.gameHeader}>
        <View style={styles.gameTitleRow}><Ionicons name="leaf" size={20} color="#22c55e" /><Text style={[styles.gameTitle, { color: '#22c55e' }]}>BIO TIME ATTACK</Text></View>
        <Text style={[styles.gameSubtitle, {color: timeLeft <= 2 ? '#ef4444' : '#fff', fontWeight: '900'}]}>00:0{timeLeft}</Text>
      </View>
      {gameState === 'playing' ? (
        <View style={styles.mathArea}><Text style={[styles.unitQuestion, {color: '#f8fafc', fontSize: 18}]}>"{question.q}"</Text><View style={[styles.mathGrid, {marginTop: 10}]}><TouchableOpacity style={[styles.mathOptionBtn, { borderColor: '#ef4444' }]} onPress={() => { if(false === question.ans) setGameState('won'); else setGameState('lost'); }}><Text style={[styles.mathOptionText, {color: '#ef4444'}]}>False</Text></TouchableOpacity><TouchableOpacity style={[styles.mathOptionBtn, { borderColor: '#10b981' }]} onPress={() => { if(true === question.ans) setGameState('won'); else setGameState('lost'); }}><Text style={[styles.mathOptionText, {color: '#10b981'}]}>True</Text></TouchableOpacity></View></View>
      ) : (
        <View style={styles.gameWinArea}><Ionicons name={gameState === 'won' ? "happy" : "sad"} size={60} color={gameState === 'won' ? "#10b981" : "#ef4444"} /><Text style={styles.gameWinTitle}>{gameState === 'won' ? "Sharp Memory!" : "Too slow/Wrong!"}</Text><TouchableOpacity style={[styles.claimBtnGame, { backgroundColor: '#22c55e' }]} onPress={startGame}><Text style={styles.claimBtnGameText}>Play Again</Text></TouchableOpacity></View>
      )}
    </Animated.View>
  );
};

// ==========================================
// 💻 GAME 10: CODE BUG HUNTER (NEW)
// ==========================================
const CODE_SNIPPETS = [
  { code: "const name = 'John'\nconsole.log(name)", bug: "Missing Semicolon", ans: "Missing Semicolon" },
  { code: "if (x = 10) {\n  return true;\n}", bug: "Used = instead of ==", ans: "Assignment in IF" },
  { code: "let arr = [1,2,3];\nconsole.log(arr[3]);", bug: "Out of bounds", ans: "Index Out of Bounds" },
  { code: "const add = (a, b) => a + b;\nadd(5);", bug: "Missing Argument", ans: "Missing Argument" },
];

const BugHunterGame = () => {
  const [question, setQuestion] = useState(CODE_SNIPPETS[0]);
  const [options, setOptions] = useState<string[]>([]);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');

  const generateQuestion = () => {
    const correctObj = CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)];
    setQuestion(correctObj);
    let opts = new Set<string>([correctObj.ans]);
    while(opts.size < 4) { opts.add(CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)].ans); }
    setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
    setGameState('playing');
  };
  useEffect(() => { generateQuestion(); }, []);

  return (
    <Animated.View entering={FadeInDown.springify()} style={[styles.gameCard, { borderColor: '#6366f1' }]}>
      <View style={styles.gameHeader}><View style={styles.gameTitleRow}><Ionicons name="bug" size={20} color="#6366f1" /><Text style={[styles.gameTitle, { color: '#6366f1' }]}>BUG HUNTER</Text></View><Text style={styles.gameSubtitle}>Find the Error 💻</Text></View>
      {gameState === 'playing' ? (
        <View style={styles.mathArea}><View style={styles.codeBlockGame}><Text style={styles.codeBlockGameText}>{question.code}</Text></View><View style={styles.mathGrid}>{options.map((opt, i) => (<TouchableOpacity key={i} style={[styles.mathOptionBtn, { borderColor: '#6366f1', paddingVertical: 10 }]} onPress={() => { if(opt === question.ans) setGameState('won'); else setGameState('lost'); }}><Text style={[styles.mathOptionText, {fontSize: 13}]}>{opt}</Text></TouchableOpacity>))}</View></View>
      ) : (
        <View style={styles.gameWinArea}><Ionicons name={gameState === 'won' ? "terminal" : "skull"} size={60} color={gameState === 'won' ? "#10b981" : "#ef4444"} /><Text style={styles.gameWinTitle}>{gameState === 'won' ? "Senior Dev!" : `Bug: ${question.ans}`}</Text><TouchableOpacity style={[styles.claimBtnGame, { backgroundColor: '#6366f1' }]} onPress={generateQuestion}><Text style={styles.claimBtnGameText}>Next Bug</Text></TouchableOpacity></View>
      )}
    </Animated.View>
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
    try { await addDoc(collection(db, 'notifications'), { recipientId: item.authorId, senderId: currentUid, senderName: auth.currentUser?.displayName || 'User', senderAvatar: auth.currentUser?.photoURL || '', type: 'like', postId: item.id, isRead: false, createdAt: serverTimestamp() }); } catch (error) {}
  };

  const handleLike = async () => {
    if (!currentUid) return;
    likeScale.value = withSpring(0.7, {}, () => { likeScale.value = withSpring(1); });
    try {
      const postRef = doc(db, 'posts', item.id);
      if (isLiked) { await updateDoc(postRef, { likes: arrayRemove(currentUid) }); } 
      else { await updateDoc(postRef, { likes: arrayUnion(currentUid) }); await sendNotification(); if (item.authorId !== currentUid) { await processAction(item.authorId, 'RECEIVE_LIKE'); } }
    } catch (error) {}
  };

  const handleSave = async () => {
    if (!currentUid) return;
    saveScale.value = withSpring(0.7, {}, () => { saveScale.value = withSpring(1); });
    try {
      const postRef = doc(db, 'posts', item.id);
      if (isSaved) await updateDoc(postRef, { savedBy: arrayRemove(currentUid) });
      else await updateDoc(postRef, { savedBy: arrayUnion(currentUid) });
    } catch (error) {}
  };

  const handleDeletePost = async () => {
    if (Platform.OS === 'web') { if (window.confirm("Are you sure?")) { try { await deleteDoc(doc(db, 'posts', item.id)); } catch (error) {} } } 
    else { Alert.alert("Delete Post?", "Are you sure?", [ { text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: async () => { try { await deleteDoc(doc(db, 'posts', item.id)); } catch (error) {} } } ]); }
  };

  const handleVote = async (optIndex: number) => {
    if (hasVoted || !currentUid) return; 
    try {
      const postRef = doc(db, 'posts', item.id);
      const updatedPollOptions = [...item.pollOptions];
      updatedPollOptions[optIndex].votes += 1;
      await updateDoc(postRef, { pollOptions: updatedPollOptions, totalVotes: (item.totalVotes || 0) + 1, [`voters.${currentUid}`]: optIndex });
      await processAction(currentUid, 'POLL_ANSWER');
    } catch (error) {}
  };

  const animatedLikeStyle = useAnimatedStyle(() => ({ transform: [{ scale: likeScale.value }] }));
  const animatedSaveStyle = useAnimatedStyle(() => ({ transform: [{ scale: saveScale.value }] }));

  return (
    <Animated.View entering={FadeInDown.duration(400).springify()} layout={Layout.springify()} style={styles.postCard}>
      {item.algoReason && (<View style={styles.algoReasonBar}><Ionicons name="sparkles" size={14} color="#6366f1" /><Text style={styles.algoReasonText}>{item.algoReason}</Text></View>)}
      <View style={styles.postHeader}>
        <TouchableOpacity onPress={() => router.push(`/user/${item.authorId}`)}><Image source={{ uri: item.authorAvatar || DEFAULT_AVATAR }} style={styles.avatar} /></TouchableOpacity>
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
          {item.authorId === currentUid ? (<TouchableOpacity style={styles.deleteBtn} onPress={handleDeletePost}><Ionicons name="trash-outline" size={18} color="#ef4444" /></TouchableOpacity>) : (<TouchableOpacity style={styles.moreBtn}><Ionicons name="ellipsis-horizontal" size={20} color="#94a3b8" /></TouchableOpacity>)}
        </View>
      </View>

      {item.text ? <Text style={styles.postText}>{item.text}</Text> : null}
      {item.type === 'flashcard' && item.cardsData && (<InlineFlashcardPlayer cardsData={item.cardsData} title={item.title} />)}
      {item.tags && item.tags.length > 0 && (<View style={styles.tagsContainer}>{item.tags.map((tag: string, idx: number) => (<View key={idx} style={styles.tagPill}><Text style={styles.tagText}>#{tag}</Text></View>))}</View>)}
      {item.type === 'image' && item.imageUrl ? (<View style={styles.imageContainer}><Image source={{ uri: item.imageUrl }} style={styles.postImage} resizeMode="cover" /></View>) : null}
      {item.type === 'code' && item.codeSnippet ? (<View style={styles.codeBlockContainer}><View style={styles.macWindowHeader}><View style={styles.macDots}><View style={[styles.macDot, { backgroundColor: '#ff5f56' }]} /><View style={[styles.macDot, { backgroundColor: '#ffbd2e' }]} /><View style={[styles.macDot, { backgroundColor: '#27c93f' }]} /></View><Text style={styles.codeLanguage}>{item.language || 'Code'}</Text></View><Text style={styles.codeText}>{item.codeSnippet}</Text></View>) : null}

      {item.type === 'poll' && item.pollOptions ? (
        <View style={styles.pollContainer}>
          <View style={styles.pollHeader}><View style={[styles.liveIndicator, item.pollMode === 'quiz' && { backgroundColor: '#8b5cf6' }]} /><Text style={[styles.liveText, item.pollMode === 'quiz' && { color: '#8b5cf6' }]}>{item.pollMode === 'quiz' ? 'LIVE QUIZ' : 'LIVE POLL'}</Text></View>
          {item.pollOptions.map((opt: any, idx: number) => {
            const totalVotes = item.totalVotes || 0; 
            const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
            let barColor = '#e0f2fe'; let textColor = '#0f172a';
            if (hasVoted) { if (idx === userVoteIndex) { barColor = '#bae6fd'; textColor = '#0369a1'; } }
            if (hasVoted) {
              return (<View key={idx} style={[styles.pollOptionResult, idx === userVoteIndex && { borderWidth: 1, borderColor: '#3b82f6' }]}><Animated.View style={[styles.pollFill, { width: `${percentage}%`, backgroundColor: barColor }]} /><View style={styles.pollContent}><View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}><Text style={[styles.pollOptionText, { color: textColor }]}>{opt.text}</Text></View><Text style={[styles.pollPercentage, { color: textColor }]}>{percentage}%</Text></View></View>);
            } else { return (<TouchableOpacity key={idx} style={styles.pollOptionBtn} activeOpacity={0.7} onPress={() => handleVote(idx)}><Text style={styles.pollOptionBtnText}>{opt.text}</Text></TouchableOpacity>); }
          })}
          <Text style={styles.pollTotalVotes}>{item.totalVotes || 0} votes {hasVoted ? '• Results visible' : ''}</Text>
        </View>
      ) : null}

      {item.type === 'resource' && (
        <View style={styles.resourceContainer}>
          <View style={styles.resourceHeader}><View style={styles.resourceIcon}><Ionicons name="document-text" size={22} color="#4f46e5" /></View><View style={{ flex: 1, marginLeft: 12 }}><Text style={styles.resourceTitle} numberOfLines={1}>{item.title || 'Study Material'}</Text><Text style={styles.resourceSub}>{item.fileUrl ? 'Drive Document' : 'AI Smart Notes'}</Text></View>{item.fileUrl && (<TouchableOpacity style={styles.downloadBtn} onPress={() => Linking.openURL(item.fileUrl)}><Ionicons name="cloud-download" size={16} color="#fff" /><Text style={styles.downloadText}>Save</Text></TouchableOpacity>)}</View>
          {item.fileUrl && item.fileUrl.includes('drive.google.com') ? (<View style={styles.pdfPreviewBox}>{Platform.OS === 'web' ? ( <iframe src={item.fileUrl.replace(/\/view.*$/, '/preview')} style={{ width: '100%', height: '100%', border: 'none' }} title="PDF Preview" /> ) : ( <WebView source={{ uri: item.fileUrl.replace(/\/view.*$/, '/preview') }} style={{ flex: 1 }} startInLoadingState={true} renderLoading={() => <View style={styles.loaderCenter}><ActivityIndicator size="small" color="#4f46e5" /></View>} /> )}</View>) : item.structuredText ? (<TouchableOpacity style={styles.smartNotePreview} onPress={() => router.push(`/resources/view/${item.id}`)} activeOpacity={0.8}><Ionicons name="scan-circle" size={40} color="#ec4899" /><Text style={styles.smartNoteText}>Read AI Smart Notes</Text></TouchableOpacity>) : null}
        </View>
      )}

      <View style={styles.actionBar}>
        <View style={styles.actionLeft}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.7}><Animated.View style={animatedLikeStyle}><Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? "#ef4444" : "#475569"} /></Animated.View><Text style={[styles.actionText, isLiked && { color: '#ef4444', fontWeight: '700' }]}>{item.likes?.length || 0}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={() => router.push(`/post/${item.id}`)}><Ionicons name="chatbubble-outline" size={22} color="#475569" /><Text style={styles.actionText}>{item.commentsCount || 0}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}><Ionicons name="share-social-outline" size={22} color="#475569" /></TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleSave} activeOpacity={0.7} style={styles.saveBtn}><Animated.View style={animatedSaveStyle}><Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={24} color={isSaved ? "#4f46e5" : "#475569"} /></Animated.View></TouchableOpacity>
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

  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    const unsub = onSnapshot(query(collection(db, 'notifications'), where('recipientId', '==', currentUid), where('isRead', '==', false)), (snapshot) => { setUnreadCount(snapshot.docs.length); });
    return () => unsub();
  }, [currentUid]);

  useEffect(() => { if (currentUid) registerForPushNotificationsAsync(currentUid); }, [currentUid]);

  useEffect(() => {
    if (!currentUid) return;
    const fetchMyData = async () => { const docSnap = await getDoc(doc(db, 'users', currentUid)); if (docSnap.exists()) setCurrentUserData(docSnap.data()); };
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
    const unsubPosts = onSnapshot(query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(100)), (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false); setRefreshing(false);
    });

    const unsubStories = onSnapshot(query(collection(db, 'stories'), orderBy('createdAt', 'desc'), limit(30)), (snapshot) => {
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

    // 🎮 INJECT ALL 10 RANDOM GAMES AT DIFFERENT POSITIONS
    if (smartPosts.length >= 2) smartPosts.splice(1, 0, { id: 'game_brain_match_1', type: 'game_brain_match' });
    if (smartPosts.length >= 5) smartPosts.splice(4, 0, { id: 'game_speed_math_1', type: 'game_speed_math' });
    if (smartPosts.length >= 8) smartPosts.splice(7, 0, { id: 'game_unit_master_1', type: 'game_unit_master' });
    if (smartPosts.length >= 11) smartPosts.splice(10, 0, { id: 'game_guess_element_1', type: 'game_guess_element' });
    if (smartPosts.length >= 14) smartPosts.splice(13, 0, { id: 'game_series_solver_1', type: 'game_series_solver' });
    if (smartPosts.length >= 17) smartPosts.splice(16, 0, { id: 'game_word_scramble_1', type: 'game_word_scramble' });
    if (smartPosts.length >= 20) smartPosts.splice(19, 0, { id: 'game_equation_balancer_1', type: 'game_equation_balancer' });
    if (smartPosts.length >= 23) smartPosts.splice(22, 0, { id: 'game_vector_dash_1', type: 'game_vector_dash' });
    if (smartPosts.length >= 26) smartPosts.splice(25, 0, { id: 'game_bio_time_1', type: 'game_bio_time' });
    if (smartPosts.length >= 29) smartPosts.splice(28, 0, { id: 'game_bug_hunter_1', type: 'game_bug_hunter' });
    
    setAlgoPosts(smartPosts);
  }, [posts, currentUserData, myFriends]);

  const onRefresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); };
  const filteredPosts = selectedCategory === 'All' ? algoPosts : algoPosts.filter(post => post.category === selectedCategory);

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.storiesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15 }}>
          <TouchableOpacity style={styles.storyWrapper} activeOpacity={0.8} onPress={() => !myStory && router.push('/create-story')}><View style={[styles.storyRing, { borderColor: myStory ? '#ec4899' : '#e2e8f0' }]}><Image source={{ uri: auth.currentUser?.photoURL || DEFAULT_AVATAR }} style={styles.storyAvatar} /></View>{!myStory && <View style={styles.addStoryBadge}><Ionicons name="add" size={14} color="#fff" /></View>}<Text style={styles.storyName}>Your Story</Text></TouchableOpacity>
          {otherStories.map((story) => (<TouchableOpacity key={story.id} style={styles.storyWrapper} activeOpacity={0.8}><View style={[styles.storyRing, { borderColor: '#4f46e5' }]}><Image source={{ uri: story.authorAvatar || DEFAULT_AVATAR }} style={styles.storyAvatar} /></View><Text style={styles.storyName} numberOfLines={1}>{story.authorName}</Text></TouchableOpacity>))}
        </ScrollView>
      </View>
      <View style={styles.createPostContainer}>
        <View style={styles.createInputRow}><Image source={{ uri: auth.currentUser?.photoURL || DEFAULT_AVATAR }} style={styles.createAvatar} /><TouchableOpacity style={styles.fakeInput} onPress={() => router.push('/create-post')} activeOpacity={0.9}><Text style={styles.fakeInputText}>What's on your mind?{"\n"}Share a doubt, tip, or achievement...</Text></TouchableOpacity></View>
        <View style={styles.createActionsRow}>
          <TouchableOpacity style={styles.createActionBtn} onPress={() => router.push({ pathname: '/create-post', params: { type: 'image' } })}><Ionicons name="camera" size={20} color="#10b981" /><Text style={styles.createActionText}>Media</Text></TouchableOpacity>
          <TouchableOpacity style={styles.createActionBtn} onPress={() => router.push({ pathname: '/create-post', params: { type: 'poll' } })}><Ionicons name="stats-chart" size={18} color="#3b82f6" /><Text style={styles.createActionText}>Poll</Text></TouchableOpacity>
          <TouchableOpacity style={styles.createActionBtn} onPress={() => router.push({ pathname: '/create-post', params: { type: 'flashcard' } })}><Ionicons name="layers" size={18} color="#ec4899" /><Text style={styles.createActionText}>Deck</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  );

 return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* 🍔 THE PREMIUM SLIDE-OUT MENU OVERLAY */}
      {isMenuOpen && (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.menuOverlay}>
          <TouchableOpacity style={styles.menuBackdrop} activeOpacity={1} onPress={() => setIsMenuOpen(false)} />
          
          <Animated.View entering={SlideInLeft.springify().damping(15)} exiting={SlideOutLeft.duration(200)} style={styles.menuDrawer}>
            
            <View style={styles.menuDrawerHeader}>
              <Image source={{ uri: auth.currentUser?.photoURL || DEFAULT_AVATAR }} style={styles.menuAvatar} />
              <View style={{flex: 1, marginLeft: 12}}>
                <Text style={styles.menuUserName} numberOfLines={1}>{auth.currentUser?.displayName || 'Scholar'}</Text>
                <Text style={styles.menuUserSub}>Ready to grind? 🔥</Text>
              </View>
              <TouchableOpacity onPress={() => setIsMenuOpen(false)} style={styles.menuCloseBtn}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <ScrollView contentContainerStyle={styles.menuScroll}>
              <Text style={styles.menuSectionTitle}>EXPLORE</Text>

              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuOpen(false); router.push('/resources'); }}>
                <View style={[styles.menuIconBg, { backgroundColor: '#eef2ff' }]}><Ionicons name="book" size={20} color="#4f46e5" /></View>
                <Text style={styles.menuItemText}>Study Resources</Text>
              </TouchableOpacity>

              {/* 👉 NEW: LIVE GRIND ROOM BUTTON */}
              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuOpen(false); router.push('/grind'); }}>
                <View style={[styles.menuIconBg, { backgroundColor: '#ecfdf5' }]}><Ionicons name="timer" size={20} color="#10b981" /></View>
                <Text style={styles.menuItemText}>Live Grind Room 🔥</Text>
              </TouchableOpacity>

              {/* 👉 NEW: DOUBT HUB BUTTON */}
              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuOpen(false); router.push('/doubts'); }}>
                <View style={[styles.menuIconBg, { backgroundColor: '#e0e7ff' }]}><Ionicons name="help-buoy" size={20} color="#4f46e5" /></View>
                <Text style={styles.menuItemText}>Doubt Hub ❓</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuOpen(false); router.push('/network'); }}>
                <View style={[styles.menuIconBg, { backgroundColor: '#f0fdf4' }]}><Ionicons name="people" size={20} color="#10b981" /></View>
                <Text style={styles.menuItemText}>My Network</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuOpen(false); router.push('/matchmaking'); }}>
                 <View style={[styles.menuIconBg, { backgroundColor: '#fdf2f8' }]}><Ionicons name="heart" size={20} color="#ec4899" /></View>
                <Text style={styles.menuItemText}>Find Study Partner</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuOpen(false); Alert.alert('Arcade Zone 🎮', 'Scroll through your feed to find and play randomly injected Brain Games!'); }}>
                <View style={[styles.menuIconBg, { backgroundColor: '#fefce8' }]}><Ionicons name="game-controller" size={20} color="#eab308" /></View>
                <Text style={styles.menuItemText}>Mini Games (Feed)</Text>
              </TouchableOpacity>

              {/* 👉 NEW: THE VOID (VENT WALL) BUTTON */}
              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuOpen(false); router.push('/vent'); }}>
                <View style={[styles.menuIconBg, { backgroundColor: '#fef2f2' }]}><Ionicons name="mic-off" size={20} color="#ef4444" /></View>
                <Text style={styles.menuItemText}>The Void (Vent Here) 🤫</Text>
              </TouchableOpacity>

              <Text style={styles.menuSectionTitle}>ACCOUNT</Text>

              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuOpen(false); router.push(`/user/${currentUid}`); }}>
                <View style={[styles.menuIconBg, { backgroundColor: '#f1f5f9' }]}><Ionicons name="person" size={20} color="#475569" /></View>
                <Text style={styles.menuItemText}>My Profile</Text>
              </TouchableOpacity>

            </ScrollView>
          </Animated.View>
        </Animated.View>
      )}

      {/* 🔝 UPDATED MAIN HEADER (With Hamburger Icon) */}
      <View style={styles.mainHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* 👉 HAMBURGER BUTTON ADDED HERE */}
          <TouchableOpacity onPress={() => setIsMenuOpen(true)} style={styles.hamburgerBtn}>
            <Ionicons name="menu" size={28} color="#0f172a" />
          </TouchableOpacity>
          <View style={styles.logoBox}><Ionicons name="school" size={22} color="#fff" /></View>
          <Text style={styles.brandName}>Eduxity</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/search-users')}><Ionicons name="search" size={24} color="#0f172a" /></TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/notification')}><Ionicons name="notifications-outline" size={24} color="#0f172a" />{unreadCount > 0 && (<Animated.View style={styles.notificationBadge}><Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></Animated.View>)}</TouchableOpacity>
        </View>
      </View>
      <View style={styles.categoryFilterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15, paddingVertical: 12 }}>
          {CATEGORIES.map((cat, index) => (<TouchableOpacity key={index} style={[styles.filterPill, selectedCategory === cat && styles.activeFilterPill]} onPress={() => setSelectedCategory(cat)} activeOpacity={0.8}><Text style={[styles.filterPillText, selectedCategory === cat && styles.activeFilterPillText]}>{cat}</Text></TouchableOpacity>))}
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
          renderItem={({ item }) => {
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
            return <PostCard item={item} currentUid={currentUid} />;
          }}
          ListEmptyComponent={<View style={styles.emptyFilterState}><Ionicons name="funnel-outline" size={50} color="#cbd5e1" /><Text style={styles.emptyText}>No posts found in &quot;{selectedCategory}&quot;</Text></View>}
        />
      )}
      <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={() => router.push('/create-post')}><View style={styles.fabInner}><Ionicons name="add" size={32} color="#fff" /></View></TouchableOpacity>
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

  // 🎮 GAME STYLES (Unified)
  gameCard: { marginHorizontal: 15, marginBottom: 15, backgroundColor: '#020617', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#1e293b', elevation: 5, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 10 },
  gameHeader: { marginBottom: 15, alignItems: 'center' },
  gameTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  gameTitle: { fontSize: 15, fontWeight: '900', marginLeft: 6, letterSpacing: 2 },
  gameSubtitle: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  memGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  memCardContainer: { width: '48%', height: 80, position: 'relative' },
  memCardFront: { width: '100%', height: '100%', backgroundColor: '#0f172a', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#1e293b' },
  memCardBack: { width: '100%', height: '100%', backgroundColor: '#4f46e5', borderRadius: 12, justifyContent: 'center', alignItems: 'center', padding: 10 },
  memCardMatched: { backgroundColor: '#10b981' }, 
  memCardText: { color: '#fff', fontSize: 13, fontWeight: '800', textAlign: 'center' },
  gameWinArea: { alignItems: 'center', paddingVertical: 20 },
  gameWinTitle: { color: '#f8fafc', fontSize: 22, fontWeight: '900', marginTop: 10, marginBottom: 20 },
  claimBtnGame: { backgroundColor: '#ec4899', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 20, elevation: 4 },
  claimBtnGameText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  mathArea: { alignItems: 'center', width: '100%' },
  mathQuestion: { fontSize: 36, fontWeight: '900', color: '#f8fafc', marginBottom: 20, letterSpacing: 2 },
  unitQuestion: { fontSize: 20, fontWeight: '800', color: '#f8fafc', marginBottom: 20, textAlign: 'center', lineHeight: 28 },
  mathGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, width: '100%' },
  mathOptionBtn: { width: '48%', backgroundColor: '#0f172a', paddingVertical: 15, paddingHorizontal: 5, borderRadius: 12, borderWidth: 2, borderColor: '#1e293b', alignItems: 'center' },
  mathOptionText: { color: '#f8fafc', fontSize: 16, fontWeight: '800', textAlign: 'center' },
  elementBox: { backgroundColor: '#0f172a', width: 80, height: 80, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#10b981', marginBottom: 20 },
  elementSymbol: { color: '#10b981', fontSize: 36, fontWeight: '900' },
  
  // Code Block Game Styles
  codeBlockGame: { width: '100%', backgroundColor: '#0f172a', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', marginBottom: 15 },
  codeBlockGameText: { color: '#e2e8f0', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 14, lineHeight: 22 },

// 🍔 HAMBURGER & SIDEBAR MENU STYLES
  hamburgerBtn: { marginRight: 15, padding: 4 },
  menuOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, elevation: 100 },
  menuBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  menuDrawer: { position: 'absolute', top: 0, left: 0, bottom: 0, width: '75%', backgroundColor: '#fff', borderTopRightRadius: 30, borderBottomRightRadius: 30, shadowColor: '#000', shadowOffset: {width: 5, height: 0}, shadowOpacity: 0.3, shadowRadius: 15, elevation: 20, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 40 },
  menuDrawerHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  menuAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#f1f5f9' },
  menuUserName: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  menuUserSub: { fontSize: 12, color: '#ec4899', fontWeight: '800', marginTop: 2 },
  menuCloseBtn: { padding: 5, backgroundColor: '#f8fafc', borderRadius: 20 },
  menuScroll: { padding: 20 },
  menuSectionTitle: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1.5, marginBottom: 15, marginTop: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  menuIconBg: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuItemText: { fontSize: 16, fontWeight: '700', color: '#334155' },

});