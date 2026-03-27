import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, Alert, AppState, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db, auth } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🔥 IMPORTING MODULAR UI COMPONENTS
import ExamInstructions from '../../components/exam-engine/Instructions';
import PlayingUI from '../../components/exam-engine/PlayingUI';

export type QStatus = 'not_visited' | 'not_answered' | 'answered' | 'marked' | 'answered_marked';

export default function NtaExamEngine() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const uid = auth.currentUser?.uid || "anonymous";
  const appState = useRef(AppState.currentState);

  // 🧠 CORE STATES
  const [phase, setPhase] = useState<'LOADING' | 'INSTRUCTIONS' | 'PLAYING' | 'SUBMITTING'>('LOADING');
  const [examData, setExamData] = useState<any>(null);
  const [globalTimeLeft, setGlobalTimeLeft] = useState<number>(0);
  
  // 🎮 PLAYING STATES
  const [activeSubId, setActiveSubId] = useState<string>('');
  const [activeQIndex, setActiveQIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [qStatus, setQStatus] = useState<Record<string, QStatus>>({});

  const cacheKey = `@eduxity_exam_${id}_${uid}`;

  // 1. BOOT ENGINE
  useEffect(() => {
    const boot = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'exams_enterprise', id as string));
        if (!docSnap.exists()) {
          Alert.alert("Error", "Exam not found.");
          router.back();
          return;
        }
        const data = { id: docSnap.id, ...docSnap.data() };
        setExamData(data);
        if (data.subjects?.length > 0) setActiveSubId(data.subjects[0].id);
        setPhase('INSTRUCTIONS');
      } catch (error) {
        Alert.alert("Error", "Failed to load exam."); 
        router.back();
      }
    };
    if (id) boot();
  }, [id]);

  // 2. START TEST LOGIC
  const handleStartTest = async () => {
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        setAnswers(parsed.answers || {}); 
        setQStatus(parsed.qStatus || {}); 
        setGlobalTimeLeft(parsed.timeLeft);
      } else {
        const initStat: Record<string, QStatus> = {};
        if (examData?.questions) {
           examData.questions.forEach((q: any, idx: number) => {
             initStat[q.id] = idx === 0 ? 'not_answered' : 'not_visited';
           });
        }
        setQStatus(initStat);
        // Default to 180 mins (10800 seconds) if not specified
        setGlobalTimeLeft(examData?.rules?.globalDuration ? examData.rules.globalDuration * 60 : 10800);
      }
      setPhase('PLAYING');
    } catch (e) {
      console.log("Error starting test:", e);
      Alert.alert("Error", "Failed to start test properly.");
    }
  };

  // 3. TIMER & ANTI-CHEAT (Background Logic)
  useEffect(() => {
    if (phase !== 'PLAYING' || !examData) return;

    // Timer logic
    const timer = setInterval(() => {
      setGlobalTimeLeft(prev => {
        if (prev <= 1) { 
          clearInterval(timer); 
          executeFinalSubmit("Time's Up!"); 
          return 0; 
        }
        return prev - 1;
      });
    }, 1000);

    // Autosave logic
    const autosave = setInterval(async () => {
      try {
        await AsyncStorage.setItem(cacheKey, JSON.stringify({ answers, qStatus, timeLeft: globalTimeLeft }));
      } catch (e) {
        console.log("Autosave failed", e);
      }
    }, 5000);

    // Anti-cheat logic
    let subscription: any;
    if (examData.rules?.isStrict) {
      subscription = AppState.addEventListener('change', nextAppState => {
        if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
          executeFinalSubmit("Anti-Cheat Violation: App Minimized.");
        }
        appState.current = nextAppState;
      });
    }

    return () => { 
      clearInterval(timer); 
      clearInterval(autosave); 
      if (subscription) subscription.remove(); 
    };
  }, [phase, examData, answers, qStatus, globalTimeLeft]);

  // 4. THE EVALUATOR & SUBMIT
  const executeFinalSubmit = async (reason: string) => {
    setPhase('SUBMITTING');
    let rawScore = 0;
    
    // Partial marking & negative marking calculation
    if (examData?.questions) {
      examData.questions.forEach((q: any) => {
        const uAns = answers[q.id];
        const hasAnswered = uAns !== undefined && uAns !== '' && (!Array.isArray(uAns) || uAns.length > 0);
        
        if (hasAnswered) {
          if (q.type === 'single_mcq') {
            if (uAns === q.correctIndices?.[0]) rawScore += (q.marks || 4); 
            else rawScore -= (q.negMarks || 1);
          } else if (q.type === 'integer') {
            if (String(uAns).trim() === String(q.numericalAnswer).trim()) rawScore += (q.marks || 4); 
            else rawScore -= (q.negMarks || 1);
          } else if (q.type === 'multi_mcq') {
            const correctAns = q.correctIndices || []; 
            const userAns = uAns as number[];
            const isFullyCorrect = correctAns.length === userAns.length && correctAns.every((val:number) => userAns.includes(val));
            const hasIncorrectOption = userAns.some((val:number) => !correctAns.includes(val));

            if (isFullyCorrect) {
              rawScore += (q.marks || 4);
            } else if (hasIncorrectOption) {
              rawScore -= (q.negMarks || 1);
            } else if (q.allowPartialMarking) {
              // Basic partial marking: +1 for each correct option chosen (assuming no incorrect options chosen)
              rawScore += userAns.length;
            }
          }
        }
      });
    }

    try {
      if (uid !== "anonymous") {
        const testRef = doc(db, 'exams_enterprise', id as string);
        const testSnap = await getDoc(testRef);
        const existingResp = testSnap.data()?.responses?.[uid];
        let pastAttempts = existingResp?.pastAttempts || [];
        
        if (existingResp?.submittedAt) {
           pastAttempts.push({ 
             score: existingResp.score, 
             answers: existingResp.answers, 
             submittedAt: existingResp.submittedAt, 
             attemptNum: pastAttempts.length + 1 
           });
        }

        await updateDoc(testRef, {
          [`responses.${uid}`]: { 
            score: rawScore, 
            answers, 
            submittedAt: serverTimestamp(), 
            pastAttempts, 
            currentAttemptNum: pastAttempts.length + 1 
          }
        });
      }

      await AsyncStorage.removeItem(cacheKey);
      Alert.alert("Exam Submitted 🚀", reason);
      router.replace(`/test-analytics/${id}`); 
    } catch (e) { 
      console.log("Submit Error:", e);
      Alert.alert("Error", "Upload failed, but your answers are saved locally."); 
      router.replace('/tests'); 
    }
  };

  // --- RENDERING MODULAR COMPONENTS ---
  if (phase === 'LOADING') return <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><ActivityIndicator size="large" color="#4f46e5" /></View>;
  if (phase === 'SUBMITTING') return <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><ActivityIndicator size="large" color="#ef4444" /><Text style={{marginTop: 10, fontWeight: 'bold'}}>Evaluating Result...</Text></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
      {phase === 'INSTRUCTIONS' && (
        <ExamInstructions examData={examData} onStart={handleStartTest} />
      )}
      
      {phase === 'PLAYING' && (
        <PlayingUI 
          examData={examData} 
          globalTimeLeft={globalTimeLeft}
          activeSubId={activeSubId} 
          setActiveSubId={setActiveSubId}
          activeQIndex={activeQIndex} 
          setActiveQIndex={setActiveQIndex}
          answers={answers} 
          setAnswers={setAnswers}
          qStatus={qStatus} 
          setQStatus={setQStatus}
          onSubmit={() => executeFinalSubmit("User Submitted")}
        />
      )}
    </View>
  );
}