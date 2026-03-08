import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity, 
  SafeAreaView, StatusBar, ActivityIndicator, RefreshControl, Platform, ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../../firebaseConfig';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, limit } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, Layout, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

// ==========================================
// 🔥 THE TABAHI POST CARD (QUIZ + OPINION ENGINE)
// ==========================================
const PostCard = ({ item, currentUid }: any) => {
  const isLiked = item.likes?.includes(currentUid);
  const isSaved = item.savedBy?.includes(currentUid);
  
  // 🧠 SMART VOTING CHECK: Check if item.voters is an object and user is in it
  const userVoteIndex = item.voters ? item.voters[currentUid] : undefined;
  const hasVoted = userVoteIndex !== undefined;

  const likeScale = useSharedValue(1);
  const saveScale = useSharedValue(1);

  const handleLike = async () => {
    if (!currentUid) return;
    likeScale.value = withSpring(0.7, {}, () => { likeScale.value = withSpring(1); });
    try {
      const postRef = doc(db, 'posts', item.id);
      if (isLiked) await updateDoc(postRef, { likes: arrayRemove(currentUid) });
      else await updateDoc(postRef, { likes: arrayUnion(currentUid) });
    } catch (error) { console.log("Like error:", error); }
  };

  const handleSave = async () => {
    if (!currentUid) return;
    saveScale.value = withSpring(0.7, {}, () => { saveScale.value = withSpring(1); });
    try {
      const postRef = doc(db, 'posts', item.id);
      if (isSaved) await updateDoc(postRef, { savedBy: arrayRemove(currentUid) });
      else await updateDoc(postRef, { savedBy: arrayUnion(currentUid) });
    } catch (error) { console.log("Save error:", error); }
  };

  // 🚀 UPGRADED VOTE HANDLER
  const handleVote = async (optIndex: number) => {
    if (hasVoted || !currentUid) return; 

    try {
      const postRef = doc(db, 'posts', item.id);
      const updatedPollOptions = [...item.pollOptions];
      updatedPollOptions[optIndex].votes += 1;

      // Magic: We save { "uid": 2 } inside voters object
      await updateDoc(postRef, {
        pollOptions: updatedPollOptions,
        totalVotes: (item.totalVotes || 0) + 1,
        [`voters.${currentUid}`]: optIndex // Dynamic Object Key!
      });
    } catch (error) {
      console.log("Vote error:", error);
    }
  };

  const animatedLikeStyle = useAnimatedStyle(() => ({ transform: [{ scale: likeScale.value }] }));
  const animatedSaveStyle = useAnimatedStyle(() => ({ transform: [{ scale: saveScale.value }] }));

  return (
    <Animated.View entering={FadeInDown.duration(400).springify()} layout={Layout.springify()} style={styles.postCard}>
      
      {/* 👤 AUTHOR HEADER */}
      <View style={styles.postHeader}>
        <Image source={{ uri: item.authorAvatar || DEFAULT_AVATAR }} style={styles.avatar} />
        <View style={styles.authorInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.authorName}>{item.authorName}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            {item.category && (
              <View style={styles.categoryBadge}>
                {item.type === 'code' && <Ionicons name="code-slash" size={10} color="#fff" style={{ marginRight: 4 }} />}
                {item.pollMode === 'quiz' && <Ionicons name="school" size={10} color="#fff" style={{ marginRight: 4 }} />}
                <Text style={styles.categoryBadgeText}>{item.category}</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.moreBtn}><Ionicons name="ellipsis-horizontal" size={20} color="#64748b" /></TouchableOpacity>
      </View>

      {/* 📝 POST TEXT */}
      {item.text ? <Text style={styles.postText}>{item.text}</Text> : null}

      {/* 📸 IMAGE RENDERER */}
      {item.type === 'image' && item.imageUrl ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.imageUrl }} style={styles.postImage} resizeMode="contain" />
        </View>
      ) : null}

      {/* 💻 CODE BLOCK RENDERER */}
      {item.type === 'code' && item.codeSnippet ? (
        <View style={styles.codeBlockContainer}>
          <View style={styles.macWindowHeader}>
            <View style={styles.macDots}>
              <View style={[styles.macDot, { backgroundColor: '#ff5f56' }]} /><View style={[styles.macDot, { backgroundColor: '#ffbd2e' }]} /><View style={[styles.macDot, { backgroundColor: '#27c93f' }]} />
            </View>
            <Text style={styles.codeLanguage}>{item.language || 'Code'}</Text>
          </View>
          <Text style={styles.codeText}>{item.codeSnippet}</Text>
        </View>
      ) : null}

      {/* 📊 ADVANCED POLL RENDERER (QUIZ vs OPINION) */}
      {item.type === 'poll' && item.pollOptions ? (
        <View style={styles.pollContainer}>
          <View style={styles.pollHeader}>
            <View style={[styles.liveIndicator, item.pollMode === 'quiz' && { backgroundColor: '#8b5cf6' }]} />
            <Text style={[styles.liveText, item.pollMode === 'quiz' && { color: '#8b5cf6' }]}>
              {item.pollMode === 'quiz' ? 'LIVE QUIZ' : 'LIVE POLL'}
            </Text>
          </View>
          
          {item.pollOptions.map((opt: any, idx: number) => {
            const totalVotes = item.totalVotes || 0; 
            const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
            
            // 🧠 COLOR ENGINE
            let barColor = '#bfdbfe'; // Default Blue (Opinion)
            let textColor = '#1e293b';
            let icon = null;

            if (hasVoted && item.pollMode === 'quiz') {
              if (idx === item.correctOptionIndex) {
                barColor = '#d1fae5'; textColor = '#065f46';
                icon = <Ionicons name="checkmark-circle" size={18} color="#10b981" style={{ marginLeft: 5 }} />;
              } else if (idx === userVoteIndex && userVoteIndex !== item.correctOptionIndex) {
                barColor = '#fee2e2'; textColor = '#991b1b';
                icon = <Ionicons name="close-circle" size={18} color="#ef4444" style={{ marginLeft: 5 }} />;
              } else {
                barColor = '#f1f5f9'; textColor = '#64748b';
              }
            } else if (hasVoted && item.pollMode !== 'quiz') {
              if (idx === userVoteIndex) barColor = '#93c5fd'; 
            }
            
            if (hasVoted) {
              return (
                <View key={idx} style={[styles.pollOptionResult, idx === userVoteIndex && { borderWidth: 1, borderColor: item.pollMode === 'quiz' ? (idx === item.correctOptionIndex ? '#10b981' : '#ef4444') : '#3b82f6' }]}>
                  <Animated.View style={[styles.pollFill, { width: `${percentage}%`, backgroundColor: barColor }]} />
                  <View style={styles.pollContent}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Text style={[styles.pollOptionText, { color: textColor }]}>{opt.text}</Text>
                      {icon}
                    </View>
                    <Text style={[styles.pollPercentage, { color: textColor }]}>{percentage}%</Text>
                  </View>
                </View>
              );
            } else {
              return (
                <TouchableOpacity key={idx} style={styles.pollOptionBtn} activeOpacity={0.7} onPress={() => handleVote(idx)}>
                  <Text style={styles.pollOptionBtnText}>{opt.text}</Text>
                </TouchableOpacity>
              );
            }
          })}
          
          <Text style={styles.pollTotalVotes}>
            {item.totalVotes || 0} votes {hasVoted ? '• Results visible' : ''}
          </Text>
        </View>
      ) : null}

      {/* 💬 ACTION BAR */}
      <View style={styles.actionBar}>
        <View style={styles.actionLeft}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.7}>
            <Animated.View style={animatedLikeStyle}><Ionicons name={isLiked ? "heart" : "heart-outline"} size={22} color={isLiked ? "#ef4444" : "#0f172a"} /></Animated.View>
            <Text style={[styles.actionText, isLiked && { color: '#ef4444', fontWeight: '700' }]}>{item.likes?.length || 0} Likes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <Ionicons name="chatbubble-outline" size={20} color="#0f172a" />
            <Text style={styles.actionText}>{item.commentsCount || 0} Comments</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleSave} activeOpacity={0.7} style={styles.saveBtn}>
          <Animated.View style={animatedSaveStyle}><Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={22} color={isSaved ? "#2563eb" : "#0f172a"} /></Animated.View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// ==========================================
// 🔥 MAIN FEED SCREEN (MISSING PART FIXED!)
// ==========================================
export default function FeedScreen() {
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;
  
  const [posts, setPosts] = useState<any[]>([]);
  const [otherStories, setOtherStories] = useState<any[]>([]);
  const [myStory, setMyStory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubPosts = onSnapshot(postsQuery, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
      setRefreshing(false);
    });

    const storiesQuery = query(collection(db, 'stories'), orderBy('createdAt', 'desc'), limit(30));
    const unsubStories = onSnapshot(storiesQuery, (snapshot) => {
      const allStories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const uniqueUsersMap = new Map();
      allStories.forEach(story => {
        if (!uniqueUsersMap.has(story.authorId)) {
          uniqueUsersMap.set(story.authorId, story);
        }
      });
      
      const groupedStories = Array.from(uniqueUsersMap.values());
      const myActiveStory = groupedStories.find(s => s.authorId === currentUid);
      const friendsStories = groupedStories.filter(s => s.authorId !== currentUid);
      
      setMyStory(myActiveStory || null);
      setOtherStories(friendsStories);
    });

    return () => { unsubPosts(); unsubStories(); };
  }, [currentUid]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000); 
  };

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.storiesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15 }}>
          <TouchableOpacity style={styles.storyWrapper} activeOpacity={0.8} onPress={() => !myStory && router.push('/create-story')}>
            <View style={[styles.storyRing, { borderColor: myStory ? '#ef4444' : '#e2e8f0' }]}>
              <Image source={{ uri: auth.currentUser?.photoURL || DEFAULT_AVATAR }} style={styles.storyAvatar} />
            </View>
            {!myStory && (
              <View style={styles.addStoryBadge}>
                <Ionicons name="add" size={14} color="#fff" />
              </View>
            )}
            <Text style={styles.storyName}>Your Story</Text>
          </TouchableOpacity>

          {otherStories.map((story) => (
            <TouchableOpacity key={story.id} style={styles.storyWrapper} activeOpacity={0.8}>
              <View style={[styles.storyRing, { borderColor: '#2563eb' }]}>
                <Image source={{ uri: story.authorAvatar || DEFAULT_AVATAR }} style={styles.storyAvatar} />
              </View>
              <Text style={styles.storyName} numberOfLines={1}>{story.authorName}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.createPostContainer}>
        <View style={styles.createInputRow}>
          <Image source={{ uri: auth.currentUser?.photoURL || DEFAULT_AVATAR }} style={styles.createAvatar} />
          <TouchableOpacity style={styles.fakeInput} onPress={() => router.push('/create-post')} activeOpacity={0.9}>
            <Text style={styles.fakeInputText}>What&apos;s on your mind?{"\n"}Share a doubt, tip, or achievement...</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.createActionsRow}>
          <TouchableOpacity style={styles.createActionBtn} onPress={() => router.push({ pathname: '/create-post', params: { type: 'image' } })}>
            <Ionicons name="camera-outline" size={20} color="#1e293b" />
            <Text style={styles.createActionText}>Media</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.createActionBtn} onPress={() => router.push({ pathname: '/create-post', params: { type: 'poll' } })}>
            <Ionicons name="stats-chart" size={18} color="#1e293b" />
            <Text style={styles.createActionText}>Poll</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.createActionBtn} onPress={() => router.push({ pathname: '/create-post', params: { type: 'code' } })}>
            <Ionicons name="code-slash" size={20} color="#1e293b" />
            <Text style={styles.createActionText}>Snippet</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <View style={styles.mainHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="school" size={26} color="#2563eb" style={{ marginRight: 8 }} />
          <Text style={styles.brandName}>Eduxity</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn}><Ionicons name="search" size={24} color="#0f172a" /></TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={24} color="#0f172a" />
            <View style={styles.notificationBadge}><Text style={styles.badgeText}>1</Text></View>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ backgroundColor: '#f1f5f9', paddingBottom: 100 }}
          ListHeaderComponent={renderHeader}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2563eb"]} />}
          renderItem={({ item }) => <PostCard item={item} currentUid={currentUid} />}
        />
      )}

      <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={() => router.push('/create-post')}>
        <View style={styles.fabInner}><Ionicons name="add" size={30} color="#fff" /></View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 STYLES (NO CHANGES NEEDED HERE)
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mainHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 15, paddingTop: Platform.OS === 'ios' ? 10 : 15, paddingBottom: 10, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  brandName: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  headerIcons: { flexDirection: 'row', gap: 15 },
  iconBtn: { padding: 5, position: 'relative' },
  notificationBadge: { position: 'absolute', top: 2, right: 4, backgroundColor: '#ef4444', width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#fff' },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  headerSection: { backgroundColor: '#f8fafc', paddingBottom: 10 },
  storiesContainer: { backgroundColor: '#fff', paddingTop: 15, paddingBottom: 15 },
  storyWrapper: { alignItems: 'center', marginRight: 18, position: 'relative' },
  storyRing: { padding: 3, borderRadius: 40, borderWidth: 2 },
  storyAvatar: { width: 66, height: 66, borderRadius: 33 },
  storyName: { fontSize: 12, fontWeight: '600', color: '#1e293b', marginTop: 6, maxWidth: 74, textAlign: 'center' },
  addStoryBadge: { position: 'absolute', bottom: 22, right: 0, backgroundColor: '#2563eb', borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  liveStoryBadge: { position: 'absolute', bottom: 22, backgroundColor: '#ef4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1.5, borderColor: '#fff' },
  liveStoryText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  createPostContainer: { backgroundColor: '#fff', marginTop: 8, padding: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  createInputRow: { flexDirection: 'row', alignItems: 'center' },
  createAvatar: { width: 44, height: 44, borderRadius: 22 },
  fakeInput: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 10, marginLeft: 12 },
  fakeInputText: { color: '#64748b', fontSize: 13, fontWeight: '500', lineHeight: 18 },
  createActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderColor: '#f1f5f9' },
  createActionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  createActionText: { marginLeft: 6, fontSize: 13, fontWeight: '600', color: '#1e293b' },
  postCard: { backgroundColor: '#fff', marginTop: 8, paddingTop: 15, paddingBottom: 5, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  postHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginBottom: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#e2e8f0' },
  authorInfo: { flex: 1, marginLeft: 12 },
  authorName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  categoryBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  moreBtn: { padding: 5 },
  postText: { fontSize: 15, color: '#1e293b', lineHeight: 22, paddingHorizontal: 15, marginBottom: 12 },
  imageContainer: { width: '100%', backgroundColor: '#f8fafc', paddingVertical: 10, marginBottom: 10 },
  postImage: { width: '100%', height: 280 },
  codeBlockContainer: { marginHorizontal: 15, backgroundColor: '#18181b', borderRadius: 8, overflow: 'hidden', marginBottom: 12 },
  macWindowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#27272a' },
  macDots: { flexDirection: 'row', gap: 6 },
  macDot: { width: 10, height: 10, borderRadius: 5 },
  codeLanguage: { color: '#38bdf8', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  codeText: { color: '#e4e4e7', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 13, padding: 15, lineHeight: 22 },
  pollContainer: { marginHorizontal: 15, backgroundColor: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12 },
  pollHeader: { flexDirection: 'row', alignItems: 'center', position: 'absolute', top: 15, right: 15, zIndex: 10 },
  liveIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444', marginRight: 4 },
  liveText: { fontSize: 10, fontWeight: '800', color: '#ef4444' },
  pollOptionBtn: { backgroundColor: '#f1f5f9', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  pollOptionBtnText: { fontSize: 14, fontWeight: '600', color: '#0f172a', textAlign: 'center' },
  pollOptionResult: { height: 44, backgroundColor: '#f8fafc', borderRadius: 6, marginBottom: 10, overflow: 'hidden', justifyContent: 'center' },
  pollFill: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: '#bfdbfe' },
  pollContent: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, zIndex: 10 },
  pollOptionText: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  pollPercentage: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  pollTotalVotes: { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 5, textAlign: 'right' },
  actionBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 12, borderTopWidth: 1, borderColor: '#f1f5f9' },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionText: { marginLeft: 6, fontSize: 13, fontWeight: '600', color: '#475569' },
  saveBtn: { padding: 5 },
  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyText: { fontSize: 18, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginTop: 15 },
  emptySubText: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 8 },
  fab: { position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 90, right: 20, zIndex: 100 },
  fabInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 }
});