import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
// 🚨 BlurView ka import hata diya hai
import Animated, { 
  useSharedValue, useAnimatedStyle, withSpring, withTiming 
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// ==========================================
// 🌟 1. INDIVIDUAL ANIMATED TAB BUTTON
// ==========================================
const TabButton = ({ item, onPress, accessibilityState }: any) => {
  const focused = accessibilityState.selected;
  
  const scale = useSharedValue(focused ? 1.1 : 0.9);
  const translateY = useSharedValue(focused ? -8 : 0);
  const opacity = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 0.9, { damping: 12, stiffness: 100 });
    translateY.value = withSpring(focused ? -8 : 0, { damping: 12, stiffness: 100 });
    opacity.value = withTiming(focused ? 1 : 0, { duration: 250 });
  }, [focused]);

  const animatedIconStyle = useAnimatedStyle(() => {
    return { transform: [{ scale: scale.value }, { translateY: translateY.value }] };
  });

  const animatedDotStyle = useAnimatedStyle(() => {
    return { opacity: opacity.value, transform: [{ scale: opacity.value }] };
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.tabButton}>
      <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
        <Ionicons 
          name={focused ? item.activeIcon : item.inactiveIcon} 
          size={24} 
          color={focused ? '#2563eb' : '#64748b'} 
        />
      </Animated.View>
      <Animated.View style={[styles.activeDot, animatedDotStyle]} />
    </TouchableOpacity>
  );
};

// ==========================================
// 🌟 2. THE FLOATING DOCK (Without Native Blur)
// ==========================================
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  return (
    <View style={styles.floatingWrapper}>
      {/* 🚨 BlurView ko ek normal View se replace kar diya */}
      <View style={styles.glassContainer}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) { navigation.navigate(route.name); }
          };

          let activeIcon = 'alert-circle';
          let inactiveIcon = 'alert-circle-outline';

          const routeName = route.name.toLowerCase();
          
          if (routeName === 'index' || routeName === 'feed') {
            activeIcon = 'home';
            inactiveIcon = 'home-outline';
          } else if (routeName === 'network') {
            activeIcon = 'people';
            inactiveIcon = 'people-outline';
          } else if (routeName === 'profile') {
            activeIcon = 'person';
            inactiveIcon = 'person-outline';
          } else if (routeName === 'settings') {
            activeIcon = 'settings';
            inactiveIcon = 'settings-outline';
          } else if (routeName === 'chat') {
            activeIcon = 'chatbubbles';
            inactiveIcon = 'chatbubbles-outline';
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
      </View>
    </View>
  );
};

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="network" options={{ title: 'Network' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="explore" options={{ title: 'Chat' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 35 : 25,
    left: 20,
    right: 20,
    borderRadius: 35,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    overflow: 'hidden',
  },
  glassContainer: {
    flexDirection: 'row',
    height: 70,
    // 🚨 Yahan humne ek semi-transparent white color de diya hai blur ki jagah
    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  tabButton: { flex: 1, justifyContent: 'center', alignItems: 'center', height: '100%' },
  iconContainer: { justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  activeDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#2563eb',
    position: 'absolute', bottom: 8, shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4,
  }
});