import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, 
  Dimensions, Image, ActivityIndicator, Platform 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
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

export default function SwipeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); 
  const currentUid = auth.currentUser?.uid;

  const classLevel = (params.classLevel as string) || 'Any Class';
  const targetExam = (params.targetExam as string) || 'Any Exam';
  const needHelpIn = (params.needHelpIn as string) || 'General';
  const canTeach = (params.canTeach as string) || 'General';

  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);

  // ==========================================
  // 📡 THE "EASY & FORGIVING" FETCH ENGINE
  // ==========================================
  const fetchMatches = useCallback(async () => {
    if (!currentUid) return;
    setLoading(true);
    try {
      const connRef = collection(db, 'connections');
      const [sentSnap, receivedSnap] = await Promise.all([
        getDocs(query(connRef, where('senderId', '==', currentUid))), 
        getDocs(query(connRef, where('receiverId', '==', currentUid)))
      ]);
      
      const existingUids = new Set<string>();
      sentSnap.forEach(doc => existingUids.add(doc.data().receiverId));
      receivedSnap.forEach(doc => existingUids.add(doc.data().senderId));

      const usersQuery = query(collection(db, 'users'), where('uid', '!=', currentUid));
      const usersSnap = await getDocs(usersQuery);
      
      let scoredMatches: any[] = [];

      usersSnap.forEach(doc => {
        const u = doc.data();
        if (existingUids.has(u.uid)) return; 

        let matchScore = 0;
        let matchReason = "New on Eduxity"; // Default reason
        let badgeColor = "#64748b"; 

        const userClass = (u.classLevel || u.roleDetail || u.class || '').toLowerCase(); 
        const userTarget = (u.targetExam || u.target || '').toLowerCase();
        
        // 🧠 Combine all possible fields to make matching easy!
        const allSkillsStr = JSON.stringify([u.strongSubject, u.strongSubjects, u.skills, u.interests]).toLowerCase();
        const allWeaknessesStr = JSON.stringify([u.weakSubject, u.weakSubjects, u.needsHelpIn]).toLowerCase();

        // 🧮 EASY SCORING LOGIC
        if (needHelpIn !== 'General' && allSkillsStr.includes(needHelpIn.toLowerCase())) { 
          matchScore += 100; matchReason = `Expert in ${needHelpIn}`; badgeColor = "#ec4899"; 
        }
        if (targetExam !== 'Any Exam' && userTarget.includes(targetExam.toLowerCase())) { 
          matchScore += 50; 
          if(matchScore === 50) { matchReason = `Preparing for ${targetExam}`; badgeColor = "#fde047"; }
        }
        if (classLevel !== 'Any Class' && userClass.includes(classLevel.toLowerCase())) { 
          matchScore += 30; 
          if(matchScore === 30) { matchReason = `Also in ${classLevel}`; badgeColor = "#38bdf8"; } 
        }
        if (canTeach !== 'General' && allWeaknessesStr.includes(canTeach.toLowerCase())) { 
          matchScore += 60; 
          matchReason = "Mutual Benefit (Perfect Match)"; badgeColor = "#10b981"; 
        }

        // 🔥 THE MAGIC: Push EVERYONE into the array, even if score is 0.
        scoredMatches.push({
          id: doc.id,
          uid: u.uid,
          name: u.displayName || u.name || 'Scholar',
          avatar: u.photoURL || u.profilePic || `https://ui-avatars.com/api/?name=${u.displayName || 'User'}&background=random`,
          bio: u.bio || `Exploring Eduxity to find some good study partners!`,
          target: u.targetExam || 'Aspirant',
          classLabel: u.classLevel || u.roleDetail || 'Student',
          matchScore,
          matchReason,
          badgeColor,
          tags: (u.interests || u.skills || ['Hardworker']).slice(0, 3), 
        });
      });

      // Sort by highest score. (0 scores will go to the bottom)
      scoredMatches.sort((a, b) => b.matchScore - a.matchScore);
      
      setProfiles(scoredMatches);
      setCurrentIndex(0); 
      
      translateX.value = 0; translateY.value = 0; rotate.value = 0; scale.value = 1;
    } catch (error) {
      console.error("Matchmaking Error:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUid, classLevel, targetExam, needHelpIn, canTeach]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const currentProfile = profiles[currentIndex];

  const handleSwipeComplete = async (direction: 'right' | 'left') => {
    if (direction === 'right' && currentProfile && currentUid) {
      try {
        await addDoc(collection(db, 'connections'), {
          senderId: currentUid,
          senderName: auth.currentUser?.displayName || "Student",
          senderAvatar: auth.currentUser?.photoURL || "",
          receiverId: currentProfile.uid, 
          receiverName: currentProfile.name,
          receiverAvatar: currentProfile.avatar,
          status: 'pending',
          matchReason: currentProfile.matchReason, 
          timestamp: serverTimestamp()
        });
      } catch (error) { 
        console.log("Failed to send request:", error); 
      }
    }

    if (currentIndex < profiles.length) {
      setCurrentIndex(prev => prev + 1);
      translateX.value = 0; translateY.value = 0; rotate.value = 0; scale.value = 1;
    }
  };

  const handleRestart = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    fetchMatches(); // Reloads entirely from DB
  };

  const panGesture = Gesture.Pan()
    .onStart(() => { scale.value = withTiming(1.02); })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      rotate.value = interpolate(event.translationX, [-width / 2, width / 2], [-10, 10], Extrapolation.CLAMP);
    })
    .onEnd(() => {
      scale.value = withTiming(1);
      if (translateX.value > SWIPE_THRESHOLD) {
        translateX.value = withSpring(width + 100, { velocity: 50 });
        runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
        runOnJS(handleSwipeComplete)('right');
      } else if (translateX.value < -SWIPE_THRESHOLD) {
        translateX.value = withSpring(-width - 100, { velocity: 50 });
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        runOnJS(handleSwipeComplete)('left');
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotate.value = withSpring(0);
      }
    });

  const swipeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { rotateZ: `${rotate.value}deg` }, { scale: scale.value }],
  }));

  const nopeOpacityStyle = useAnimatedStyle(() => ({ opacity: interpolate(translateX.value, [0, -SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP) }));
  const likeOpacityStyle = useAnimatedStyle(() => ({ opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP) }));

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#ec4899" />
        <Text style={styles.loadingText}>Fetching available profiles...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={28} color="#f8fafc" />
          </TouchableOpacity>
          <View style={{alignItems: 'center'}}>
            <Text style={styles.headerTitle}>Network</Text>
            <Text style={styles.headerSub}>{targetExam !== 'Any Exam' ? targetExam : 'All Users'}</Text>
          </View>
          <View style={{width: 40}} />
        </View>

        <View style={styles.cardArea}>
          {profiles.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBg}><Ionicons name="search-outline" size={60} color="#ec4899" /></View>
              <Text style={styles.emptyTitle}>You're the first one here!</Text>
              <Text style={styles.emptySub}>Share the app with your friends to start building a network.</Text>
            </View>
          ) : currentIndex >= profiles.length ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBg}><Ionicons name="radar-outline" size={60} color="#ec4899" /></View>
              <Text style={styles.emptyTitle}>You've seen everyone!</Text>
              <Text style={styles.emptySub}>Want to give the people you passed on another chance?</Text>
              
              <View style={styles.emptyBtnRow}>
                <TouchableOpacity style={styles.restartBtn} onPress={handleRestart}>
                  <Ionicons name="refresh" size={18} color="#fff" style={{marginRight: 6}} />
                  <Text style={styles.restartBtnText}>Shuffle Again</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <GestureDetector gesture={panGesture}>
              <Animated.View style={[styles.cardWrapper, swipeAnimatedStyle]}>
                
                <Animated.View style={[styles.badge, styles.nopeBadge, nopeOpacityStyle]}><Text style={styles.nopeText}>PASS</Text></Animated.View>
                <Animated.View style={[styles.badge, styles.likeBadge, likeOpacityStyle]}><Text style={styles.likeText}>CONNECT</Text></Animated.View>

                <View style={styles.card}>
                  <Image source={{ uri: currentProfile.avatar }} style={styles.profileImage} />
                  <LinearGradient colors={['transparent', 'rgba(2, 6, 23, 0.85)', '#020617']} style={styles.cardGradient}>
                    <View style={styles.cardContent}>
                      
                      {currentProfile.matchScore > 0 && (
                        <View style={[styles.matchHighlightBadge, { backgroundColor: currentProfile.badgeColor + '20', borderColor: currentProfile.badgeColor }]}>
                          <Ionicons name="sparkles" size={12} color={currentProfile.badgeColor} />
                          <Text style={[styles.matchHighlightText, { color: currentProfile.badgeColor }]}>{currentProfile.matchReason}</Text>
                        </View>
                      )}

                      <Text style={styles.profileName}>{currentProfile.name}</Text>
                      <Text style={styles.targetText}>{currentProfile.target || currentProfile.classLabel}</Text>
                      <Text style={styles.bioText} numberOfLines={2}>"{currentProfile.bio}"</Text>
                      
                      <View style={styles.tagsRow}>
                        {currentProfile.tags.map((tag: string, idx: number) => (
                          <View key={idx} style={styles.skillTag}>
                            <Text style={styles.skillTagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>

                    </View>
                  </LinearGradient>
                </View>

              </Animated.View>
            </GestureDetector>
          )}
        </View>

        {currentIndex < profiles.length && profiles.length > 0 && (
          <View style={styles.footerControls}>
            <TouchableOpacity style={[styles.actionBtn, styles.skipBtn]} activeOpacity={0.8} onPress={() => { translateX.value = withSpring(-width - 100); setTimeout(() => handleSwipeComplete('left'), 300); }}>
              <Ionicons name="close" size={36} color="#ef4444" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.connectBtn]} activeOpacity={0.8} onPress={() => { translateX.value = withSpring(width + 100); setTimeout(() => handleSwipeComplete('right'), 300); }}>
              <Ionicons name="flash" size={32} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' }, 
  loadingText: { color: '#a78bfa', marginTop: 15, fontWeight: '700', fontSize: 14, letterSpacing: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 10 },
  iconBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#f8fafc', letterSpacing: 0.5 },
  headerSub: { color: '#ec4899', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginTop: 2 },
  
  cardArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardWrapper: { width: width * 0.9, height: height * 0.68, position: 'relative' },
  card: { width: '100%', height: '100%', backgroundColor: '#0f172a', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#1e293b', elevation: 10, shadowColor: '#ec4899', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
  profileImage: { width: '100%', height: '100%', position: 'absolute' },
  cardGradient: { position: 'absolute', bottom: 0, width: '100%', height: '75%', justifyContent: 'flex-end', padding: 20 },
  cardContent: { width: '100%' },
  
  matchHighlightBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 10, borderWidth: 1 },
  matchHighlightText: { fontSize: 11, fontWeight: '900', marginLeft: 5, letterSpacing: 0.5 },
  profileName: { fontSize: 34, fontWeight: '900', color: '#fff', marginBottom: 4, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 10 },
  targetText: { color: '#fde047', fontSize: 14, fontWeight: '800', marginBottom: 12 },
  bioText: { color: '#cbd5e1', fontSize: 15, fontWeight: '500', lineHeight: 22, marginBottom: 20, fontStyle: 'italic' },
  
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillTag: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  skillTagText: { color: '#f8fafc', fontSize: 12, fontWeight: '700' },

  badge: { position: 'absolute', top: 40, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 12, borderWidth: 4, zIndex: 100, transform: [{rotate: '-15deg'}] },
  nopeBadge: { right: 40, borderColor: '#ef4444', transform: [{rotate: '15deg'}] },
  nopeText: { color: '#ef4444', fontSize: 32, fontWeight: '900', letterSpacing: 2 },
  likeBadge: { left: 40, borderColor: '#10b981' },
  likeText: { color: '#10b981', fontSize: 32, fontWeight: '900', letterSpacing: 2 },
  
  footerControls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 40 : 20, gap: 30, marginTop: 10 },
  actionBtn: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  skipBtn: { backgroundColor: '#0f172a', borderWidth: 2, borderColor: '#ef4444', shadowColor: '#ef4444' },
  connectBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ec4899', shadowColor: '#ec4899', borderWidth: 2, borderColor: '#fbcfe8' },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  emptyIconBg: { backgroundColor: 'rgba(236, 72, 153, 0.1)', padding: 30, borderRadius: 60, marginBottom: 20 },
  emptyTitle: { fontSize: 24, fontWeight: '900', color: '#f8fafc', marginBottom: 10, textAlign: 'center' },
  emptySub: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  
  emptyBtnRow: { flexDirection: 'row', gap: 15 },
  restartBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ec4899', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20 },
  restartBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 }
});