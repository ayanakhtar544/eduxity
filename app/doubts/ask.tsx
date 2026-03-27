import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, ActivityIndicator, Image, Platform, KeyboardAvoidingView, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp, SlideInDown } from 'react-native-reanimated';

// Firebase & Gamification
import { auth, db } from '../../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { processAction } from '../../helpers/gamificationEngine';
import { useRewardStore } from '../../store/useRewardStore';

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'Other'];

// 🛡️ SECURITY LIMITS (To save Firebase Bills & Prevent Spam)
const MAX_TITLE_LENGTH = 120;
const MAX_DESC_LENGTH = 1000;

export default function AskDoubtScreen() {
  const router = useRouter();
  const showReward = useRewardStore((state) => state.showReward);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 📸 IMAGE PICKER
  const pickImage = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.6, // Compressed to save bandwidth
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64);
    }
  };

  // 🚀 POST DOUBT LOGIC
  const handlePostDoubt = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert("Incomplete", "Please provide a title and description for your doubt.");
      return;
    }
    
    // 🛡️ Extra Server-side Security Check
    if (title.length > MAX_TITLE_LENGTH || description.length > MAX_DESC_LENGTH) {
      Alert.alert("Limit Exceeded", "Text limit exceeded! Please keep your doubt concise.");
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let finalImageUrl = null;

      // 🖼️ Upload Image to ImgBB (Free & Saves Firebase Storage)
      if (imageBase64) {
        const IMGBB_API_KEY = process.env.EXPO_PUBLIC_IMGBB_API_KEY;
        const formData = new FormData(); 
        formData.append('image', imageBase64);
        
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { 
          method: 'POST', 
          body: formData 
        });
        const data = await response.json();
        if (data.success) finalImageUrl = data.data.url;
      }

      // 💾 Save to Firestore (Clean Structure for Feed Algorithm)
      await addDoc(collection(db, 'posts'), {
        type: 'doubt',
        title: title.trim(),
        text: description.trim(),
        subject: subject,
        imageUrl: finalImageUrl,
        isSolved: false, // Default: Author hasn't marked it solved yet
        
        authorId: user.uid,
        authorName: user.displayName || 'Scholar',
        authorAvatar: user.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
        
        boosts: [],
        answersCount: 0,
        topAnswer: null, // Placeholder for the algorithm to fill later
        createdAt: serverTimestamp(),
      });

      // 🎁 Gamification Reward System
      const reward = await processAction(user.uid, 'ASK_DOUBT') || await processAction(user.uid, 'CREATE_POST');
      if (reward && reward.success) {
         showReward({
            xpEarned: reward.xpEarned,
            coinsEarned: reward.coinsEarned,
            leveledUp: reward.leveledUp,
            newLevel: reward.newLevel,
            newBadges: reward.newBadges
         });
      }

      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();

    } catch (error) {
      console.log("Upload failed", error);
      Alert.alert("Error", "Failed to post doubt. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* 🔝 PREMIUM HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ask a Doubt</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Text style={styles.label}>Select Subject</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subjectRow}>
              {SUBJECTS.map((sub) => (
                <TouchableOpacity key={sub} style={[styles.subjectPill, subject === sub && styles.activeSubjectPill]} onPress={() => { setSubject(sub); if(Platform.OS !== 'web') Haptics.selectionAsync(); }}>
                  <Text style={[styles.subjectText, subject === sub && styles.activeSubjectText]}>{sub}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Doubt Title</Text>
              <Text style={[styles.charCount, title.length > MAX_TITLE_LENGTH - 20 && { color: '#ef4444' }]}>
                {title.length}/{MAX_TITLE_LENGTH}
              </Text>
            </View>
            <TextInput 
              style={styles.inputTitle} 
              placeholder="e.g. How to solve projectile motion on an inclined plane?" 
              placeholderTextColor="#94a3b8" 
              value={title} 
              onChangeText={setTitle} 
              maxLength={MAX_TITLE_LENGTH} // 🛡️ Hard Limit
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Detailed Description</Text>
              <Text style={[styles.charCount, description.length > MAX_DESC_LENGTH - 50 && { color: '#ef4444' }]}>
                {description.length}/{MAX_DESC_LENGTH}
              </Text>
            </View>
            <View style={styles.descWrapper}>
              <TextInput 
                style={styles.inputDesc} 
                placeholder="Explain where you are stuck, formulas you tried, or what the exact confusion is..." 
                placeholderTextColor="#94a3b8" 
                value={description} 
                onChangeText={setDescription} 
                multiline
                maxLength={MAX_DESC_LENGTH} // 🛡️ Hard Limit
                textAlignVertical="top"
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <Text style={styles.label}>Attachment (Optional)</Text>
            {imageUri ? (
              <Animated.View entering={SlideInDown.springify()} style={styles.imagePreviewWrapper}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.removeImgBtn} onPress={() => { setImageUri(null); setImageBase64(null); }}>
                  <Ionicons name="trash" size={20} color="#fff" />
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <TouchableOpacity style={styles.uploadBtn} activeOpacity={0.7} onPress={pickImage}>
                <View style={styles.uploadIconBg}>
                  <Ionicons name="image-outline" size={28} color="#4f46e5" />
                </View>
                <View style={{ marginLeft: 15 }}>
                  <Text style={styles.uploadTitle}>Upload Photo</Text>
                  <Text style={styles.uploadSub}>Attach a screenshot of the question</Text>
                </View>
              </TouchableOpacity>
            )}
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(500).springify()}>
            <TouchableOpacity 
              style={[styles.submitBtnContainer, (!title.trim() || !description.trim()) && { opacity: 0.5 }]} 
              onPress={handlePostDoubt} 
              disabled={loading || !title.trim() || !description.trim()}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#1e1b4b', '#4f46e5']} style={styles.submitBtn} start={{x:0, y:0}} end={{x:1, y:1}}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Text style={styles.submitText}>Post Doubt</Text>
                    <Ionicons name="rocket-outline" size={18} color="#fff" style={{ marginLeft: 8 }} />
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

// ==========================================
// 🎨 DHANSU UI STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' }, // Clean light grey background
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f5f9', paddingTop: Platform.OS === 'android' ? 45 : 15 },
  closeBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 14 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', letterSpacing: 0.5 },
  
  scrollContent: { padding: 20, paddingBottom: 60 },
  
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginTop: 15, marginBottom: 10 },
  charCount: { fontSize: 12, color: '#94a3b8', fontWeight: '700' },
  
  subjectRow: { flexDirection: 'row', gap: 10, paddingBottom: 5 },
  subjectPill: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 24, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  activeSubjectPill: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  subjectText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  activeSubjectText: { color: '#fff' },

  inputTitle: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, padding: 18, fontSize: 16, fontWeight: '700', color: '#0f172a', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  
  descWrapper: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, padding: 18, minHeight: 180, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  inputDesc: { flex: 1, fontSize: 15, color: '#334155', lineHeight: 24, outlineStyle: 'none' } as any,

  uploadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#e0e7ff', borderStyle: 'dashed' },
  uploadIconBg: { backgroundColor: '#eef2ff', padding: 12, borderRadius: 16 },
  uploadTitle: { fontSize: 15, fontWeight: '800', color: '#4f46e5' },
  uploadSub: { fontSize: 12, fontWeight: '500', color: '#64748b', marginTop: 2 },
  
  imagePreviewWrapper: { width: '100%', height: 220, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  imagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  removeImgBtn: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(15, 23, 42, 0.7)', padding: 10, borderRadius: 20 },

  submitBtnContainer: { marginTop: 35, shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  submitBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 20, borderRadius: 20 },
  submitText: { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 0.5 }
});