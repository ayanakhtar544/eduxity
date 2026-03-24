import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar, Modal, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { auth, db } from '../../firebaseConfig';  
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withRepeat, withTiming, interpolate, FadeInDown, FadeOutDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// 🔥 MODULAR COMPONENTS
import ChatBubble from '../../components/chat/ChatBubble';
import HomeworkDashboard from '../../components/chat/HomeworkDashboard';
import TodoList from '../../components/chat/TodoList';
import LiveTestModal from '../../components/chat/LiveTestModal';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png'; 

// TYPING INDICATOR
const TypingIndicator = () => {
  const dot1 = useSharedValue(0); const dot2 = useSharedValue(0); const dot3 = useSharedValue(0);
  useEffect(() => {
    dot1.value = withRepeat(withTiming(1, { duration: 400 }), -1, true);
    setTimeout(() => { dot2.value = withRepeat(withTiming(1, { duration: 400 }), -1, true); }, 150);
    setTimeout(() => { dot3.value = withRepeat(withTiming(1, { duration: 400 }), -1, true); }, 300);
  }, []);
  const style1 = useAnimatedStyle(() => ({ transform: [{ translateY: interpolate(dot1.value, [0, 1], [0, -5]) }] }));
  const style2 = useAnimatedStyle(() => ({ transform: [{ translateY: interpolate(dot2.value, [0, 1], [0, -5]) }] }));
  const style3 = useAnimatedStyle(() => ({ transform: [{ translateY: interpolate(dot3.value, [0, 1], [0, -5]) }] }));
  return (
    <Animated.View entering={FadeInDown.duration(300)} exiting={FadeOutDown.duration(200)} style={styles.typingWrapper}>
      <View style={styles.typingBubble}>
        <Animated.View style={[styles.typingDot, style1]} /><Animated.View style={[styles.typingDot, style2]} /><Animated.View style={[styles.typingDot, style3]} />
      </View>
    </Animated.View>
  );
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams(); 
  const router = useRouter();

  // --- STATES ---
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [groupInfo, setGroupInfo] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);

  // --- MODAL STATES ---
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showTestCreator, setShowTestCreator] = useState(false);
  const [bucketModalVisible, setBucketModalVisible] = useState(false);
  const [showStudyModal, setShowStudyModal] = useState(false);
  const [activeTest, setActiveTest] = useState<any>(null);
  
  // 🔥 NEW: TO-DO CREATOR MODAL STATE
  const [todoModalVisible, setTodoModalVisible] = useState(false);
  const [newTodoTask, setNewTodoTask] = useState('');

  // --- FORM STATES ---
  const [qType, setQType] = useState('mcq'); 
  const [qText, setQText] = useState('');
  const [mcqOptions, setMcqOptions] = useState(['', '', '', '']);
  const [correctOptionIdx, setCorrectOptionIdx] = useState(0);
  const [testTitle, setTestTitle] = useState('');
  const [testDuration, setTestDuration] = useState('15');
  const [testQuestions, setTestQuestions] = useState([{ q: '', options: ['', '', '', ''], correct: 0 }]);
  const [bucketTitle, setBucketTitle] = useState('');
  const [studyDuration, setStudyDuration] = useState('25');

  // --- DASHBOARD STATES ---
  const [dashboardVisible, setDashboardVisible] = useState(false);
  const [activeDashboardMessage, setActiveDashboardMessage] = useState<any>(null);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  // --- REFS ---
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sendButtonScale = useSharedValue(1);
  const sendBtnAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: sendButtonScale.value }] }));

  const isBlocked = groupInfo?.blocked?.includes(auth.currentUser?.uid);
  const isSomeoneTyping = groupInfo?.typing?.some((uid: string) => uid !== auth.currentUser?.uid);
  const isLeader = groupInfo?.admins?.includes(auth.currentUser?.uid) || groupInfo?.adminId === auth.currentUser?.uid;

  // --- FETCH DATA ---
  useEffect(() => {
    if (!id || !auth.currentUser) return;
    const chatId = String(id);
    const currentUid = auth.currentUser.uid;

    if (chatId.includes('_')) {
      const targetUid = chatId.split('_').find(uid => uid !== currentUid);
      if (targetUid) {
        getDoc(doc(db, 'users', targetUid)).then(uDoc => {
          if (uDoc.exists()) setOtherUser({ id: uDoc.id, ...uDoc.data() });
        });
      }
    }

    const unsubGroup = onSnapshot(doc(db, 'groups', chatId), async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGroupInfo(data);
        if (!chatId.includes('_') && (!data.name || data.isGroup === false || data.type === 'direct')) {
          const targetUid = (data.members || []).find((uid: string) => uid !== currentUid);
          if (targetUid) {
            const uDoc = await getDoc(doc(db, 'users', targetUid));
            if (uDoc.exists()) setOtherUser({ id: uDoc.id, ...uDoc.data() });
          }
        }
      }
    });

    const unsubMessages = onSnapshot(query(collection(db, 'groups', chatId, 'messages'), orderBy('createdAt', 'asc')), (snapshot) => {
      setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
    });

    return () => { unsubGroup(); unsubMessages(); };
  }, [id]);

  // --- ACTIONS ---
  const handleTyping = (text: string) => {
    setInputText(text);
    if (!auth.currentUser || !id) return;
    const uid = auth.currentUser.uid;
    const groupRef = doc(db, 'groups', String(id));

    updateDoc(groupRef, { typing: arrayUnion(uid) }).catch(() => {});
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { updateDoc(groupRef, { typing: arrayRemove(uid) }).catch(() => {}); }, 1500);
  };

  const sendMessage = async () => {
    if (inputText.trim() === '' || !auth.currentUser) return;
    sendButtonScale.value = withSpring(0.8, {}, () => { sendButtonScale.value = withSpring(1); });
    const textToSend = inputText.trim();
    setInputText(''); 
    
    updateDoc(doc(db, 'groups', String(id)), { typing: arrayRemove(auth.currentUser.uid) }).catch(() => {});
    
    await addDoc(collection(db, 'groups', id as string, 'messages'), {
      type: 'text', text: textToSend, senderId: auth.currentUser.uid, 
      senderName: auth.currentUser.displayName || 'User', 
      senderAvatar: auth.currentUser.photoURL || DEFAULT_AVATAR,
      createdAt: serverTimestamp(),
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleCreateStudyRoom = async () => {
    if (!auth.currentUser) return;
    const durationNum = parseInt(studyDuration) || 25;
    const endTime = Date.now() + (durationNum * 60000); 
    setShowStudyModal(false);
    
    const docRef = await addDoc(collection(db, 'groups', id as string, 'messages'), { 
      type: 'study_session', title: 'Deep Focus Session', duration: durationNum, endTime: endTime, senderId: auth.currentUser.uid, senderName: auth.currentUser.displayName || 'User', senderAvatar: auth.currentUser.photoURL || DEFAULT_AVATAR, activeParticipants: {}, logs: [`🟢 Session started by ${auth.currentUser.displayName?.split(' ')[0] || 'User'} for ${durationNum} mins.`], createdAt: serverTimestamp() 
    });
    router.push(`/study-room/${id}?sessionId=${docRef.id}`);
  };

  const handleHeaderInfoClick = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (otherUser?.id) router.push(`/user/${otherUser.id}`);
    else if (groupInfo?.name) router.push(`/chat/info/${id}`);
  };

  // --- CREATION ACTIONS ---
  // 🔥 NEW: TO-DO TASK CREATOR
  const handleCreateTodo = async () => {
    if (!newTodoTask.trim() || !auth.currentUser) return;
    setTodoModalVisible(false);
    await addDoc(collection(db, 'groups', id as string, 'todos'), { 
      task: newTodoTask.trim(), createdAt: serverTimestamp(), completedBy: [] 
    });
    setNewTodoTask('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSendQuestion = async () => {
    if (!qText.trim() || !auth.currentUser) return;
    await addDoc(collection(db, 'groups', id as string, 'messages'), {
      type: qType, text: qText.trim(), options: qType === 'mcq' ? mcqOptions.filter(opt => opt.trim() !== '') : [],
      correctOption: qType === 'mcq' ? correctOptionIdx : null, responses: {}, senderId: auth.currentUser.uid, senderName: auth.currentUser.displayName || 'Leader', senderAvatar: auth.currentUser.photoURL || DEFAULT_AVATAR, createdAt: serverTimestamp(),
    });
    setShowQuestionModal(false); setQText(''); setMcqOptions(['', '', '', '']);
  };

  const handleSendTest = async () => {
    if (!testTitle.trim() || testQuestions.length === 0 || !auth.currentUser) return;
    await addDoc(collection(db, 'groups', id as string, 'messages'), {
      type: 'test', title: testTitle.trim(), duration: parseInt(testDuration) || 15, questions: testQuestions, responses: {}, senderId: auth.currentUser.uid, senderName: auth.currentUser.displayName || 'Leader', senderAvatar: auth.currentUser.photoURL || DEFAULT_AVATAR, createdAt: serverTimestamp(),
    });
    setShowTestCreator(false); setTestTitle(''); setTestQuestions([{ q: '', options: ['', '', '', ''], correct: 0 }]);
  };

  const createHomeworkBucket = async () => {
    if (!bucketTitle.trim() || !auth.currentUser) return;
    setBucketModalVisible(false);
    await addDoc(collection(db, 'groups', id as string, 'messages'), { title: bucketTitle.trim(), senderId: auth.currentUser.uid, senderName: auth.currentUser.displayName, senderAvatar: auth.currentUser.photoURL || DEFAULT_AVATAR, type: 'homework_bucket', submissions: {}, createdAt: serverTimestamp() });
    setBucketTitle('');
  };

  if (isBlocked) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="ban" size={60} color="#ef4444" style={{ marginBottom: 20 }} />
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#1e293b' }}>You are Blocked</Text>
        <TouchableOpacity style={{ marginTop: 30, backgroundColor: '#f1f5f9', padding: 15, borderRadius: 12 }} onPress={() => router.replace('/(tabs)/explore')}><Text style={{ fontWeight: '700' }}>Go Back</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  const headerTitle = otherUser?.displayName || otherUser?.name || otherUser?.username || groupInfo?.name || "Student";
  const headerSubtitle = otherUser ? "View Profile " : "Tap for Group Info ";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      
      {/* HEADER */}
      <View style={styles.headerContainer}>
        <LinearGradient colors={['#1e3a8a', '#2563eb']} style={StyleSheet.absoluteFill} />
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Ionicons name="chevron-back" size={28} color="#fff" /></TouchableOpacity>
          <TouchableOpacity style={styles.headerTextContainer} onPress={handleHeaderInfoClick}>
            <Text style={styles.groupName} numberOfLines={1}>{headerTitle}</Text>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text style={styles.groupStatus}>{headerSubtitle}</Text>
              <Ionicons name="chevron-forward" size={12} color="#bfdbfe" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowStudyModal(true)} style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, marginLeft: 'auto' }}>
            <Ionicons name="headset" size={22} color="#a78bfa" />
          </TouchableOpacity>
        </View>
      </View>

      {/* CHAT AREA */}
      <KeyboardAvoidingView style={styles.chatArea} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        {loading ? <View style={styles.loaderContainer}><ActivityIndicator size="large" color="#2563eb" /></View> : (
         <FlatList
            ref={flatListRef} 
            data={messages} 
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 15, paddingBottom: 10 }} 
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <ChatBubble 
                message={item} 
                isMe={item.senderId === auth.currentUser?.uid} 
                groupId={id} 
                onOpenTest={(msg: any) => setActiveTest(msg)} 
                openDashboard={(msg: any) => { setActiveDashboardMessage(msg); setDashboardVisible(true); }} 
              />
            )}
            ListFooterComponent={() => isSomeoneTyping ? <TypingIndicator /> : <View style={{height: 10}}/>}
          />
        )}

        {/* 🔥 MODULAR TO-DO TRAY */}
        {!otherUser && <TodoList groupId={id as string} isLeader={isLeader} />}

        {/* INPUT BOX */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={{ marginRight: 10, padding: 5 }} onPress={() => setShowActionMenu(true)}><Ionicons name="add-circle" size={28} color="#94a3b8" /></TouchableOpacity>
          <TextInput style={styles.textInput} placeholder="Type a message..." placeholderTextColor="#94a3b8" value={inputText} onChangeText={handleTyping} multiline />
          <Animated.View style={sendBtnAnimatedStyle}>
            <TouchableOpacity style={[styles.sendButton, inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive]} onPress={sendMessage} disabled={!inputText.trim()}>
              <Ionicons name="send" size={20} color={inputText.trim() ? "#fff" : "#94a3b8"} style={{ marginLeft: 3 }} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>

      {/* 🔥 MODULAR LIVE TEST MODAL */}
      <LiveTestModal activeTest={activeTest} onClose={() => setActiveTest(null)} groupId={id as string} />

      {/* ACTION MENU */}
      <Modal visible={showActionMenu} transparent animationType="fade">
        <TouchableOpacity style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'}} onPress={() => setShowActionMenu(false)}>
          <View style={{ backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 20 }}>Choose Attachment</Text>
            <TouchableOpacity style={styles.actionMenuBtn} onPress={() => { setShowActionMenu(false); setShowQuestionModal(true); }}>
              <View style={[styles.actionMenuIcon, { backgroundColor: '#dbeafe' }]}><Ionicons name="stats-chart" size={24} color="#2563eb" /></View>
              <View><Text style={styles.actionMenuTitle}>Poll / Question</Text><Text style={styles.actionMenuSub}>Ask an MCQ or subjective doubt</Text></View>
            </TouchableOpacity>
            {!otherUser && (
              <>
                <TouchableOpacity style={styles.actionMenuBtn} onPress={() => { setShowActionMenu(false); setShowTestCreator(true); }}>
                  <View style={[styles.actionMenuIcon, { backgroundColor: '#e0e7ff' }]}><Ionicons name="timer" size={24} color="#4f46e5" /></View>
                  <View><Text style={styles.actionMenuTitle}>Live Test</Text><Text style={styles.actionMenuSub}>Create a timed test</Text></View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionMenuBtn} onPress={() => { setShowActionMenu(false); setBucketModalVisible(true); }}>
                  <View style={[styles.actionMenuIcon, { backgroundColor: '#fce7f3' }]}><Ionicons name="folder-open" size={24} color="#db2777" /></View>
                  <View><Text style={styles.actionMenuTitle}>Homework Bucket</Text><Text style={styles.actionMenuSub}>Folder for assignment uploads</Text></View>
                </TouchableOpacity>
                {/* 🔥 NEW: TO-DO BUTTON IN ACTION MENU */}
                <TouchableOpacity style={styles.actionMenuBtn} onPress={() => { setShowActionMenu(false); setTodoModalVisible(true); }}>
                  <View style={[styles.actionMenuIcon, { backgroundColor: '#fef3c7' }]}><Ionicons name="list" size={24} color="#d97706" /></View>
                  <View><Text style={styles.actionMenuTitle}>To-Do Task</Text><Text style={styles.actionMenuSub}>Assign a new task to members</Text></View>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 🔥 NEW: TO-DO TASK CREATOR MODAL */}
      <Modal visible={todoModalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1, backgroundColor: '#f8fafc'}}>
          <View style={{padding: 20}}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#0f172a', marginBottom: 10, marginTop: 20 }}>Assign a Task 📋</Text>
            <TextInput style={[styles.textInput, { height: 50, marginBottom: 20, maxHeight: 50 }]} placeholder="e.g. Read Chapter 5" value={newTodoTask} onChangeText={setNewTodoTask} />
            <TouchableOpacity style={{ backgroundColor: '#d97706', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }} onPress={handleCreateTodo}><Text style={{ color: '#fff', fontWeight: 'bold' }}>Create Task</Text></TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={() => setTodoModalVisible(false)}><Text style={{ color: '#64748b', fontWeight: '700' }}>Cancel</Text></TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* CREATION MODALS */}
      <Modal visible={showStudyModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1, backgroundColor: '#f8fafc'}}>
          <View style={{padding: 20}}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#0f172a', marginBottom: 10, marginTop: 20 }}>Start Focus Session 🎧</Text>
            <Text style={{color: '#64748b', marginBottom: 10, fontWeight: '600'}}>Duration (Minutes)</Text>
            <TextInput style={[styles.textInput, { height: 50, marginBottom: 20, maxHeight: 50 }]} placeholder="e.g. 25" keyboardType="numeric" value={studyDuration} onChangeText={setStudyDuration} />
            <TouchableOpacity style={{ backgroundColor: '#8b5cf6', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }} onPress={handleCreateStudyRoom}><Text style={{ color: '#fff', fontWeight: 'bold' }}>Create Room 🚀</Text></TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={() => setShowStudyModal(false)}><Text style={{ color: '#64748b', fontWeight: '700' }}>Cancel</Text></TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={bucketModalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1, backgroundColor: '#f8fafc'}}>
          <View style={{padding: 20}}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#0f172a', marginBottom: 10, marginTop: 20 }}>Create Homework Bucket</Text>
            <TextInput style={[styles.textInput, { height: 50, marginBottom: 20, maxHeight: 50 }]} placeholder="e.g. Chapter 4 Numericals" value={bucketTitle} onChangeText={setBucketTitle} />
            <TouchableOpacity style={{ backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }} onPress={createHomeworkBucket}><Text style={{ color: '#fff', fontWeight: 'bold' }}>Create Bucket 🪣</Text></TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={() => setBucketModalVisible(false)}><Text style={{ color: '#64748b', fontWeight: '700' }}>Cancel</Text></TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 📝 LIVE TEST CREATOR MODAL */}
      <Modal visible={showTestCreator} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1, backgroundColor: '#f8fafc'}}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Live Test</Text>
            <TouchableOpacity onPress={() => setShowTestCreator(false)}>
              <Ionicons name="close-circle" size={30} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={{ padding: 20 }}>
            <Text style={{fontWeight: '700', color: '#64748b', marginBottom: 5}}>Test Title</Text>
            <TextInput 
              style={[styles.textInput, {marginBottom: 15}]} 
              placeholder="e.g. Physics Mock Test 1" 
              value={testTitle} 
              onChangeText={setTestTitle} 
            />
            
            <Text style={{fontWeight: '700', color: '#64748b', marginBottom: 5}}>Duration (Minutes)</Text>
            <TextInput 
              style={[styles.textInput, {marginBottom: 20}]} 
              placeholder="15" 
              keyboardType="numeric" 
              value={testDuration} 
              onChangeText={setTestDuration} 
            />

            <View style={{height: 1, backgroundColor: '#e2e8f0', marginVertical: 10}} />

            {testQuestions.map((q, qIdx) => (
              <View key={qIdx} style={{marginBottom: 25, padding: 15, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0'}}>
                <Text style={{fontWeight: '900', color: '#1e293b', marginBottom: 10}}>Question {qIdx + 1}</Text>
                
                <TextInput 
                  style={[styles.textInput, {marginBottom: 15, minHeight: 60, textAlignVertical: 'top'}]} 
                  placeholder="Type question here..." 
                  multiline
                  value={q.q} 
                  onChangeText={(t) => { 
                    const newQ = [...testQuestions]; 
                    newQ[qIdx].q = t; 
                    setTestQuestions(newQ); 
                  }} 
                />
                
                <Text style={{fontSize: 12, fontWeight: '700', color: '#94a3b8', marginBottom: 10}}>OPTIONS (Select correct one)</Text>
                
                {q.options.map((opt, oIdx) => (
                  <View key={oIdx} style={{flexDirection: 'row', alignItems: 'center', marginBottom: 10}}>
                    <TouchableOpacity onPress={() => { 
                      const newQ = [...testQuestions]; 
                      newQ[qIdx].correct = oIdx; 
                      setTestQuestions(newQ); 
                    }}>
                      <Ionicons name={q.correct === oIdx ? "radio-button-on" : "radio-button-off"} size={24} color={q.correct === oIdx ? "#10b981" : "#94a3b8"} style={{marginRight: 10}} />
                    </TouchableOpacity>
                    <TextInput 
                      style={[styles.textInput, {flex: 1, maxHeight: 45}]} 
                      placeholder={`Option ${oIdx + 1}`} 
                      value={opt} 
                      onChangeText={(t) => { 
                        const newQ = [...testQuestions]; 
                        newQ[qIdx].options[oIdx] = t; 
                        setTestQuestions(newQ); 
                      }} 
                    />
                  </View>
                ))}
              </View>
            ))}

            <TouchableOpacity style={{backgroundColor: '#e0e7ff', padding: 12, borderRadius: 12, alignItems: 'center', marginBottom: 20}} onPress={() => setTestQuestions([...testQuestions, { q: '', options: ['', '', '', ''], correct: 0 }])}>
              <Text style={{color: '#4f46e5', fontWeight: '800'}}>+ Add Another Question</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ backgroundColor: '#4f46e5', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginBottom: 50 }} onPress={handleSendTest}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Send Test to Group 🚀</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showQuestionModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1, backgroundColor: '#f8fafc'}}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ask a Question</Text>
            <TouchableOpacity onPress={() => setShowQuestionModal(false)}><Ionicons name="close-circle" size={30} color="#94a3b8" /></TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 20 }}>
            <View style={{ flexDirection: 'row', marginBottom: 20 }}>
              <TouchableOpacity style={[styles.typeBtn, qType === 'mcq' && styles.typeBtnActive]} onPress={() => setQType('mcq')}><Text style={[styles.typeBtnText, qType === 'mcq' && {color: '#fff'}]}>MCQ</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.typeBtn, qType === 'subjective' && styles.typeBtnActive]} onPress={() => setQType('subjective')}><Text style={[styles.typeBtnText, qType === 'subjective' && {color: '#fff'}]}>Written Answer</Text></TouchableOpacity>
            </View>
            <TextInput style={[styles.textInput, {height: 80, textAlignVertical: 'top', marginBottom: 20}]} placeholder="Type your question..." multiline value={qText} onChangeText={setQText} />
            {qType === 'mcq' && (
              <View>
                {mcqOptions.map((opt, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <TouchableOpacity onPress={() => setCorrectOptionIdx(idx)} style={{marginRight: 10}}><Ionicons name={correctOptionIdx === idx ? "radio-button-on" : "radio-button-off"} size={24} color={correctOptionIdx === idx ? "#10b981" : "#94a3b8"} /></TouchableOpacity>
                    <TextInput style={[styles.textInput, {maxHeight: 50}]} placeholder={`Option ${idx + 1}`} value={opt} onChangeText={(text) => { const newOpts = [...mcqOptions]; newOpts[idx] = text; setMcqOptions(newOpts); }} />
                  </View>
                ))}
              </View>
            )}
            <TouchableOpacity style={{ backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 20, marginBottom: 50 }} onPress={handleSendQuestion}><Text style={{ color: '#fff', fontWeight: 'bold' }}>Send Question</Text></TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* DASHBOARD */}
      <HomeworkDashboard visible={dashboardVisible} onClose={() => setDashboardVisible(false)} message={activeDashboardMessage} groupMembers={groupInfo?.members} setViewerImage={setViewerImage} />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerContainer: { height: Platform.OS === 'ios' ? 100 : 80, justifyContent: 'flex-end', paddingBottom: 15, elevation: 5 },
  headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingTop: Platform.OS === 'ios' ? 40 : 10 },
  backButton: { padding: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },
  headerTextContainer: { flex: 1, marginLeft: 15 },
  groupName: { fontSize: 20, fontWeight: '800', color: '#fff' },
  groupStatus: { fontSize: 13, color: '#bfdbfe', marginTop: 2, fontWeight: '600' },
  chatArea: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, paddingBottom: Platform.OS === 'ios' ? 30 : 15, backgroundColor: '#ffffff' },
  textInput: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 24, paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 12 : 8, marginRight: 10, maxHeight: 120, fontSize: 16 },
  sendButton: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  sendButtonActive: { backgroundColor: '#2563eb' },
  sendButtonInactive: { backgroundColor: '#e2e8f0' },
  actionMenuBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 }, 
  actionMenuIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 }, 
  actionMenuTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' }, 
  actionMenuSub: { fontSize: 13, color: '#64748b' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  typeBtn: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#f1f5f9', marginHorizontal: 5, borderRadius: 12 },
  typeBtnActive: { backgroundColor: '#2563eb' },
  typeBtnText: { fontWeight: '700', color: '#64748b' },
  typingWrapper: { alignSelf: 'flex-start', marginBottom: 15, marginLeft: 15 },
  typingBubble: { backgroundColor: '#e2e8f0', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 18, borderBottomLeftRadius: 4, flexDirection: 'row', alignItems: 'center', width: 60, justifyContent: 'space-between' },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#64748b' }
});