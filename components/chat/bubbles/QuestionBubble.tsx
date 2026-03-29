// Location: components/chat/bubbles/QuestionBubble.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebaseConfig';
import Animated, { useAnimatedStyle, withTiming, FadeIn, Layout, SlideInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

export default function QuestionBubble({ message, groupId, isMe }: any) {
  const [answer, setAnswer] = useState('');
  const [showAnswers, setShowAnswers] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const isMCQ = message.type === 'mcq';
  const myUid = auth.currentUser?.uid;
  const responses = message.responses || {};
  const hasAnswered = myUid && responses[myUid] !== undefined;
  const totalVotes = Object.keys(responses).length;

  // 🚀 SUBMIT SUBJECTIVE
  const handleSubmitSubjective = async () => {
    if (!answer.trim() || !myUid) return;
    if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const ref = doc(db, 'groups', groupId, 'messages', message.id);
    await updateDoc(ref, { 
      [`responses.${myUid}`]: { 
        name: auth.currentUser!.displayName, 
        avatar: auth.currentUser!.photoURL || DEFAULT_AVATAR,
        text: answer.trim() 
      } 
    });
    setAnswer('');
  };

  // 🚀 SUBMIT MCQ VOTE
  const handleVote = async (optIdx: number) => {
    if (hasAnswered || !myUid) return; 
    if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    setSelectedOption(optIdx);
    const ref = doc(db, 'groups', groupId, 'messages', message.id);
    await updateDoc(ref, { [`responses.${myUid}`]: optIdx });
  };

  // 📊 CALCULATE MCQ PERCENTAGES
  const getPercentage = (optIdx: number) => {
    if (totalVotes === 0) return 0;
    const votesForOpt = Object.values(responses).filter((v: any) => v === optIdx).length;
    return Math.round((votesForOpt / totalVotes) * 100);
  };

  return (
    <Animated.View layout={Layout.springify()} style={[styles.card, isMe ? styles.cardMe : styles.cardOther]}>
      
      {/* 🔴 NO DOUBLE PFP HERE - Just Clean Header */}
      <View style={styles.header}>
        <View style={[styles.iconBox, isMe ? {backgroundColor: 'rgba(255,255,255,0.2)'} : {backgroundColor: '#eef2ff'}]}>
          <Ionicons name={isMCQ ? "stats-chart" : "help-outline"} size={16} color={isMe ? "#fff" : "#4f46e5"} />
        </View>
        <Text style={[styles.typeText, isMe ? {color: '#e0e7ff'} : {color: '#4f46e5'}]}>
          {isMCQ ? 'Live Poll' : 'Subjective Doubt'}
        </Text>
        <View style={{flex: 1}} />
        
        {hasAnswered && (
          <View style={[styles.statusBadge, isMe ? {borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.1)'} : {}]}>
             <Ionicons name="checkmark-done" size={12} color={isMe ? "#a7f3d0" : "#10b981"} />
             <Text style={[styles.statusBadgeText, isMe ? {color: '#a7f3d0'} : {}]}>Done</Text>
          </View>
        )}
      </View>

      <Text style={[styles.questionText, isMe ? {color: '#fff'} : {color: '#0f172a'}]}>{message.text}</Text>

      {/* ==========================================
          🟢 MCQ INTERFACE (Animated Bars)
          ========================================== */}
      {isMCQ && (
        <View style={styles.mcqWrapper}>
          {message.options.map((opt: string, idx: number) => {
            const percent = getPercentage(idx);
            const isWinner = message.correctOption !== null && message.correctOption !== undefined ? message.correctOption === idx : false;
            const didIVoteThis = responses[myUid!] === idx;

            const barStyle = useAnimatedStyle(() => ({ width: withTiming(`${percent}%`, { duration: 1000 }) }));

            if (hasAnswered) {
              return (
                <View key={idx} style={[styles.votedOptionCard, isMe ? {backgroundColor: 'rgba(0,0,0,0.15)', borderColor: 'transparent'} : {}]}>
                  <Animated.View style={[
                    styles.progressBar, 
                    isMe ? { backgroundColor: isWinner ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255,255,255,0.1)' } 
                         : { backgroundColor: isWinner ? '#d1fae5' : '#f1f5f9' },
                    barStyle
                  ]} />
                  
                  <View style={styles.votedContentRow}>
                    <Text style={[styles.votedOptText, isMe ? {color: '#fff'} : {color: '#334155'}, isWinner && {fontWeight: '900', color: isMe ? '#a7f3d0' : '#059669'}]} numberOfLines={2}>
                      {opt} {didIVoteThis && <Text style={{fontSize: 10, fontStyle: 'italic'}}> (You)</Text>}
                    </Text>
                    <Text style={[styles.votedPercentText, isMe ? {color: '#e0e7ff'} : {color: '#64748b'}, isWinner && {color: isMe ? '#a7f3d0' : '#059669'}]}>{percent}%</Text>
                  </View>
                  
                  {isWinner && (
                    <View style={styles.winnerBadge}>
                       <Ionicons name="checkmark-circle" size={16} color={isMe ? "#10b981" : "#059669"} />
                    </View>
                  )}
                </View>
              );
            }

            return (
              <TouchableOpacity key={idx} style={[styles.voteOptionBtn, isMe ? {backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'transparent'} : {}]} onPress={() => handleVote(idx)} activeOpacity={0.7}>
                <View style={[styles.voteRadio, isMe ? {borderColor: 'rgba(255,255,255,0.5)'} : {}]}>
                  {selectedOption === idx && <View style={[styles.voteRadioInner, isMe ? {backgroundColor: '#fff'} : {}]} />}
                </View>
                <Text style={[styles.voteOptText, isMe ? {color: '#fff'} : {}]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
          <Text style={[styles.totalVotesText, isMe ? {color: '#c7d2fe'} : {color: '#94a3b8'}]}>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} cast</Text>
        </View>
      )}

      {/* ==========================================
          🔵 SUBJECTIVE INTERFACE (Discord Style)
          ========================================== */}
      {!isMCQ && (
        <View style={styles.subjectiveWrapper}>
          
          {!hasAnswered ? (
            <View style={styles.inputRow}>
              <TextInput 
                style={[styles.input, isMe ? {backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', borderColor: 'transparent'} : {}]} 
                placeholder="Type your solution..." 
                placeholderTextColor={isMe ? "#c7d2fe" : "#94a3b8"} 
                value={answer} 
                onChangeText={setAnswer} 
                maxLength={LIMITS.MAX_QUESTION_LENGTH} // Text limit implemented
              />
              <TouchableOpacity style={[styles.sendBtn, !answer.trim() && {opacity: 0.5}, isMe ? {backgroundColor: '#fff'} : {}]} onPress={handleSubmitSubjective} disabled={!answer.trim()}>
                <Ionicons name="send" size={14} color={isMe ? "#4f46e5" : "#fff"} />
              </TouchableOpacity>
            </View>
          ) : (
            <Animated.View entering={SlideInUp} style={[styles.myAnswerBox, isMe ? {backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: 'rgba(52, 211, 153, 0.4)'} : {}]}>
              <Text style={[styles.myAnswerLabel, isMe ? {color: '#a7f3d0'} : {}]}>✅ Your Answer</Text>
              <Text style={[styles.myAnswerText, isMe ? {color: '#fff'} : {}]} numberOfLines={4}>{responses[myUid!].text}</Text>
            </Animated.View>
          )}

          {/* Discord Style Responses Viewer */}
          {totalVotes > 0 && (
            <View style={[styles.accordionWrapper, isMe ? {backgroundColor: 'rgba(0,0,0,0.1)', borderColor: 'transparent'} : {}]}>
              <TouchableOpacity style={[styles.viewAnswersBtn, isMe ? {backgroundColor: 'transparent'} : {}]} onPress={() => setShowAnswers(!showAnswers)}>
                <Text style={[styles.viewAnswersText, isMe ? {color: '#e0e7ff'} : {}]}>{totalVotes} {totalVotes === 1 ? 'Response' : 'Responses'}</Text>
                <Ionicons name={showAnswers ? "chevron-up" : "chevron-down"} size={18} color={isMe ? "#c7d2fe" : "#64748b"} />
              </TouchableOpacity>
              
              {showAnswers && (
                <Animated.View entering={FadeIn} style={[styles.answersList, isMe ? {backgroundColor: 'rgba(255,255,255,0.05)', borderTopColor: 'rgba(255,255,255,0.1)'} : {}]}>
                  {Object.values(responses).map((res: any, idx: number) => (
                    <View key={idx} style={[styles.answerItem, isMe ? {backgroundColor: 'rgba(255,255,255,0.1)'} : {}]}>
                      <View style={styles.answerItemHeader}>
                         <Image source={{uri: res.avatar || DEFAULT_AVATAR}} style={styles.tinyAvatar} />
                         <Text style={[styles.responderName, isMe ? {color: '#a5b4fc'} : {}]}>{res.name}</Text>
                      </View>
                      <Text style={[styles.responderText, isMe ? {color: '#f8fafc'} : {}]}>{res.text}</Text>
                    </View>
                  ))}
                </Animated.View>
              )}
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
}

// 🎨 QUESTION BUBBLE PREMIUM STYLES
const styles = StyleSheet.create({
  // 🔥 FIX: width is strictly 100% of the parent to prevent edge bleeding
  card: { padding: 16, borderRadius: 20, width: '100%', marginTop: 5 },
  cardMe: { backgroundColor: 'rgba(255,255,255,0.15)' }, 
  cardOther: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconBox: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  typeText: { fontSize: 11, fontWeight: '900', marginLeft: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: '#a7f3d0' },
  statusBadgeText: { fontSize: 10, color: '#059669', fontWeight: '800', marginLeft: 2 },

  questionText: { fontSize: 16, fontWeight: '800', lineHeight: 24 },
  
  mcqWrapper: { marginTop: 15, gap: 10 },
  voteOptionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  voteRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  voteRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4f46e5' },
  voteOptText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1e293b' },
  totalVotesText: { fontSize: 11, fontWeight: '700', textAlign: 'right', marginTop: 5 },

  votedOptionCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', position: 'relative' },
  progressBar: { position: 'absolute', top: 0, left: 0, bottom: 0, opacity: 0.8 },
  votedContentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, zIndex: 10 },
  votedOptText: { flex: 1, fontSize: 13, fontWeight: '700', color: '#334155' },
  votedPercentText: { fontSize: 13, fontWeight: '900', color: '#64748b', marginLeft: 10 },
  winnerBadge: { position: 'absolute', right: 8, top: -10, backgroundColor: '#fff', borderRadius: 10, padding: 2 },

  subjectiveWrapper: { marginTop: 15 },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, paddingHorizontal: 15, paddingVertical: 10, fontSize: 14, fontWeight: '500' },
  sendBtn: { backgroundColor: '#4f46e5', width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  
  myAnswerBox: { backgroundColor: '#ecfdf5', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#a7f3d0' },
  myAnswerLabel: { fontSize: 11, fontWeight: '900', color: '#059669', marginBottom: 4, textTransform: 'uppercase' },
  myAnswerText: { fontSize: 14, color: '#0f172a', fontWeight: '600', lineHeight: 20 },

  accordionWrapper: { marginTop: 15, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  viewAnswersBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: '#f8fafc' },
  viewAnswersText: { fontSize: 13, fontWeight: '800', color: '#475569' },
  answersList: { padding: 12, gap: 12, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#f1f5f9' },
  answerItem: { backgroundColor: '#f8fafc', padding: 14, borderRadius: 14 },
  answerItemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  tinyAvatar: { width: 22, height: 22, borderRadius: 11, marginRight: 8, backgroundColor: '#e2e8f0' },
  responderName: { fontSize: 13, fontWeight: '900', color: '#4f46e5' },
  responderText: { fontSize: 14, color: '#334155', fontWeight: '500', lineHeight: 22 }
});