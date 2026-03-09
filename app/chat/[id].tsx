import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  FlatList, KeyboardAvoidingView, Platform, SafeAreaView, 
  Image, ActivityIndicator, StatusBar, Modal, Alert, ScrollView
} from 'react-native';
import { createAgoraRtcEngine, ClientRoleType, ChannelProfileType } from '../../helpers/agoraHelper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker'; 
import { auth, db } from '../../firebaseConfig';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av'; 
import { awardXP } from '../../helpers/gamificationEngine';
import { increment } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, Layout, useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

// 🚨 API KEY FROM .ENV FILE
const IMGBB_API_KEY = process.env.EXPO_PUBLIC_IMGBB_API_KEY; 
const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID;

// ============================================================================
// 🚀 UPLOAD ENGINE (WITH 24-HOUR AUTO-EXPIRATION)
// ============================================================================
const uploadToImgBB = async (base64Image: string) => {
  try {
    if (!IMGBB_API_KEY) return null;

    const formData = new FormData();
    formData.append('image', base64Image);
    formData.append('expiration', '86400'); // 👈 🔥 MAGIC: 86400 seconds = 24 Hours!

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
      headers: { Accept: 'application/json' }
    });
    
    const data = await response.json();
    if (data.success) return data.data.url; 
    return null;
  } catch (error: any) {
    return null;
  }
};

// ==========================================
// 🌟 COMPONENT 1: ADVANCED SMART CHAT BUBBLE
// ==========================================
const ChatBubble = ({ message, isMe, groupId, onOpenTest, openDashboard }: any) => {
  const [subjectiveAnswer, setSubjectiveAnswer] = useState('');
  const [uploadingHomework, setUploadingHomework] = useState(false); // 👈 Moved inside Bubble!
  const currentUid = auth.currentUser?.uid;
  
  const responsesMap = message.responses || {};
  const totalVotes = Object.keys(responsesMap).length;
  const hasAnswered = currentUid && responsesMap[currentUid] !== undefined;
  const userAnswer = hasAnswered ? responsesMap[currentUid] : null;

  const timeString = message.createdAt ? new Date(message.createdAt.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...';

  // 📝 SUBMIT ANSWERS (MCQ/Subjective)
  const handleAnswerSubmit = async (answerValue: any) => {
    if (!currentUid) return;
    try {
      const msgRef = doc(db, 'groups', groupId, 'messages', message.id);
      await updateDoc(msgRef, { [`responses.${currentUid}`]: answerValue });

      // 🚀 GAMIFICATION TRIGGER FOR MCQ
      if (message.type === 'mcq') {
        const isCorrect = message.correctOption === answerValue;
        const xpToGive = isCorrect ? 20 : 5; // Sahi pe 20 XP, galat try karne pe at least 5 XP
        
        const reward = await awardXP(currentUid, xpToGive, "MCQ Answer");
        if (reward?.leveledUp) {
          Alert.alert("⭐ LEVEL UP! ⭐", `Congratulations! You are now Level ${reward.newLevel}!`);
        }
      }
    } catch (e) { console.log("Answer submit fail hua:", e); }
  };

  // 🪣 THE BULLETPROOF HOMEWORK UPLOADER
  const handleUploadHomework = async () => {
    if (!currentUid) return;
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // 👈 Native Format
        allowsMultipleSelection: true,
        selectionLimit: 10, // Max 10 pages
        quality: 0.2, // 👈 SMART COMPRESSION! Phone hang nahi hoga.
        base64: true, // 👈 FILE PERMISSION BYPASS!
      });

      if (result.canceled || !result.assets) return;
      
      setUploadingHomework(true);
      Alert.alert("Uploading", "Compressing and sending pages...");
      
      // Send base64 strings to ImgBB
      const uploadPromises = result.assets.map(asset => {
        let base64Data = asset.base64;
        // Web Fallback
        if (!base64Data && Platform.OS === 'web' && asset.uri.startsWith('data:image')) {
          base64Data = asset.uri.split(',')[1];
        }
        if (!base64Data) return null;
        return uploadToImgBB(base64Data);
      });

      const rawLinks = await Promise.all(uploadPromises);
      const validLinks = rawLinks.filter(link => link !== null);

      if (validLinks.length > 0) {
        const existingSubmissions = message.submissions || {};
        const myPreviousPages = existingSubmissions[currentUid]?.pages || [];
        
        const updatedSubmissions = {
          ...existingSubmissions,
          [currentUid]: {
            name: auth.currentUser?.displayName || 'User',
            pages: [...myPreviousPages, ...validLinks],
            submittedAt: new Date().toISOString()
          }
        };
        await updateDoc(doc(db, 'groups', groupId, 'messages', message.id), { submissions: updatedSubmissions });
            // Bacche ke profile me 50 XP jod do
          await updateDoc(doc(db, 'users', currentUid), { 
            xp: increment(50) 
          });
        Alert.alert("Success! 🎉", `${validLinks.length} pages submitted successfully.`);
      }

      // 🚀 GAMIFICATION TRIGGER
        const reward = await awardXP(currentUid, 50, "Homework Upload");
        if (reward?.leveledUp) {
          Alert.alert("⭐ LEVEL UP! ⭐", `Congratulations! You've reached Level ${reward.newLevel}!`);
        }
      // Note: Error alert pehle hi uploadToImgBB mein dikh jayega, toh yahan alert hata diya.
      
    } catch (e) { 
      Alert.alert("Error", "Something went wrong."); 
      console.log("Main Catch Error:", e);
    } finally { 
      setUploadingHomework(false); 
    }
  };
  // 🚀 TYPE 1: TEST BUBBLE
  if (message.type === 'test') {
    const hasTakenTest = message.responses && currentUid && message.responses[currentUid] !== undefined;
    const testResult = hasTakenTest ? message.responses[currentUid] : null;

    return (
      <Animated.View entering={FadeInUp.duration(400).springify()} layout={Layout.springify()} style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperOther]}>
        {!isMe ? <Image source={{ uri: message.senderAvatar || `https://ui-avatars.com/api/?name=${message.senderName}` }} style={styles.senderAvatar} /> : null}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther, { width: '85%', padding: 0, overflow: 'hidden' }]}>
          <LinearGradient colors={['#4f46e5', '#3730a3']} style={{ padding: 15, alignItems: 'center' }}>
            <Ionicons name="timer-outline" size={32} color="#fff" style={{ marginBottom: 5 }} />
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>{message.title}</Text>
            <Text style={{ color: '#c7d2fe', fontSize: 12, fontWeight: '600', marginTop: 2 }}>{message.questions?.length} Questions • {message.duration} Minutes</Text>
          </LinearGradient>
          <View style={{ padding: 15, backgroundColor: isMe ? '#2563eb' : '#fff' }}>
            <Text style={[styles.messageText, isMe ? {color: '#bfdbfe'} : {color: '#64748b'}, { textAlign: 'center', marginBottom: 15 }]}>
              {hasTakenTest ? "You have already attempted this test." : "Test your knowledge right now!"}
            </Text>
            {hasTakenTest ? (
              <View style={{ backgroundColor: isMe ? '#1e3a8a' : '#f8fafc', padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: isMe ? '#1e40af' : '#e2e8f0' }}>
                <Text style={{ fontSize: 12, color: isMe ? '#93c5fd' : '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Your Score</Text>
                <Text style={{ fontSize: 32, fontWeight: '900', color: isMe ? '#fff' : '#10b981' }}>{testResult.score} <Text style={{ fontSize: 16, color: isMe ? '#bfdbfe' : '#94a3b8' }}>/ {message.questions?.length}</Text></Text>
              </View>
            ) : (
              <TouchableOpacity style={{ backgroundColor: isMe ? '#fff' : '#4f46e5', paddingVertical: 12, borderRadius: 12, alignItems: 'center', elevation: 2 }} onPress={() => onOpenTest(message)}>
                <Text style={{ color: isMe ? '#2563eb' : '#fff', fontWeight: '800', fontSize: 15 }}>Start Test Now</Text>
              </TouchableOpacity>
            )}
            <Text style={[styles.timeText, isMe ? styles.timeTextMe : styles.timeTextOther, {marginTop: 10, textAlign: 'center'}]}>{timeString}</Text>
          </View>
        </View>
      </Animated.View>
    );
  }

  // 🚀 TYPE 2: MCQ BUBBLE
  if (message.type === 'mcq') {
    let correctVotes = 0;
    Object.values(responsesMap).forEach((val) => { if (val === message.correctOption) correctVotes++; });
    const correctPercent = totalVotes > 0 ? Math.round((correctVotes / totalVotes) * 100) : 0;
    const wrongPercent = totalVotes > 0 ? 100 - correctPercent : 0;

    return (
      <Animated.View entering={FadeInUp.duration(400).springify()} layout={Layout.springify()} style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperOther]}>
        {!isMe ? <Image source={{ uri: message.senderAvatar || `https://ui-avatars.com/api/?name=${message.senderName}` }} style={styles.senderAvatar} /> : null}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther, { width: '85%' }]}>
          <View style={styles.questionHeader}>
            <Ionicons name="stats-chart" size={18} color={isMe ? "#bfdbfe" : "#3b82f6"} />
            <Text style={[styles.questionLabel, isMe ? {color: '#bfdbfe'} : {color: '#3b82f6'}]}>Live Poll / MCQ</Text>
          </View>
          <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther, { fontWeight: '700', marginBottom: 12 }]}>{message.text}</Text>
          {message.options?.map((opt: string, index: number) => {
            const isSelected = userAnswer === index;
            const isCorrect = message.correctOption === index;
            const votesForThisOption = Object.values(responsesMap).filter(v => v === index).length;
            const percentForThisOption = totalVotes > 0 ? Math.round((votesForThisOption / totalVotes) * 100) : 0;
            
            if (hasAnswered) {
              let barColor = '#e2e8f0'; 
              if (isCorrect) barColor = '#d1fae5'; else if (isSelected && !isCorrect) barColor = '#fee2e2'; 
              return (
                <View key={index} style={[styles.mcqResultOption, isCorrect ? styles.mcqCorrectBorder : (isSelected ? styles.mcqWrongBorder : {})]}>
                  <Animated.View style={[styles.mcqResultFill, { width: `${percentForThisOption}%`, backgroundColor: barColor }]} />
                  <View style={styles.mcqResultContent}>
                    <Text style={[styles.mcqOptionText, {flex: 1, zIndex: 10}]}>{opt}</Text>
                    <Text style={{fontWeight: '800', color: '#64748b', marginLeft: 10, zIndex: 10}}>{percentForThisOption}%</Text>
                    {isCorrect ? <Ionicons name="checkmark-circle" size={20} color="#10b981" style={{marginLeft: 5, zIndex: 10}} /> : null}
                    {isSelected && !isCorrect ? <Ionicons name="close-circle" size={20} color="#ef4444" style={{marginLeft: 5, zIndex: 10}} /> : null}
                  </View>
                </View>
              );
            } else {
              return (
                <TouchableOpacity key={index} style={styles.mcqOption} onPress={() => handleAnswerSubmit(index)}>
                  <Text style={styles.mcqOptionText}>{opt}</Text>
                </TouchableOpacity>
              );
            }
          })}
          {hasAnswered ? (
            <View style={styles.mcqStatsRow}>
              <Text style={styles.mcqStatText}>👥 {totalVotes} Votes</Text>
              <Text style={styles.mcqStatText}>✅ {correctPercent}% Correct</Text>
              <Text style={styles.mcqStatText}>❌ {wrongPercent}% Wrong</Text>
            </View>
          ) : null}
          <Text style={[styles.timeText, isMe ? styles.timeTextMe : styles.timeTextOther, {marginTop: 8}]}>{timeString}</Text>
        </View>
      </Animated.View>
    );
  }

  // 🚀 TYPE 3: SUBJECTIVE BUBBLE
  if (message.type === 'subjective') {
    return (
      <Animated.View entering={FadeInUp.duration(400).springify()} layout={Layout.springify()} style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperOther]}>
        {!isMe ? <Image source={{ uri: message.senderAvatar || `https://ui-avatars.com/api/?name=${message.senderName}` }} style={styles.senderAvatar} /> : null}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther, { width: '85%' }]}>
          <View style={styles.questionHeader}>
            <Ionicons name="document-text" size={18} color={isMe ? "#bfdbfe" : "#8b5cf6"} />
            <Text style={[styles.questionLabel, isMe ? {color: '#bfdbfe'} : {color: '#8b5cf6'}]}>Written Answer</Text>
          </View>
          <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther, { fontWeight: '700', marginBottom: 10 }]}>{message.text}</Text>
          {hasAnswered ? (
            <View style={styles.submittedBox}>
              <Text style={styles.submittedTitle}>Your Answer:</Text>
              <Text style={styles.submittedText}>{userAnswer}</Text>
            </View>
          ) : (
            <View>
              <TextInput style={styles.subjectiveInput} placeholder="Type your answer here..." placeholderTextColor="#94a3b8" multiline value={subjectiveAnswer} onChangeText={setSubjectiveAnswer} />
              <TouchableOpacity style={styles.submitBtn} onPress={() => { if(subjectiveAnswer.trim()) handleAnswerSubmit(subjectiveAnswer.trim()); }}>
                <Text style={styles.submitBtnText}>Submit Answer</Text>
              </TouchableOpacity>
            </View>
          )}
          <Text style={[styles.timeText, isMe ? styles.timeTextMe : styles.timeTextOther, {marginTop: 8}]}>{timeString}</Text>
        </View>
      </Animated.View>
    );
  }

  // 🚀 TYPE 4: HOMEWORK BUCKET BUBBLE (The New Universal Feature)
  if (message.type === 'homework_bucket') {
    const mySubmission = message.submissions?.[currentUid || ''];
    const totalSubmitted = Object.keys(message.submissions || {}).length;

    return (
      <Animated.View entering={FadeInUp.duration(400).springify()} layout={Layout.springify()} style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperOther]}>
        {!isMe ? <Image source={{ uri: message.senderAvatar || `https://ui-avatars.com/api/?name=${message.senderName}` }} style={styles.senderAvatar} /> : null}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther, { width: '85%', backgroundColor: '#f8fafc', borderColor: '#cbd5e1', borderWidth: 1 }]}>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderColor: '#e2e8f0' }}>
            <Ionicons name="folder-open" size={24} color="#2563eb" />
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#0f172a', marginLeft: 8, flex: 1 }}>{message.title}</Text>
          </View>
          
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 15 }}>👥 {totalSubmitted} Students Submitted</Text>

          {mySubmission ? (
            <Text style={{ color: '#10b981', fontWeight: '700', fontSize: 12, marginBottom: 10, textAlign: 'center' }}>
              ✅ You submitted {mySubmission.pages.length} pages
            </Text>
          ) : null}

          <View style={{ flexDirection: 'row', gap: 10 }}>
            {/* Upload Button */}
            <TouchableOpacity 
              style={{ flex: 1, flexDirection: 'row', backgroundColor: '#2563eb', paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }} 
              onPress={handleUploadHomework}
              disabled={uploadingHomework}
            >
              {uploadingHomework ? <ActivityIndicator size="small" color="#fff" /> : (
                <>
                  <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12, marginLeft: 5 }}>Upload</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Dashboard Button */}
            <TouchableOpacity 
              style={{ flex: 1, flexDirection: 'row', backgroundColor: '#0f172a', paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }} 
              onPress={() => openDashboard(message)} // 👈 ALERT HATA KAR YE LAGA DO
            >
              <Ionicons name="stats-chart" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12, marginLeft: 5 }}>Dashboard</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.timeText, { color: '#94a3b8', marginTop: 8 }]}>{timeString}</Text>
        </View>
      </Animated.View>
    );
  }

  // 🚀 TYPE 5: NORMAL TEXT BUBBLE
  return (
    <Animated.View entering={FadeInUp.duration(400).springify()} layout={Layout.springify()} style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperOther]}>
      {!isMe ? <Image source={{ uri: message.senderAvatar || `https://ui-avatars.com/api/?name=${message.senderName}` }} style={styles.senderAvatar} /> : null}
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
        {!isMe ? <Text style={styles.senderName}>{message.senderName}</Text> : null}
        <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>{message.text}</Text>
        <Text style={[styles.timeText, isMe ? styles.timeTextMe : styles.timeTextOther]}>{timeString}</Text>
      </View>
    </Animated.View>
  );
};

// ==========================================
// 🌟 COMPONENT 2: MAIN CHAT SCREEN
// ==========================================
export default function ChatScreen() {
  const { id } = useLocalSearchParams(); 
  const router = useRouter();

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [groupInfo, setGroupInfo] = useState<any>(null);

  const [isInLounge, setIsInLounge] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [todos, setTodos] = useState<any[]>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [isTodoExpanded, setIsTodoExpanded] = useState(false); 

  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [qType, setQType] = useState('mcq'); 
  const [qText, setQText] = useState('');
  const [mcqOptions, setMcqOptions] = useState(['', '', '', '']);
  const [correctOptionIdx, setCorrectOptionIdx] = useState(0);

  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showTestCreator, setShowTestCreator] = useState(false);
  const [testTitle, setTestTitle] = useState('');
  const [testDuration, setTestDuration] = useState('15');
  const [testQuestions, setTestQuestions] = useState([{ q: '', options: ['', '', '', ''], correct: 0 }]);

  const [activeTest, setActiveTest] = useState<any>(null);
  const [testAnswers, setTestAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);

  // 🪣 BUCKET CREATION STATES
  const [bucketModalVisible, setBucketModalVisible] = useState(false);
  const [bucketTitle, setBucketTitle] = useState('');
  // 📊 DASHBOARD STATES
  const [dashboardVisible, setDashboardVisible] = useState(false);
  const [activeDashboardMessage, setActiveDashboardMessage] = useState<any>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null); // For Arrow click ke liye
  const [viewerImage, setViewerImage] = useState<string | null>(null);   // For Image Image Zoom


  const flatListRef = useRef<FlatList>(null);
  const agoraEngineRef = useRef<any>(null);
  const sendButtonScale = useSharedValue(1);
  const todoHeight = useSharedValue(0);

  const sendBtnAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: sendButtonScale.value }] }));

  const activeVoiceUsers = groupInfo?.activeVoice || []; 
  const isLeader = groupInfo?.admins?.includes(auth.currentUser?.uid) || groupInfo?.adminId === auth.currentUser?.uid;
  const isBlocked = groupInfo?.blocked?.includes(auth.currentUser?.uid);
  const isMuted = groupInfo?.muted?.includes(auth.currentUser?.uid);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true, staysActiveInBackground: true, shouldDuckAndroid: true, playThroughEarpieceAndroid: false });
      } catch (e) { console.log(e); }
    };
    setupAudio();
  }, []);
  
  useEffect(() => {
    if (!id || !auth.currentUser) return;
    const unsubGroup = onSnapshot(doc(db, 'groups', id as string), (docSnap) => {
      if (docSnap.exists()) setGroupInfo(docSnap.data());
    });
    const unsubMessages = onSnapshot(query(collection(db, 'groups', id as string, 'messages'), orderBy('createdAt', 'asc')), (snapshot) => {
      setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
    });
    const unsubTodos = onSnapshot(query(collection(db, 'groups', id as string, 'todos'), orderBy('createdAt', 'desc')), (snapshot) => {
      setTodos(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubGroup(); unsubMessages(); unsubTodos(); };
  }, [id]);

  useEffect(() => {
    todoHeight.value = withTiming(isTodoExpanded ? (isLeader ? 250 : 200) : 0, { duration: 300 });
  }, [isTodoExpanded, isLeader]);
  
  const animatedTodoStyle = useAnimatedStyle(() => ({ height: todoHeight.value, opacity: todoHeight.value > 10 ? 1 : 0, overflow: 'hidden' }));

  useEffect(() => {
    let timer: any;
    if (activeTest && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (activeTest && timeLeft === 0) {
      submitTest();
    }
    return () => clearInterval(timer);
  }, [activeTest, timeLeft]);

  const handleAddTodo = async () => {
    if (!newTodoText.trim() || !isLeader) return;
    await addDoc(collection(db, 'groups', id as string, 'todos'), { task: newTodoText.trim(), createdAt: serverTimestamp(), completedBy: [] });
    setNewTodoText('');
  };

  const toggleTodo = async (todoId: string, currentCompletedBy: string[]) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    let updatedCompletedBy = [...currentCompletedBy];
    if (updatedCompletedBy.includes(uid)) updatedCompletedBy = updatedCompletedBy.filter(i => i !== uid);
    else updatedCompletedBy.push(uid);
    await updateDoc(doc(db, 'groups', id as string, 'todos', todoId), { completedBy: updatedCompletedBy });
  };

  const sendMessage = async () => {
    if (inputText.trim() === '' || !auth.currentUser) return;
    sendButtonScale.value = withSpring(0.8, {}, () => { sendButtonScale.value = withSpring(1); });
    const textToSend = inputText.trim();
    setInputText(''); 
    await addDoc(collection(db, 'groups', id as string, 'messages'), {
      type: 'text', text: textToSend, senderId: auth.currentUser.uid, 
      senderName: auth.currentUser.displayName || 'User', 
      senderAvatar: auth.currentUser.photoURL || `https://ui-avatars.com/api/?name=${auth.currentUser.displayName}`, 
      createdAt: serverTimestamp(),
    });
  };
 
  const openDashboard = (message: any) => {
    setActiveDashboardMessage(message);
    setExpandedUser(null);
    setDashboardVisible(true);
  };
  
  const handleSendQuestion = async () => {
    if (!qText.trim() || !auth.currentUser) return;
    await addDoc(collection(db, 'groups', id as string, 'messages'), {
      type: qType, text: qText.trim(),
      options: qType === 'mcq' ? mcqOptions.filter(opt => opt.trim() !== '') : [],
      correctOption: qType === 'mcq' ? correctOptionIdx : null,
      responses: {}, senderId: auth.currentUser.uid,
      senderName: auth.currentUser.displayName || 'Leader',
      senderAvatar: auth.currentUser.photoURL || `https://ui-avatars.com/api/?name=${auth.currentUser.displayName}`,
      createdAt: serverTimestamp(),
    });
    setShowQuestionModal(false); setQText(''); setMcqOptions(['', '', '', '']);
  };

  const addTestQuestion = () => setTestQuestions([...testQuestions, { q: '', options: ['', '', '', ''], correct: 0 }]);

  const handleSendTest = async () => {
    if (!testTitle.trim() || testQuestions.length === 0 || !auth.currentUser) return;
    await addDoc(collection(db, 'groups', id as string, 'messages'), {
      type: 'test', title: testTitle.trim(), duration: parseInt(testDuration) || 15,
      questions: testQuestions, responses: {}, senderId: auth.currentUser.uid,
      senderName: auth.currentUser.displayName || 'Leader',
      senderAvatar: auth.currentUser.photoURL || `https://ui-avatars.com/api/?name=${auth.currentUser.displayName}`,
      createdAt: serverTimestamp(),
    });
    setShowTestCreator(false); setTestTitle(''); setTestQuestions([{ q: '', options: ['', '', '', ''], correct: 0 }]);
  };

  const startTest = (testMsg: any) => {
    setActiveTest(testMsg);
    setTestAnswers(new Array(testMsg.questions.length).fill(-1));
    setTimeLeft(testMsg.duration * 60); 
  };

  const submitTest = async () => {
    if (!activeTest || !auth.currentUser) return;
    let score = 0;
    activeTest.questions.forEach((q: any, idx: number) => { if (testAnswers[idx] === q.correct) score++; });
    const msgRef = doc(db, 'groups', id as string, 'messages', activeTest.id);
    await updateDoc(msgRef, { [`responses.${auth.currentUser.uid}`]: { score, answers: testAnswers } });
    
    // 🚀 GAMIFICATION TRIGGER FOR TESTS
    const earnedXP = score * 15; // Har sahi jawab ka 15 XP!
    const reward = await awardXP(auth.currentUser.uid, earnedXP, "Test Submitted");
    
    if (reward?.leveledUp) {
      Alert.alert("🎉 TEST SUBMITTED & LEVEL UP!", `Score: ${score}/${activeTest.questions.length}\nLevel Reached: ${reward.newLevel} ⭐`);
    } else {
      Alert.alert("Test Submitted! 🎉", `Your score is ${score} out of ${activeTest.questions.length}\nYou earned +${earnedXP} XP!`);
    }
    
    setActiveTest(null);
  };

  const createHomeworkBucket = async () => {
    if (!bucketTitle.trim() || !auth.currentUser) return;
    setBucketModalVisible(false);
    await addDoc(collection(db, 'groups', id as string, 'messages'), {
      title: bucketTitle.trim(),
      senderId: auth.currentUser.uid,
      senderName: auth.currentUser.displayName,
      senderAvatar: auth.currentUser.photoURL || `https://ui-avatars.com/api/?name=${auth.currentUser.displayName}`,
      type: 'homework_bucket',
      submissions: {}, 
      createdAt: serverTimestamp(),
    });
    setBucketTitle('');
  };

// ==========================================
  // 🎙️ THE REAL-TIME AGORA VOICE ENGINE
  // ==========================================
  
  // Initialize Agora when entering the lounge
  const setupAgoraEngine = async () => {
    try {
      if (!AGORA_APP_ID) {
        Alert.alert("Agora API Key Missing", "Please add EXPO_PUBLIC_AGORA_APP_ID to .env");
        return false;
      }
      agoraEngineRef.current = createAgoraRtcEngine();
      const engine = agoraEngineRef.current;
      
      engine.initialize({ appId: AGORA_APP_ID });
      
      // 🚨 AGORA ERROR TRACKER (Ye exact problem batayega)
      engine.addListener('onError', (errCode, msg) => {
        console.log("❌ AGORA ERROR FATAL:", errCode, msg);
        if (errCode === 101) console.log("👉 Reason: App ID galat hai!");
        if (errCode === 109) console.log("👉 Reason: Token galat hai ya expire ho gaya!");
      });

      // Join Success Listener
      engine.addListener('onJoinChannelSuccess', (connection, elapsed) => {
        console.log("✅ AGORA JOIN SUCCESS! Channel:", connection.channelId, "UID:", connection.localUid);
      });

      // User Joined Listener
      engine.addListener('onUserJoined', (connection, remoteUid, elapsed) => {
        console.log("🗣️ KOI AUR BHI AAYA! Remote UID:", remoteUid);
      });

      // User Offline Listener
      engine.addListener('onUserOffline', (connection, remoteUid, reason) => {
        console.log("👋 KOI GAYA! Remote UID:", remoteUid, "Reason:", reason);
      });

      return true;
    } catch (e) {
      console.log("Agora Setup Error:", e);
      return false;
    }
  };

  const toggleVoiceLounge = async () => {
    // 🚨 Web Browser Check
    if (Platform.OS === 'web') {
      Alert.alert("Mobile Only", "Voice Lounge is currently available only on the Android & iOS app! 📱");
      return;
    }
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    // We use a simple hash of the user ID to pass to Agora (it expects a number)
    const agoraUid = Math.abs(uid.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0));

    try {
      if (isInLounge) {
        // 🔴 LEAVE LOUNGE
        agoraEngineRef.current?.leaveChannel();
        agoraEngineRef.current?.release(); // Free up memory
        
        const updatedUsers = activeVoiceUsers.filter((u: any) => u.uid !== uid);
        await updateDoc(doc(db, 'groups', id as string), { activeVoice: updatedUsers });
        setIsInLounge(false);
      } else {
        // 🟢 JOIN LOUNGE
        const permissionResponse = await Audio.requestPermissionsAsync();
        if (permissionResponse.granted) {
          
         // 1. Setup Agora Hardware
          const isSetup = await setupAgoraEngine();
          if (!isSetup) return;

          // 🚨 THE AGGRESSIVE AUDIO SETUP (Puraana hata kar ye daalo)
          const engine = agoraEngineRef.current;
          
          engine?.enableAudio();
          engine?.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting); // Communication ki jagah LiveBroadcasting better hai
          engine?.setClientRole(ClientRoleType.ClientRoleBroadcaster);
          
          // Forcefully unmute local audio and route to speaker
          engine?.muteLocalAudioStream(false);
          engine?.setEnableSpeakerphone(true);
          engine?.adjustRecordingSignalVolume(100); // Mic volume full
          engine?.adjustPlaybackSignalVolume(100);  // Speaker volume full

          // Join Channel
          engine?.joinChannel('', String(id), agoraUid, {
            clientRoleType: ClientRoleType.ClientRoleBroadcaster,
            publishMicrophoneTrack: true, // Force publish
            autoSubscribeAudio: true,     // Force subscribe
          });

          // 3. Update Firebase UI State
          const newUser = { 
            uid, 
            name: auth.currentUser.displayName?.split(' ')[0] || 'User', 
            avatar: auth.currentUser.photoURL || `https://ui-avatars.com/api/?name=${auth.currentUser.displayName}`, 
            isMuted: isMicMuted 
          };
          await updateDoc(doc(db, 'groups', id as string), { activeVoice: [...activeVoiceUsers, newUser] });
          setIsInLounge(true);
        } else { 
          Alert.alert("Permission Denied", "Mic ki permission zaroori hai!"); 
        }
      }
    } catch (e) { console.log("Lounge Toggle Error:", e); }
  };

  const toggleMic = async () => {
    if (!isInLounge || !auth.currentUser) return;
    const newMutedState = !isMicMuted;
    setIsMicMuted(newMutedState);
    
    // 🎙️ Mute/Unmute Real Audio in Agora
    agoraEngineRef.current?.muteLocalAudioStream(newMutedState);

    // 🎨 Update Firebase UI for others to see the muted icon
    const updatedUsers = activeVoiceUsers.map((u: any) => u.uid === auth.currentUser?.uid ? { ...u, isMuted: newMutedState } : u);
    await updateDoc(doc(db, 'groups', id as string), { activeVoice: updatedUsers });
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      
      <View style={styles.headerContainer}>
        <LinearGradient colors={['#1e3a8a', '#2563eb']} style={StyleSheet.absoluteFill} />
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Ionicons name="chevron-back" size={28} color="#fff" /></TouchableOpacity>
          <TouchableOpacity style={styles.headerTextContainer} onPress={() => router.push(`/chat/info/${id}`)}>
            <Text style={styles.groupName} numberOfLines={1}>{groupInfo?.name || "Loading..."}</Text>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text style={styles.groupStatus}>Tap for Group Info </Text>
              <Ionicons name="chevron-forward" size={12} color="#bfdbfe" />
            </View>
          </TouchableOpacity>

       {/* 🏆 THE LEADERBOARD TROPHY BUTTON */}
          <TouchableOpacity 
            onPress={() => router.push(`/chat/leaderboard/${id}`)} 
            style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, marginLeft: 'auto' }}
          >
            <Ionicons name="trophy" size={22} color="#fde047" />
          </TouchableOpacity>

          {!isInLounge ? (
            <TouchableOpacity onPress={toggleVoiceLounge} style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, marginLeft: 10 }}>
              <Ionicons name="call" size={22} color="#fff" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {(activeVoiceUsers.length > 0 || isInLounge) ? (
        <View style={styles.loungeContainer}>
          <View style={styles.loungeHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}><Ionicons name="volume-high" size={16} color="#10b981" /><Text style={styles.loungeTitle}>Voice Lounge • {activeVoiceUsers.length} active</Text></View>
            {!isInLounge ? (
              <TouchableOpacity style={styles.joinLoungeBtn} onPress={toggleVoiceLounge}><Text style={styles.joinLoungeText}>Join</Text></TouchableOpacity>
            ) : (
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity style={[styles.micBtn, isMicMuted && {backgroundColor: '#fee2e2'}]} onPress={toggleMic}><Ionicons name={isMicMuted ? "mic-off" : "mic"} size={18} color={isMicMuted ? "#ef4444" : "#1e293b"} /></TouchableOpacity>
                <TouchableOpacity style={styles.leaveLoungeBtn} onPress={toggleVoiceLounge}><Ionicons name="call" size={16} color="#fff" /></TouchableOpacity>
              </View>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.loungeAvatars}>
            {activeVoiceUsers.map((user: any, index: number) => (
              <View key={index} style={styles.loungeUser}>
                <View style={[styles.loungeAvatarWrapper, !user.isMuted && styles.speakingRing]}>
                  <Image source={{ uri: user.avatar }} style={styles.loungeAvatar} />
                  {user.isMuted ? <View style={styles.mutedBadge}><Ionicons name="mic-off" size={10} color="#fff" /></View> : null}
                </View>
                <Text style={styles.loungeUserName} numberOfLines={1}>{user.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <KeyboardAvoidingView style={styles.chatArea} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        {loading ? <View style={styles.loaderContainer}><ActivityIndicator size="large" color="#2563eb" /></View> : (
         <FlatList
            ref={flatListRef} 
            data={messages} 
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.flatListContent} 
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <ChatBubble 
                message={item} 
                isMe={item.senderId === auth.currentUser?.uid} 
                groupId={id} 
                onOpenTest={startTest} 
                openDashboard={openDashboard}
              />
            )}
          />
        )}

        <View style={styles.todoTrayContainer}>
          <TouchableOpacity style={styles.todoTab} onPress={() => setIsTodoExpanded(!isTodoExpanded)} activeOpacity={0.8}>
            <Ionicons name="list-circle" size={20} color="#d97706" style={{marginRight: 6}} />
            <Text style={styles.todoTabText}>Daily Targets ({todos.length})</Text>
            <Ionicons name={isTodoExpanded ? "chevron-down" : "chevron-up"} size={18} color="#92400e" style={{marginLeft: 'auto'}} />
          </TouchableOpacity>
          <Animated.View style={[styles.todoContent, animatedTodoStyle]}>
            {isLeader ? (
              <View style={styles.addTodoRow}>
                <TextInput style={styles.todoInput} placeholder="Assign new target..." value={newTodoText} onChangeText={setNewTodoText} />
                <TouchableOpacity style={styles.addTodoBtn} onPress={handleAddTodo}><Ionicons name="add" size={20} color="#fff" /></TouchableOpacity>
              </View>
            ) : null}
            <FlatList 
              data={todos} keyExtractor={i => i.id} showsVerticalScrollIndicator={true} nestedScrollEnabled={true}
              renderItem={({item}) => {
                const isChecked = item.completedBy.includes(auth.currentUser?.uid);
                return (
                  <View style={styles.todoItem}>
                    <TouchableOpacity style={styles.todoRow} onPress={() => toggleTodo(item.id, item.completedBy)}>
                      <Ionicons name={isChecked ? "checkbox" : "square-outline"} size={22} color={isChecked ? "#10b981" : "#94a3b8"} /><Text style={[styles.todoText, isChecked && styles.todoTextDone]}>{item.task}</Text>
                    </TouchableOpacity>
                    <View style={styles.todoMeta}><Text style={styles.todoMetaText}>{item.completedBy.length} Check(s)</Text></View>
                  </View>
                )
              }}
            />
          </Animated.View>
        </View>

        {isMuted ? (
          <View style={[styles.inputContainer, { justifyContent: 'center', paddingVertical: 20, backgroundColor: '#fef2f2' }]}><Ionicons name="volume-mute" size={20} color="#ef4444" style={{ marginRight: 8 }} /><Text style={{ color: '#ef4444', fontWeight: '700' }}>A Leader has disabled your chat.</Text></View>
        ) : (
          <View style={styles.inputContainer}>
            <TouchableOpacity style={{ marginRight: 10, padding: 5 }} onPress={() => setShowActionMenu(true)}><Ionicons name="add-circle" size={28} color="#94a3b8" /></TouchableOpacity>
            <TextInput style={styles.textInput} placeholder="Message..." placeholderTextColor="#94a3b8" value={inputText} onChangeText={setInputText} multiline />
            <Animated.View style={sendBtnAnimatedStyle}>
              <TouchableOpacity style={[styles.sendButton, inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive]} onPress={sendMessage} disabled={!inputText.trim()}>
                <Ionicons name="send" size={20} color={inputText.trim() ? "#fff" : "#94a3b8"} style={{ marginLeft: 3 }} />
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      </KeyboardAvoidingView>

      <Modal visible={showActionMenu} transparent animationType="fade">
        <TouchableOpacity style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'}} onPress={() => setShowActionMenu(false)}>
          <View style={{ backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 20 }}>Choose Attachment</Text>
            <TouchableOpacity style={styles.actionMenuBtn} onPress={() => { setShowActionMenu(false); setShowQuestionModal(true); }}>
              <View style={[styles.actionMenuIcon, { backgroundColor: '#dbeafe' }]}><Ionicons name="stats-chart" size={24} color="#2563eb" /></View>
              <View><Text style={styles.actionMenuTitle}>Poll / Question</Text><Text style={styles.actionMenuSub}>Ask an MCQ or subjective doubt</Text></View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionMenuBtn} onPress={() => { setShowActionMenu(false); setShowTestCreator(true); }}>
              <View style={[styles.actionMenuIcon, { backgroundColor: '#e0e7ff' }]}><Ionicons name="timer" size={24} color="#4f46e5" /></View>
              <View><Text style={styles.actionMenuTitle}>Live Test</Text><Text style={styles.actionMenuSub}>Create a timed test with auto-submit</Text></View>
            </TouchableOpacity>
           <TouchableOpacity style={styles.actionMenuBtn} onPress={() => { setShowActionMenu(false); setBucketModalVisible(true); }}>
              <View style={[styles.actionMenuIcon, { backgroundColor: '#fce7f3' }]}><Ionicons name="folder-open" size={24} color="#db2777" /></View>
              <View><Text style={styles.actionMenuTitle}>Homework Bucket</Text><Text style={styles.actionMenuSub}>Create a folder for assignment uploads</Text></View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={bucketModalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1, backgroundColor: '#f8fafc'}}>
          <View style={{padding: 20}}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#0f172a', marginBottom: 10, marginTop: 20 }}>Create Homework Bucket</Text>
            <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>Students will securely upload their assignment pages here.</Text>
            <TextInput style={[styles.todoInput, { height: 50, fontSize: 16, marginBottom: 20 }]} placeholder="e.g. Chapter 4 Numericals" value={bucketTitle} onChangeText={setBucketTitle} />
            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#2563eb' }]} onPress={createHomeworkBucket}><Text style={styles.submitBtnText}>Create Bucket 🪣</Text></TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={() => setBucketModalVisible(false)}><Text style={{ color: '#64748b', fontWeight: '700' }}>Cancel</Text></TouchableOpacity>
          </View>
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
            <Text style={{fontWeight: '700', marginBottom: 8, color: '#1e293b'}}>Type your question:</Text>
            <TextInput style={[styles.todoInput, {height: 80, textAlignVertical: 'top', marginBottom: 20}]} placeholder="e.g. Find the torque..." multiline value={qText} onChangeText={setQText} />
            {qType === 'mcq' ? (
              <View>
                {mcqOptions.map((opt, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <TouchableOpacity onPress={() => setCorrectOptionIdx(idx)} style={{marginRight: 10}}><Ionicons name={correctOptionIdx === idx ? "radio-button-on" : "radio-button-off"} size={24} color={correctOptionIdx === idx ? "#10b981" : "#94a3b8"} /></TouchableOpacity>
                    <TextInput style={styles.todoInput} placeholder={`Option ${idx + 1}`} value={opt} onChangeText={(text) => { const newOpts = [...mcqOptions]; newOpts[idx] = text; setMcqOptions(newOpts); }} />
                  </View>
                ))}
              </View>
            ) : null}
            <TouchableOpacity style={[styles.submitBtn, {marginTop: 20, marginBottom: 50}]} onPress={handleSendQuestion}><Text style={styles.submitBtnText}>Send to Group</Text></TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showTestCreator} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1, backgroundColor: '#f8fafc'}}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Live Test</Text>
            <TouchableOpacity onPress={() => setShowTestCreator(false)}><Ionicons name="close-circle" size={30} color="#94a3b8" /></TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 20 }}>
            <TextInput style={[styles.todoInput, {marginBottom: 10, height: 50, fontSize: 16, fontWeight: 'bold'}]} placeholder="Test Title (e.g. Weekly Physics Quiz)" value={testTitle} onChangeText={setTestTitle} />
            <TextInput style={[styles.todoInput, {marginBottom: 20, height: 50}]} placeholder="Duration in Minutes (e.g. 15)" keyboardType="numeric" value={testDuration} onChangeText={setTestDuration} />
            {testQuestions.map((q, qIndex) => (
              <View key={qIndex} style={{ backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 1 }}>
                <Text style={{ fontWeight: '800', marginBottom: 10, color: '#4f46e5' }}>Question {qIndex + 1}</Text>
                <TextInput style={[styles.todoInput, {marginBottom: 10}]} placeholder="Type question here..." value={q.q} onChangeText={(t) => { const newQ = [...testQuestions]; newQ[qIndex].q = t; setTestQuestions(newQ); }} />
                {q.options.map((opt, oIndex) => (
                  <View key={oIndex} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <TouchableOpacity onPress={() => { const newQ = [...testQuestions]; newQ[qIndex].correct = oIndex; setTestQuestions(newQ); }} style={{marginRight: 10}}><Ionicons name={q.correct === oIndex ? "radio-button-on" : "radio-button-off"} size={22} color={q.correct === oIndex ? "#10b981" : "#94a3b8"} /></TouchableOpacity>
                    <TextInput style={[styles.todoInput, {flex: 1}]} placeholder={`Option ${oIndex + 1}`} value={opt} onChangeText={(t) => { const newQ = [...testQuestions]; newQ[qIndex].options[oIndex] = t; setTestQuestions(newQ); }} />
                  </View>
                ))}
              </View>
            ))}
            <TouchableOpacity style={{ backgroundColor: '#e0e7ff', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 20 }} onPress={addTestQuestion}><Text style={{ color: '#4f46e5', fontWeight: 'bold' }}>+ Add Another Question</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#4f46e5', marginBottom: 50 }]} onPress={handleSendTest}><Text style={styles.submitBtnText}>Launch Test Now 🚀</Text></TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={activeTest !== null} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#1e293b' }}>{activeTest?.title}</Text>
            <View style={{ backgroundColor: '#fee2e2', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center' }}><Ionicons name="timer" size={18} color="#ef4444" style={{ marginRight: 5 }} /><Text style={{ color: '#ef4444', fontWeight: '900', fontSize: 16 }}>{Math.floor(timeLeft / 60)}:{('0' + (timeLeft % 60)).slice(-2)}</Text></View>
          </View>
          <ScrollView style={{ padding: 20 }}>
            {activeTest?.questions.map((q: any, qIndex: number) => (
              <View key={qIndex} style={{ backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 20, elevation: 2 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 15 }}>{qIndex + 1}. {q.q}</Text>
                {q.options.map((opt: string, oIndex: number) => (
                  <TouchableOpacity key={oIndex} style={[styles.mcqOption, testAnswers[qIndex] === oIndex && styles.mcqSelected]} onPress={() => { const newAns = [...testAnswers]; newAns[qIndex] = oIndex; setTestAnswers(newAns); }}><Text style={styles.mcqOptionText}>{opt}</Text></TouchableOpacity>
                ))}
              </View>
            ))}
            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#10b981', marginBottom: 50 }]} onPress={submitTest}><Text style={styles.submitBtnText}>Submit Test ✅</Text></TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

{/* 📊 THE NEXT-GEN ANALYTICS DASHBOARD MODAL */}
      <Modal visible={dashboardVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
          
          {/* 🔝 HEADER */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', elevation: 2, zIndex: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#0f172a' }}>{activeDashboardMessage?.title}</Text>
              <Text style={{ fontSize: 13, color: '#ef4444', marginTop: 2, fontWeight: '700' }}>
                <Ionicons name="time-outline" size={14} /> Images auto-delete in 24 hrs
              </Text>
            </View>
            <TouchableOpacity onPress={() => setDashboardVisible(false)} style={{ padding: 8, backgroundColor: '#f1f5f9', borderRadius: 20 }}>
              <Ionicons name="close" size={24} color="#0f172a" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            
            {/* 📈 ANALYTICS ENGINE */}
            {(() => {
              const submissions = activeDashboardMessage?.submissions || {};
              // Assuming groupInfo.members is an array of user IDs. If not, we fallback to total submissions + 5 (dummy data for view)
              const totalMembersInGroup = groupInfo?.members?.length || Object.keys(submissions).length + 5; 
              const submittedCount = Object.keys(submissions).length;
              const pendingCount = totalMembersInGroup - submittedCount;
              const submittedPercent = Math.round((submittedCount / totalMembersInGroup) * 100) || 0;
              const pendingPercent = 100 - submittedPercent;

              // Page wise analytics
              let pageAnalytics: any = {};
              Object.values(submissions).forEach((sub: any) => {
                const p = sub.pages.length;
                pageAnalytics[p] = (pageAnalytics[p] || 0) + 1;
              });

              // Combine all members (Submitters + Non-submitters)
              // Note: If actual member details aren't stored, we show UIDs for non-submitters
              const allMembersList = groupInfo?.members?.map((uid: string) => {
                const sub = submissions[uid];
                return { uid, name: sub ? sub.name : 'Unknown Student', hasSubmitted: !!sub, data: sub };
              }) || Object.entries(submissions).map(([uid, data]: any) => ({ uid, name: data.name, hasSubmitted: true, data }));

              return (
                <View style={{ padding: 15 }}>
                  
                  {/* 📊 TOP STATS CARDS */}
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
                    <View style={{ flex: 1, backgroundColor: '#fff', padding: 15, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' }}>
                      <Text style={{ fontSize: 28, fontWeight: '900', color: '#10b981' }}>{submittedPercent}%</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b' }}>Completed</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: '#fff', padding: 15, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' }}>
                      <Text style={{ fontSize: 28, fontWeight: '900', color: '#ef4444' }}>{pendingPercent}%</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b' }}>Pending</Text>
                    </View>
                  </View>

                  {/* 📄 PAGE WISE ANALYTICS */}
                  {submittedCount > 0 && (
                    <View style={{ backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#1e293b', marginBottom: 10 }}>Page Upload Distribution</Text>
                      {Object.entries(pageAnalytics).map(([pages, count]: any) => (
                        <View key={pages} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                          <Text style={{ width: 60, fontSize: 13, color: '#64748b', fontWeight: '700' }}>{pages} Pages:</Text>
                          <View style={{ flex: 1, height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginHorizontal: 10 }}>
                            <View style={{ width: `${(count / submittedCount) * 100}%`, height: '100%', backgroundColor: '#3b82f6' }} />
                          </View>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: '#1e293b' }}>{Math.round((count / submittedCount) * 100)}%</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* 👥 STUDENT LIST SECTION */}
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#0f172a', marginBottom: 10, marginLeft: 5 }}>Student Roster</Text>

                  {allMembersList.map((member: any, index: number) => (
                    <View key={member.uid} style={{ backgroundColor: '#fff', borderRadius: 16, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' }}>
                      
                      {/* Accordion Header */}
                      <TouchableOpacity 
                        style={{ flexDirection: 'row', alignItems: 'center', padding: 15 }} 
                        activeOpacity={0.7}
                        onPress={() => member.hasSubmitted && setExpandedUser(expandedUser === member.uid ? null : member.uid)}
                      >
                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: member.hasSubmitted ? '#dcfce7' : '#fee2e2', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                          <Text style={{ fontSize: 14, fontWeight: '900', color: member.hasSubmitted ? '#16a34a' : '#ef4444' }}>{index + 1}</Text>
                        </View>
                        
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 16, fontWeight: '800', color: '#1e293b' }}>{member.name}</Text>
                          {member.hasSubmitted ? (
                            <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{member.data.pages.length} Pages • {new Date(member.data.submittedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                          ) : (
                            <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>No submission yet</Text>
                          )}
                        </View>

                        {/* Badges */}
                        <View style={{ backgroundColor: member.hasSubmitted ? '#10b981' : '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 10 }}>
                          <Text style={{ color: member.hasSubmitted ? '#fff' : '#94a3b8', fontWeight: '800', fontSize: 10 }}>
                            {member.hasSubmitted ? 'COMPLETED' : 'NOT DONE'}
                          </Text>
                        </View>

                        {/* Arrow */}
                        {member.hasSubmitted && (
                          <Ionicons name={expandedUser === member.uid ? "chevron-up" : "chevron-down"} size={20} color="#64748b" />
                        )}
                      </TouchableOpacity>

                      {/* Accordion Content (Images) */}
                      {expandedUser === member.uid && member.hasSubmitted && (
                        <View style={{ backgroundColor: '#f8fafc', padding: 15, borderTopWidth: 1, borderColor: '#f1f5f9' }}>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                            {member.data.pages.map((imgUrl: string, imgIndex: number) => {
                                // ⏳ Expiry Check (Frontend Fallback)
                                const isExpired = (Date.now() - new Date(member.data.submittedAt).getTime()) > 86400000;
                                
                                return (
                                  <TouchableOpacity 
                                    key={imgIndex} 
                                    style={{ marginRight: 12 }} 
                                    activeOpacity={0.8} 
                                    onPress={() => !isExpired && setViewerImage(imgUrl)} // 👈 ZOOM CLICK
                                  >
                                    {isExpired ? (
                                      <View style={{ width: 100, height: 140, borderRadius: 10, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1' }}>
                                        <Ionicons name="time" size={24} color="#94a3b8" />
                                        <Text style={{ fontSize: 10, color: '#64748b', fontWeight: 'bold', marginTop: 5 }}>EXPIRED</Text>
                                      </View>
                                    ) : (
                                      <>
                                        <Image source={{ uri: imgUrl }} style={{ width: 100, height: 140, borderRadius: 10, backgroundColor: '#e2e8f0', borderWidth: 1, borderColor: '#cbd5e1' }} resizeMode="cover" />
                                        <View style={{ position: 'absolute', bottom: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                                          <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>P {imgIndex + 1}</Text>
                                        </View>
                                      </>
                                    )}
                                  </TouchableOpacity>
                                );
                            })}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  ))}
                  <View style={{ height: 40 }} />
                </View>
              );
            })()}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 🔍 FULL SCREEN ZOOM MODAL */}
      <Modal visible={!!viewerImage} transparent={true} animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity style={{ position: 'absolute', top: 50, right: 20, zIndex: 100, padding: 10 }} onPress={() => setViewerImage(null)}>
            <Ionicons name="close-circle" size={36} color="#fff" />
          </TouchableOpacity>
          {viewerImage && (
            <Image source={{ uri: viewerImage }} style={{ width: '100%', height: '80%' }} resizeMode="contain" />
          )}
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ==========================================
// 🎨 STYLES (No styles removed)
// ==========================================
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
  flatListContent: { padding: 15, paddingBottom: 20 },
  messageWrapper: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 15 },
  messageWrapperMe: { justifyContent: 'flex-end' },
  messageWrapperOther: { justifyContent: 'flex-start' },
  senderAvatar: { width: 30, height: 30, borderRadius: 15, marginRight: 8, marginBottom: 2 },
  bubble: { maxWidth: '80%', padding: 12, elevation: 1 },
  bubbleMe: { backgroundColor: '#2563eb', borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomLeftRadius: 18, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#ffffff', borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomRightRadius: 18, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  senderName: { fontSize: 12, fontWeight: '700', color: '#3b82f6', marginBottom: 4, marginLeft: 2 },
  messageText: { fontSize: 15, lineHeight: 22 },
  messageTextMe: { color: '#ffffff' },
  messageTextOther: { color: '#1e293b' },
  timeText: { fontSize: 10, marginTop: 5, alignSelf: 'flex-end' },
  timeTextMe: { color: '#bfdbfe' },
  timeTextOther: { color: '#94a3b8' },
  todoTrayContainer: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', borderTopLeftRadius: 20, borderTopRightRadius: 20, shadowColor: '#000', shadowOffset: {width: 0, height: -3}, shadowOpacity: 0.05, shadowRadius: 5, elevation: 10 },
  todoTab: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', paddingVertical: 10, paddingHorizontal: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  todoTabText: { fontSize: 14, fontWeight: '700', color: '#92400e' },
  todoContent: { backgroundColor: '#fff', paddingHorizontal: 15 },
  addTodoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 10 },
  todoInput: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 12, height: 40, fontSize: 14 },
  addTodoBtn: { backgroundColor: '#2563eb', width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  todoItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  todoRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  todoText: { fontSize: 15, color: '#1e293b', marginLeft: 10, flex: 1, fontWeight: '500' },
  todoTextDone: { color: '#94a3b8', textDecorationLine: 'line-through' },
  todoMeta: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 10 },
  todoMetaText: { fontSize: 10, color: '#3b82f6', fontWeight: 'bold' },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, paddingBottom: Platform.OS === 'ios' ? 30 : 15, backgroundColor: '#ffffff' },
  textInput: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 24, paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 12 : 8, marginRight: 10, maxHeight: 120, fontSize: 16 },
  sendButton: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  sendButtonActive: { backgroundColor: '#2563eb' },
  sendButtonInactive: { backgroundColor: '#e2e8f0' },
  mcqResultOption: { position: 'relative', backgroundColor: '#ffffff', borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  mcqCorrectBorder: { borderColor: '#10b981', borderWidth: 1.5 },
  mcqWrongBorder: { borderColor: '#ef4444', borderWidth: 1.5 },
  mcqResultFill: { position: 'absolute', top: 0, bottom: 0, left: 0 }, 
  mcqResultContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  mcqStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)' },
  mcqStatText: { fontSize: 11, fontWeight: '800', color: '#475569' },
  questionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.2)', paddingBottom: 6 },
  questionLabel: { fontSize: 12, fontWeight: '800', marginLeft: 6 },
  mcqOption: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  mcqOptionText: { fontSize: 14, color: '#334155', fontWeight: '600', flex: 1 },
  mcqSelected: { backgroundColor: '#dbeafe', borderColor: '#3b82f6' },
  mcqCorrect: { backgroundColor: '#d1fae5', borderColor: '#10b981' },
  mcqWrong: { backgroundColor: '#fee2e2', borderColor: '#ef4444' },
  subjectiveInput: { backgroundColor: '#f1f5f9', borderRadius: 12, padding: 12, minHeight: 60, fontSize: 14, color: '#1e293b', marginBottom: 10, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  submitBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  submittedBox: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 12 },
  submittedTitle: { fontSize: 12, color: '#64748b', fontWeight: '700', marginBottom: 4 },
  submittedText: { fontSize: 14, color: '#1e293b', fontWeight: '500' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  typeBtn: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#f1f5f9', marginHorizontal: 5, borderRadius: 12 },
  typeBtnActive: { backgroundColor: '#2563eb' },
  typeBtnText: { fontWeight: '700', color: '#64748b' },
  actionMenuBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 }, 
  actionMenuIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 }, 
  actionMenuTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' }, 
  actionMenuSub: { fontSize: 13, color: '#64748b' },
  loungeContainer: { backgroundColor: '#f0fdf4', borderBottomWidth: 1, borderBottomColor: '#d1fae5', paddingVertical: 10, elevation: 2 },
  loungeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, marginBottom: 10 },
  loungeTitle: { fontSize: 13, fontWeight: '800', color: '#065f46', marginLeft: 6 },
  joinLoungeBtn: { backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 14 },
  joinLoungeText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  leaveLoungeBtn: { backgroundColor: '#ef4444', width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  micBtn: { backgroundColor: '#e2e8f0', width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  loungeAvatars: { paddingHorizontal: 15 },
  loungeUser: { alignItems: 'center', marginRight: 15, width: 50 },
  loungeAvatarWrapper: { position: 'relative', marginBottom: 4 },
  speakingRing: { borderWidth: 2, borderColor: '#10b981', borderRadius: 24, padding: 2 }, 
  loungeAvatar: { width: 40, height: 40, borderRadius: 20 },
  mutedBadge: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#ef4444', borderRadius: 10, padding: 2, borderWidth: 2, borderColor: '#f0fdf4' },
  loungeUserName: { fontSize: 11, fontWeight: '700', color: '#0f172a', textAlign: 'center' },
});