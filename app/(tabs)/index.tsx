import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl, Platform, ScrollView, Alert, Modal, TextInput, KeyboardAvoidingView, Dimensions, Keyboard
} from 'react-native';
import { Image } from 'expo-image'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FormulaNinjaGame, AlgebraSprintGame } from '../../components/games/FoundationGames';
import { auth, db } from '../../firebaseConfig';
import PostCard from '../../components/FeedPost';
import { 
  collection, query, orderBy, onSnapshot, doc, updateDoc, 
  limit, addDoc, serverTimestamp, getDoc, where 
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { registerForPushNotificationsAsync } from '../../helpers/notificationEngine'; 
import * as Haptics from 'expo-haptics'; 
import Animated, { FadeInDown, Layout, useSharedValue, useAnimatedStyle, withTiming, interpolate, Extrapolation, SlideInLeft, SlideOutLeft, FadeIn, FadeOut, withRepeat } from 'react-native-reanimated';

const { height } = Dimensions.get('window');
const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
const CATEGORIES = ['All', 'General', 'JEE Warriors', 'Coding Group', 'Doubts', 'Resources'];

// ==========================================
// 💀 PREMIUM SKELETON LOADER
// ==========================================
const SkeletonPost = () => {
  const pulseAnim = useSharedValue(0.5);
  useEffect(() => { pulseAnim.value = withRepeat(withTiming(1, { duration: 1000 }), -1, true); }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: pulseAnim.value }));
  return (
    <Animated.View style={[styles.postCard, styles.skeletonCard, animStyle]}>
      <View style={styles.postHeader}>
        <View style={styles.skeletonAvatar} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={styles.skeletonTextLine} />
          <View style={[styles.skeletonTextLine, { width: '40%', marginTop: 6 }]} />
        </View>
      </View>
      <View style={[styles.skeletonTextLine, { width: '90%', height: 14, marginHorizontal: 15, marginTop: 10 }]} />
      <View style={[styles.skeletonTextLine, { width: '70%', height: 14, marginHorizontal: 15, marginTop: 8 }]} />
      <View style={styles.skeletonBox} />
    </Animated.View>
  );
};

// ==========================================
// 🎮 GAMES BUNDLE (ALL 10 GAMES EXACTLY AS BEFORE)
// ==========================================
const MASTER_PAIRS = [{pId: 'A', t1: "Force", t2: "M × A"}, {pId: 'B', t1: "Power", t2: "Work/Time"}, {pId: 'C', t1: "Ohm's Law", t2: "V = IR"}, {pId: 'D', t1: "Kinetic Energy", t2: "½mv²"}, {pId: 'E', t1: "Water", t2: "H2O"}, {pId: 'F', t1: "Gravity", t2: "9.8 m/s²"}, {pId: 'G', t1: "Speed of Light", t2: "3×10⁸ m/s"}, {pId: 'H', t1: "PI (π)", t2: "3.1415"}, {pId: 'I', t1: "Density", t2: "Mass/Vol"}, {pId: 'J', t1: "Benzene", t2: "C6H6"}, {pId: 'K', t1: "Newton's 3rd", t2: "Action=Reaction"}, {pId: 'L', t1: "Current", t2: "Ampere"}];
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
  const [cards, setCards] = useState<any[]>([]); const [flippedIndices, setFlippedIndices] = useState<number[]>([]); const [matchedIds, setMatchedIds] = useState<string[]>([]); const [won, setWon] = useState(false);
  const initGame = () => { const shuffledPairs = [...MASTER_PAIRS].sort(() => Math.random() - 0.5).slice(0, 3); let newCards: any[] = []; shuffledPairs.forEach((p, i) => { newCards.push({ id: `f_${i}`, pairId: p.pId, text: p.t1 }); newCards.push({ id: `b_${i}`, pairId: p.pId, text: p.t2 }); }); setCards(newCards.sort(() => Math.random() - 0.5)); setFlippedIndices([]); setMatchedIds([]); setWon(false); };
  useEffect(() => { initGame(); }, []);
  const handleTap = (index: number) => {
    if (flippedIndices.length === 2 || flippedIndices.includes(index) || matchedIds.includes(cards[index].pairId)) return;
    const newFlipped = [...flippedIndices, index]; setFlippedIndices(newFlipped);
    if (newFlipped.length === 2) {
      if (cards[newFlipped[0]].pairId === cards[newFlipped[1]].pairId) { setMatchedIds(prev => { const newMatches = [...prev, cards[newFlipped[0]].pairId]; if (newMatches.length === 3) setTimeout(() => { setWon(true); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }, 500); return newMatches; }); setFlippedIndices([]); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } else { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTimeout(() => setFlippedIndices([]), 800); }
    } else { Haptics.selectionAsync(); }
  };
  return (
    <Animated.View entering={FadeInDown.springify()} style={styles.gameCard}>
      <View style={styles.gameHeader}><View style={styles.gameTitleRow}><Ionicons name="game-controller" size={20} color="#ec4899" /><Text style={[styles.gameTitle, { color: '#ec4899' }]}>BRAIN MATCH</Text></View><Text style={styles.gameSubtitle}>Match the pairs! 🧠</Text></View>
      {!won ? (<View style={styles.memGrid}>{cards.map((card, index) => <MemoryCard key={index} item={card} isFlipped={flippedIndices.includes(index)} isMatched={matchedIds.includes(card.pairId)} onPress={() => handleTap(index)} />)}</View>) : (<Animated.View entering={FadeInDown} style={styles.gameWinArea}><Ionicons name="trophy" size={60} color="#fde047" /><Text style={styles.gameWinTitle}>Mastermind! 🎓</Text><TouchableOpacity style={styles.claimBtnGame} onPress={initGame}><Text style={styles.claimBtnGameText}>Play Another Round</Text></TouchableOpacity></Animated.View>)}
    </Animated.View>
  );
};

const SpeedMathGame = () => {
  const [question, setQuestion] = useState(""); const [options, setOptions] = useState<number[]>([]); const [correctAnswer, setCorrectAnswer] = useState(0); const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const generateMathProblem = () => {
    const operators = ['+', '-', '*']; const op = operators[Math.floor(Math.random() * operators.length)]; let num1 = Math.floor(Math.random() * 20) + 1; let num2 = Math.floor(Math.random() * 15) + 1; let ans = 0;
    if (op === '+') ans = num1 + num2; if (op === '-') { if (num2 > num1) { let temp = num1; num1 = num2; num2 = temp; } ans = num1 - num2; } if (op === '*') { num1 = Math.floor(Math.random() * 12) + 2; num2 = Math.floor(Math.random() * 12) + 2; ans = num1 * num2; }
    setQuestion(`${num1} ${op} ${num2} = ?`); setCorrectAnswer(ans);
    let opts = new Set<number>([ans]); while (opts.size < 4) { const offset = Math.floor(Math.random() * 10) - 5; if (offset !== 0 && ans + offset > 0) opts.add(ans + offset); }
    setOptions(Array.from(opts).sort(() => Math.random() - 0.5)); setGameState('playing');
  };
  useEffect(() => { generateMathProblem(); }, []);
  return (
    <Animated.View entering={FadeInDown.springify()} style={[styles.gameCard, { borderColor: '#38bdf8' }]}>
      <View style={styles.gameHeader}><View style={styles.gameTitleRow}><Ionicons name="calculator" size={20} color="#38bdf8" /><Text style={[styles.gameTitle, { color: '#38bdf8' }]}>SPEED MATH</Text></View><Text style={styles.gameSubtitle}>Solve it fast! ⚡</Text></View>
      {gameState === 'playing' ? (<View style={styles.mathArea}><Text style={styles.mathQuestion}>{question}</Text><View style={styles.mathGrid}>{options.map((opt, i) => (<TouchableOpacity key={i} style={styles.mathOptionBtn} onPress={() => { if(opt===correctAnswer){Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setGameState('won');}else{Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); setGameState('lost');} }}><Text style={styles.mathOptionText}>{opt}</Text></TouchableOpacity>))}</View></View>) : (<View style={styles.gameWinArea}><Ionicons name={gameState === 'won' ? "checkmark-circle" : "close-circle"} size={60} color={gameState === 'won' ? "#10b981" : "#ef4444"} /><Text style={styles.gameWinTitle}>{gameState === 'won' ? "Quick Maffs! 🧠" : "Wrong Answer!"}</Text><TouchableOpacity style={[styles.claimBtnGame, { backgroundColor: '#38bdf8' }]} onPress={generateMathProblem}><Text style={styles.claimBtnGameText}>Next Question</Text></TouchableOpacity></View>)}
    </Animated.View>
  );
};

const PERIODIC_TABLE = [{ sym: 'H', name: 'Hydrogen' }, { sym: 'He', name: 'Helium' }, { sym: 'Li', name: 'Lithium' }, { sym: 'C', name: 'Carbon' }, { sym: 'N', name: 'Nitrogen' }, { sym: 'O', name: 'Oxygen' }, { sym: 'Na', name: 'Sodium' }, { sym: 'Mg', name: 'Magnesium' }, { sym: 'Fe', name: 'Iron' }, { sym: 'Cu', name: 'Copper' }, { sym: 'Zn', name: 'Zinc' }, { sym: 'Ag', name: 'Silver' }, { sym: 'Au', name: 'Gold' }, { sym: 'Hg', name: 'Mercury' }, { sym: 'Pb', name: 'Lead' }, { sym: 'K', name: 'Potassium' }];
const GuessElementGame = () => {
  const [element, setElement] = useState(PERIODIC_TABLE[0]); const [options, setOptions] = useState<string[]>([]); const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const generateQuestion = () => { const correctObj = PERIODIC_TABLE[Math.floor(Math.random() * PERIODIC_TABLE.length)]; setElement(correctObj); let opts = new Set<string>([correctObj.name]); while(opts.size < 4) { opts.add(PERIODIC_TABLE[Math.floor(Math.random() * PERIODIC_TABLE.length)].name); } setOptions(Array.from(opts).sort(() => Math.random() - 0.5)); setGameState('playing'); };
  useEffect(() => { generateQuestion(); }, []);
  return (
    <Animated.View entering={FadeInDown.springify()} style={[styles.gameCard, { borderColor: '#10b981' }]}>
      <View style={styles.gameHeader}><View style={styles.gameTitleRow}><Ionicons name="flask" size={20} color="#10b981" /><Text style={[styles.gameTitle, { color: '#10b981' }]}>GUESS ELEMENT</Text></View><Text style={styles.gameSubtitle}>Identify the Symbol 🧪</Text></View>
      {gameState === 'playing' ? (<View style={styles.mathArea}><View style={styles.elementBox}><Text style={styles.elementSymbol}>{element.sym}</Text></View><View style={styles.mathGrid}>{options.map((opt, i) => (<TouchableOpacity key={i} style={[styles.mathOptionBtn, { borderColor: '#10b981' }]} onPress={() => { if(opt === element.name) setGameState('won'); else setGameState('lost'); }}><Text style={styles.mathOptionText}>{opt}</Text></TouchableOpacity>))}</View></View>) : (<View style={styles.gameWinArea}><Ionicons name={gameState === 'won' ? "star" : "skull"} size={60} color={gameState === 'won' ? "#fde047" : "#ef4444"} /><Text style={styles.gameWinTitle}>{gameState === 'won' ? "Genius Chemist!" : "It was " + element.name}</Text><TouchableOpacity style={[styles.claimBtnGame, { backgroundColor: '#10b981' }]} onPress={generateQuestion}><Text style={styles.claimBtnGameText}>Play Again</Text></TouchableOpacity></View>)}
    </Animated.View>
  );
};

const SI_UNITS = [{ q: 'Force', u: 'Newton (N)' }, { q: 'Work / Energy', u: 'Joule (J)' }, { q: 'Power', u: 'Watt (W)' }, { q: 'Pressure', u: 'Pascal (Pa)' }, { q: 'Electric Current', u: 'Ampere (A)' }, { q: 'Resistance', u: 'Ohm (Ω)' }, { q: 'Capacitance', u: 'Farad (F)' }, { q: 'Inductance', u: 'Henry (H)' }, { q: 'Magnetic Flux', u: 'Weber (Wb)' }, { q: 'Magnetic Field', u: 'Tesla (T)' }, { q: 'Frequency', u: 'Hertz (Hz)' }, { q: 'Luminous Intensity', u: 'Candela (cd)' }];
const UnitMasterGame = () => {
  const [question, setQuestion] = useState(SI_UNITS[0]); const [options, setOptions] = useState<string[]>([]); const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const generateQuestion = () => { const correctObj = SI_UNITS[Math.floor(Math.random() * SI_UNITS.length)]; setQuestion(correctObj); let opts = new Set<string>([correctObj.u]); while(opts.size < 4) { opts.add(SI_UNITS[Math.floor(Math.random() * SI_UNITS.length)].u); } setOptions(Array.from(opts).sort(() => Math.random() - 0.5)); setGameState('playing'); };
  useEffect(() => { generateQuestion(); }, []);
  return (
    <Animated.View entering={FadeInDown.springify()} style={[styles.gameCard, { borderColor: '#a855f7' }]}>
      <View style={styles.gameHeader}><View style={styles.gameTitleRow}><Ionicons name="speedometer" size={20} color="#a855f7" /><Text style={[styles.gameTitle, { color: '#a855f7' }]}>UNIT MASTER</Text></View><Text style={styles.gameSubtitle}>Find the SI Unit 📏</Text></View>
      {gameState === 'playing' ? (<View style={styles.mathArea}><Text style={styles.unitQuestion}>What is the SI unit of{"\n"}<Text style={{color: '#a855f7'}}>{question.q}</Text>?</Text><View style={styles.mathGrid}>{options.map((opt, i) => (<TouchableOpacity key={i} style={[styles.mathOptionBtn, { borderColor: '#a855f7' }]} onPress={() => { if(opt === question.u) setGameState('won'); else setGameState('lost'); }}><Text style={styles.mathOptionText}>{opt}</Text></TouchableOpacity>))}</View></View>) : (<View style={styles.gameWinArea}><Ionicons name={gameState === 'won' ? "medal" : "close-circle"} size={60} color={gameState === 'won' ? "#a855f7" : "#ef4444"} /><Text style={styles.gameWinTitle}>{gameState === 'won' ? "Physics Pro!" : `Answer: ${question.u}`}</Text><TouchableOpacity style={[styles.claimBtnGame, { backgroundColor: '#a855f7' }]} onPress={generateQuestion}><Text style={styles.claimBtnGameText}>Next Question</Text></TouchableOpacity></View>)}
    </Animated.View>
  );
};

const SeriesSolverGame = () => {
  const [series, setSeries] = useState(""); const [options, setOptions] = useState<number[]>([]); const [correctAnswer, setCorrectAnswer] = useState(0); const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const generateSeries = () => { const type = Math.random(); let arr = []; let ans = 0; if (type < 0.4) { const start = Math.floor(Math.random() * 10) + 1; const diff = Math.floor(Math.random() * 5) + 2; arr = [start, start+diff, start+diff*2, start+diff*3]; ans = start+diff*4; } else if (type < 0.8) { const start = Math.floor(Math.random() * 5) + 2; arr = [start*start, (start+1)*(start+1), (start+2)*(start+2), (start+3)*(start+3)]; ans = (start+4)*(start+4); } else { const start = Math.floor(Math.random() * 3) + 2; const ratio = 2; arr = [start, start*ratio, start*ratio*ratio, start*ratio*ratio*ratio]; ans = start*ratio*ratio*ratio*ratio; } setSeries(`${arr.join(', ')}, ?`); setCorrectAnswer(ans); let opts = new Set<number>([ans]); while(opts.size < 4) { const fakeAns = ans + (Math.floor(Math.random() * 10) - 5); if (fakeAns !== ans && fakeAns > 0) opts.add(fakeAns); } setOptions(Array.from(opts).sort(() => Math.random() - 0.5)); setGameState('playing'); };
  useEffect(() => { generateSeries(); }, []);
  return (
    <Animated.View entering={FadeInDown.springify()} style={[styles.gameCard, { borderColor: '#f97316' }]}>
      <View style={styles.gameHeader}><View style={styles.gameTitleRow}><Ionicons name="analytics" size={20} color="#f97316" /><Text style={[styles.gameTitle, { color: '#f97316' }]}>SERIES SOLVER</Text></View><Text style={styles.gameSubtitle}>Find the next number 🔢</Text></View>
      {gameState === 'playing' ? (<View style={styles.mathArea}><Text style={[styles.mathQuestion, {color: '#f97316'}]}>{series}</Text><View style={styles.mathGrid}>{options.map((opt, i) => (<TouchableOpacity key={i} style={[styles.mathOptionBtn, { borderColor: '#f97316' }]} onPress={() => { if(opt === correctAnswer) setGameState('won'); else setGameState('lost'); }}><Text style={styles.mathOptionText}>{opt}</Text></TouchableOpacity>))}</View></View>) : (<View style={styles.gameWinArea}><Ionicons name={gameState === 'won' ? "bulb" : "alert-circle"} size={60} color={gameState === 'won' ? "#fde047" : "#ef4444"} /><Text style={styles.gameWinTitle}>{gameState === 'won' ? "Big Brain!" : `Answer: ${correctAnswer}`}</Text><TouchableOpacity style={[styles.claimBtnGame, { backgroundColor: '#f97316' }]} onPress={generateSeries}><Text style={styles.claimBtnGameText}>Play Again</Text></TouchableOpacity></View>)}
    </Animated.View>
  );
};

const SCIENCE_WORDS = ["KINEMATICS", "GRAVITATION", "FRICTION", "MOMENTUM", "ELECTRON", "PROTON", "ISOTOPE", "TITRATION", "POLYGON", "CALCULUS", "ALGEBRA", "GENETICS", "BOTANY"];
const WordScrambleGame = () => {
  const [scrambled, setScrambled] = useState(""); const [options, setOptions] = useState<string[]>([]); const [correctAnswer, setCorrectAnswer] = useState(""); const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const generateScramble = () => { const word = SCIENCE_WORDS[Math.floor(Math.random() * SCIENCE_WORDS.length)]; setCorrectAnswer(word); let arr = word.split(''); for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } setScrambled(arr.join(' ')); let opts = new Set<string>([word]); while(opts.size < 4) { opts.add(SCIENCE_WORDS[Math.floor(Math.random() * SCIENCE_WORDS.length)]); } setOptions(Array.from(opts).sort(() => Math.random() - 0.5)); setGameState('playing'); };
  useEffect(() => { generateScramble(); }, []);
  return (
    <Animated.View entering={FadeInDown.springify()} style={[styles.gameCard, { borderColor: '#f43f5e' }]}>
      <View style={styles.gameHeader}><View style={styles.gameTitleRow}><Ionicons name="text" size={20} color="#f43f5e" /><Text style={[styles.gameTitle, { color: '#f43f5e' }]}>SCIENCE SCRAMBLE</Text></View><Text style={styles.gameSubtitle}>Unjumble the word 🔠</Text></View>
      {gameState === 'playing' ? (<View style={styles.mathArea}><Text style={[styles.mathQuestion, {fontSize: 28, color: '#f43f5e'}]}>{scrambled}</Text><View style={styles.mathGrid}>{options.map((opt, i) => (<TouchableOpacity key={i} style={[styles.mathOptionBtn, { borderColor: '#f43f5e', paddingVertical: 12 }]} onPress={() => { if(opt === correctAnswer) setGameState('won'); else setGameState('lost'); }}><Text style={[styles.mathOptionText, {fontSize: 14}]}>{opt}</Text></TouchableOpacity>))}</View></View>) : (<View style={styles.gameWinArea}><Ionicons name={gameState === 'won' ? "ribbon" : "close"} size={60} color={gameState === 'won' ? "#fde047" : "#ef4444"} /><Text style={styles.gameWinTitle}>{gameState === 'won' ? "Vocab King!" : `Answer: ${correctAnswer}`}</Text><TouchableOpacity style={[styles.claimBtnGame, { backgroundColor: '#f43f5e' }]} onPress={generateScramble}><Text style={styles.claimBtnGameText}>Next Word</Text></TouchableOpacity></View>)}
    </Animated.View>
  );
};

const EquationBalancerGame = () => {
  const [equation, setEquation] = useState(""); const [options, setOptions] = useState<string[]>([]); const [correctAnswer, setCorrectAnswer] = useState(""); const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const generateEquation = () => { const ops = ['+', '-', '*']; const op1 = ops[Math.floor(Math.random() * ops.length)]; const op2 = ops[Math.floor(Math.random() * ops.length)]; const n1 = Math.floor(Math.random() * 10) + 1; const n2 = Math.floor(Math.random() * 10) + 1; const n3 = Math.floor(Math.random() * 10) + 1; let result = eval(`${n1} ${op1} ${n2} ${op2} ${n3}`); setEquation(`${n1} _ ${n2} _ ${n3} = ${result}`); setCorrectAnswer(`${op1}, ${op2}`); let opts = new Set<string>([`${op1}, ${op2}`]); while(opts.size < 4) { opts.add(`${ops[Math.floor(Math.random() * ops.length)]}, ${ops[Math.floor(Math.random() * ops.length)]}`); } setOptions(Array.from(opts).sort(() => Math.random() - 0.5)); setGameState('playing'); };
  useEffect(() => { generateEquation(); }, []);
  return (
    <Animated.View entering={FadeInDown.springify()} style={[styles.gameCard, { borderColor: '#8b5cf6' }]}>
      <View style={styles.gameHeader}><View style={styles.gameTitleRow}><Ionicons name="git-compare" size={20} color="#8b5cf6" /><Text style={[styles.gameTitle, { color: '#8b5cf6' }]}>EQUATION BALANCER</Text></View><Text style={styles.gameSubtitle}>Find the missing signs ⚖️</Text></View>
      {gameState === 'playing' ? (<View style={styles.mathArea}><Text style={[styles.mathQuestion, {color: '#8b5cf6', fontSize: 28}]}>{equation}</Text><View style={styles.mathGrid}>{options.map((opt, i) => (<TouchableOpacity key={i} style={[styles.mathOptionBtn, { borderColor: '#8b5cf6' }]} onPress={() => { if(opt === correctAnswer) setGameState('won'); else setGameState('lost'); }}><Text style={styles.mathOptionText}>{opt}</Text></TouchableOpacity>))}</View></View>) : (<View style={styles.gameWinArea}><Ionicons name={gameState === 'won' ? "shield-checkmark" : "skull"} size={60} color={gameState === 'won' ? "#10b981" : "#ef4444"} /><Text style={styles.gameWinTitle}>{gameState === 'won' ? "Balanced!" : `Answer: ${correctAnswer}`}</Text><TouchableOpacity style={[styles.claimBtnGame, { backgroundColor: '#8b5cf6' }]} onPress={generateEquation}><Text style={styles.claimBtnGameText}>Play Again</Text></TouchableOpacity></View>)}
    </Animated.View>
  );
};

const VectorDashGame = () => {
  const [question, setQuestion] = useState(""); const [options, setOptions] = useState<number[]>([]); const [correctAnswer, setCorrectAnswer] = useState(0); const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const generateVector = () => { const f1 = Math.floor(Math.random() * 20) + 5; const f2 = Math.floor(Math.random() * 20) + 5; const direction = Math.random() > 0.5 ? 'Same' : 'Opposite'; let ans = 0; if (direction === 'Same') { setQuestion(`${f1}N Right & ${f2}N Right`); ans = f1 + f2; } else { setQuestion(`${f1}N Right & ${f2}N Left`); ans = Math.abs(f1 - f2); } setCorrectAnswer(ans); let opts = new Set<number>([ans]); while(opts.size < 4) { let fake = ans + (Math.floor(Math.random() * 10) - 5); if (fake !== ans && fake >= 0) opts.add(fake); } setOptions(Array.from(opts).sort(() => Math.random() - 0.5)); setGameState('playing'); };
  useEffect(() => { generateVector(); }, []);
  return (
    <Animated.View entering={FadeInDown.springify()} style={[styles.gameCard, { borderColor: '#14b8a6' }]}>
      <View style={styles.gameHeader}><View style={styles.gameTitleRow}><Ionicons name="compass" size={20} color="#14b8a6" /><Text style={[styles.gameTitle, { color: '#14b8a6' }]}>VECTOR DASH</Text></View><Text style={styles.gameSubtitle}>Net Force? 🧭</Text></View>
      {gameState === 'playing' ? (<View style={styles.mathArea}><Text style={[styles.mathQuestion, {color: '#14b8a6', fontSize: 24}]}>{question}</Text><View style={styles.mathGrid}>{options.map((opt, i) => (<TouchableOpacity key={i} style={[styles.mathOptionBtn, { borderColor: '#14b8a6' }]} onPress={() => { if(opt === correctAnswer) setGameState('won'); else setGameState('lost'); }}><Text style={styles.mathOptionText}>{opt} N</Text></TouchableOpacity>))}</View></View>) : (<View style={styles.gameWinArea}><Ionicons name={gameState === 'won' ? "flash" : "close"} size={60} color={gameState === 'won' ? "#fde047" : "#ef4444"} /><Text style={styles.gameWinTitle}>{gameState === 'won' ? "Force Master!" : `Answer: ${correctAnswer}N`}</Text><TouchableOpacity style={[styles.claimBtnGame, { backgroundColor: '#14b8a6' }]} onPress={generateVector}><Text style={styles.claimBtnGameText}>Next Question</Text></TouchableOpacity></View>)}
    </Animated.View>
  );
};

const BIO_FACTS = [{ q: "Mitochondria is the powerhouse of the cell.", ans: true }, { q: "Humans have 24 pairs of chromosomes.", ans: false }, { q: "DNA contains Uracil.", ans: false }, { q: "Arteries carry oxygenated blood.", ans: true }, { q: "Photosynthesis occurs in mitochondria.", ans: false }, { q: "White blood cells fight infections.", ans: true }];
const BioTimeAttackGame = () => {
  const [question, setQuestion] = useState(BIO_FACTS[0]); const [timeLeft, setTimeLeft] = useState(5); const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const startGame = () => { setQuestion(BIO_FACTS[Math.floor(Math.random() * BIO_FACTS.length)]); setTimeLeft(5); setGameState('playing'); };
  useEffect(() => { startGame(); }, []);
  useEffect(() => { if (gameState !== 'playing') return; if (timeLeft <= 0) { setGameState('lost'); return; } const timer = setInterval(() => setTimeLeft(p => p - 1), 1000); return () => clearInterval(timer); }, [timeLeft, gameState]);
  return (
    <Animated.View entering={FadeInDown.springify()} style={[styles.gameCard, { borderColor: '#22c55e' }]}>
      <View style={styles.gameHeader}><View style={styles.gameTitleRow}><Ionicons name="leaf" size={20} color="#22c55e" /><Text style={[styles.gameTitle, { color: '#22c55e' }]}>BIO TIME ATTACK</Text></View><Text style={[styles.gameSubtitle, {color: timeLeft <= 2 ? '#ef4444' : '#fff', fontWeight: '900'}]}>00:0{timeLeft}</Text></View>
      {gameState === 'playing' ? (<View style={styles.mathArea}><Text style={[styles.unitQuestion, {color: '#f8fafc', fontSize: 18}]}>"{question.q}"</Text><View style={[styles.mathGrid, {marginTop: 10}]}><TouchableOpacity style={[styles.mathOptionBtn, { borderColor: '#ef4444' }]} onPress={() => { if(false === question.ans) setGameState('won'); else setGameState('lost'); }}><Text style={[styles.mathOptionText, {color: '#ef4444'}]}>False</Text></TouchableOpacity><TouchableOpacity style={[styles.mathOptionBtn, { borderColor: '#10b981' }]} onPress={() => { if(true === question.ans) setGameState('won'); else setGameState('lost'); }}><Text style={[styles.mathOptionText, {color: '#10b981'}]}>True</Text></TouchableOpacity></View></View>) : (<View style={styles.gameWinArea}><Ionicons name={gameState === 'won' ? "happy" : "sad"} size={60} color={gameState === 'won' ? "#10b981" : "#ef4444"} /><Text style={styles.gameWinTitle}>{gameState === 'won' ? "Sharp Memory!" : "Too slow/Wrong!"}</Text><TouchableOpacity style={[styles.claimBtnGame, { backgroundColor: '#22c55e' }]} onPress={startGame}><Text style={styles.claimBtnGameText}>Play Again</Text></TouchableOpacity></View>)}
    </Animated.View>
  );
};

const CODE_SNIPPETS = [{ code: "const name = 'John'\nconsole.log(name)", bug: "Missing Semicolon", ans: "Missing Semicolon" }, { code: "if (x = 10) {\n  return true;\n}", bug: "Used = instead of ==", ans: "Assignment in IF" }, { code: "let arr = [1,2,3];\nconsole.log(arr[3]);", bug: "Out of bounds", ans: "Index Out of Bounds" }, { code: "const add = (a, b) => a + b;\nadd(5);", bug: "Missing Argument", ans: "Missing Argument" }];
const BugHunterGame = () => {
  const [question, setQuestion] = useState(CODE_SNIPPETS[0]); const [options, setOptions] = useState<string[]>([]); const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const generateQuestion = () => { const correctObj = CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)]; setQuestion(correctObj); let opts = new Set<string>([correctObj.ans]); while(opts.size < 4) { opts.add(CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)].ans); } setOptions(Array.from(opts).sort(() => Math.random() - 0.5)); setGameState('playing'); };
  useEffect(() => { generateQuestion(); }, []);
  return (
    <Animated.View entering={FadeInDown.springify()} style={[styles.gameCard, { borderColor: '#6366f1' }]}>
      <View style={styles.gameHeader}><View style={styles.gameTitleRow}><Ionicons name="bug" size={20} color="#6366f1" /><Text style={[styles.gameTitle, { color: '#6366f1' }]}>BUG HUNTER</Text></View><Text style={styles.gameSubtitle}>Find the Error 💻</Text></View>
      {gameState === 'playing' ? (<View style={styles.mathArea}><View style={styles.codeBlockGame}><Text style={styles.codeBlockGameText}>{question.code}</Text></View><View style={styles.mathGrid}>{options.map((opt, i) => (<TouchableOpacity key={i} style={[styles.mathOptionBtn, { borderColor: '#6366f1', paddingVertical: 10 }]} onPress={() => { if(opt === question.ans) setGameState('won'); else setGameState('lost'); }}><Text style={[styles.mathOptionText, {fontSize: 13}]}>{opt}</Text></TouchableOpacity>))}</View></View>) : (<View style={styles.gameWinArea}><Ionicons name={gameState === 'won' ? "terminal" : "skull"} size={60} color={gameState === 'won' ? "#10b981" : "#ef4444"} /><Text style={styles.gameWinTitle}>{gameState === 'won' ? "Senior Dev!" : `Bug: ${question.ans}`}</Text><TouchableOpacity style={[styles.claimBtnGame, { backgroundColor: '#6366f1' }]} onPress={generateQuestion}><Text style={styles.claimBtnGameText}>Next Bug</Text></TouchableOpacity></View>)}
    </Animated.View>
  );
};

// ==========================================
// 🔥 MAIN FEED SCREEN (v4.0 - All in One)
// ==========================================
export default function FeedScreen() {
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [feedType, setFeedType] = useState<'FOR_YOU' | 'FOLLOWING'>('FOR_YOU');
  
  // 🔥 IMAGE VIEWER STATE
  const [visibleImage, setVisibleImage] = useState<string | null>(null);
  
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [algoPosts, setAlgoPosts] = useState<any[]>([]);
  const [myFriends, setMyFriends] = useState<string[]>([]);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [postLimit, setPostLimit] = useState(15); 
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [unreadCount, setUnreadCount] = useState(0);

  // 🔥 FIX: Strict Pagination Controller
  const [hasMorePosts, setHasMorePosts] = useState(true);

  // Comments State
  const [activeCommentPost, setActiveCommentPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  // 🔥 FIX: Prevent Comment Spam
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // 🔥 FIX: Robust Ref-based Realtime Syncing
  const rawPostsRef = useRef<any[]>([]);
  const rawExamsRef = useRef<any[]>([]);
  const sentFriendsRef = useRef<string[]>([]);
  const recFriendsRef = useRef<string[]>([]);

  // 1. Fetch User Data & Friends Network
  useEffect(() => {
    if (!currentUid) return;

    getDoc(doc(db, 'users', currentUid)).then((docSnap) => {
      if (docSnap.exists()) setCurrentUserData(docSnap.data());
    }).catch(e => console.log("User fetch error:", e));

    const updateFriendsList = () => {
      setMyFriends([...sentFriendsRef.current, ...recFriendsRef.current]);
    };

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
    const unsub = onSnapshot(query(collection(db, 'notifications'), where('recipientId', '==', currentUid), where('isRead', '==', false)), (snapshot) => {
      setUnreadCount(snapshot.docs.length);
    });
    return () => unsub();
  }, [currentUid]);

  useEffect(() => { if (currentUid) registerForPushNotificationsAsync(currentUid); }, [currentUid]);

  useEffect(() => {
    const combineAndSet = () => {
      const combined = [...rawPostsRef.current, ...rawExamsRef.current].sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setAllPosts(combined);
      setLoading(false); 
      setRefreshing(false);
    };

    const unsubPosts = onSnapshot(query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(postLimit)), (snapshot) => {
      rawPostsRef.current = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHasMorePosts(snapshot.docs.length === postLimit); // FIX
      combineAndSet();
    });

    const unsubExams = onSnapshot(query(collection(db, 'exams_enterprise'), orderBy('createdAt', 'desc'), limit(5)), (snapshot) => {
      rawExamsRef.current = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id, type: 'live_test', title: data.title, category: 'Test Series',
          authorId: data.authorId, authorName: data.authorName || 'Scholar', authorAvatar: data.authorAvatar || DEFAULT_AVATAR,
          createdAt: data.createdAt, ntaFormat: true, questions: data.questions || [],
          settings: { totalDuration: data.rules?.globalDuration || 180, antiCheat: data.rules?.isStrict || false, negativeMarks: 1 },
          likes: data.likes || [], commentsCount: data.commentsCount || 0
        };
      });
      combineAndSet();
    });

    return () => { unsubPosts(); unsubExams(); };
  }, [currentUid, postLimit]);

  useEffect(() => {
    if (!allPosts.length) { setAlgoPosts([]); return; }
    
    if (feedType === 'FOLLOWING') {
      setAlgoPosts(allPosts.filter(post => myFriends.includes(post.authorId) || post.authorId === currentUid));
      return;
    }

    const calculateScoreAndReason = (post: any) => {
      let score = 0; let reason = "";
      const createdAtMs = post.createdAt?.toMillis ? post.createdAt.toMillis() : Date.now();
      const hoursOld = (Date.now() - createdAtMs) / (1000 * 60 * 60);
      
      if (post.type === 'live_test') { score += 10000; reason = "📝 Recommended Mock Test"; }
      if (myFriends.includes(post.authorId)) { score += 200; if(!reason) reason = "From your Network"; }
      
      const myInterests: string[] = currentUserData?.interests || [];
      if (myInterests.some((i: string) => i.toLowerCase().includes((post.category || "").toLowerCase())) && !reason) { score += 100; reason = "Suggested for You"; }
      
      const engagement = ((post.likes?.length || 0) * 3) + ((post.commentsCount || 0) * 8);
      score += engagement;
      if (engagement > 50 && hoursOld < 48 && !reason) { reason = "🔥 Trending"; score += 500; }

      return { score: score - (hoursOld * 2), reason };
    };

    let smartPosts = allPosts.map(post => {
      const { score, reason } = calculateScoreAndReason(post);
      return { ...post, algoScore: score, algoReason: reason };
    }).sort((a, b) => b.algoScore - a.algoScore);

    // 🔥 SMART GAME INJECTION ENGINE 🔥
    const userTarget = currentUserData?.targetExam || currentUserData?.grade || 'JEE';

    if (userTarget === '9th' || userTarget === '10th' || userTarget === 'Foundation') {
      if (smartPosts.length >= 3) smartPosts.splice(2, 0, { id: 'game_formula_ninja', type: 'game_formula_ninja' });
      if (smartPosts.length >= 8) smartPosts.splice(7, 0, { id: 'game_algebra_sprint', type: 'game_algebra_sprint' });
      if (smartPosts.length >= 12) smartPosts.splice(11, 0, { id: 'game_speed_math_1', type: 'game_speed_math' });
    } 
    else {
      // JEE/NEET/11th/12th walo ke games
      if (smartPosts.length >= 3) smartPosts.splice(2, 0, { id: 'game_brain_match_1', type: 'game_brain_match' });
      if (smartPosts.length >= 8) smartPosts.splice(7, 0, { id: 'game_unit_master_1', type: 'game_unit_master' });
      if (smartPosts.length >= 12) smartPosts.splice(11, 0, { id: 'game_vector_dash_1', type: 'game_vector_dash' });
    }
    setAlgoPosts(smartPosts);
  }, [allPosts, feedType, myFriends, currentUserData]);

  // Comments Fetching
  useEffect(() => {
    if (!activeCommentPost) { setComments([]); return; }
    const collName = activeCommentPost.type === 'live_test' ? 'exams_enterprise' : 'posts';
    const unsub = onSnapshot(query(collection(db, collName, activeCommentPost.id, 'comments'), orderBy('createdAt', 'asc')), (snapshot) => {
      setComments(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [activeCommentPost]);

  const handlePostComment = async () => {
    // 🔥 FIX: Blank spaces block & Submit Locking
    if (!newComment.trim() || !activeCommentPost || !currentUid || isSubmittingComment) return;
    
    setIsSubmittingComment(true);
    Keyboard.dismiss();

    const collName = activeCommentPost.type === 'live_test' ? 'exams_enterprise' : 'posts';
    try {
      await addDoc(collection(db, collName, activeCommentPost.id, 'comments'), {
        text: newComment.trim(), 
        authorId: currentUid, 
        authorName: auth.currentUser?.displayName || 'User',
        authorAvatar: auth.currentUser?.photoURL || DEFAULT_AVATAR, 
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, collName, activeCommentPost.id), { 
        commentsCount: (activeCommentPost.commentsCount || 0) + 1 
      });
      setNewComment("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) { 
      Alert.alert("Network Issue", "Failed to post comment. Please try again.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const onRefresh = () => { 
    setRefreshing(true); 
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPostLimit(15); 
  }; 

  const handleLoadMore = () => { 
    // 🔥 FIX: Strict pagination limit
    if (!loading && hasMorePosts) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPostLimit(prev => prev + 10); 
    }
  };

  const filteredPosts = selectedCategory === 'All' ? algoPosts : algoPosts.filter(post => post.category === selectedCategory);

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.createPostContainer}>
        <View style={styles.createInputRow}>
          <Image source={{ uri: auth.currentUser?.photoURL || DEFAULT_AVATAR }} style={styles.createAvatar} />
          <TouchableOpacity style={styles.fakeInput} onPress={() => router.push('/create-post')} activeOpacity={0.9}>
            <Text style={styles.fakeInputText}>Post a doubt, share a resource, or start a poll...</Text>
          </TouchableOpacity>
        </View>
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

      {/* 🍔 MENU OVERLAY */}
      {isMenuOpen && (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.menuOverlay}>
          <TouchableOpacity style={styles.menuBackdrop} activeOpacity={1} onPress={() => setIsMenuOpen(false)} />
          <Animated.View entering={SlideInLeft.duration(250)} exiting={SlideOutLeft.duration(200)} style={styles.menuDrawer}>
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
              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuOpen(false); router.push('/resources'); }}><View style={[styles.menuIconBg, { backgroundColor: '#eef2ff' }]}><Ionicons name="book" size={20} color="#4f46e5" /></View><Text style={styles.menuItemText}>Study Resources</Text></TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuOpen(false); router.push('/test-history'); }}><View style={[styles.menuIconBg, { backgroundColor: '#fef3c7' }]}><Ionicons name="stats-chart" size={20} color="#d97706" /></View><Text style={styles.menuItemText}>My Tests & History 📊</Text></TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuOpen(false); router.push('/grind'); }}><View style={[styles.menuIconBg, { backgroundColor: '#ecfdf5' }]}><Ionicons name="timer" size={20} color="#10b981" /></View><Text style={styles.menuItemText}>Live Grind Room 🔥</Text></TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuOpen(false); router.push('/doubts'); }}><View style={[styles.menuIconBg, { backgroundColor: '#e0e7ff' }]}><Ionicons name="help-buoy" size={20} color="#4f46e5" /></View><Text style={styles.menuItemText}>Doubt Hub ❓</Text></TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuOpen(false); router.push('/network'); }}><View style={[styles.menuIconBg, { backgroundColor: '#f0fdf4' }]}><Ionicons name="people" size={20} color="#10b981" /></View><Text style={styles.menuItemText}>My Network</Text></TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuOpen(false); router.push('/matchmaking'); }}><View style={[styles.menuIconBg, { backgroundColor: '#fdf2f8' }]}><Ionicons name="heart" size={20} color="#ec4899" /></View><Text style={styles.menuItemText}>Find Study Partner</Text></TouchableOpacity>
              <Text style={styles.menuSectionTitle}>ACCOUNT</Text>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuOpen(false); router.push(`/user/${currentUid}`); }}><View style={[styles.menuIconBg, { backgroundColor: '#f1f5f9' }]}><Ionicons name="person" size={20} color="#475569" /></View><Text style={styles.menuItemText}>My Profile</Text></TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      )}

      {/* TOP HEADER */}
      <View style={styles.mainHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setIsMenuOpen(true)} style={styles.hamburgerBtn}><Ionicons name="menu" size={28} color="#0f172a" /></TouchableOpacity>
          <View style={styles.logoBox}><Ionicons name="school" size={20} color="#fff" /></View>
          <Text style={styles.brandName}>Eduxity</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/search-users')}><Ionicons name="search" size={24} color="#0f172a" /></TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/notification')}><Ionicons name="notifications-outline" size={24} color="#0f172a" />{unreadCount > 0 && (<Animated.View style={styles.notificationBadge}><Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></Animated.View>)}</TouchableOpacity>
        </View>
      </View>

      {/* TABS */}
      <View style={styles.feedTabsContainer}>
        <TouchableOpacity style={[styles.feedTab, feedType === 'FOR_YOU' && styles.feedTabActive]} onPress={() => { setFeedType('FOR_YOU'); Haptics.selectionAsync(); }}>
          <Text style={[styles.feedTabText, feedType === 'FOR_YOU' && styles.feedTabTextActive]}>For You</Text>
          {feedType === 'FOR_YOU' && <Animated.View layout={Layout.springify()} style={styles.activeTabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.feedTab, feedType === 'FOLLOWING' && styles.feedTabActive]} onPress={() => { setFeedType('FOLLOWING'); Haptics.selectionAsync(); }}>
          <Text style={[styles.feedTabText, feedType === 'FOLLOWING' && styles.feedTabTextActive]}>Following</Text>
          {feedType === 'FOLLOWING' && <Animated.View layout={Layout.springify()} style={styles.activeTabIndicator} />}
        </TouchableOpacity>
      </View>

      {feedType === 'FOR_YOU' && (
        <View style={styles.categoryFilterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15, paddingVertical: 10 }}>
            {CATEGORIES.map((cat, index) => (<TouchableOpacity key={index} style={[styles.filterPill, selectedCategory === cat && styles.activeFilterPill]} onPress={() => { setSelectedCategory(cat); Haptics.selectionAsync(); }} activeOpacity={0.8}><Text style={[styles.filterPillText, selectedCategory === cat && styles.activeFilterPillText]}>{cat}</Text></TouchableOpacity>))}
          </ScrollView>
        </View>
      )}

      {/* MAIN LIST */}
      {loading && allPosts.length === 0 ? (
        <ScrollView style={{flex: 1}}><SkeletonPost /><SkeletonPost /></ScrollView>
      ) : (
        <FlatList
          data={filteredPosts} 
          keyExtractor={(item, index) => item.id ? item.id : `fallback_key_${index}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ backgroundColor: '#f1f5f9', paddingBottom: 100 }}
          ListHeaderComponent={renderHeader}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4f46e5"]} />}
          onEndReached={handleLoadMore} 
          onEndReachedThreshold={0.5}
          ListFooterComponent={hasMorePosts && algoPosts.length > 0 ? <ActivityIndicator size="small" color="#4f46e5" style={{marginVertical: 20}} /> : null}
          initialNumToRender={4}          
          maxToRenderPerBatch={4}         
          windowSize={5}                  
          removeClippedSubviews={true}

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
              <PostCard 
                item={item} 
                currentUid={currentUid} 
                onOpenComments={setActiveCommentPost} 
                onImagePress={setVisibleImage} 
              />
            );
          }}
          ListEmptyComponent={
            !loading && allPosts.length === 0 ? (
              <View style={styles.emptyFilterState}>
                <View style={{ backgroundColor: '#e0e7ff', padding: 20, borderRadius: 50, marginBottom: 15 }}>
                  <Ionicons name={feedType === 'FOLLOWING' ? "people-outline" : "planet-outline"} size={60} color="#4f46e5" />
                </View>
                <Text style={styles.emptyText}>
                  {feedType === 'FOLLOWING' ? "Your friends are quiet today." : `No posts in "${selectedCategory}"`}
                </Text>
                <Text style={{color: '#64748b', marginTop: 10, textAlign: 'center'}}>
                  Be the first one to start a discussion or post a doubt!
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {/* 🔥 UNIVERSAL FULLSCREEN IMAGE VIEWER (WEB-SAFE) */}
      <Modal visible={visibleImage !== null} transparent={true} animationType="fade" onRequestClose={() => setVisibleImage(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity 
            style={{ position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, right: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 }} 
            onPress={() => setVisibleImage(null)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {visibleImage && (
            <Image 
              source={{ uri: visibleImage }} 
              style={{ width: '100%', height: '80%' }} 
              contentFit="contain" 
              transition={300} 
            />
          )}
        </View>
      </Modal>

      {/* 💬 INSTA STYLE COMMENTS BOTTOM SHEET */}
      <Modal visible={!!activeCommentPost} animationType="slide" transparent={true} onRequestClose={() => setActiveCommentPost(null)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.commentModalBg}>
          <TouchableOpacity style={{flex: 1}} activeOpacity={1} onPress={() => { Keyboard.dismiss(); setActiveCommentPost(null); }} />
          <View style={styles.commentBottomSheet}>
            <View style={styles.commentHeader}>
              <Text style={styles.commentTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setActiveCommentPost(null)}><Ionicons name="close-circle" size={28} color="#94a3b8" /></TouchableOpacity>
            </View>
            <FlatList
              data={comments}
              keyExtractor={item => item.id}
              contentContainerStyle={{paddingTop: 10, paddingBottom: 20}}
              renderItem={({item}) => (
                <View style={styles.commentItem}>
                  <Image source={{uri: item.authorAvatar || DEFAULT_AVATAR}} style={styles.commentAvatar} />
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentAuthor}>{item.authorName}</Text>
                    <Text style={styles.commentText}>{item.text}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.noCommentsText}>No comments yet. Start the conversation! 🚀</Text>}
            />
            <View style={styles.commentInputBox}>
              <Image source={{uri: auth.currentUser?.photoURL || DEFAULT_AVATAR}} style={styles.commentInputAvatar} />
              <TextInput style={styles.commentInput} placeholder="Add a comment..." value={newComment} onChangeText={setNewComment} placeholderTextColor="#94a3b8" />
              <TouchableOpacity onPress={handlePostComment} disabled={!newComment.trim() || isSubmittingComment}>
                {isSubmittingComment ? (
                  <ActivityIndicator size="small" color="#4f46e5" />
                ) : (
                  <Ionicons name="send" size={24} color={newComment.trim() ? "#4f46e5" : "#cbd5e1"} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={() => router.push('/create-post')}><View style={styles.fabInner}><Ionicons name="add" size={32} color="#fff" /></View></TouchableOpacity>
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 COMPLETE MASTER STYLES
// ==========================================
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
  headerSection: { paddingBottom: 10 },
  createPostContainer: { backgroundColor: '#fff', padding: 15, marginBottom: 10 },
  createInputRow: { flexDirection: 'row', alignItems: 'center' },
  createAvatar: { width: 44, height: 44, borderRadius: 22 },
  fakeInput: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, marginLeft: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  fakeInputText: { color: '#94a3b8', fontSize: 14, fontWeight: '500', lineHeight: 20 },
  createActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderColor: '#f1f5f9' },
  createActionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },
  createActionText: { marginLeft: 8, fontSize: 13, fontWeight: '700', color: '#334155' },
  
  skeletonCard: { backgroundColor: '#fff', padding: 0, paddingBottom: 20, marginTop: 10 },
  skeletonAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#e2e8f0' },
  skeletonTextLine: { height: 12, backgroundColor: '#e2e8f0', borderRadius: 6, width: '80%' },
  skeletonBox: { height: 200, backgroundColor: '#f8fafc', marginHorizontal: 15, marginTop: 15, borderRadius: 12 },

  postCard: { backgroundColor: '#fff', marginHorizontal: 10, marginTop: 10, marginBottom: 5, borderRadius: 16, overflow: 'hidden', elevation: 2, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  postHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingTop: 15, marginBottom: 12 },

  gameCard: { marginHorizontal: 15, marginBottom: 15, backgroundColor: '#020617', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#1e293b', elevation: 5, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 10 },
  gameHeader: { marginBottom: 15, alignItems: 'center' },
  gameTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  gameTitle: { fontSize: 15, fontWeight: '900', marginLeft: 6, letterSpacing: 2, color: '#fff' },
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
  codeBlockGame: { width: '100%', backgroundColor: '#0f172a', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', marginBottom: 15 },
  codeBlockGameText: { color: '#e2e8f0', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 14, lineHeight: 22 },

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

  commentModalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  commentBottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: height * 0.6, paddingBottom: Platform.OS === 'ios' ? 20 : 0, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  commentTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  commentItem: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 10 },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  commentBubble: { flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 16, borderTopLeftRadius: 4 },
  commentAuthor: { fontSize: 13, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  commentText: { fontSize: 14, color: '#334155', lineHeight: 20 },
  noCommentsText: { textAlign: 'center', color: '#94a3b8', marginTop: 40, fontSize: 15, fontWeight: '600' },
  commentInputBox: { flexDirection: 'row', alignItems: 'center', padding: 15, borderTopWidth: 1, borderColor: '#f1f5f9', backgroundColor: '#fff' },
  commentInputAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  commentInput: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10, color: '#0f172a', fontSize: 15 },
  
  emptyFilterState: { alignItems: 'center', marginTop: 40, paddingHorizontal: 40, paddingVertical: 40, backgroundColor: '#fff', marginHorizontal: 15, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  emptyText: { fontSize: 16, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginTop: 15 },
  
  fab: { position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 90, right: 20, zIndex: 100 },
  fabInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
});