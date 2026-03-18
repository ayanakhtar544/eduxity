import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, SafeAreaView, 
  TouchableOpacity, ActivityIndicator, Dimensions 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const { width } = Dimensions.get('window');

// ============================================================================
// 🧠 TYPESCRIPT INTERFACES
// ============================================================================
type QType = 'single_mcq' | 'multi_mcq' | 'integer';
type QStatus = 'not_visited' | 'not_answered' | 'answered' | 'marked' | 'answered_marked';

interface ISubject { id: string; name: string; timeLimit: number; }
interface IQuestion {
  id: string; subjectId: string; type: QType; qText: string; 
  options: string[]; correctIndices: number[]; numericalAnswer: string; 
  marks: number; negMarks: number;
}
interface IExamData { title: string; subjects: ISubject[]; questions: IQuestion[]; }
interface IAttemptData { rawScore: number; answers: Record<string, any>; qStatus: Record<string, QStatus>; timeLeft: number; }

// ============================================================================
// 🚀 THE ANALYTICS DASHBOARD ENGINE
// ============================================================================
export default function AdvancedTestAnalytics() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const uid = auth.currentUser?.uid || "anonymous_student";

  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<IExamData | null>(null);
  const [attempt, setAttempt] = useState<IAttemptData | null>(null);

  // 1. DATA FETCHING
  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const attemptRef = doc(db, `attempts_enterprise/${id}_${uid}`);
        const examRef = doc(db, 'exams_enterprise', id as string);

        const [attSnap, exSnap] = await Promise.all([getDoc(attemptRef), getDoc(examRef)]);

        if (attSnap.exists() && exSnap.exists()) {
          setAttempt(attSnap.data() as IAttemptData);
          setExam(exSnap.data() as IExamData);
        }
      } catch (e) { console.error(e); } 
      finally { setLoading(false); }
    };
    fetchPerformance();
  }, [id, uid]);

  // 2. DEEP COMPUTATION ENGINE
  const stats = useMemo(() => {
    if (!exam || !attempt) return null;
    
    let correct = 0; let incorrect = 0; let unattempted = 0; let maxScore = 0;
    const subjectWise: Record<string, { c: number, i: number, u: number, name: string }> = {};

    // Initialize Subject Stats
    exam.subjects.forEach(s => subjectWise[s.id] = { c: 0, i: 0, u: 0, name: s.name });

    exam.questions.forEach(q => {
      maxScore += (q.marks || 4);
      const uAns = attempt.answers[q.id];
      const isAnsEmpty = Array.isArray(uAns) ? uAns.length === 0 : (uAns === undefined || uAns === '');

      if (isAnsEmpty) {
        unattempted++;
        if(subjectWise[q.subjectId]) subjectWise[q.subjectId].u++;
      } else {
        let isCorrect = false;
        if (q.type === 'single_mcq') isCorrect = uAns === q.correctIndices[0];
        else if (q.type === 'multi_mcq') isCorrect = JSON.stringify([...uAns].sort()) === JSON.stringify([...q.correctIndices].sort());
        else if (q.type === 'integer') isCorrect = String(uAns).trim() === String(q.numericalAnswer).trim();
        
        if (isCorrect) {
          correct++;
          if(subjectWise[q.subjectId]) subjectWise[q.subjectId].c++;
        } else {
          incorrect++;
          if(subjectWise[q.subjectId]) subjectWise[q.subjectId].i++;
        }
      }
    });

    const totalQ = exam.questions.length;
    const accuracy = correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 0;

    return { correct, incorrect, unattempted, totalQ, accuracy, subjectWise, maxScore };
  }, [exam, attempt]);

  // 3. UI RENDERERS
  if (loading) return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></SafeAreaView>;
  if (!exam || !attempt) return <SafeAreaView style={styles.center}><Text>No Data Found.</Text></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* HEADER HERO SECTION */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)/explore')} style={styles.backBtn}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Advanced Scorecard</Text>
          <Text style={styles.examName}>{exam.title}</Text>
          
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreLabel}>Final Score</Text>
            <Text style={styles.scoreNumber}>{attempt.rawScore}</Text>
            <Text style={styles.scoreMax}>out of {stats?.maxScore}</Text>
          </View>
        </View>

        {/* QUICK STATS ROW */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, {borderColor: '#10b981'}]}><Text style={[styles.statVal, {color: '#10b981'}]}>{stats?.correct}</Text><Text style={styles.statLabel}>Correct</Text></View>
          <View style={[styles.statBox, {borderColor: '#ef4444'}]}><Text style={[styles.statVal, {color: '#ef4444'}]}>{stats?.incorrect}</Text><Text style={styles.statLabel}>Incorrect</Text></View>
          <View style={[styles.statBox, {borderColor: '#64748b'}]}><Text style={[styles.statVal, {color: '#64748b'}]}>{stats?.unattempted}</Text><Text style={styles.statLabel}>Skipped</Text></View>
        </View>

        {/* ACCURACY BAR */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Global Accuracy: {stats?.accuracy}%</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, {width: `${stats?.accuracy}%`}]} />
          </View>
        </View>

        {/* SUBJECT-WISE BREAKDOWN */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subject-wise Performance</Text>
          {Object.values(stats?.subjectWise || {}).map((sub, idx) => (
            <View key={idx} style={styles.subjectCard}>
              <Text style={styles.subjectName}>{sub.name}</Text>
              <View style={styles.subStatsRow}>
                <Text style={styles.subStatItem}>✅ {sub.c}</Text>
                <Text style={styles.subStatItem}>❌ {sub.i}</Text>
                <Text style={styles.subStatItem}>➖ {sub.u}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* DETAILED SOLUTION VAULT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detailed Solutions</Text>
          
          {exam.questions.map((q, idx) => {
            const uAns = attempt.answers[q.id];
            const isAnsEmpty = Array.isArray(uAns) ? uAns.length === 0 : (uAns === undefined || uAns === '');
            
            // Evaluation Logic for rendering Colors
            let isCorrect = false;
            if (!isAnsEmpty) {
              if (q.type === 'single_mcq') isCorrect = uAns === q.correctIndices[0];
              else if (q.type === 'multi_mcq') isCorrect = JSON.stringify([...uAns].sort()) === JSON.stringify([...q.correctIndices].sort());
              else if (q.type === 'integer') isCorrect = String(uAns).trim() === String(q.numericalAnswer).trim();
            }

            const cardColor = isAnsEmpty ? '#f1f5f9' : (isCorrect ? '#ecfdf5' : '#fef2f2');
            const borderColor = isAnsEmpty ? '#cbd5e1' : (isCorrect ? '#10b981' : '#ef4444');

            return (
              <View key={q.id} style={[styles.qCard, { backgroundColor: cardColor, borderColor: borderColor }]}>
                <View style={styles.qHeader}>
                  <Text style={styles.qNum}>Q{idx + 1}. ({q.type.replace('_',' ').toUpperCase()})</Text>
                  <Text style={[styles.qStatusTxt, { color: borderColor, fontWeight: 'bold' }]}>
                    {isAnsEmpty ? 'SKIPPED' : (isCorrect ? '+'+q.marks : '-'+q.negMarks)}
                  </Text>
                </View>
                
                <Text style={styles.qText}>{q.qText}</Text>

                {/* SHOWING ANSWERS BASED ON TYPE */}
                <View style={styles.ansBox}>
                  {q.type.includes('mcq') ? (
                    <>
                      <Text style={styles.ansLabel}>Your Answer:</Text>
                      <Text style={styles.ansValue}>
                        {isAnsEmpty ? 'None' : (q.type === 'single_mcq' ? q.options[uAns] : uAns.map((i: number)=>q.options[i]).join(', '))}
                      </Text>
                      <Text style={[styles.ansLabel, {marginTop: 10}]}>Correct Answer:</Text>
                      <Text style={[styles.ansValue, {color: '#10b981'}]}>
                        {q.correctIndices.map((i: number)=>q.options[i]).join(', ')}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.ansLabel}>Your Answer: <Text style={styles.ansValue}>{isAnsEmpty ? 'None' : uAns}</Text></Text>
                      <Text style={styles.ansLabel}>Correct Answer: <Text style={[styles.ansValue, {color: '#10b981'}]}>{q.numericalAnswer}</Text></Text>
                    </>
                  )}
                </View>
              </View>
            )
          })}
        </View>

        <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(tabs)/explore')}>
          <Text style={styles.homeBtnTxt}>Back to Dashboard</Text>
        </TouchableOpacity>
        <View style={{height: 50}} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// 🎨 STYLESHEET
// ============================================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { padding: 30, alignItems: 'center', backgroundColor: '#0f172a', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, paddingTop: 60 },
  backBtn: { position: 'absolute', left: 20, top: 50, padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  headerTitle: { color: '#94a3b8', fontSize: 14, fontWeight: '800', textTransform: 'uppercase' },
  examName: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 5, textAlign: 'center' },
  
  scoreCircle: { marginTop: 25, width: 160, height: 160, borderRadius: 80, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 10 },
  scoreLabel: { fontSize: 13, color: '#64748b', fontWeight: '800', textTransform: 'uppercase' },
  scoreNumber: { fontSize: 48, fontWeight: '900', color: '#0f172a' },
  scoreMax: { fontSize: 14, color: '#94a3b8', fontWeight: 'bold' },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 20, marginTop: -20 },
  statBox: { backgroundColor: '#fff', padding: 15, borderRadius: 16, width: width * 0.28, alignItems: 'center', borderWidth: 2, elevation: 4 },
  statVal: { fontSize: 24, fontWeight: '900' },
  statLabel: { fontSize: 12, color: '#64748b', fontWeight: '800', marginTop: 4, textTransform: 'uppercase' },
  
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 15 },
  
  progressTrack: { height: 14, backgroundColor: '#e2e8f0', borderRadius: 7, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#4f46e5' },
  
  subjectCard: { backgroundColor: '#fff', padding: 18, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subjectName: { fontSize: 16, fontWeight: '800', color: '#334155' },
  subStatsRow: { flexDirection: 'row', gap: 15 },
  subStatItem: { fontSize: 14, color: '#64748b', fontWeight: '800' },
  
  qCard: { padding: 20, borderRadius: 16, marginBottom: 15, borderWidth: 2 },
  qHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  qNum: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  qStatusTxt: { fontSize: 14 },
  qText: { fontSize: 15, fontWeight: '600', color: '#334155', marginBottom: 15, lineHeight: 22 },
  
  ansBox: { backgroundColor: 'rgba(255,255,255,0.6)', padding: 15, borderRadius: 10 },
  ansLabel: { fontSize: 12, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: 4 },
  ansValue: { fontSize: 16, fontWeight: '900', color: '#0f172a' },

  homeBtn: { marginHorizontal: 20, marginTop: 10, backgroundColor: '#4f46e5', padding: 18, borderRadius: 16, alignItems: 'center', elevation: 4 },
  homeBtnTxt: { color: '#fff', fontWeight: '900', fontSize: 16 }
});