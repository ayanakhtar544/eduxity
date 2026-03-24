import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { awardXP } from '../../helpers/gamificationEngine';

export default function LiveTestModal({ activeTest, onClose, groupId }: any) {
  const [testAnswers, setTestAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [hasStarted, setHasStarted] = useState(false); // 🔥 BUG FIX: Naya Flag

  // 1. Initialize Test
  useEffect(() => {
    if (activeTest) {
      setTestAnswers(new Array(activeTest.questions.length).fill(-1));
      setTimeLeft(activeTest.duration * 60); // Time set karo
      setHasStarted(true); // Flag ko true karo (ab timer check kar sakta hai)
    } else {
      setHasStarted(false);
    }
  }, [activeTest]);

  // 2. The Timer Engine
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    // 🔥 FIX: Ab timer tabhi submit karega jab hasStarted true hoga
    if (hasStarted && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (hasStarted && timeLeft === 0) {
      submitTest();
      setHasStarted(false); // Multiple submit block karne ke liye
    }
    
    return () => clearInterval(timer);
  }, [hasStarted, timeLeft]);

  const submitTest = async () => {
    if (!activeTest || !auth.currentUser) return;
    let score = 0;
    
    // 🔥 SAFE CHECK: Number comparison taaki bug na aaye
    activeTest.questions.forEach((q: any, idx: number) => { 
      if (Number(testAnswers[idx]) === Number(q.correct)) {
        score++; 
      }
    });
    
    await updateDoc(doc(db, 'groups', groupId, 'messages', activeTest.id), { 
      [`responses.${auth.currentUser.uid}`]: { score, answers: testAnswers } 
    });
    
    const earnedXP = score * 15;
    const reward = await awardXP(auth.currentUser.uid, earnedXP, "Test Submitted");
    
    if (reward?.leveledUp) {
      Alert.alert("🎉 TEST SUBMITTED & LEVEL UP!", `Score: ${score}/${activeTest.questions.length}\nLevel Reached: ${reward.newLevel} ⭐`);
    } else {
      Alert.alert("Test Submitted! 🎉", `Your score is ${score} out of ${activeTest.questions.length}\nYou earned +${earnedXP} XP!`);
    }
    onClose();
  };

  if (!activeTest) return null;

  return (
    <Modal visible={!!activeTest} animationType="slide">
      <SafeAreaView style={{flex: 1, backgroundColor: '#f8fafc'}}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{activeTest.title}</Text>
          <View style={styles.timerBadge}>
            <Text style={styles.timerText}>{Math.floor(timeLeft / 60)}:{('0' + (timeLeft % 60)).slice(-2)}</Text>
          </View>
        </View>
        <ScrollView style={{padding: 20}}>
          {activeTest.questions.map((q: any, qIdx: number) => (
            <View key={qIdx} style={styles.questionCard}>
              <Text style={styles.questionText}>{qIdx + 1}. {q.q}</Text>
              {q.options.map((opt: string, oIdx: number) => (
                <TouchableOpacity key={oIdx} style={[styles.mcqOption, testAnswers[qIdx] === oIdx && styles.mcqOptionActive]} 
                  onPress={() => { const newAns = [...testAnswers]; newAns[qIdx] = oIdx; setTestAnswers(newAns); }}>
                  <Ionicons name={testAnswers[qIdx] === oIdx ? "radio-button-on" : "radio-button-off"} size={20} color={testAnswers[qIdx] === oIdx ? "#2563eb" : "#94a3b8"} style={{marginRight: 10}} />
                  <Text style={styles.optionText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
          <TouchableOpacity style={styles.submitBtn} onPress={submitTest}>
            <Text style={styles.submitBtnText}>Submit Test</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', flex: 1 },
  timerBadge: { backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginLeft: 10 },
  timerText: { color: '#ef4444', fontWeight: '900', fontSize: 16 },
  questionCard: { marginBottom: 30, backgroundColor: '#fff', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  questionText: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 15 },
  mcqOption: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  mcqOptionActive: { backgroundColor: '#dbeafe', borderColor: '#3b82f6' },
  optionText: { fontSize: 15, color: '#334155', fontWeight: '600', flex: 1 },
  submitBtn: { backgroundColor: '#2563eb', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 50 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});