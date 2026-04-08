import React, { useState, useEffect } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, StatusBar, ScrollView, Switch 
} from "react-native";
import { useRouter } from "expo-router";
import Animated, { 
  FadeIn, FadeOut, SlideInDown, useAnimatedStyle, 
  withRepeat, withTiming, useSharedValue, withSpring 
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications"; 
import { useSafeNotificationResponse } from '@/hooks/useSafeNotification';
import { useQueryClient } from "@tanstack/react-query";
import { auth } from "../../core/firebase/firebaseConfig";

// Core Imports
import { useUserStore } from "../../store/useUserStore";
import { AIGeneratorService } from "../../core/api/aiGeneratorService";


const LOADING_STEPS = [
  "Waking up the AI Engine... 🤖",
  "Checking Database for PYQs... 🗄️",
  "Analyzing your weak spots... 🧠",
  "Crafting high-yield questions... ✍️",
  "Finalizing your personalized space... ✨"
];

export default function AIGenerationScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, userProfile } = useUserStore();

  // 🟢 PHASE 1: "Magic Search" (Core Inputs)
  const [topic, setTopic] = useState("");
  const [targetGoal, setTargetGoal] = useState("Concept Clarity");
  const [timeAvailable, setTimeAvailable] = useState("15 Mins");

  // 🔴 PHASE 2: "Context Engine" (Advanced Inputs)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [youtubeLink, setYoutubeLink] = useState("");
  const [hasAttachment, setHasAttachment] = useState(false); // For PDF/Image mock

  // ⏳ Loading States
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const pulseScale = useSharedValue(1);

  // ==========================================
  // 🔔 NOTIFICATION AUTO-FILL LOGIC
  // ==========================================
  const lastNotificationResponse = useSafeNotificationResponse();
  
  // 1. Handle notification tap (Background/Killed State)
  useEffect(() => {
    if (
      lastNotificationResponse && 
      lastNotificationResponse.notification.request.content.data
    ) {
      const payload = lastNotificationResponse.notification.request.content.data;
      
      console.log("🔔 Notification tapped! Auto-filling data:", payload);

      if (payload.topic) {
        setTopic(payload.topic as string);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      // Backend should send exactly "Concept Clarity", "Exam Prep", or "Quick Revision"
      if (payload.goal) {
        setTargetGoal(payload.goal as string);
      }
    }
  }, [lastNotificationResponse]);

  // 2. Handle foreground notification (App is open)
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      const payload = notification.request.content.data;
      
      console.log("🔔 Foreground notification received! Auto-filling data:", payload);
      
      if (payload.topic) {
        setTopic(payload.topic as string);
        // Haptic feedback to let user know UI changed magically
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      if (payload.goal) {
        setTargetGoal(payload.goal as string);
      }
    });

    return () => subscription.remove(); // Cleanup listener on unmount
  }, []);

  // ==========================================
  // 🎨 ANIMATIONS & HOOKS
  // ==========================================
  useEffect(() => {
    if (isGenerating) {
      pulseScale.value = withRepeat(withTiming(1.1, { duration: 800 }), -1, true);
      const interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev + 1 < LOADING_STEPS.length ? prev + 1 : prev));
      }, 2500);
      return () => clearInterval(interval);
    } else {
      pulseScale.value = 1;
      setLoadingStepIndex(0);
    }
  }, [isGenerating, pulseScale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }]
  }));

  const advancedHeight = useAnimatedStyle(() => ({
    height: showAdvanced ? withSpring(180) : withTiming(0),
    opacity: showAdvanced ? withTiming(1) : withTiming(0),
    overflow: 'hidden'
  }));

// ==========================================
// 🚀 GENERATION TRIGGER
// ==========================================
const handleGenerate = async () => {
  if (!topic.trim()) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    return; 
  }

  // 🚨 THE PERMANENT FIX: Exact click ke time Firebase se current user fetch karo
  const currentUserId = auth.currentUser?.uid || user?.uid;

  // Agar abhi bhi ID nahi mili, matlab Firebase ka session sach mein expire ho gaya hai
  if (!currentUserId) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    alert("Auth Error: Aapka session sync nahi hua hai. Please app restart karein ya dobara login karein.");
    return; // Yahin se wapas bhej do, API call mat karo
  }

  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  setIsGenerating(true);

  try {
    const payload = {
      subject: "General", 
      topic: topic.trim(),
      examType: userProfile?.targetExam || "JEE",
      difficulty: targetGoal === "Quick Revision" ? "Hard" : "Medium",
      learningGoal: targetGoal,
      timeAvailable: timeAvailable,
      language: userProfile?.preferredLanguage || "Hinglish",
      youtubeLink: showAdvanced ? youtubeLink : null,
      hasFiles: hasAttachment,
      count: timeAvailable === "5 Mins" ? 5 : timeAvailable === "15 Mins" ? 10 : 20,
      userClass: userProfile?.userClass || "12", 
      directText: `Create a ${targetGoal} lesson for ${topic} taking approx ${timeAvailable} to complete.`,
      
      // 🚨 Ab yahan humari guaranteed valid ID jayegi
      userId: currentUserId 
    };

    console.log("🚀 Sending Payload to Backend:", payload);

    const apiResponse = await AIGeneratorService.processMaterialAndGenerateFeed(payload);
    console.log("✅ Backend Response:", apiResponse);

    // Cache invalidation
    queryClient.invalidateQueries({ queryKey: ['feedData'] });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    setTimeout(() => {
      setIsGenerating(false);
      router.back(); 
    }, 1000);

  } catch (error: any) {
    console.error("❌ AI Generation Failed:", error);
    setIsGenerating(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    
    const errorMessage = error?.response?.data?.message || error.message || "Unknown Error";
    alert(`Generation Failed: ${errorMessage}`);
  }
};
  // ==========================================
  // ⏳ FULLSCREEN LOADING OVERLAY
  // ==========================================
  if (isGenerating) {
    return (
      <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <Animated.View style={[styles.iconGlow, pulseStyle]}>
          <Ionicons name="hardware-chip" size={50} color="#fff" />
        </Animated.View>
        <Text style={styles.loadingTitle}>Forging Knowledge...</Text>
        <Animated.Text key={loadingStepIndex} entering={SlideInDown.duration(500)} exiting={FadeOut.duration(300)} style={styles.loadingSubtitle}>
          {LOADING_STEPS[loadingStepIndex]}
        </Animated.Text>
      </Animated.View>
    );
  }

  // ==========================================
  // 📝 MAIN UI
  // ==========================================
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Smart Session</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* TOPIC INPUT */}
        <Animated.View entering={SlideInDown.delay(100).duration(500)}>
          <Text style={styles.label}>What do you want to master today?</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="search" size={20} color="#94a3b8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. Thermodynamics, Cellular Respiration..."
              placeholderTextColor="#94a3b8"
              value={topic}
              onChangeText={setTopic}
              autoFocus
            />
          </View>
        </Animated.View>

        {/* LEARNING GOAL */}
        <Animated.View entering={SlideInDown.delay(200).duration(500)} style={{ marginTop: 25 }}>
          <Text style={styles.label}>Your Primary Goal</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillContainer}>
            {["Concept Clarity", "Exam Prep", "Quick Revision"].map((goal) => (
              <TouchableOpacity
                key={goal}
                onPress={() => { Haptics.selectionAsync(); setTargetGoal(goal); }}
                style={[styles.pill, targetGoal === goal && styles.pillActive]}
              >
                <Text style={[styles.pillText, targetGoal === goal && styles.pillTextActive]}>{goal}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* TIME AVAILABLE */}
        <Animated.View entering={SlideInDown.delay(300).duration(500)} style={{ marginTop: 25 }}>
          <Text style={styles.label}>Time Available</Text>
          <View style={styles.rowPillContainer}>
            {["5 Mins", "15 Mins", "Deep Dive"].map((time) => (
              <TouchableOpacity
                key={time}
                onPress={() => { Haptics.selectionAsync(); setTimeAvailable(time); }}
                style={[styles.rowPill, timeAvailable === time && styles.pillActive]}
              >
                <Text style={[styles.pillText, timeAvailable === time && styles.pillTextActive]}>{time}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* ADVANCED TOGGLE */}
        <Animated.View entering={SlideInDown.delay(400).duration(500)} style={styles.advancedSection}>
          <View style={styles.advancedHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="flask" size={18} color="#4f46e5" />
              <Text style={styles.advancedTitle}>Context Engine (Advanced)</Text>
            </View>
            <Switch 
              value={showAdvanced} 
              onValueChange={(val) => {
                Haptics.selectionAsync();
                setShowAdvanced(val);
              }} 
              trackColor={{ false: "#e2e8f0", true: "#c7d2fe" }}
              thumbColor={showAdvanced ? "#4f46e5" : "#fff"}
            />
          </View>
          
          <Animated.View style={[advancedHeight]}>
            <View style={{ marginTop: 15 }}>
              <Text style={styles.subLabel}>Attach YouTube or Web Link</Text>
              <View style={[styles.inputWrapper, { height: 50, marginBottom: 15 }]}>
                <Ionicons name="link" size={18} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Paste URL here..."
                  placeholderTextColor="#94a3b8"
                  value={youtubeLink}
                  onChangeText={setYoutubeLink}
                />
              </View>

              <TouchableOpacity 
                style={[styles.uploadBtn, hasAttachment && styles.uploadBtnActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setHasAttachment(!hasAttachment);
                }}
              >
                <Ionicons name={hasAttachment ? "checkmark-circle" : "document-attach"} size={20} color={hasAttachment ? "#4f46e5" : "#64748b"} />
                <Text style={[styles.uploadText, hasAttachment && { color: "#4f46e5" }]}>
                  {hasAttachment ? "Notes Attached (Tap to remove)" : "Upload PDF / Image Notes"}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>

      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.generateBtn, !topic.trim() && styles.generateBtnDisabled]} 
          onPress={handleGenerate}
          activeOpacity={0.8}
        >
          <Ionicons name="sparkles" size={20} color={topic.trim() ? "#fff" : "#94a3b8"} />
          <Text style={[styles.generateBtnText, !topic.trim() && { color: "#94a3b8" }]}>
            Generate Learning Space
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ==========================================
// 🎨 STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  
  content: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 40 },
  label: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 12 },
  subLabel: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 15, height: 60, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#0f172a', fontWeight: '500' },
  
  pillContainer: { flexDirection: 'row', gap: 10, paddingRight: 20 },
  rowPillContainer: { flexDirection: 'row', gap: 10 },
  pill: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  rowPill: { flex: 1, paddingVertical: 12, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  pillActive: { backgroundColor: '#eef2ff', borderColor: '#4f46e5' },
  pillText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  pillTextActive: { color: '#4f46e5', fontWeight: '800' },

  advancedSection: { marginTop: 30, backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  advancedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  advancedTitle: { fontSize: 15, fontWeight: '800', color: '#1e293b', marginLeft: 8 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed' },
  uploadBtnActive: { backgroundColor: '#eef2ff', borderColor: '#4f46e5', borderStyle: 'solid' },
  uploadText: { marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#64748b' },

  footer: { padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, backgroundColor: '#f8fafc', borderTopWidth: 1, borderColor: '#e2e8f0' },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4f46e5', height: 60, borderRadius: 20, shadowColor: '#4f46e5', shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  generateBtnDisabled: { backgroundColor: '#e2e8f0', shadowOpacity: 0, elevation: 0 },
  generateBtnText: { color: '#fff', fontSize: 18, fontWeight: '800', marginLeft: 8 },

  loadingContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  iconGlow: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  loadingTitle: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 10 },
  loadingSubtitle: { fontSize: 16, fontWeight: '500', color: '#c7d2fe', textAlign: 'center', paddingHorizontal: 40 },
});