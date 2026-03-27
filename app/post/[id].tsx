import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Image, Alert 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import EduxityLoader from '../../components/EduxityLoader'; 

// Firebase
import { db, auth } from '../../firebaseConfig';
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';

// Components
import PostCard from '../../components/FeedPost';

export default function SinglePostScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Post & Comments
  useEffect(() => {
    if (!id) return;

    // Fetch Post Data
    const fetchPost = async () => {
      const docRef = doc(db, 'posts', id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPost({ id: docSnap.id, ...docSnap.data() });
      } else {
        // Check in exams if not in posts
        const examRef = doc(db, 'exams_enterprise', id as string);
        const examSnap = await getDoc(examRef);
        if (examSnap.exists()) {
            setPost({ id: examSnap.id, ...examSnap.data(), type: 'live_test' });
        }
      }
      setLoading(false);
    };

    fetchPost();

    // Listen to Comments Real-time
    const commentsRef = collection(db, 'posts', id as string, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [id]);

  // 2. Handle Comment Post
  const handlePostComment = async () => {
    if (!newComment.trim() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'posts', id as string, 'comments'), {
        text: newComment.trim(),
        authorId: currentUid,
        authorName: auth.currentUser?.displayName || 'User',
        authorAvatar: auth.currentUser?.photoURL || '',
        createdAt: serverTimestamp(),
      });

      // Update count on main post
      const postRef = doc(db, 'posts', id as string);
      await updateDoc(postRef, { commentsCount: increment(1) });
      
      setNewComment("");
    } catch (e) {
      Alert.alert("Error", "Could not post comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <EduxityLoader />;
  if (!post) return <View style={styles.center}><Text>Post not found.</Text></View>;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discussion</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* THE POST CARD (Reuse existing component) */}
          <PostCard 
            item={post} 
            currentUid={currentUid} 
            // In single view, comments modal is not needed as it's inline
            onOpenComments={() => {}} 
          />

          {/* COMMENTS SECTION */}
          <View style={styles.commentsWrapper}>
            <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>
            
            {comments.map((comment, index) => (
              <View key={comment.id} style={styles.commentItem}>
                <Image 
                  source={{ uri: comment.authorAvatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} 
                  style={styles.commentAvatar} 
                />
                <View style={styles.commentContent}>
                  <Text style={styles.commentAuthor}>{comment.authorName}</Text>
                  <Text style={styles.commentText}>{comment.text}</Text>
                  <Text style={styles.commentTime}>
                    {comment.createdAt ? new Date(comment.createdAt.toMillis()).toLocaleDateString() : 'Just now'}
                  </Text>
                </View>
              </View>
            ))}
            
            {comments.length === 0 && (
              <View style={styles.emptyComments}>
                <Ionicons name="chatbubbles-outline" size={40} color="#cbd5e1" />
                <Text style={styles.emptyText}>No comments yet. Start the conversation!</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* INLINE INPUT BAR */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Write a comment..."
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !newComment.trim() && { opacity: 0.5 }]} 
            onPress={handlePostComment}
            disabled={!newComment.trim() || isSubmitting}
          >
            {isSubmitting ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={20} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 12 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  
  commentsWrapper: { padding: 15, paddingBottom: 100 },
  commentsTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 20 },
  commentItem: { flexDirection: 'row', marginBottom: 20 },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12, backgroundColor: '#e2e8f0' },
  commentContent: { flex: 1, backgroundColor: '#fff', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  commentAuthor: { fontSize: 13, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  commentText: { fontSize: 14, color: '#475569', lineHeight: 20 },
  commentTime: { fontSize: 10, color: '#94a3b8', marginTop: 8, fontWeight: '600' },
  
  emptyComments: { alignItems: 'center', marginTop: 30 },
  emptyText: { color: '#94a3b8', marginTop: 10, fontWeight: '600' },

  inputBar: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  input: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
  sendBtn: { marginLeft: 12, backgroundColor: '#4f46e5', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' }
});