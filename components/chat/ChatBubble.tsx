// Location: components/chat/ChatBubble.tsx
import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated as NativeAnimated } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInDown, FadeInUp, Layout, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';

// 🛑 IMPORTS FOR SUB-BUBBLES
import TestBubble from './bubbles/TestBubble';
import QuestionBubble from './bubbles/QuestionBubble';
import HomeworkBubble from './bubbles/HomeworkBubble';

const { width } = Dimensions.get('window');
const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

interface ChatBubbleProps {
  message: any;
  isMe: boolean;
  groupId: string;
  onReply: (msg: any) => void;
  onLongPress: (msg: any) => void;
  onOpenTest?: (msg: any) => void;
  openDashboard?: (msg: any) => void;
}

export default function ChatBubble({ 
  message, isMe, groupId, onReply, onLongPress, onOpenTest, openDashboard 
}: ChatBubbleProps) {
  
  const swipeableRef = useRef<Swipeable>(null);

  const time = message.createdAt 
    ? new Date(message.createdAt.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    : 'Sending...';

  const readCount = message.readBy ? message.readBy.length : 0;
  const isSeen = readCount > 1; 

  const renderLeftActions = (progress: NativeAnimated.AnimatedInterpolation<number>, dragX: NativeAnimated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({ inputRange: [0, 50], outputRange: [0, 1], extrapolate: 'clamp' });
    const opacity = dragX.interpolate({ inputRange: [0, 30, 50], outputRange: [0, 0.5, 1] });

    return (
      <View style={styles.replyActionContainer}>
        <NativeAnimated.View style={[styles.replyActionCircle, { transform: [{ scale }], opacity }]}>
          <Ionicons name="arrow-undo" size={20} color="#fff" />
        </NativeAnimated.View>
      </View>
    );
  };

  const handleSwipeLeft = () => {
    onReply(message);
    swipeableRef.current?.close(); 
  };

  // 🎓 Study Session Card (🔥 FIXED FOR MOBILE SCREENS)
  if (message.type === 'study_session') {
    return (
      <Animated.View entering={FadeInUp.duration(400)} layout={Layout.springify()} style={styles.studyCardWrapper}>
        <LinearGradient colors={['#0f172a', '#1e1b4b', '#3730a3']} style={styles.studyCard} start={{x:0, y:0}} end={{x:1, y:1}}>
          <View style={styles.studyGlowBox} />
          <View style={styles.studyCardHeader}>
            <View style={styles.studyIconBox}><Ionicons name="laptop" size={24} color="#818cf8" /></View>
            <View style={{flex: 1, marginLeft: 12}}>
              <Text style={styles.studyTitle}>Deep Focus Room</Text>
              <Text style={styles.studySub}>Started by {message.senderName?.split(' ')[0]}</Text>
            </View>
          </View>
          <View style={styles.studyMetrics}>
            <View style={styles.studyMetricBox}>
              <Text style={styles.metricVal}>{message.duration}</Text>
              <Text style={styles.metricLabel}>MINUTES</Text>
            </View>
            <View style={styles.studyDivider} />
            <View style={styles.studyMetricBox}>
              <Text style={styles.metricVal}>{Object.keys(message.activeParticipants || {}).length}</Text>
              <Text style={styles.metricLabel}>JOINED</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.studyJoinBtn}>
            <Text style={styles.studyJoinText}>Join Workspace</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    );
  }

  // 💬 Main Chat Bubble Render
  const renderContent = () => (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onLongPress={() => onLongPress(message)}
      style={[styles.bubbleWrapper, isMe ? styles.bubbleWrapperMe : styles.bubbleWrapperOther]}
    >
      {!isMe && (
        <Image source={{ uri: message.senderAvatar || DEFAULT_AVATAR }} style={styles.avatar} contentFit="cover" />
      )}

      <View style={styles.bubbleCol}>
        {!isMe && <Text style={styles.senderName}>{message.senderName}</Text>}
        
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          
          {message.replyTo && (
            <View style={[styles.repliedBox, isMe ? styles.repliedBoxMe : styles.repliedBoxOther]}>
              <View style={styles.replyLine} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.repliedName, isMe ? { color: '#c7d2fe' } : { color: '#4f46e5' }]}>{message.replyTo.senderName}</Text>
                <Text style={[styles.repliedText, isMe ? { color: '#fff' } : { color: '#475569' }]} numberOfLines={2}>{message.replyTo.text}</Text>
              </View>
            </View>
          )}

          {message.type === 'text' && <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>{message.text}</Text>}
          {message.type === 'test' && <TestBubble message={message} onOpenTest={() => onOpenTest && onOpenTest(message)} isMe={isMe} />}
          {(message.type === 'mcq' || message.type === 'subjective') && <QuestionBubble message={message} groupId={groupId} isMe={isMe} />}
          {message.type === 'homework_bucket' && <HomeworkBubble message={message} openDashboard={() => openDashboard && openDashboard(message)} isMe={isMe} />}

          <View style={styles.footerRow}>
            <Text style={[styles.time, isMe ? styles.timeMe : styles.timeOther]}>{time}</Text>
            {isMe && (
              <View style={styles.readReceiptBox}>
                {isSeen ? (
                  <View style={styles.seenPill}>
                     <Ionicons name="eye" size={10} color="#818cf8" style={{marginRight: 3}} />
                     <Text style={styles.seenText}>{readCount}</Text>
                  </View>
                ) : (
                  <Ionicons name="checkmark-outline" size={14} color="#a5b4fc" />
                )}
              </View>
            )}
          </View>
        </View>

        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <Animated.View entering={ZoomIn} style={[styles.reactionsRow, isMe ? { alignSelf: 'flex-end', right: 15 } : { alignSelf: 'flex-start', left: 15 }]}>
            {Object.values(message.reactions).map((emoji: any, idx) => (
              <View key={idx} style={styles.reactionBadge}><Text style={{ fontSize: 13 }}>{emoji}</Text></View>
            ))}
          </Animated.View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (!isMe) {
    return (
      <Animated.View entering={FadeInDown.duration(350).springify()}>
        <Swipeable ref={swipeableRef} renderLeftActions={renderLeftActions} onSwipeableLeftOpen={handleSwipeLeft} friction={1.5} leftThreshold={40} overSwipe={20}>
          {renderContent()}
        </Swipeable>
      </Animated.View>
    );
  }

  return <Animated.View entering={FadeInUp.duration(350).springify()}>{renderContent()}</Animated.View>;
}

const styles = StyleSheet.create({
  bubbleWrapper: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 22, width: '100%' },
  bubbleWrapperMe: { justifyContent: 'flex-end' },
  bubbleWrapperOther: { justifyContent: 'flex-start' },
  
  avatar: { width: 34, height: 34, borderRadius: 17, marginRight: 8, marginBottom: 4, borderWidth: 1, borderColor: 'rgba(226,232,240,0.8)', backgroundColor: '#fff' },
  bubbleCol: { maxWidth: width * 0.80 }, 
  senderName: { fontSize: 12, fontWeight: '800', color: '#64748b', marginLeft: 6, marginBottom: 5, letterSpacing: 0.2 },
  
  bubble: { padding: 12, paddingHorizontal: 16, borderRadius: 24, boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)', elevation: 2 },
  bubbleMe: { backgroundColor: '#4f46e5', borderBottomRightRadius: 6 },
  bubbleOther: { backgroundColor: '#ffffff', borderBottomLeftRadius: 6, borderWidth: 1, borderColor: '#f1f5f9' },
  
  messageText: { fontSize: 15.5, lineHeight: 24, fontWeight: '500' },
  messageTextMe: { color: '#ffffff' },
  messageTextOther: { color: '#1e293b' },
  
  footerRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 6 },
  time: { fontSize: 10.5, fontWeight: '700' },
  timeMe: { color: '#c7d2fe' },
  timeOther: { color: '#94a3b8' },
  readReceiptBox: { marginLeft: 6, justifyContent: 'center', alignItems: 'center' },
  seenPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  seenText: { fontSize: 10, fontWeight: '800', color: '#e0e7ff' },

  repliedBox: { flexDirection: 'row', padding: 10, borderRadius: 14, marginBottom: 10, alignItems: 'center' },
  repliedBoxMe: { backgroundColor: 'rgba(255,255,255,0.15)' },
  repliedBoxOther: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#f1f5f9' },
  replyLine: { width: 3, height: '100%', backgroundColor: '#a5b4fc', borderRadius: 4, marginRight: 10 },
  repliedName: { fontSize: 12.5, fontWeight: '900', marginBottom: 3 },
  repliedText: { fontSize: 13.5, fontWeight: '500', lineHeight: 18 },
  
  replyActionContainer: { justifyContent: 'center', alignItems: 'center', width: 60, paddingLeft: 5 },
  replyActionCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center' },
  
  reactionsRow: { flexDirection: 'row', marginTop: -14, zIndex: 10, position: 'absolute', bottom: -18, backgroundColor: 'transparent' },
  reactionBadge: { backgroundColor: '#fff', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)', elevation: 4, marginRight: -8 },

  // 🔥 STUDY SESSION CARD FIXED FOR MOBILE
  studyCardWrapper: { width: '100%', alignItems: 'center', marginVertical: 15 },
  studyCard: { 
    width: '100%', 
    maxWidth: 320, // Strict Max Width for small phones
    padding: 20, // Reduced padding
    borderRadius: 28, 
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)', 
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
    elevation: 12, 
    overflow: 'hidden' 
  },
  studyGlowBox: { position: 'absolute', top: -50, right: -50, width: 140, height: 140, backgroundColor: 'rgba(99, 102, 241, 0.3)', borderRadius: 70 },
  studyCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  studyIconBox: { width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  studyTitle: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
  studySub: { color: '#a5b4fc', fontSize: 12, fontWeight: '600', marginTop: 2 },
  studyMetrics: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 18, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  studyMetricBox: { flex: 1, alignItems: 'center' },
  studyDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' },
  metricVal: { color: '#fff', fontSize: 22, fontWeight: '900' },
  metricLabel: { color: '#818cf8', fontSize: 9, fontWeight: '800', letterSpacing: 1, marginTop: 4 },
  studyJoinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4f46e5', width: '100%', paddingVertical: 14, borderRadius: 16, gap: 8, boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)', boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
    },
  studyJoinText: { color: '#fff', fontSize: 15, fontWeight: '900' }
});