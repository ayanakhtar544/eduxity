import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { auth, db } from '../../firebaseConfig';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, where } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';

const ANONYMOUS_ALIASES = ["Burnt out Aspirant", "Sleep Deprived Coder", "Overthinking Dropper", "Lost Backbencher", "Stressed Scholar", "Silent Warrior", "Caffeine Dependent", "Midnight Hustler", "Tired Brain"];
const TAGS = ["Burnout 😩", "Family Pressure 👨‍👩‍👦", "Loneliness 🚶‍♂️", "Backlogs 📚", "Anxiety 😰", "Just Venting 🤬"];

const timeAgo = (timestamp: any) => {
  if (!timestamp) return 'Just now';
  const seconds = Math.floor((Date.now() - timestamp.toMillis()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export default function VentWallScreen() {
  const router = useRouter();
  const currentUid = auth.currentUser?.uid || "guest";

  // 🧠 MAIN STATES
  const [rants, setRants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'new' | 'hot'>('new');
  
  // 📝 POST CREATION STATES
  const [isPostModalVisible, setPostModalVisible] = useState(false);
  const [newRant, setNewRant] = useState('');
  const [selectedTag, setSelectedTag] = useState(TAGS[0]);

  // 💬 THREAD (COMMENTS) STATES
  const [activePost, setActivePost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');

  // ==========================================
  // 📡 1. FETCH LIVE RANTS (FEED)
  // ==========================================
  useEffect(() => {
    // Basic query, we sort in memory for 'hot' to avoid complex Firestore indexing
    const q = query(collection(db, 'vent_posts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      let fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Compute Score (Upvotes - Downvotes)
      fetched = fetched.map(post => {
        const ups = post.upvotes?.length || 0;
        const downs = post.downvotes?.length || 0;
        return { ...post, score: ups - downs };
      });

      if (sortBy === 'hot') {
        fetched.sort((a, b) => b.score - a.score);
      }
      
      setRants(fetched);
      setLoading(false);
    });
    return () => unsub();
  }, [sortBy]);

  // ==========================================
  // 📡 2. FETCH COMMENTS FOR ACTIVE POST
  // ==========================================
  useEffect(() => {
    if (!activePost) return;
    const q = query(collection(db, 'vent_comments'), where('postId', '==', activePost.id), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [activePost]);

  // ==========================================
  // 🗣️ 3. CREATE NEW POST
  // ==========================================
  const handlePostRant = async () => {
    if (!newRant.trim() || !currentUid) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const randomAlias = ANONYMOUS_ALIASES[Math.floor(Math.random() * ANONYMOUS_ALIASES.length)];
    try {
      await addDoc(collection(db, 'vent_posts'), {
        authorAlias: randomAlias, text: newRant, tag: selectedTag,
        upvotes: [], downvotes: [], commentCount: 0, createdAt: serverTimestamp()
      });
      setNewRant(''); setPostModalVisible(false);
    } catch (error) { console.log(error); }
  };

  // ==========================================
  // 💬 4. ADD COMMENT TO THREAD
  // ==========================================
  const handlePostComment = async () => {
    if (!newComment.trim() || !activePost || !currentUid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const randomAlias = ANONYMOUS_ALIASES[Math.floor(Math.random() * ANONYMOUS_ALIASES.length)];
    try {
      await addDoc(collection(db, 'vent_comments'), {
        postId: activePost.id, authorAlias: randomAlias, text: newComment, createdAt: serverTimestamp()
      });
      // Increment comment count on main post
      await updateDoc(doc(db, 'vent_posts', activePost.id), { commentCount: (activePost.commentCount || 0) + 1 });
      setNewComment('');
    } catch (error) { console.log(error); }
  };

  // ==========================================
  // 🔼 5. UPVOTE / DOWNVOTE SYSTEM (KARMA)
  // ==========================================
  const handleVote = async (postId: string, type: 'up' | 'down', currentUps: string[], currentDowns: string[]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const postRef = doc(db, 'vent_posts', postId);
    const hasUpvoted = currentUps.includes(currentUid);
    const hasDownvoted = currentDowns.includes(currentUid);

    try {
      if (type === 'up') {
        if (hasUpvoted) await updateDoc(postRef, { upvotes: arrayRemove(currentUid) });
        else {
          await updateDoc(postRef, { upvotes: arrayUnion(currentUid) });
          if (hasDownvoted) await updateDoc(postRef, { downvotes: arrayRemove(currentUid) });
        }
      } else {
        if (hasDownvoted) await updateDoc(postRef, { downvotes: arrayRemove(currentUid) });
        else {
          await updateDoc(postRef, { downvotes: arrayUnion(currentUid) });
          if (hasUpvoted) await updateDoc(postRef, { upvotes: arrayRemove(currentUid) });
        }
      }
    } catch (error) { console.log(error); }
  };

  // ==========================================
  // 🃏 RENDER POST CARD
  // ==========================================
  const renderPost = ({ item, index }: any) => {
    const ups = item.upvotes || [];
    const downs = item.downvotes || [];
    const hasUpvoted = ups.includes(currentUid);
    const hasDownvoted = downs.includes(currentUid);
    const score = ups.length - downs.length;

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()} layout={Layout.springify()} style={styles.rantCard}>
        {/* Voting Sidebar */}
        <View style={styles.voteSidebar}>
          <TouchableOpacity onPress={() => handleVote(item.id, 'up', ups, downs)} style={styles.voteBtn}>
            <Ionicons name={hasUpvoted ? "caret-up" : "caret-up-outline"} size={26} color={hasUpvoted ? "#ef4444" : "#64748b"} />
          </TouchableOpacity>
          <Text style={[styles.scoreText, hasUpvoted && {color: '#ef4444'}, hasDownvoted && {color: '#3b82f6'}]}>{score}</Text>
          <TouchableOpacity onPress={() => handleVote(item.id, 'down', ups, downs)} style={styles.voteBtn}>
            <Ionicons name={hasDownvoted ? "caret-down" : "caret-down-outline"} size={26} color={hasDownvoted ? "#3b82f6" : "#64748b"} />
          </TouchableOpacity>
        </View>

        {/* Content Area */}
        <TouchableOpacity style={styles.rantContent} activeOpacity={0.7} onPress={() => setActivePost(item)}>
          <View style={styles.rantHeader}>
            <View style={styles.tagBadge}><Text style={styles.tagText}>{item.tag || 'Just Venting'}</Text></View>
            <Text style={styles.timeText}>{timeAgo(item.createdAt)}</Text>
          </View>
          <Text style={styles.authorAlias}>👤 {item.authorAlias}</Text>
          <Text style={styles.rantText} numberOfLines={4}>{item.text}</Text>
          
          <View style={styles.rantFooter}>
            <View style={styles.commentCountBadge}>
              <Ionicons name="chatbubble-outline" size={16} color="#94a3b8" />
              <Text style={styles.commentCountText}>{item.commentCount || 0} Replies</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#475569" />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* 🔝 MAIN HEADER */}
      <View style={styles.header}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={24} color="#fff" /></TouchableOpacity>
          <Text style={styles.headerTitle}>The Void</Text>
        </View>
        
        {/* Sort Toggle (Hot / New) */}
        <View style={styles.sortToggle}>
          <TouchableOpacity style={[styles.sortBtn, sortBy === 'new' && styles.sortBtnActive]} onPress={() => setSortBy('new')}>
            <Ionicons name="time" size={14} color={sortBy === 'new' ? '#fff' : '#64748b'} />
            <Text style={[styles.sortText, sortBy === 'new' && {color: '#fff'}]}>New</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sortBtn, sortBy === 'hot' && styles.sortBtnActive]} onPress={() => setSortBy('hot')}>
            <Ionicons name="flame" size={14} color={sortBy === 'hot' ? '#ef4444' : '#64748b'} />
            <Text style={[styles.sortText, sortBy === 'hot' && {color: '#fff'}]}>Hot</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 📜 FEED */}
      {loading ? <ActivityIndicator size="large" color="#ef4444" style={{marginTop: 50}}/> : (
        <FlatList
          data={rants}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
          renderItem={renderPost}
          ListEmptyComponent={<Text style={styles.emptyText}>The void is completely empty. Be the first to scream.</Text>}
        />
      )}

      {/* ➕ FLOATING ACTION BUTTON */}
      <TouchableOpacity style={styles.fab} onPress={() => setPostModalVisible(true)} activeOpacity={0.9}>
        <Ionicons name="create" size={24} color="#fff" />
        <Text style={styles.fabText}>Vent</Text>
      </TouchableOpacity>

      {/* ========================================== */}
      {/* 📝 NEW POST MODAL (FULL SCREEN) */}
      {/* ========================================== */}
      <Modal visible={isPostModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalDarkBg}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setPostModalVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Scream into the Void</Text>
            <TouchableOpacity onPress={handlePostRant} disabled={!newRant.trim()}>
              <Text style={[styles.postText, !newRant.trim() && {opacity: 0.4}]}>Post</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={{padding: 20}}>
            <Text style={styles.label}>Select a Flair</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 20}}>
              {TAGS.map(tag => (
                <TouchableOpacity key={tag} style={[styles.tagPill, selectedTag === tag && styles.tagPillActive]} onPress={() => setSelectedTag(tag)}>
                  <Text style={[styles.tagPillText, selectedTag === tag && {color: '#fff'}]}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput 
              style={styles.bigInput} placeholder="Nobody will know it's you. Write your heart out..." placeholderTextColor="#475569" multiline autoFocus
              value={newRant} onChangeText={setNewRant}
            />
            <Text style={styles.disclaimerText}>🔒 You will be assigned a random anonymous alias.</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ========================================== */}
      {/* 💬 THREAD (COMMENTS) MODAL */}
      {/* ========================================== */}
      <Modal visible={!!activePost} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.threadContainer}>
          <View style={styles.threadContent}>
            {/* Thread Header */}
            <View style={styles.threadHeader}>
              <Text style={styles.modalTitle}>Anonymous Thread</Text>
              <TouchableOpacity onPress={() => setActivePost(null)}><Ionicons name="close-circle" size={28} color="#64748b" /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Original Post Recap */}
              {activePost && (
                <View style={styles.originalPostRecap}>
                  <Text style={styles.authorAlias}>👤 {activePost.authorAlias}</Text>
                  <Text style={styles.rantText}>{activePost.text}</Text>
                </View>
              )}

              {/* Replies List */}
              <Text style={styles.replyHeaderLabel}>Replies</Text>
              {comments.length === 0 ? (
                <Text style={styles.emptyText}>No replies yet. Be the first to comfort them.</Text>
              ) : (
                comments.map((comment) => (
                  <View key={comment.id} style={styles.commentBox}>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                      <Text style={styles.commentAuthor}>👤 {comment.authorAlias}</Text>
                      <Text style={styles.timeText}>{timeAgo(comment.createdAt)}</Text>
                    </View>
                    <Text style={styles.commentText}>{comment.text}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Reply Input Area */}
            <View style={styles.replyInputArea}>
              <TextInput 
                style={styles.replyInput} placeholder="Write an anonymous reply..." placeholderTextColor="#64748b" multiline
                value={newComment} onChangeText={setNewComment}
              />
              <TouchableOpacity style={[styles.sendBtn, !newComment.trim() && {opacity: 0.5}]} onPress={handlePostComment} disabled={!newComment.trim()}>
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

// 🎨 STYLES
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: '#1e293b', backgroundColor: '#0f172a' },
  backBtn: { padding: 5, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, marginRight: 10 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  
  sortToggle: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 20, padding: 4 },
  sortBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  sortBtnActive: { backgroundColor: '#334155' },
  sortText: { color: '#64748b', fontSize: 12, fontWeight: '800', marginLeft: 4 },

  emptyText: { color: '#64748b', textAlign: 'center', marginTop: 40, fontSize: 14, fontWeight: '600' },

  // 🃏 Post Card Styles (Reddit Style)
  rantCard: { flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#1e293b', overflow: 'hidden' },
  voteSidebar: { width: 50, backgroundColor: '#020617', alignItems: 'center', paddingVertical: 10, borderRightWidth: 1, borderColor: '#1e293b' },
  voteBtn: { padding: 5 },
  scoreText: { color: '#f8fafc', fontSize: 14, fontWeight: '900', marginVertical: 5 },
  
  rantContent: { flex: 1, padding: 15 },
  rantHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tagBadge: { backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { color: '#ef4444', fontSize: 10, fontWeight: '800' },
  timeText: { color: '#475569', fontSize: 11, fontWeight: '600' },
  authorAlias: { color: '#94a3b8', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  rantText: { color: '#f8fafc', fontSize: 15, lineHeight: 22, fontWeight: '500', marginBottom: 15 },
  
  rantFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderColor: '#1e293b' },
  commentCountBadge: { flexDirection: 'row', alignItems: 'center' },
  commentCountText: { color: '#94a3b8', fontSize: 12, fontWeight: '800', marginLeft: 6 },

  // ➕ FAB
  fab: { position: 'absolute', bottom: 30, right: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#ef4444', paddingHorizontal: 20, paddingVertical: 15, borderRadius: 30, elevation: 10, shadowColor: '#ef4444', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: {width: 0, height: 5} },
  fabText: { color: '#fff', fontWeight: '900', fontSize: 16, marginLeft: 8 },

  // 📝 New Post Modal
  modalDarkBg: { flex: 1, backgroundColor: '#0f172a' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#1e293b' },
  cancelText: { color: '#64748b', fontSize: 16, fontWeight: '600' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  postText: { color: '#ef4444', fontSize: 16, fontWeight: '800' },
  label: { color: '#94a3b8', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 10 },
  tagPill: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1e293b', marginRight: 10, height: 35 },
  tagPillActive: { backgroundColor: '#ef4444' },
  tagPillText: { color: '#94a3b8', fontWeight: '700', fontSize: 13 },
  bigInput: { color: '#f8fafc', fontSize: 18, minHeight: 200, textAlignVertical: 'top', marginTop: 10, lineHeight: 28 },
  disclaimerText: { color: '#475569', fontSize: 12, fontWeight: '600', marginTop: 20, fontStyle: 'italic' },

  // 💬 Thread Modal
  threadContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.8)' },
  threadContent: { height: '85%', backgroundColor: '#020617', borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, borderColor: '#1e293b', padding: 20 },
  threadHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderColor: '#1e293b' },
  originalPostRecap: { backgroundColor: '#0f172a', padding: 15, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#1e293b' },
  replyHeaderLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 10 },
  commentBox: { borderLeftWidth: 2, borderColor: '#334155', paddingLeft: 12, marginBottom: 15 },
  commentAuthor: { color: '#cbd5e1', fontSize: 12, fontWeight: '800', marginBottom: 4 },
  commentText: { color: '#f8fafc', fontSize: 14, lineHeight: 20 },
  replyInputArea: { flexDirection: 'row', alignItems: 'flex-end', paddingTop: 15, borderTopWidth: 1, borderColor: '#1e293b' },
  replyInput: { flex: 1, backgroundColor: '#0f172a', color: '#fff', fontSize: 14, minHeight: 40, maxHeight: 100, borderRadius: 20, paddingHorizontal: 15, paddingTop: 10, paddingBottom: 10, borderWidth: 1, borderColor: '#1e293b' },
  sendBtn: { backgroundColor: '#ef4444', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 10 }
});