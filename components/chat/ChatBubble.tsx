import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';

// Import our Modular Bubbles
import QuestionBubble from './bubbles/QuestionBubble';
import HomeworkBubble from './bubbles/HomeworkBubble';
import TestBubble from './bubbles/TestBubble';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png'; 

// 🔥 DHYAN DE: Yahan openDashboard receive kiya
export default function ChatBubble({ message, isMe, groupId, onOpenTest, openDashboard }: any) {
  const timeString = message.createdAt ? new Date(message.createdAt.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...';

  if (message.type === 'mcq' || message.type === 'subjective') {
    return <QuestionBubble message={message} isMe={isMe} groupId={groupId} timeString={timeString} />;
  }

  if (message.type === 'homework_bucket') {
    // 🔥 YAHAN FIX KIYA: openDashboard aage HomeworkBubble ko pass kar diya
    return (
      <HomeworkBubble 
        message={message} 
        isMe={isMe} 
        groupId={groupId} 
        timeString={timeString} 
        openDashboard={openDashboard} 
      />
    );
  }

  if (message.type === 'test' || message.type === 'study_session') {
    return <TestBubble message={message} isMe={isMe} groupId={groupId} timeString={timeString} onOpenTest={onOpenTest} />;
  }

  // NORMAL TEXT MESSAGE (Default fallback)
  return (
    <Animated.View entering={FadeInUp.duration(400).springify()} layout={Layout.springify()} style={[styles.wrapper, isMe ? styles.wrapperMe : styles.wrapperOther]}>
      {!isMe && <Image source={{ uri: message.senderAvatar || DEFAULT_AVATAR }} style={styles.avatar} />}
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
        {!isMe && <Text style={styles.senderName}>{message.senderName}</Text>}
        <Text style={[styles.text, isMe ? styles.textMe : styles.textOther]}>{message.text}</Text>
        <Text style={[styles.time, isMe ? styles.timeMe : styles.timeOther]}>{timeString}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 15, width: '100%' },
  wrapperMe: { justifyContent: 'flex-end' }, wrapperOther: { justifyContent: 'flex-start' },
  avatar: { width: 30, height: 30, borderRadius: 15, marginRight: 8, marginBottom: 2 },
  bubble: { maxWidth: '80%', padding: 12, elevation: 1 },
  bubbleMe: { backgroundColor: '#2563eb', borderRadius: 18, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#ffffff', borderRadius: 18, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  senderName: { fontSize: 12, fontWeight: '700', color: '#3b82f6', marginBottom: 4, marginLeft: 2 },
  text: { fontSize: 15, lineHeight: 22 }, textMe: { color: '#ffffff' }, textOther: { color: '#1e293b' },
  time: { fontSize: 10, marginTop: 5, alignSelf: 'flex-end' }, timeMe: { color: '#bfdbfe' }, timeOther: { color: '#94a3b8' },
});