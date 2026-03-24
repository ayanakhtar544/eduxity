import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, Alert } from 'react-native';
import { auth, db } from '../../../firebaseConfig';  
import { doc, updateDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { awardXP } from '../../../helpers/gamificationEngine';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

export default function QuestionBubble({ message, isMe, groupId, timeString }: any) {
  const [subjectiveAnswer, setSubjectiveAnswer] = useState('');
  const currentUid = auth.currentUser?.uid;
  
  const responsesMap = message.responses || {};
  const totalVotes = Object.keys(responsesMap).length;
  const hasAnswered = currentUid && responsesMap[currentUid] !== undefined;
  const userAnswer = hasAnswered ? responsesMap[currentUid] : null;

  const handleAnswerSubmit = async (answerValue: any) => {
    if (!currentUid) return;
    try {
      const msgRef = doc(db, 'groups', groupId, 'messages', message.id);
      await updateDoc(msgRef, { [`responses.${currentUid}`]: answerValue });
      if (message.type === 'mcq') {
        const isCorrect = message.correctOption === answerValue;
        const reward = await awardXP(currentUid, isCorrect ? 20 : 5, "MCQ Answer");
        if (reward?.leveledUp) Alert.alert("⭐ LEVEL UP!", `You reached Level ${reward.newLevel}!`);
      }
    } catch (e) { console.log(e); }
  };

  const isMcq = message.type === 'mcq';
  const label = isMcq ? "Live Poll / MCQ" : "Written Answer";
  const iconName = isMcq ? "stats-chart" : "document-text";
  const themeColor = isMe ? "#bfdbfe" : (isMcq ? "#3b82f6" : "#8b5cf6");

  return (
    <Animated.View entering={FadeInUp.duration(400).springify()} layout={Layout.springify()} style={[styles.wrapper, isMe ? styles.wrapperMe : styles.wrapperOther]}>
      {!isMe && <Image source={{ uri: message.senderAvatar || DEFAULT_AVATAR }} style={styles.avatar} />}
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
        <View style={styles.qHeader}>
          <Ionicons name={iconName} size={18} color={themeColor} />
          <Text style={[styles.qLabel, {color: themeColor}]}>{label}</Text>
        </View>
        <Text style={[styles.text, isMe ? styles.textMe : styles.textOther, { fontWeight: '700', marginBottom: 12 }]}>{message.text}</Text>
        
        {isMcq ? (
          message.options?.map((opt: string, index: number) => {
            const isSelected = userAnswer === index;
            const isCorrect = message.correctOption === index;
            const percent = totalVotes > 0 ? Math.round((Object.values(responsesMap).filter(v => v === index).length / totalVotes) * 100) : 0;
            
            if (hasAnswered) {
              let barColor = '#e2e8f0'; 
              if (isCorrect) barColor = '#d1fae5'; else if (isSelected) barColor = '#fee2e2'; 
              return (
                <View key={index} style={[styles.mcqResult, isCorrect && styles.mcqCorrectBorder, (isSelected && !isCorrect) && styles.mcqWrongBorder]}>
                  <Animated.View style={[styles.mcqFill, { width: `${percent}%`, backgroundColor: barColor }]} />
                  <View style={styles.mcqContent}><Text style={{flex: 1, zIndex: 10, fontWeight: '600'}}>{opt}</Text><Text style={{fontWeight: '800', color: '#64748b', zIndex: 10}}>{percent}%</Text></View>
                </View>
              );
            }
            return (<TouchableOpacity key={index} style={styles.mcqOption} onPress={() => handleAnswerSubmit(index)}><Text style={{fontWeight: '600'}}>{opt}</Text></TouchableOpacity>);
          })
        ) : (
          hasAnswered ? (
            <View style={styles.subBox}><Text style={styles.subTitle}>Your Answer:</Text><Text style={styles.subText}>{userAnswer}</Text></View>
          ) : (
            <View><TextInput style={styles.subInput} placeholder="Type your answer..." multiline value={subjectiveAnswer} onChangeText={setSubjectiveAnswer} /><TouchableOpacity style={styles.submitBtn} onPress={() => { if(subjectiveAnswer.trim()) handleAnswerSubmit(subjectiveAnswer.trim()); }}><Text style={styles.submitBtnText}>Submit</Text></TouchableOpacity></View>
          )
        )}
        <Text style={[styles.time, isMe ? styles.timeMe : styles.timeOther]}>{timeString}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 15, width: '100%' },
  wrapperMe: { justifyContent: 'flex-end' }, wrapperOther: { justifyContent: 'flex-start' },
  avatar: { width: 30, height: 30, borderRadius: 15, marginRight: 8, marginBottom: 2 },
  bubble: { maxWidth: '85%', padding: 12, elevation: 1 },
  bubbleMe: { backgroundColor: '#2563eb', borderRadius: 18, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#ffffff', borderRadius: 18, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  text: { fontSize: 15, lineHeight: 22 }, textMe: { color: '#ffffff' }, textOther: { color: '#1e293b' },
  time: { fontSize: 10, marginTop: 5, alignSelf: 'flex-end' }, timeMe: { color: '#bfdbfe' }, timeOther: { color: '#94a3b8' },
  qHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)', paddingBottom: 6 },
  qLabel: { fontSize: 12, fontWeight: '800', marginLeft: 6 },
  mcqOption: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  mcqResult: { position: 'relative', backgroundColor: '#ffffff', borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  mcqFill: { position: 'absolute', top: 0, bottom: 0, left: 0 }, mcqContent: { flexDirection: 'row', justifyContent: 'space-between', padding: 12 },
  mcqCorrectBorder: { borderColor: '#10b981', borderWidth: 1.5 }, mcqWrongBorder: { borderColor: '#ef4444', borderWidth: 1.5 },
  subInput: { backgroundColor: '#f1f5f9', borderRadius: 12, padding: 12, minHeight: 60, marginBottom: 10 },
  submitBtn: { backgroundColor: '#10b981', padding: 10, borderRadius: 10, alignItems: 'center' }, submitBtnText: { color: '#fff', fontWeight: 'bold' },
  subBox: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 12 }, subTitle: { fontSize: 12, color: '#64748b', fontWeight: '700' }, subText: { fontSize: 14, fontWeight: '500' }
});