import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';

export default function LiveTestModal({ activeTest, onClose, groupId }: any) {
  const [testAnswers, setTestAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (activeTest) {
      // Shuru mein sabhi answers -1 (Unattempted) hain
      setTestAnswers(new Array(activeTest.questions.length).fill(-1));
      setTimeLeft(activeTest.duration * 60); 
      setHasStarted(true); 
    } else {
      setHasStarted(false);
    }
  }, [activeTest]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (hasStarted && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (hasStarted && timeLeft === 0) {
      submitTest();
      setHasStarted(false);
    }
    return () => clearInterval(timer);
  }, [hasStarted, timeLeft]);

  const toggleOption = (qIdx: number, oIdx: number) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newAns = [...testAnswers];
    // Agar same option dobara dabaya toh clear/unattempt kar do
    if (newAns[qIdx] === oIdx) {
      newAns[qIdx] = -1;
    } else {
      newAns[qIdx] = oIdx;
    }
    setTestAnswers(newAns);
  };

  const submitTest = async () => {
    if (!activeTest || !auth.currentUser) return;
    
    // 🔥 NAYA ADVANCED MARKING ENGINE
    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    
    activeTest.questions.forEach((q: any, idx: number) => { 
      const posMarks = parseInt(q.posMarks) || 4;
      const negMarks = parseInt(q.negMarks) || 0;
      
      const selectedAns = Number(testAnswers[idx]);
      
      if (selectedAns === -1) {
        skippedCount++;
      } else if (selectedAns === Number(q.correct)) {
        score += posMarks; 
        correctCount++;
      } else {
        score -= negMarks; // Negative Marking Applied
        wrongCount++;
      }
    });

    const maxMarks = activeTest.questions.reduce((sum: number, q: any) => sum + (parseInt(q.posMarks) || 4), 0);
    
    await updateDoc(doc(db, 'groups', groupId, 'messages', activeTest.id), { 
      [`responses.${auth.currentUser.uid}`]: { 
        score, 
        correctCount,
        wrongCount,
        skippedCount,
        answers: testAnswers 
      } 
    });
    
    const earnedXP = correctCount * 20; // Correct questions pe XP
    const reward = await awardXP(auth.currentUser.uid, earnedXP, "Premium Test Submitted");
    
    if (reward?.leveledUp) {
      Alert.alert("🎉 EXAM SUBMITTED & LEVEL UP!", `Score: ${score}/${maxMarks}\nCorrect: ${correctCount} | Wrong: ${wrongCount}\nNew Level: ${reward.newLevel}`);
    } else {
      Alert.alert("Exam Submitted! 📝", `Your score is ${score} out of ${maxMarks}.\nCorrect: ${correctCount} | Wrong: ${wrongCount}\nYou earned +${earnedXP} XP!`);
    }
    onClose();
  };

  if (!activeTest) return null;

  return (
    <Modal visible={!!activeTest} animationType="slide">
      <SafeAreaView style={{flex: 1, backgroundColor: '#f1f5f9'}}>
        
        {/* PREMIUM HEADER */}
        <View style={styles.modalHeader}>
          <View style={{flex: 1}}>
            <Text style={styles.modalTitle} numberOfLines={1}>{activeTest.title}</Text>
            {activeTest.ntaFormat && <Text style={styles.ntaSub}>NTA Strict Marking Enabled</Text>}
          </View>
          <View style={styles.timerBadge}>
            <Ionicons name="time" size={16} color="#ef4444" style={{marginRight: 4}}/>
            <Text style={styles.timerText}>{Math.floor(timeLeft / 60)}:{('0' + (timeLeft % 60)).slice(-2)}</Text>
          </View>
        </View>

        <ScrollView style={{padding: 20}} showsVerticalScrollIndicator={false}>
          {activeTest.questions.map((q: any, qIdx: number) => {
            const isAttempted = testAnswers[qIdx] !== -1;
            return (
              <View key={qIdx} style={[styles.questionCard, isAttempted && {borderColor: '#c7d2fe'}]}>
                <View style={styles.qHeader}>
                  <Text style={styles.qNumber}>Question {qIdx + 1}</Text>
                  <View style={styles.markingPill}>
                    <Text style={styles.markPos}>+{q.posMarks || 4}</Text>
                    <Text style={styles.markNeg}>-{q.negMarks || 0}</Text>
                  </View>
                </View>
                
                <Text style={styles.questionText}>{q.q}</Text>
                
                {q.options.map((opt: string, oIdx: number) => {
                  const isSelected = testAnswers[qIdx] === oIdx;
                  return (
                    <TouchableOpacity 
                      key={oIdx} 
                      activeOpacity={0.7}
                      style={[styles.mcqOption, isSelected && styles.mcqOptionActive]} 
                      onPress={() => toggleOption(qIdx, oIdx)}
                    >
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                      <Text style={[styles.optionText, isSelected && {color: '#1e3a8a', fontWeight: '800'}]}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}
                
                {/* CLEAR SELECTION BUTTON */}
                {isAttempted && (
                  <TouchableOpacity onPress={() => toggleOption(qIdx, testAnswers[qIdx])} style={styles.clearBtn}>
                    <Text style={styles.clearBtnText}>Clear Selection</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
          
          <TouchableOpacity style={styles.submitBtn} onPress={submitTest} activeOpacity={0.9}>
            <Text style={styles.submitBtnText}>FINISH EXAM</Text>
          </TouchableOpacity>
          <View style={{height: 40}}/>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset:{width:0, height:2}, shadowOpacity: 0.05, shadowRadius: 5, elevation: 3 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  ntaSub: { fontSize: 11, fontWeight: '700', color: '#f59e0b', marginTop: 2, textTransform: 'uppercase' },
  timerBadge: { backgroundColor: '#fef2f2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginLeft: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#fecaca' },
  timerText: { color: '#ef4444', fontWeight: '900', fontSize: 16, fontVariant: ['tabular-nums'] },
  
  questionCard: { marginBottom: 25, backgroundColor: '#fff', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  qHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  qNumber: { fontSize: 14, fontWeight: '900', color: '#64748b', textTransform: 'uppercase' },
  markingPill: { flexDirection: 'row', backgroundColor: '#f8fafc', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  markPos: { backgroundColor: '#dcfce7', color: '#059669', fontWeight: '900', fontSize: 12, paddingHorizontal: 8, paddingVertical: 4 },
  markNeg: { backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: '900', fontSize: 12, paddingHorizontal: 8, paddingVertical: 4 },
  
  questionText: { fontSize: 17, fontWeight: '800', color: '#0f172a', marginBottom: 20, lineHeight: 24 },
  
  mcqOption: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  mcqOptionActive: { backgroundColor: '#eef2ff', borderColor: '#818cf8' },
  radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#cbd5e1', marginRight: 15, justifyContent: 'center', alignItems: 'center' },
  radioCircleActive: { borderColor: '#4f46e5' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4f46e5' },
  optionText: { fontSize: 15, color: '#334155', fontWeight: '600', flex: 1 },
  
  clearBtn: { alignSelf: 'flex-end', marginTop: 10 },
  clearBtnText: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },

  submitBtn: { backgroundColor: '#4f46e5', paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginTop: 15, shadowColor: '#4f46e5', shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  submitBtnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1 }
});