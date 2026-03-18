import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, 
  StatusBar, Modal, Alert, ScrollView, Platform, TextInput, KeyboardAvoidingView, Dimensions 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../../firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// --- TYPES ---
type QType = 'single_mcq' | 'multi_mcq' | 'integer';
type QStatus = 'not_visited' | 'not_answered' | 'answered' | 'marked' | 'answered_marked';
interface IQuestion { id: string; subjectId: string; type: QType; qText: string; options: string[]; correctIndices: number[]; numericalAnswer: string; marks: number; negMarks: number; }

export default function AdvancedCBTEngine() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const uid = auth.currentUser?.uid || "anonymous_student";

  const [phase, setPhase] = useState<'LOADING' | 'PLAYING' | 'SUBMITTING'>('LOADING');
  const [examData, setExamData] = useState<any>(null);
  const [globalTimeLeft, setGlobalTimeLeft] = useState<number>(0);
  
  const [activeSubId, setActiveSubId] = useState<string>('');
  const [activeQIndex, setActiveQIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [qStatus, setQStatus] = useState<Record<string, QStatus>>({});
  
  const [isPaletteOpen, setIsPaletteOpen] = useState(false); // 🔥 THE NTA PALETTE STATE
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  
  const cacheKey = `@eduxity_exam_${id}_${uid}`;

  // 1. BOOT ENGINE
  useEffect(() => {
    const bootEngine = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'exams_enterprise', id as string));
        if (!docSnap.exists()) return Alert.alert("Error", "Exam not found.");
        const fetchedExam = { id: docSnap.id, ...docSnap.data() };
        setExamData(fetchedExam);
        if (fetchedExam.subjects?.length > 0) setActiveSubId(fetchedExam.subjects[0].id);

        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          setAnswers(parsed.answers || {}); setQStatus(parsed.qStatus || {}); setGlobalTimeLeft(parsed.timeLeft);
        } else {
          const initStat: Record<string, QStatus> = {};
          (fetchedExam.questions || []).forEach((q: any, idx: number) => initStat[q.id] = idx === 0 ? 'not_answered' : 'not_visited');
          setQStatus(initStat);
          setGlobalTimeLeft(fetchedExam.rules.globalDuration * 60);
        }
        setPhase('PLAYING');
      } catch (error) { Alert.alert("Error", "Failed to boot Exam."); }
    };
    bootEngine();
  }, [id, uid]);

  // 2. TIMER & AUTOSAVE
  useEffect(() => {
    if (phase !== 'PLAYING' || !examData) return;
    const timer = setInterval(() => {
      setGlobalTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); executeFinalSubmit("Time Exhausted"); return 0; }
        return prev - 1;
      });
    }, 1000);
    const autosave = setInterval(async () => await AsyncStorage.setItem(cacheKey, JSON.stringify({ answers, qStatus, timeLeft: globalTimeLeft, timestamp: Date.now() })), 5000);
    return () => { clearInterval(timer); clearInterval(autosave); };
  }, [phase, answers, qStatus, globalTimeLeft]);

  const currentQ = examData?.questions[activeQIndex];

  // 3. NAVIGATION & NTA STATUS LOGIC
  const jumpToQuestion = (index: number) => {
    if (!examData || index === activeQIndex) return;
    Haptics.selectionAsync();
    
    // Auto-mark current as skipped if not answered
    if (currentQ) {
      const ans = answers[currentQ.id];
      const isEmpty = Array.isArray(ans) ? ans.length === 0 : (ans === undefined || ans === '');
      if (isEmpty && qStatus[currentQ.id] === 'not_visited') setQStatus(p => ({ ...p, [currentQ.id]: 'not_answered' }));
    }

    setActiveQIndex(index);
    const nextQ = examData.questions[index];
    if (nextQ.subjectId !== activeSubId) setActiveSubId(nextQ.subjectId);
    if (qStatus[nextQ.id] === 'not_visited' || !qStatus[nextQ.id]) setQStatus(p => ({ ...p, [nextQ.id]: 'not_answered' }));
    setIsPaletteOpen(false); // Close palette if open
  };

  const handleAnswer = (val: any) => {
    if(!currentQ) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAnswers(p => ({ ...p, [currentQ.id]: val }));
  };

  const handleAction = (status: QStatus) => {
    if(!currentQ || !examData) return;
    const ans = answers[currentQ.id];
    const hasAns = Array.isArray(ans) ? ans.length > 0 : (ans !== undefined && ans !== '');
    
    let finalStatus = status;
    if(status === 'answered' && !hasAns) finalStatus = 'not_answered';
    if(status === 'marked' && hasAns) finalStatus = 'answered_marked';

    setQStatus(p => ({ ...p, [currentQ.id]: finalStatus }));
    if (activeQIndex < examData.questions.length - 1) jumpToQuestion(activeQIndex + 1);
    else setIsPaletteOpen(true); // Open palette on last question
  };

  const handleClear = () => {
    if(!currentQ) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newAnswers = { ...answers }; delete newAnswers[currentQ.id];
    setAnswers(newAnswers); setQStatus(p => ({ ...p, [currentQ.id]: 'not_answered' }));
  };

  const executeFinalSubmit = async (reason: string) => {
    setPhase('SUBMITTING'); setShowSubmitConfirm(false); setIsPaletteOpen(false);
    let rawScore = 0;
    examData?.questions.forEach((q: any) => {
      const uAns = answers[q.id];
      if (uAns !== undefined && uAns !== '') {
        let isCorrect = false;
        if (q.type === 'single_mcq') isCorrect = uAns === q.correctIndices[0];
        else if (q.type === 'multi_mcq') isCorrect = JSON.stringify([...uAns].sort()) === JSON.stringify([...q.correctIndices].sort());
        else if (q.type === 'integer') isCorrect = String(uAns).trim() === String(q.numericalAnswer).trim();
        if (isCorrect) rawScore += (q.marks || 4); else rawScore -= (q.negMarks || 1);
      }
    });

    try {
      await setDoc(doc(db, `attempts_enterprise/${id}_${uid}`), {
        examId: id, uid, answers, qStatus, timeLeft: globalTimeLeft, rawScore,
        status: 'EVALUATED', submittedAt: serverTimestamp(), isImmediateResult: examData?.rules.immediateResult ?? true
      });
      await AsyncStorage.removeItem(cacheKey);
      Alert.alert("Exam Submitted 🚀", reason);
      router.replace(`/test-analytics/${id}`); // 🔥 Redirect directly to Analytics!
    } catch (e) { Alert.alert("Error", "Saved offline."); router.replace('/(tabs)/explore'); }
  };

  // --- RENDERERS ---
  const renderPaletteColor = (status: QStatus) => {
    switch(status) {
      case 'answered': return '#10b981'; // Green
      case 'not_answered': return '#ef4444'; // Red
      case 'marked': return '#8b5cf6'; // Purple
      case 'answered_marked': return '#8b5cf6'; // Purple (will add dot in UI)
      default: return '#e2e8f0'; // Gray
    }
  };

  if (phase === 'LOADING') return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* TOP HEADER */}
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>{examData?.title}</Text>
        <View style={styles.timerBox}>
          <Ionicons name="time-outline" size={16} color="#fca5a5" />
          <Text style={styles.timerText}>{Math.floor(globalTimeLeft/60)}:{String(globalTimeLeft%60).padStart(2,'0')}</Text>
        </View>
      </View>

      {/* DYNAMIC SUBJECT TABS */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subTabs}>
        {examData?.subjects.map((s: any) => (
          <TouchableOpacity key={s.id} style={[styles.subTab, activeSubId === s.id && styles.activeSubTab]} onPress={() => {
            setActiveSubId(s.id);
            const firstIdx = examData.questions.findIndex((q: any) => q.subjectId === s.id);
            if(firstIdx !== -1) jumpToQuestion(firstIdx);
          }}>
            <Text style={{color: activeSubId === s.id ? '#fff' : '#64748b', fontWeight:'bold'}}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* QUESTION WORKSPACE */}
      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.workspace} showsVerticalScrollIndicator={false}>
          <View style={styles.qHeader}>
            <Text style={styles.qNum}>Question {activeQIndex + 1}</Text>
            <View style={styles.marksBadge}><Text style={styles.marksTxt}>+{currentQ?.marks} / -{currentQ?.negMarks}</Text></View>
          </View>
          <Text style={styles.qText}>{currentQ?.qText}</Text>

          {/* OPTIONS BUILDER */}
          {currentQ?.type.includes('mcq') && currentQ.options.map((opt: string, idx: number) => {
            const ans = answers[currentQ.id];
            const isSel = currentQ.type === 'single_mcq' ? ans === idx : (Array.isArray(ans) && ans.includes(idx));
            return (
              <TouchableOpacity key={idx} style={[styles.optRow, isSel && styles.optSel]} onPress={() => {
                if (currentQ.type === 'single_mcq') handleAnswer(idx);
                else { const arr = Array.isArray(ans) ? ans : []; handleAnswer(arr.includes(idx) ? arr.filter(i=>i!==idx) : [...arr, idx]); }
              }}>
                <Ionicons name={isSel ? (currentQ.type==='single_mcq'?"radio-button-on":"checkbox") : (currentQ.type==='single_mcq'?"radio-button-off":"square-outline")} size={24} color={isSel ? "#2563eb" : "#94a3b8"} />
                <Text style={[styles.optTxt, isSel && {color:'#1e3a8a', fontWeight:'bold'}]}>{opt}</Text>
              </TouchableOpacity>
            )
          })}

          {/* INTEGER BUILDER */}
          {currentQ?.type === 'integer' && (
            <TextInput style={styles.numInput} keyboardType="numeric" placeholder="Type Numerical Answer..." value={answers[currentQ.id] || ''} onChangeText={handleAnswer} />
          )}
          <View style={{height: 100}} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* NTA STYLE BOTTOM ACTION BAR */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.actionBtnClear} onPress={handleClear}><Text style={styles.clearTxt}>Clear</Text></TouchableOpacity>
        <TouchableOpacity style={styles.actionBtnMark} onPress={()=>handleAction('marked')}><Text style={styles.markTxt}>Mark for Review</Text></TouchableOpacity>
        <TouchableOpacity style={styles.actionBtnSave} onPress={()=>handleAction('answered')}><Text style={styles.saveTxt}>Save & Next</Text></TouchableOpacity>
      </View>

      {/* PALETTE TOGGLE BUTTON (Floating) */}
      <TouchableOpacity style={styles.paletteToggle} onPress={() => setIsPaletteOpen(true)}>
        <Ionicons name="grid" size={24} color="#fff" />
      </TouchableOpacity>

      {/* 🔥 THE NTA PALETTE MODAL */}
      <Modal visible={isPaletteOpen} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <View style={styles.paletteContainer}>
            <View style={styles.paletteHeader}>
              <Text style={styles.paletteTitle}>Question Palette</Text>
              <TouchableOpacity onPress={() => setIsPaletteOpen(false)}><Ionicons name="close-circle" size={28} color="#94a3b8" /></TouchableOpacity>
            </View>
            
            <View style={styles.legendRow}>
              <View style={styles.legendItem}><View style={[styles.legendBox, {backgroundColor: '#10b981'}]} /><Text style={styles.legendTxt}>Answered</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendBox, {backgroundColor: '#ef4444'}]} /><Text style={styles.legendTxt}>Not Answered</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendBox, {backgroundColor: '#8b5cf6'}]} /><Text style={styles.legendTxt}>Marked</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendBox, {backgroundColor: '#e2e8f0'}]} /><Text style={styles.legendTxt}>Not Visited</Text></View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.paletteGrid}>
                {examData?.questions.map((q: any, idx: number) => {
                  const stat = qStatus[q.id] || 'not_visited';
                  const bgCol = renderPaletteColor(stat);
                  const isCurrent = activeQIndex === idx;
                  return (
                    <TouchableOpacity key={q.id} onPress={() => jumpToQuestion(idx)} style={[styles.gridItem, { backgroundColor: bgCol, borderColor: isCurrent ? '#000' : bgCol, borderWidth: isCurrent ? 2 : 0 }]}>
                      <Text style={[styles.gridTxt, {color: stat === 'not_visited' ? '#475569' : '#fff'}]}>{idx + 1}</Text>
                      {stat === 'answered_marked' && <View style={styles.markedDot} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            
            <TouchableOpacity style={styles.finalSubmitBtn} onPress={() => setShowSubmitConfirm(true)}>
              <Text style={styles.finalSubmitTxt}>Submit Final Exam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CONFIRMATION MODAL */}
      <Modal visible={showSubmitConfirm} transparent={true} animationType="fade">
        <View style={styles.modalBgCenter}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Submit Exam?</Text>
            <Text style={styles.confirmSub}>You will not be able to change your answers.</Text>
            <View style={{flexDirection: 'row', gap: 10, marginTop: 20}}>
              <TouchableOpacity style={[styles.actionBtnClear, {flex: 1}]} onPress={() => setShowSubmitConfirm(false)}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtnSave, {flex: 1}]} onPress={() => executeFinalSubmit("User Submitted")}><Text style={{color:'#fff'}}>Yes, Submit</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#0f172a' },
  topTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16, flex: 1 },
  timerBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  timerText: { color: '#fca5a5', fontWeight: 'bold', marginLeft: 5 },
  
  subTabs: { backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0', maxHeight: 50 },
  subTab: { paddingHorizontal: 20, justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeSubTab: { borderBottomColor: '#3b82f6', backgroundColor: '#3b82f6' },

  workspace: { padding: 20 },
  qHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  qNum: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  marksBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  marksTxt: { fontSize: 12, color: '#166534', fontWeight: 'bold' },
  qText: { fontSize: 17, lineHeight: 26, marginBottom: 25, fontWeight: '600', color: '#334155' },

  optRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#cbd5e1', elevation: 1 },
  optSel: { borderColor: '#2563eb', backgroundColor: '#eff6ff', borderWidth: 2 },
  optTxt: { marginLeft: 15, fontSize: 15, flex: 1, color: '#475569' },
  numInput: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#cbd5e1', borderRadius: 12, padding: 20, fontSize: 18, textAlign: 'center', fontWeight: 'bold' },

  bottomBar: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e2e8f0', gap: 8 },
  actionBtnClear: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#f8fafc' },
  actionBtnMark: { flex: 1.5, paddingVertical: 14, alignItems: 'center', borderRadius: 8, backgroundColor: '#8b5cf6' },
  actionBtnSave: { flex: 1.5, paddingVertical: 14, alignItems: 'center', borderRadius: 8, backgroundColor: '#10b981' },
  clearTxt: { fontWeight: '700', color: '#64748b' }, markTxt: { fontWeight: '700', color: '#fff' }, saveTxt: { fontWeight: '700', color: '#fff' },

  paletteToggle: { position: 'absolute', right: 20, bottom: 90, width: 56, height: 56, borderRadius: 28, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', elevation: 8 },
  
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  paletteContainer: { backgroundColor: '#fff', height: height * 0.75, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  paletteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  paletteTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20, backgroundColor: '#f8fafc', padding: 10, borderRadius: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', width: '45%' },
  legendBox: { width: 14, height: 14, borderRadius: 4, marginRight: 8 },
  legendTxt: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  
  paletteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 20 },
  gridItem: { width: 45, height: 45, borderRadius: 8, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  gridTxt: { fontWeight: '900', fontSize: 16 },
  markedDot: { position: 'absolute', bottom: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },

  finalSubmitBtn: { backgroundColor: '#ef4444', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  finalSubmitTxt: { color: '#fff', fontWeight: '900', fontSize: 16 },

  modalBgCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  confirmBox: { backgroundColor: '#fff', padding: 25, borderRadius: 16, width: '100%', alignItems: 'center' },
  confirmTitle: { fontSize: 22, fontWeight: '900', marginBottom: 10 },
  confirmSub: { fontSize: 14, color: '#64748b', textAlign: 'center' }
});