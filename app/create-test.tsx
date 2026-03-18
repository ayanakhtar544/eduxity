import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, 
  Switch, Alert, SafeAreaView, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// --- TYPES ---
type QType = 'single_mcq' | 'multi_mcq' | 'integer';
interface ISubject { id: string; name: string; timeLimit: number; }
interface IQuestion { id: string; subjectId: string; type: QType; qText: string; options: string[]; correctIndices: number[]; numericalAnswer: string; marks: number; negMarks: number; }

export default function AdvancedTestCreator() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // EXAM DETAILS
  const [title, setTitle] = useState('');
  const [isStrict, setIsStrict] = useState(true);
  const [globalDuration, setGlobalDuration] = useState('180');

  // DYNAMIC SUBJECTS
  const [subjects, setSubjects] = useState<ISubject[]>([]);
  const [newSubName, setNewSubName] = useState('');
  const [newSubTime, setNewSubTime] = useState('');

  // QUESTIONS
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [activeSubjectId, setActiveSubjectId] = useState('');

  // --- HANDLERS ---
  const handleAddSubject = () => {
    if (!newSubName.trim()) return Alert.alert("Error", "Enter subject name");
    const newSub: ISubject = { 
      id: `sub_${Date.now()}`, 
      name: newSubName.trim(), 
      timeLimit: parseInt(newSubTime) || 0 
    };
    setSubjects([...subjects, newSub]);
    if (!activeSubjectId) setActiveSubjectId(newSub.id);
    setNewSubName(''); setNewSubTime('');
  };

  const handleAddQuestion = () => {
    if (!activeSubjectId) return Alert.alert("Error", "Add a subject first!");
    const newQ: IQuestion = {
      id: `q_${Date.now()}`, subjectId: activeSubjectId, type: 'single_mcq',
      qText: '', options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correctIndices: [0], numericalAnswer: '', marks: 4, negMarks: 1
    };
    setQuestions([...questions, newQ]);
  };

  const updateQuestion = (qId: string, field: keyof IQuestion, value: any) => {
    setQuestions(questions.map(q => q.id === qId ? { ...q, [field]: value } : q));
  };

  const handleDeploy = async () => {
    if (!title || subjects.length === 0 || questions.length === 0) {
      return Alert.alert("Incomplete", "Please add Title, Subjects, and Questions.");
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'exams_enterprise'), {
        title, rules: { isStrict, globalDuration: parseInt(globalDuration) },
        subjects, questions,
        authorId: auth.currentUser?.uid || 'admin',
        createdAt: serverTimestamp(), status: 'LIVE'
      });
      Alert.alert("Success 🚀", "Advanced CBT Published!");
      router.replace('/(tabs)/explore');
    } catch (e) {
      Alert.alert("Error", "Failed to save test.");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERERS ---
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Enterprise Creator (Step {step}/3)</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scroll}>
          
          {/* STEP 1: EXAM RULES */}
          {step === 1 && (
            <View style={styles.card}>
              <Text style={styles.label}>Exam Title</Text>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. JEE Mains 2026 Mock" />
              
              <Text style={styles.label}>Global Duration (Minutes)</Text>
              <TextInput style={styles.input} value={globalDuration} onChangeText={setGlobalDuration} keyboardType="numeric" />
              
              <View style={styles.row}>
                <Text style={styles.label}>Strict Proctoring (Anti-Cheat)</Text>
                <Switch value={isStrict} onValueChange={setIsStrict} />
              </View>
            </View>
          )}

          {/* STEP 2: DYNAMIC SUBJECTS */}
          {step === 2 && (
            <View style={styles.card}>
              <Text style={styles.title}>Define Custom Subjects/Sections</Text>
              
              {subjects.map(s => (
                <View key={s.id} style={styles.subjectPill}>
                  <Text style={styles.subText}>{s.name} ({s.timeLimit > 0 ? `${s.timeLimit} mins` : 'No Limit'})</Text>
                  <TouchableOpacity onPress={() => setSubjects(subjects.filter(x => x.id !== s.id))}>
                    <Ionicons name="trash" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}

              <View style={{ marginTop: 20 }}>
                <TextInput style={styles.input} placeholder="Subject Name (e.g. Logical Reasoning)" value={newSubName} onChangeText={setNewSubName} />
                <TextInput style={styles.input} placeholder="Sectional Time Limit (Mins) - Optional" value={newSubTime} onChangeText={setNewSubTime} keyboardType="numeric" />
                <TouchableOpacity style={styles.btnPrimary} onPress={handleAddSubject}>
                  <Text style={styles.btnText}>Add Subject</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 3: ADVANCED QUESTIONS */}
          {step === 3 && (
            <View style={{ paddingBottom: 50 }}>
              {/* Subject Tabs */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
                {subjects.map(s => (
                  <TouchableOpacity key={s.id} style={[styles.tab, activeSubjectId === s.id && styles.tabActive]} onPress={() => setActiveSubjectId(s.id)}>
                    <Text style={[styles.tabText, activeSubjectId === s.id && {color:'#fff'}]}>{s.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Question Builder */}
              {questions.filter(q => q.subjectId === activeSubjectId).map((q, idx) => (
                <View key={q.id} style={styles.qCard}>
                  <Text style={styles.title}>Question {idx + 1}</Text>
                  
                  {/* Type Selector */}
                  <View style={styles.row}>
                    {(['single_mcq', 'multi_mcq', 'integer'] as QType[]).map(t => (
                      <TouchableOpacity key={t} style={[styles.typeBtn, q.type === t && styles.typeBtnActive]} onPress={() => updateQuestion(q.id, 'type', t)}>
                        <Text style={{fontSize: 10, color: q.type===t?'#fff':'#000'}}>{t.toUpperCase()}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TextInput style={[styles.input, {height: 80}]} multiline placeholder="Enter Question Text..." value={q.qText} onChangeText={v => updateQuestion(q.id, 'qText', v)} />

                  {/* Options Builder (If MCQ) */}
                  {q.type.includes('mcq') && q.options.map((opt, oIdx) => {
                    const isCorrect = q.correctIndices.includes(oIdx);
                    return (
                      <View key={oIdx} style={styles.optRow}>
                        <TouchableOpacity onPress={() => {
                          if (q.type === 'single_mcq') updateQuestion(q.id, 'correctIndices', [oIdx]);
                          else updateQuestion(q.id, 'correctIndices', isCorrect ? q.correctIndices.filter(i=>i!==oIdx) : [...q.correctIndices, oIdx]);
                        }}>
                          <Ionicons name={isCorrect ? "checkmark-circle" : "ellipse-outline"} size={24} color={isCorrect ? "#10b981" : "#cbd5e1"} />
                        </TouchableOpacity>
                        <TextInput style={styles.optInput} value={opt} onChangeText={v => { const n=[...q.options]; n[oIdx]=v; updateQuestion(q.id, 'options', n); }} />
                      </View>
                    );
                  })}

                  {/* Integer Builder */}
                  {q.type === 'integer' && (
                    <TextInput style={styles.input} placeholder="Exact Numerical Answer (e.g. 42)" keyboardType="numeric" value={q.numericalAnswer} onChangeText={v => updateQuestion(q.id, 'numericalAnswer', v)} />
                  )}
                  
                  {/* Marking Scheme */}
                  <View style={styles.row}>
                    <TextInput style={[styles.input, {flex:1, marginRight:10}]} placeholder="Marks (+)" keyboardType="numeric" value={String(q.marks)} onChangeText={v => updateQuestion(q.id, 'marks', parseFloat(v)||0)} />
                    <TextInput style={[styles.input, {flex:1}]} placeholder="Neg Marks (-)" keyboardType="numeric" value={String(q.negMarks)} onChangeText={v => updateQuestion(q.id, 'negMarks', parseFloat(v)||0)} />
                  </View>
                </View>
              ))}

              <TouchableOpacity style={[styles.btnPrimary, {backgroundColor: '#10b981'}]} onPress={handleAddQuestion}>
                <Text style={styles.btnText}>+ Add Question</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* FOOTER */}
      <View style={styles.footer}>
        {step > 1 && <TouchableOpacity style={styles.btnBack} onPress={() => setStep(s => s - 1)}><Text>Back</Text></TouchableOpacity>}
        {step < 3 ? (
          <TouchableOpacity style={styles.btnNext} onPress={() => setStep(s => s + 1)}><Text style={{color:'#fff'}}>Next Step</Text></TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.btnDeploy} onPress={handleDeploy} disabled={loading}>
            {loading ? <Text style={{color:'#fff'}}>Saving...</Text> : <Text style={{color:'#fff', fontWeight:'bold'}}>Deploy CBT Exam 🚀</Text>}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { padding: 20, backgroundColor: '#0f172a' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  scroll: { padding: 15 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 15, marginBottom: 20 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  label: { fontSize: 12, color: '#64748b', marginBottom: 5, fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', padding: 12, borderRadius: 8, marginBottom: 15, backgroundColor: '#f8fafc' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  
  subjectPill: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#e0e7ff', borderRadius: 8, marginBottom: 10 },
  subText: { color: '#4f46e5', fontWeight: 'bold' },
  
  tabScroll: { marginBottom: 15 },
  tab: { padding: 10, paddingHorizontal: 20, backgroundColor: '#e2e8f0', borderRadius: 20, marginRight: 10 },
  tabActive: { backgroundColor: '#4f46e5' },
  tabText: { fontWeight: 'bold' },
  
  qCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  typeBtn: { padding: 8, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, flex: 1, alignItems: 'center', marginHorizontal: 2 },
  typeBtnActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  optRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  optInput: { flex: 1, borderWidth: 1, borderColor: '#cbd5e1', padding: 10, borderRadius: 8, marginLeft: 10 },

  btnPrimary: { backgroundColor: '#4f46e5', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  
  footer: { flexDirection: 'row', padding: 15, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e2e8f0' },
  btnBack: { padding: 15, backgroundColor: '#e2e8f0', borderRadius: 8, flex: 1, alignItems: 'center', marginRight: 10 },
  btnNext: { padding: 15, backgroundColor: '#4f46e5', borderRadius: 8, flex: 2, alignItems: 'center' },
  btnDeploy: { padding: 15, backgroundColor: '#ef4444', borderRadius: 8, flex: 2, alignItems: 'center' }
});