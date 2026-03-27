import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated from 'react-native-reanimated';
import { Image } from 'expo-image'; // 🔥 Import for local logo asset

export default function TopHeader({ setIsMenuOpen, unreadCount }: { setIsMenuOpen: any, unreadCount: number }) {
  const router = useRouter();

  return (
    <View style={styles.mainHeader}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        
        {/* Hamburger Menu */}
        <TouchableOpacity onPress={() => setIsMenuOpen(true)} style={styles.hamburgerBtn}>
          <Ionicons name="menu" size={28} color="#0f172a" />
        </TouchableOpacity>
        
        {/* 🔥 NEW: Your Direct Local Logo (No Background Box, Exact 20x20 Size) */}
        <Image 
          source={require('../assets/images/logo.png')} // 🔥 Path to your local logo
          style={styles.directLogo} // Applied styles for size and spacing
          contentFit="contain" 
          transition={200}
        />
        
        <Text style={styles.brandName}>Eduxity</Text>
      </View>

      {/* Header Icons (Right Side) */}
      <View style={styles.headerIcons}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/search-users')}>
          <Ionicons name="search" size={24} color="#0f172a" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/notification')}>
          <Ionicons name="notifications-outline" size={24} color="#0f172a" />
          {unreadCount > 0 && (
            <Animated.View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </Animated.View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ==========================================
// 🎨 UPDATED STYLES (No more logoBox!)
// ==========================================
const styles = StyleSheet.create({
  mainHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    paddingHorizontal: 15, 
    // Reduced padding slightly for a sleeker look with the smaller logo
    paddingTop: Platform.OS === 'ios' ? 8 : 12, 
    paddingBottom: 10, 
    borderBottomWidth: 1, 
    borderColor: '#e2e8f0' 
  },
  
  // 🔥 New style for the direct logo
  directLogo: { 
    width: 40,  // Exact same dimensions as old icon
    height: 40, 
    marginRight: 10 // Maintains spacing to Brand Name text
  },
  
  brandName: { 
    fontSize: 24, 
    fontWeight: '900', 
    color: '#0f172a', 
    letterSpacing: -0.5 
  },
  headerIcons: { 
    flexDirection: 'row', 
    gap: 15 
  },
  iconBtn: { 
    padding: 4, 
    position: 'relative' 
  },
  notificationBadge: { 
    position: 'absolute', 
    top: 0, 
    right: 0, 
    backgroundColor: '#ef4444', 
    width: 16, 
    height: 16, 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1.5, 
    borderColor: '#fff' 
  },
  badgeText: { 
    color: '#fff', 
    fontSize: 9, 
    fontWeight: 'bold' 
  },
  hamburgerBtn: { 
    marginRight: 15, 
    padding: 4 
  },
});