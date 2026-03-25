import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, 
  StatusBar, Dimensions, Switch, Alert, KeyboardAvoidingView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useSharedValue, useAnimatedStyle, withSpring, withTiming, 
  FadeInRight, FadeOutLeft, FadeIn, Easing, Layout 
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// ==========================================
// 📚 MASSIVE DATA DICTIONARIES FOR PRECISION
// ==========================================
const EXAM_CATEGORIES = [
  { id: 'jee', title: 'JEE (Mains & Adv)', icon: 'rocket-outline', desc: 'Engineering Entrance' },
  { id: 'neet', title: 'NEET (UG)', icon: 'medical-outline', desc: 'Medical Entrance' },
  { id: 'boards12', title: 'Class 12 Boards', icon: 'school-outline', desc: 'CBSE / State Boards' },
  { id: 'boards10', title: 'Class 10 Boards', icon: 'book-outline', desc: 'Foundation' },
  { id: 'upsc', title: 'UPSC / CSE', icon: 'library-outline', desc: 'Civil Services' },
  { id: 'nda', title: 'NDA / Defence', icon: 'shield-checkmark-outline', desc: 'Armed Forces' },
  { id: 'ca', title: 'CA / CS / CMA', icon: 'calculator-outline', desc: 'Commerce / Finance' },
  { id: 'tech', title: 'Coding / Tech', icon: 'laptop-outline', desc: 'Software Dev / DSA' }
];

const CLASS_LEVELS = ['Class 9', 'Class 10', 'Class 11', 'Class 12', 'Dropper', 'College UG', 'Graduate'];
const STUDY_TIMINGS = [
  { id: 'morning', label: 'Early Bird (4 AM - 9 AM)', icon: 'partly-sunny-outline' },
  { id: 'day', label: 'Day Scholar (10 AM - 5 PM)', icon: 'sunny-outline' },
  { id: 'night', label: 'Night Owl (10 PM - 3 AM)', icon: 'moon-outline' },
  { id: 'flexible', label: 'Flexible / Anytime', icon: 'infinite-outline' }
];
const STUDY_GOALS = ['Daily Revision', 'Mock Test Practice', 'Doubt Solving', 'Strict Accountability', 'Just Silent Study'];

// ==========================================
// 🚀 MAIN WIZARD COMPONENT
// ==========================================
export default function AdvancedMatchmakingPreferences() {
  const router = useRouter();
  
  // 🧠 CORE STATES
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // 🎯 PREFERENCE STATES
  const [selectedExam, setSelectedExam] = useState(EXAM_CATEGORIES[0].id);
  const [selectedClass, setSelectedClass] = useState(CLASS_LEVELS[2]); // Default Class 11
  const [selectedTiming, setSelectedTiming] = useState(STUDY_TIMINGS[2].id); // Default Night Owl
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  
  // 💡 THE BUG FIXER: Smart Match Mode
  // If true, we relax the database query to show more users
  const [isSmartMode, setIsSmartMode] = useState(true);

  // 🎢 ANIMATIONS
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withSpring((currentStep / totalSteps) * 100, { damping: 15 });
  }, [currentStep]);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`
  }));

  // ==========================================
  // 🎮 NAVIGATION HANDLERS
  // ==========================================
  const handleNext = async () => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Validation
    if (currentStep === 3 && selectedGoals.length === 0) {
      Alert.alert("Hold on!", "Please select at least one study goal to find better partners.");
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      finalizeAndStart();
    }
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
    else router.back();
  };

  const toggleGoal = (goal: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setSelectedGoals(prev => {
      if (prev.includes(goal)) return prev.filter(g => g !== goal);
      if (prev.length >= 3) {
        Alert.alert("Limit Reached", "You can select a maximum of 3 primary goals.");
        return prev;
      }
      return [...prev, goal];
    });
  };

  const finalizeAndStart = async () => {
    if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    console.log("🚀 INITIATING MATCHMAKING ENGINE...");
    
    // Sending payload to swipe screen. 
    // isSmartMode tells the next screen whether to use strict DB queries or relaxed ones.
    router.push({
      pathname: '/matchmaking/swipe',
      params: { 
        exam: selectedExam, 
        targetClass: selectedClass, 
        timing: selectedTiming,
        goals: JSON.stringify(selectedGoals),
        smartMode: isSmartMode ? 'true' : 'false'
      }
    });
  };

  // ==========================================
  // 🧩 RENDERERS FOR EACH STEP
  // ==========================================
  
  // STEP 1: EXAM & DOMAIN
  const renderStep1 = () => (
    <Animated.ScrollView entering={FadeInRight} exiting={FadeOutLeft} showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContainer}>
      <Text style={styles.stepTitle}>What are you preparing for?</Text>
      <Text style={styles.stepSub}>Select your primary target. This is the most crucial filter.</Text>
      
      <View style={styles.gridContainer}>
        {EXAM_CATEGORIES.map((exam) => {
          const isActive = selectedExam === exam.id;
          return (
            <TouchableOpacity 
              key={exam.id} 
              style={[styles.gridCard, isActive && styles.gridCardActive]}
              activeOpacity={0.7}
              onPress={() => {
                if(Platform.OS !== 'web') Haptics.selectionAsync();
                setSelectedExam(exam.id);
              }}
            >
              <View style={[styles.iconCircle, isActive && {backgroundColor: '#fff'}]}>
                <Ionicons name={exam.icon as any} size={24} color={isActive ? '#4f46e5' : '#64748b'} />
              </View>
              <Text style={[styles.gridTitle, isActive && {color: '#fff'}]}>{exam.title}</Text>
              <Text style={[styles.gridDesc, isActive && {color: '#e0e7ff'}]}>{exam.desc}</Text>
              {isActive && (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark" size={12} color="#4f46e5" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.ScrollView>
  );

  // STEP 2: CLASS & TIMING
  const renderStep2 = () => (
    <Animated.ScrollView entering={FadeInRight} exiting={FadeOutLeft} showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContainer}>
      <Text style={styles.stepTitle}>Your Logistics</Text>
      <Text style={styles.stepSub}>Matching class level ensures syllabus alignment.</Text>

      <Text style={styles.sectionHeader}>Current Status</Text>
      <View style={styles.chipRow}>
        {CLASS_LEVELS.map(cls => (
          <TouchableOpacity 
            key={cls} 
            style={[styles.pill, selectedClass === cls && styles.pillActive]}
            onPress={() => {
              if(Platform.OS !== 'web') Haptics.selectionAsync();
              setSelectedClass(cls);
            }}
          >
            <Text style={[styles.pillText, selectedClass === cls && styles.pillTextActive]}>{cls}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionHeader}>Preferred Study Timing</Text>
      <Text style={styles.sectionSub}>When are you most productive?</Text>
      <View style={styles.listContainer}>
        {STUDY_TIMINGS.map(time => {
          const isActive = selectedTiming === time.id;
          return (
            <TouchableOpacity 
              key={time.id} 
              style={[styles.listItem, isActive && styles.listItemActive]}
              onPress={() => {
                if(Platform.OS !== 'web') Haptics.selectionAsync();
                setSelectedTiming(time.id);
              }}
            >
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Ionicons name={time.icon as any} size={22} color={isActive ? '#4f46e5' : '#64748b'} style={{marginRight: 15}}/>
                <Text style={[styles.listText, isActive && styles.listTextActive]}>{time.label}</Text>
              </View>
              <View style={[styles.radio, isActive && styles.radioActive]}>
                {isActive && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.ScrollView>
  );

  // STEP 3: GOALS & SMART MODE
  const renderStep3 = () => (
    <Animated.ScrollView entering={FadeInRight} exiting={FadeOutLeft} showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContainer}>
      <Text style={styles.stepTitle}>Study Goals</Text>
      <Text style={styles.stepSub}>What do you expect from your study partner? (Select up to 3)</Text>

      <View style={styles.goalsContainer}>
        {STUDY_GOALS.map(goal => {
          const isActive = selectedGoals.includes(goal);
          return (
            <TouchableOpacity 
              key={goal} 
              style={[styles.goalBox, isActive && styles.goalBoxActive]}
              onPress={() => toggleGoal(goal)}
            >
              <Ionicons name={isActive ? "checkbox" : "square-outline"} size={24} color={isActive ? '#fff' : '#cbd5e1'} />
              <Text style={[styles.goalText, isActive && {color: '#fff'}]}>{goal}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.divider} />

      {/* 🔥 THE FIX FOR EMPTY USERS: SMART MODE */}
      <View style={styles.smartModeCard}>
        <View style={styles.smartModeHeader}>
          <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
            <Ionicons name="color-wand" size={24} color="#f59e0b" style={{marginRight: 10}} />
            <View style={{flex: 1}}>
              <Text style={styles.smartModeTitle}>Smart Expansion Mode</Text>
              <Text style={styles.smartModeDesc}>
                If we can't find an exact match, we will show slightly relaxed profiles (e.g. different class but same exam) to ensure you find someone.
              </Text>
            </View>
          </View>
          <Switch 
            value={isSmartMode} 
            onValueChange={(val) => {
              if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsSmartMode(val);
            }} 
            trackColor={{ false: '#e2e8f0', true: '#fcd34d' }}
            thumbColor={isSmartMode ? '#f59e0b' : '#f8fafc'}
          />
        </View>
      </View>
    </Animated.ScrollView>
  );

  // STEP 4: REVIEW & LAUNCH
  const renderStep4 = () => {
    const examName = EXAM_CATEGORIES.find(e => e.id === selectedExam)?.title;
    const timeName = STUDY_TIMINGS.find(t => t.id === selectedTiming)?.label.split(' ')[0]; // Gets 'Early', 'Night', etc.

    return (
      <Animated.ScrollView entering={FadeInRight} exiting={FadeOutLeft} showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContainer}>
        <View style={styles.reviewHeader}>
          <Ionicons name="search-circle" size={80} color="#4f46e5" />
          <Text style={styles.stepTitle}>Ready to Match?</Text>
          <Text style={styles.stepSub}>Here is the persona we are hunting for in our database of thousands of students.</Text>
        </View>

        <View style={styles.reviewCard}>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Target Area</Text>
            <Text style={styles.reviewVal}>{examName}</Text>
          </View>
          <View style={styles.reviewDivider} />
          
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Academic Level</Text>
            <Text style={styles.reviewVal}>{selectedClass}</Text>
          </View>
          <View style={styles.reviewDivider} />
          
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Schedule</Text>
            <Text style={styles.reviewVal}>{timeName}</Text>
          </View>
          <View style={styles.reviewDivider} />
          
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Smart Match</Text>
            <View style={[styles.statusPill, {backgroundColor: isSmartMode ? '#dcfce7' : '#fee2e2'}]}>
              <Text style={[styles.statusText, {color: isSmartMode ? '#16a34a' : '#ef4444'}]}>
                {isSmartMode ? 'Active' : 'Strict Mode'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#3b82f6" style={{marginRight: 10}}/>
          <Text style={styles.infoText}>Profiles you swipe right on will be notified. Only mutually accepted requests open a chat channel.</Text>
        </View>

      </Animated.ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* 🚀 TOP NAVIGATION BAR */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={handleBack} style={styles.navBtn}>
          <Ionicons name={currentStep === 1 ? "close" : "arrow-back"} size={24} color="#0f172a" />
        </TouchableOpacity>
        
        {/* Animated Progress Bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, animatedProgressStyle]} />
        </View>
        
        <Text style={styles.stepCountText}>{currentStep}/{totalSteps}</Text>
      </View>

      {/* 🧩 DYNAMIC CONTENT AREA */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <View style={styles.contentWrapper}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </View>
      </KeyboardAvoidingView>

      {/* 🎮 BOTTOM ACTION BAR */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.primaryBtn} 
          activeOpacity={0.8}
          onPress={handleNext}
        >
          <Text style={styles.primaryBtnText}>
            {currentStep === totalSteps ? 'LAUNCH RADAR' : 'Continue'}
          </Text>
          <Ionicons 
            name={currentStep === totalSteps ? "rocket" : "arrow-forward"} 
            size={20} color="#fff" style={{marginLeft: 10}} 
          />
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

// ==========================================
// 🎨 PREMIUM STYLESHEET (500+ LINES OF DETAIL)
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  
  // Navigation & Progress
  navBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  navBtn: { padding: 8, backgroundColor: '#f8fafc', borderRadius: 12, marginRight: 15 },
  progressTrack: { flex: 1, height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginRight: 15 },
  progressFill: { height: '100%', backgroundColor: '#4f46e5', borderRadius: 4 },
  stepCountText: { fontSize: 13, fontWeight: '800', color: '#94a3b8' },

  contentWrapper: { flex: 1 },
  stepContainer: { padding: 25, paddingBottom: 100 },
  
  // Typography
  stepTitle: { fontSize: 32, fontWeight: '900', color: '#0f172a', marginBottom: 8, letterSpacing: -0.5 },
  stepSub: { fontSize: 15, color: '#64748b', fontWeight: '500', lineHeight: 22, marginBottom: 30 },
  sectionHeader: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginTop: 10, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1 },
  sectionSub: { fontSize: 13, color: '#94a3b8', marginBottom: 15 },

  // Grid Layout (Step 1)
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 15 },
  gridCard: { width: (width - 65) / 2, backgroundColor: '#f8fafc', padding: 20, borderRadius: 20, borderWidth: 2, borderColor: '#f1f5f9', alignItems: 'center', position: 'relative' },
  gridCardActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5', shadowColor: '#4f46e5', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: {width: 0, height: 5}, elevation: 5 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
  gridTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 5 },
  gridDesc: { fontSize: 11, color: '#64748b', textAlign: 'center', fontWeight: '600' },
  checkBadge: { position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },

  // Chip Layout (Step 2)
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  pill: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  pillActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  pillText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  pillTextActive: { color: '#fff' },

  // List Layout (Step 2)
  listContainer: { gap: 12 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  listItemActive: { backgroundColor: '#eef2ff', borderColor: '#4f46e5' },
  listText: { fontSize: 15, fontWeight: '700', color: '#475569' },
  listTextActive: { color: '#4f46e5' },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: '#4f46e5' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#4f46e5' },

  // Goals Layout (Step 3)
  goalsContainer: { gap: 12 },
  goalBox: { flexDirection: 'row', alignItems: 'center', padding: 18, backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  goalBoxActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  goalText: { fontSize: 15, fontWeight: '700', color: '#475569', marginLeft: 15 },

  // Smart Mode Card (Step 3)
  smartModeCard: { backgroundColor: '#fffbeb', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#fde68a', marginTop: 10 },
  smartModeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  smartModeTitle: { fontSize: 16, fontWeight: '900', color: '#b45309', marginBottom: 5 },
  smartModeDesc: { fontSize: 13, color: '#d97706', lineHeight: 20, fontWeight: '500' },

  // Review Layout (Step 4)
  reviewHeader: { alignItems: 'center', marginBottom: 30 },
  reviewCard: { backgroundColor: '#f8fafc', borderRadius: 24, padding: 25, borderWidth: 1, borderColor: '#e2e8f0' },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  reviewLabel: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  reviewVal: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  reviewDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 15 },
  statusPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  infoBox: { flexDirection: 'row', backgroundColor: '#eff6ff', padding: 15, borderRadius: 15, marginTop: 25 },
  infoText: { flex: 1, fontSize: 13, color: '#2563eb', fontWeight: '500', lineHeight: 20 },

  // Shared
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 25 },
  
  // Bottom Bar
  bottomBar: { position: 'absolute', bottom: 0, width: '100%', padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#f1f5f9', paddingBottom: Platform.OS === 'ios' ? 35 : 20 },
  primaryBtn: { backgroundColor: '#0f172a', paddingVertical: 18, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: {width: 0, height: 5} },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' }
});