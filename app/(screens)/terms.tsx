import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* 🔝 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentCard}>
          <Text style={styles.lastUpdated}>Last Updated: March 26, 2026</Text>
          
          <Text style={styles.paragraph}>
            By using Eduxity, you agree to the following terms:
          </Text>

          <Text style={styles.heading}>1. Use of Platform</Text>
          <Text style={styles.paragraph}>
            • You must provide accurate information.
            {'\n'}• You are responsible for your account.
            {'\n'}• You agree not to misuse the platform.
          </Text>

          <Text style={styles.heading}>2. User Content</Text>
          <Text style={styles.paragraph}>
            • Users can upload notes, posts, and test series.
            {'\n'}• You must own or have rights to the content.
            {'\n'}• Illegal, harmful, or copyrighted content without permission is strictly prohibited.
          </Text>

          <Text style={styles.heading}>3. Payments & Earnings</Text>
          <Text style={styles.paragraph}>
            • Paid content creators may earn through the platform.
            {'\n'}• Eduxity may charge a platform fee (e.g., 20%).
            {'\n'}• Payments are non-refundable unless specified.
          </Text>

          <Text style={styles.heading}>4. Prohibited Activities</Text>
          <Text style={styles.paragraph}>
            Users must NOT:
            {'\n'}• Upload fake or misleading content.
            {'\n'}• Harass or abuse others.
            {'\n'}• Attempt to hack or disrupt the platform.
            {'\n'}• Violate any laws.
          </Text>

          <Text style={styles.heading}>5. Account Suspension</Text>
          <Text style={styles.paragraph}>
            We reserve the right to:
            {'\n'}• Suspend or delete accounts violating rules.
            {'\n'}• Remove any content without notice.
          </Text>

          <Text style={styles.heading}>6. Intellectual Property</Text>
          <Text style={styles.paragraph}>
            • Eduxity branding, logo, and system are our property.
            {'\n'}• Users cannot copy or misuse platform assets.
          </Text>

          <Text style={styles.heading}>7. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            Eduxity is not responsible for:
            {'\n'}• Accuracy of user-generated content.
            {'\n'}• Any losses or damages from using the platform.
          </Text>

          <Text style={styles.heading}>8. Termination</Text>
          <Text style={styles.paragraph}>
            We may terminate access at any time if terms are violated.
          </Text>

          <Text style={styles.heading}>9. Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We may update terms anytime. Continued use means acceptance.
          </Text>

          <Text style={styles.heading}>10. Governing Law</Text>
          <Text style={styles.paragraph}>
            These terms are governed by the laws of India.
          </Text>

          <Text style={styles.heading}>11. Contact</Text>
          <Text style={styles.paragraph}>
            Email: support@eduxity.com
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
  lastUpdated: { fontSize: 13, color: '#64748b', fontWeight: '600', marginBottom: 15, fontStyle: 'italic' },
  heading: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginTop: 20, marginBottom: 8 },
  paragraph: { fontSize: 14, color: '#475569', lineHeight: 24 },
});