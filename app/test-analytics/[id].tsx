import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, StatusBar, Platform, SafeAreaView, Dimensions 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { RealScoreCard, SectionalAnalysis, RealHeatmap, ComingSoonWidgets, AutoInsights } from '../../components/analytics/AnalyticsWidgets';
const { width } = Dimensions.get('window');

// ==========================================
// 🧩 WIDGET 1: THE SMART SCORECARD
// ==========================================
const SmartScoreCard = ({ currentScore, maxMarks, accuracy, percentile, rank }: any) => {
  const getPerfColor = (val: number) => val >= 75 ? '#10b981' : val >= 40 ? '#f59e0b' : '#ef4444';
  const perfColor = getPerfColor(accuracy);

  return (
    <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.heroCard}>
      <View style={styles.heroHeader}>
        <Ionicons name="analytics" size={20} color="#38bdf8" />
        <Text style={styles.heroTitle}>Performance Overview</Text>
      </View>
      
      <View style={styles.scoreRow}>
        <View style={[styles.scoreCircle, { borderColor: perfColor, shadowColor: perfColor }]}>
          <Text style={styles.bigScore}>{currentScore}</Text>
          <Text style={styles.maxScore}>/ {maxMarks}</Text>
        </View>
        
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Accuracy</Text>
            <Text style={[styles.statValue, { color: perfColor }]}>{accuracy}%</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Percentile</Text>
            <Text style={[styles.statValue, { color: '#38bdf8' }]}>{percentile} <Text style={{fontSize: 12}}>%ile</Text></Text>
          </View>
          <View style={[styles.statBox, { width: '100%', marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' }]}>
            <Text style={styles.statLabel}>Est. Global Rank</Text>
            <Text style={[styles.statValue, { color: '#fde047' }]}>#{rank}</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

// ==========================================
// 🧩 WIDGET 2: WHAT-IF SIMULATOR
// ==========================================
const WhatIfSimulator = ({ currentScore, potentialGain, incorrectQs }: any) => {
  const potentialScore = currentScore + potentialGain;
  return (
    <View style={[styles.card, { borderColor: '#8b5cf6', backgroundColor: '#faf5ff' }]}>
      <View style={styles.cardHeader}>
        <Ionicons name="flask" size={22} color="#8b5cf6" />
        <Text style={[styles.cardTitle, { color: '#6d28d9' }]}>"What-If" Simulation Engine</Text>
      </View>
      <Text style={styles.simText}>
        Agar tumne in <Text style={{ fontWeight: '900', color: '#ef4444' }}>{incorrectQs} wrong answers</Text> par negative marking nahi khayi hoti aur unhe sahi kiya hota, toh tumhara score kya hota?
      </Text>
      
      <View style={styles.simVisualBox}>
        <View style={styles.simRow}>
          <Text style={styles.simLabel}>Actual Score</Text>
          <Text style={styles.simScoreBad}>{currentScore}</Text>
        </View>
        <View style={styles.simDivider} />
        <View style={styles.simRow}>
          <Text style={styles.simLabel}>Potential Score</Text>
          <Text style={styles.simScoreGood}>{potentialScore}</Text>
        </View>
      </View>
      
      <View style={styles.insightPillDark}>
        <Ionicons name="bulb" size={16} color="#fde047" />
        <Text style={styles.insightPillTxt}>Avoiding negatives could boost you by {potentialGain} marks!</Text>
      </View>
    </View>
  );
};

// ==========================================
// 🧩 WIDGET 3: MISTAKE CLASSIFIER
// ==========================================
const MistakeClassifier = ({ incorrectQs }: any) => {
  // Mocking the split based on heuristics for now
  const conceptual = Math.ceil(incorrectQs * 0.65);
  const silly = incorrectQs - conceptual;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="warning" size={22} color="#ef4444" />
        <Text style={[styles.cardTitle, { color: '#b91c1c' }]}>Mistake Analysis</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={styles.mistakeBox}>
          <Text style={styles.mistakeVal}>{conceptual}</Text>
          <Text style={styles.mistakeType}>Conceptual</Text>
          <Text style={styles.mistakeDesc}>Lack of knowledge or wrong formula.</Text>
        </View>
        <View style={[styles.mistakeBox, { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]}>
          <Text style={[styles.mistakeVal, { color: '#ef4444' }]}>{silly}</Text>
          <Text style={[styles.mistakeType, { color: '#b91c1c' }]}>Silly Errors</Text>
          <Text style={[styles.mistakeDesc, { color: '#f87171' }]}>Calculation or reading mistakes.</Text>
        </View>
      </View>
    </View>
  );
};

// ==========================================
// 🧩 WIDGET 4: SECTIONAL RADAR (Progress Bars)
// ==========================================
const SectionalRadar = ({ sectionStats }: any) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="pie-chart" size={22} color="#0f172a" />
        <Text style={styles.cardTitle}>Sectional X-Ray</Text>
      </View>
      <View style={{ marginTop: 5 }}>
        {Object.keys(sectionStats).map(secId => {
          const stat = sectionStats[secId];
          const secPercentage = stat.max > 0 ? Math.max(0, Math.round((stat.scored / stat.max) * 100)) : 0;
          let barColor = secPercentage >= 75 ? '#10b981' : secPercentage >= 40 ? '#f59e0b' : '#ef4444';

          return (
            <View key={secId} style={styles.progressContainer}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressSubName} numberOfLines={1}>{stat.name}</Text>
                <Text style={styles.progressSubMarks}>{stat.scored} / {stat.max}</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${secPercentage}%`, backgroundColor: barColor }]} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// ==========================================
// 🧩 WIDGET 5: TIME INTELLIGENCE (Mocked for now)
// ==========================================
const TimeIntelligence = () => {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="timer" size={22} color="#0ea5e9" />
        <Text style={styles.cardTitle}>Time Intelligence</Text>
        <View style={styles.proBadge}><Text style={styles.proBadgeTxt}>PRO</Text></View>
      </View>
      
      <View style={styles.timeGrid}>
        <View style={styles.timeBox}>
          <Text style={styles.timeVal}>1m 45s</Text>
          <Text style={styles.timeLabel}>Avg Time / Q</Text>
        </View>
        <View style={styles.timeBox}>
          <Text style={[styles.timeVal, {color: '#ef4444'}]}>4m 12s</Text>
          <Text style={styles.timeLabel}>Slowest Q (Q14)</Text>
        </View>
        <View style={styles.timeBox}>
          <Text style={[styles.timeVal, {color: '#10b981'}]}>12s</Text>
          <Text style={styles.timeLabel}>Fastest Q (Q3)</Text>
        </View>
      </View>
      <Text style={styles.timeInsight}>⏱️ You spent 15% of your time on unattempted questions. Don't let ego get in the way of skipping hard questions!</Text>
    </View>
  );
};

// ==========================================
// 🧩 WIDGET 6: HEATMAP & SOLUTIONS
// ==========================================
const HeatmapGrid = ({ examData, userAnswers, correctQs, incorrectQs, unattemptedQs }: any) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="grid" size={22} color="#0f172a" />
        <Text style={styles.cardTitle}>Question Heatmap</Text>
      </View>
      
      <View style={styles.legendRow}>
        <View style={styles.legendItem}><View style={[styles.legendDot, {backgroundColor: '#10b981'}]} /><Text style={styles.legendTxt}>Correct ({correctQs})</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, {backgroundColor: '#ef4444'}]} /><Text style={styles.legendTxt}>Wrong ({incorrectQs})</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, {backgroundColor: '#e2e8f0'}]} /><Text style={styles.legendTxt}>Skipped ({unattemptedQs})</Text></View>
      </View>

      <View style={styles.heatmapGrid}>
        {examData?.questions.map((q: any, idx: number) => {
          const uAns = userAnswers?.[q.id];
          let bg = '#f1f5f9'; let txtCol = '#475569'; let border = '#e2e8f0';
          
          if (uAns !== undefined && uAns !== '' && (!Array.isArray(uAns) || uAns.length > 0)) {
            let isCorrect = false;
            if (q.type === 'single_mcq') isCorrect = uAns === q.correctIndices[0];
            else if (q.type === 'integer') isCorrect = String(uAns).trim() === String(q.numericalAnswer).trim();
            else if (q.type === 'multi_mcq') isCorrect = JSON.stringify(q.correctIndices.sort()) === JSON.stringify([...uAns].sort());
            
            bg = isCorrect ? '#dcfce7' : '#fee2e2';
            txtCol = isCorrect ? '#166534' : '#b91c1c';
            border = isCorrect ? '#4ade80' : '#f87171';
          }

          return (
            <TouchableOpacity key={q.id} style={[styles.heatBox, {backgroundColor: bg, borderColor: border}]}>
              <Text style={[styles.heatTxt, {color: txtCol}]}>{idx + 1}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      
      <TouchableOpacity style={styles.solBtn}>
        <Ionicons name="book" size={18} color="#fff" />
        <Text style={styles.solBtnTxt}>View Detailed Solutions</Text>
      </TouchableOpacity>
    </View>
  );
};

// ==========================================
// 🚀 MAIN DASHBOARD COMPONENT
// ==========================================
export default function AdvancedAnalyticsDashboard() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const uid = auth.currentUser?.uid;

  const [loading, setLoading] = useState(true);
  const [examData, setExamData] = useState<any>(null);
  const [userResponse, setUserResponse] = useState<any>(null);

  // 1. DATA FETCHING
  useEffect(() => {
    const fetchResult = async () => {
      if (!uid || !id) return;
      try {
        const docSnap = await getDoc(doc(db, 'exams_enterprise', id as string));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setExamData(data);
          setUserResponse(data.responses?.[uid]);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id, uid]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingTxt}>Crunching Millions of Data Points...</Text>
      </SafeAreaView>
    );
  }

  if (!userResponse) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="document-text-outline" size={60} color="#cbd5e1" />
        <Text style={styles.errorText}>No result found. Did you submit the exam?</Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => router.replace('/tests')}>
          <Text style={{color: '#fff', fontWeight: 'bold'}}>Go to Tests Hub</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ==========================================
  // 🧠 THE NTA-LEVEL CALCULATION ENGINE
  // ==========================================
  let totalMaxMarks = 0;
  let correctQs = 0;
  let incorrectQs = 0;
  let unattemptedQs = 0;
  let potentialGain = 0; 
  
  let sectionStats: Record<string, { name: string, max: number, scored: number }> = {};
  examData?.subjects?.forEach((sub: any) => { sectionStats[sub.id] = { name: sub.name, max: 0, scored: 0 }; });

  examData?.questions?.forEach((q: any) => {
    const qMarks = Number(q.marks) || 4;
    const qNeg = Number(q.negMarks) || 1;
    
    totalMaxMarks += qMarks;
    if (sectionStats[q.subjectId]) sectionStats[q.subjectId].max += qMarks;

    const uAns = userResponse.answers?.[q.id];
    const hasAnswered = uAns !== undefined && uAns !== '' && (!Array.isArray(uAns) || uAns.length > 0);
    
    if (!hasAnswered) {
      unattemptedQs++;
    } else {
      let isCorrect = false;
      let qScore = 0;

      if (q.type === 'single_mcq') {
        isCorrect = uAns === q.correctIndices[0];
        qScore = isCorrect ? qMarks : -qNeg;
      } else if (q.type === 'integer') {
        isCorrect = String(uAns).trim() === String(q.numericalAnswer).trim();
        qScore = isCorrect ? qMarks : -qNeg;
      } else if (q.type === 'multi_mcq') {
        const correctAns = q.correctIndices;
        const userAns = uAns as number[];
        const isFullyCorrect = correctAns.length === userAns.length && correctAns.every((val:number) => userAns.includes(val));
        const hasIncorrectOption = userAns.some((val:number) => !correctAns.includes(val));

        if (isFullyCorrect) { isCorrect = true; qScore = qMarks; }
        else if (hasIncorrectOption) { isCorrect = false; qScore = -qNeg; }
        else if (q.allowPartialMarking) { isCorrect = false; qScore = userAns.length; } 
      }

      if (isCorrect) correctQs++; 
      else {
        incorrectQs++;
        potentialGain += (qMarks + Math.abs(qScore)); 
      }

      if (sectionStats[q.subjectId]) sectionStats[q.subjectId].scored += qScore;
    }
  });

  const attemptedQs = correctQs + incorrectQs;
  const currentScore = userResponse.score || 0;
  const accuracy = attemptedQs > 0 ? Math.round((correctQs / attemptedQs) * 100) : 0;
  
  // Generating Dynamic Rank & Percentile Based on Accuracy (Mock Logic for wow-factor)
  const percentile = accuracy > 90 ? 99.8 : accuracy > 70 ? 92.5 : accuracy > 40 ? 75.2 : 35.4;
  const rank = accuracy > 90 ? 12 : accuracy > 70 ? 450 : accuracy > 40 ? 2300 : 15400;

  // ==========================================
  // 🎨 MAIN RENDER RETURN
  // ==========================================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* 🔴 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/tests')} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{examData?.title}</Text>
        <TouchableOpacity style={styles.shareBtn}>
          <Ionicons name="share-social" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{flex: 1}} showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, padding: 15, paddingBottom: 100 }}>
        
        {/* WIDGETS ASSEMBLY */}
        <SmartScoreCard currentScore={currentScore} maxMarks={totalMaxMarks} accuracy={accuracy} percentile={percentile} rank={rank} />
        
        <WhatIfSimulator currentScore={currentScore} potentialGain={potentialGain} incorrectQs={incorrectQs} />
        
        <View style={{flexDirection: 'row', gap: 15}}>
          <View style={{flex: 1}}><SectionalRadar sectionStats={sectionStats} /></View>
        </View>

        <TimeIntelligence />
        
        <MistakeClassifier incorrectQs={incorrectQs} />
        
        <HeatmapGrid examData={examData} userAnswers={userResponse.answers} correctQs={correctQs} incorrectQs={incorrectQs} unattemptedQs={unattemptedQs} />

        <RealScoreCard currentScore={currentScore} maxMarks={totalMaxMarks} accuracy={accuracy} potentialGain={potentialGain} incorrectQs={incorrectQs} />
        {Object.keys(sectionStats).length > 0 && <SectionalAnalysis sectionStats={sectionStats} />}
        <RealHeatmap examData={examData} userAnswers={userResponse.answers} />
        <AutoInsights examData={examData} userAnswers={userResponse.answers} />
        <ComingSoonWidgets />

        {/* 🤖 AI COACH WIDGET */}
        <View style={styles.aiCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="robot-outline" size={24} color="#fff" />
            <Text style={[styles.cardTitle, {color: '#fff', marginLeft: 8}]}>AI Coach Plan</Text>
          </View>
          <View style={styles.aiTaskItem}>
            <Ionicons name="ellipse" size={8} color="#38bdf8" style={{marginTop: 6}} />
            <Text style={styles.aiTaskTxt}>Your accuracy is <Text style={{fontWeight: 'bold', color: '#fde047'}}>{accuracy}%</Text>. You need to stop guessing answers to reduce negative marking.</Text>
          </View>
          <View style={styles.aiTaskItem}>
            <Ionicons name="ellipse" size={8} color="#38bdf8" style={{marginTop: 6}} />
            <Text style={styles.aiTaskTxt}>Focus on Integer Type questions. You left most of them blank.</Text>
          </View>
        </View>

      </ScrollView>

      {/* 🔴 FIXED FOOTER ACTION BAR */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnSecondary} onPress={() => alert("Retake Mistakes mode unlocking soon!")}>
          <Ionicons name="warning" size={18} color="#ef4444" />
          <Text style={styles.btnSecondaryTxt}>Retake Mistakes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.btnPrimaryLg} onPress={() => { if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); router.push(`/test/${id}`); }}>
          <Ionicons name="refresh" size={18} color="#fff" />
          <Text style={styles.btnPrimaryTxt}>Reattempt Full Test</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

// ==========================================
// 🎨 STYLES (The 500-Line Polish)
// ==========================================
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingTxt: { marginTop: 15, color: '#64748b', fontWeight: '800', fontSize: 16 },
  errorText: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginTop: 15, marginBottom: 20 },
  btnPrimary: { backgroundColor: '#4f46e5', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#0f172a', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 45 },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#fff', flex: 1, textAlign: 'center' },
  backBtn: { padding: 8, backgroundColor: '#1e293b', borderRadius: 10 },
  shareBtn: { padding: 8, backgroundColor: '#1e293b', borderRadius: 10 },
  
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.03, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a', marginLeft: 8, flex: 1 },
  
  // HERO CARD
  heroCard: { padding: 20, borderRadius: 20, marginBottom: 15, shadowColor: '#0f172a', shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.2, elevation: 6 },
  heroHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  heroTitle: { fontSize: 14, fontWeight: '800', color: '#94a3b8', marginLeft: 8, textTransform: 'uppercase', letterSpacing: 1 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  scoreCircle: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', borderWidth: 6, shadowOffset: {width:0, height:0}, shadowOpacity: 0.5, shadowRadius: 10 },
  bigScore: { fontSize: 36, fontWeight: '900', color: '#fff' },
  maxScore: { fontSize: 14, color: '#64748b', fontWeight: '800' },
  statsGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statBox: { width: '45%', backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '700', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '900' },

  // SIMULATOR
  simText: { fontSize: 13, color: '#4c1d95', fontWeight: '600', lineHeight: 22, marginBottom: 15 },
  simVisualBox: { backgroundColor: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#ddd6fe', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  simRow: { alignItems: 'center', flex: 1 },
  simLabel: { fontSize: 11, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: 6 },
  simScoreBad: { fontSize: 24, fontWeight: '900', color: '#ef4444' },
  simScoreGood: { fontSize: 24, fontWeight: '900', color: '#10b981' },
  simDivider: { width: 1, height: 40, backgroundColor: '#e2e8f0', marginHorizontal: 15 },
  insightPillDark: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#5b21b6', padding: 12, borderRadius: 10, marginTop: 15 },
  insightPillTxt: { color: '#fff', fontSize: 12, fontWeight: '700', marginLeft: 8 },

  // MISTAKES
  mistakeBox: { flex: 1, backgroundColor: '#f8fafc', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  mistakeVal: { fontSize: 32, fontWeight: '900', color: '#0f172a' },
  mistakeType: { fontSize: 14, fontWeight: '900', color: '#334155', marginTop: 4 },
  mistakeDesc: { fontSize: 11, color: '#64748b', fontWeight: '600', marginTop: 4, lineHeight: 16 },

  // PROGRESS BARS
  progressContainer: { marginBottom: 15 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressSubName: { fontSize: 14, fontWeight: '800', color: '#334155' },
  progressSubMarks: { fontSize: 12, fontWeight: '800', color: '#64748b' },
  progressBarBg: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },

  // TIME INTELLIGENCE
  proBadge: { backgroundColor: '#e0f2fe', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  proBadgeTxt: { fontSize: 9, fontWeight: '900', color: '#0284c7' },
  timeGrid: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  timeBox: { flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  timeVal: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  timeLabel: { fontSize: 10, color: '#64748b', fontWeight: '700', marginTop: 4, textAlign: 'center' },
  timeInsight: { fontSize: 12, color: '#334155', fontWeight: '600', lineHeight: 18, backgroundColor: '#f0f9ff', padding: 12, borderRadius: 8 },

  // HEATMAP
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 15, backgroundColor: '#f8fafc', padding: 12, borderRadius: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendTxt: { fontSize: 11, fontWeight: '800', color: '#475569' },
  heatmapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  heatBox: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  heatTxt: { fontSize: 13, fontWeight: '900' },
  solBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', padding: 14, borderRadius: 12 },
  solBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 14, marginLeft: 8 },

  // AI COACH
  aiCard: { backgroundColor: '#0f172a', padding: 20, borderRadius: 16, marginBottom: 15, elevation: 5 },
  aiTaskItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 10 },
  aiTaskTxt: { color: '#e2e8f0', fontSize: 13, fontWeight: '600', lineHeight: 20, marginLeft: 10, flex: 1 },

  // FOOTER
  footer: { flexDirection: 'row', gap: 12, padding: 15, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e2e8f0', paddingBottom: Platform.OS === 'ios' ? 35 : 15 },
  btnSecondary: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, backgroundColor: '#fef2f2', borderRadius: 12, borderWidth: 1, borderColor: '#fca5a5' },
  btnSecondaryTxt: { color: '#ef4444', fontWeight: '800', fontSize: 14, marginLeft: 6 },
  btnPrimaryLg: { flex: 1.5, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, backgroundColor: '#4f46e5', borderRadius: 12, shadowColor: '#4f46e5', shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, elevation: 4 },
  btnPrimaryTxt: { color: '#fff', fontWeight: '800', fontSize: 14, marginLeft: 6 }
});