import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, 
  Dimensions, Image, ActivityIndicator, Alert, Platform 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, useAnimatedStyle, withSpring, withTiming, 
  interpolate, Extrapolation, runOnJS 
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { auth, db } from '../../firebaseConfig';
import { collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.25;

export default function MatchmakingScreen() {
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;

  // 🧠 STATES
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // 🌀 REANIMATED VALUES
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);

  // ==========================================
  // 📡 FETCH POTENTIAL STUDY PARTNERS
  // ==========================================
  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUid) return;
      try {
        // Asli app mein hum yahan complex query lagayenge (e.g., target match, location)
        // Abhi ke liye get all users except current user
        const q = query(collection(db, 'users'), where('uid', '!=', currentUid));
        const querySnapshot = await getDocs(q);
        
        const fetchedProfiles = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.displayName || 'IITian in Making',
            avatar: data.photoURL || `https://ui-avatars.com/api/?name=${data.displayName}&background=random`,
            target: data.targetExam || 'JEE Advanced 2026',
            strong: data.strongSubject || 'Physics',
            weak: data.weakSubject || 'Chemistry',
            bio: data.bio || "Looking for a serious study partner to clear backlogs and give mock tests together!"
          };
        });

        // Agar DB mein users nahi hain, toh UI test karne ke liye dummy data daal dete hain
        if (fetchedProfiles.length === 0) {
          setProfiles([
            { id: '1', name: 'Ayaan Akhtar', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', target: 'JEE Mains', strong: 'Maths', weak: 'Physics', bio: 'Night owl 🦉. Need someone to practice HC Verma with.' },
            { id: '2', name: 'Mahira Khan', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', target: 'NEET 2026', strong: 'Biology', weak: 'Physics', bio: 'Very disciplined. Let us keep each other accountable!' },
            { id: '3', name: 'Tasya', avatar: 'https://randomuser.me/api/portraits/women/68.jpg', target: 'JEE Advanced', strong: 'Chemistry', weak: 'Maths', bio: 'Organic chemistry is love. I can teach you Chem if you help me in Calculus.' }
          ]);
        } else {
          setProfiles(fetchedProfiles);
        }
      } catch (error) {
        console.log("Error fetching profiles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUid]);

  const currentProfile = profiles[currentIndex];

  // ==========================================
  // 🤝 HANDLE CONNECTIONS
  // ==========================================
  const handleSwipeComplete = async (direction: 'right' | 'left') => {
    if (direction === 'right' && currentProfile && currentUid) {
      // Send Connection Request in Firebase
      try {
        await addDoc(collection(db, 'connections'), {
          senderId: currentUid,
          receiverId: currentProfile.id,
          status: 'pending',
          createdAt: serverTimestamp()
        });
        console.log("Connection Request Sent to:", currentProfile.name);
      } catch (error) {
        console.log("Failed to send request:", error);
      }
    }

    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(prev => prev + 1);
      // Reset Card Position
      translateX.value = 0;
      translateY.value = 0;
      rotate.value = 0;
      scale.value = 1;
    } else {
      setCurrentIndex(profiles.length); // End of list
    }
  };

  // ==========================================
  // 👉 TINDER SWIPE GESTURE
  // ==========================================
  const panGesture = Gesture.Pan()
    .onStart(() => {
      scale.value = withTiming(1.02);
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      rotate.value = interpolate(event.translationX, [-width / 2, width / 2], [-10, 10], Extrapolation.CLAMP);
    })
    .onEnd(() => {
      scale.value = withTiming(1);
      if (translateX.value > SWIPE_THRESHOLD) {
        // SWIPE RIGHT (CONNECT)
        translateX.value = withSpring(width + 100, { velocity: 50 });
        runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
        runOnJS(handleSwipeComplete)('right');
      } else if (translateX.value < -SWIPE_THRESHOLD) {
        // SWIPE LEFT (SKIP)
        translateX.value = withSpring(-width - 100, { velocity: 50 });
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        runOnJS(handleSwipeComplete)('left');
      } else {
        // SNAP BACK TO CENTER
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotate.value = withSpring(0);
      }
    });

  const swipeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotateZ: `${rotate.value}deg` },
      { scale: scale.value }
    ],
  }));

  const nopeOpacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, -SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP)
  }));

  const likeOpacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP)
  }));

  // ==========================================
  // 🎨 RENDER UI
  // ==========================================
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Finding serious aspirants...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        
        {/* 🔝 HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={28} color="#f8fafc" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Study Partners</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/connections')}>
            <Ionicons name="people" size={24} color="#f8fafc" />
          </TouchableOpacity>
        </View>

        {/* 🃏 SWIPE CARD AREA */}
        <View style={styles.cardArea}>
          {currentIndex >= profiles.length ? (
            // EMPTY STATE
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBg}><Ionicons name="planet" size={60} color="#4f46e5" /></View>
              <Text style={styles.emptyTitle}>You've seen them all!</Text>
              <Text style={styles.emptySub}>Check back later for new aspirants looking for a partner.</Text>
              <TouchableOpacity style={styles.refreshBtn} onPress={() => router.back()}>
                <Text style={styles.refreshBtnText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // TINDER CARD
            <GestureDetector gesture={panGesture}>
              <Animated.View style={[styles.cardWrapper, swipeAnimatedStyle]}>
                
                {/* 🔴 NOPE BADGE */}
                <Animated.View style={[styles.badge, styles.nopeBadge, nopeOpacityStyle]}>
                  <Text style={styles.nopeText}>SKIP</Text>
                </Animated.View>

                {/* 🟢 LIKE BADGE */}
                <Animated.View style={[styles.badge, styles.likeBadge, likeOpacityStyle]}>
                  <Text style={styles.likeText}>CONNECT</Text>
                </Animated.View>

                <View style={styles.card}>
                  <Image source={{ uri: currentProfile.avatar }} style={styles.profileImage} />
                  
                  <LinearGradient colors={['transparent', 'rgba(2, 6, 23, 0.95)', '#020617']} style={styles.cardGradient}>
                    <View style={styles.cardContent}>
                      <Text style={styles.profileName}>{currentProfile.name}</Text>
                      
                      <View style={styles.targetBadge}>
                        <Ionicons name="flag" size={14} color="#fde047" style={{marginRight: 5}}/>
                        <Text style={styles.targetText}>Target: {currentProfile.target}</Text>
                      </View>

                      <Text style={styles.bioText}>"{currentProfile.bio}"</Text>

                      <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                          <Text style={styles.statLabel}>💪 STRONG IN</Text>
                          <Text style={[styles.statValue, {color: '#10b981'}]}>{currentProfile.strong}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                          <Text style={styles.statLabel}>⚠️ WEAK IN</Text>
                          <Text style={[styles.statValue, {color: '#ef4444'}]}>{currentProfile.weak}</Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              </Animated.View>
            </GestureDetector>
          )}
        </View>

        {/* 🎛️ BOTTOM CONTROLS */}
        {currentIndex < profiles.length && (
          <View style={styles.footerControls}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.skipBtn]} 
              activeOpacity={0.8}
              onPress={() => {
                translateX.value = withSpring(-width - 100);
                setTimeout(() => handleSwipeComplete('left'), 300);
              }}
            >
              <Ionicons name="close" size={36} color="#ef4444" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, styles.connectBtn]} 
              activeOpacity={0.8}
              onPress={() => {
                translateX.value = withSpring(width + 100);
                setTimeout(() => handleSwipeComplete('right'), 300);
              }}
            >
              <Ionicons name="flash" size={32} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// ==========================================
// 🎨 ULTRA PREMIUM STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' }, 
  loadingText: { color: '#94a3b8', marginTop: 15, fontWeight: '700', fontSize: 16 },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 10 },
  iconBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#f8fafc', letterSpacing: 0.5 },

  cardArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardWrapper: { width: width * 0.9, height: height * 0.68, position: 'relative' },
  
  card: { width: '100%', height: '100%', backgroundColor: '#0f172a', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#1e293b', elevation: 10, shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
  profileImage: { width: '100%', height: '100%', position: 'absolute' },
  cardGradient: { position: 'absolute', bottom: 0, width: '100%', height: '60%', justifyContent: 'flex-end', padding: 20 },
  
  cardContent: { width: '100%' },
  profileName: { fontSize: 32, fontWeight: '900', color: '#fff', marginBottom: 8, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 5 },
  targetBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(253, 224, 71, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 15, borderWidth: 1, borderColor: 'rgba(253, 224, 71, 0.3)' },
  targetText: { color: '#fde047', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  bioText: { color: '#cbd5e1', fontSize: 15, fontWeight: '500', lineHeight: 22, marginBottom: 20, fontStyle: 'italic' },
  
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  statLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '900' },

  // Swipe Badges
  badge: { position: 'absolute', top: 40, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 12, borderWidth: 4, zIndex: 100, transform: [{rotate: '-15deg'}] },
  nopeBadge: { right: 40, borderColor: '#ef4444', transform: [{rotate: '15deg'}] },
  nopeText: { color: '#ef4444', fontSize: 32, fontWeight: '900', letterSpacing: 2 },
  likeBadge: { left: 40, borderColor: '#10b981' },
  likeText: { color: '#10b981', fontSize: 32, fontWeight: '900', letterSpacing: 2 },

  // Bottom Controls
  footerControls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 40 : 20, gap: 30, marginTop: 10 },
  actionBtn: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  skipBtn: { backgroundColor: '#0f172a', borderWidth: 2, borderColor: '#ef4444', shadowColor: '#ef4444' },
  connectBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#4f46e5', shadowColor: '#4f46e5', borderWidth: 2, borderColor: '#818cf8' },

  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  emptyIconBg: { backgroundColor: 'rgba(79, 70, 229, 0.1)', padding: 30, borderRadius: 60, marginBottom: 20 },
  emptyTitle: { fontSize: 24, fontWeight: '900', color: '#f8fafc', marginBottom: 10 },
  emptySub: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  refreshBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 20 },
  refreshBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 }
});