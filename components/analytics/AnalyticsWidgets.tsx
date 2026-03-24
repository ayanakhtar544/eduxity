import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Platform, 
  Modal, ScrollView, Animated 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// ==========================================
// 🎯 1. THE REAL SCORECARD & WHAT-IF ENGINE
// ==========================================
export const RealScoreCard = ({ currentScore, maxMarks, accuracy, potentialGain, incorrectQs }: any) => {
  const getPerfColor = (val: number) => val >= 75 ? '#10b981' : val >= 40 ? '#f59e0b' : '#ef4444';
  const perfColor = getPerfColor(accuracy);
  const potentialScore = currentScore + potentialGain;

  // Formatting for safe display
  const safeScore = currentScore || 0;
  const safeMax = maxMarks || 0;
  const scorePercentage = safeMax > 0 ? Math.max(0, (safeScore / safeMax) * 100) : 0;
  const potentialPercentage = safeMax > 0 ? Math.min(100, (potentialGain / safeMax) * 100) : 0;

  return (
    <View style={styles.card}>
      <View style={styles.scoreHero}>
        <View style={[styles.scoreCircle, { borderColor: perfColor }]}>
          <Text style={styles.bigScore}>{safeScore}</Text>
          <Text style={styles.maxScore}>/ {safeMax}</Text>
        </View>
        <View style={styles.rankCol}>
          <Text style={styles.accuracyTxt}>Accuracy: <Text style={{color: perfColor}}>{accuracy}%</Text></Text>
          <View style={styles.realInsightPill}>
            <Ionicons name="information-circle" size={14} color="#3b82f6" />
            <Text style={styles.realInsightTxt}>Based on actual attempted Qs</Text>
          </View>
        </View>
      </View>

      {/* REAL WHAT-IF SIMULATION (Math Driven) */}
      <View style={styles.simBox}>
        <View style={styles.simHeader}>
          <Ionicons name="flask" size={18} color="#8b5cf6" />
          <Text style={styles.simTitle}>Negative Marking Impact</Text>
        </View>
        
        <Text style={styles.simText}>
          You had <Text style={{fontWeight: '900', color: '#ef4444'}}>{incorrectQs} incorrect</Text> answers. 
          If you had skipped them instead of guessing, you would have saved negative marks and your score would be <Text style={{fontWeight: '900', color: '#6d28d9'}}>{potentialScore}</Text>.
        </Text>
        
        <View style={styles.simBarBg}>
          <View style={[styles.simBarFill, {width: `${scorePercentage}%`, backgroundColor: '#4f46e5'}]} />
          <View style={[styles.simBarFill, {width: `${potentialPercentage}%`, backgroundColor: '#c4b5fd'}]} />
        </View>
        
        <View style={styles.simLabels}>
          <Text style={styles.simLabelLeft}>Actual: {safeScore}</Text>
          <Text style={styles.simLabelRight}>Potential: {potentialScore}</Text>
        </View>
      </View>
    </View>
  );
};

// ==========================================
// 📊 2. SECTIONAL X-RAY (Real Data Breakdown)
// ==========================================
export const SectionalAnalysis = ({ sectionStats }: any) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardTitleRow}>
        <Ionicons name="pie-chart" size={20} color="#0f172a" />
        <Text style={styles.cardTitle}>Sectional Breakdown</Text>
      </View>
      
      <View style={{marginTop: 10}}>
        {Object.keys(sectionStats).map(secId => {
          const stat = sectionStats[secId];
          const secPercentage = stat.max > 0 ? Math.max(0, Math.round((stat.scored / stat.max) * 100)) : 0;
          let barColor = secPercentage >= 75 ? '#10b981' : secPercentage >= 40 ? '#f59e0b' : '#ef4444';

          return (
            <View key={secId} style={styles.progressRow}>
              <View style={styles.progressLabelContainer}>
                <Text style={styles.progressLabel} numberOfLines={1}>{stat.name}</Text>
                <Text style={styles.progressSubLabel}>{stat.scored} / {stat.max} Marks</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, {width: `${secPercentage}%`, backgroundColor: barColor}]}/>
              </View>
              <Text style={[styles.progressVal, {color: barColor}]}>{secPercentage}%</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// ==========================================
// 🔥 3. REAL HEATMAP & SOLUTION VIEWER
// ==========================================
export const RealHeatmap = ({ examData, userAnswers }: any) => {
  const [selectedQ, setSelectedQ] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  let correct = 0, wrong = 0, skipped = 0;

  const openSolution = (question: any, index: number) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setSelectedQ({ ...question, qNumber: index + 1 });
    setModalVisible(true);
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardTitleRow}>
        <Ionicons name="grid" size={20} color="#0f172a" />
        <Text style={styles.cardTitle}>Interactive Heatmap</Text>
      </View>
      <Text style={styles.helperText}>Tap on any question block to view your answer vs the correct solution.</Text>
      
      <View style={styles.heatmapGrid}>
        {examData?.questions.map((q: any, idx: number) => {
          const uAns = userAnswers?.[q.id];
          let bg = '#f1f5f9'; let txtCol = '#475569'; let border = '#cbd5e1';
          
          const hasAnswered = uAns !== undefined && uAns !== '' && (!Array.isArray(uAns) || uAns.length > 0);
          
          if (hasAnswered) {
            let isCorrect = false;
            if (q.type === 'single_mcq') isCorrect = uAns === q.correctIndices[0];
            else if (q.type === 'integer') isCorrect = String(uAns).trim() === String(q.numericalAnswer).trim();
            else if (q.type === 'multi_mcq') isCorrect = JSON.stringify(q.correctIndices.sort()) === JSON.stringify([...uAns].sort());
            
            if (isCorrect) { bg = '#dcfce7'; txtCol = '#166534'; border = '#4ade80'; correct++; }
            else { bg = '#fee2e2'; txtCol = '#b91c1c'; border = '#f87171'; wrong++; }
          } else {
            skipped++;
          }

          return (
            <TouchableOpacity 
              key={q.id} 
              style={[styles.heatBox, {backgroundColor: bg, borderColor: border}]} 
              onPress={() => openSolution(q, idx)}
            >
              <Text style={[styles.heatTxt, {color: txtCol}]}>{idx + 1}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Dynamic Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}><View style={[styles.legendBox, {backgroundColor: '#4ade80'}]} /><Text style={styles.legendTxt}>Correct ({correct})</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendBox, {backgroundColor: '#f87171'}]} /><Text style={styles.legendTxt}>Wrong ({wrong})</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendBox, {backgroundColor: '#cbd5e1'}]} /><Text style={styles.legendTxt}>Skipped ({skipped})</Text></View>
      </View>

      {/* 🟢 THE SOLUTION VIEWER MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Question {selectedQ?.qNumber}</Text>
                <Text style={styles.modalSub}>{selectedQ?.type === 'single_mcq' ? 'Single Choice' : selectedQ?.type === 'multi_mcq' ? 'Multiple Choice' : 'Numerical Value'}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{marginTop: 15, paddingHorizontal: 20}}>
              {/* Question Details */}
              <View style={styles.qDetailBox}>
                <Text style={styles.qDetailMarks}>Marks: +{selectedQ?.marks} / -{selectedQ?.negMarks}</Text>
                <Text style={styles.qDetailText}>{selectedQ?.qText}</Text>
              </View>

              {/* Options Evaluation */}
              <Text style={styles.evalTitle}>Your Response Evaluation:</Text>
              
              {selectedQ?.type.includes('mcq') && selectedQ?.options.map((opt: string, oIdx: number) => {
                const uAns = userAnswers?.[selectedQ.id];
                const isUserChoice = selectedQ.type === 'single_mcq' ? uAns === oIdx : (Array.isArray(uAns) && uAns.includes(oIdx));
                const isActuallyCorrect = selectedQ.correctIndices.includes(oIdx);

                let optBg = '#f8fafc'; let optBorder = '#e2e8f0'; let icon = "ellipse-outline"; let iconColor = "#cbd5e1";

                if (isActuallyCorrect && isUserChoice) {
                  optBg = '#dcfce7'; optBorder = '#22c55e'; icon = "checkmark-circle"; iconColor = "#166534";
                } else if (isActuallyCorrect && !isUserChoice) {
                  optBg = '#f0fdf4'; optBorder = '#4ade80'; icon = "checkmark-circle-outline"; iconColor = "#22c55e"; // Missed correct
                } else if (!isActuallyCorrect && isUserChoice) {
                  optBg = '#fee2e2'; optBorder = '#ef4444'; icon = "close-circle"; iconColor = "#b91c1c"; // Wrong selection
                }

                return (
                  <View key={oIdx} style={[styles.evalOptRow, {backgroundColor: optBg, borderColor: optBorder}]}>
                    <Ionicons name={icon} size={24} color={iconColor} />
                    <Text style={[styles.evalOptTxt, {color: isUserChoice || isActuallyCorrect ? '#0f172a' : '#64748b'}]}>{opt}</Text>
                    {isUserChoice && <View style={styles.badgeYourChoice}><Text style={styles.badgeYourChoiceTxt}>Your Choice</Text></View>}
                  </View>
                );
              })}

              {/* Integer Evaluation */}
              {selectedQ?.type === 'integer' && (
                <View style={styles.intEvalBox}>
                  <View style={styles.intEvalRow}>
                    <Text style={styles.intEvalLabel}>Your Answer:</Text>
                    <Text style={[styles.intEvalVal, {color: userAnswers?.[selectedQ.id] ? '#0f172a' : '#94a3b8'}]}>{userAnswers?.[selectedQ.id] || 'Skipped'}</Text>
                  </View>
                  <View style={styles.intEvalRow}>
                    <Text style={styles.intEvalLabel}>Correct Answer:</Text>
                    <Text style={[styles.intEvalVal, {color: '#10b981'}]}>{selectedQ.numericalAnswer}</Text>
                  </View>
                </View>
              )}

              <View style={{height: 40}} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ==========================================
// 💡 4. DATA-DRIVEN AUTO INSIGHTS (Real Logic)
// ==========================================
export const AutoInsights = ({ examData, userAnswers }: any) => {
  let skipped = 0;
  let negatives = 0;
  let totalQs = examData?.questions?.length || 0;

  examData?.questions?.forEach((q: any) => {
    const uAns = userAnswers?.[q.id];
    const hasAnswered = uAns !== undefined && uAns !== '' && (!Array.isArray(uAns) || uAns.length > 0);
    
    if (!hasAnswered) skipped++;
    else {
      let isCorrect = false;
      if (q.type === 'single_mcq') isCorrect = uAns === q.correctIndices[0];
      else if (q.type === 'integer') isCorrect = String(uAns).trim() === String(q.numericalAnswer).trim();
      else if (q.type === 'multi_mcq') isCorrect = JSON.stringify(q.correctIndices.sort()) === JSON.stringify([...uAns].sort());
      
      if (!isCorrect) negatives++;
    }
  });

  const skipPercent = totalQs > 0 ? Math.round((skipped / totalQs) * 100) : 0;

  return (
    <View style={[styles.card, { backgroundColor: '#0f172a' }]}>
      <View style={styles.cardTitleRow}>
        <MaterialCommunityIcons name="robot-outline" size={22} color="#38bdf8" />
        <Text style={[styles.cardTitle, {color: '#fff'}]}>AI Data Coach</Text>
      </View>
      
      {skipPercent > 30 && (
        <View style={styles.aiTaskItem}>
          <Ionicons name="information-circle" size={20} color="#f59e0b" />
          <Text style={styles.aiTaskTxt}>You skipped <Text style={{color:'#fde047', fontWeight:'bold'}}>{skipPercent}%</Text> of the exam. Try to increase your attempt rate in the next mock to boost your score boundary.</Text>
        </View>
      )}

      {negatives > 5 && (
        <View style={styles.aiTaskItem}>
          <Ionicons name="warning" size={20} color="#ef4444" />
          <Text style={styles.aiTaskTxt}>You made <Text style={{color:'#fca5a5', fontWeight:'bold'}}>{negatives} mistakes</Text>. Focus on accuracy over speed. Stop blind guessing on MCQs.</Text>
        </View>
      )}

      {skipPercent <= 30 && negatives <= 5 && (
        <View style={styles.aiTaskItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <Text style={styles.aiTaskTxt}>Solid performance! You have a good balance of attempts and accuracy. Keep revising your weak subjects.</Text>
        </View>
      )}
    </View>
  );
};

// ==========================================
// 🚀 5. "COMING SOON" PRO WIDGETS
// ==========================================
export const ComingSoonWidgets = () => {
  return (
    <View style={styles.comingSoonContainer}>
      <Text style={styles.sectionHeading}>Upcoming EdTech Engine Features</Text>
      
      <View style={styles.lockedCard}>
        <View style={styles.lockedHeader}>
          <Ionicons name="timer" size={20} color="#94a3b8" />
          <Text style={styles.lockedTitle}>Time-per-Question Analytics</Text>
          <View style={styles.comingBadge}><Text style={styles.comingBadgeTxt}>IN DEVELOPMENT</Text></View>
        </View>
        <Text style={styles.lockedDesc}>Will track average time spent on correct vs wrong answers to detect if you are losing marks due to time pressure.</Text>
      </View>

      <View style={styles.lockedCard}>
        <View style={styles.lockedHeader}>
          <Ionicons name="trophy" size={20} color="#94a3b8" />
          <Text style={styles.lockedTitle}>Global NTA Rank Predictor</Text>
          <View style={styles.comingBadge}><Text style={styles.comingBadgeTxt}>DATA GATHERING</Text></View>
        </View>
        <Text style={styles.lockedDesc}>Compare your performance with thousands of students across Eduxity once enough global attempt data is collected.</Text>
      </View>
    </View>
  );
};

// ==========================================
// 🎨 UNIFIED STYLES
// ==========================================
const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.03, elevation: 2 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  helperText: { fontSize: 12, color: '#64748b', marginBottom: 15, lineHeight: 18 },
  
  // Scorecard
  scoreHero: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 20 },
  scoreCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', borderWidth: 6 },
  bigScore: { fontSize: 32, fontWeight: '900', color: '#0f172a' },
  maxScore: { fontSize: 12, color: '#64748b', fontWeight: '800' },
  rankCol: { flex: 1, gap: 10, justifyContent: 'center' },
  accuracyTxt: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  realInsightPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 6 },
  realInsightTxt: { fontSize: 10, color: '#2563eb', fontWeight: '700' },

  // What If Simulator
  simBox: { backgroundColor: '#faf5ff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e9d5ff' },
  simHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  simTitle: { fontSize: 13, fontWeight: '900', color: '#6d28d9', textTransform: 'uppercase' },
  simText: { fontSize: 12, color: '#4c1d95', fontWeight: '600', lineHeight: 20, marginBottom: 15 },
  simBarBg: { height: 12, backgroundColor: '#e2e8f0', borderRadius: 6, overflow: 'hidden', flexDirection: 'row' },
  simBarFill: { height: '100%', borderRadius: 6 },
  simLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  simLabelLeft: { fontSize: 11, fontWeight: '800', color: '#4f46e5' },
  simLabelRight: { fontSize: 11, fontWeight: '800', color: '#6d28d9' },

  // Sectional Progress
  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  progressLabelContainer: { width: 90 },
  progressLabel: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  progressSubLabel: { fontSize: 9, color: '#64748b', fontWeight: '800', marginTop: 2 },
  progressBarBg: { flex: 1, height: 10, backgroundColor: '#f1f5f9', borderRadius: 5, marginHorizontal: 10, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 5 },
  progressVal: { width: 40, fontSize: 12, fontWeight: '900', textAlign: 'right' },

  // Heatmap
  heatmapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  heatBox: { width: 38, height: 38, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  heatTxt: { fontSize: 14, fontWeight: '900' },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingTop: 15, borderTopWidth: 1, borderColor: '#f1f5f9' },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendBox: { width: 14, height: 14, borderRadius: 4, marginRight: 6 },
  legendTxt: { fontSize: 11, fontWeight: '800', color: '#475569' },

  // AI Coach
  aiTaskItem: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: 'rgba(255,255,255,0.1)', padding: 15, borderRadius: 12, gap: 10, marginBottom: 10 },
  aiTaskTxt: { flex: 1, color: '#e2e8f0', fontSize: 13, fontWeight: '600', lineHeight: 20 },

  // Modal Solution Viewer
  modalBg: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#fff', height: '80%', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  modalSub: { fontSize: 12, color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
  closeBtn: { padding: 5, backgroundColor: '#f1f5f9', borderRadius: 20 },
  
  qDetailBox: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 },
  qDetailMarks: { fontSize: 11, fontWeight: '800', color: '#10b981', marginBottom: 8 },
  qDetailText: { fontSize: 16, color: '#0f172a', fontWeight: '700', lineHeight: 24 },
  
  evalTitle: { fontSize: 14, fontWeight: '900', color: '#0f172a', marginBottom: 12 },
  evalOptRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 2, marginBottom: 10 },
  evalOptTxt: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '700' },
  badgeYourChoice: { backgroundColor: '#e0e7ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeYourChoiceTxt: { fontSize: 10, fontWeight: '900', color: '#4f46e5' },

  intEvalBox: { backgroundColor: '#f8fafc', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  intEvalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  intEvalLabel: { fontSize: 14, fontWeight: '800', color: '#475569' },
  intEvalVal: { fontSize: 20, fontWeight: '900' },

  // Coming Soon
  comingSoonContainer: { marginTop: 10 },
  sectionHeading: { fontSize: 16, fontWeight: '900', color: '#0f172a', marginBottom: 15, paddingHorizontal: 5 },
  lockedCard: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed', marginBottom: 12 },
  lockedHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  lockedTitle: { fontSize: 14, fontWeight: '800', color: '#64748b', marginLeft: 8, flex: 1 },
  comingBadge: { backgroundColor: '#e2e8f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  comingBadgeTxt: { fontSize: 9, fontWeight: '900', color: '#475569', letterSpacing: 0.5 },
  lockedDesc: { fontSize: 12, color: '#94a3b8', fontWeight: '600', lineHeight: 18, marginLeft: 28 }
});