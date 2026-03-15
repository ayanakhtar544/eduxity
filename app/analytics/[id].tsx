import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, 
  StatusBar, ScrollView, Dimensions, Platform 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import Animated, { FadeInDown, SlideInRight, Layout, useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const IS_DESKTOP = width > 1024;

// ============================================================================
// 🛠️ ENTERPRISE TYPES & INTERFACES
// ============================================================================
interface SectionPerformance {
  name: string;
  totalMarks: number;
  scoredMarks: number;
  attempted: number;
  correct: number;
  incorrect: number;
  avgTimePerQ: number; // in seconds
}

interface AnalyticsPayload {
  examTitle: string;
  studentName: string;
  totalScore: number;
  maxScore: number;
  rank: number;
  totalStudents: number;
  percentile: number;
  accuracy: number;
  totalTimeTaken: number; // in seconds
  questionsStats: {
    correct: number;
    incorrect: number;
    skipped: number;
    markedForReview: number;
  };
  sectionData: SectionPerformance[];
  aiInsights: string[];
  weakTopics: string[];
  strongTopics: string[];
}

// ============================================================================
// 📊 PURE REACT NATIVE CIRCULAR PROGRESS (No external SVG library needed)
// ============================================================================
const CircularProgress = ({ value, color, size = 120, strokeWidth = 12 }: { value: number, color: string, size?: number, strokeWidth?: number }) => {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={[styles.ringTrack, { width: size, height: size, borderRadius: size / 2, borderWidth: strokeWidth }]} />
      {/* Active Ring Simulation (Since standard View can't draw partial circles easily without SVG, we use a styled overlay for visual feedback) */}
      <View style={[styles.ringActive, { width: size, height: size, borderRadius: size / 2, borderWidth: strokeWidth, borderTopColor: color, borderRightColor: value > 50 ? color : 'transparent', borderBottomColor: value > 75 ? color : 'transparent', borderLeftColor: 'transparent', transform: [{rotate: '-45deg'}] }]} />
      <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: size * 0.22, fontWeight: '900', color: '#fff' }}>{Math.round(value)}%</Text>
      </View>
    </View>
  );
};

// ============================================================================
// 🚀 MAIN ANALYTICS ENGINE COMPONENT
// ============================================================================
export default function DeepAnalyticsDashboard() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const uid = auth.currentUser?.uid;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsPayload | null>(null);

  // 📡 SIMULATED AGGREGATION PIPELINE
  useEffect(() => {
    const generateAnalytics = async () => {
      // Simulate API latency for aggregation
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockData: AnalyticsPayload = {
        examTitle: "JEE Advanced 2026 - Phase 1 CBT",
        studentName: auth.currentUser?.displayName || "Abushahma",
        totalScore: 185,
        maxScore: 300,
        rank: 1402,
        totalStudents: 85000,
        percentile: 98.35,
        accuracy: 78,
        totalTimeTaken: 10250, // ~170 mins
        questionsStats: { correct: 48, incorrect: 14, skipped: 13, markedForReview: 5 },
        sectionData: [
          { name: "Physics", totalMarks: 100, scoredMarks: 65, attempted: 22, correct: 17, incorrect: 5, avgTimePerQ: 140 },
          { name: "Chemistry", totalMarks: 100, scoredMarks: 80, attempted: 23, correct: 21, incorrect: 2, avgTimePerQ: 95 },
          { name: "Mathematics", totalMarks: 100, scoredMarks: 40, attempted: 17, correct: 10, incorrect: 7, avgTimePerQ: 210 },
        ],
        aiInsights: [
          "Excellent accuracy in Chemistry. You saved 45 minutes here.",
          "High negative marking in Mathematics. You lost 7 marks due to incorrect guesses.",
          "Time Alert: You spent an average of 3.5 minutes per question in Mathematics. Speed needs improvement."
        ],
        weakTopics: ["Integral Calculus", "Rotational Mechanics", "Coordinate Geometry"],
        strongTopics: ["Organic Chemistry", "Modern Physics", "Chemical Bonding"]
      };

      setData(mockData);
      setLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    generateAnalytics();
  }, [id]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h > 0 ? h + 'h ' : ''}${m}m`;
  };

  if (loading || !data) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#020617" />
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loaderTitle}>Crunching Analytics Payload...</Text>
        <Text style={styles.loaderSub}>Calculating Percentiles & AI Insights</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />
      
      {/* 🔝 ENTERPRISE HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)/index')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#cbd5e1" />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle} numberOfLines={1}>{data.examTitle}</Text>
            <Text style={styles.headerSub}>Post-Exam Analytics Report</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.downloadBtn}>
          <Ionicons name="download" size={18} color="#fff" style={{marginRight: 6}} />
          <Text style={styles.downloadBtnText}>PDF Report</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.mainScroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.contentWrapper}>
          
          {/* 🏆 HERO SECTION: MAIN SCORECARD */}
          <View style={styles.heroGrid}>
            
            {/* Main Score Block */}
            <LinearGradient colors={['#1e3a8a', '#312e81']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.scoreMasterCard}>
              <View style={styles.scoreTopRow}>
                <Ionicons name="target" size={18} color="#93c5fd" />
                <Text style={styles.scoreMasterLabel}>TOTAL NTA EVALUATED SCORE</Text>
              </View>
              
              <View style={styles.scoreValBox}>
                <Text style={styles.scoreMasterVal}>{data.totalScore}</Text>
                <Text style={styles.scoreMasterMax}>/ {data.maxScore}</Text>
              </View>
              
              <View style={styles.candInfoRow}>
                <View style={styles.candInfoPill}>
                  <Text style={styles.candInfoLab}>Candidate</Text>
                  <Text style={styles.candInfoVal}>{data.studentName}</Text>
                </View>
                <View style={styles.candInfoPill}>
                  <Text style={styles.candInfoLab}>Time Taken</Text>
                  <Text style={styles.candInfoVal}>{formatTime(data.totalTimeTaken)}</Text>
                </View>
              </View>

              <View style={styles.rankRow}>
                <View style={styles.rankBox}>
                  <Ionicons name="trophy" size={24} color="#fde047" style={{marginBottom: 4}} />
                  <Text style={styles.rankVal}>{data.percentile}<Text style={styles.rankLabSm}>%ile</Text></Text>
                  <Text style={styles.rankLab}>Percentile</Text>
                </View>
                <View style={styles.rankBox}>
                  <Ionicons name="analytics" size={24} color="#67e8f9" style={{marginBottom: 4}} />
                  <Text style={[styles.rankVal, {color: '#fff'}]}>#{data.rank}</Text>
                  <Text style={styles.rankLab}>Out of {data.totalStudents}</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Accuracy & Attempt Ring */}
            <View style={styles.accCard}>
              <View style={styles.accHeader}>
                <Ionicons name="pie-chart" size={18} color="#94a3b8" />
                <Text style={styles.accTitle}>Accuracy Engine</Text>
              </View>
              
              <View style={{alignItems: 'center', marginVertical: 20}}>
                <CircularProgress value={data.accuracy} color={data.accuracy > 75 ? "#10b981" : data.accuracy > 50 ? "#f59e0b" : "#ef4444"} size={140} strokeWidth={12} />
              </View>
              
              <View style={styles.accStatsGrid}>
                <View style={[styles.accStatBox, {borderColor: '#10b981', backgroundColor: '#022c22'}]}>
                  <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                  <View style={{marginLeft: 8}}>
                    <Text style={styles.accStatLab}>Correct</Text>
                    <Text style={styles.accStatVal}>{data.questionsStats.correct}</Text>
                  </View>
                </View>
                <View style={[styles.accStatBox, {borderColor: '#ef4444', backgroundColor: '#450a0a'}]}>
                  <Ionicons name="close-circle" size={18} color="#ef4444" />
                  <View style={{marginLeft: 8}}>
                    <Text style={styles.accStatLab}>Wrong</Text>
                    <Text style={styles.accStatVal}>{data.questionsStats.incorrect}</Text>
                  </View>
                </View>
                <View style={[styles.accStatBox, {borderColor: '#64748b', backgroundColor: '#0f172a', width: '100%', marginTop: 10}]}>
                  <Ionicons name="remove-circle" size={18} color="#64748b" />
                  <View style={{marginLeft: 8, flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                    <Text style={styles.accStatLab}>Unattempted</Text>
                    <Text style={styles.accStatVal}>{data.questionsStats.skipped}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* 🧠 AI SMART INSIGHTS */}
          <View style={styles.sectionContainer}>
            <View style={styles.secHeaderRow}>
              <Ionicons name="git-network" size={24} color="#a855f7" />
              <Text style={styles.secTitle}>AI Performance Insights</Text>
            </View>
            
            <View style={styles.insightsList}>
              {data.aiInsights.map((insight, idx) => {
                const isSuccess = idx === 0;
                const isDanger = idx === 1;
                return (
                  <View key={idx} style={[styles.insightItem, isSuccess ? styles.insSuccess : isDanger ? styles.insDanger : styles.insWarn]}>
                    <Ionicons name={isSuccess ? "checkmark-circle" : isDanger ? "warning" : "information-circle"} size={24} color={isSuccess ? '#10b981' : isDanger ? '#ef4444' : '#f59e0b'} />
                    <Text style={styles.insightText}>{insight}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* 📊 SECTION-WISE DEEP DIVE */}
          <View style={styles.sectionContainer}>
            <View style={styles.secHeaderRow}>
              <Ionicons name="bar-chart" size={24} color="#3b82f6" />
              <Text style={styles.secTitle}>Section-wise Analysis</Text>
            </View>
            
            {data.sectionData.map((sec, idx) => {
              const percentage = (sec.scoredMarks / sec.totalMarks) * 100;
              const barColor = percentage > 75 ? '#10b981' : percentage > 40 ? '#3b82f6' : '#ef4444';
              
              return (
                <View key={idx} style={styles.secBreakdownCard}>
                  <View style={styles.secBreakHeader}>
                    <View>
                      <Text style={styles.secBreakName}>{sec.name}</Text>
                      <Text style={styles.secBreakTime}>Avg Time/Q: {Math.floor(sec.avgTimePerQ / 60)}m {sec.avgTimePerQ % 60}s</Text>
                    </View>
                    <View style={styles.secBreakScoreBox}>
                      <Text style={styles.secBreakScore}>{sec.scoredMarks}</Text>
                      <Text style={styles.secBreakMax}> / {sec.totalMarks}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${Math.max(0, percentage)}%`, backgroundColor: barColor }]} />
                  </View>

                  <View style={styles.secMicroStats}>
                    <Text style={styles.microStatTxt}>Attempted: <Text style={{color: '#fff'}}>{sec.attempted}</Text></Text>
                    <Text style={styles.microStatTxt}>Correct: <Text style={{color: '#10b981'}}>{sec.correct}</Text></Text>
                    <Text style={styles.microStatTxt}>Wrong: <Text style={{color: '#ef4444'}}>{sec.incorrect}</Text></Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* 🎯 STRENGTHS & WEAKNESSES */}
          <View style={styles.swGrid}>
            <View style={styles.swCard}>
              <View style={styles.secHeaderRow}>
                <Ionicons name="trophy" size={20} color="#10b981" />
                <Text style={styles.secTitle}>Core Strengths</Text>
              </View>
              <View style={styles.tagsContainer}>
                {data.strongTopics.map((topic, i) => (
                  <View key={i} style={[styles.tagPill, {backgroundColor: '#022c22', borderColor: '#047857'}]}>
                    <Text style={[styles.tagTxt, {color: '#6ee7b7'}]}>{topic}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.swCard}>
              <View style={styles.secHeaderRow}>
                <Ionicons name="warning" size={20} color="#ef4444" />
                <Text style={styles.secTitle}>Critical Weaknesses</Text>
              </View>
              <View style={styles.tagsContainer}>
                {data.weakTopics.map((topic, i) => (
                  <View key={i} style={[styles.tagPill, {backgroundColor: '#450a0a', borderColor: '#b91c1c'}]}>
                    <Text style={[styles.tagTxt, {color: '#fca5a5'}]}>{topic}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* 📚 SOLUTIONS & REVIEW */}
          <TouchableOpacity style={styles.reviewBtn} activeOpacity={0.8}>
            <View style={{flex: 1}}>
              <Text style={styles.reviewBtnTitle}>Review Complete Solutions</Text>
              <Text style={styles.reviewBtnSub}>Analyze every question with detailed explanations, correct keys, and your responses.</Text>
            </View>
            <View style={styles.reviewIconBox}>
              <Ionicons name="chevron-forward" size={24} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={{height: 100}} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// 🎨 MASSIVE ENTERPRISE STYLESHEET
// ============================================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' }, // Slate 950
  
  // Loader
  loaderContainer: { flex: 1, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center' },
  loaderTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 20, letterSpacing: 1, textTransform: 'uppercase' },
  loaderSub: { color: '#64748b', fontSize: 13, marginTop: 8, fontWeight: '600' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingTop: Platform.OS === 'ios' ? 10 : 20, paddingBottom: 15, backgroundColor: '#0f172a', borderBottomWidth: 1, borderColor: '#1e293b', zIndex: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backBtn: { padding: 8, backgroundColor: '#1e293b', borderRadius: 10, marginRight: 15 },
  headerTitleBox: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#fff' },
  headerSub: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  downloadBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  mainScroll: { flex: 1 },
  contentWrapper: { padding: 15, maxWidth: 1200, alignSelf: 'center', width: '100%' },

  // HERO GRID (Score & Accuracy)
  heroGrid: { flexDirection: IS_DESKTOP ? 'row' : 'column', gap: 15, marginBottom: 20 },
  
  scoreMasterCard: { flex: 2, borderRadius: 24, padding: 25, elevation: 8, shadowColor: '#1e3a8a', shadowOpacity: 0.5, shadowRadius: 15, shadowOffset: {width:0, height:8}, borderWidth: 1, borderColor: '#1e3a8a' },
  scoreTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  scoreMasterLabel: { color: '#93c5fd', fontSize: 12, fontWeight: '900', letterSpacing: 1.5, marginLeft: 8 },
  scoreValBox: { flexDirection: 'row', alignItems: 'baseline' },
  scoreMasterVal: { color: '#fff', fontSize: 64, fontWeight: '900', letterSpacing: -2 },
  scoreMasterMax: { color: '#60a5fa', fontSize: 24, fontWeight: '800', marginLeft: 5 },
  
  candInfoRow: { flexDirection: 'row', gap: 10, marginTop: 15, marginBottom: 25 },
  candInfoPill: { backgroundColor: 'rgba(15,23,42,0.5)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(51,65,85,0.5)' },
  candInfoLab: { fontSize: 10, color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase' },
  candInfoVal: { fontSize: 14, color: '#fff', fontWeight: '800', marginTop: 2 },

  rankRow: { flexDirection: 'row', gap: 15 },
  rankBox: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', padding: 15, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(51,65,85,0.6)' },
  rankVal: { fontSize: 28, fontWeight: '900', color: '#fde047' },
  rankLabSm: { fontSize: 14, color: '#94a3b8' },
  rankLab: { fontSize: 10, color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', marginTop: 4 },

  // ACCURACY CARD
  accCard: { flex: 1, backgroundColor: '#0f172a', borderRadius: 24, padding: 25, borderWidth: 1, borderColor: '#1e293b' },
  accHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  accTitle: { color: '#94a3b8', fontSize: 12, fontWeight: '900', letterSpacing: 1.5, marginLeft: 8, textTransform: 'uppercase' },
  ringTrack: { position: 'absolute', borderColor: '#1e293b' },
  ringActive: { position: 'absolute' },
  
  accStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  accStatBox: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, width: '48%' },
  accStatLab: { fontSize: 10, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' },
  accStatVal: { fontSize: 18, fontWeight: '900', color: '#fff' },

  // SECTION HEADERS
  sectionContainer: { backgroundColor: '#0f172a', borderRadius: 24, padding: 25, borderWidth: 1, borderColor: '#1e293b', marginBottom: 20 },
  secHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  secTitle: { fontSize: 18, fontWeight: '900', color: '#fff', marginLeft: 10 },

  // AI INSIGHTS
  insightsList: { gap: 12 },
  insightItem: { flexDirection: 'row', padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  insSuccess: { backgroundColor: '#022c22', borderColor: '#064e3b' },
  insWarn: { backgroundColor: '#422006', borderColor: '#78350f' },
  insDanger: { backgroundColor: '#450a0a', borderColor: '#7f1d1d' },
  insightText: { flex: 1, marginLeft: 12, fontSize: 13, color: '#e2e8f0', fontWeight: '600', lineHeight: 20 },

  // SECTIONAL ANALYSIS
  secBreakdownCard: { marginBottom: 25 },
  secBreakHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  secBreakName: { fontSize: 16, fontWeight: '900', color: '#f8fafc' },
  secBreakTime: { fontSize: 11, color: '#64748b', fontWeight: '800', textTransform: 'uppercase', marginTop: 4 },
  secBreakScoreBox: { flexDirection: 'row', alignItems: 'baseline' },
  secBreakScore: { fontSize: 24, fontWeight: '900', color: '#fff' },
  secBreakMax: { fontSize: 14, fontWeight: '800', color: '#64748b', marginLeft: 4 },
  
  barTrack: { height: 12, backgroundColor: '#1e293b', borderRadius: 6, overflow: 'hidden', marginBottom: 12 },
  barFill: { height: '100%', borderRadius: 6 },
  secMicroStats: { flexDirection: 'row', gap: 15 },
  microStatTxt: { fontSize: 11, fontWeight: '800', color: '#64748b', textTransform: 'uppercase' },

  // STRENGTHS & WEAKNESSES
  swGrid: { flexDirection: IS_DESKTOP ? 'row' : 'column', gap: 15, marginBottom: 20 },
  swCard: { flex: 1, backgroundColor: '#0f172a', padding: 25, borderRadius: 24, borderWidth: 1, borderColor: '#1e293b' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  tagTxt: { fontSize: 12, fontWeight: '800' },

  // REVIEW BUTTON
  reviewBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#334155' },
  reviewBtnTitle: { fontSize: 18, fontWeight: '900', color: '#fff', marginBottom: 4 },
  reviewBtnSub: { fontSize: 13, color: '#94a3b8', fontWeight: '600', lineHeight: 20 },
  reviewIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginLeft: 15 }
});