import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, { FadeOutUp, SlideInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

// Store Import
import { useRewardStore } from '../store/useRewardStore';

export default function RewardOverlay() {
  const { isVisible, data } = useRewardStore();

  // Agar visible nahi hai ya data nahi hai, toh kuch mat dikhao
  if (!isVisible || !data) return null;

  const hasPoints = (data.xpEarned || 0) > 0 || (data.coinsEarned || 0) > 0;

  return (
    // pointerEvents="none" ka matlab ye tere kisi bhi click ko block nahi करेगा
    <View style={styles.toastContainer} pointerEvents="none">
      
      {/* ⚡ XP & Coins Pill */}
      {hasPoints && (
        <Animated.View 
          entering={SlideInUp.springify().damping(15)} 
          exiting={FadeOutUp.duration(300)} 
          style={styles.toastPill}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="flash" size={16} color="#f59e0b" />
          </View>
          <Text style={styles.toastText}>
            {data.xpEarned ? `+${data.xpEarned} XP` : ''} 
            {data.coinsEarned ? `  •  +${data.coinsEarned} Coins` : ''}
          </Text>
        </Animated.View>
      )}

      {/* 🌟 Level Up / Badge Pill (Ye sirf tab dikhega jab naya level ya badge milega) */}
      {(data.leveledUp || (data.newBadges && data.newBadges.length > 0)) && (
        <Animated.View 
          entering={SlideInUp.delay(100).springify().damping(15)} 
          exiting={FadeOutUp.duration(300)} 
          style={[styles.toastPill, { marginTop: 8, backgroundColor: '#4f46e5' }]}
        >
          <Ionicons name="trophy" size={16} color="#fff" />
          <Text style={[styles.toastText, { color: '#fff', marginLeft: 6 }]}>
            {data.leveledUp ? `Level ${data.newLevel} Unlocked!` : `New Badge Unlocked!`}
          </Text>
        </Animated.View>
      )}
      
    </View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30, // Screen ke top par
    left: 0, right: 0,
    alignItems: 'center',
    zIndex: 99999, elevation: 99999,
  },
  toastPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 30,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 5, borderWidth: 1, borderColor: '#f1f5f9',
  },
  iconCircle: {
    backgroundColor: '#fef3c7',
    width: 24, height: 24, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 8,
  },
  toastText: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
});