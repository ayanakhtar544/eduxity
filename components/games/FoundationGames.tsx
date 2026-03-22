import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const FORMULA_BANK = [
  { q: "Area of a Circle?", a: "πr²", fakes: ["2πr", "πd", "4πr²"] },
  { q: "Newton's Second Law?", a: "F = ma", fakes: ["F = mv", "P = mv", "W = Fd"] },
  { q: "Ohm's Law?", a: "V = IR", fakes: ["I = VR", "R = VI", "P = VI"] },
  { q: "Pythagoras Theorem?", a: "a² + b² = c²", fakes: ["a + b = c", "a² - b² = c²", "2a + 2b = 2c"] },
  { q: "Chemical Formula of Water?", a: "H₂O", fakes: ["HO₂", "H₂O₂", "OH"] },
  { q: "Kinetic Energy?", a: "½mv²", fakes: ["mgh", "mv", "½ma²"] },
  { q: "Density?", a: "Mass / Volume", fakes: ["Volume / Mass", "Weight × Volume", "Mass × Gravity"] },
  { q: "Speed?", a: "Distance / Time", fakes: ["Time / Distance", "Mass × Acc.", "Work / Time"] },
  { q: "Sulphuric Acid?", a: "H₂SO₄", fakes: ["HCl", "NaCl", "HNO₃"] }
];

export const FormulaNinjaGame = () => {
  const [currentQ, setCurrentQ] = useState<any>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  const nextQuestion = () => {
    const randomQ = FORMULA_BANK[Math.floor(Math.random() * FORMULA_BANK.length)];
    setCurrentQ(randomQ);
    const opts = [randomQ.a, ...randomQ.fakes].sort(() => Math.random() - 0.5);
    setOptions(opts);
  };

  useEffect(() => { nextQuestion(); }, []);

  const handleAnswer = (opt: string) => {
    if (opt === currentQ.a) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScore(s => s + 10);
      setStreak(s => s + 1);
      nextQuestion(); // Infinite Loop
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStreak(0);
      nextQuestion(); 
    }
  };

  if (!currentQ) return null;

  return (
    <Animated.View entering={FadeInDown.springify()} style={[styles.gameCard, { borderColor: '#f97316' }]}>
      <View style={styles.gameHeader}>
        <View style={styles.gameTitleRow}>
          <Ionicons name="flash" size={20} color="#f97316" />
          <Text style={[styles.gameTitle, { color: '#f97316' }]}>FORMULA NINJA</Text>
        </View>
        <Text style={styles.scoreText}>Score: {score} 🔥 Streak: {streak}</Text>
      </View>
      <View style={styles.playArea}>
        <Text style={styles.questionText}>{currentQ.q}</Text>
        <View style={styles.grid}>
          {options.map((opt, i) => (
            <TouchableOpacity key={i} style={[styles.optionBtn, { borderColor: '#f97316', width: '100%', marginBottom: 10 }]} onPress={() => handleAnswer(opt)}>
              <Text style={styles.optionText}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

export const AlgebraSprintGame = () => {
  const [equation, setEquation] = useState("");
  const [options, setOptions] = useState<number[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [score, setScore] = useState(0);

  const generateEquation = () => {
    const x = Math.floor(Math.random() * 10) + 1; 
    const a = Math.floor(Math.random() * 5) + 2;  
    const b = Math.floor(Math.random() * 20) + 1; 
    const c = (a * x) + b;

    setEquation(`${a}x + ${b} = ${c}`);
    setCorrectAnswer(x);

    let opts = new Set<number>([x]);
    while (opts.size < 4) {
      let fake = x + (Math.floor(Math.random() * 7) - 3);
      if (fake > 0 && fake !== x) opts.add(fake);
    }
    setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
  };

  useEffect(() => { generateEquation(); }, []);

  const handleAnswer = (opt: number) => {
    if (opt === correctAnswer) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScore(s => s + 5);
      generateEquation(); // Infinite Loop
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setScore(0); 
      generateEquation(); 
    }
  };

  return (
    <Animated.View entering={FadeInDown.springify()} style={[styles.gameCard, { borderColor: '#ec4899' }]}>
      <View style={styles.gameHeader}>
        <View style={styles.gameTitleRow}>
          <Ionicons name="infinite" size={20} color="#ec4899" />
          <Text style={[styles.gameTitle, { color: '#ec4899' }]}>ALGEBRA SPRINT</Text>
        </View>
        <Text style={[styles.scoreText, { color: '#ec4899' }]}>Points: {score}</Text>
      </View>
      <View style={styles.playArea}>
        <Text style={styles.subText}>Find the value of x</Text>
        <Text style={[styles.questionText, { fontSize: 32 }]}>{equation}</Text>
        <View style={styles.grid}>
          {options.map((opt, i) => (
            <TouchableOpacity key={i} style={[styles.optionBtn, { borderColor: '#ec4899' }]} onPress={() => handleAnswer(opt)}>
              <Text style={styles.optionText}>x = {opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  gameCard: { marginHorizontal: 15, marginBottom: 15, backgroundColor: '#020617', borderRadius: 20, padding: 20, borderWidth: 1, elevation: 5 },
  gameHeader: { marginBottom: 15, alignItems: 'center' },
  gameTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  gameTitle: { fontSize: 15, fontWeight: '900', marginLeft: 6, letterSpacing: 2, color: '#fff' },
  scoreText: { color: '#fde047', fontSize: 12, fontWeight: '700', marginTop: 5 },
  playArea: { alignItems: 'center', width: '100%' },
  subText: { color: '#94a3b8', fontSize: 13, marginBottom: 5, fontWeight: '600' },
  questionText: { fontSize: 20, fontWeight: '800', color: '#f8fafc', marginBottom: 20, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, width: '100%' },
  optionBtn: { width: '48%', backgroundColor: '#0f172a', paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  optionText: { color: '#f8fafc', fontSize: 15, fontWeight: '800' }
});