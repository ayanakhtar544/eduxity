// File: app/(tabs)/profile.tsx
// Yeh user ka dashboard hai jahan uske stats aur achievements dikhenge

import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* TOP SECTION: User Info */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>A</Text>
          </View>
          <Text style={styles.name}>Abushahma</Text>
          <Text style={styles.bio}>Class 11 | Target: JEE Advanced 🚀</Text>
          
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* MIDDLE SECTION: Stats (Streak & XP) */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statValue}>12 Days</Text>
            <Text style={styles.statLabel}>Study Streak</Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statIcon}>⚡</Text>
            <Text style={styles.statValue}>2,450</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
        </View>

        {/* BOTTOM SECTION: Badges & Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          
          <View style={styles.badgeRow}>
            <View style={styles.badgeCard}>
              <Text style={styles.badgeIcon}>🏆</Text>
              <Text style={styles.badgeName}>Task Master</Text>
              <Text style={styles.badgeDesc}>Completed 50 tasks</Text>
            </View>
            
            <View style={styles.badgeCard}>
              <Text style={styles.badgeIcon}>🦉</Text>
              <Text style={styles.badgeName}>Night Owl</Text>
              <Text style={styles.badgeDesc}>Studied past midnight</Text>
            </View>
          </View>
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity style={styles.logoutButton} onPress={() => alert('Logged out!')}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// Senior Dev Styling
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  
  header: { alignItems: 'center', padding: 30, backgroundColor: '#FFF', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, elevation: 5 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', marginBottom: 15, borderWidth: 4, borderColor: '#EFF6FF' },
  avatarText: { fontSize: 40, color: '#FFF', fontWeight: 'bold' },
  name: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 5 },
  bio: { fontSize: 15, color: '#6B7280', marginBottom: 20, fontWeight: '500' },
  editButton: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6' },
  editButtonText: { color: '#4B5563', fontWeight: '600' },

  statsContainer: { flexDirection: 'row', backgroundColor: '#FFF', margin: 20, borderRadius: 20, padding: 20, justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, elevation: 3 },
  statBox: { flex: 1, alignItems: 'center' },
  verticalDivider: { width: 1, height: '80%', backgroundColor: '#E5E7EB' },
  statIcon: { fontSize: 28, marginBottom: 5 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  statLabel: { fontSize: 13, color: '#6B7280', marginTop: 2 },

  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 15 },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  badgeCard: { width: '48%', backgroundColor: '#FFF', padding: 15, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2 },
  badgeIcon: { fontSize: 32, marginBottom: 10 },
  badgeName: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  badgeDesc: { fontSize: 12, color: '#6B7280', textAlign: 'center' },

  logoutButton: { marginHorizontal: 20, marginBottom: 40, padding: 15, borderRadius: 15, backgroundColor: '#FEE2E2', alignItems: 'center' },
  logoutText: { color: '#EF4444', fontWeight: 'bold', fontSize: 16 },
});