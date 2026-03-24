import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../firebaseConfig';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

export default function TodoList({ groupId, isLeader }: { groupId: string, isLeader: boolean }) {
  const [todos, setTodos] = useState<any[]>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [isTodoExpanded, setIsTodoExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'progress'>('tasks');
  
  // Progress Board States
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [userStats, setUserStats] = useState<any>({});
  
  const todoHeight = useSharedValue(0);
  const currentUid = auth.currentUser?.uid;

  // 1. Fetch Todos & Group Members
  useEffect(() => {
    if (!groupId) return;
    
    // Fetch Todos
    const unsub = onSnapshot(query(collection(db, 'groups', groupId, 'todos'), orderBy('createdAt', 'desc')), (snapshot) => {
      setTodos(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    
    // Fetch Group Members (For Progress Board)
    getDoc(doc(db, 'groups', groupId)).then(snap => {
      if (snap.exists()) setGroupMembers(snap.data().members || []);
    });

    return () => unsub();
  }, [groupId]);

  // 2. Calculate Progress Stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!isTodoExpanded || activeTab !== 'progress' || groupMembers.length === 0) return;
      
      const stats: any = { ...userStats };
      
      for (const uid of groupMembers) {
        const completed = todos.filter(t => t.completedBy?.includes(uid)).length;
        const pending = todos.length - completed;
        
        if (!stats[uid]) {
          const uDoc = await getDoc(doc(db, 'users', uid));
          const name = uDoc.exists() ? uDoc.data().displayName || uDoc.data().name || 'Student' : 'Student';
          const avatar = uDoc.exists() ? uDoc.data().photoURL || DEFAULT_AVATAR : DEFAULT_AVATAR;
          stats[uid] = { name, avatar, completed, pending, total: todos.length };
        } else {
          // Update numbers if user already exists
          stats[uid] = { ...stats[uid], completed, pending, total: todos.length };
        }
      }
      setUserStats(stats);
    };
    
    fetchStats();
  }, [todos, isTodoExpanded, activeTab, groupMembers]);

  // 3. Tray Animation
  useEffect(() => {
    todoHeight.value = withTiming(isTodoExpanded ? 400 : 0, { duration: 300 });
  }, [isTodoExpanded]);

  const animatedTodoStyle = useAnimatedStyle(() => ({ height: todoHeight.value, opacity: todoHeight.value > 10 ? 1 : 0, overflow: 'hidden' }));

  // 🔥 BULK ADD LOGIC (Multiple tasks via New Line)
  const handleAddTodo = async () => {
    if (!newTodoText.trim() || !isLeader) return;
    
    // Split by Enter (\n) and filter out empty lines
    const tasks = newTodoText.split('\n').filter(t => t.trim() !== '');
    
    for (const task of tasks) {
      await addDoc(collection(db, 'groups', groupId, 'todos'), { 
        task: task.trim(), 
        createdAt: serverTimestamp(), 
        completedBy: [] 
      });
    }
    
    setNewTodoText('');
    setActiveTab('tasks'); 
  };

  const toggleTodo = async (todoId: string, currentCompletedBy: string[]) => {
    if (!currentUid) return;
    let updatedCompletedBy = [...currentCompletedBy];
    if (updatedCompletedBy.includes(currentUid)) updatedCompletedBy = updatedCompletedBy.filter(i => i !== currentUid);
    else updatedCompletedBy.push(currentUid);
    await updateDoc(doc(db, 'groups', groupId, 'todos', todoId), { completedBy: updatedCompletedBy });
  };
  
  if (todos.length === 0 && !isLeader) return null;

  return (
    <View style={styles.todoTrayContainer}>
      {/* TRAY HEADER */}
      <TouchableOpacity style={styles.todoTab} onPress={() => setIsTodoExpanded(!isTodoExpanded)}>
        <Ionicons name="list" size={18} color="#92400e" style={{ marginRight: 8 }} />
        <Text style={styles.todoTabText}>
          Group Tasks ({todos.filter(t => !t.completedBy?.includes(currentUid)).length} pending)
        </Text>
        <Ionicons name={isTodoExpanded ? "chevron-down" : "chevron-up"} size={18} color="#92400e" style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>
      
      <Animated.View style={[styles.todoContent, animatedTodoStyle]}>
        
        {/* 🔥 TABS: TASKS vs PROGRESS */}
        <View style={styles.tabToggleRow}>
          <TouchableOpacity style={[styles.toggleBtn, activeTab === 'tasks' && styles.toggleBtnActive]} onPress={() => setActiveTab('tasks')}>
            <Text style={[styles.toggleText, activeTab === 'tasks' && styles.toggleTextActive]}>Tasks</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleBtn, activeTab === 'progress' && styles.toggleBtnActive]} onPress={() => setActiveTab('progress')}>
            <Text style={[styles.toggleText, activeTab === 'progress' && styles.toggleTextActive]}>Progress Board</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'tasks' ? (
          <>
            {/* TASK LIST */}
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={{flex: 1}}>
              {todos.length === 0 && <Text style={styles.emptyText}>No active tasks. Leader can add them below!</Text>}
              {todos.map(todo => {
                const isDone = todo.completedBy?.includes(currentUid);
                return (
                  <View key={todo.id} style={styles.todoItem}>
                    <TouchableOpacity style={styles.todoRow} onPress={() => toggleTodo(todo.id, todo.completedBy || [])}>
                      <Ionicons name={isDone ? "checkmark-circle" : "ellipse-outline"} size={24} color={isDone ? "#10b981" : "#cbd5e1"} />
                      <Text style={[styles.todoText, isDone && styles.todoTextDone]}>{todo.task}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
            
            {/* MULTILINE BULK ADDER */}
            {isLeader && (
              <View style={styles.addTodoBox}>
                <TextInput 
                  style={styles.todoInputMulti} 
                  placeholder="Paste a list or type multiple tasks (Press Enter for new task)" 
                  multiline 
                  value={newTodoText} 
                  onChangeText={setNewTodoText} 
                />
                <TouchableOpacity style={styles.addTodoBtn} onPress={handleAddTodo}>
                  <Ionicons name="send" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          /* PROGRESS BOARD */
          <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={{flex: 1, paddingTop: 10}}>
            {todos.length === 0 ? (
               <Text style={styles.emptyText}>Add some tasks first to see progress!</Text>
            ) : (
              Object.keys(userStats).map(uid => {
                const stat = userStats[uid];
                const percent = stat.total > 0 ? (stat.completed / stat.total) * 100 : 0;
                
                return (
                  <View key={uid} style={styles.statCard}>
                    <Image source={{uri: stat.avatar}} style={styles.statAvatar} />
                    <View style={{flex: 1}}>
                      <Text style={styles.statName}>{stat.name}</Text>
                      <Text style={styles.statDetail}>
                        <Text style={{color: '#10b981', fontWeight: '800'}}>{stat.completed} Done</Text> • <Text style={{color: '#ef4444', fontWeight: '800'}}>{stat.pending} Pending</Text>
                      </Text>
                      <View style={styles.progressBg}>
                        <View style={[styles.progressFill, { width: `${percent}%` }]} />
                      </View>
                    </View>
                    <Text style={styles.statPercent}>{Math.round(percent)}%</Text>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  todoTrayContainer: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOffset: {width: 0, height: -5}, shadowOpacity: 0.1, shadowRadius: 10, elevation: 15 },
  todoTab: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', paddingVertical: 12, paddingHorizontal: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  todoTabText: { fontSize: 14, fontWeight: '800', color: '#92400e' },
  todoContent: { backgroundColor: '#fff', paddingHorizontal: 15 },
  
  tabToggleRow: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4, marginTop: 15, marginBottom: 10 },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  toggleBtnActive: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2 },
  toggleText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  toggleTextActive: { color: '#2563eb' },
  
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 20, fontWeight: '600' },
  
  todoItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  todoRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  todoText: { fontSize: 15, color: '#1e293b', marginLeft: 12, flex: 1, fontWeight: '600' },
  todoTextDone: { color: '#94a3b8', textDecorationLine: 'line-through' },
  
  addTodoBox: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 10, marginBottom: 15, borderTopWidth: 1, borderColor: '#f1f5f9', paddingTop: 10 },
  todoInputMulti: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 16, paddingHorizontal: 15, paddingTop: 12, paddingBottom: 12, minHeight: 45, maxHeight: 100, fontSize: 14 },
  addTodoBtn: { backgroundColor: '#2563eb', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  
  statCard: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f8fafc', borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  statAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e2e8f0', marginRight: 12 },
  statName: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  statDetail: { fontSize: 11, color: '#64748b', marginBottom: 6 },
  progressBg: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, width: '90%', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#2563eb', borderRadius: 3 },
  statPercent: { fontSize: 16, fontWeight: '900', color: '#0f172a' }
});