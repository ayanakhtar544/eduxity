// Location: app/chat/[id].tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, 
  KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar, Modal, 
  Keyboard, Dimensions, ScrollView
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { auth, db } from '../../firebaseConfig';  
import { 
  collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, 
  doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc, increment 
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';

import Animated, { 
  FadeInDown, FadeOutDown, FadeIn, FadeOut, 
  SlideInDown, SlideOutDown, ZoomIn, ZoomOut, 
  useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence, withTiming
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

// 🛑 CHILD COMPONENTS
import ChatBubble from '../../components/chat/ChatBubble'; 
import LiveTestModal from '../../components/chat/LiveTestModal';
import HomeworkDashboard from '../../components/chat/HomeworkDashboard';
import ImageViewerModal from '../../components/ImageViewerModal';

import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

const { width, height } = Dimensions.get('window');
const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
const IMGBB_API_KEY = process.env.EXPO_PUBLIC_IMGBB_API_KEY; 

const LIMITS = { MAX_MESSAGE_LENGTH: 1500, MAX_TEST_QUESTIONS: 30, MAX_QUESTION_LENGTH: 500, MAX_TITLE_LENGTH: 100, MAX_DURATION_MINS: 180 };
const TOPIC_TABS = ['Chat', 'Doubts', 'Resources', 'Tasks']; 
const ACADEMIC_REACTIONS = ['👍', '✅', '📌', '❓', '🔥', '💡'];

export default function MVPAdvancedChatEngine() {
  const { id } = useLocalSearchParams(); 
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // 🚀 THE MAGIC FIX FOR 1-ON-1 CHATS NOT SYNCING:
  // Ye dono users ko force karega same room use karne ke liye.
  const chatIdStr = useMemo(() => {
    const rawId = String(id || '');
    if (rawId.includes('_')) {
      const parts = rawId.split('_');
      if (parts.length === 2) {
        return parts[0] < parts[1] ? `${parts[0]}_${parts[1]}` : `${parts[1]}_${parts[0]}`;
      }
    }
    return rawId;
  }, [id]);

  // ==========================================
  // 🧠 CORE DATA STATES
  // ==========================================
  const [messages, setMessages] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]); 
  const [groupInfo, setGroupInfo] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isUploadingHW, setIsUploadingHW] = useState(false);
  
  const [activeTab, setActiveTab] = useState('Chat'); 
  const [searchQuery, setSearchQuery] = useState(''); 
  const [isSearching, setIsSearching] = useState(false);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false); 

  const [inputText, setInputText] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionList, setMentionList] = useState<any[]>([]);

  const [showActionMenu, setShowActionMenu] = useState(false); 
  const [showTaskDrawer, setShowTaskDrawer] = useState(false); 
  
  const [selectedMessage, setSelectedMessage] = useState<any>(null); 
  const [replyingTo, setReplyingTo] = useState<any>(null); 

  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showTestCreator, setShowTestCreator] = useState(false);
  const [todoModalVisible, setTodoModalVisible] = useState(false);
  const [bucketModalVisible, setBucketModalVisible] = useState(false);
  const [showStudyModal, setShowStudyModal] = useState(false);

  const [qType, setQType] = useState<'mcq' | 'subjective'>('mcq');
  const [qText, setQText] = useState('');
  const [mcqOptions, setMcqOptions] = useState(['', '', '', '']);
  const [correctOptionIdx, setCorrectOptionIdx] = useState(0);
  const [testTitle, setTestTitle] = useState('');
  const [testDuration, setTestDuration] = useState('15');
  const [testNtaFormat, setTestNtaFormat] = useState(true);
  const [testQuestions, setTestQuestions] = useState([{ q: '', options: ['', '', '', ''], correct: 0, posMarks: '4', negMarks: '1' }]);
  const [newTodoTask, setNewTodoTask] = useState('');
  const [bucketTitle, setBucketTitle] = useState('');
  const [studyDuration, setStudyDuration] = useState('25');

  const [pinnedMessage, setPinnedMessage] = useState<any>(null);
  const [pendingHomeworkCount, setPendingHomeworkCount] = useState(0);

  const [activeTest, setActiveTest] = useState<any>(null);
  const [dashboardVisible, setDashboardVisible] = useState(false);
  const [activeDashboardMessage, setActiveDashboardMessage] = useState<any>(null);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sendBtnScale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);
  
  useEffect(() => {
    pulseScale.value = withRepeat(withSequence(withTiming(1.4, {duration: 1000}), withTiming(1, {duration: 1000})), -1, true);
    pulseOpacity.value = withRepeat(withSequence(withTiming(0.4, {duration: 1000}), withTiming(1, {duration: 1000})), -1, true);
  }, []);
  
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseScale.value }], opacity: pulseOpacity.value }));
  const animatedSendStyle = useAnimatedStyle(() => ({ transform: [{ scale: sendBtnScale.value }] }));

  // ==========================================
  // 📡 FIREBASE SYNC & READ RECEIPTS
  // ==========================================
  useEffect(() => {
    if (!chatIdStr || !auth.currentUser) return;
    const myUid = auth.currentUser.uid;

    const unsubGroup = onSnapshot(doc(db, 'groups', chatIdStr), async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGroupInfo(data);
        
        // Fetch direct user details
        if (chatIdStr.includes('_') || data.isGroup === false) {
          let targetUid = (data.members || []).find((uid: string) => uid !== myUid);
          if (!targetUid && chatIdStr.includes('_')) {
            const splitIds = chatIdStr.split('_');
            targetUid = splitIds.find((uid) => uid !== myUid);
          }

          if (targetUid) {
            const uDoc = await getDoc(doc(db, 'users', targetUid));
            if (uDoc.exists()) setOtherUser({ id: uDoc.id, ...uDoc.data() });
          }
        }

        if (data.pinnedMessageId) {
          getDoc(doc(db, 'groups', chatIdStr, 'messages', data.pinnedMessageId)).then(pSnap => {
            if(pSnap.exists()) setPinnedMessage({ id: pSnap.id, ...pSnap.data() });
          });
        } else {
          setPinnedMessage(null);
        }

        if (data.members) {
           setMentionList([
             { id: auth.currentUser.uid, name: auth.currentUser.displayName, avatar: auth.currentUser.photoURL },
             { id: 'mock1', name: 'Aman Gupta', avatar: DEFAULT_AVATAR }
           ]);
        }
      }
    });

    const unsubMessages = onSnapshot(query(collection(db, 'groups', chatIdStr, 'messages'), orderBy('createdAt', 'asc')), (snapshot) => {
      const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(fetched);
      
      const hws = fetched.filter(m => m.type === 'homework_bucket' && (!m.submissions || !m.submissions[auth.currentUser!.uid]));
      setPendingHomeworkCount(hws.length);
      
      setLoading(false);
      if(!showJumpToBottom) setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 250);
    });

    const unsubTasks = onSnapshot(query(collection(db, 'groups', chatIdStr, 'todos'), orderBy('createdAt', 'desc')), (snapshot) => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubGroup(); unsubMessages(); unsubTasks(); };
  }, [chatIdStr]);

  // 🔥 INSTANT MARK AS READ
  useEffect(() => {
    if (chatIdStr && auth.currentUser && messages.length > 0) {
      updateDoc(doc(db, 'groups', chatIdStr), {
        [`unreadCount.${auth.currentUser.uid}`]: 0
      }).catch(() => {});
    }
  }, [chatIdStr, messages.length]);

  // ==========================================
  // 🧠 FILTERS & DATE SEPARATORS
  // ==========================================
  const filteredMessages = useMemo(() => {
    let filtered = messages;
    if (activeTab === 'Doubts') filtered = messages.filter(m => m.type === 'subjective' || m.text?.includes('?'));
    if (activeTab === 'Resources') filtered = messages.filter(m => m.type === 'resource' || m.fileUrl || m.imageUrl);
    if (activeTab === 'Tasks') filtered = messages.filter(m => ['test', 'homework_bucket', 'mcq'].includes(m.type));
    
    if (isSearching && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(m => m.text?.toLowerCase().includes(q) || m.title?.toLowerCase().includes(q));
    }
    return filtered;
  }, [messages, activeTab, isSearching, searchQuery]);

  const messagesWithDates = useMemo(() => {
    const result: any[] = [];
    let lastDate = '';
    
    filteredMessages.forEach((msg) => {
      if(msg.createdAt) {
        const msgDateObj = new Date(msg.createdAt.toMillis());
        let dateString = msgDateObj.toDateString();
        
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        if (dateString === today) dateString = 'Today';
        else if (dateString === yesterday) dateString = 'Yesterday';
        else dateString = msgDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        if(dateString !== lastDate) {
          result.push({ id: `date_${dateString}_${msg.id}`, type: 'date_separator', date: dateString });
          lastDate = dateString;
        }
      }
      result.push(msg);
    });
    return result;
  }, [filteredMessages]);

  const isLeader = groupInfo?.admins?.includes(auth.currentUser?.uid) || groupInfo?.adminId === auth.currentUser?.uid;
  const isBlocked = groupInfo?.blocked?.includes(auth.currentUser?.uid);
  const typingUids = groupInfo?.typing?.filter((uid: string) => uid !== auth.currentUser?.uid) || [];
  const typingText = typingUids.length > 0 ? (typingUids.length > 1 ? "Several people typing..." : "Typing...") : null;

  // ==========================================
  // ⌨️ INPUT HANDLERS
  // ==========================================
  const handleTyping = (text: string) => {
    setInputText(text);
    const words = text.split(' ');
    const lastWord = words[words.length - 1];
    
    if (lastWord.startsWith('@')) {
      setShowMentions(true);
      setMentionFilter(lastWord.substring(1).toLowerCase());
    } else {
      setShowMentions(false);
    }

    if (!auth.currentUser || !chatIdStr) return;
    const uid = auth.currentUser.uid;
    const groupRef = doc(db, 'groups', chatIdStr);
    if (text.trim() === '') { updateDoc(groupRef, { typing: arrayRemove(uid) }).catch(()=>{}); return; }
    
    updateDoc(groupRef, { typing: arrayUnion(uid) }).catch(()=>{});
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { updateDoc(groupRef, { typing: arrayRemove(uid) }).catch(()=>{}); }, 2000);
  };

  const handleMentionSelect = (user: any) => {
    const words = inputText.split(' ');
    words.pop(); 
    setInputText(words.join(' ') + (words.length > 0 ? ' ' : '') + `@${user.name} `);
    setShowMentions(false);
    if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // 🔥 FAIL-PROOF SEND MESSAGE FUNCTION
  const sendMessage = async () => {
    if (!inputText.trim() || !auth.currentUser) return;
    const textToSend = inputText.trim();
    setInputText(''); setShowMentions(false);
    
    sendBtnScale.value = withSpring(0.7, {}, () => { sendBtnScale.value = withSpring(1); });
    
    const myUid = auth.currentUser.uid;
    const groupRef = doc(db, 'groups', chatIdStr);

    // Remove typing status
    updateDoc(groupRef, { typing: arrayRemove(myUid) }).catch(()=>{});
    
    // Build Message
    const msgPayload: any = {
      type: 'text', text: textToSend, 
      senderId: myUid, senderName: auth.currentUser.displayName || 'User', senderAvatar: auth.currentUser.photoURL || DEFAULT_AVATAR, 
      readBy: [myUid], createdAt: serverTimestamp(),
    };

    if (replyingTo) {
      msgPayload.replyTo = { id: replyingTo.id, text: replyingTo.text, senderName: replyingTo.senderName };
      setReplyingTo(null);
    }

    // 1. Add message to subcollection
    await addDoc(collection(db, 'groups', chatIdStr, 'messages'), msgPayload);

    // 2. Update Parent Document strictly
    let isGroupChat = groupInfo?.isGroup ?? true;
    let membersArray = groupInfo?.members || [];

    if (chatIdStr.includes('_')) {
      membersArray = chatIdStr.split('_');
      isGroupChat = false;
    }

    const updates: any = {
      lastMessage: { text: textToSend, type: 'text', senderName: auth.currentUser.displayName || 'User' },
      lastMessageTime: serverTimestamp(),
      isGroup: isGroupChat,
    };

    if (membersArray.length > 0) {
      updates.members = membersArray;
      membersArray.forEach((memberUid: string) => {
        if (memberUid !== myUid) {
          updates[`unreadCount.${memberUid}`] = increment(1);
        }
      });
    }

    await setDoc(groupRef, updates, { merge: true });

    if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // ==========================================
  // ⚡ QUICK ACTIONS & CREATORS
  // ==========================================
  const handleReaction = async (emoji: string) => {
    if (!selectedMessage || !auth.currentUser) return;
    if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateDoc(doc(db, 'groups', chatIdStr, 'messages', selectedMessage.id), { [`reactions.${auth.currentUser.uid}`]: emoji });
    setSelectedMessage(null);
  };

  const handlePinMessage = async () => {
    if (!selectedMessage || !isLeader) return;
    await updateDoc(doc(db, 'groups', chatIdStr), { pinnedMessageId: selectedMessage.id });
    setSelectedMessage(null);
    if(Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const syncParentDocument = async (msgObj: any) => {
    const myUid = auth.currentUser!.uid;
    let membersArray = groupInfo?.members || [];
    if (chatIdStr.includes('_')) membersArray = chatIdStr.split('_');
    
    const updates: any = {
      lastMessage: { text: msgObj.text || 'Attachment', type: msgObj.type, senderName: auth.currentUser!.displayName || 'User' },
      lastMessageTime: serverTimestamp(),
      isGroup: groupInfo?.isGroup ?? !chatIdStr.includes('_'),
    };
    if (membersArray.length > 0) {
      updates.members = membersArray;
      membersArray.forEach((m: string) => {
        if (m !== myUid) updates[`unreadCount.${m}`] = increment(1);
      });
    }
    await setDoc(doc(db, 'groups', chatIdStr), updates, { merge: true });
  };

  const handleSendQuestion = async () => {
    if (!qText.trim() || !auth.currentUser) return;
    const payload = {
      type: qType, text: qText.trim(), 
      options: qType === 'mcq' ? mcqOptions.filter(opt => opt.trim() !== '') : [],
      correctOption: qType === 'mcq' ? correctOptionIdx : null, responses: {}, 
      senderId: auth.currentUser.uid, senderName: auth.currentUser.displayName, senderAvatar: auth.currentUser.photoURL, createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, 'groups', chatIdStr, 'messages'), payload);
    await syncParentDocument(payload);
    setShowQuestionModal(false); setQText('');
  };

  const handleSendTest = async () => {
    if (!testTitle.trim() || testQuestions.length === 0 || !auth.currentUser) return;
    const payload = {
      type: 'test', title: testTitle.trim(), duration: parseInt(testDuration) || 15, ntaFormat: testNtaFormat,
      questions: testQuestions, responses: {}, senderId: auth.currentUser.uid, senderName: auth.currentUser.displayName, senderAvatar: auth.currentUser.photoURL, createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, 'groups', chatIdStr, 'messages'), payload);
    await syncParentDocument({ type: 'test', text: testTitle.trim() });
    setShowTestCreator(false); setTestTitle(''); setTestQuestions([{ q: '', options: ['', '', '', ''], correct: 0, posMarks: '4', negMarks: '1' }]);
  };

  const createHomeworkBucket = async () => {
    if (!bucketTitle.trim() || !auth.currentUser) return;
    const payload = { 
      title: bucketTitle.trim(), type: 'homework_bucket', submissions: {}, 
      senderId: auth.currentUser.uid, senderName: auth.currentUser.displayName, senderAvatar: auth.currentUser.photoURL, createdAt: serverTimestamp() 
    };
    await addDoc(collection(db, 'groups', chatIdStr, 'messages'), payload);
    await syncParentDocument({ type: 'homework_bucket', text: bucketTitle.trim() });
    setBucketModalVisible(false); setBucketTitle('');
  };

  const handleCreateTodo = async () => {
    if (!newTodoTask.trim() || !auth.currentUser) return;
    await addDoc(collection(db, 'groups', chatIdStr, 'todos'), { task: newTodoTask.trim(), isCompleted: false, completedBy: [], createdAt: serverTimestamp() });
    setTodoModalVisible(false); setNewTodoTask('');
  };

  const handleCreateStudyRoom = async () => {
    if (!auth.currentUser) return;
    let dur = parseInt(studyDuration) || 25;
    const endTime = Date.now() + (dur * 60000); 
    setShowStudyModal(false);
    const docRef = await addDoc(collection(db, 'groups', chatIdStr, 'messages'), { 
      type: 'study_session', title: 'Deep Focus Session', duration: dur, endTime: endTime, 
      senderId: auth.currentUser.uid, senderName: auth.currentUser.displayName, senderAvatar: auth.currentUser.photoURL, 
      activeParticipants: {}, createdAt: serverTimestamp() 
    });
    router.push(`/study-room/${chatIdStr}?sessionId=${docRef.id}`);
  };

  if (isBlocked) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="ban" size={80} color="#ef4444" style={{ marginBottom: 20 }} />
        <Text style={{ fontSize: 24, fontWeight: '900', color: '#0f172a' }}>Workspace Locked</Text>
        <TouchableOpacity style={styles.goBackBtn} onPress={() => router.back()}><Text style={{ fontWeight: '800', color: '#fff' }}>Return Home</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ==========================================
  // 🎨 UI RENDERERS
  // ==========================================
  const renderAppleDock = () => {
    const displayMentions = mentionList.filter(u => u.name.toLowerCase().includes(mentionFilter)).slice(0, 4);
    return (
      <View style={[styles.dockWrapper, { bottom: Platform.OS === 'ios' ? insets.bottom + 10 : 15 }]}>
        {showMentions && displayMentions.length > 0 && (
          <Animated.View entering={FadeInDown} exiting={FadeOutDown} style={styles.mentionsOverlay}>
            <Text style={styles.mentionHeader}>Mentions</Text>
            {displayMentions.map(user => (
              <TouchableOpacity key={user.id} style={styles.mentionItem} onPress={() => handleMentionSelect(user)}>
                <Image source={{ uri: user.avatar }} style={styles.mentionAvatar} />
                <Text style={styles.mentionName}>{user.name}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}
        {replyingTo && (
          <Animated.View entering={FadeInDown} exiting={FadeOutDown} style={styles.replyPreview}>
            <View style={styles.replyLine} />
            <View style={{ flex: 1 }}>
              <Text style={styles.replyName}>Replying to {replyingTo.senderName}</Text>
              <Text style={styles.replyText} numberOfLines={1}>{replyingTo.text}</Text>
            </View>
            <TouchableOpacity onPress={() => setReplyingTo(null)} style={{padding: 5}}><Ionicons name="close-circle" size={24} color="#94a3b8" /></TouchableOpacity>
          </Animated.View>
        )}
        <View style={styles.dockContainer}>
          {Platform.OS === 'ios' ? <BlurView intensity={85} tint="light" style={styles.glassBackground} /> : <View style={[styles.glassBackground, {backgroundColor: 'rgba(255,255,255,0.95)'}]} />}
          <View style={styles.dockInner}>
            <TouchableOpacity style={styles.dockAttachBtn} onPress={() => { Keyboard.dismiss(); setShowActionMenu(true); }}>
              <Ionicons name="add" size={26} color="#4f46e5" />
            </TouchableOpacity>
            <View style={styles.dockInputWrapper}>
              <TextInput 
                style={[styles.dockInput, Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}]} 
                placeholder="Message..." 
                placeholderTextColor="#94a3b8" 
                value={inputText} 
                onChangeText={handleTyping} 
                maxLength={LIMITS.MAX_MESSAGE_LENGTH} 
                multiline 
              />
            </View>
            <Animated.View style={animatedSendStyle}>
              {inputText.trim().length > 0 ? (
                <TouchableOpacity style={[styles.dockSendBtn, styles.dockSendBtnActive]} onPress={sendMessage}>
                  <Ionicons name="send" size={16} color="#fff" style={{marginLeft: 2}} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.dockSendBtn, styles.dockSendBtnInactive]} onPress={() => setShowTaskDrawer(true)}>
                  <Ionicons name="list" size={20} color="#4f46e5" />
                </TouchableOpacity>
              )}
            </Animated.View>
          </View>
        </View>
      </View>
    );
  };

  const renderSimpleTaskDrawer = () => (
    <Modal visible={showTaskDrawer} transparent={true} animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <View style={{ height: '60%', backgroundColor: '#f8fafc', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}>
          <View style={styles.taskDrawerHeader}>
            <Text style={styles.taskDrawerTitle}>Group Tasks</Text>
            <TouchableOpacity onPress={() => setShowTaskDrawer(false)} style={styles.closeCircleBtn}>
              <Ionicons name="close" size={24} color="#0f172a" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <TouchableOpacity style={styles.createTaskBtn} onPress={() => { setShowTaskDrawer(false); setTodoModalVisible(true); }}>
              <Text style={styles.createTaskBtnText}>+ Add New Task</Text>
            </TouchableOpacity>
            {tasks.map((task) => {
              const iCompleted = task.completedBy?.some((u: any) => u.uid === auth.currentUser?.uid);
              return (
                <View key={task.id} style={styles.taskCard}>
                  <TouchableOpacity style={styles.taskCheckArea} onPress={async () => {
                    if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    const ref = doc(db, 'groups', chatIdStr, 'todos', task.id);
                    if (iCompleted) { 
                      await updateDoc(ref, { completedBy: task.completedBy.filter((u:any) => u.uid !== auth.currentUser?.uid) }); 
                    } else { 
                      await updateDoc(ref, { completedBy: arrayUnion({ uid: auth.currentUser?.uid, avatar: auth.currentUser?.photoURL || DEFAULT_AVATAR }) }); 
                    }
                  }}>
                    <Ionicons name={iCompleted ? "checkmark-circle" : "ellipse-outline"} size={28} color={iCompleted ? "#10b981" : "#cbd5e1"} />
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.taskText, iCompleted && styles.taskTextCompleted]}>{task.task}</Text>
                    {task.completedBy?.length > 0 && (
                      <View style={styles.completedByRow}>
                        <Text style={styles.completedByText}>Completed by: </Text>
                        <View style={{flexDirection: 'row'}}>
                          {task.completedBy.slice(0, 3).map((u:any, i:number) => (
                            <Image key={i} source={{uri: u.avatar}} style={styles.tinyAvatar} />
                          ))}
                          {task.completedBy.length > 3 && <Text style={{fontSize: 10, color: '#64748b', marginLeft: 4}}>+{task.completedBy.length - 3}</Text>}
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              )
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );


  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" translucent={false} />
      
      <View style={[styles.floatingHeaderContainer, { top: Platform.OS === 'ios' ? insets.top + 10 : StatusBar.currentHeight! + 10 }]}>
        {Platform.OS === 'ios' ? <BlurView intensity={85} tint="light" style={styles.glassBackground} /> : <View style={[styles.glassBackground, {backgroundColor: 'rgba(255,255,255,0.95)'}]} />}
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><Ionicons name="chevron-back" size={26} color="#0f172a" /></TouchableOpacity>
          <TouchableOpacity style={styles.headerInfo} activeOpacity={0.7} onPress={() => router.push(`/chat/info/${chatIdStr}`)}>
            <View>
               <Image 
  source={{ 
    uri: otherUser?.photoURL || groupInfo?.groupImage || groupInfo?.image || groupInfo?.photoURL || groupInfo?.avatar || DEFAULT_AVATAR 
  }} 
  style={styles.headerAvatar} 
/>
               <View style={styles.onlineDotIndicator}><Animated.View style={[styles.pulseCircle, pulseStyle]} /></View>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.headerTitle} numberOfLines={1}>{otherUser?.displayName || groupInfo?.name || "Chat"}</Text>
              <Text style={styles.headerSub} numberOfLines={1}>{typingText || (otherUser ? 'Online' : `${groupInfo?.members?.length || 1} members`)}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.headerRightActions}>
            <TouchableOpacity style={styles.iconCircleBtn} onPress={() => setIsSearching(!isSearching)}>
              <Ionicons name={isSearching ? "close" : "search"} size={20} color="#0f172a" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconCircleBtn} onPress={() => setShowTaskDrawer(true)}>
              <Ionicons name="list" size={20} color="#0f172a" />
            </TouchableOpacity>
            {!otherUser && (
              <TouchableOpacity style={styles.studyRoomBtn} onPress={() => setShowStudyModal(true)}>
                <Ionicons name="laptop-outline" size={16} color="#4f46e5" style={{marginRight: 4}} />
                <Text style={styles.studyRoomText}>Join</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isSearching && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.searchBarWrapper}>
            <Ionicons name="search" size={18} color="#94a3b8" />
            <TextInput style={styles.searchInput} placeholder="Search messages..." placeholderTextColor="#94a3b8" value={searchQuery} onChangeText={setSearchQuery} autoFocus />
          </Animated.View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContainer}>
          {TOPIC_TABS.map(tab => (
            <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => { setActiveTab(tab); if(Platform.OS !== 'web') Haptics.selectionAsync(); }}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 📌 BANNERS */}
      <View style={styles.bannerArea}>
        {pendingHomeworkCount > 0 && activeTab === 'Tasks' && (
          <Animated.View entering={SlideInDown} exiting={SlideOutDown} style={styles.homeworkBanner}>
            <Ionicons name="alert-circle" size={16} color="#e11d48" /><Text style={styles.homeworkBannerText}>{pendingHomeworkCount} Homework submission due!</Text>
          </Animated.View>
        )}
        {pinnedMessage && (
          <Animated.View entering={FadeInDown} exiting={FadeOutDown} style={styles.pinnedStrip}>
            <View style={styles.pinnedLeft}>
              <Ionicons name="pin" size={14} color="#b45309" />
              <View style={{ marginLeft: 8, flex: 1 }}><Text style={styles.pinnedLabel}>Pinned Message</Text><Text style={styles.pinnedText} numberOfLines={1}>{pinnedMessage.title || pinnedMessage.text}</Text></View>
            </View>
            <TouchableOpacity onPress={() => setPinnedMessage(null)} style={{padding: 4}}><Ionicons name="close" size={18} color="#b45309" /></TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* 💬 CHAT LIST */}
      <KeyboardAvoidingView style={styles.chatArea} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading ? <View style={styles.loaderContainer}><ActivityIndicator size="large" color="#4f46e5" /></View> : (
         <FlatList
            ref={flatListRef} 
            data={messagesWithDates} 
            keyExtractor={(item, index) => item.id || index.toString()}
            contentContainerStyle={{ padding: 15, paddingTop: Platform.OS === 'ios' ? 150 : 140, paddingBottom: 150 }} 
            showsVerticalScrollIndicator={false}
            onScroll={(e) => setShowJumpToBottom(e.nativeEvent.contentOffset.y < e.nativeEvent.contentSize.height - height - 100)}
            renderItem={({ item }) => {
              if (item.type === 'date_separator') return <View style={styles.dateSeparator}><Text style={styles.dateText}>{item.date}</Text></View>;
              return (
                <ChatBubble 
                  message={item} 
                  isMe={item.senderId === auth.currentUser?.uid} 
                  groupId={chatIdStr}
                  onReply={(msg) => { if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setReplyingTo(msg); }}
                  onLongPress={(msg) => { if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setSelectedMessage(msg); }}
                  onOpenTest={(msg) => setActiveTest(msg)}
                  openDashboard={(msg) => { setActiveDashboardMessage(msg); setDashboardVisible(true); }}
                />
              );
            }}
          />
        )}
        {showJumpToBottom && (
          <Animated.View entering={ZoomIn} exiting={ZoomOut} style={styles.jumpBottomWrapper}>
            <TouchableOpacity style={styles.jumpBottomBtn} onPress={() => flatListRef.current?.scrollToEnd({animated: true})}><Ionicons name="chevron-down" size={24} color="#fff" /></TouchableOpacity>
          </Animated.View>
        )}
        {renderAppleDock()}
      </KeyboardAvoidingView>

      {/* QUICK ACTIONS MODAL */}
      {selectedMessage && (
        <Modal visible={true} transparent animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedMessage(null)}>
            <Animated.View entering={FadeInDown.springify()} style={styles.quickActionBox}>
              <View style={styles.reactionsRow}>
                {ACADEMIC_REACTIONS.map((emoji) => (
                  <TouchableOpacity key={emoji} onPress={() => handleReaction(emoji)} style={styles.reactionBtn}><Text style={{ fontSize: 26 }}>{emoji}</Text></TouchableOpacity>
                ))}
              </View>
              <View style={styles.actionDivider} />
              <TouchableOpacity style={styles.actionListItem} onPress={() => { setReplyingTo(selectedMessage); setSelectedMessage(null); }}><Ionicons name="arrow-undo-outline" size={22} color="#0f172a" /><Text style={styles.actionListText}>Reply</Text></TouchableOpacity>
              <TouchableOpacity style={styles.actionListItem} onPress={() => setSelectedMessage(null)}><Ionicons name="chatbubbles-outline" size={22} color="#0f172a" /><Text style={styles.actionListText}>Reply in Thread</Text></TouchableOpacity>
              {isLeader && <TouchableOpacity style={styles.actionListItem} onPress={handlePinMessage}><Ionicons name="pin-outline" size={22} color="#0f172a" /><Text style={styles.actionListText}>Pin Message</Text></TouchableOpacity>}
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* ATTACHMENT MENU (GLASS SHEET) */}
      <Modal visible={showActionMenu} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowActionMenu(false)}>
          <Animated.View entering={SlideInDown.springify().damping(15)} exiting={SlideOutDown} style={styles.glassSheet}>
            <View style={styles.drawerHandle} />
            <Text style={styles.sheetTitle}>Academic Tools</Text>
            <Text style={styles.sheetSub}>Supercharge your group study</Text>
            <View style={styles.toolsGrid}>
              <TouchableOpacity style={styles.toolCard} onPress={() => { setShowActionMenu(false); setShowQuestionModal(true); }}><View style={[styles.toolIcon, { backgroundColor: '#eef2ff' }]}><Ionicons name="stats-chart" size={28} color="#4f46e5" /></View><Text style={styles.toolCardTitle}>Poll / MCQ</Text></TouchableOpacity>
              <TouchableOpacity style={styles.toolCard} onPress={() => { setShowActionMenu(false); setShowTestCreator(true); }}><LinearGradient colors={['#ef4444', '#f43f5e']} style={styles.toolIcon}><Ionicons name="timer" size={28} color="#fff" /></LinearGradient><Text style={styles.toolCardTitle}>Live Test</Text></TouchableOpacity>
              <TouchableOpacity style={styles.toolCard} onPress={() => { setShowActionMenu(false); setBucketModalVisible(true); }}><View style={[styles.toolIcon, { backgroundColor: '#fefce8' }]}><Ionicons name="folder-open" size={28} color="#ca8a04" /></View><Text style={styles.toolCardTitle}>Homework</Text></TouchableOpacity>
              <TouchableOpacity style={styles.toolCard} onPress={() => { setShowActionMenu(false); setTodoModalVisible(true); }}><View style={[styles.toolIcon, { backgroundColor: '#f0fdf4' }]}><Ionicons name="checkbox" size={28} color="#16a34a" /></View><Text style={styles.toolCardTitle}>To-Do Task</Text></TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {renderSimpleTaskDrawer()}
      
      {/* 🚀 CREATION MODALS */}
      <Modal visible={todoModalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1, backgroundColor: '#f8fafc'}}>
          <View style={styles.modalHeaderBox}>
            <Text style={styles.modalHeaderTitle}>Assign a Task</Text>
            <TouchableOpacity onPress={() => setTodoModalVisible(false)}><Ionicons name="close-circle" size={30} color="#94a3b8" /></TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.inputLabel}>TASK DESCRIPTION</Text>
            <TextInput style={styles.modalInputFull} placeholder="e.g. Read Physics Chapter 5..." value={newTodoTask} onChangeText={setNewTodoTask} maxLength={LIMITS.MAX_TITLE_LENGTH} />
            <TouchableOpacity style={styles.primaryActionBtn} onPress={handleCreateTodo}><Text style={styles.primaryActionText}>Create Task</Text></TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={bucketModalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1, backgroundColor: '#f8fafc'}}>
          <View style={styles.modalHeaderBox}>
            <Text style={styles.modalHeaderTitle}>Homework Bucket</Text>
            <TouchableOpacity onPress={() => setBucketModalVisible(false)}><Ionicons name="close-circle" size={30} color="#94a3b8" /></TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.inputLabel}>ASSIGNMENT TOPIC</Text>
            <TextInput style={styles.modalInputFull} placeholder="e.g. Differentiation Problems" value={bucketTitle} onChangeText={setBucketTitle} maxLength={LIMITS.MAX_TITLE_LENGTH} />
            <TouchableOpacity style={styles.primaryActionBtn} onPress={createHomeworkBucket}><Text style={styles.primaryActionText}>Create Bucket</Text></TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showQuestionModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1, backgroundColor: '#f8fafc'}}>
          <View style={styles.modalHeaderBox}>
            <Text style={styles.modalHeaderTitle}>Ask a Question / Poll</Text>
            <TouchableOpacity onPress={() => setShowQuestionModal(false)}><Ionicons name="close-circle" size={30} color="#94a3b8" /></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <View style={styles.pollTabs}>
              <TouchableOpacity style={[styles.pollTab, qType === 'mcq' && styles.pollTabActive]} onPress={() => setQType('mcq')}><Text style={[styles.pollTabText, qType === 'mcq' && styles.pollTabTextActive]}>MCQ Poll</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.pollTab, qType === 'subjective' && styles.pollTabActive]} onPress={() => setQType('subjective')}><Text style={[styles.pollTabText, qType === 'subjective' && styles.pollTabTextActive]}>Written Doubt</Text></TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>QUESTION TEXT</Text>
            <TextInput style={[styles.modalInputFull, {minHeight: 100, textAlignVertical: 'top'}]} placeholder="Type your question here..." multiline value={qText} onChangeText={setQText} maxLength={LIMITS.MAX_QUESTION_LENGTH} />
            {qType === 'mcq' && (
              <View>
                <Text style={styles.inputLabel}>OPTIONS (Select Correct)</Text>
                {mcqOptions.map((opt, idx) => (
                  <View key={idx} style={styles.optionRow}>
                    <TouchableOpacity onPress={() => setCorrectOptionIdx(idx)} style={{marginRight: 12}}><Ionicons name={correctOptionIdx === idx ? "checkmark-circle" : "ellipse-outline"} size={28} color={correctOptionIdx === idx ? "#10b981" : "#cbd5e1"} /></TouchableOpacity>
                    <TextInput style={[styles.modalInputFull, {flex: 1, marginBottom: 0}]} placeholder={`Option ${idx + 1}`} value={opt} onChangeText={(t) => { const newOpts = [...mcqOptions]; newOpts[idx] = t; setMcqOptions(newOpts); }} />
                  </View>
                ))}
              </View>
            )}
            <TouchableOpacity style={[styles.primaryActionBtn, {marginTop: 30, marginBottom: 50}]} onPress={handleSendQuestion}><Text style={styles.primaryActionText}>Launch Question</Text></TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showTestCreator} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1, backgroundColor: '#f8fafc'}}>
          <View style={styles.modalHeaderBox}>
            <View>
              <Text style={styles.modalHeaderTitle}>Live Mock Test</Text>
              <Text style={{color: '#64748b', fontSize: 12, fontWeight: '600'}}>Create timed MCQ challenges</Text>
            </View>
            <TouchableOpacity onPress={() => setShowTestCreator(false)}><Ionicons name="close-circle" size={30} color="#94a3b8" /></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <Text style={styles.inputLabel}>TEST TITLE</Text>
            <TextInput style={styles.modalInputFull} placeholder="e.g. Physics Full Mock" value={testTitle} onChangeText={setTestTitle} maxLength={LIMITS.MAX_TITLE_LENGTH} />
            <View style={{flexDirection: 'row', gap: 15, marginBottom: 20}}>
              <View style={{flex: 1}}>
                <Text style={styles.inputLabel}>DURATION (MINS)</Text>
                <TextInput style={styles.modalInputFull} placeholder="15" keyboardType="numeric" value={testDuration} onChangeText={setTestDuration} />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.inputLabel}>NTA MARKING (+4/-1)</Text>
                <TouchableOpacity style={[styles.modalInputFull, {justifyContent: 'center', alignItems: 'center', backgroundColor: testNtaFormat ? '#ecfdf5' : '#f8fafc', borderColor: testNtaFormat ? '#10b981' : '#e2e8f0'}]} onPress={() => setTestNtaFormat(!testNtaFormat)}>
                  <Text style={{color: testNtaFormat ? '#059669' : '#64748b', fontWeight: '800'}}>{testNtaFormat ? 'ENABLED' : 'DISABLED'}</Text>
                </TouchableOpacity>
              </View>
            </View>
            {testQuestions.map((q, qIdx) => (
              <View key={qIdx} style={styles.questionCreatorCard}>
                <View style={styles.qcHeader}>
                  <Text style={styles.qcTitle}>Question {qIdx + 1}</Text>
                  {testQuestions.length > 1 && (
                    <TouchableOpacity onPress={() => setTestQuestions(testQuestions.filter((_, i) => i !== qIdx))}><Ionicons name="trash" size={18} color="#ef4444" /></TouchableOpacity>
                  )}
                </View>
                <TextInput style={[styles.modalInputFull, {minHeight: 80, textAlignVertical: 'top'}]} placeholder="Type question..." multiline value={q.q} onChangeText={(t) => { const newQ = [...testQuestions]; newQ[qIdx].q = t; setTestQuestions(newQ); }} />
                {q.options.map((opt, oIdx) => (
                  <View key={oIdx} style={styles.optionRow}>
                    <TouchableOpacity onPress={() => { const newQ = [...testQuestions]; newQ[qIdx].correct = oIdx; setTestQuestions(newQ); }} style={{marginRight: 12}}><Ionicons name={q.correct === oIdx ? "radio-button-on" : "radio-button-off"} size={24} color={q.correct === oIdx ? "#4f46e5" : "#cbd5e1"} /></TouchableOpacity>
                    <TextInput style={[styles.modalInputFull, {flex: 1, marginBottom: 0, height: 45, borderColor: q.correct === oIdx ? '#c7d2fe' : '#e2e8f0'}]} placeholder={`Opt ${oIdx + 1}`} value={opt} onChangeText={(t) => { const newQ = [...testQuestions]; newQ[qIdx].options[oIdx] = t; setTestQuestions(newQ); }} />
                  </View>
                ))}
              </View>
            ))}
            {testQuestions.length < LIMITS.MAX_TEST_QUESTIONS && (
              <TouchableOpacity style={styles.addQBtn} onPress={() => setTestQuestions([...testQuestions, { q: '', options: ['', '', '', ''], correct: 0, posMarks: '4', negMarks: '1' }])}><Text style={styles.addQBtnText}>+ Add Another Question</Text></TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.primaryActionBtn, {marginTop: 10, marginBottom: 50}]} onPress={handleSendTest}><Text style={styles.primaryActionText}>Launch Test Now</Text></TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showStudyModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1, backgroundColor: '#f8fafc'}}>
          <View style={{padding: 25}}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#0f172a', marginBottom: 15, marginTop: 20 }}>Study Session 💻</Text>
            <Text style={{color: '#64748b', marginBottom: 8, fontWeight: '700'}}>Focus Duration (Mins)</Text>
            <TextInput style={[styles.modalInputFull, { height: 55, marginBottom: 25 }]} placeholder="e.g. 25" keyboardType="numeric" value={studyDuration} onChangeText={setStudyDuration} />
            <TouchableOpacity style={styles.primaryActionBtn} onPress={handleCreateStudyRoom}><Text style={styles.primaryActionText}>Start Room</Text></TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={() => setShowStudyModal(false)}><Text style={{ color: '#64748b', fontWeight: '700', fontSize: 16 }}>Cancel</Text></TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <LiveTestModal activeTest={activeTest} onClose={() => setActiveTest(null)} groupId={chatIdStr} />
      <HomeworkDashboard visible={dashboardVisible} onClose={() => setDashboardVisible(false)} message={activeDashboardMessage} groupMembers={groupInfo?.members} setViewerImage={setViewerImage} />
      <ImageViewerModal visibleImage={viewerImage} setVisibleImage={setViewerImage} />
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 STYLES (Minimal, Glassy)
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' }, 
  floatingHeaderContainer: { position: 'absolute', width: '94%', alignSelf: 'center', borderRadius: 28, overflow: 'hidden', zIndex: 50, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
  glassBackground: { ...StyleSheet.absoluteFillObject },
  headerTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10 },
  backBtn: { padding: 8, marginRight: 4 },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  headerAvatar: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#f8fafc', marginRight: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  onlineDotIndicator: { position: 'absolute', bottom: -2, right: 8, width: 14, height: 14, backgroundColor: '#10b981', borderRadius: 7, borderWidth: 2, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  pulseCircle: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#10b981', position: 'absolute' },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  headerSub: { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 1 },
  headerTyping: { fontSize: 12, color: '#10b981', fontWeight: '800', fontStyle: 'italic', marginTop: 1 },
  headerRightActions: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 5 },
  iconCircleBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(241,245,249,0.8)', justifyContent: 'center', alignItems: 'center' },
  studyRoomBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef2ff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: '#c7d2fe' },
  studyRoomText: { color: '#4f46e5', fontSize: 13, fontWeight: '800' },
  searchBarWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', marginHorizontal: 15, marginBottom: 12, borderRadius: 14, paddingHorizontal: 15, height: 46, borderWidth: 1, borderColor: '#e2e8f0' },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#0f172a', fontWeight: '600' },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 15, paddingBottom: 15, gap: 10 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: 'rgba(241, 245, 249, 0.6)', borderWidth: 1, borderColor: 'rgba(226,232,240,0.5)' },
  tabActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  tabTextActive: { color: '#fff' },
  bannerArea: { position: 'absolute', top: 130, width: '100%', zIndex: 40, alignItems: 'center' },
  homeworkBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff1f2', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, shadowColor: '#e11d48', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4, borderWidth: 1, borderColor: '#fecdd3', marginBottom: 10 },
  homeworkBannerText: { color: '#e11d48', fontSize: 13, fontWeight: '800', marginLeft: 8 },
  pinnedStrip: { width: '90%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fffbeb', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 16, shadowColor: '#b45309', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, borderWidth: 1, borderColor: '#fef08a' },
  pinnedLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  pinnedLabel: { fontSize: 10, fontWeight: '800', color: '#d97706', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  pinnedText: { fontSize: 14, fontWeight: '700', color: '#78350f' },
  chatArea: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  dateSeparator: { alignSelf: 'center', backgroundColor: 'rgba(226, 232, 240, 0.8)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, marginVertical: 20 },
  dateText: { fontSize: 11, fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 },
  jumpBottomWrapper: { position: 'absolute', bottom: 100, right: 20, zIndex: 10 },
  jumpBottomBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5, elevation: 5 },
  dockWrapper: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 50 },
  mentionsOverlay: { width: '92%', backgroundColor: '#fff', borderRadius: 24, padding: 15, marginBottom: 10, shadowColor: '#0f172a', shadowOpacity: 0.1, shadowRadius: 15, elevation: 5, borderWidth: 1, borderColor: '#f1f5f9' },
  mentionHeader: { fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 1 },
  mentionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f8fafc' },
  mentionAvatar: { width: 34, height: 34, borderRadius: 17, marginRight: 12, backgroundColor: '#e2e8f0' },
  mentionName: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  replyPreview: { width: '92%', backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 15, paddingBottom: 25, marginBottom: -15, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 4, borderWidth: 1, borderColor: '#f1f5f9' },
  replyLine: { width: 4, height: '100%', backgroundColor: '#4f46e5', borderRadius: 4, marginRight: 12 },
  replyName: { fontSize: 12, fontWeight: '900', color: '#4f46e5', marginBottom: 4 },
  replyText: { fontSize: 14, color: '#475569', fontWeight: '500' },
  dockContainer: { width: '94%', borderRadius: 36, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.1, shadowRadius: 30, elevation: 15 },
  dockInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8 },
  dockAttachBtn: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eef2ff', marginRight: 8 },
  dockInputWrapper: { flex: 1, justifyContent: 'center' },
  dockInput: { fontSize: 16, color: '#0f172a', fontWeight: '500', paddingHorizontal: 8, paddingTop: Platform.OS === 'ios' ? 14 : 10, paddingBottom: Platform.OS === 'ios' ? 14 : 10, maxHeight: 120, textAlignVertical: 'center' },
  dockSendBtn: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  dockSendBtnActive: { backgroundColor: '#4f46e5' },
  dockSendBtnInactive: { backgroundColor: '#f1f5f9' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  glassSheet: { backgroundColor: '#fff', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 30, paddingBottom: Platform.OS === 'ios' ? 45 : 30, shadowColor: '#000', shadowOffset: {width: 0, height: -10}, shadowOpacity: 0.1, shadowRadius: 20 },
  drawerHandle: { width: 50, height: 6, backgroundColor: '#e2e8f0', borderRadius: 10, alignSelf: 'center', marginBottom: 25 },
  sheetTitle: { fontSize: 26, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  sheetSub: { fontSize: 14, color: '#64748b', fontWeight: '500', marginTop: 4, marginBottom: 25 },
  toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 15 },
  toolCard: { width: '30%', alignItems: 'center', marginBottom: 15 },
  toolIcon: { width: 64, height: 64, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 10, shadowColor: '#0f172a', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  toolCardTitle: { fontSize: 13, fontWeight: '800', color: '#334155', textAlign: 'center' },
  quickActionBox: { backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 40, borderRadius: 32, padding: 25, shadowColor: '#0f172a', shadowOpacity: 0.15, shadowRadius: 30, elevation: 15 },
  reactionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  reactionBtn: { padding: 10, backgroundColor: '#f8fafc', borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  actionDivider: { height: 1, backgroundColor: '#e2e8f0', marginBottom: 15 },
  actionListItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  actionListText: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginLeft: 16 },
  taskDrawerContainer: { flex: 1, backgroundColor: '#f8fafc', paddingTop: 20 },
  taskDrawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginBottom: 25 },
  taskDrawerTitle: { fontSize: 28, fontWeight: '900', color: '#0f172a' },
  closeCircleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  createTaskBtn: { backgroundColor: '#0f172a', paddingHorizontal: 30, paddingVertical: 16, borderRadius: 24, shadowColor: '#0f172a', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5, marginBottom: 20 },
  createTaskBtnText: { color: '#fff', fontWeight: '900', fontSize: 16, textAlign: 'center' },
  taskCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 5, elevation: 1 },
  taskCheckArea: { marginRight: 15, justifyContent: 'center' },
  taskText: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  taskTextCompleted: { color: '#94a3b8', textDecorationLine: 'line-through' },
  completedByRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  completedByText: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  tinyAvatar: { width: 20, height: 20, borderRadius: 10, marginLeft: -5, borderWidth: 1, borderColor: '#fff' },
  modalHeaderBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingVertical: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f5f9' },
  modalHeaderTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
  modalBody: { padding: 25 },
  inputLabel: { fontSize: 12, fontWeight: '800', color: '#64748b', marginBottom: 8, marginTop: 15, letterSpacing: 0.5 },
  modalInputFull: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 18, fontSize: 16, color: '#0f172a', fontWeight: '600', marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  primaryActionBtn: { backgroundColor: '#4f46e5', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10, shadowColor: '#4f46e5', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  primaryActionText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  pollTabs: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#f1f5f9', borderRadius: 16, padding: 4 },
  pollTab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14 },
  pollTabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  pollTabText: { fontWeight: '700', color: '#64748b', fontSize: 14 },
  pollTabTextActive: { color: '#4f46e5', fontWeight: '800' },
  optionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  questionCreatorCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 },
  qcHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  qcTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  addQBtn: { backgroundColor: '#eef2ff', padding: 16, borderRadius: 16, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#a5b4fc', marginBottom: 20 },
  addQBtnText: { color: '#4f46e5', fontWeight: '800', fontSize: 15 },
  goBackBtn: { marginTop: 30, backgroundColor: '#f1f5f9', padding: 15, borderRadius: 12 }
});