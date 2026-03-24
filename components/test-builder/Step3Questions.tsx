import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Switch, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// TYPES
type QType = 'single_mcq' | 'multi_mcq' | 'integer';

export default function Step3Questions({ questions, setQuestions, sections }: any) {
  // Active Section Tab (Default to first section)
  const [activeSecId, setActiveSecId] = useState('');

  useEffect(() => {
    if (sections.length > 0 && !activeSecId) {
      setActiveSecId(sections[0].id);
    }
  }, [sections]);

  const handleAddQuestion = () => {
    if (!activeSecId) return Alert.alert("Hold up!", "Please select a section first.");
    if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const newQ = {
      id: `q_${Date.now()}`, 
      subjectId: activeSecId, 
      type: 'single_mcq' as QType,
      qText: '', 
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctIndices: [0], 
      numericalAnswer: '', 
      marks: 4, 
      negMarks: 1, 
      allowPartialMarking: false
    };
    setQuestions([...questions, newQ]);
  };

  const updateQuestion = (qId: string, field: string, value: any) => {
    setQuestions(questions.map((q: any) => q.id === qId ? { ...q, [field]: value } : q));
  };

  const removeQuestion = (qId: string) => {
    if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuestions(questions.filter((q: any) => q.id !== qId));
  };

  const simulateAIGeneration = () => {
    Alert.alert("🤖 AI Magic", "Upload a PDF. Our Eduxity AI will extract equations and options in seconds! (Coming soon)");
  };

  // Filter questions for the currently selected section tab
  const activeQuestions = questions.filter((q: any) => q.subjectId === activeSecId);

  if (sections.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="warning" size={40} color="#f59e0b" />
        <Text style={styles.emptyTxt}>Go back to Step 2 and add at least one section!</Text>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
      
      {/* ⚡ SMART SOURCING PANEL */}
      <View style={styles.sourcingPanel}>
        <TouchableOpacity style={styles.sourceBtnAi} onPress={simulateAIGeneration}>
          <Ionicons name="sparkles" size={18} color="#fff" />
          <Text style={styles.sourceBtnAiTxt}>Auto-Generate via PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sourceBtnBank} onPress={() => Alert.alert("Coming Soon", "Import from Global Eduxity Bank")}>
          <Ionicons name="server" size={18} color="#4f46e5" />
          <Text style={styles.sourceBtnBankTxt}>Import from Bank</Text>
        </TouchableOpacity>
      </View>

      {/* 🟢 DYNAMIC SECTION TABS */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        {sections.map((sec: any) => (
          <TouchableOpacity 
            key={sec.id} 
            style={[styles.tab, activeSecId === sec.id && styles.tabActive]} 
            onPress={() => {
              setActiveSecId(sec.id);
              if(Platform.OS !== 'web') Haptics.selectionAsync();
            }}
          >
            <Text style={[styles.tabText, activeSecId === sec.id && {color:'#fff'}]}>{sec.name}</Text>
            <View style={styles.qCountBadge}>
              <Text style={styles.qCountTxt}>{questions.filter((q: any) => q.subjectId === sec.id).length}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 🟢 QUESTIONS LIST FOR ACTIVE SECTION */}
      {activeQuestions.map((q: any, idx: number) => (
        <View key={q.id} style={styles.qCard}>
          <View style={styles.qHeaderRow}>
            <Text style={styles.qIndexTitle}>Question {idx + 1}</Text>
            <TouchableOpacity onPress={() => removeQuestion(q.id)} style={styles.trashIcon}>
              <Ionicons name="close" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
          
          {/* Question Type Selector */}
          <View style={styles.typeSelectorRow}>
            {(['single_mcq', 'multi_mcq', 'integer'] as QType[]).map(t => (
              <TouchableOpacity 
                key={t} 
                style={[styles.typeBtn, q.type === t && styles.typeBtnActive]} 
                onPress={() => updateQuestion(q.id, 'type', t)}
              >
                <Text style={{fontSize: 11, fontWeight: '800', color: q.type === t ? '#fff' : '#64748b'}}>
                  {t === 'single_mcq' ? 'SINGLE MCQ' : t === 'multi_mcq' ? 'MULTI CORRECT' : 'INTEGER'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Question Text */}
          <TextInput 
            style={[styles.input, {height: 80, backgroundColor: '#f8fafc', textAlignVertical: 'top'}]} 
            multiline 
            placeholder="Type your question here... (Supports LaTeX via Markdown soon)" 
            value={q.qText} 
            onChangeText={v => updateQuestion(q.id, 'qText', v)} 
          />

          {/* Options Builder (For MCQs) */}
          {q.type.includes('mcq') && q.options.map((opt: string, oIdx: number) => {
            const isCorrect = q.correctIndices.includes(oIdx);
            return (
              <View key={oIdx} style={styles.optRow}>
                <TouchableOpacity onPress={() => {
                  if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (q.type === 'single_mcq') {
                    updateQuestion(q.id, 'correctIndices', [oIdx]);
                  } else {
                    updateQuestion(q.id, 'correctIndices', isCorrect ? q.correctIndices.filter((i:number)=>i!==oIdx) : [...q.correctIndices, oIdx]);
                  }
                }}>
                  <Ionicons name={isCorrect ? "checkmark-circle" : "ellipse-outline"} size={28} color={isCorrect ? "#10b981" : "#cbd5e1"} />
                </TouchableOpacity>
                <TextInput 
                  style={styles.optInput} 
                  placeholder={`Option ${String.fromCharCode(65 + oIdx)}`} 
                  value={opt} 
                  onChangeText={v => { const n=[...q.options]; n[oIdx]=v; updateQuestion(q.id, 'options', n); }} 
                />
              </View>
            );
          })}

          {/* Integer Answer Builder */}
          {q.type === 'integer' && (
            <TextInput 
              style={[styles.input, {textAlign: 'center', fontSize: 18, fontWeight: '900', color: '#0f172a'}]} 
              placeholder="Exact Numerical Answer (e.g. 42.5)" 
              keyboardType="numeric" 
              value={q.numericalAnswer} 
              onChangeText={v => updateQuestion(q.id, 'numericalAnswer', v)} 
            />
          )}
          
          {/* Advanced Marking Scheme */}
          <View style={styles.markingBox}>
            <Text style={styles.labelDark}>Marking Scheme</Text>
            <View style={{flexDirection: 'row', gap: 10, marginTop: 10}}>
              <View style={styles.markInputBox}>
                <Text style={{color: '#10b981', fontWeight: '800'}}>+ Correct</Text>
                <TextInput style={styles.miniInput} keyboardType="numeric" value={String(q.marks)} onChangeText={v => updateQuestion(q.id, 'marks', parseFloat(v)||0)} />
              </View>
              <View style={styles.markInputBox}>
                <Text style={{color: '#ef4444', fontWeight: '800'}}>- Incorrect</Text>
                <TextInput style={styles.miniInput} keyboardType="numeric" value={String(q.negMarks)} onChangeText={v => updateQuestion(q.id, 'negMarks', parseFloat(v)||0)} />
              </View>
            </View>
            
            {q.type === 'multi_mcq' && (
              <View style={[styles.rowItem, {marginTop: 15, marginBottom: 0, paddingBottom: 0, borderBottomWidth: 0}]}>
                <View>
                  <Text style={styles.labelDark}>Partial Marking</Text>
                  <Text style={{fontSize: 11, color: '#64748b', marginTop: 2}}>JEE Advanced Style</Text>
                </View>
                <Switch value={q.allowPartialMarking} onValueChange={(val) => updateQuestion(q.id, 'allowPartialMarking', val)} trackColor={{true: '#4f46e5'}} />
              </View>
            )}
          </View>
        </View>
      ))}

      {/* Add Question Button */}
      <TouchableOpacity style={styles.addQBtn} onPress={handleAddQuestion}>
        <Ionicons name="add" size={20} color="#fff" style={{marginRight: 6}} />
        <Text style={styles.addQBtnTxt}>Add Manual Question</Text>
      </TouchableOpacity>

      <View style={{height: 50}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyTxt: { fontSize: 16, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginTop: 15 },
  
  sourcingPanel: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  sourceBtnAi: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0ea5e9', padding: 14, borderRadius: 12 },
  sourceBtnAiTxt: { color: '#fff', fontWeight: '900', marginLeft: 6, fontSize: 13 },
  sourceBtnBank: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e0e7ff', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#c7d2fe' },
  sourceBtnBankTxt: { color: '#4f46e5', fontWeight: '900', marginLeft: 6, fontSize: 13 },

  tabScroll: { marginBottom: 20, maxHeight: 50 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 20, marginRight: 10 },
  tabActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  tabText: { fontWeight: '800', color: '#64748b', fontSize: 13 },
  qCountBadge: { backgroundColor: 'rgba(0,0,0,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, marginLeft: 8 },
  qCountTxt: { fontSize: 10, fontWeight: '900', color: '#fff' },
  
  qCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.05, elevation: 2 },
  qHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  qIndexTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  trashIcon: { padding: 5, backgroundColor: '#fef2f2', borderRadius: 8 },
  
  typeSelectorRow: { flexDirection: 'row', gap: 8, marginBottom: 15 },
  typeBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, backgroundColor: '#f8fafc' },
  typeBtnActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', padding: 14, borderRadius: 10, marginBottom: 15, fontSize: 15, color: '#0f172a' },
  
  optRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  optInput: { flex: 1, borderWidth: 1, borderColor: '#e2e8f0', padding: 12, borderRadius: 10, marginLeft: 12, backgroundColor: '#f8fafc', fontSize: 15, fontWeight: '600', color: '#334155' },
  
  markingBox: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed' },
  labelDark: { fontSize: 14, color: '#0f172a', fontWeight: '800' },
  markInputBox: { flex: 1, backgroundColor: '#fff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  miniInput: { fontWeight: '900', fontSize: 16, color: '#0f172a', width: 45, textAlign: 'right' },
  rowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#f1f5f9' },

  addQBtn: { flexDirection: 'row', backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#10b981', shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, elevation: 4 },
  addQBtnTxt: { color: '#fff', fontWeight: '900', fontSize: 15 }
});