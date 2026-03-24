import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function ExamInstructions({ examData, onStart }: any) {
  const [agreed, setAgreed] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Pre-Exam Instructions</Text>
      </View>
      
      <ScrollView style={{ padding: 20, flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.title}>{examData?.title}</Text>
        <Text style={styles.desc}>{examData?.description}</Text>
        
        <View style={styles.infoBox}>
          <View style={styles.infoRow}><Ionicons name="time" size={20} color="#4f46e5"/><Text style={styles.infoTxt}>Total Time: {examData?.rules?.globalDuration} Mins</Text></View>
          <View style={styles.infoRow}><Ionicons name="list" size={20} color="#4f46e5"/><Text style={styles.infoTxt}>Total Questions: {examData?.questions?.length}</Text></View>
          {examData?.rules?.isStrict && (
            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark" size={20} color="#ef4444"/>
              <Text style={[styles.infoTxt, {color: '#ef4444'}]}>Strict Proctoring: Do not minimize the app!</Text>
            </View>
          )}
        </View>

        <Text style={styles.subHeading}>Marking Scheme:</Text>
        <Text style={styles.bulletTxt}>• Single Correct: Default +4, -1</Text>
        <Text style={styles.bulletTxt}>• Multi Correct: Partial marking applied if specified by teacher.</Text>
        <Text style={styles.bulletTxt}>• Integer Type: Exact numerical value required.</Text>

        <View style={styles.agreeBox}>
          <TouchableOpacity onPress={() => { setAgreed(!agreed); if(Platform.OS !== 'web') Haptics.selectionAsync(); }}>
            <Ionicons name={agreed ? "checkbox" : "square-outline"} size={26} color={agreed ? "#10b981" : "#cbd5e1"} />
          </TouchableOpacity>
          <Text style={styles.agreeTxt}>I have read and understood the instructions. I am ready to begin the CBT.</Text>
        </View>

        <TouchableOpacity 
          style={[styles.startBtn, !agreed && {backgroundColor: '#94a3b8'}]} 
          disabled={!agreed} 
          onPress={() => { if(Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onStart(); }}
        >
          <Text style={styles.startBtnTxt}>Start Exam Now</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  topBar: { padding: 15, backgroundColor: '#0f172a', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 45 },
  topTitle: { color: '#fff', fontWeight: '900', fontSize: 16 },
  title: { fontSize: 24, fontWeight: '900', color: '#0f172a', marginBottom: 10 },
  desc: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  infoBox: { backgroundColor: '#eef2ff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#c7d2fe', marginBottom: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoTxt: { marginLeft: 10, fontWeight: '700', color: '#312e81' },
  subHeading: { fontWeight: 'bold', fontSize: 16, marginBottom: 10, color: '#0f172a' },
  bulletTxt: { color: '#334155', lineHeight: 24, fontSize: 14 },
  agreeBox: { flexDirection: 'row', alignItems: 'center', marginTop: 30, padding: 15, backgroundColor: '#f1f5f9', borderRadius: 10 },
  agreeTxt: { flex: 1, marginLeft: 10, fontSize: 13, color: '#475569', fontWeight: '600' },
  startBtn: { backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  startBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});