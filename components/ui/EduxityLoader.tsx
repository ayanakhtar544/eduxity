import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolateColor,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated';
import { Image } from 'expo-image';

export default function EduxityLoader() {
  const progress = useSharedValue(0);
  const transitionProgress = useSharedValue(0);
  
  // State for demonstration only, replace with real data loading state in parent
  const [loadingState, setLoadingState] = useState<'loading' | 'success'>('loading');

  useEffect(() => {
    // 🎭 Starts the snappy, brutalist geometric loop 
    progress.value = withRepeat(
      withTiming(1, { 
        duration: 900, 
        easing: Easing.bezier(0.85, 0, 0.15, 1) 
      }),
      -1, 
      true 
    );

    // ⏳ Simulates loading completion after 3 seconds
    const timer = setTimeout(() => {
      setLoadingState('success');
    }, 3000);

    return () => {
      cancelAnimation(progress);
      clearTimeout(timer);
    };
  }, []);

  // 🎬 Trigger the final transition when loading is successful
  useEffect(() => {
    if (loadingState === 'success') {
      transitionProgress.value = withTiming(1, { 
        duration: 800, 
        easing: Easing.bezier(0.65, 0, 0.35, 1) 
      });
    }
  }, [loadingState]);

  // ==========================================
  // 🎭 MORPHING GEOMETRY STYLE
  // ==========================================
  const shapeStyle = useAnimatedStyle(() => {
    const currentMorph = interpolate(transitionProgress.value, [0, 1], [interpolate(progress.value, [0, 1], [4, 24]), 24]);
    const currentRotate = interpolate(transitionProgress.value, [0, 1], [interpolate(progress.value, [0, 1], [0, 180]), 180]);
    const currentScale = interpolate(transitionProgress.value, [0, 1], [interpolate(progress.value, [0, 0.5, 1], [1, 0.5, 1]), 1]);
    const currentOpacity = interpolate(transitionProgress.value, [0, 1], [1, 0]); 

    return {
      borderRadius: currentMorph,
      opacity: currentOpacity,
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        ['#0f172a', '#4f46e5']
      ),
      transform: [
        { rotate: `${currentRotate}deg` },
        { scale: currentScale }
      ],
    };
  });

  // ==========================================
  // 🚀 LOGO TRANSITION STYLE
  // ==========================================
  const logoContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(transitionProgress.value, [0, 1], [0, 1]),
      transform: [
        { scale: interpolate(transitionProgress.value, [0, 1], [0.8, 1]) }
      ],
      shadowOpacity: interpolate(transitionProgress.value, [0, 1], [0, 0.3]),
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.masterWrapper}>
        
        {/* THE GEOMETRIC SHAPE */}
        <Animated.View style={[styles.shape, shapeStyle]} />
        
        {/* THE LOGO */}
        <Animated.View style={[styles.logoOverlay, logoContainerStyle]}>
           <Image 
             source={require('../../assets/images/logo.png')} // 🔥 LOCAL PATH LAGA DIYA HAI
             style={styles.logoImage}
             contentFit="contain" 
             transition={100} 
           />
        </Animated.View>
        
      </View>
    </View>
  );
}

// 🖤 ABSOLUTE MINIMALIST Brutalism
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent', // Transparent background taaki kisi bhi page me blend ho jaye
    minHeight: 200,
  },
  masterWrapper: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shape: {
    width: 48,
    height: 48,
    position: 'absolute',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  logoOverlay: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  logoImage: { 
    width: '100%', 
    height: '100%',
    borderRadius: 30, 
    overflow: 'hidden', 
  },
});