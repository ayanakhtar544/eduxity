// Location: app/chat/[id].tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar, Modal, ScrollView, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { auth, db } from '../../firebaseConfig';  
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withRepeat, withTiming, interpolate, FadeInDown, FadeOutDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';

import ChatBubble from '../../components/chat/ChatBubble';
import HomeworkDashboard from '../../components/chat/HomeworkDashboard';
import TodoList from '../../components/chat/TodoList';
import LiveTestModal from '../../components/chat/LiveTestModal';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png'; 

// 🛑 GLOBAL APP LIMITS FOR FREE TIER
const LIMITS = {
  MAX_MESSAGE_LENGTH: 1000,
  MAX_TEST_QUESTIONS: 25,
  MAX_QUESTION_LENGTH: 400,
  MAX_TITLE_LENGTH: 80,
  MAX_DURATION_MINS: 180,
  MAX_OPTIONS_LENGTH: 100
};

const TypingBubble = () => {
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
        <Animated.View style={[styles.typingDot, style1]} />
        <Animated.View style={[styles.typingDot, style2]} />
        <Animated.View style={[styles.typingDot, style3]} />
      </View>
    </Animated.View>
  );
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams(); 
  const router = useRouter();

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [groupInfo, setGroupInfo] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);

  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showTestCreator, setShowTestCreator] = useState(false);
  const [bucketModalVisible, setBucketModalVisible] = useState(false);
  const [showStudyModal, setShowStudyModal] = useState(false);
  const [activeTest, setActiveTest] = useState<any>(null);
  const [todoModalVisible, setTodoModalVisible] = useState(false);
  const [newTodoTask, setNewTodoTask] = useState('');

  const [qType, setQType] = useState('mcq'); 
  const [qText, setQText] = useState('');
  const [mcqOptions, setMcqOptions] = useState(['', '', '', '']);
  const [correctOptionIdx, setCorrectOptionIdx] = useState(0);
  
  const [testTitle, setTestTitle] = useState('');
  const [testDuration, setTestDuration] = useState('15');
  const [testNtaFormat, setTestNtaFormat] = useState(false);
  const [testQuestions, setTestQuestions] = useState([{ q: '', options: ['', '', '', ''], correct: 0, posMarks: '4', negMarks: '1' }]);
  
  const [bucketTitle, setBucketTitle] = useState('');
  const [studyDuration, setStudyDuration] = useState('25');

  const [dashboardVisible, setDashboardVisible] = useState(false);
  const [activeDashboardMessage, setActiveDashboardMessage] = useState<any>(null);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sendButtonScale = useSharedValue(1);
  const sendBtnAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: sendButtonScale.value }] }));

  const isBlocked = groupInfo?.blocked?.includes(auth.currentUser?.uid);
  const isLeader = groupInfo?.admins?.includes(auth.currentUser?.uid) || groupInfo?.adminId === auth.currentUser?.uid;

  const typingUids = groupInfo?.typing?.filter((uid: string) => uid !== auth.currentUser?.uid) || [];
  const isSomeoneTyping = typingUids.length > 0;
  
  let typingText = "Someone is typing...";
  if (isSomeoneTyping) {
    if (otherUser && typingUids.includes(otherUser.id)) {
      typingText = `${otherUser.displayName?.split(' ')[0] || otherUser.name || 'User'} is typing...`;
    } else if (typingUids.length > 1) {
      typingText = "Several people are typing...";
    }
  }

  useEffect(() => {
    if (!id || !auth.currentUser) return;
    const chatId = String(id);
    const currentUid = auth.currentUser.uid;

    if (chatId.includes('_')) {
      const targetUid = chatId.split('_').find(uid => uid !== currentUid);
      if (targetUid) getDoc(doc(db, 'users', targetUid)).then(uDoc => { if (uDoc.exists()) setOtherUser({ id: uDoc.id, ...uDoc.data() }); });
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

  const handleTyping = (text: string) => {
    // 🛡️ FRONTEND LIMIT: Prevent typing beyond limit
    if (text.length > LIMITS.MAX_MESSAGE_LENGTH) {
       Alert.alert("Limit Reached", `Messages cannot exceed ${LIMITS.MAX_MESSAGE_LENGTH} characters.`);
       return;
    }
    setInputText(text);
    
    if (!auth.currentUser || !id) return;
    const uid = auth.currentUser.uid;
    const groupRef = doc(db, 'groups', String(id));

    if (text.trim() === '') {
      updateDoc(groupRef, { typing: arrayRemove(uid) }).catch(() => {});
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      return;
    }

    updateDoc(groupRef, { typing: arrayUnion(uid) }).catch(() => {});
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { updateDoc(groupRef, { typing: arrayRemove(uid) }).catch(() => {}); }, 2000);
  };

  const sendMessage = async () => {
    if (inputText.trim() === '' || !auth.currentUser) return;
    if (inputText.length > LIMITS.MAX_MESSAGE_LENGTH) return;
    
    const textToSend = inputText.trim();
    setInputText(''); 
    
    sendButtonScale.value = withSpring(0.8, {}, () => { sendButtonScale.value = withSpring(1); });
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    updateDoc(doc(db, 'groups', String(id)), { typing: arrayRemove(auth.currentUser.uid) }).catch(() => {});
    
    await addDoc(collection(db, 'groups', id as string, 'messages'), {
      type: 'text', 
      text: textToSend, 
      senderId: auth.currentUser.uid, 
      senderName: auth.currentUser.displayName || 'User', 
      senderAvatar: auth.currentUser.photoURL || DEFAULT_AVATAR,
      createdAt: serverTimestamp(),
    });
    
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleCreateStudyRoom = async () => {
    if (!auth.currentUser) return;
    let durationNum = parseInt(studyDuration) || 25;
    // 🛡️ FRONTEND LIMIT: Max Duration
    if (durationNum > LIMITS.MAX_DURATION_MINS) durationNum = LIMITS.MAX_DURATION_MINS;

    const endTime = Date.now() + (durationNum * 60000); 
    setShowStudyModal(false);
    
    const docRef = await addDoc(collection(db, 'groups', id as string, 'messages'), { 
      type: 'study_session', title: 'Deep Focus Session', duration: durationNum, endTime: endTime, senderId: auth.currentUser.uid, senderName: auth.currentUser.displayName || 'User', senderAvatar: auth.currentUser.photoURL || DEFAULT_AVATAR, activeParticipants: {}, logs: [`🟢 Session started by ${auth.currentUser.displayName?.split(' ')[0] || 'User'} for ${durationNum} mins.`], createdAt: serverTimestamp() 
    });
    router.push(`/study-room/${id}?sessionId=${docRef.id}`);
  };

  const handleHeaderInfoClick = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (otherUser?.id) router.push(`/user/${otherUser.id}`);
    else if (groupInfo?.name) router.push(`/chat/info/${id}`);
  };

  const handleCreateTodo = async () => {
    if (!newTodoTask.trim() || !auth.currentUser) return;
    setTodoModalVisible(false);
    await addDoc(collection(db, 'groups', id as string, 'todos'), { 
      // 🛡️ FRONTEND LIMIT: Trim title
      task: newTodoTask.trim().substring(0, LIMITS.MAX_TITLE_LENGTH), 
      createdAt: serverTimestamp(), completedBy: [] 
    });
    setNewTodoTask('');
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSendQuestion = async () => {
    if (!qText.trim() || !auth.currentUser) return;
    await addDoc(collection(db, 'groups', id as string, 'messages'), {
      type: qType, 
      text: qText.trim().substring(0, LIMITS.MAX_QUESTION_LENGTH), 
      options: qType === 'mcq' ? mcqOptions.map(o => o.substring(0, LIMITS.MAX_OPTIONS_LENGTH)).filter(opt => opt.trim() !== '') : [],
      correctOption: qType === 'mcq' ? correctOptionIdx : null, responses: {}, senderId: auth.currentUser.uid, senderName: auth.currentUser.displayName || 'Leader', senderAvatar: auth.currentUser.photoURL || DEFAULT_AVATAR, createdAt: serverTimestamp(),
    });
    setShowQuestionModal(false); setQText(''); setMcqOptions(['', '', '', '']);
  };

  const handleSendTest = async () => {
    if (!testTitle.trim() || testQuestions.length === 0 || !auth.currentUser) return;
    
    // 🛡️ SECURITY CHECK BEFORE UPLOAD
    if (testQuestions.length > LIMITS.MAX_TEST_QUESTIONS) {
        Alert.alert("Limit Reached", `You can only add up to ${LIMITS.MAX_TEST_QUESTIONS} questions per test in the free tier.`);
        return;
    }

    let durationNum = parseInt(testDuration) || 15;
    if (durationNum > LIMITS.MAX_DURATION_MINS) durationNum = LIMITS.MAX_DURATION_MINS;

    const formattedQuestions = testQuestions.map(q => ({
      ...q,
      q: q.q.substring(0, LIMITS.MAX_QUESTION_LENGTH), // Limit question length
      options: q.options.map(o => o.substring(0, LIMITS.MAX_OPTIONS_LENGTH)),
      posMarks: parseInt(q.posMarks) || 4,
      negMarks: parseInt(q.negMarks) || 0
    }));

    await addDoc(collection(db, 'groups', id as string, 'messages'), {
      type: 'test', 
      title: testTitle.trim().substring(0, LIMITS.MAX_TITLE_LENGTH), 
      duration: durationNum, 
      ntaFormat: testNtaFormat,
      questions: formattedQuestions, 
      responses: {}, 
      senderId: auth.currentUser.uid, 
      senderName: auth.currentUser.displayName || 'Leader', 
      senderAvatar: auth.currentUser.photoURL || DEFAULT_AVATAR, 
      createdAt: serverTimestamp(),
    });
    
    setShowTestCreator(false); 
    setTestTitle(''); 
    setTestNtaFormat(false);
    setTestQuestions([{ q: '', options: ['', '', '', ''], correct: 0, posMarks: '4', negMarks: '1' }]);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const createHomeworkBucket = async () => {
    if (!bucketTitle.trim() || !auth.currentUser) return;
    setBucketModalVisible(false);
    await addDoc(collection(db, 'groups', id as string, 'messages'), { 
      title: bucketTitle.trim().substring(0, LIMITS.MAX_TITLE_LENGTH), 
      senderId: auth.currentUser.uid, senderName: auth.currentUser.displayName, senderAvatar: auth.currentUser.photoURL || DEFAULT_AVATAR, type: 'homework_bucket', submissions: {}, createdAt: serverTimestamp() 
    });
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
  const headerSubtitle = otherUser ? "View Profile" : "Tap for Group Info";
  const headerAvatar = otherUser?.photoURL || groupInfo?.avatar || DEFAULT_AVATAR;
  const noOutlineStyle = Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {};

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      
      {/* 🌟 PREMIUM HEADER WITH AVATAR */}
      <View style={styles.headerContainer}>
        <LinearGradient colors={['#1e3a8a', '#2563eb']} style={StyleSheet.absoluteFill} />
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.headerProfileClickArea} onPress={handleHeaderInfoClick}>
            <Image source={{ uri: headerAvatar }} style={styles.headerAvatar} contentFit="cover" transition={200} />
            <View style={styles.headerTextContainer}>
              <Text style={styles.groupName} numberOfLines={1}>{headerTitle}</Text>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                {isSomeoneTyping ? (
                  <Text style={styles.headerTypingText}>{typingText}</Text>
                ) : (
                  <>
                    <Text style={styles.groupStatus}>{headerSubtitle}</Text>
                    <Ionicons name="chevron-forward" size={12} color="#bfdbfe" style={{marginLeft: 2}}/>
                  </>
                )}
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowStudyModal(true)} style={styles.headerRightIcon}>
            <Ionicons name="laptop-outline" size={22} color="#fff" />
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
            contentContainerStyle={{ padding: 15, paddingBottom: 15 }} 
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
            ListFooterComponent={() => isSomeoneTyping ? <TypingBubble /> : <View style={{height: 10}}/>}
          />
        )}

        {!otherUser && <TodoList groupId={id as string} isLeader={isLeader} />}

        {/* 🎨 MODERN INPUT BOX */}
        <View style={styles.inputContainer}>
          <View style={styles.inputBoxWrapper}>
            <TouchableOpacity style={styles.attachBtn} onPress={() => setShowActionMenu(true)}>
              <Ionicons name="add" size={28} color="#64748b" />
            </TouchableOpacity>
            
            <TextInput 
              style={[styles.textInput, noOutlineStyle]} 
              placeholder="Message..." 
              placeholderTextColor="#94a3b8" 
              value={inputText} 
              onChangeText={handleTyping} 
              maxLength={LIMITS.MAX_MESSAGE_LENGTH} // 🛡️ FRONTEND LIMIT
              multiline 
            />
          </View>
          
          <Animated.View style={sendBtnAnimatedStyle}>
            <TouchableOpacity style={[styles.sendButton, inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive]} onPress={sendMessage} disabled={!inputText.trim()}>
              <Ionicons name="send" size={18} color={inputText.trim() ? "#fff" : "#94a3b8"} style={{ marginLeft: 3 }} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>

      <LiveTestModal activeTest={activeTest} onClose={() => setActiveTest(null)} groupId={id as string} />

      {/* ACTION MENU */}
      <Modal visible={showActionMenu} transparent animationType="fade">
        <TouchableOpacity style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'}} onPress={() => setShowActionMenu(false)}>
          <View style={{ backgroundColor: '#fff', padding: 25, borderTopLeftRadius: 28, borderTopRightRadius: 28 }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 25 }}>Attachment Menu</Text>
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
                <TouchableOpacity style={styles.actionMenuBtn} onPress={() => { setShowActionMenu(false); setTodoModalVisible(true); }}>
                  <View style={[styles.actionMenuIcon, { backgroundColor: '#fef3c7' }]}><Ionicons name="list" size={24} color="#d97706" /></View>
                  <View><Text style={styles.actionMenuTitle}>To-Do Task</Text><Text style={styles.actionMenuSub}>Assign a new task to members</Text></View>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODALS */}
      <Modal visible={todoModalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1, backgroundColor: '#f8fafc'}}>
          <View style={{padding: 25}}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#0f172a', marginBottom: 15, marginTop: 20 }}>Assign a Task 📋</Text>
            <TextInput style={[styles.textInputFull, noOutlineStyle, { height: 55, marginBottom: 20 }]} placeholder="e.g. Read Chapter 5" value={newTodoTask} onChangeText={setNewTodoTask} maxLength={LIMITS.MAX_TITLE_LENGTH} />
            <TouchableOpacity style={{ backgroundColor: '#d97706', paddingVertical: 16, borderRadius: 14, alignItems: 'center' }} onPress={handleCreateTodo}><Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Create Task</Text></TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={() => setTodoModalVisible(false)}><Text style={{ color: '#64748b', fontWeight: '700', fontSize: 16 }}>Cancel</Text></TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showStudyModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1, backgroundColor: '#f8fafc'}}>
          <View style={{padding: 25}}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#0f172a', marginBottom: 15, marginTop: 20 }}>Study Session 💻</Text>
            <Text style={{color: '#64748b', marginBottom: 8, fontWeight: '700'}}>Focus Duration (Max {LIMITS.MAX_DURATION_MINS} Mins)</Text>
            <TextInput style={[styles.textInputFull, noOutlineStyle, { height: 55, marginBottom: 25 }]} placeholder="e.g. 25" keyboardType="numeric" value={studyDuration} onChangeText={setStudyDuration} />
            <TouchableOpacity style={{ backgroundColor: '#8b5cf6', paddingVertical: 16, borderRadius: 14, alignItems: 'center' }} onPress={handleCreateStudyRoom}><Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Create Room 🚀</Text></TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={() => setShowStudyModal(false)}><Text style={{ color: '#64748b', fontWeight: '700', fontSize: 16 }}>Cancel</Text></TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={bucketModalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1, backgroundColor: '#f8fafc'}}>
          <View style={{padding: 25}}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#0f172a', marginBottom: 15, marginTop: 20 }}>Homework Bucket</Text>
            <TextInput style={[styles.textInputFull, noOutlineStyle, { height: 55, marginBottom: 25 }]} placeholder="e.g. Chapter 4 Numericals" value={bucketTitle} onChangeText={setBucketTitle} maxLength={LIMITS.MAX_TITLE_LENGTH} />
            <TouchableOpacity style={{ backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 14, alignItems: 'center' }} onPress={createHomeworkBucket}><Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Create Bucket 🪣</Text></TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={() => setBucketModalVisible(false)}><Text style={{ color: '#64748b', fontWeight: '700', fontSize: 16 }}>Cancel</Text></TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showTestCreator} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1, backgroundColor: '#f8fafc'}}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Advanced Live Test</Text>
              <Text style={{color: '#64748b', fontSize: 13, fontWeight: '600', marginTop: 2}}>Create JEE/NEET style mock tests</Text>
            </View>
            <TouchableOpacity onPress={() => setShowTestCreator(false)}>
              <Ionicons name="close-circle" size={32} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false}>
            <View style={{backgroundColor: '#fff', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20}}>
              <Text style={{fontWeight: '800', color: '#475569', marginBottom: 8}}>Test Title</Text>
              <TextInput style={[styles.textInputFull, noOutlineStyle, {marginBottom: 15}]} placeholder="e.g. Thermodynamics Weekly Mock" value={testTitle} onChangeText={setTestTitle} maxLength={LIMITS.MAX_TITLE_LENGTH} />
              
              <View style={{flexDirection: 'row', gap: 15}}>
                <View style={{flex: 1}}>
                  <Text style={{fontWeight: '800', color: '#475569', marginBottom: 8}}>Duration (Mins)</Text>
                  <TextInput style={[styles.textInputFull, noOutlineStyle]} placeholder="15" keyboardType="numeric" value={testDuration} onChangeText={setTestDuration} />
                </View>
                <View style={{flex: 1}}>
                  <Text style={{fontWeight: '800', color: '#475569', marginBottom: 8}}>NTA Format</Text>
                  <TouchableOpacity style={{backgroundColor: testNtaFormat ? '#10b981' : '#f1f5f9', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: testNtaFormat ? '#059669' : '#e2e8f0'}} onPress={() => setTestNtaFormat(!testNtaFormat)}>
                    <Text style={{color: testNtaFormat ? '#fff' : '#64748b', fontWeight: '800'}}>{testNtaFormat ? 'ENABLED ✅' : 'DISABLED ❌'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {testQuestions.map((q, qIdx) => (
              <View key={qIdx} style={{marginBottom: 20, padding: 20, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0'}}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
                  <Text style={{fontWeight: '900', color: '#0f172a', fontSize: 16}}>Question {qIdx + 1}</Text>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
                    <View style={{flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8}}>
                      <Text style={{color: '#10b981', fontWeight: '900', fontSize: 12}}>+</Text>
                      <TextInput style={{color: '#10b981', fontWeight: '900', fontSize: 12, padding:0, margin:0, width: 20, textAlign: 'center'}} keyboardType="numeric" value={q.posMarks} onChangeText={(t) => { const newQ = [...testQuestions]; newQ[qIdx].posMarks = t; setTestQuestions(newQ); }} maxLength={2} />
                    </View>
                    <View style={{flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8}}>
                      <Text style={{color: '#ef4444', fontWeight: '900', fontSize: 12}}>-</Text>
                      <TextInput style={{color: '#ef4444', fontWeight: '900', fontSize: 12, padding:0, margin:0, width: 20, textAlign: 'center'}} keyboardType="numeric" value={q.negMarks} onChangeText={(t) => { const newQ = [...testQuestions]; newQ[qIdx].negMarks = t; setTestQuestions(newQ); }} maxLength={2} />
                    </View>
                    {testQuestions.length > 1 && (
                      <TouchableOpacity onPress={() => setTestQuestions(testQuestions.filter((_, i) => i !== qIdx))} style={{marginLeft: 10}}>
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                
                <TextInput style={[styles.textInputFull, noOutlineStyle, {marginBottom: 20, minHeight: 80, textAlignVertical: 'top'}]} placeholder="Type question here..." multiline value={q.q} onChangeText={(t) => { const newQ = [...testQuestions]; newQ[qIdx].q = t; setTestQuestions(newQ); }} maxLength={LIMITS.MAX_QUESTION_LENGTH} />
                
                <Text style={{fontSize: 12, fontWeight: '800', color: '#94a3b8', marginBottom: 12}}>OPTIONS (Select correct answer)</Text>
                
                {q.options.map((opt, oIdx) => (
                  <View key={oIdx} style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
                    <TouchableOpacity onPress={() => { const newQ = [...testQuestions]; newQ[qIdx].correct = oIdx; setTestQuestions(newQ); }}>
                      <Ionicons name={q.correct === oIdx ? "checkmark-circle" : "ellipse-outline"} size={28} color={q.correct === oIdx ? "#4f46e5" : "#cbd5e1"} style={{marginRight: 12}} />
                    </TouchableOpacity>
                    <TextInput style={[styles.textInputFull, noOutlineStyle, {flex: 1, borderColor: q.correct === oIdx ? '#c7d2fe' : '#e2e8f0', backgroundColor: q.correct === oIdx ? '#eef2ff' : '#f8fafc'}]} placeholder={`Option ${oIdx + 1}`} value={opt} onChangeText={(t) => { const newQ = [...testQuestions]; newQ[qIdx].options[oIdx] = t; setTestQuestions(newQ); }} maxLength={LIMITS.MAX_OPTIONS_LENGTH} />
                  </View>
                ))}
              </View>
            ))}

            {/* 🛡️ FRONTEND LIMIT: Hide 'Add Question' button if limit reached */}
            {testQuestions.length < LIMITS.MAX_TEST_QUESTIONS ? (
              <TouchableOpacity style={{backgroundColor: '#eef2ff', padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 25, borderStyle: 'dashed', borderWidth: 1, borderColor: '#a5b4fc'}} onPress={() => setTestQuestions([...testQuestions, { q: '', options: ['', '', '', ''], correct: 0, posMarks: '4', negMarks: '1' }])}>
                <Text style={{color: '#4f46e5', fontWeight: '900', fontSize: 15}}>+ Add Question ({testQuestions.length}/{LIMITS.MAX_TEST_QUESTIONS})</Text>
              </TouchableOpacity>
            ) : (
              <Text style={{textAlign: 'center', color: '#ef4444', fontWeight: '800', marginBottom: 20}}>Max {LIMITS.MAX_TEST_QUESTIONS} questions allowed in free tier.</Text>
            )}

            <TouchableOpacity style={{ backgroundColor: '#4f46e5', paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginBottom: 60, shadowColor: '#4f46e5', shadowOffset: {width:0, height:6}, shadowOpacity: 0.4, shadowRadius: 15 }} onPress={handleSendTest}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 }}>LAUNCH TEST 🚀</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showQuestionModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1, backgroundColor: '#f8fafc'}}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ask a Question</Text>
            <TouchableOpacity onPress={() => setShowQuestionModal(false)}><Ionicons name="close-circle" size={32} color="#94a3b8" /></TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 25 }}>
            <View style={{ flexDirection: 'row', marginBottom: 25 }}>
              <TouchableOpacity style={[styles.typeBtn, qType === 'mcq' && styles.typeBtnActive]} onPress={() => setQType('mcq')}><Text style={[styles.typeBtnText, qType === 'mcq' && {color: '#fff'}]}>MCQ</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.typeBtn, qType === 'subjective' && styles.typeBtnActive]} onPress={() => setQType('subjective')}><Text style={[styles.typeBtnText, qType === 'subjective' && {color: '#fff'}]}>Written Answer</Text></TouchableOpacity>
            </View>
            <TextInput style={[styles.textInputFull, noOutlineStyle, {height: 100, textAlignVertical: 'top', marginBottom: 25}]} placeholder="Type your question..." multiline value={qText} onChangeText={setQText} maxLength={LIMITS.MAX_QUESTION_LENGTH} />
            {qType === 'mcq' && (
              <View>
                {mcqOptions.map((opt, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                    <TouchableOpacity onPress={() => setCorrectOptionIdx(idx)} style={{marginRight: 12}}><Ionicons name={correctOptionIdx === idx ? "radio-button-on" : "radio-button-off"} size={26} color={correctOptionIdx === idx ? "#10b981" : "#cbd5e1"} /></TouchableOpacity>
                    <TextInput style={[styles.textInputFull, noOutlineStyle, {flex: 1}]} placeholder={`Option ${idx + 1}`} value={opt} onChangeText={(text) => { const newOpts = [...mcqOptions]; newOpts[idx] = text; setMcqOptions(newOpts); }} maxLength={LIMITS.MAX_OPTIONS_LENGTH}/>
                  </View>
                ))}
              </View>
            )}
            <TouchableOpacity style={{ backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 25, marginBottom: 50, shadowColor: '#2563eb', shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 10 }} onPress={handleSendQuestion}><Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Send Question</Text></TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <HomeworkDashboard visible={dashboardVisible} onClose={() => setDashboardVisible(false)} message={activeDashboardMessage} groupMembers={groupInfo?.members} setViewerImage={setViewerImage} />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  headerContainer: { height: Platform.OS === 'ios' ? 105 : 85, justifyContent: 'flex-end', paddingBottom: 15, elevation: 5, shadowColor: '#0f172a', shadowOffset: { width:0, height:2 }, shadowOpacity: 0.15, shadowRadius: 8 },
  headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: Platform.OS === 'ios' ? 40 : 10 },
  backButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14 },
  headerProfileClickArea: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 12 },
  headerAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#e2e8f0', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  headerTextContainer: { flex: 1, marginLeft: 12 },
  groupName: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  groupStatus: { fontSize: 13, color: '#bfdbfe', marginTop: 2, fontWeight: '600' },
  headerTypingText: { fontSize: 13, color: '#93c5fd', marginTop: 2, fontWeight: '800', fontStyle: 'italic' },
  headerRightIcon: { padding: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, marginLeft: 'auto' },
  chatArea: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, paddingBottom: Platform.OS === 'ios' ? 30 : 15, backgroundColor: '#f8fafc', borderTopWidth: 1, borderColor: '#e2e8f0' },
  inputBoxWrapper: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#fff', borderRadius: 26, paddingLeft: 6, paddingRight: 16, marginRight: 12, borderWidth: 1, borderColor: '#cbd5e1', minHeight: 52 },
  attachBtn: { padding: 10, paddingBottom: 12 },
  textInput: { flex: 1, fontSize: 16, color: '#0f172a', paddingTop: Platform.OS === 'ios' ? 15 : 12, paddingBottom: Platform.OS === 'ios' ? 15 : 12, maxHeight: 130 },
  sendButton: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  sendButtonActive: { backgroundColor: '#2563eb' },
  sendButtonInactive: { backgroundColor: '#cbd5e1', shadowOpacity: 0, elevation: 0 },
  actionMenuBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 }, 
  actionMenuIcon: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center', marginRight: 16 }, 
  actionMenuTitle: { fontSize: 17, fontWeight: '800', color: '#1e293b', marginBottom: 2 }, 
  actionMenuSub: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingVertical: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f5f9' },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
  typeBtn: { flex: 1, padding: 14, alignItems: 'center', backgroundColor: '#f1f5f9', marginHorizontal: 6, borderRadius: 14 },
  typeBtnActive: { backgroundColor: '#2563eb' },
  typeBtnText: { fontWeight: '800', color: '#64748b', fontSize: 15 },
  typingWrapper: { alignSelf: 'flex-start', marginBottom: 15, marginLeft: 15 },
  typingBubble: { backgroundColor: '#e2e8f0', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 20, borderBottomLeftRadius: 6, flexDirection: 'row', alignItems: 'center', width: 65, justifyContent: 'space-between' },
  typingDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#64748b' },
  textInputFull: { backgroundColor: '#f8fafc', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 15, fontSize: 16, color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0' },
});