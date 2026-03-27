import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Alert, Image, ScrollView, Platform, AppState, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake'; 
import Animated, { 
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSpring, interpolateColor
} from 'react-native-reanimated';
import { auth, db } from '../../firebaseConfig';
import { doc, onSnapshot, updateDoc, arrayUnion, deleteField } from 'firebase/firestore';
import { processAction } from '../../helpers/gamificationEngine';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// ==========================================
// 🎧 100% RELIABLE LO-FI PLAYLIST (Fixed URLs)
// ==========================================
const LOFI_TRACKS = [
  { id: 1, title: 'Deep Focus Ambient', artist: 'Zenity', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'Rainy Cafe Vibes', artist: 'Chillhop', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 3, title: 'Midnight Study', artist: 'Lofi Girl', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 4, title: 'Morning Dew', artist: 'Aesthetic Sounds', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' }
];

// ==========================================
// 🎛️ MICRO-INTERACTION BUTTON COMPONENT
// ==========================================
const AnimatedPressable = ({ children, onPress, style, disabled }: any) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <TouchableOpacity
      activeOpacity={1}
      disabled={disabled}
      onPressIn={() => { scale.value = withSpring(0.92); if(!disabled && Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      onPress={onPress}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </TouchableOpacity>
  );
};

// ==========================================
// 🌟 MAIN SCREEN COMPONENT
// ==========================================
export default function AdvancedStudyRoom() {
  useKeepAwake(); 
  const router = useRouter();
  const { id, sessionId } = useLocalSearchParams(); 
  
  // 🧠 CORE STATES
  const [sessionData, setSessionData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSessionLive, setIsSessionLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // 🎵 AUDIO STATES
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  // 🛡️ REFS & TRACKING
  const hasRewarded = useRef(false); 
  const scrollViewRef = useRef<ScrollView>(null);
  const appState = useRef(AppState.currentState);
  const isHost = sessionData?.senderId === auth.currentUser?.uid;
  const myName = auth.currentUser?.displayName?.split(' ')[0] || 'User';

  // 🌀 ANIMATION VALUES
  const pulseAnim1 = useSharedValue(1);
  const pulseAnim2 = useSharedValue(1);
  const bgProgress = useSharedValue(0);

  // ==========================================
  // 📡 1. FIREBASE SYNC & ROOM ENTRY
  // ==========================================
  useEffect(() => {
    if (!id || !sessionId) return;
    const unsub = onSnapshot(doc(db, 'groups', id as string, 'messages', sessionId as string), (snap) => {
      if (snap.exists()) {
        setSessionData(snap.data());
        setIsLoading(false);
      } else {
        Alert.alert("Room Closed", "This session no longer exists.");
        router.back();
      }
    });
    return () => unsub();
  }, [id, sessionId]);

  // Join Event
  useEffect(() => {
    const joinRoom = async () => {
      if (sessionData && auth.currentUser && !sessionData.activeParticipants?.[auth.currentUser.uid]) {
        const uid = auth.currentUser.uid;
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        await updateDoc(doc(db, 'groups', id as string, 'messages', sessionId as string), {
          [`activeParticipants.${uid}`]: { name: myName, avatar: auth.currentUser.photoURL, joinedAt: Date.now() },
          logs: arrayUnion(`🟢 ${myName} joined the focus zone at ${timeStr}`)
        });
      }
    };
    joinRoom();
  }, [sessionData === null]);

  // ==========================================
  // 🚨 2. ANTI-CHEAT: APP BACKGROUND TRACKER
  // ==========================================
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (
        appState.current.match(/active/) && 
        nextAppState.match(/inactive|background/) && 
        isSessionLive && 
        auth.currentUser
      ) {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        try {
          await updateDoc(doc(db, 'groups', id as string, 'messages', sessionId as string), {
            logs: arrayUnion(`⚠️ ALARM: ${myName} lost focus and opened another app at ${timeStr}!`)
          });
        } catch (e) { console.log(e); }
      }
      appState.current = nextAppState;
    });

    return () => { subscription.remove(); };
  }, [isSessionLive, id, sessionId, myName]);

  // ==========================================
  // ⏱️ 3. ABSOLUTE SYNCHRONIZED TIMER ENGINE
  // ==========================================
  useEffect(() => {
    if (!sessionData) return;
    
    const interval = setInterval(() => {
      if (sessionData.isPaused) {
        setTimeLeft(sessionData.pausedRemainingTime || 0);
        setIsSessionLive(false);
        pulseAnim1.value = withTiming(1);
        pulseAnim2.value = withTiming(1);
        return;
      }

      if (!sessionData.endTime) return;
      const remaining = Math.max(0, Math.floor((sessionData.endTime - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining > 0) {
        setIsSessionLive(true);
        if (pulseAnim1.value === 1) {
          pulseAnim1.value = withRepeat(withTiming(1.15, { duration: 2000, easing: Easing.inOut(Easing.ease) }), -1, true);
          pulseAnim2.value = withRepeat(withTiming(1.3, { duration: 2000, easing: Easing.inOut(Easing.ease) }), -1, true);
          bgProgress.value = withRepeat(withTiming(1, { duration: 15000, easing: Easing.linear }), -1, true);
        }
      } else {
        setIsSessionLive(false);
        pulseAnim1.value = withTiming(1);
        pulseAnim2.value = withTiming(1);
        
        if (!hasRewarded.current && auth.currentUser) {
          hasRewarded.current = true;
          handleSessionComplete();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionData?.endTime, sessionData?.isPaused]);

  const handleSessionComplete = async () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const reward = await processAction(auth.currentUser!.uid, 'STUDY_SESSION');
    Alert.alert("Target Achieved! 🎯", `You stayed disciplined.\nEarned +${reward?.xpEarned || 50} XP & ${reward?.coinsEarned || 5} Coins!`);
  };

  // ==========================================
  // 🎛️ 4. ADVANCED HOST SUPERPOWERS (WEB COMPATIBLE)
  // ==========================================
  const handleHostAction = async (actionType: 'add' | 'sub' | 'pause' | 'end') => {
    if (!isHost) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const docRef = doc(db, 'groups', id as string, 'messages', sessionId as string);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    try {
      if (actionType === 'add') {
        const newEndTime = Math.max(Date.now(), sessionData.endTime) + (5 * 60000);
        await updateDoc(docRef, { endTime: newEndTime, isPaused: false, logs: arrayUnion(`⏳ Host added +5 Mins at ${timeStr}`) });
        hasRewarded.current = false; 
      } 
      else if (actionType === 'sub') {
        const newEndTime = Math.max(Date.now(), sessionData.endTime - (5 * 60000));
        await updateDoc(docRef, { endTime: newEndTime, logs: arrayUnion(`⏳ Host removed 5 Mins at ${timeStr}`) });
      }
      else if (actionType === 'pause') {
        if (sessionData.isPaused) {
          const newEndTime = Date.now() + (sessionData.pausedRemainingTime * 1000);
          await updateDoc(docRef, { isPaused: false, endTime: newEndTime, pausedRemainingTime: deleteField(), logs: arrayUnion(`▶️ Host resumed the session at ${timeStr}`) });
        } else {
          await updateDoc(docRef, { isPaused: true, pausedRemainingTime: timeLeft, logs: arrayUnion(`⏸️ Host paused the session at ${timeStr}`) });
        }
      }
      else if (actionType === 'end') {
        // 🔥 WEB COMPATIBLE ALERT
        const performEnd = async () => {
          await updateDoc(docRef, { endTime: Date.now(), isPaused: false, logs: arrayUnion(`🛑 Host ended the session early.`) });
          if (sound) { await sound.unloadAsync(); setSound(null); }
          router.back();
        };

        if (Platform.OS === 'web') {
          if (window.confirm("Stop the timer for everyone and end session?")) performEnd();
        } else {
          Alert.alert("End Session?", "Stop the timer for everyone?", [
            { text: "Cancel", style: "cancel" },
            { text: "End Now", style: "destructive", onPress: performEnd }
          ]);
        }
      }
    } catch (e) { Alert.alert("Error", "Action failed."); }
  };

  // ==========================================
  // 🎵 5. PROFESSIONAL AUDIO ENGINE (FIXED)
  // ==========================================
  const configureAudio = async () => {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      interruptionModeIOS: InterruptionModeIOS.DuckOthers,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      playThroughEarpieceAndroid: false
    });
  };

  const loadAudio = useCallback(async (trackIndex: number, autoPlay: boolean = false) => {
    if (sound) { await sound.unloadAsync(); }
    try {
      await configureAudio();
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: LOFI_TRACKS[trackIndex].url },
        { shouldPlay: autoPlay, isLooping: true, volume: 0.8 }
      );
      setSound(newSound);
      if (autoPlay) setIsPlayingMusic(true);
    } catch (error) { 
      console.log("Audio error:", error); 
    }
  }, [sound]);

  useEffect(() => {
    loadAudio(0, false);
    return () => { if (sound) sound.unloadAsync(); };
  }, []); 

  const toggleMusic = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (!sound) {
       // If sound failed to load initially, try loading it now
       await loadAudio(currentTrackIndex, true);
       return;
    }
    
    if (isPlayingMusic) { 
      await sound.pauseAsync(); 
      setIsPlayingMusic(false); 
    } else { 
      await sound.playAsync(); 
      setIsPlayingMusic(true); 
    }
  };

  const changeTrack = (direction: 'next' | 'prev') => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let newIdx = direction === 'next' ? currentTrackIndex + 1 : currentTrackIndex - 1;
    if (newIdx >= LOFI_TRACKS.length) newIdx = 0;
    if (newIdx < 0) newIdx = LOFI_TRACKS.length - 1;
    setCurrentTrackIndex(newIdx);
    loadAudio(newIdx, isPlayingMusic);
  };

  // ==========================================
  // 🚪 6. EXIT LOGIC (WEB COMPATIBLE FIX)
  // ==========================================
  const handleExitRoom = async () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    
    // Core function to leave safely
    const performLeave = async () => {
      if (auth.currentUser && sessionId) {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        try {
          await updateDoc(doc(db, 'groups', id as string, 'messages', sessionId as string), {
            [`activeParticipants.${auth.currentUser.uid}`]: deleteField(),
            logs: arrayUnion(`🔴 ${myName} left the room at ${timeStr}`)
          });
        } catch (e) { console.log(e); }
      }
      
      if (sound) {
         await sound.unloadAsync();
         setSound(null);
      }
      router.back();
    };

    // 🔥 WEB ALERT FIX
    if (Platform.OS === 'web') {
      const confirmed = window.confirm("Are you sure you want to leave this session?");
      if (confirmed) performLeave();
    } else {
      Alert.alert("Leave Focus Zone?", "Are you sure you want to leave this session?", [
        { text: "Cancel", style: "cancel" },
        { text: "Leave", style: "destructive", onPress: performLeave }
      ]);
    }
  };

  // ==========================================
  // 🎨 UI HELPERS & FORMATTERS
  // ==========================================
  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  const timerAnimatedStyle1 = useAnimatedStyle(() => ({ transform: [{ scale: pulseAnim1.value }], opacity: 0.4 }));
  const timerAnimatedStyle2 = useAnimatedStyle(() => ({ transform: [{ scale: pulseAnim2.value }], opacity: 0.15 }));
  const bgAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(bgProgress.value, [0, 0.5, 1], ['#020617', '#0f172a', '#020617'])
  }));

  const renderLogIcon = (text: string) => {
    if (text.includes('🟢')) return <Text style={{color: '#10b981', width: 20}}>🟢</Text>;
    if (text.includes('🔴')) return <Text style={{color: '#ef4444', width: 20}}>🔴</Text>;
    if (text.includes('⚠️')) return <Text style={{color: '#f59e0b', width: 20}}>⚠️</Text>;
    if (text.includes('🛑')) return <Text style={{color: '#ef4444', width: 20}}>🛑</Text>;
    return <Text style={{color: '#a78bfa', width: 20}}>⚡</Text>;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#020617' }]}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={{color: '#64748b', marginTop: 15, fontWeight: '600'}}>Syncing with Firebase...</Text>
      </SafeAreaView>
    );
  }

  const activeUsers = sessionData?.activeParticipants ? Object.values(sessionData.activeParticipants) : [];
  const logs = sessionData?.logs || [];

  return (
    <Animated.View style={[styles.container, bgAnimatedStyle]}>
      <StatusBar style="light" />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.roomName}>ZEN ZONE</Text>
            <Text style={styles.hostText}>Host: {sessionData?.senderName?.split(' ')[0] || 'Unknown'}</Text>
          </View>
          
          <View style={styles.avatarsContainer}>
            {activeUsers.slice(0, 4).map((u: any, i) => (
              <View key={i} style={[styles.avatarWrapper, { right: i * 22, zIndex: 10 - i }]}>
                <Image source={{ uri: u.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} style={styles.avatar} />
                <View style={styles.onlineDot} />
              </View>
            ))}
            {activeUsers.length > 4 && (
              <View style={[styles.avatar, styles.moreAvatar, { right: 4 * 22, zIndex: 0 }]}>
                <Text style={styles.moreAvatarText}>+{activeUsers.length - 4}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.timerWrapper}>
          <Animated.View style={[styles.timerRing, timerAnimatedStyle2, sessionData.isPaused ? styles.ringPaused : (isSessionLive ? styles.ringLive : styles.ringEnded), { width: width * 0.95, height: width * 0.95 }]} />
          <Animated.View style={[styles.timerRing, timerAnimatedStyle1, sessionData.isPaused ? styles.ringPaused : (isSessionLive ? styles.ringLive : styles.ringEnded), { width: width * 0.75, height: width * 0.75 }]} />
          
          <View style={[styles.timerCircle, sessionData.isPaused ? styles.circlePaused : (!isSessionLive && styles.circleEnded)]}>
            <Text style={[styles.timerText, formatTime(timeLeft).length > 5 && { fontSize: 55 }]}>
              {formatTime(timeLeft)}
            </Text>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, sessionData.isPaused ? {backgroundColor: '#f59e0b'} : (!isSessionLive && { backgroundColor: '#ef4444' })]} />
              <Text style={[styles.statusText, sessionData.isPaused ? {color: '#f59e0b'} : (!isSessionLive && { color: '#ef4444' })]}>
                {sessionData.isPaused ? 'SESSION PAUSED' : (isSessionLive ? 'DEEP FOCUS' : 'SESSION ENDED')}
              </Text>
            </View>
          </View>
        </View>

        {isHost && (
          <View style={styles.hostControls}>
            <Text style={styles.hostBadgeText}>👑 HOST CONTROLS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hostButtonsRow}>
              <AnimatedPressable style={styles.hostBtnPrimary} onPress={() => handleHostAction('add')}>
                <Ionicons name="add" size={18} color="#fff" /><Text style={styles.hostBtnText}>5 Min</Text>
              </AnimatedPressable>
              <AnimatedPressable style={styles.hostBtnSecondary} onPress={() => handleHostAction('sub')}>
                <Ionicons name="remove" size={18} color="#cbd5e1" /><Text style={styles.hostBtnTextSecondary}>5 Min</Text>
              </AnimatedPressable>
              <AnimatedPressable style={styles.hostBtnWarning} onPress={() => handleHostAction('pause')}>
                <Ionicons name={sessionData.isPaused ? "play" : "pause"} size={18} color="#f59e0b" />
                <Text style={[styles.hostBtnText, {color: '#f59e0b'}]}>{sessionData.isPaused ? 'Resume' : 'Pause'}</Text>
              </AnimatedPressable>
              <AnimatedPressable style={styles.hostBtnDanger} onPress={() => handleHostAction('end')}>
                <Ionicons name="stop" size={18} color="#ef4444" /><Text style={styles.hostBtnTextDanger}>End</Text>
              </AnimatedPressable>
            </ScrollView>
          </View>
        )}

        <View style={styles.musicController}>
          <LinearGradient colors={['rgba(30, 27, 75, 0.8)', 'rgba(15, 23, 42, 0.9)']} style={StyleSheet.absoluteFill} borderRadius={24} />
          
          <View style={styles.musicInfo}>
            <View style={styles.musicIconBg}><Ionicons name="musical-notes" size={24} color="#a78bfa" /></View>
            <View style={{ marginLeft: 15, flex: 1 }}>
              <Text style={styles.musicTitle} numberOfLines={1}>{LOFI_TRACKS[currentTrackIndex].title}</Text>
              <Text style={styles.musicSub} numberOfLines={1}>{LOFI_TRACKS[currentTrackIndex].artist} • High Quality</Text>
            </View>
          </View>

          <View style={styles.musicActions}>
            <AnimatedPressable onPress={() => changeTrack('prev')} style={styles.skipBtn}><Ionicons name="play-skip-back" size={22} color="#cbd5e1" /></AnimatedPressable>
            <AnimatedPressable onPress={toggleMusic} style={styles.musicPlayBtn}>
              <Ionicons name={isPlayingMusic ? "pause" : "play"} size={22} color="#fff" style={{ marginLeft: isPlayingMusic ? 0 : 3 }} />
            </AnimatedPressable>
            <AnimatedPressable onPress={() => changeTrack('next')} style={styles.skipBtn}><Ionicons name="play-skip-forward" size={22} color="#cbd5e1" /></AnimatedPressable>
          </View>
        </View>

        <View style={styles.logsContainer}>
          <View style={styles.logsHeader}>
            <Ionicons name="radio-outline" size={16} color="#10b981" />
            <Text style={styles.logsTitle}>Live Server Logs</Text>
          </View>
          <ScrollView 
            style={styles.logsScroll} 
            showsVerticalScrollIndicator={false}
            ref={scrollViewRef}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {logs.map((log: string, idx: number) => {
              const cleanText = log.replace(/[🟢🔴⚠️▶️⏸️⏳🛑]/g, '').trim();
              return (
                <View key={idx} style={styles.logRow}>
                  {renderLogIcon(log)}
                  <Text style={styles.logText}>{cleanText}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.footer}>
          {/* 🔥 NEW CLEAN EXIT BUTTON (Cross-Platform Safe) 🔥 */}
          <AnimatedPressable 
            style={styles.exitBtn} 
            onPress={handleExitRoom}
          >
            <Ionicons name="exit-outline" size={20} color="#ef4444" />
            <Text style={styles.exitBtnText}>Exit Session</Text>
          </AnimatedPressable>
        </View>

      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, 
  safeArea: { flex: 1, justifyContent: 'space-between' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 25, paddingTop: Platform.OS === 'android' ? 45 : 20 },
  roomName: { color: '#f8fafc', fontSize: 26, fontWeight: '900', letterSpacing: 1.5, fontFamily: Platform.OS === 'ios' ? 'AvenirNext-Heavy' : 'sans-serif-condensed' },
  hostText: { color: '#a78bfa', fontSize: 12, fontWeight: '800', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  
  avatarsContainer: { flexDirection: 'row', position: 'relative', width: 120, height: 44 },
  avatarWrapper: { position: 'absolute' },
  avatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: '#020617' },
  onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#10b981', borderWidth: 2, borderColor: '#020617' },
  moreAvatar: { backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  moreAvatarText: { color: '#fff', fontSize: 12, fontWeight: '900' },

  timerWrapper: { alignItems: 'center', justifyContent: 'center', flex: 1, marginTop: 10 },
  timerRing: { position: 'absolute', borderRadius: 1000 },
  ringLive: { backgroundColor: '#4f46e5' },
  ringEnded: { backgroundColor: '#ef4444' },
  ringPaused: { backgroundColor: '#f59e0b' },
  
  timerCircle: { width: width * 0.65, height: width * 0.65, borderRadius: width * 0.325, borderWidth: 2, borderColor: 'rgba(79, 70, 229, 0.4)', justifyContent: 'center', alignItems: 'center', backgroundColor: '#020617', shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.6, shadowRadius: 40, elevation: 20 },
  circleEnded: { borderColor: 'rgba(239, 68, 68, 0.4)', shadowColor: '#ef4444' },
  circlePaused: { borderColor: 'rgba(245, 158, 11, 0.4)', shadowColor: '#f59e0b' },
  
  timerText: { fontSize: 75, fontWeight: '200', color: '#f8fafc', fontVariant: ['tabular-nums'], letterSpacing: -2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginTop: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginRight: 8 },
  statusText: { color: '#10b981', fontSize: 12, fontWeight: '800', letterSpacing: 2 },

  hostControls: { alignItems: 'center', marginBottom: 15 },
  hostBadgeText: { color: '#fbbf24', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8 },
  hostButtonsRow: { paddingHorizontal: 20, gap: 10 },
  hostBtnPrimary: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4f46e5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, elevation: 5 },
  hostBtnSecondary: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  hostBtnWarning: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)' },
  hostBtnDanger: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  hostBtnText: { color: '#fff', fontWeight: '800', marginLeft: 6, fontSize: 13 },
  hostBtnTextSecondary: { color: '#cbd5e1', fontWeight: '800', marginLeft: 6, fontSize: 13 },
  hostBtnTextDanger: { color: '#ef4444', fontWeight: '800', marginLeft: 6, fontSize: 13 },

  musicController: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, padding: 15, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  musicInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  musicIconBg: { backgroundColor: 'rgba(167, 139, 250, 0.15)', padding: 12, borderRadius: 16 },
  musicTitle: { color: '#f8fafc', fontSize: 15, fontWeight: '800' },
  musicSub: { color: '#94a3b8', fontSize: 12, marginTop: 3, fontWeight: '600' },
  musicActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skipBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20 },
  musicPlayBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center', shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10 },

  logsContainer: { height: 110, marginHorizontal: 20, marginTop: 15, backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  logsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: 8 },
  logsTitle: { color: '#cbd5e1', fontWeight: '800', fontSize: 11, textTransform: 'uppercase', marginLeft: 6, letterSpacing: 1 },
  logsScroll: { flex: 1 },
  logRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  logText: { color: '#94a3b8', fontSize: 12, fontWeight: '500', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', flex: 1, lineHeight: 18 },
  
  footer: { alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 30 : 20, paddingTop: 15 },
  exitBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 25, paddingVertical: 14, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  exitBtnText: { color: '#ef4444', fontSize: 14, fontWeight: '800', marginLeft: 8, letterSpacing: 0.5 }
});