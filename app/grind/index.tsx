import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, AppState, ScrollView, Alert, Platform, useWindowDimensions 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { Audio } from 'expo-av'; // 🔥 Audio Player Library
import { auth, db } from '../../firebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, doc, setDoc, deleteDoc, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import Animated, { FadeInDown, LinearTransition, Layout, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';

// 💡 Screen Awake Component
function KeepScreenOn() {
  useKeepAwake();
  return null;
}

// 🎵 Music Tracks (Safe to use streaming links for testing)
const TRACKS = [
  { id: 1, name: "Deep Focus Lo-Fi", uri: "https://www.bensound.com/bensound-music/bensound-relaxing.mp3" },
  { id: 2, name: "Chill Study Beats", uri: "https://www.bensound.com/bensound-music/bensound-slowmotion.mp3" },
  { id: 3, name: "Cyberpunk Ambient", uri: "https://www.bensound.com/bensound-music/bensound-scifi.mp3" }
];

export default function GrindRoomScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions(); // 🔥 Responsive Hook
  const isDesktop = width > 768; // Laptop screen check

  const currentUid = auth.currentUser?.uid;
  const myName = auth.currentUser?.displayName || "Scholar";

  // 🧠 CORE STATES
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isGrinding, setIsGrinding] = useState(false);
  const [personalSeconds, setPersonalSeconds] = useState(0);
  
  // 🔥 FIREBASE STATES
  const [liveUsersCount, setLiveUsersCount] = useState(0);
  const [logs, setLogs] = useState<any[]>([]);
  
  // 🎵 AUDIO STATES
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  const appState = useRef(AppState.currentState);
  const pulseAnim = useSharedValue(1);

  // ==========================================
  // 🎵 AUDIO PLAYER LOGIC
  // ==========================================
  async function playMusic(index: number) {
    try {
      if (sound) await sound.unloadAsync(); // Unload previous
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: TRACKS[index].uri },
        { shouldPlay: true, isLooping: true }
      );
      setSound(newSound);
      setIsPlaying(true);
      setCurrentTrackIndex(index);
    } catch (error) {
      console.log("Audio Play Error:", error);
      Alert.alert("Music Error", "Could not load the track.");
    }
  }

  async function togglePlayPause() {
    if (!sound) {
      playMusic(currentTrackIndex); // Start first track
      return;
    }
    if (isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
    } else {
      await sound.playAsync();
      setIsPlaying(true);
    }
  }

  async function nextTrack() {
    const nextIndex = (currentTrackIndex + 1) % TRACKS.length;
    playMusic(nextIndex);
  }

  // Cleanup Audio when leaving screen
  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  // ==========================================
  // 🕒 TIMERS & FIREBASE (Previous Logic intact)
  // ==========================================
  useEffect(() => {
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    pulseAnim.value = withRepeat(withSequence(withTiming(1.03, { duration: 1000 }), withTiming(1, { duration: 1000 })), -1, true);
    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    let interval: any;
    if (isGrinding) interval = setInterval(() => setPersonalSeconds(prev => prev + 1), 1000);
    else clearInterval(interval);
    return () => clearInterval(interval);
  }, [isGrinding]);

  useEffect(() => {
    const sessionRef = collection(db, 'grind_sessions');
    const unsubSessions = onSnapshot(sessionRef, (snapshot) => setLiveUsersCount(snapshot.size));

    const logsQuery = query(collection(db, 'grind_logs'), orderBy('createdAt', 'desc'), limit(15));
    const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => {
        const data = doc.data();
        const timeStr = data.createdAt ? data.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return { id: doc.id, type: data.type, text: data.text, time: timeStr };
      });
      setLogs(fetchedLogs);
    });

    return () => { unsubSessions(); unsubLogs(); };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async nextAppState => {
      if (appState.current.match(/active/) && nextAppState === 'background' && isGrinding && currentUid) {
        setIsGrinding(false);
        const grindedMins = Math.floor(personalSeconds / 60);
        setPersonalSeconds(0);
        try {
          await deleteDoc(doc(db, 'grind_sessions', currentUid));
          await addDoc(collection(db, 'grind_logs'), {
            uid: currentUid, type: 'distracted', text: `💔 ${myName} minimized app. Focus lost.`, createdAt: serverTimestamp()
          });
        } catch(e) { console.log(e); }
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, [isGrinding, myName, currentUid, personalSeconds]);

  const toggleGrind = async () => {
    if (!currentUid) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    try {
      if (!isGrinding) {
        setPersonalSeconds(0); setIsGrinding(true);
        if (!isPlaying) playMusic(currentTrackIndex); // Auto-start music
        await setDoc(doc(db, 'grind_sessions', currentUid), { uid: currentUid, name: myName, startedAt: serverTimestamp() });
        await addDoc(collection(db, 'grind_logs'), { uid: currentUid, type: 'join', text: `🚀 ${myName} entered the Grind Room!`, createdAt: serverTimestamp() });
      } else {
        Alert.alert("End Grind Session?", "Stopping now will record your time.", [
          { text: "Keep Grinding", style: "cancel" },
          { text: "End Session", style: "destructive", onPress: async () => {
              setIsGrinding(false);
              if (isPlaying) togglePlayPause(); // Auto-pause music
              const totalMins = Math.floor(personalSeconds / 60);
              const earnedCoins = Math.floor(personalSeconds / 300);
              await deleteDoc(doc(db, 'grind_sessions', currentUid));
              await addDoc(collection(db, 'grind_logs'), { uid: currentUid, type: 'exit', text: `✅ ${myName} completed a ${totalMins}m deep focus session.`, createdAt: serverTimestamp() });
              if (earnedCoins > 0) Alert.alert("Session Complete!", `You focused for ${totalMins} mins and earned ${earnedCoins} EduCoins! 🪙`);
            } 
          }
        ]);
      }
    } catch (error) { console.log("Firebase Error:", error); }
  };

  const getFocusRank = (secs: number) => {
    if (secs < 300) return { title: "WARMING UP 🧠", color: "#38bdf8" }; 
    if (secs < 900) return { title: "IN THE ZONE ⚡", color: "#fde047" }; 
    if (secs < 1800) return { title: "DEEP WORK 👁️", color: "#f97316" }; 
    return { title: "FLOW STATE 🌌", color: "#c084fc" }; 
  };
  const focusStatus = getFocusRank(personalSeconds);

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
      <StatusBar style="light" backgroundColor="#000000" />
      {isGrinding && <KeepScreenOn />}

      {/* 🔝 TOP HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-down" size={24} color="#f8fafc" /></TouchableOpacity>
        <View style={styles.liveIndicator}>
          <View style={styles.greenDot} />
          <Text style={styles.liveText}>{liveUsersCount} GRINDING</Text>
        </View>
        <View style={styles.strictBadge}><Ionicons name="shield-checkmark" size={14} color="#10b981" /></View>
      </View>

      {/* 💻📱 RESPONSIVE WRAPPER */}
      <View style={[styles.contentWrapper, { flexDirection: isDesktop ? 'row' : 'column' }]}>
        
        {/* ================= LEFT/TOP (TIMER AREA) ================= */}
        <View style={[styles.leftColumn, isDesktop && { flex: 1, paddingRight: 20 }]}>
          <View style={styles.globalClockArea}>
            <Text style={styles.globalClockText}>{formatClock(currentTime)}</Text>
            <Text style={styles.globalClockSub}>The world isn't stopping. Neither should you.</Text>
          </View>

          <View style={styles.personalTimerArea}>
            <Animated.View style={[
              styles.timerRing, 
              { width: isDesktop ? 300 : width * 0.65, height: isDesktop ? 300 : width * 0.65 },
              isGrinding && { borderColor: focusStatus.color, shadowColor: focusStatus.color, ...styles.timerRingActive }, 
              animatedPulseStyle
            ]}>
              <Text style={[styles.personalTimeLabel, isGrinding && {color: focusStatus.color}]}>
                {isGrinding ? focusStatus.title : 'READY TO GRIND?'}
              </Text>
              <Text style={styles.personalTimeText}>{formatStopwatch(personalSeconds)}</Text>
            </Animated.View>
            
            <TouchableOpacity 
              activeOpacity={0.8} onPress={toggleGrind} 
              style={[styles.actionBtn, isGrinding ? {backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: '#ef4444'} : {backgroundColor: '#10b981'}]}
            >
              <Ionicons name={isGrinding ? "stop" : "flash"} size={22} color={isGrinding ? "#ef4444" : "#fff"} style={{marginRight: 8}}/>
              <Text style={[styles.actionBtnText, isGrinding && {color: '#ef4444'}]}>
                {isGrinding ? 'END SESSION' : 'ENTER FLOW STATE'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ================= RIGHT/BOTTOM (MUSIC & LOGS) ================= */}
        <View style={[styles.rightColumn, isDesktop && { flex: 1 }]}>
          
          {/* 🎵 MUSIC PLAYER WIDGET */}
          <View style={styles.musicPlayerCard}>
            <View style={styles.musicInfo}>
              <Ionicons name="musical-notes" size={24} color="#c084fc" />
              <View style={{marginLeft: 12, flex: 1}}>
                <Text style={styles.musicTitle} numberOfLines={1}>{TRACKS[currentTrackIndex].name}</Text>
                <Text style={styles.musicSub}>Lo-Fi Study Beats</Text>
              </View>
            </View>
            <View style={styles.musicControls}>
              <TouchableOpacity onPress={() => playMusic(currentTrackIndex === 0 ? TRACKS.length - 1 : currentTrackIndex - 1)} style={styles.musicBtn}>
                <Ionicons name="play-skip-back" size={20} color="#f8fafc" />
              </TouchableOpacity>
              <TouchableOpacity onPress={togglePlayPause} style={[styles.musicBtn, {backgroundColor: '#c084fc', padding: 12}]}>
                <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={nextTrack} style={styles.musicBtn}>
                <Ionicons name="play-skip-forward" size={20} color="#f8fafc" />
              </TouchableOpacity>
            </View>
          </View>

          {/* 📜 TERMINAL LOGS */}
          <View style={[styles.logsContainer, isDesktop && { borderRadius: 25 }]}>
            <View style={styles.logsHeader}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Ionicons name="terminal" size={18} color="#6366f1" />
                <Text style={styles.logsTitle}>LIVE ROOM ACTIVITY</Text>
              </View>
            </View>

            <ScrollView style={styles.logsScroll} showsVerticalScrollIndicator={false}>
              <Animated.View layout={LinearTransition.springify()}>
                {logs.length === 0 && <Text style={styles.emptyLogText}>Room is silent. Be the first to start...</Text>}
                {logs.map((log) => {
                  let color = '#94a3b8'; let icon = 'ellipse';
                  if (log.type === 'join') { color = '#38bdf8'; icon = 'log-in-outline'; }
                  if (log.type === 'exit') { color = '#10b981'; icon = 'checkmark-circle-outline'; }
                  if (log.type === 'distracted') { color = '#ef4444'; icon = 'warning-outline'; }

                  return (
                    <Animated.View key={log.id} entering={FadeInDown.duration(400)} layout={Layout.springify()} style={styles.logItem}>
                      <Text style={styles.logTime}>[{log.time}]</Text>
                      <Ionicons name={icon as any} size={14} color={color} style={{marginRight: 6, marginTop: 2}} />
                      <Text style={[styles.logText, { color }]}>{log.text}</Text>
                    </Animated.View>
                  );
                })}
              </Animated.View>
            </ScrollView>
          </View>

        </View>
      </View>
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 PREMIUM OLED & RESPONSIVE STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  backBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginRight: 8, shadowColor: '#10b981', shadowOpacity: 1, shadowRadius: 8 },
  liveText: { color: '#10b981', fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
  strictBadge: { padding: 8, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 12 },

  contentWrapper: { flex: 1 },
  leftColumn: { alignItems: 'center', justifyContent: 'center', paddingBottom: 20 },
  rightColumn: { display: 'flex', flexDirection: 'column' },

  globalClockArea: { alignItems: 'center', marginBottom: 15 },
  globalClockText: { color: '#ffffff', fontSize: 36, fontWeight: '900', fontVariant: ['tabular-nums'], textShadowColor: 'rgba(255,255,255,0.3)', textShadowRadius: 10, letterSpacing: 2 },
  globalClockSub: { color: '#64748b', fontSize: 12, fontWeight: '700', marginTop: 5 },

  personalTimerArea: { alignItems: 'center' },
  timerRing: { borderRadius: 999, borderWidth: 3, borderColor: '#1e293b', justifyContent: 'center', alignItems: 'center', backgroundColor: '#050505', marginBottom: 30 },
  timerRingActive: { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 30, elevation: 15 },
  personalTimeLabel: { color: '#64748b', fontSize: 13, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  personalTimeText: { color: '#ffffff', fontSize: 48, fontWeight: '900', fontVariant: ['tabular-nums'], letterSpacing: 1 },

  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 35, paddingVertical: 18, borderRadius: 30, borderWidth: 1, borderColor: 'transparent', elevation: 5 },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },

  musicPlayerCard: { backgroundColor: '#0a0a0a', marginHorizontal: 20, marginBottom: 15, borderRadius: 20, padding: 15, borderWidth: 1, borderColor: '#1e293b', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  musicInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  musicTitle: { color: '#f8fafc', fontSize: 15, fontWeight: '800' },
  musicSub: { color: '#64748b', fontSize: 12, fontWeight: '600', marginTop: 2 },
  musicControls: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  musicBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 50 },

  logsContainer: { flex: 1, backgroundColor: '#0a0a0a', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 20, borderWidth: 1, borderColor: '#1e293b', borderBottomWidth: 0, marginHorizontal: Platform.OS === 'web' ? 20 : 0 },
  logsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  logsTitle: { color: '#6366f1', fontSize: 13, fontWeight: '900', letterSpacing: 2, marginLeft: 10 },
  logsScroll: { flex: 1 },
  logItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8, marginBottom: 4 },
  logTime: { color: '#475569', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginRight: 10, marginTop: 2 },
  logText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 20 },
  emptyLogText: { color: '#475569', textAlign: 'center', marginTop: 30, fontStyle: 'italic', fontSize: 13 }
});