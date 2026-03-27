import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

// Firebase imports
import { auth, db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const BUG_TYPES = ['App Crash', 'UI Glitch', 'Feature Not Working', 'Other'];

export default function ReportBugScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bugType, setBugType] = useState(BUG_TYPES[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmitBug = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert("Hold on!", "Please provide both a title and description for the bug.");
      return;
    }

    const user = auth.currentUser;
    setLoading(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await addDoc(collection(db, 'bugs'), {
        title: title.trim(),
        description: description.trim(),
        type: bugType,
        status: 'Open', // You can change this to 'In Progress' or 'Fixed' manually in Firebase
        userId: user?.uid || 'Anonymous',
        userName: user?.displayName || 'Unknown User',
        userEmail: user?.email || 'N/A',
        createdAt: serverTimestamp(),
      });

      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Bug Reported 🐛", "Thanks for helping us improve Eduxity! Our team will look into this.");
      router.back();
    } catch (error) {
      console.error("Bug Report Error:", error);
      Alert.alert("Error", "Could not submit bug report. Check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* 🔝 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report a Bug</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          {/* BANNER */}
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.banner}>
            <View style={styles.bannerIconBg}>
              <Ionicons name="bug" size={24} color="#ef4444" />
            </View>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.bannerTitle}>Found a glitch?</Text>
              <Text style={styles.bannerSub}>Let us know what's broken so we can squash the bug and improve the app!</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Text style={styles.label}>What kind of bug is this?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
              {BUG_TYPES.map((type) => (
                <TouchableOpacity key={type} style={[styles.typePill, bugType === type && styles.activeTypePill]} onPress={() => { setBugType(type); if(Platform.OS !== 'web') Haptics.selectionAsync(); }}>
                  <Text style={[styles.typeText, bugType === type && styles.activeTypeText]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Text style={styles.label}>Bug Title</Text>
            <TextInput 
              style={styles.inputTitle} 
              placeholder="e.g. App crashes when opening tests" 
              placeholderTextColor="#94a3b8" 
              value={title} 
              onChangeText={setTitle} 
              maxLength={80}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <Text style={styles.label}>Steps to reproduce / Description</Text>
            <View style={styles.descWrapper}>
              <TextInput 
                style={styles.inputDesc} 
                placeholder="Explain exactly what happened and how we can recreate the issue..." 
                placeholderTextColor="#94a3b8" 
                value={description} 
                onChangeText={setDescription} 
                multiline
                maxLength={1000}
                textAlignVertical="top"
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(500).springify()}>
            <TouchableOpacity 
              style={[styles.submitBtnContainer, (!title.trim() || !description.trim()) && { opacity: 0.5 }]} 
              onPress={handleSubmitBug} 
              disabled={loading || !title.trim() || !description.trim()}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#dc2626', '#ef4444']} style={styles.submitBtn} start={{x:0, y:0}} end={{x:1, y:1}}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Text style={styles.submitText}>Submit Bug Report</Text>
                    <Ionicons name="send" size={16} color="#fff" style={{ marginLeft: 8 }} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// 🎨 PREMIUM STYLES
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' }, 
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0', paddingTop: Platform.OS === 'android' ? 45 : 15 },
  backBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 14 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', letterSpacing: 0.5 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  
  banner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', padding: 20, borderRadius: 16, marginBottom: 25, borderWidth: 1, borderColor: '#fecaca' },
  bannerIconBg: { backgroundColor: '#fee2e2', padding: 12, borderRadius: 16 },
  bannerTitle: { fontSize: 16, fontWeight: '900', color: '#b91c1c', marginBottom: 4 },
  bannerSub: { fontSize: 13, color: '#991b1b', lineHeight: 20, fontWeight: '500' },

  label: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginTop: 10, marginBottom: 10 },
  
  typeRow: { flexDirection: 'row', gap: 10, paddingBottom: 15 },
  typePill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  activeTypePill: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  typeText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  activeTypeText: { color: '#fff' },

  inputTitle: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, padding: 16, fontSize: 15, fontWeight: '600', color: '#0f172a', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1, marginBottom: 15 },
  
  descWrapper: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, padding: 16, minHeight: 180, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  inputDesc: { flex: 1, fontSize: 15, color: '#334155', lineHeight: 24, outlineStyle: 'none' } as any,

  submitBtnContainer: { marginTop: 35, shadowColor: '#ef4444', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  submitBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 20, borderRadius: 20 },
  submitText: { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 0.5 }
});