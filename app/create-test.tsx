import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, 
  KeyboardAvoidingView, Platform, ScrollView, TextInput, Alert, ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';

// 🔥 TERA MODULAR MASTER CONTROLLER YAHAN IMPORT HO RAHA HAI 🔥
import AdvancedTestBuilder from '../components/test-builder/AdvancedTestBuilder';

// ==========================================
// ⚡ QUICK BASIC MODE (Kept inline because it's small)
// ==========================================
const BasicTestBuilder = ({ router }: { router: any }) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState('30');
  const [questions, setQuestions] = useState([{ id: 'q1', qText: '', options: ['', '', '', ''], correctIndex: 0 }]);

  const handlePublish = async () => {
    if (!title.trim() || !subject.trim()) return Alert.alert("Error", "Title & Subject required.");
    setLoading(true);
    try {
      await addDoc(collection(db, 'exams_enterprise'), {
        title, category: subject, pattern: 'CUSTOM',
        rules: { globalDuration: parseInt(duration) || 30, isStrict: false },
        visibility: 'PUBLIC', pricing: { isPaid: false, price: 0 },
        subjects: [{ id: 'sub_1', name: subject, timeLimit: parseInt(duration), attemptMax: 0 }],
        questions: questions.map((q, idx) => ({
          id: `q_${idx}`, subjectId: 'sub_1', type: 'single_mcq',
          qText: q.qText, options: q.options, correctIndices: [q.correctIndex], marks: 4, negMarks: 1
        })),
        authorId: auth.currentUser?.uid || 'admin', authorName: auth.currentUser?.displayName || 'Scholar',
        createdAt: serverTimestamp(), status: 'LIVE'
      });
      if(Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Basic Test Published!");
      router.replace('/');
    } catch (e) { Alert.alert("Error", "Could not publish test."); } 
    finally { setLoading(false); }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 15 }} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.card}>
        <Text style={styles.label}>Test Title</Text>
        <TextInput style={styles.input} placeholder="e.g. Physics Quiz" value={title} onChangeText={setTitle} />
        <View style={{flexDirection: 'row', gap: 10}}>
          <TextInput style={[styles.input, {flex: 2}]} placeholder="Subject" value={subject} onChangeText={setSubject} />
          <TextInput style={[styles.input, {flex: 1}]} placeholder="Mins" keyboardType="numeric" value={duration} onChangeText={setDuration} />
        </View>
      </View>

      {questions.map((q, index) => (
        <View key={q.id} style={styles.card}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}><Text style={styles.label}>Q{index + 1}</Text><TouchableOpacity onPress={() => setQuestions(questions.filter(x => x.id !== q.id))}><Ionicons name="trash" size={18} color="red"/></TouchableOpacity></View>
          <TextInput style={styles.input} multiline placeholder="Question text..." value={q.qText} onChangeText={v => setQuestions(questions.map(x => x.id === q.id ? {...x, qText: v} : x))} />
          {q.options.map((opt, oIdx) => (
            <View key={oIdx} style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
              <TouchableOpacity onPress={() => {
                if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setQuestions(questions.map(x => x.id === q.id ? {...x, correctIndex: oIdx} : x));
              }}>
                <Ionicons name={q.correctIndex === oIdx ? "radio-button-on" : "radio-button-off"} size={24} color={q.correctIndex === oIdx ? "#10b981" : "#cbd5e1"} />
              </TouchableOpacity>
              <TextInput style={[styles.input, {flex: 1, marginBottom: 0, marginLeft: 10}]} placeholder={`Option ${oIdx+1}`} value={opt} onChangeText={v => { const newOpts = [...q.options]; newOpts[oIdx] = v; setQuestions(questions.map(x => x.id === q.id ? {...x, options: newOpts} : x)); }} />
            </View>
          ))}
        </View>
      ))}

      <TouchableOpacity style={styles.addBtnOutline} onPress={() => {
        if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setQuestions([...questions, { id: `q${Date.now()}`, qText: '', options: ['', '', '', ''], correctIndex: 0 }]);
      }}>
        <Ionicons name="add" size={20} color="#4f46e5" /><Text style={{color: '#4f46e5', fontWeight: 'bold', marginLeft: 6}}>Add Question</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.btnPrimary} onPress={handlePublish} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 16}}>Publish Basic Test</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

// ==========================================
// 👑 MAIN SCREEN WRAPPER
// ==========================================
export default function CreateTestScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'BASIC' | 'ADVANCED'>('BASIC');

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER & TOGGLE */}
      <View style={styles.header}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10}}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="close" size={26} color="#0f172a" /></TouchableOpacity>
          <Text style={{fontSize: 18, fontWeight: '900', color: '#0f172a'}}>Create CBT</Text>
          <View style={{width: 26}} />
        </View>

        <View style={styles.toggleContainer}>
          <TouchableOpacity style={[styles.toggleBtn, mode === 'BASIC' && styles.toggleBtnActive]} onPress={() => { setMode('BASIC'); if(Platform.OS !== 'web') Haptics.selectionAsync(); }}>
            <Text style={{fontWeight: 'bold', color: mode === 'BASIC' ? '#fff' : '#64748b'}}>⚡ Basic Mode</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleBtn, mode === 'ADVANCED' && styles.toggleBtnActiveAdv]} onPress={() => { setMode('ADVANCED'); if(Platform.OS !== 'web') Haptics.selectionAsync(); }}>
            <Text style={{fontWeight: 'bold', color: mode === 'ADVANCED' ? '#fff' : '#64748b'}}>👑 Pro Advanced</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTENT W/ FLEX 1 FIX TO PREVENT MESSY UI */}
      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {mode === 'BASIC' ? (
          <BasicTestBuilder router={router} />
        ) : (
          /* 🔥 MODULAR ADVANCED BUILDER LOADED HERE 🔥 */
          <AdvancedTestBuilder router={router} />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { backgroundColor: '#fff', padding: 15, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#f8fafc', borderRadius: 10, padding: 4 },
  toggleBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8 },
  toggleBtnActive: { backgroundColor: '#10b981' },
  toggleBtnActiveAdv: { backgroundColor: '#0f172a' },
  
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  label: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 5, textTransform: 'uppercase' },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 14, color: '#0f172a' },
  
  btnPrimary: { backgroundColor: '#4f46e5', padding: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  addBtnOutline: { flexDirection: 'row', justifyContent: 'center', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#4f46e5', borderStyle: 'dashed', marginBottom: 15 }
});