import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  TextInput, Image, ActivityIndicator, Platform, KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp, Layout, useSharedValue, useAnimatedStyle, withSpring, SlideInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

// Firebase & Gamification
import { auth, db } from '../../firebaseConfig';
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion, arrayRemove, addDoc, serverTimestamp, increment, onSnapshot, orderBy } from 'firebase/firestore';
import { useUserStore } from '../../store/useUserStore';
import { useRewardStore } from '../../store/useRewardStore';

// ==========================================
// 🧠 ADVANCE RECOMMENDATION ALGORITHM
// ==========================================
const calculateDoubtScore = (doubt: any, userInterests: string[]) => {
  let score = 0;
  const now = Date.now();
  const createdAt = doubt.createdAt?.toMillis() || now;
  const hoursOld = (now - createdAt) / (1000 * 60 * 60);

  score += (doubt.boosts?.length || 0) * 3;
  score += (doubt.answersCount || 0) * 5;

  if (hoursOld <= 2) score += 20;
  else if (hoursOld <= 6) score += 10;
  else if (hoursOld <= 24) score += 5;

  if (userInterests && userInterests.length > 0) {
    const doubtTags = doubt.tags || [];
    const doubtSubject = doubt.subject ? [doubt.subject] : [];
    const allDoubtKeywords = [...doubtTags, ...doubtSubject].map(k => k.toLowerCase());
    
    const matchCount = userInterests.filter(interest => allDoubtKeywords.includes(interest.toLowerCase())).length;
    score += (matchCount * 25); 
  }

  if (!doubt.isSolved) score += 15; 
  return score;
};

// ==========================================
// 🎛️ BOOST BUTTON COMPONENT
// ==========================================
const BoostButton = ({ isBoosted, onPress, count }: any) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(1.4, { damping: 5, stiffness: 200 }, () => { scale.value = withSpring(1); });
    onPress();
  };

  return (
    <View style={styles.boostContainer}>
      <TouchableOpacity activeOpacity={0.8} onPress={handlePress}>
        <Animated.View style={[styles.boostIconWrapper, animatedStyle, isBoosted && styles.boostedBg]}>
          <Ionicons name="flash" size={22} color={isBoosted ? "#fff" : "#94a3b8"} />
        </Animated.View>
      </TouchableOpacity>
      <Text style={[styles.boostCount, isBoosted && styles.boostedText]}>{count}</Text>
    </View>
  );
};

// ==========================================
// 🌟 MAIN FEED SCREEN
// ==========================================
export default function DoubtHubScreen() {
  const router = useRouter();
  const currentUser = auth.currentUser;
  const userData = useUserStore((state) => state.userData);
  const showReward = useRewardStore((state) => state.showReward);

  const [doubts, setDoubts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 🔥 ADVANCED INLINE THREAD STATES
  const [expandedDoubtId, setExpandedDoubtId] = useState<string | null>(null);
  const [inlineComments, setInlineComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  // 📡 FETCH DOUBTS
  const fetchDoubts = async () => {
    try {
      const doubtsRef = collection(db, 'posts');
      const q = query(doubtsRef, where('type', '==', 'doubt')); 
      const snapshot = await getDocs(q);
      
      let fetchedDoubts: any[] = [];
      snapshot.forEach(doc => {
        fetchedDoubts.push({ id: doc.id, ...doc.data() });
      });

      fetchedDoubts = fetchedDoubts.map(d => ({
        ...d,
        boosts: d.boosts || [],
        answersCount: d.answersCount || 0,
        isSolved: d.isSolved || false
      }));

      setDoubts(fetchedDoubts);
    } catch (error) {
      console.log("Error fetching doubts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchDoubts(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchDoubts(); };

  // 📡 FETCH LIVE INLINE COMMENTS WALA LOGIC (WhatsApp / Reddit Jaisa)
  useEffect(() => {
    if (!expandedDoubtId) {
      setInlineComments([]);
      return;
    }
    setLoadingComments(true);
    const commentsRef = collection(db, 'posts', expandedDoubtId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc')); // Purane comments upar, naye niche
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInlineComments(comments);
      setLoadingComments(false);
    });

    return () => unsubscribe();
  }, [expandedDoubtId]);

  // 🧠 APPLY ALGORITHM
  const processedFeed = useMemo(() => {
    let filtered = [...doubts];
    if (searchQuery) {
      filtered = filtered.filter(d => 
        d.text?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        d.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    const userInterests = userData?.interests || [];
    filtered.sort((a, b) => calculateDoubtScore(b, userInterests) - calculateDoubtScore(a, userInterests));
    return filtered;
  }, [doubts, searchQuery, userData]);

  const handleBoost = async (doubtId: string, currentBoosts: string[]) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const isBoosted = currentBoosts.includes(uid);
    
    setDoubts(prev => prev.map(d => {
      if (d.id === doubtId) return { ...d, boosts: isBoosted ? d.boosts.filter((id:string) => id !== uid) : [...d.boosts, uid] };
      return d;
    }));

    try {
      const doubtRef = doc(db, 'posts', doubtId);
      if (isBoosted) await updateDoc(doubtRef, { boosts: arrayRemove(uid) }); 
      else await updateDoc(doubtRef, { boosts: arrayUnion(uid) });
    } catch (error) { fetchDoubts(); }
  };

  // 🔥 FIX: MULTIPLE ANSWERS SHOW HONGE AUR BOX BAND NAHI HOGA
  const handlePostAnswer = async (item: any) => {
    if (!answerText.trim() || !currentUser) return;
    
    setSubmittingAnswer(true);
    try {
      // 1. Answer subcollection me add kiya
      await addDoc(collection(db, 'posts', item.id, 'comments'), {
        text: answerText.trim(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Scholar',
        authorAvatar: currentUser.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
        createdAt: serverTimestamp(),
        boosts: []
      });

      const doubtRef = doc(db, 'posts', item.id);
      const newAnswersCount = (item.answersCount || 0) + 1;
      const updateObj: any = { answersCount: newAnswersCount };
      
      let newTopAnswer = item.topAnswer;
      
      // Agar pehla answer hai, toh automatically top answer set kar do feed ke liye
      if (!item.topAnswer || item.answersCount === 0) {
        newTopAnswer = {
           text: answerText.trim(),
           authorName: currentUser.displayName || 'Scholar'
        };
        updateObj.topAnswer = newTopAnswer;
      }

      await updateDoc(doubtRef, updateObj);

      // Optimistic Update
      setDoubts(prev => prev.map(d => {
        if (d.id === item.id) return { ...d, answersCount: newAnswersCount, topAnswer: newTopAnswer };
        return d;
      }));

      try {
        const reward = await processAction(currentUser.uid, 'ANSWER_DOUBT') || await processAction(currentUser.uid, 'CREATE_POST');
        if (reward && reward.success) showReward({ xpEarned: reward.xpEarned, coinsEarned: reward.coinsEarned, leveledUp: reward.leveledUp, newLevel: reward.newLevel, newBadges: reward.newBadges });
      } catch (err) {}

      // 🔥 FIX: Sirf text clear karo, Box ko open rehne do taaki aur answers likh sake!
      setAnswerText(''); 
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    } catch (error) {
      alert("Failed to post your answer. Please try again.");
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const seconds = Math.floor((Date.now() - timestamp.toMillis()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const renderDoubtCard = ({ item, index }: any) => {
    const isBoosted = currentUser ? item.boosts?.includes(currentUser.uid) : false;
    const isExpanded = expandedDoubtId === item.id;

    return (
      <Animated.View entering={FadeInUp.delay(index * 100).springify()} layout={Layout.springify()} style={styles.card}>
        
        <View style={styles.leftActionBar}>
          <BoostButton isBoosted={isBoosted} count={item.boosts?.length || 0} onPress={() => handleBoost(item.id, item.boosts || [])} />
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.authorInfo}>
              <Image source={{ uri: item.authorAvatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} style={styles.avatar} />
              <View>
                <Text style={styles.authorName}>{item.authorName}</Text>
                <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
              </View>
            </View>
            {item.isSolved ? (
              <View style={styles.solvedBadge}><Ionicons name="checkmark-circle" size={12} color="#10b981" /><Text style={styles.solvedText}>Solved</Text></View>
            ) : (
              <View style={styles.unsolvedBadge}><Ionicons name="help-circle" size={12} color="#f59e0b" /><Text style={styles.unsolvedText}>Open</Text></View>
            )}
          </View>

          <TouchableOpacity activeOpacity={0.8} onPress={() => router.push(`/post/${item.id}`)}>
            {item.title ? <Text style={styles.questionTitle} numberOfLines={2}>{item.title}</Text> : null}
            <Text style={styles.questionText} numberOfLines={3}>{item.text}</Text>
            {item.imageUrl && (
              <View style={styles.imagePreviewWrapper}>
                <Image source={{ uri: item.imageUrl }} style={styles.imagePreview} />
              </View>
            )}
          </TouchableOpacity>

          {/* 🔥 ALWAYS VISIBLE TOP ANSWER BINA CLICK KIYE 🔥 */}
          {item.topAnswer ? (
            <View style={styles.topAnswerBox}>
              <View style={styles.topAnswerHeader}>
                <Ionicons name="sparkles" size={14} color="#059669" />
                <Text style={styles.topAnswerLabel}>Top Answer by {item.topAnswer.authorName}</Text>
              </View>
              <Text style={styles.topAnswerText} numberOfLines={3}>{item.topAnswer.text}</Text>
            </View>
          ) : (
            <View style={styles.noAnswerBox}>
              <Text style={styles.noAnswerText}>No answers yet. Be the first to solve this!</Text>
            </View>
          )}

          <View style={styles.cardFooter}>
            <View style={styles.tagsRow}>
              {item.subject && <View style={styles.subjectPillDark}><Text style={styles.subjectTextDark}>{item.subject}</Text></View>}
            </View>

            {/* EXPAND/COLLAPSE THREAD BUTTON */}
            <TouchableOpacity 
              style={styles.answerBtn} 
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                setExpandedDoubtId(isExpanded ? null : item.id);
                if (!isExpanded) setAnswerText('');
              }}
            >
              <Ionicons name={isExpanded ? "chevron-up" : "chatbubbles-outline"} size={16} color="#fff" />
              <Text style={styles.answerCountText}>
                {isExpanded ? 'Hide Thread' : `${item.answersCount || 0} Answers`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 🔥 LIVE INLINE THREAD WITH ALL ANSWERS 🔥 */}
          {isExpanded && (
            <Animated.View entering={SlideInDown.springify()} style={styles.inlineReplyContainer}>
              
              {/* Show All Comments Loop */}
              <View style={styles.commentsThreadBox}>
                {loadingComments ? (
                  <ActivityIndicator size="small" color="#4f46e5" style={{marginVertical: 10}} />
                ) : (
                  inlineComments.map((comment: any) => (
                    <View key={comment.id} style={styles.commentItem}>
                      <Image source={{ uri: comment.authorAvatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} style={styles.commentAvatar} />
                      <View style={styles.commentBubble}>
                        <Text style={styles.commentAuthorName}>{comment.authorName}</Text>
                        <Text style={styles.commentContentText}>{comment.text}</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>

              {/* Reply Input Box */}
              <View style={styles.replyInputWrapper}>
                <TextInput
                  style={styles.inlineTextInput}
                  placeholder="Type your solution here..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  value={answerText}
                  onChangeText={setAnswerText}
                />
              </View>
              <View style={styles.replyActions}>
                <View style={{flex: 1}}/>
                <TouchableOpacity 
                  style={[styles.submitReplyBtn, !answerText.trim() && { opacity: 0.5 }]} 
                  disabled={submittingAnswer || !answerText.trim()}
                  onPress={() => handlePostAnswer(item)} 
                >
                  {submittingAnswer ? <ActivityIndicator size="small" color="#fff" /> : (
                    <>
                      <Text style={styles.submitReplyText}>Send</Text>
                      <Ionicons name="send" size={14} color="#fff" style={{marginLeft: 6}} />
                    </>
                  )}
                </TouchableOpacity>
              </View>

            </Animated.View>
          )}

        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        
        <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.headerGradient}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>DoubtHub</Text>
            <TouchableOpacity style={styles.iconBtn}>
               <Ionicons name="filter-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#94a3b8" />
            <TextInput 
              style={styles.searchInput} 
              placeholder="Search concepts, formulas..." 
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </LinearGradient>

        <View style={styles.algoBanner}>
          <Ionicons name="planet" size={16} color="#6366f1" />
          <Text style={styles.algoBannerText}>Feed personalized for you</Text>
        </View>

        {loading ? (
          <View style={styles.centerFlex}><ActivityIndicator size="large" color="#6366f1" /></View>
        ) : (
          <FlatList
            data={processedFeed}
            keyExtractor={(item) => item.id}
            renderItem={renderDoubtCard}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.feedContent}
            refreshing={refreshing}
            onRefresh={onRefresh}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="bulb-outline" size={80} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>Feed is empty</Text>
                <Text style={styles.emptySub}>Ask a doubt and let the community help you out!</Text>
              </View>
            }
          />
        )}
      </KeyboardAvoidingView>

      <TouchableOpacity style={styles.fabContainer} activeOpacity={0.9} onPress={() => router.push('/doubts/ask')}>
        <LinearGradient colors={['#ec4899', '#8b5cf6']} style={styles.fab} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.fabText}>Ask Doubt</Text>
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' }, 
  centerFlex: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  headerGradient: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 15, height: 50 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#0f172a', fontWeight: '500', outlineStyle: 'none' } as any,

  algoBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, backgroundColor: '#eef2ff', marginHorizontal: 20, marginTop: -15, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 4 },
  algoBannerText: { fontSize: 12, fontWeight: '800', color: '#4f46e5', marginLeft: 6, textTransform: 'uppercase' },

  feedContent: { padding: 15, paddingBottom: 120 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20, padding: 15, marginBottom: 15, shadowColor: '#cbd5e1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: '#e2e8f0' },
  
  leftActionBar: { width: 45, alignItems: 'center', marginRight: 10, paddingTop: 5 },
  boostContainer: { alignItems: 'center' },
  boostIconWrapper: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  boostedBg: { backgroundColor: '#6366f1' },
  boostCount: { fontSize: 14, fontWeight: '900', color: '#64748b', marginTop: 8 },
  boostedText: { color: '#6366f1' },

  cardContent: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  authorInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#e2e8f0', marginRight: 10 },
  authorName: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  timeText: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginTop: 2 },
  
  solvedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: '#a7f3d0' },
  solvedText: { fontSize: 9, fontWeight: '800', color: '#10b981', marginLeft: 4, textTransform: 'uppercase' },
  unsolvedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffbeb', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: '#fde68a' },
  unsolvedText: { fontSize: 9, fontWeight: '800', color: '#f59e0b', marginLeft: 4, textTransform: 'uppercase' },

  questionTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a', marginBottom: 6, lineHeight: 22 },
  questionText: { fontSize: 14, color: '#475569', lineHeight: 22, marginBottom: 12 },
  
  imagePreviewWrapper: { width: '100%', height: 160, borderRadius: 12, overflow: 'hidden', marginBottom: 12, backgroundColor: '#f1f5f9' },
  imagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },

  topAnswerBox: { backgroundColor: '#f0fdf4', padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#d1fae5', borderLeftWidth: 4, borderLeftColor: '#10b981' },
  topAnswerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  topAnswerLabel: { fontSize: 11, fontWeight: '800', color: '#059669', marginLeft: 4, textTransform: 'uppercase' },
  topAnswerText: { fontSize: 13, color: '#064e3b', lineHeight: 20, fontWeight: '500' },

  noAnswerBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed' },
  noAnswerText: { fontSize: 12, color: '#64748b', fontStyle: 'italic', textAlign: 'center', fontWeight: '500' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  tagsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, flexWrap: 'wrap' },
  subjectPillDark: { backgroundColor: '#e2e8f0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  subjectTextDark: { color: '#475569', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  
  answerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4f46e5', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  answerCountText: { fontSize: 12, fontWeight: '800', color: '#fff', marginLeft: 6 },

  // 🔥 NEW: LIVE COMMENTS THREAD STYLES
  inlineReplyContainer: { marginTop: 15, backgroundColor: '#f8fafc', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  
  commentsThreadBox: { maxHeight: 250, marginBottom: 10 },
  commentItem: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-start' },
  commentAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: 10, backgroundColor: '#e2e8f0' },
  commentBubble: { flex: 1, backgroundColor: '#e2e8f0', padding: 10, borderRadius: 12, borderTopLeftRadius: 4 },
  commentAuthorName: { fontSize: 12, fontWeight: '800', color: '#0f172a', marginBottom: 2 },
  commentContentText: { fontSize: 13, color: '#334155', lineHeight: 18 },

  replyInputWrapper: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1', padding: 10 },
  inlineTextInput: { minHeight: 60, fontSize: 14, color: '#0f172a', textAlignVertical: 'top', outlineStyle: 'none' } as any,
  replyActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  submitReplyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  submitReplyText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginTop: 20, marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22 },

  fabContainer: { position: 'absolute', bottom: Platform.OS === 'ios' ? 90 : 80, right: 20, shadowColor: '#ec4899', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 15, elevation: 10 },
  fab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderRadius: 30 },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '900', marginLeft: 8, letterSpacing: 0.5 }
});