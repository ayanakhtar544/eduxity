import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming, interpolate, Extrapolation } from 'react-native-reanimated';

// --- DATA CONSTANTS ---
const MASTER_PAIRS = [{pId: 'A', t1: "Force", t2: "M × A"}, {pId: 'B', t1: "Power", t2: "Work/Time"}, {pId: 'C', t1: "Ohm's Law", t2: "V = IR"}, {pId: 'D', t1: "Kinetic Energy", t2: "½mv²"}, {pId: 'E', t1: "Water", t2: "H2O"}, {pId: 'F', t1: "Gravity", t2: "9.8 m/s²"}, {pId: 'G', t1: "Speed of Light", t2: "3×10⁸ m/s"}, {pId: 'H', t1: "PI (π)", t2: "3.1415"}, {pId: 'I', t1: "Density", t2: "Mass/Vol"}, {pId: 'J', t1: "Benzene", t2: "C6H6"}, {pId: 'K', t1: "Newton's 3rd", t2: "Action=Reaction"}, {pId: 'L', t1: "Current", t2: "Ampere"}];
const PERIODIC_TABLE = [{ sym: 'H', name: 'Hydrogen' }, { sym: 'He', name: 'Helium' }, { sym: 'Li', name: 'Lithium' }, { sym: 'C', name: 'Carbon' }, { sym: 'N', name: 'Nitrogen' }, { sym: 'O', name: 'Oxygen' }, { sym: 'Na', name: 'Sodium' }, { sym: 'Mg', name: 'Magnesium' }, { sym: 'Fe', name: 'Iron' }, { sym: 'Cu', name: 'Copper' }, { sym: 'Zn', name: 'Zinc' }, { sym: 'Ag', name: 'Silver' }, { sym: 'Au', name: 'Gold' }, { sym: 'Hg', name: 'Mercury' }, { sym: 'Pb', name: 'Lead' }, { sym: 'K', name: 'Potassium' }];
const SI_UNITS = [{ q: 'Force', u: 'Newton (N)' }, { q: 'Work / Energy', u: 'Joule (J)' }, { q: 'Power', u: 'Watt (W)' }, { q: 'Pressure', u: 'Pascal (Pa)' }, { q: 'Electric Current', u: 'Ampere (A)' }, { q: 'Resistance', u: 'Ohm (Ω)' }, { q: 'Capacitance', u: 'Farad (F)' }, { q: 'Inductance', u: 'Henry (H)' }, { q: 'Magnetic Flux', u: 'Weber (Wb)' }, { q: 'Magnetic Field', u: 'Tesla (T)' }, { q: 'Frequency', u: 'Hertz (Hz)' }, { q: 'Luminous Intensity', u: 'Candela (cd)' }];
const SCIENCE_WORDS = ["KINEMATICS", "GRAVITATION", "FRICTION", "MOMENTUM", "ELECTRON", "PROTON", "ISOTOPE", "TITRATION", "POLYGON", "CALCULUS", "ALGEBRA", "GENETICS", "BOTANY"];
const BIO_FACTS = [{ q: "Mitochondria is the powerhouse of the cell.", ans: true }, { q: "Humans have 24 pairs of chromosomes.", ans: false }, { q: "DNA contains Uracil.", ans: false }, { q: "Arteries carry oxygenated blood.", ans: true }, { q: "Photosynthesis occurs in mitochondria.", ans: false }, { q: "White blood cells fight infections.", ans: true }];
const CODE_SNIPPETS = [{ code: "const name = 'John'\nconsole.log(name)", bug: "Missing Semicolon", ans: "Missing Semicolon" }, { code: "if (x = 10) {\n  return true;\n}", bug: "Used = instead of ==", ans: "Assignment in IF" }, { code: "let arr = [1,2,3];\nconsole.log(arr[3]);", bug: "Out of bounds", ans: "Index Out of Bounds" }, { code: "const add = (a, b) => a + b;\nadd(5);", bug: "Missing Argument", ans: "Missing Argument" }];

// --- GAMES ---
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

export const BrainMatchGame = () => {
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

export const SpeedMathGame = () => {
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

export const GuessElementGame = () => {
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

export const UnitMasterGame = () => {
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

export const SeriesSolverGame = () => {
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

export const WordScrambleGame = () => {
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

export const EquationBalancerGame = () => {
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

export const VectorDashGame = () => {
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

export const BioTimeAttackGame = () => {
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

export const BugHunterGame = () => {
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

// --- STYLES FOR GAMES ---
const styles = StyleSheet.create({
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
  codeBlockGameText: { color: '#e2e8f0', fontSize: 14, lineHeight: 22 },
});