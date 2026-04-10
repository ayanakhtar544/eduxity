import React, { useState } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, 
  TextInput, KeyboardAvoidingView, ActivityIndicator, Keyboard, 
  Platform, Dimensions, TouchableWithoutFeedback 
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, ZoomIn, SlideInDown, BounceIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { height } = Dimensions.get('window');
const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

// 🎭 AVAILABLE REACTIONS
const REACTIONS = [
  { id: 'like', emoji: '👍', name: 'Like', color: '#3b82f6' },
  { id: 'love', emoji: '❤️', name: 'Love', color: '#ef4444' },
  { id: 'insightful', emoji: '💡', name: 'Insightful', color: '#f59e0b' },
  { id: 'funny', emoji: '😂', name: 'Funny', color: '#f59e0b' },
  { id: 'support', emoji: '🤝', name: 'Support', color: '#8b5cf6' }
];

export default function CommentsModal({ 
  activeCommentPost, setActiveCommentPost, comments, 
  newComment, setNewComment, handlePostComment, isSubmittingComment, 
  currentUserAvatar, currentUid,
  // 👇 Ye do naye props tumko parent (index.tsx) se pass karne honge
  handleReaction = (commentId: string, reactionType: string) => console.log('Reaction:', reactionType, 'on', commentId),
  handleReply = (commentId: string, replyText: string) => console.log('Reply to:', commentId, 'with', replyText)
}: any) {
  
  // 🎛️ STATES FOR NEW FEATURES
  const [activeReactionMenu, setActiveReactionMenu] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [showRepliesFor, setShowRepliesFor] = useState<string | null>(null); // Toggle to show nested replies

  if (!activeCommentPost) return null;

  // ==========================================
  // ⚡ ACTION HANDLERS
  // ==========================================
  const triggerReaction = (commentId: string, reactionType: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveReactionMenu(null);
    handleReaction(commentId, reactionType);
  };

  const startReply = (comment: any) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setReplyingTo(comment);
    // Autofill mention like Instagram
    setNewComment(`@${comment.authorName.replace(' ', '')} `); 
    // Focus automatically handled by keyboard behavior usually
  };

  const submitCommentOrReply = () => {
    if (!newComment.trim() || isSubmittingComment) return;
    
    if (replyingTo) {
      handleReply(replyingTo.id, newComment.trim());
      setReplyingTo(null); // Reset reply state after sending
    } else {
      handlePostComment();
    }
  };

  const closeMenu = () => {
    if (activeReactionMenu) setActiveReactionMenu(null);
    Keyboard.dismiss();
  };

// ==========================================
  // 🎨 RENDER INDIVIDUAL COMMENT
  // ==========================================
  const renderComment = ({ item, index }: any) => {
    const isMenuOpen = activeReactionMenu === item.id;
    
    // 🔥 FIXED REACTION LOGIC:
    // Safely check if reactions exist and convert object to array of emoji IDs
    const reactionsObj = item.reactions || {}; 
    const reactionValues = Object.values(reactionsObj); // e.g. ["love", "funny", "like"]
    const totalReactions = reactionValues.length;
    
    // Unique emojis nikalne ke liye (taaki 👍👍❤️ ki jagah 👍❤️ dikhe)
    const uniqueReactionIds = [...new Set(reactionValues)].slice(0, 3); 
    const myReaction = reactionsObj[currentUid] || null;

    const hasReplies = item.replies && item.replies.length > 0;

    return (
      <View style={styles.commentThread}>
        <View style={styles.commentItem}>
          <Image source={{uri: item.authorAvatar || DEFAULT_AVATAR}} style={styles.commentAvatar} />
          
          <View style={{ flex: 1 }}>
            <View style={styles.commentBubble}>
              <Text style={styles.commentAuthor}>{item.authorName}</Text>
              <Text style={styles.commentText}>{item.text}</Text>
              
              {/* 🎯 FIXED REACTION SUMMARY BADGE */}
              {totalReactions > 0 && (
                <Animated.View entering={ZoomIn} style={styles.reactionSummaryBadge}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {uniqueReactionIds.map((rid: any, i) => {
                      const reactionData = REACTIONS.find(r => r.id === rid);
                      return (
                        <Text key={i} style={[styles.summaryEmoji, { zIndex: 10 - i }]}>
                          {reactionData?.emoji}
                        </Text>
                      );
                    })}
                  </View>
                  <Text style={styles.summaryCount}>{totalReactions}</Text>
                </Animated.View>
              )}
            </View>

            {/* 🔘 ACTION ROW */}
            <View style={styles.commentActions}>
              <Text style={styles.commentTime}>2h</Text>
              
              <TouchableOpacity 
                style={styles.actionBtn}
                onLongPress={() => {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  setActiveReactionMenu(item.id);
                }}
                onPress={() => triggerReaction(item.id, myReaction ? 'remove' : 'like')}
              >
                <Text style={[
                  styles.actionText, 
                  myReaction && { color: REACTIONS.find(r => r.id === myReaction)?.color || '#3b82f6', fontWeight: '900' }
                ]}>
                  {myReaction ? REACTIONS.find(r => r.id === myReaction)?.name : 'Like'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionBtn} onPress={() => startReply(item)}>
                <Text style={styles.actionText}>Reply</Text>
              </TouchableOpacity>
            </View>

            {/* 🎭 POPUP REACTION MENU */}
            {isMenuOpen && (
              <Animated.View entering={ZoomIn.duration(200)} style={styles.reactionMenu}>
                {REACTIONS.map((reaction, idx) => (
                  <TouchableOpacity 
                    key={reaction.id} 
                    style={styles.reactionOption}
                    onPress={() => triggerReaction(item.id, reaction.id)}
                  >
                    <Animated.Text entering={BounceIn.delay(idx * 50)} style={styles.reactionEmoji}>
                      {reaction.emoji}
                    </Animated.Text>
                  </TouchableOpacity>
                ))}
              </Animated.View>
            )}

            {/* 🔄 VIEW REPLIES TOGGLE (INSTAGRAM STYLE) */}
            {hasReplies && (
              <View style={{ marginTop: 5 }}>
                {showRepliesFor === item.id ? (
                  <View style={styles.repliesContainer}>
                    {/* Render Nested Replies Here */}
                    {item.replies.map((reply: any, rIdx: number) => (
                      <View key={rIdx} style={styles.replyItem}>
                        <Image source={{uri: reply.authorAvatar || DEFAULT_AVATAR}} style={styles.replyAvatar} />
                        <View style={styles.replyBubble}>
                          <Text style={styles.commentAuthor}>{reply.authorName}</Text>
                          <Text style={styles.commentText}>{reply.text}</Text>
                        </View>
                      </View>
                    ))}
                    <TouchableOpacity onPress={() => setShowRepliesFor(null)} style={styles.toggleRepliesBtn}>
                      <View style={styles.dashLine} /><Text style={styles.toggleRepliesText}>Hide replies</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => setShowRepliesFor(item.id)} style={styles.toggleRepliesBtn}>
                    <View style={styles.dashLine} />
                    <Text style={styles.toggleRepliesText}>View {item.replies.length} replies</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={!!activeCommentPost} animationType="slide" transparent={true} onRequestClose={() => setActiveCommentPost(null)}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.commentModalBg}>
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View style={{flex: 1}} />
        </TouchableWithoutFeedback>
        
        <View style={styles.commentBottomSheet}>
          {/* HEADER */}
          <View style={styles.commentHeader}>
            <Text style={styles.commentTitle}>Comments</Text>
            <TouchableOpacity onPress={() => setActiveCommentPost(null)}><Ionicons name="close-circle" size={28} color="#94a3b8" /></TouchableOpacity>
          </View>
          
          {/* COMMENTS LIST */}
          <FlatList
            data={comments}
            keyExtractor={(item, index) => item.id || index.toString()}
            contentContainerStyle={{paddingTop: 10, paddingBottom: 80}}
            showsVerticalScrollIndicator={false}
            renderItem={renderComment}
            ListEmptyComponent={<Text style={styles.noCommentsText}>No comments yet. Start the conversation! 🚀</Text>}
            onScroll={() => activeReactionMenu && setActiveReactionMenu(null)} // Close menu on scroll
          />
          
          {/* REPLY INDICATOR */}
          {replyingTo && (
            <Animated.View entering={SlideInDown.duration(200)} style={styles.replyIndicator}>
              <Text style={styles.replyingToText}>Replying to <Text style={{fontWeight: '800'}}>{replyingTo.authorName}</Text></Text>
              <TouchableOpacity onPress={() => { setReplyingTo(null); setNewComment(''); }}>
                <Ionicons name="close-circle" size={18} color="#64748b" />
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* INPUT BOX */}
          <View style={styles.commentInputBox}>
            <Image source={{uri: currentUserAvatar || DEFAULT_AVATAR}} style={styles.commentInputAvatar} />
            <TextInput 
              style={styles.commentInput} 
              placeholder={replyingTo ? "Write a reply..." : "Add a comment..."} 
              value={newComment} 
              onChangeText={setNewComment} 
              placeholderTextColor="#94a3b8" 
              multiline
              maxLength={300}
            />
            <TouchableOpacity onPress={submitCommentOrReply} disabled={!newComment.trim() || isSubmittingComment}>
              {isSubmittingComment ? (
                <ActivityIndicator size="small" color="#4f46e5" />
              ) : (
                <Ionicons name="send" size={24} color={newComment.trim() ? "#4f46e5" : "#cbd5e1"} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ==========================================
// 🎨 STYLES (PREMIUM LINKEDIN/INSTA LOOK)
// ==========================================
const styles = StyleSheet.create({
  commentModalBg: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  commentBottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: height * 0.7, paddingBottom: Platform.OS === 'ios' ? 20 : 0, boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)', elevation: 20 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  commentTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  
  // Main Comment Thread
  commentThread: { marginBottom: 15 },
  commentItem: { flexDirection: 'row', paddingHorizontal: 20 },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12, backgroundColor: '#f1f5f9' },
  
  commentBubble: { alignSelf: 'flex-start', backgroundColor: '#f1f5f9', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, borderTopLeftRadius: 4, position: 'relative', maxWidth: '85%' },
  commentAuthor: { fontSize: 13, fontWeight: '800', color: '#0f172a', marginBottom: 2 },
  commentText: { fontSize: 14, color: '#334155', lineHeight: 20 },
  
  // Reaction Summary Badge
  reactionSummaryBadge: { position: 'absolute', bottom: -10, right: 5, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)', elevation: 2, zIndex: 10 },
  summaryEmoji: { fontSize: 10, marginRight: -2 },
  summaryCount: { fontSize: 11, fontWeight: '800', color: '#64748b', marginLeft: 4 },

  // Comment Actions
  commentActions: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginLeft: 10, gap: 15 },
  commentTime: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  actionBtn: { paddingVertical: 4 },
  actionText: { fontSize: 12, color: '#64748b', fontWeight: '700' },
  
  // LinkedIn Style Reaction Popup Menu
  reactionMenu: { position: 'absolute', top: -45, left: 10, flexDirection: 'row', backgroundColor: '#fff', borderRadius: 25, paddingHorizontal: 10, paddingVertical: 5, boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)', elevation: 10, borderWidth: 1, borderColor: '#f1f5f9', zIndex: 100 },
  reactionOption: { paddingHorizontal: 8, paddingVertical: 4 },
  reactionEmoji: { fontSize: 24 },

  // Instagram Style Replies
  repliesContainer: { marginTop: 10 },
  replyItem: { flexDirection: 'row', marginTop: 10 },
  replyAvatar: { width: 24, height: 24, borderRadius: 12, marginRight: 10, backgroundColor: '#f1f5f9' },
  replyBubble: { alignSelf: 'flex-start', backgroundColor: '#f8fafc', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderTopLeftRadius: 4 },
  toggleRepliesBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginLeft: 34 },
  dashLine: { width: 20, height: 1, backgroundColor: '#cbd5e1', marginRight: 8 },
  toggleRepliesText: { fontSize: 12, fontWeight: '700', color: '#64748b' },

  noCommentsText: { textAlign: 'center', color: '#94a3b8', marginTop: 40, fontSize: 15, fontWeight: '600' },
  
  // Replying Indicator Box
  replyIndicator: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 20, paddingVertical: 10, borderTopWidth: 1, borderColor: '#f1f5f9' },
  replyingToText: { fontSize: 13, color: '#64748b' },
  
  // Input Box
  commentInputBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderTopWidth: 1, borderColor: '#f1f5f9', backgroundColor: '#fff' },
  commentInputAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10, backgroundColor: '#f1f5f9' },
  commentInput: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 15, paddingTop: 10, paddingBottom: 10, marginRight: 10, color: '#0f172a', fontSize: 14, minHeight: 40, maxHeight: 100 },
});