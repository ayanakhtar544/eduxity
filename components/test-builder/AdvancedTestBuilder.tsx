import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// 🔥 FIREBASE IMPORTS (Make sure path is correct based on your folder structure)
import { db, auth } from '../../firebaseConfig'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

import Step1Config from './Step1Config';
import Step2Sections from './Step2Sections';
import Step3Questions from './Step3Questions';
import Step4Publish from './Step4Publish';

export default function AdvancedTestBuilder({ router }: { router: any }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false); // 🔥 Added loading state

  const [examData, setExamData] = useState({ title: '', description: '', category: 'JEE', difficulty: 'Medium', totalDuration: '180' });
  const [sections, setSections] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [settings, setSettings] = useState({ isStrict: true, shuffleQuestions: true, allowCalculator: false, showResultImmediate: true, visibility: 'PUBLIC', isPaid: false, price: '0', enableLeaderboard: true, enableAiAnalytics: true });

  const handleNext = () => {
    if (currentStep === 1 && !examData.title.trim()) return Alert.alert("Error", "Title is required!");
    if (currentStep === 2 && sections.length === 0) return Alert.alert("Error", "Add at least 1 section.");
    if (currentStep === 3 && questions.length === 0) return Alert.alert("Error", "Add at least 1 question.");
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentStep(prev => prev - 1);
  };

  // 🔥 THE REAL PUBLISH FUNCTION
  const handlePublish = async () => {
    if (questions.length === 0) {
      return Alert.alert("Wait!", "You cannot publish an empty test.");
    }
    
    setLoading(true);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    try {
      await addDoc(collection(db, 'exams_enterprise'), {
        title: examData.title, 
        description: examData.description,
        category: examData.category,
        difficulty: examData.difficulty,
        pattern: 'CUSTOM',
        rules: { 
          isStrict: settings.isStrict, 
          globalDuration: parseInt(examData.totalDuration) || 180, 
          allowCalculator: settings.allowCalculator, 
          shuffleQuestions: settings.shuffleQuestions, 
          showResultImmediate: settings.showResultImmediate,
          enableLeaderboard: settings.enableLeaderboard,
          enableAiAnalytics: settings.enableAiAnalytics
        },
        visibility: settings.visibility,
        pricing: {
          isPaid: settings.isPaid || false,
          price: parseInt(settings.price) || 0
        },
        subjects: sections, 
        questions: questions,
        
        // Author Info
        authorId: auth.currentUser?.uid || 'admin',
        authorName: auth.currentUser?.displayName || 'Pro Creator',
        authorAvatar: auth.currentUser?.photoURL || '',
        
        // System Info
        createdAt: serverTimestamp(), 
        status: 'LIVE',
        trendScore: 10, // Top par feed mein laane ke liye
        responses: {}   // Reattempt history block
      });

      Alert.alert("Success 🚀", "Ultimate CBT Published to the Server!");
      router.replace('/'); // Feed pe redirect
    } catch (e) {
      Alert.alert("Error", "Failed to deploy the test. Check your network.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}> 
      
      {/* STEPPER */}
      <View style={styles.stepperContainer}>
        {[1, 2, 3, 4].map((step) => (
          <View key={step} style={styles.stepWrapper}>
            <View style={[styles.stepCircle, currentStep >= step ? styles.stepActive : styles.stepInactive]}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: currentStep >= step ? '#fff' : '#94a3b8' }}>{step}</Text>
            </View>
            {step < 4 && <View style={[styles.stepLine, currentStep > step ? styles.lineActive : styles.lineInactive]} />}
          </View>
        ))}
      </View>

      <Text style={styles.stepHeader}>
        {currentStep === 1 && "1. Exam Setup"}
        {currentStep === 2 && "2. Sections"}
        {currentStep === 3 && "3. Questions"}
        {currentStep === 4 && "4. Publish"}
      </Text>

      {/* MODULES WRAPPER */}
      <View style={{ flex: 1, padding: 15 }}>
        {currentStep === 1 && <Step1Config examData={examData} setExamData={setExamData} />}
        {currentStep === 2 && <Step2Sections sections={sections} setSections={setSections} />}
        {currentStep === 3 && <Step3Questions questions={questions} setQuestions={setQuestions} sections={sections} />}
        {currentStep === 4 && <Step4Publish examData={examData} sections={sections} questions={questions} settings={settings} setSettings={setSettings} />}
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.btnBack} onPress={handleBack}>
            <Text style={styles.btnBackTxt}>Back</Text>
          </TouchableOpacity>
        )}
        
        {/* 🔥 FIX: Button now actually calls handlePublish and shows loading spinner */}
        <TouchableOpacity 
          style={[styles.btnNext, currentStep === 4 && {backgroundColor: '#10b981'}]} 
          onPress={currentStep < 4 ? handleNext : handlePublish}
          disabled={loading}
        >
          {loading ? (
             <ActivityIndicator color="#fff" />
          ) : (
             <Text style={styles.btnNextTxt}>{currentStep < 4 ? "Next Step" : "Publish Test 🚀"}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepperContainer: { flexDirection: 'row', justifyContent: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  stepWrapper: { flexDirection: 'row', alignItems: 'center' },
  stepCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  stepActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  stepInactive: { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' },
  stepLine: { width: 30, height: 3, marginHorizontal: 5, borderRadius: 2 },
  lineActive: { backgroundColor: '#4f46e5' },
  lineInactive: { backgroundColor: '#e2e8f0' },
  stepHeader: { fontSize: 18, fontWeight: '900', color: '#0f172a', paddingHorizontal: 15, paddingTop: 15 },
  
  footer: { flexDirection: 'row', padding: 15, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e2e8f0', gap: 10 },
  btnBack: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, backgroundColor: '#f1f5f9', borderRadius: 12 },
  btnBackTxt: { color: '#64748b', fontWeight: '800', fontSize: 15 },
  btnNext: { flex: 2, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, backgroundColor: '#4f46e5', borderRadius: 12 },
  btnNextTxt: { color: '#fff', fontWeight: '800', fontSize: 15 }
});