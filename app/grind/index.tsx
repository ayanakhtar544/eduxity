import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AppState, Dimensions, ScrollView, Alert, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { auth, db } from '../../firebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, doc, setDoc, deleteDoc, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import Animated, { FadeInDown, LinearTransition, Layout, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function GrindRoomScreen() {
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;
  const myName = auth.currentUser?.displayName || "Scholar";

  // 🧠 CORE STATES
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isGrinding, setIsGrinding] = useState(false);
  const [personalSeconds, setPersonalSeconds] = useState(0);
  
  // 🔥 100% REAL DATA STATES
  const [liveUsersCount, setLiveUsersCount] = useState(0);
  const [logs, setLogs] = useState<any[]>([]);
  
  const appState = useRef(AppState.currentState);
  const pulseAnim = useSharedValue(1);

  // ==========================================
  // 🕒 1. GLOBAL CLOCK (Big Timer)
  // ==========================================
  useEffect(() => {
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // ==========================================
  // ⏱️ 2. PERSONAL STOPWATCH & PULSE
  // ==========================================
  useEffect(() => {
    pulseAnim.value = withRepeat(withSequence(withTiming(1.05, { duration: 1000 }), withTiming(1, { duration: 1000 })), -1, true);
  }, []);

  useEffect(() => {
    let interval: any;
    if (isGrinding) interval = setInterval(() => setPersonalSeconds(prev => prev + 1), 1000);
    else clearInterval(interval);
    return () => clearInterval(interval);
  }, [isGrinding]);

  // ==========================================
  // 📡 3. REAL-TIME FIREBASE LISTENERS
  // ==========================================
  useEffect(() => {
    // A. Listen to Active Grinders Count
    const sessionRef = collection(db, 'grind_sessions');
    const unsubSessions = onSnapshot(sessionRef, (snapshot) => {
      setLiveUsersCount(snapshot.size); // 100% Real Live Count
    });

    // B. Listen to Real-time Global Logs
    const logsQuery = query(collection(db, 'grind_logs'), orderBy('createdAt', 'desc'), limit(15));
    const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => {
        const data = doc.data();
        // Fallback time if serverTimestamp is still pending
        const timeStr = data.createdAt ? data.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        return { id: doc.id, type: data.type, text: data.text, time: timeStr };
      });
      setLogs(fetchedLogs);
    });

    return () => {
      unsubSessions();
      unsubLogs();
    };
  }, []);

  // ==========================================
  // 🛡️ 4. ANTI-DISTRACTION LOGIC (REAL)
  // ==========================================
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async nextAppState => {
      if (appState.current.match(/active/) && nextAppState === 'background' && isGrinding && currentUid) {
        // User left the app! Punish them globally.
        setIsGrinding(false);
        setPersonalSeconds(0);
        
        try {
          // Remove from active sessions
          await deleteDoc(doc(db, 'grind_sessions', currentUid));
          // Broadcast shame log
          await addDoc(collection(db, 'grind_logs'), {
            uid: currentUid,
            type: 'distracted',
            text: `💔 ${myName} lost focus and broke their streak!`,
            createdAt: serverTimestamp()
          });
        } catch(e) { console.log(e); }
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, [isGrinding, myName, currentUid]);

  // Cleanup if user completely closes the screen while grinding
  useEffect(() => {
    return () => {
      if (isGrinding && currentUid) {
        deleteDoc(doc(db, 'grind_sessions', currentUid)).catch(e => console.log(e));
      }
    };
  }, [isGrinding, currentUid]);

  // ==========================================
  // 🎮 ACTIONS (WRITE TO FIREBASE)
  // ==========================================
  const toggleGrind = async () => {
    if (!currentUid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    try {
      if (!isGrinding) {
        setPersonalSeconds(0);
        setIsGrinding(true);
        
        // 1. Add to active sessions
        await setDoc(doc(db, 'grind_sessions', currentUid), {
          uid: currentUid,
          name: myName,
          startedAt: serverTimestamp()
        });
        
        // 2. Broadcast Join Log
        await addDoc(collection(db, 'grind_logs'), {
          uid: currentUid,
          type: 'join',
          text: `🚀 ${myName} started deep focus mode!`,
          createdAt: serverTimestamp()
        });

      } else {
        Alert.alert("Stop Grinding?", "Are you sure you want to end your session?", [
          { text: "Cancel", style: "cancel" },
          { text: "End Session", style: "destructive", onPress: async () => {
              setIsGrinding(false);
              
              // 1. Remove from active sessions
              await deleteDoc(doc(db, 'grind_sessions', currentUid));
              
              // 2. Broadcast Exit Log
              await addDoc(collection(db, 'grind_logs'), {
                uid: currentUid,
                type: 'exit',
                text: `✅ ${myName} ended session after ${Math.floor(personalSeconds/60)} mins.`,
                createdAt: serverTimestamp()
              });
            } 
          }
        ]);
      }
    } catch (error) {
      console.log("Firebase Error:", error);
    }
  };

  // Formatters
  const formatClock = (date: Date) => date.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatStopwatch = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs > 0 ? hrs.toString().padStart(2, '0') + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const animatedPulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: isGrinding ? pulseAnim.value : 1 }] }));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* 🔝 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="close" size={28} color="#fff" /></TouchableOpacity>
        <View style={styles.liveIndicator}>
          <View style={styles.greenDot} />
          <Text style={styles.liveText}>{liveUsersCount} STUDYING NOW</Text>
        </View>
        <View style={{width: 40}} />
      </View>

      {/* 🕒 BIG TIMER (GLOBAL CLOCK) */}
      <View style={styles.globalClockArea}>
        <Text style={styles.globalClockLabel}>CURRENT TIME (IST)</Text>
        <Text style={styles.globalClockText}>{formatClock(currentTime)}</Text>
        <Text style={styles.globalClockSub}>The world isn't stopping. Are you?</Text>
      </View>

      {/* ⏱️ PERSONAL TIMER */}
      <View style={styles.personalTimerArea}>
        <Animated.View style={[styles.timerRing, isGrinding && styles.timerRingActive, animatedPulseStyle]}>
          <Text style={styles.personalTimeLabel}>{isGrinding ? 'YOUR GRIND' : 'READY?'}</Text>
          <Text style={[styles.personalTimeText, isGrinding && {color: '#10b981'}]}>{formatStopwatch(personalSeconds)}</Text>
        </Animated.View>
        
        <TouchableOpacity activeOpacity={0.8} onPress={toggleGrind} style={[styles.actionBtn, isGrinding ? {backgroundColor: '#ef4444'} : {backgroundColor: '#10b981'}]}>
          <Ionicons name={isGrinding ? "stop" : "flash"} size={20} color="#fff" style={{marginRight: 8}}/>
          <Text style={styles.actionBtnText}>{isGrinding ? 'END GRIND' : 'JOIN THE GRIND'}</Text>
        </TouchableOpacity>
      </View>

      {/* 📜 LIVE EVENT LOGS (100% REAL) */}
      <View style={styles.logsContainer}>
        <View style={styles.logsHeader}>
          <Ionicons name="pulse" size={16} color="#6366f1" />
          <Text style={styles.logsTitle}>REALTIME SERVER LOGS</Text>
        </View>
        <ScrollView style={styles.logsScroll} showsVerticalScrollIndicator={false}>
          <Animated.View layout={LinearTransition.springify()}>
            {logs.length === 0 && (
              <Text style={{color: '#64748b', textAlign: 'center', marginTop: 20, fontStyle: 'italic'}}>Waiting for someone to join...</Text>
            )}
            {logs.map((log) => {
              let color = '#94a3b8'; // default grey
              let bgColor = 'rgba(255,255,255,0.02)';
              if (log.type === 'join') { color = '#38bdf8'; bgColor = 'rgba(56, 189, 248, 0.05)'; }
              if (log.type === 'exit') { color = '#10b981'; bgColor = 'rgba(16, 185, 129, 0.05)'; }
              if (log.type === 'distracted') { color = '#ef4444'; bgColor = 'rgba(239, 68, 68, 0.08)'; }
              if (log.type === 'milestone') { color = '#fde047'; bgColor = 'rgba(253, 224, 71, 0.05)'; }

              return (
                <Animated.View key={log.id} entering={FadeInDown.duration(400)} layout={Layout.springify()} style={[styles.logItem, {backgroundColor: bgColor}]}>
                  <Text style={styles.logTime}>[{log.time}]</Text>
                  <Text style={[styles.logText, { color }]}>{log.text}</Text>
                </Animated.View>
              );
            })}
          </Animated.View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  backBtn: { padding: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginRight: 8, shadowColor: '#10b981', shadowOpacity: 0.8, shadowRadius: 5 },
  liveText: { color: '#10b981', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  
  globalClockArea: { alignItems: 'center', marginTop: 10, paddingHorizontal: 20 },
  globalClockLabel: { color: '#64748b', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  globalClockText: { color: '#f8fafc', fontSize: 48, fontWeight: '900', fontVariant: ['tabular-nums'], textShadowColor: 'rgba(255,255,255,0.2)', textShadowOffset: {width: 0, height: 0}, textShadowRadius: 10, marginVertical: 5 },
  globalClockSub: { color: '#4f46e5', fontSize: 13, fontWeight: '700' },

  personalTimerArea: { alignItems: 'center', marginVertical: 40 },
  timerRing: { width: width * 0.6, height: width * 0.6, borderRadius: width, borderWidth: 2, borderColor: '#1e293b', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', marginBottom: 25 },
  timerRingActive: { borderColor: '#10b981', shadowColor: '#10b981', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  personalTimeLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 5 },
  personalTimeText: { color: '#f8fafc', fontSize: 40, fontWeight: '900', fontVariant: ['tabular-nums'] },
  
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 40, paddingVertical: 16, borderRadius: 30, elevation: 5, shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 10 },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

  logsContainer: { flex: 1, backgroundColor: '#0f172a', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, borderWidth: 1, borderColor: '#1e293b' },
  logsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingBottom: 10 },
  logsTitle: { color: '#6366f1', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginLeft: 8 },
  logsScroll: { flex: 1 },
  logItem: { flexDirection: 'row', alignItems: 'flex-start', padding: 10, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.02)' },
  logTime: { color: '#64748b', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginRight: 10, marginTop: 2 },
  logText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 }
});