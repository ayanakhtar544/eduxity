import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';

// Dhyan de: Yahan 'export default function' likha hona zaroori hai!
export default function SkeletonPost() {
  const pulseAnim = useSharedValue(0.5);
  
  useEffect(() => { 
    pulseAnim.value = withRepeat(withTiming(1, { duration: 1000 }), -1, true); 
  }, []);
  
  const animStyle = useAnimatedStyle(() => ({ opacity: pulseAnim.value }));
  
  return (
    <Animated.View style={[styles.postCard, styles.skeletonCard, animStyle]}>
      <View style={styles.postHeader}>
        <View style={styles.skeletonAvatar} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={styles.skeletonTextLine} />
          <View style={[styles.skeletonTextLine, { width: '40%', marginTop: 6 }]} />
        </View>
      </View>
      <View style={[styles.skeletonTextLine, { width: '90%', height: 14, marginHorizontal: 15, marginTop: 10 }]} />
      <View style={[styles.skeletonTextLine, { width: '70%', height: 14, marginHorizontal: 15, marginTop: 8 }]} />
      <View style={styles.skeletonBox} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  postCard: { backgroundColor: '#fff', marginHorizontal: 10, marginTop: 10, marginBottom: 5, borderRadius: 16, overflow: 'hidden', elevation: 2, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  skeletonCard: { padding: 0, paddingBottom: 20 },
  postHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingTop: 15, marginBottom: 12 },
  skeletonAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#e2e8f0' },
  skeletonTextLine: { height: 12, backgroundColor: '#e2e8f0', borderRadius: 6, width: '80%' },
  skeletonBox: { height: 200, backgroundColor: '#f8fafc', marginHorizontal: 15, marginTop: 15, borderRadius: 12 },
});