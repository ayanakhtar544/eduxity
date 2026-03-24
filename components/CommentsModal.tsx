import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, TextInput, KeyboardAvoidingView, ActivityIndicator, Keyboard, Platform, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');
const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

export default function CommentsModal({ 
  activeCommentPost, setActiveCommentPost, comments, 
  newComment, setNewComment, handlePostComment, isSubmittingComment, currentUserAvatar 
}: any) {
  
  if (!activeCommentPost) return null;

  return (
    <Modal visible={!!activeCommentPost} animationType="slide" transparent={true} onRequestClose={() => setActiveCommentPost(null)}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.commentModalBg}>
        <TouchableOpacity style={{flex: 1}} activeOpacity={1} onPress={() => { Keyboard.dismiss(); setActiveCommentPost(null); }} />
        <View style={styles.commentBottomSheet}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentTitle}>Comments</Text>
            <TouchableOpacity onPress={() => setActiveCommentPost(null)}><Ionicons name="close-circle" size={28} color="#94a3b8" /></TouchableOpacity>
          </View>
          
          <FlatList
            data={comments}
            keyExtractor={item => item.id}
            contentContainerStyle={{paddingTop: 10, paddingBottom: 20}}
            renderItem={({item}) => (
              <View style={styles.commentItem}>
                <Image source={{uri: item.authorAvatar || DEFAULT_AVATAR}} style={styles.commentAvatar} />
                <View style={styles.commentBubble}>
                  <Text style={styles.commentAuthor}>{item.authorName}</Text>
                  <Text style={styles.commentText}>{item.text}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.noCommentsText}>No comments yet. Start the conversation! 🚀</Text>}
          />
          
          <View style={styles.commentInputBox}>
            <Image source={{uri: currentUserAvatar || DEFAULT_AVATAR}} style={styles.commentInputAvatar} />
            <TextInput style={styles.commentInput} placeholder="Add a comment..." value={newComment} onChangeText={setNewComment} placeholderTextColor="#94a3b8" />
            <TouchableOpacity onPress={handlePostComment} disabled={!newComment.trim() || isSubmittingComment}>
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

const styles = StyleSheet.create({
  commentModalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  commentBottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: height * 0.6, paddingBottom: Platform.OS === 'ios' ? 20 : 0 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  commentTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  commentItem: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 10 },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  commentBubble: { flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 16, borderTopLeftRadius: 4 },
  commentAuthor: { fontSize: 13, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  commentText: { fontSize: 14, color: '#334155', lineHeight: 20 },
  noCommentsText: { textAlign: 'center', color: '#94a3b8', marginTop: 40, fontSize: 15, fontWeight: '600' },
  commentInputBox: { flexDirection: 'row', alignItems: 'center', padding: 15, borderTopWidth: 1, borderColor: '#f1f5f9', backgroundColor: '#fff' },
  commentInputAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  commentInput: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10, color: '#0f172a', fontSize: 15 },
});