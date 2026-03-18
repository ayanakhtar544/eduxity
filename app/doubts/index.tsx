import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  TextInput, Modal, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { auth, db } from '../../firebaseConfig';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc } from 'firebase/firestore';

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Coding', 'General'];

export default function DoubtHubScreen() {
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;
  const currentName = auth.currentUser?.displayName || 'Scholar';

  const [doubts, setDoubts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'open' | 'solved'>('open');

  // Modal States
  const [isAskModalVisible, setAskModalVisible] = useState(false);
  const [isSolveModalVisible, setSolveModalVisible] = useState(false);
  
  // Input States
  const [newDoubtSubject, setNewDoubtSubject] = useState('Physics');
  const [newDoubtText, setNewDoubtText] = useState('');
  const [solvingDoubtId, setSolvingDoubtId] = useState('');
  const [solvingDoubtAuthorId, setSolvingDoubtAuthorId] = useState('');
  const [answerText, setAnswerText] = useState('');

  // ==========================================
  // 📡 REALTIME FETCH DOUBTS
  // ==========================================
  useEffect(() => {
    const q = query(collection(db, 'doubts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDoubts(fetched);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ==========================================
  // ❓ ASK A DOUBT
  // ==========================================
  const handleAskDoubt = async () => {
    if (!newDoubtText.trim() || !currentUid) return;
    try {
      await addDoc(collection(db, 'doubts'), {
        authorId: currentUid,
        authorName: currentName,
        subject: newDoubtSubject,
        question: newDoubtText,
        status: 'open',
        createdAt: serverTimestamp()
      });
      setNewDoubtText('');
      setAskModalVisible(false);
    } catch (error) { console.log(error); }
  };

  // ==========================================
  // ✅ SOLVE A DOUBT & SEND NOTIFICATION
  // ==========================================
  const handleSolveDoubt = async () => {
    if (!answerText.trim() || !currentUid || !solvingDoubtId) return;
    try {
      // 1. Update the doubt document
      await updateDoc(doc(db, 'doubts', solvingDoubtId), {
        status: 'solved',
        answer: answerText,
        solvedById: currentUid,
        solvedByName: currentName,
        solvedAt: serverTimestamp()
      });

      // 2. 🔥 SEND NOTIFICATION TO THE AUTHOR
      if (solvingDoubtAuthorId !== currentUid) {
        await addDoc(collection(db, 'notifications'), {
          recipientId: solvingDoubtAuthorId,
          senderId: currentUid,
          senderName: currentName,
          type: 'doubt_solved',
          text: `solved your ${newDoubtSubject} doubt!`,
          isRead: false,
          createdAt: serverTimestamp()
        });
      }

      setAnswerText('');
      setSolveModalVisible(false);
    } catch (error) { console.log(error); }
  };

  // ==========================================
  // 🎨 RENDER HELPERS
  // ==========================================
  const filteredDoubts = doubts.filter(d => d.status === activeTab);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={28} color="#f8fafc" /></TouchableOpacity>
        <View style={{alignItems: 'center'}}>
          <Text style={styles.headerTitle}>Doubt Hub</Text>
          <Text style={styles.headerSub}>Learn & Help Others</Text>
        </View>
        <View style={{width: 40}} />
      </View>

      {/* TABS */}
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'open' && styles.activeTab]} onPress={() => setActiveTab('open')}>
          <Text style={[styles.tabText, activeTab === 'open' && styles.activeTabText]}>Open Doubts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'solved' && styles.activeTab]} onPress={() => setActiveTab('solved')}>
          <Text style={[styles.tabText, activeTab === 'solved' && styles.activeTabText]}>Solved</Text>
        </TouchableOpacity>
      </View>

      {/* DOUBTS LIST */}
      {loading ? <ActivityIndicator size="large" color="#4f46e5" style={{marginTop: 50}}/> : (
        <FlatList
          data={filteredDoubts}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No {activeTab} doubts right now.</Text>}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 100).springify()} style={styles.doubtCard}>
              <View style={styles.doubtHeader}>
                <Text style={styles.subjectTag}>{item.subject}</Text>
                <Text style={styles.authorText}>Asked by {item.authorName}</Text>
              </View>
              
              <Text style={styles.questionText}>{item.question}</Text>

              {item.status === 'open' ? (
                <TouchableOpacity 
                  style={styles.solveBtn} 
                  onPress={() => { 
                    setSolvingDoubtId(item.id); 
                    setSolvingDoubtAuthorId(item.authorId); 
                    setNewDoubtSubject(item.subject); // for notification
                    setSolveModalVisible(true); 
                  }}
                >
                  <Ionicons name="pencil" size={16} color="#fff" />
                  <Text style={styles.solveBtnText}>Provide Answer</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.answerBox}>
                  <View style={styles.answerHeader}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.solvedByText}>Solved by {item.solvedByName}</Text>
                  </View>
                  <Text style={styles.answerText}>{item.answer}</Text>
                </View>
              )}
            </Animated.View>
          )}
        />
      )}

      {/* FAB - ASK DOUBT */}
      <TouchableOpacity style={styles.fab} onPress={() => setAskModalVisible(true)}>
        <Ionicons name="add" size={28} color="#fff" />
        <Text style={styles.fabText}>Ask Doubt</Text>
      </TouchableOpacity>

      {/* ========================================== */}
      {/* 📝 ASK DOUBT MODAL */}
      {/* ========================================== */}
      <Modal visible={isAskModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ask a Doubt</Text>
              <TouchableOpacity onPress={() => setAskModalVisible(false)}><Ionicons name="close-circle" size={28} color="#64748b"/></TouchableOpacity>
            </View>
            
            <Text style={styles.inputLabel}>Subject</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 20, maxHeight: 40}}>
              {SUBJECTS.map(sub => (
                <TouchableOpacity key={sub} style={[styles.subPill, newDoubtSubject === sub && styles.activeSubPill]} onPress={() => setNewDoubtSubject(sub)}>
                  <Text style={[styles.subPillText, newDoubtSubject === sub && {color: '#fff'}]}>{sub}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Your Question</Text>
            <TextInput 
              style={styles.textInput} 
              placeholder="Describe your doubt clearly..." 
              placeholderTextColor="#64748b" 
              multiline 
              value={newDoubtText} 
              onChangeText={setNewDoubtText} 
              autoFocus
            />
            
            <TouchableOpacity style={styles.submitBtn} onPress={handleAskDoubt}>
              <Text style={styles.submitBtnText}>Post Doubt</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ========================================== */}
      {/* 💡 SOLVE DOUBT MODAL */}
      {/* ========================================== */}
      <Modal visible={isSolveModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
          <View style={[styles.modalContent, {borderColor: '#10b981'}]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Provide Solution</Text>
              <TouchableOpacity onPress={() => setSolveModalVisible(false)}><Ionicons name="close-circle" size={28} color="#64748b"/></TouchableOpacity>
            </View>
            
            <TextInput 
              style={[styles.textInput, {borderColor: 'rgba(16, 185, 129, 0.3)'}]} 
              placeholder="Write step-by-step solution..." 
              placeholderTextColor="#64748b" 
              multiline 
              value={answerText} 
              onChangeText={setAnswerText} 
              autoFocus
            />
            
            <TouchableOpacity style={[styles.submitBtn, {backgroundColor: '#10b981', shadowColor: '#10b981'}]} onPress={handleSolveDoubt}>
              <Text style={styles.submitBtnText}>Submit Answer</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  backBtn: { padding: 5, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  headerTitle: { color: '#f8fafc', fontSize: 20, fontWeight: '900' },
  headerSub: { color: '#4f46e5', fontSize: 12, fontWeight: '700', marginTop: 2 },
  
  tabContainer: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#0f172a', borderRadius: 12, padding: 5, borderWidth: 1, borderColor: '#1e293b' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#4f46e5' },
  tabText: { color: '#64748b', fontWeight: '700', fontSize: 13 },
  activeTabText: { color: '#fff' },

  emptyText: { color: '#64748b', textAlign: 'center', marginTop: 40, fontSize: 15 },

  doubtCard: { backgroundColor: '#0f172a', padding: 20, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: '#1e293b' },
  doubtHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  subjectTag: { color: '#38bdf8', fontSize: 11, fontWeight: '800', backgroundColor: 'rgba(56, 189, 248, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  authorText: { color: '#64748b', fontSize: 11, fontWeight: '600' },
  questionText: { color: '#f8fafc', fontSize: 16, fontWeight: '700', lineHeight: 24, marginBottom: 15 },
  
  solveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4f46e5', paddingVertical: 12, borderRadius: 12 },
  solveBtnText: { color: '#fff', fontWeight: '800', fontSize: 14, marginLeft: 6 },

  answerBox: { backgroundColor: 'rgba(16, 185, 129, 0.05)', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
  answerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  solvedByText: { color: '#10b981', fontSize: 12, fontWeight: '800', marginLeft: 6 },
  answerText: { color: '#cbd5e1', fontSize: 14, lineHeight: 22 },

  fab: { position: 'absolute', bottom: 30, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: '#ec4899', paddingHorizontal: 25, paddingVertical: 15, borderRadius: 30, elevation: 10, shadowColor: '#ec4899', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: {width: 0, height: 5} },
  fabText: { color: '#fff', fontWeight: '900', fontSize: 16, marginLeft: 8 },

  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { backgroundColor: '#0f172a', padding: 25, borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, borderColor: '#1e293b' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  inputLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '800', marginBottom: 10, textTransform: 'uppercase' },
  subPill: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1e293b', marginRight: 10 },
  activeSubPill: { backgroundColor: '#4f46e5' },
  subPillText: { color: '#94a3b8', fontWeight: '700', fontSize: 13 },
  textInput: { backgroundColor: '#1e293b', color: '#fff', borderRadius: 15, padding: 15, height: 120, textAlignVertical: 'top', fontSize: 15, marginBottom: 20, borderWidth: 1, borderColor: '#334155' },
  submitBtn: { backgroundColor: '#4f46e5', paddingVertical: 15, borderRadius: 15, alignItems: 'center', shadowColor: '#4f46e5', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: {width: 0, height: 4} },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' }
});