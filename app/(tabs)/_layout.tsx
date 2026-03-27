import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics'; 
import EduxityLoader from '../../components/EduxityLoader'; 
import Animated, { 
  useSharedValue, useAnimatedStyle, withSpring, withTiming 
} from 'react-native-reanimated';

// ==========================================
// 🌟 1. MINIMAL & ELEGANT TAB BUTTON
// ==========================================
const TabButton = ({ item, onPress, accessibilityState }: any) => {
  const focused = accessibilityState.selected;
  
  // Minimal Animation Values
  const scale = useSharedValue(1);
  const indicatorScale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Subtle scale up for the icon
    scale.value = withSpring(focused ? 1.1 : 1, { damping: 15, stiffness: 150 });
    
    // Smooth indicator dot animation
    indicatorScale.value = withSpring(focused ? 1 : 0, { damping: 15, stiffness: 150 });
    opacity.value = withTiming(focused ? 1 : 0, { duration: 150 });
  }, [focused]);

  const animatedIconStyle = useAnimatedStyle(() => {
    return { transform: [{ scale: scale.value }] };
  });

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: indicatorScale.value }],
    };
  });

  // Pure Light Mode Colors
  const activeColor = '#4f46e5'; 
  const inactiveColor = '#64748b';

  return (
    <TouchableOpacity 
      onPress={(e) => {
        // Apple style soft haptic feedback
        if (Platform.OS !== 'web') Haptics.selectionAsync(); 
        onPress(e);
      }} 
      activeOpacity={0.6} 
      style={styles.tabButton}
    >
      <Animated.View style={animatedIconStyle}>
        <Ionicons 
          name={focused ? item.activeIcon : item.inactiveIcon} 
          size={24} 
          color={focused ? activeColor : inactiveColor} 
        />
      </Animated.View>
      
      {/* Subtle bottom dot instead of a big bubble */}
      <Animated.View style={[styles.indicatorDot, animatedIndicatorStyle, { backgroundColor: activeColor, shadowColor: activeColor }]} />
    </TouchableOpacity>
  );
};

// ==========================================
// 🍏 2. APPLE-STYLE GLASSY DOCK
// ==========================================
const CustomTabBar = ({ state, descriptors, navigation }: any) => {

  return (
    <View style={[
      styles.floatingWrapper, 
      // Solid White Fallback for Android
      { backgroundColor: Platform.OS === 'android' ? 'rgba(255,255,255,0.95)' : 'transparent' }
    ]}>
      {/* 🍏 Light Tint Glass Effect restored */}
      <BlurView 
        intensity={80} 
        tint="light" 
        style={styles.glassContainer}
      >
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) { navigation.navigate(route.name); }
          };

          // Perfect Icon Mapping
          let activeIcon = 'settings';
          let inactiveIcon = 'settings-outline';
          const routeName = route.name.toLowerCase();
          
          switch(routeName) {
            case 'index':
            case 'feed':
              activeIcon = 'home';
              inactiveIcon = 'home-outline';
              break;
            case 'network':
              activeIcon = 'people';
              inactiveIcon = 'people-outline';
              break;
            case 'explore': 
            case 'chat':
            case 'messages':
              activeIcon = 'chatbubbles';
              inactiveIcon = 'chatbubbles-outline';
              break;
            case 'profile':
              activeIcon = 'person';
              inactiveIcon = 'person-outline';
              break;
          }

          return (
            <TabButton 
              key={index} 
              item={{ activeIcon, inactiveIcon }}
              onPress={onPress} 
              accessibilityState={{ selected: isFocused }} 
            />
          );
        })}
      </BlurView>
    </View>
  );
};

// ==========================================
// 🌟 3. LAYOUT CONFIGURATION
// ==========================================
export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="network" options={{ title: 'Network' }} />
      <Tabs.Screen name="explore" options={{ title: 'Chat' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

// ==========================================
// 🎨 MINIMALIST STYLES
// ==========================================
const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 35 : 15,
    left: 20,
    right: 20,
    borderRadius: 35,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    overflow: 'hidden',
  },
  glassContainer: {
    flexDirection: 'row',
    height: 70,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)', 
  },
  tabButton: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100%',
  },
  indicatorDot: {
    position: 'absolute',
    bottom: 12,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  }
});