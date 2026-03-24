import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { auth } from '../../../firebaseConfig';  
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

export default function TestBubble({ message, isMe, groupId, timeString, onOpenTest }: any) {
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;
  const isTest = message.type === 'test';
  
  const hasTakenTest = isTest && message.responses && currentUid && message.responses[currentUid] !== undefined;
  const testResult = hasTakenTest ? message.responses[currentUid] : null;
  const isLive = !isTest && message.endTime > Date.now();

  return (
    <Animated.View entering={FadeInUp.duration(400).springify()} layout={Layout.springify()} style={[styles.wrapper, isMe ? styles.wrapperMe : styles.wrapperOther]}>
      {!isMe && <Image source={{ uri: message.senderAvatar || DEFAULT_AVATAR }} style={styles.avatar} />}
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
        <LinearGradient colors={isTest ? ['#4f46e5', '#3730a3'] : (isLive ? ['#0f172a', '#1e1b4b'] : ['#64748b', '#475569'])} style={{ padding: 15, alignItems: 'center' }}>
          <Ionicons name={isTest ? "timer-outline" : "headset"} size={32} color={isTest ? "#fff" : (isLive ? "#a78bfa" : "#cbd5e1")} style={{ marginBottom: 5 }} />
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>{message.title}</Text>
          <Text style={{ color: '#c7d2fe', fontSize: 12, fontWeight: '600', marginTop: 2 }}>
            {isTest ? `${message.questions?.length} Qs • ` : ''}{message.duration} Mins
          </Text>
        </LinearGradient>
        <View style={{ padding: 15, backgroundColor: isMe ? '#2563eb' : '#fff' }}>
          {isTest ? (
            hasTakenTest ? (
              <View style={styles.scoreBox}><Text style={styles.scoreLabel}>Score</Text><Text style={[styles.scoreValue, isMe ? {color: '#fff'} : {color: '#10b981'}]}>{testResult.score} / {message.questions?.length}</Text></View>
            ) : (
              <TouchableOpacity style={styles.joinBtn} onPress={() => onOpenTest(message)}><Text style={styles.joinBtnText}>Start Test</Text></TouchableOpacity>
            )
          ) : (
            isLive && <TouchableOpacity style={styles.joinBtn} onPress={() => router.push(`/study-room/${groupId}?sessionId=${message.id}`)}><Text style={styles.joinBtnText}>Join Session 🎧</Text></TouchableOpacity>
          )}
          <Text style={[styles.time, isMe ? styles.timeMe : styles.timeOther]}>{timeString}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 15, width: '100%' },
  wrapperMe: { justifyContent: 'flex-end' }, wrapperOther: { justifyContent: 'flex-start' },
  avatar: { width: 30, height: 30, borderRadius: 15, marginRight: 8, marginBottom: 2 },
  bubble: { maxWidth: '85%', borderRadius: 18, overflow: 'hidden', elevation: 1 },
  bubbleMe: { backgroundColor: '#2563eb', borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#ffffff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  joinBtn: { backgroundColor: '#10b981', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }, joinBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  scoreBox: { padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' }, scoreLabel: { fontSize: 12, fontWeight: '700' }, scoreValue: { fontSize: 32, fontWeight: '900' },
  time: { fontSize: 10, marginTop: 10, textAlign: 'center' }, timeMe: { color: '#bfdbfe' }, timeOther: { color: '#94a3b8' },
});