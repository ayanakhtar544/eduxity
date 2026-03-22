import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export const InfiniteCircuitGame = () => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<number[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  const generateInfiniteProblem = () => {
    // Randomly choose Series or Parallel
    const isSeries = Math.random() > 0.5;
    const r1 = Math.floor(Math.random() * 10) + 2; // 2 to 11 ohms
    const r2 = Math.floor(Math.random() * 10) + 2; 
    
    let ans = 0;
    if (isSeries) {
      ans = r1 + r2;
      setQuestion(`${r1}Ω & ${r2}Ω in Series`);
    } else {
      // Keep it simple for integers
      ans = parseFloat(((r1 * r2) / (r1 + r2)).toFixed(1));
      setQuestion(`${r1}Ω & ${r2}Ω in Parallel`);
    }
    
    setCorrectAnswer(ans);

    let opts = new Set<number>([ans]);
    while (opts.size < 4) {
      let fake = ans + (Math.floor(Math.random() * 10) - 5);
      if (fake > 0) opts.add(parseFloat(fake.toFixed(1)));
    }
    setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
  };

  useEffect(() => { generateInfiniteProblem(); }, []);

  const handleAnswer = (opt: number) => {
    if (opt === correctAnswer) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScore(s => s + 10);
      setStreak(s => s + 1);
      generateInfiniteProblem(); // Infinite Loop!
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStreak(0);
    }
  };

  return (
    <Animated.View entering={FadeInDown.springify()} style={[styles.gameCard, { borderColor: '#3b82f6' }]}>
      <View style={styles.gameHeader}>
        <View style={styles.titleRow}>
          <Ionicons name="hardware-chip" size={20} color="#3b82f6" />
          <Text style={[styles.titleText, { color: '#3b82f6' }]}>CIRCUIT MASTER (JEE)</Text>
        </View>
        <Text style={styles.scoreText}>Score: {score} 🔥 Streak: {streak}</Text>
      </View>
      
      <View style={styles.playArea}>
        <Text style={styles.qText}>Net Resistance?</Text>
        <Text style={styles.circuitText}>{question}</Text>
        
        <View style={styles.grid}>
          {options.map((opt, i) => (
            <TouchableOpacity key={i} style={[styles.optionBtn, { borderColor: '#3b82f6' }]} onPress={() => handleAnswer(opt)}>
              <Text style={styles.optionText}>{opt} Ω</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  gameCard: { marginHorizontal: 15, marginBottom: 15, backgroundColor: '#0f172a', borderRadius: 20, padding: 20, borderWidth: 1, elevation: 5 },
  gameHeader: { marginBottom: 15, alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  titleText: { fontSize: 14, fontWeight: '900', marginLeft: 6, letterSpacing: 1 },
  scoreText: { color: '#fde047', fontSize: 12, fontWeight: '700', marginTop: 5 },
  playArea: { alignItems: 'center' },
  qText: { color: '#94a3b8', fontSize: 14, marginBottom: 5 },
  circuitText: { fontSize: 24, fontWeight: '900', color: '#f8fafc', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, width: '100%' },
  optionBtn: { width: '48%', backgroundColor: '#1e293b', paddingVertical: 15, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  optionText: { color: '#f8fafc', fontSize: 16, fontWeight: '800' }
});