import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// Massive Array that loops infinitely
const BIO_BANK = [
  { q: "Powerhouse of the cell?", a: "Mitochondria", f1: "Nucleus", f2: "Ribosome" },
  { q: "Universal Blood Donor?", a: "O Negative", f1: "AB Positive", f2: "A Negative" },
  { q: "Longest bone in human body?", a: "Femur", f1: "Tibia", f2: "Humerus" },
  { q: "Which gas do plants release?", a: "Oxygen", f1: "CO2", f2: "Nitrogen" },
  // Tu yahan 50-100 questions daal sakta hai
];

export const InfiniteBioGame = () => {
  const [currentQ, setCurrentQ] = useState<any>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);

  const nextQuestion = () => {
    const randomQ = BIO_BANK[Math.floor(Math.random() * BIO_BANK.length)];
    setCurrentQ(randomQ);
    setOptions([randomQ.a, randomQ.f1, randomQ.f2].sort(() => Math.random() - 0.5));
  };

  useEffect(() => { nextQuestion(); }, []);

  const handleAnswer = (opt: string) => {
    if (opt === currentQ.a) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScore(s => s + 5);
      nextQuestion(); // Infinite Loop!
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setScore(0); // Penalty for NEET!
      nextQuestion(); 
    }
  };

  if (!currentQ) return null;

  return (
    <Animated.View entering={FadeInDown.springify()} style={[styles.gameCard, { borderColor: '#10b981' }]}>
      <View style={styles.gameHeader}>
        <View style={styles.titleRow}>
          <Ionicons name="leaf" size={20} color="#10b981" />
          <Text style={[styles.titleText, { color: '#10b981' }]}>BIO RAPID FIRE (NEET)</Text>
        </View>
        <Text style={styles.scoreText}>Score: {score}</Text>
      </View>
      
      <View style={styles.playArea}>
        <Text style={styles.circuitText}>{currentQ.q}</Text>
        
        {options.map((opt, i) => (
          <TouchableOpacity key={i} style={[styles.optionBtn, { borderColor: '#10b981', width: '100%', marginBottom: 10 }]} onPress={() => handleAnswer(opt)}>
            <Text style={styles.optionText}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  gameCard: { marginHorizontal: 15, marginBottom: 15, backgroundColor: '#020617', borderRadius: 20, padding: 20, borderWidth: 1, elevation: 5 },
  gameHeader: { marginBottom: 15, alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  titleText: { fontSize: 14, fontWeight: '900', marginLeft: 6, letterSpacing: 1 },
  scoreText: { color: '#10b981', fontSize: 12, fontWeight: '700', marginTop: 5 },
  playArea: { alignItems: 'center', width: '100%' },
  circuitText: { fontSize: 20, fontWeight: '900', color: '#f8fafc', marginBottom: 20, textAlign: 'center' },
  optionBtn: { backgroundColor: '#0f172a', paddingVertical: 15, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  optionText: { color: '#f8fafc', fontSize: 15, fontWeight: '700' }
});