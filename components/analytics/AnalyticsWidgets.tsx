// Location: components/analytics/AnalyticsWidgets.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Core
import { useUserStore } from '../../store/useUserStore';
import { useUserAnalytics } from '../../hooks/queries/useUserAnalytics';

export default function AnalyticsWidgets() {
  const router = useRouter();
  const { user } = useUserStore();
  
  const { data: analytics, isLoading } = useUserAnalytics(user?.uid);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#4f46e5" />
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </View>
    );
  }

  if (!analytics) return null;

  return (
    <View style={styles.container}>
      
      {/* 🔴 1. THE STREAK & XP HERO SECTION */}
      <Animated.View entering={FadeInDown.duration(500)} style={styles.heroGrid}>
        
        {/* Streak Card */}
        <View style={[styles.statCard, { backgroundColor: '#fff7ed', borderColor: '#ffedd5' }]}>
          <View style={[styles.iconCircle, { backgroundColor: '#ffedd5' }]}>
            <Ionicons name="flame" size={24} color="#ea580c" />
          </View>
          <Text style={styles.statValue}>{analytics.streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>

        {/* XP Card */}
        <View style={[styles.statCard, { backgroundColor: '#f0fdf4', borderColor: '#dcfce3' }]}>
          <View style={[styles.iconCircle, { backgroundColor: '#dcfce3' }]}>
            <Ionicons name="star" size={24} color="#16a34a" />
          </View>
          <Text style={styles.statValue}>{analytics.xp}</Text>
          <Text style={styles.statLabel}>Total XP</Text>
        </View>

        {/* Sessions Card */}
        <View style={[styles.statCard, { backgroundColor: '#eff6ff', borderColor: '#dbeafe' }]}>
          <View style={[styles.iconCircle, { backgroundColor: '#dbeafe' }]}>
            <Ionicons name="library" size={24} color="#2563eb" />
          </View>
          <Text style={styles.statValue}>{analytics.totalSessions}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
      </Animated.View>

      {/* 🔴 2. WEAK TOPICS RADAR (Actionable UI) */}
      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.weakSpotsContainer}>
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="analytics" size={20} color="#0f172a" />
            <Text style={styles.sectionTitle}>Focus Areas</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Topics needing your attention</Text>
        </View>

        {analytics.weakTopics.map((topic: any, index: number) => (
          <View key={topic.topicId || index} style={styles.topicRow}>
            
            <View style={styles.topicInfo}>
              <Text style={styles.topicName}>{topic.name}</Text>
              <Text style={styles.topicAccuracy}>{topic.accuracy}% Accuracy</Text>
              
              {/* Progress Bar Background */}
              <View style={styles.progressBarBg}>
                {/* Progress Bar Fill */}
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${topic.accuracy}%`, backgroundColor: topic.accuracy < 50 ? '#ef4444' : '#f59e0b' }
                  ]} 
                />
              </View>
            </View>

            {/* AI Revise Button */}
            <TouchableOpacity 
              style={styles.reviseBtn}
              activeOpacity={0.7}
              onPress={() => {
                // Pre-fill the AI generator with this weak topic
                router.push({
                  pathname: "/resources",
                  params: { autoFillTopic: topic.name, goal: 'Revision' }
                });
              }}
            >
              <Ionicons name="sparkles" size={14} color="#fff" />
              <Text style={styles.reviseBtnText}>Revise</Text>
            </TouchableOpacity>

          </View>
        ))}

        {analytics.weakTopics.length === 0 && (
          <View style={styles.allGoodState}>
            <Ionicons name="checkmark-circle" size={40} color="#10b981" />
            <Text style={styles.allGoodText}>You're crushing it! No weak topics detected yet.</Text>
          </View>
        )}
      </Animated.View>

    </View>
  );
}

// ==========================================
// 🎨 PREMIUM ANALYTICS STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  loadingContainer: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#64748b', marginTop: 10, fontWeight: '600' },
  
  // Grid
  heroGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 25 },
  statCard: { flex: 1, paddingVertical: 20, alignItems: 'center', borderRadius: 20, borderWidth: 1, elevation: 1, boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 22, fontWeight: '900', color: '#0f172a', marginBottom: 2 },
  statLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Weak Spots
  weakSpotsContainer: { backgroundColor: '#fff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#e2e8f0', boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)', elevation: 3 },
  sectionHeader: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginLeft: 8 },
  sectionSubtitle: { fontSize: 13, color: '#64748b', fontWeight: '500', marginLeft: 28, marginTop: 2 },
  
  // Topic Row
  topicRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  topicInfo: { flex: 1, marginRight: 15 },
  topicName: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  topicAccuracy: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  
  progressBarBg: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, width: '100%', overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },

  reviseBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4f46e5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  reviseBtnText: { color: '#fff', fontWeight: '700', fontSize: 13, marginLeft: 6 },

  allGoodState: { alignItems: 'center', paddingVertical: 30 },
  allGoodText: { color: '#64748b', fontWeight: '600', textAlign: 'center', marginTop: 10, paddingHorizontal: 20 }
});