import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, 
  Platform, StatusBar, TextInput, SafeAreaView, KeyboardAvoidingView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Same types from parent
type QStatus = 'not_visited' | 'not_answered' | 'answered' | 'marked' | 'answered_marked';

export default function PlayingUI({ 
  examData, globalTimeLeft, 
  activeSubId, setActiveSubId, 
  activeQIndex, setActiveQIndex, 
  answers, setAnswers, 
  qStatus, setQStatus, 
  onSubmit 
}: any) {
  
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const currentQ = examData?.questions[activeQIndex];

  // ==========================================
  // 🎮 ENGINE LOGIC (Navigation & Actions)
  // ==========================================
  const jumpToQuestion = (index: number) => {
    if (!examData || index === activeQIndex) return;
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    
    // Status update logic for the question we are leaving
    if (currentQ) {
      const ans = answers[currentQ.id];
      const isEmpty = Array.isArray(ans) ? ans.length === 0 : (ans === undefined || ans === '');
      if (isEmpty && qStatus[currentQ.id] === 'not_visited') {
        setQStatus((p: any) => ({ ...p, [currentQ.id]: 'not_answered' }));
      }
    }

    // Switch to new question
    setActiveQIndex(index);
    const nextQ = examData.questions[index];
    if (nextQ.subjectId !== activeSubId) setActiveSubId(nextQ.subjectId);
    if (qStatus[nextQ.id] === 'not_visited' || !qStatus[nextQ.id]) {
      setQStatus((p: any) => ({ ...p, [nextQ.id]: 'not_answered' }));
    }
    setIsPaletteOpen(false); 
  };

  const handleAnswer = (val: any) => {
    if (!currentQ) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAnswers((p: any) => ({ ...p, [currentQ.id]: val }));
  };

  const handleAction = (status: QStatus) => {
    if (!currentQ || !examData) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const ans = answers[currentQ.id];
    const hasAns = Array.isArray(ans) ? ans.length > 0 : (ans !== undefined && ans !== '');
    
    let finalStatus = status;
    if (status === 'answered' && !hasAns) finalStatus = 'not_answered';
    if (status === 'marked' && hasAns) finalStatus = 'answered_marked';

    setQStatus((p: any) => ({ ...p, [currentQ.id]: finalStatus }));
    
    // Auto-advance or open palette if last question
    if (activeQIndex < examData.questions.length - 1) {
      jumpToQuestion(activeQIndex + 1);
    } else {
      setIsPaletteOpen(true); 
    }
  };

  const handleClear = () => {
    if (!currentQ) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    const newAnswers = { ...answers }; 
    delete newAnswers[currentQ.id];
    setAnswers(newAnswers); 
    setQStatus((p: any) => ({ ...p, [currentQ.id]: 'not_answered' }));
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getPaletteColor = (status: QStatus) => {
    switch(status) {
      case 'answered': return '#10b981'; 
      case 'not_answered': return '#ef4444'; 
      case 'marked': return '#8b5cf6'; 
      case 'answered_marked': return '#8b5cf6'; 
      default: return '#e2e8f0'; 
    }
  };

  // ==========================================
  // 🎨 RENDER UI
  // ==========================================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* 🟢 TOP HEADER (Timer & Info) */}
      <View style={styles.topBar}>
        <Text style={styles.topTitle} numberOfLines={1}>{examData?.title}</Text>
        <View style={styles.timerBox}>
          <Ionicons name="time-outline" size={16} color="#fca5a5" />
          <Text style={styles.timerText}>{formatTime(globalTimeLeft)}</Text>
        </View>
      </View>

      {/* 🟢 SECTION TABS */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {examData?.subjects.map((s: any) => (
            <TouchableOpacity 
              key={s.id} 
              style={[styles.subTab, activeSubId === s.id && styles.activeSubTab]} 
              onPress={() => {
                setActiveSubId(s.id);
                const firstIdx = examData.questions.findIndex((q: any) => q.subjectId === s.id);
                if (firstIdx !== -1) jumpToQuestion(firstIdx);
              }}
            >
              <Text style={[styles.subTabTxt, activeSubId === s.id && {color: '#fff'}]}>{s.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 🟢 QUESTION WORKSPACE */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.workspace} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <View style={styles.qHeader}>
            <View>
              <Text style={styles.qNum}>Question {activeQIndex + 1}</Text>
              <Text style={styles.qTypeTxt}>
                {currentQ?.type === 'single_mcq' ? 'Single Correct Option' : currentQ?.type === 'multi_mcq' ? 'Multiple Correct Options' : 'Numerical Value Type'}
              </Text>
            </View>
            <View style={styles.marksBadge}>
              <Text style={styles.marksTxt}>+{currentQ?.marks} / -{currentQ?.negMarks}</Text>
            </View>
          </View>
          
          <Text style={styles.qText}>{currentQ?.qText}</Text>

          {/* OPTIONS BUILDER (MCQs) */}
          {currentQ?.type.includes('mcq') && currentQ.options.map((opt: string, idx: number) => {
            const ans = answers[currentQ.id];
            const isSel = currentQ.type === 'single_mcq' ? ans === idx : (Array.isArray(ans) && ans.includes(idx));
            
            return (
              <TouchableOpacity 
                key={idx} 
                style={[styles.optRow, isSel && styles.optSel]} 
                onPress={() => {
                  if (currentQ.type === 'single_mcq') handleAnswer(idx);
                  else { 
                    const arr = Array.isArray(ans) ? ans : []; 
                    handleAnswer(arr.includes(idx) ? arr.filter(i => i !== idx) : [...arr, idx]); 
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.optCircle, isSel && styles.optCircleSel]}>
                  {isSel && <View style={styles.optInnerDot} />}
                </View>
                <Text style={[styles.optTxt, isSel && {color: '#1e3a8a', fontWeight: '800'}]}>{opt}</Text>
              </TouchableOpacity>
            )
          })}

          {/* INTEGER BUILDER */}
          {currentQ?.type === 'integer' && (
            <TextInput 
              style={styles.numInput} 
              keyboardType="numeric" 
              placeholder="Enter numerical value..." 
              value={answers[currentQ.id] || ''} 
              onChangeText={handleAnswer} 
            />
          )}
          
          <View style={{ height: 120 }} /> {/* Padding for bottom bar & FAB */}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 🟢 FLOATING PALETTE BUTTON */}
      <TouchableOpacity style={styles.paletteToggle} onPress={() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsPaletteOpen(true); }} activeOpacity={0.9}>
        <Ionicons name="grid" size={24} color="#fff" />
      </TouchableOpacity>

      {/* 🟢 BOTTOM ACTION BAR (Fixed) */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.btnOutline} onPress={handleClear}>
          <Text style={styles.btnOutlineTxt}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnWarning} onPress={() => handleAction('marked')}>
          <Text style={styles.btnSolidTxt}>Mark Review</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSuccess} onPress={() => handleAction('answered')}>
          <Text style={styles.btnSolidTxt}>Save & Next</Text>
        </TouchableOpacity>
      </View>

      {/* 🟩 NTA PALETTE MODAL */}
      <Modal visible={isPaletteOpen} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <View style={styles.paletteContainer}>
            <View style={styles.paletteHeader}>
              <Text style={styles.paletteTitle}>Exam Palette</Text>
              <TouchableOpacity onPress={() => setIsPaletteOpen(false)} style={{padding: 5}}><Ionicons name="close" size={28} color="#0f172a" /></TouchableOpacity>
            </View>
            
            {/* NTA Legend */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}><View style={[styles.legendBox, {backgroundColor: '#10b981'}]} /><Text style={styles.legendTxt}>Answered</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendBox, {backgroundColor: '#ef4444'}]} /><Text style={styles.legendTxt}>Not Answered</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendBox, {backgroundColor: '#8b5cf6'}]} /><Text style={styles.legendTxt}>Marked</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendBox, {backgroundColor: '#e2e8f0', borderWidth: 1, borderColor: '#cbd5e1'}]} /><Text style={styles.legendTxt}>Not Visited</Text></View>
              <View style={[styles.legendItem, {width: '100%', marginTop: 5}]}><View style={[styles.legendBox, {backgroundColor: '#8b5cf6'}]}><View style={styles.legendDot}/></View><Text style={styles.legendTxt}>Answered & Marked (Considered for Eval)</Text></View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 20}}>
              <View style={styles.paletteGrid}>
                {examData?.questions.map((q: any, idx: number) => {
                  const stat = qStatus[q.id] || 'not_visited';
                  const bgCol = getPaletteColor(stat);
                  const isCurrent = activeQIndex === idx;
                  
                  return (
                    <TouchableOpacity 
                      key={q.id} 
                      onPress={() => jumpToQuestion(idx)} 
                      style={[
                        styles.gridItem, 
                        { backgroundColor: bgCol },
                        isCurrent && styles.gridItemActive,
                        stat === 'not_visited' && { borderWidth: 1, borderColor: '#cbd5e1' }
                      ]}
                    >
                      <Text style={[styles.gridTxt, {color: stat === 'not_visited' ? '#475569' : '#fff'}]}>{idx + 1}</Text>
                      {stat === 'answered_marked' && <View style={styles.markedDot} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            
            <TouchableOpacity style={styles.finalSubmitBtn} onPress={() => { setIsPaletteOpen(false); setShowSubmitConfirm(true); }}>
              <Ionicons name="checkmark-done-circle" size={20} color="#fff" style={{marginRight: 8}} />
              <Text style={styles.finalSubmitTxt}>Submit Final Exam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 🟥 SUBMIT CONFIRMATION MODAL */}
      <Modal visible={showSubmitConfirm} transparent={true} animationType="fade">
        <View style={styles.modalBgCenter}>
          <View style={styles.confirmBox}>
            <View style={styles.warningIconBg}><Ionicons name="warning" size={32} color="#f59e0b" /></View>
            <Text style={styles.confirmTitle}>Submit Exam?</Text>
            <Text style={styles.confirmSub}>Are you sure you want to submit? You will not be able to change your answers after submission.</Text>
            
            <View style={{flexDirection: 'row', gap: 12, marginTop: 25, width: '100%'}}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setShowSubmitConfirm(false)}>
                <Text style={styles.btnCancelTxt}>Review Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirm} onPress={onSubmit}>
                <Text style={styles.btnConfirmTxt}>Yes, Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  
  // Header
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#0f172a', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 45 },
  topTitle: { color: '#fff', fontWeight: '900', fontSize: 16, flex: 1, paddingRight: 10 },
  timerBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  timerText: { color: '#fca5a5', fontWeight: '900', marginLeft: 6, fontSize: 14, fontVariant: ['tabular-nums'] },
  
  // Tabs
  tabContainer: { backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, elevation: 2, zIndex: 10 },
  subTab: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeSubTab: { borderBottomColor: '#4f46e5', backgroundColor: '#4f46e5' },
  subTabTxt: { color: '#64748b', fontWeight: '800', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Workspace
  workspace: { flex: 1, padding: 20 },
  qHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  qNum: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
  qTypeTxt: { fontSize: 11, color: '#64748b', fontWeight: '800', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  marksBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#bbf7d0' },
  marksTxt: { fontSize: 12, color: '#166534', fontWeight: '900' },
  qText: { fontSize: 18, lineHeight: 28, marginBottom: 30, fontWeight: '600', color: '#1e293b' },

  // Options
  optRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#cbd5e1', shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, elevation: 1 },
  optSel: { borderColor: '#4f46e5', backgroundColor: '#eef2ff', borderWidth: 2 },
  optCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center' },
  optCircleSel: { borderColor: '#4f46e5' },
  optInnerDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#4f46e5' },
  optTxt: { marginLeft: 15, fontSize: 16, flex: 1, color: '#475569', fontWeight: '500' },
  
  numInput: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#cbd5e1', borderRadius: 12, padding: 20, fontSize: 24, textAlign: 'center', fontWeight: '900', color: '#0f172a', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, elevation: 2 },

  // Bottom Bar
  bottomBar: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e2e8f0', gap: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 12 },
  btnOutline: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#f8fafc' },
  btnWarning: { flex: 1.5, paddingVertical: 14, alignItems: 'center', borderRadius: 10, backgroundColor: '#f59e0b', shadowColor: '#f59e0b', shadowOffset: {width:0,height:2}, shadowOpacity:0.3, elevation:2 },
  btnSuccess: { flex: 1.5, paddingVertical: 14, alignItems: 'center', borderRadius: 10, backgroundColor: '#10b981', shadowColor: '#10b981', shadowOffset: {width:0,height:2}, shadowOpacity:0.3, elevation:2 },
  btnOutlineTxt: { fontWeight: '800', color: '#475569', fontSize: 14 }, 
  btnSolidTxt: { fontWeight: '900', color: '#fff', fontSize: 14 },

  // FAB
  paletteToggle: { position: 'absolute', right: 20, bottom: Platform.OS === 'ios' ? 100 : 80, width: 60, height: 60, borderRadius: 30, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', shadowColor: '#0f172a', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, elevation: 6, zIndex: 100 },
  
  // Palette Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  paletteContainer: { backgroundColor: '#fff', height: '80%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  paletteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  paletteTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
  
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20, backgroundColor: '#f8fafc', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  legendItem: { flexDirection: 'row', alignItems: 'center', width: '45%' },
  legendBox: { width: 14, height: 14, borderRadius: 4, marginRight: 8, justifyContent: 'center', alignItems: 'center' },
  legendDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' },
  legendTxt: { fontSize: 12, color: '#475569', fontWeight: '700' },
  
  paletteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 20 },
  gridItem: { width: 48, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  gridItemActive: { borderWidth: 3, borderColor: '#0f172a', transform: [{scale: 1.05}] },
  gridTxt: { fontWeight: '900', fontSize: 16 },
  markedDot: { position: 'absolute', bottom: 4, right: 4, width: 10, height: 10, borderRadius: 5, backgroundColor: '#10b981', borderWidth: 1, borderColor: '#fff' },

  finalSubmitBtn: { flexDirection: 'row', backgroundColor: '#ef4444', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10, shadowColor: '#ef4444', shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, elevation: 4 },
  finalSubmitTxt: { color: '#fff', fontWeight: '900', fontSize: 16 },

  // Confirm Modal
  modalBgCenter: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  confirmBox: { backgroundColor: '#fff', padding: 30, borderRadius: 24, width: '100%', alignItems: 'center', shadowColor: '#000', shadowOffset: {width:0, height:10}, shadowOpacity: 0.2, elevation: 10 },
  warningIconBg: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fef3c7', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  confirmTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a', marginBottom: 10 },
  confirmSub: { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 22 },
  
  btnCancel: { flex: 1, paddingVertical: 16, alignItems: 'center', borderRadius: 12, backgroundColor: '#f1f5f9' },
  btnCancelTxt: { fontWeight: '800', color: '#475569', fontSize: 16 },
  btnConfirm: { flex: 1, paddingVertical: 16, alignItems: 'center', borderRadius: 12, backgroundColor: '#ef4444' },
  btnConfirmTxt: { color: '#fff', fontWeight: '900', fontSize: 16 }
});