import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics'; 
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

  return (
    <TouchableOpacity 
      onPress={(e) => {
        // Apple style soft haptic feedback
        Haptics.selectionAsync(); 
        onPress(e);
      }} 
      activeOpacity={0.6} 
      style={styles.tabButton}
    >
      <Animated.View style={animatedIconStyle}>
        <Ionicons 
          name={focused ? item.activeIcon : item.inactiveIcon} 
          size={24} 
          color={focused ? '#4f46e5' : '#64748b'} // Indigo when active, Slate when inactive
        />
      </Animated.View>
      
      {/* Subtle bottom dot instead of a big bubble */}
      <Animated.View style={[styles.indicatorDot, animatedIndicatorStyle]} />
    </TouchableOpacity>
  );
};

// ==========================================
// 🍏 2. APPLE-STYLE GLASSY DOCK
// ==========================================
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  return (
    <View style={styles.floatingWrapper}>
      {/* 🍏 Apple Glass Effect using BlurView */}
      <BlurView intensity={80} tint="light" style={styles.glassContainer}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) { navigation.navigate(route.name); }
          };

          // Perfect Icon Mapping
          let activeIcon = 'alert-circle';
          let inactiveIcon = 'alert-circle-outline';
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
    bottom: Platform.OS === 'ios' ? 35 : 25,
    left: 20,
    right: 20,
    borderRadius: 35,
    elevation: 10, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    overflow: 'hidden', // REQUIRED for BlurView to respect border radius
  },
  glassContainer: {
    flexDirection: 'row',
    height: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // Slight white tint over the blur
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    // A subtle inner border to make it look like real glass
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)', 
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
    backgroundColor: '#4f46e5', // Theme color dot
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  }
});