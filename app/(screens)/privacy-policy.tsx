import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* 🔝 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentCard}>
          <Text style={styles.lastUpdated}>Last Updated: March 2026</Text>
          
          <Text style={styles.heading}>1. Information We Collect</Text>
          <Text style={styles.paragraph}>
            Welcome to Eduxity! When you use our platform, we collect the information you provide directly to us, such as your name, email address, profile picture, and the educational content (notes, flashcards, polls) you upload.
          </Text>

          <Text style={styles.heading}>2. How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            We use the information we collect to provide, maintain, and improve our services. This includes powering our gamification engine (EduCoins, XP, Badges), personalizing your feed, and allowing you to connect with other students.
          </Text>

          <Text style={styles.heading}>3. Data Security</Text>
          <Text style={styles.paragraph}>
            Your study data and personal information are secured using industry-standard encryption provided by Google Firebase. We do not sell your personal data to third-party advertisers.
          </Text>

          <Text style={styles.heading}>4. Your Rights</Text>
          <Text style={styles.paragraph}>
            You have the right to access, update, or delete your account and personal information at any time directly from the Settings menu in the app.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 15 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  backBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 10 },
  scrollContent: { padding: 15, paddingBottom: 40 },
  contentCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#e2e8f0' },
  lastUpdated: { fontSize: 13, color: '#64748b', fontWeight: '600', marginBottom: 20, fontStyle: 'italic' },
  heading: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginTop: 15, marginBottom: 8 },
  paragraph: { fontSize: 14, color: '#475569', lineHeight: 24, marginBottom: 10 },
});