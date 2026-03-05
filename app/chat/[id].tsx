// File: app/chat/[id].tsx
// Senior Developer Level: Real-time Hybrid (Chat + Shared Tasks with Adding Capability)

import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, 
  ScrollView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db, auth } from '../../firebaseConfig';
import { 
  collection, addDoc, onSnapshot, query, orderBy, 
  serverTimestamp, doc, updateDoc 
} from 'firebase/firestore';

export default function ChatRoomScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams(); 
  const groupName = name || 'Study Group';

  const [messages, setMessages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Task Modal states
  const [isModalVisible, setModalVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  useEffect(() => {
    if (!id) return;

    const msgQuery = query(collection(db, 'groups', id as string, 'messages'), orderBy('createdAt', 'asc'));
    const unsubMsgs = onSnapshot(msgQuery, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const taskQuery = query(collection(db, 'groups', id as string, 'tasks'), orderBy('createdAt', 'desc'));
    const unsubTasks = onSnapshot(taskQuery, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => { unsubMsgs(); unsubTasks(); };
  }, [id]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    try {
      const user = auth.currentUser;
      await addDoc(collection(db, 'groups', id as string, 'messages'), {
        text: inputText.trim(),
        sender: user?.email?.split('@')[0] || 'User',
        uid: user?.uid,
        createdAt: serverTimestamp(),
      });
      setInputText('');
    } catch (e) { console.error(e); }
  };

  // Naya Task Database mein save karne ka function
  const addNewTask = async () => {
    if (!newTaskTitle.trim()) return;
    setIsAddingTask(true);
    try {
      await addDoc(collection(db, 'groups', id as string, 'tasks'), {
        title: newTaskTitle.trim(),
        done: false,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid
      });
      setNewTaskTitle('');
      setModalVisible(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAddingTask(false);
    }
  };

  const toggleTask = async (taskId: string, currentStatus: boolean) => {
    try {
      const taskRef = doc(db, 'groups', id as string, 'tasks', taskId);
      await updateDoc(taskRef, { done: !currentStatus });
    } catch (e) { console.error(e); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{"< Back"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{groupName}</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.chatSection}>
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: any) => (
            <View style={[styles.messageBubble, item.uid === auth.currentUser?.uid ? styles.myMessage : styles.otherMessage]}>
              {item.uid !== auth.currentUser?.uid && <Text style={styles.senderName}>{item.sender}</Text>}
              <Text style={[styles.messageText, item.uid === auth.currentUser?.uid && styles.myMessageText]}>{item.text}</Text>
            </View>
          )}
          contentContainerStyle={{ padding: 15 }}
        />
      </View>

      <View style={styles.todoSection}>
        <View style={styles.todoHeaderRow}>
          <Text style={styles.todoHeader}>🎯 Group Goals</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Text style={styles.addTaskBtn}>+ Add Goal</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{maxHeight: 200}} showsVerticalScrollIndicator={false}>
          {tasks.map((task: any) => (
            <TouchableOpacity key={task.id} style={styles.taskRow} onPress={() => toggleTask(task.id, task.done)}>
              <View style={[styles.checkbox, task.done && styles.checkboxChecked]}>
                {task.done && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <Text style={[styles.taskTitle, task.done && styles.taskDoneText]}>{task.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Task Creation Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Group Goal</Text>
            <TextInput 
              style={styles.modalInput}
              placeholder="e.g. Solve 20 Physics Numericals"
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={addNewTask} disabled={isAddingTask}>
                {isAddingTask ? <ActivityIndicator color="#FFF" /> : <Text style={styles.confirmBtnText}>Add Goal</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.inputArea}>
          <TextInput style={styles.input} placeholder="Type a message..." value={inputText} onChangeText={setInputText} />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}><Text style={styles.sendBtnText}>Send</Text></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backBtn: { padding: 5 },
  backText: { color: '#2563EB', fontSize: 16, fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1E3A8A' },
  chatSection: { flex: 1 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 8 },
  myMessage: { alignSelf: 'flex-end', backgroundColor: '#2563EB' },
  otherMessage: { alignSelf: 'flex-start', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0' },
  senderName: { fontSize: 11, color: '#64748B', marginBottom: 4, fontWeight: 'bold' },
  messageText: { fontSize: 15, color: '#1E293B' },
  myMessageText: { color: '#FFF' },
  todoSection: { backgroundColor: '#FFF', padding: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, elevation: 20, shadowColor: '#000', shadowOpacity: 0.1 },
  todoHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  todoHeader: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  addTaskBtn: { color: '#2563EB', fontWeight: 'bold', fontSize: 15 },
  taskRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkboxChecked: { backgroundColor: '#10B981', borderColor: '#10B981' },
  checkMark: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  taskTitle: { fontSize: 15, color: '#334155', fontWeight: '500' },
  taskDoneText: { textDecorationLine: 'line-through', color: '#94A3B8' },
  inputArea: { flexDirection: 'row', padding: 15, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  input: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 25, paddingHorizontal: 20, height: 45, marginRight: 10 },
  sendBtn: { backgroundColor: '#2563EB', borderRadius: 25, paddingHorizontal: 20, justifyContent: 'center' },
  sendBtnText: { color: '#FFF', fontWeight: 'bold' },
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 20 },
  modalInput: { backgroundColor: '#F1F5F9', padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end' },
  cancelBtn: { padding: 12, marginRight: 10 },
  cancelBtnText: { color: '#64748B', fontWeight: 'bold' },
  confirmBtn: { backgroundColor: '#2563EB', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 },
  confirmBtnText: { color: '#FFF', fontWeight: 'bold' }
});