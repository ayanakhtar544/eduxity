import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated from 'react-native-reanimated';

export default function TopHeader({ setIsMenuOpen, unreadCount }: { setIsMenuOpen: any, unreadCount: number }) {
  const router = useRouter();

  return (
    <View style={styles.mainHeader}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => setIsMenuOpen(true)} style={styles.hamburgerBtn}>
          <Ionicons name="menu" size={28} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.logoBox}>
          <Ionicons name="school" size={20} color="#fff" />
        </View>
        <Text style={styles.brandName}>Eduxity</Text>
      </View>
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

const styles = StyleSheet.create({
  mainHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 15, paddingTop: Platform.OS === 'ios' ? 10 : 15, paddingBottom: 12, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  logoBox: { backgroundColor: '#4f46e5', padding: 6, borderRadius: 10, marginRight: 10 },
  brandName: { fontSize: 24, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  headerIcons: { flexDirection: 'row', gap: 15 },
  iconBtn: { padding: 4, position: 'relative' },
  notificationBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#ef4444', width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#fff' },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  hamburgerBtn: { marginRight: 15, padding: 4 },
});