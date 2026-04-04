import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, 
  Alert, Platform, StatusBar, KeyboardAvoidingView, ActivityIndicator, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, ZoomIn, Layout, FadeOut } from 'react-native-reanimated';

// FIREBASE
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

// AI SERVICE
import { AIGeneratorService } from '../../lib/services/aiGeneratorService';

export default function ResourceUploadScreen() {
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;

  // 👤 USER PROFILE STATE
  const [userProfile, setUserProfile] = useState<any>(null);

  // 📝 INPUT STATES
  const [currentTopic, setCurrentTopic] = useState('');
  const [subject, setSubject] = useState(''); 
  const [chapter, setChapter] = useState(''); 
  const [driveLink, setDriveLink] = useState('');
  
  // 🎛️ UI STATES
  const [uploadMode, setUploadMode] = useState<'PHOTO' | 'LINK'>('PHOTO');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingText, setLoadingText] = useState("Igniting AI Engine...");


  const [selectedLanguage, setSelectedLanguage] = useState('Hinglish'); // Default Hinglish 🚀
  const LANGUAGES = ['English', 'Hindi', 'Hinglish'];

  // 📡 FETCH USER CONTEXT
  useEffect(() => {
    const fetchUser = async () => {
      if (!currentUid) return;
      const docSnap = await getDoc(doc(db, 'users', currentUid));
      if (docSnap.exists()) setUserProfile(docSnap.data());
    };
    fetchUser();
  }, [currentUid]);

  // 📸 IMAGE PICKER (Direct Base64)
  const pickImage = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, quality: 0.8, base64: true,
    });
    
    if (!result.canceled) {
      const asset = result.assets[0];
      setAttachedFiles([{ 
        type: 'image', uri: asset.uri, name: 'Scanned Material',
        base64: asset.base64, mimeType: asset.uri.endsWith('.png') ? 'image/png' : 'image/jpeg'
      }]);
    }
  };

  const removeFile = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setAttachedFiles([]);
  };

  // 🌐 DRIVE LINK BASE64 CONVERTER (Bulletproof)
  const convertUriToBase64 = async (uri: string) => {
    try {
      const response = await fetch(uri);
      if (!response.ok) throw new Error(`HTTP Fetch Error: ${response.status}`);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result?.toString() || "";
          resolve(result.replace(/^data:.*?;base64,/, ""));
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) { return null; }
  };

  const processDriveLink = async (url: string) => {
    try {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
      if (!fileIdMatch) { Alert.alert("Invalid Link", "Please paste a valid Google Drive link."); return null; }
      
      const fileId = fileIdMatch[1];
      if (Platform.OS === 'web') {
        Alert.alert("Web Blocked ⚠️", "Google Drive links have strict CORS on web. Please use 'Upload Photo' during local testing!");
        return null; 
      }
      
      const directDownloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      const base64Data = await convertUriToBase64(directDownloadUrl);
      if (!base64Data) throw new Error("Failed to fetch. Ensure link is 'Anyone with link can view'.");
      
      return base64Data;
    } catch (error: any) {
      Alert.alert("Drive Error 🔒", error.message || "Failed to process link.");
      return null;
    }
  };

  // 🚀 THE HYBRID GENERATOR ENGINE
  const handleGeneratePlan = async () => {
    if (!currentTopic.trim() && attachedFiles.length === 0 && !driveLink.trim()) {
      Alert.alert("Data Needed", "Please type a topic, upload a photo, or paste a link.");
      return;
    }

    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsUploading(true);

    try {
      let base64Data = null;
      let detectedMimeType = "image/jpeg"; 

      if (uploadMode === 'PHOTO' && attachedFiles.length > 0) {
        setLoadingText("Extracting visual context...");
        base64Data = attachedFiles[0].base64; 
        detectedMimeType = attachedFiles[0].mimeType;
      } else if (uploadMode === 'LINK' && driveLink.trim()) {
        setLoadingText("Fetching Drive data safely...");
        base64Data = await processDriveLink(driveLink.trim());
        if (!base64Data) { setIsUploading(false); return; } // Stopped by CORS or error
      }

      setLoadingText("AI is building your personalized world...");

      // 🔥 THE GOD-LEVEL PAYLOAD
      const aiPayload = {
        topic: currentTopic.trim() || "Analyze from attached material",
        subject: subject.trim() || "AUTO_DETECT", 
        chapter: chapter.trim() || "AUTO_DETECT",
        userClass: userProfile?.class || 'Class 11',
        examType: userProfile?.targetExam || 'JEE Mains',
        difficulty: userProfile?.level || 'Advanced',
        hasFiles: !!base64Data,
        fileBase64: base64Data, 
        mimeType: detectedMimeType,
        language: selectedLanguage, // 🔥 SEND LANGUAGE
        count: 15, // 🔥 15 POSTS ON INITIAL GENERATION
      };

      const result = await AIGeneratorService.processMaterialAndGenerateFeed(aiPayload);
      
      if (result) {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)'); 
      } else {
        Alert.alert("Engine Failed", "AI could not process the request. Try again.");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong in the pipeline.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      
      {/* 🔝 PREMIUM HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <View style={{alignItems: 'center'}}>
          <Text style={styles.headerTitle}>Resource Scanner</Text>
          <Text style={styles.headerSub}>Create hyper-personalized posts</Text>
        </View>
        <View style={{width: 40}}/>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          {/* 🎯 MAIN INTENT */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Text style={styles.label}>What do you want to master today?</Text>
            <TextInput
              style={styles.mainInput}
              placeholder="E.g., Rotational Mechanics, Plant Physiology..."
              placeholderTextColor="#94a3b8"
              value={currentTopic}
              onChangeText={setCurrentTopic}
              multiline
            />
          </Animated.View>

          {/* 🎛️ ADVANCED CONTEXT TOGGLE */}
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.advancedSection}>
            <TouchableOpacity 
              style={styles.advancedToggleBtn} 
              onPress={() => { if(Platform.OS!=='web') Haptics.selectionAsync(); setShowAdvanced(!showAdvanced); }}
            >
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Ionicons name="options" size={20} color="#4f46e5" />
                <Text style={styles.advancedToggleText}>Deep Context Tags (Optional)</Text>
              </View>
              <Ionicons name={showAdvanced ? "chevron-up" : "chevron-down"} size={20} color="#4f46e5" />
            </TouchableOpacity>

            {showAdvanced && (
              <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} layout={Layout.springify()} style={styles.optionalBox}>
                <Text style={styles.optionalLabel}>Leave empty for AI Auto-Detect 🤖</Text>
                <View style={styles.inputRow}>
                  <View style={styles.halfInputBox}>
                    <Ionicons name="book-outline" size={16} color="#94a3b8" style={styles.inputIcon}/>
                    <TextInput style={styles.subInput} placeholder="Subject" placeholderTextColor="#cbd5e1" value={subject} onChangeText={setSubject} />
                  </View>
                  <View style={styles.halfInputBox}>
                    <Ionicons name="library-outline" size={16} color="#94a3b8" style={styles.inputIcon}/>
                    <TextInput style={styles.subInput} placeholder="Chapter" placeholderTextColor="#cbd5e1" value={chapter} onChangeText={setChapter} />
                  </View>
                </View>
              </Animated.View>
            )}
          </Animated.View>

          {/* 📁 UPLOAD TABS */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Text style={styles.label}>Attach Material (Boosts Accuracy)</Text>
            <View style={styles.tabContainer}>
              <TouchableOpacity style={[styles.tabBtn, uploadMode === 'PHOTO' && styles.tabBtnActive]} onPress={() => setUploadMode('PHOTO')}>
                <Ionicons name="camera" size={18} color={uploadMode === 'PHOTO' ? '#fff' : '#64748b'} />
                <Text style={[styles.tabText, uploadMode === 'PHOTO' && styles.tabTextActive]}>Scan Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabBtn, uploadMode === 'LINK' && styles.tabBtnActive]} onPress={() => setUploadMode('LINK')}>
                <Ionicons name="link" size={18} color={uploadMode === 'LINK' ? '#fff' : '#64748b'} />
                <Text style={[styles.tabText, uploadMode === 'LINK' && styles.tabTextActive]}>Drive Link</Text>
              </TouchableOpacity>
            </View>

            {/* UPLOAD ZONES */}
            {uploadMode === 'PHOTO' ? (
              attachedFiles.length > 0 ? (
                <Animated.View entering={ZoomIn} style={styles.imagePreviewBox}>
                  <Image source={{uri: attachedFiles[0].uri}} style={styles.previewImg} />
                  <TouchableOpacity style={styles.removeImgBtn} onPress={removeFile}>
                    <Ionicons name="trash" size={20} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.previewText}>Material Attached ✅</Text>
                </Animated.View>
              ) : (
                <TouchableOpacity style={styles.uploadArea} onPress={pickImage} activeOpacity={0.8}>
                  <View style={styles.iconCircle}><Ionicons name="scan-outline" size={32} color="#4f46e5" /></View>
                  <Text style={styles.uploadTitle}>Tap to scan notes or book</Text>
                  <Text style={styles.uploadSub}>JPEG, PNG up to 10MB</Text>
                </TouchableOpacity>
              )
            ) : (
              <Animated.View entering={FadeIn} style={styles.linkArea}>
                <Ionicons name="logo-google" size={24} color="#4285F4" />
                <TextInput
                  style={styles.linkInput}
                  placeholder="Paste Google Drive URL here..."
                  placeholderTextColor="#94a3b8"
                  value={driveLink}
                  onChangeText={setDriveLink}
                />
              </Animated.View>
            )}
          </Animated.View>

          {/* 🌐 LANGUAGE SELECTOR */}
          <Animated.View entering={FadeInDown.delay(150).springify()} style={{marginTop: 20}}>
            <Text style={styles.label}>Choose Learning Language 🗣️</Text>
            <View style={styles.tabContainer}>
              {LANGUAGES.map(lang => (
                <TouchableOpacity 
                  key={lang} 
                  style={[styles.tabBtn, selectedLanguage === lang && styles.tabBtnActive]} 
                  onPress={() => setSelectedLanguage(lang)}
                >
                  <Text style={[styles.tabText, selectedLanguage === lang && styles.tabTextActive]}>{lang}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* 🚀 GENERATE BUTTON */}
          <Animated.View entering={FadeInDown.delay(400).springify()} style={{marginTop: 40}}>
            <TouchableOpacity 
              style={[styles.generateBtn, (!currentTopic && attachedFiles.length===0 && !driveLink) && styles.generateBtnDisabled]} 
              onPress={handleGeneratePlan} 
              activeOpacity={0.9}
            >
              <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.gradientBtn}>
                <Text style={styles.generateBtnText}>Ignite AI Engine</Text>
                <Ionicons name="rocket" size={20} color="#fde047" style={{marginLeft: 10}} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 🔮 FULL SCREEN PROCESSING OVERLAY */}
      {isUploading && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.overlay}>
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#4f46e5" style={{marginBottom: 20, transform: [{scale: 1.5}]}} />
            <Text style={styles.loaderTitle}>Processing Data</Text>
            <Text style={styles.loaderSub}>{loadingText}</Text>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 SENIOR DEV STYLES (Ultra Premium)
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0', zIndex: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  headerSub: { fontSize: 12, fontWeight: '700', color: '#4f46e5', marginTop: 2 },
  
  scrollContent: { padding: 20, paddingBottom: 100 },
  label: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 12, marginLeft: 4 },
  
  mainInput: { backgroundColor: '#fff', padding: 20, borderRadius: 20, fontSize: 16, borderWidth: 1, borderColor: '#e2e8f0', minHeight: 120, textAlignVertical: 'top', color: '#0f172a', fontWeight: '600', shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  
  advancedSection: { marginTop: 25, marginBottom: 25 },
  advancedToggleBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#eef2ff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#c7d2fe' },
  advancedToggleText: { fontSize: 14, fontWeight: '800', color: '#4f46e5', marginLeft: 8 },
  optionalBox: { marginTop: 10, backgroundColor: '#fff', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  optionalLabel: { fontSize: 11, fontWeight: '800', color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase', textAlign: 'center' },
  inputRow: { flexDirection: 'row', gap: 10 },
  halfInputBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  subInput: { flex: 1, height: 45, fontSize: 14, color: '#0f172a', fontWeight: '600' },

  tabContainer: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 14, padding: 4, marginBottom: 15 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10 },
  tabBtnActive: { backgroundColor: '#0f172a', shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '700', color: '#64748b', marginLeft: 8 },
  tabTextActive: { color: '#fff' },

  uploadArea: { backgroundColor: '#fff', padding: 30, borderRadius: 24, alignItems: 'center', borderWidth: 2, borderColor: '#cbd5e1', borderStyle: 'dashed' },
  iconCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  uploadTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  uploadSub: { fontSize: 12, fontWeight: '600', color: '#94a3b8', marginTop: 4 },

  imagePreviewBox: { backgroundColor: '#0f172a', borderRadius: 24, padding: 10, alignItems: 'center', position: 'relative' },
  previewImg: { width: '100%', height: 200, borderRadius: 16, opacity: 0.8 },
  removeImgBtn: { position: 'absolute', top: 20, right: 20, backgroundColor: 'rgba(239, 68, 68, 0.9)', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  previewText: { position: 'absolute', bottom: 20, color: '#fff', fontWeight: '900', fontSize: 16, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },

  linkArea: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 15, height: 60, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  linkInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#0f172a', fontWeight: '600' },

  generateBtn: { borderRadius: 20, shadowColor: '#4f46e5', shadowOffset: {width:0, height:8}, shadowOpacity: 0.4, shadowRadius: 15, elevation: 8, overflow: 'hidden' },
  generateBtnDisabled: { opacity: 0.5 },
  gradientBtn: { flexDirection: 'row', paddingVertical: 20, justifyContent: 'center', alignItems: 'center' },
  generateBtnText: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },

  // Loader Overlay
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.85)', zIndex: 100, justifyContent: 'center', alignItems: 'center' },
  loaderBox: { backgroundColor: '#fff', padding: 40, borderRadius: 30, alignItems: 'center', width: '80%', shadowColor: '#000', shadowOffset: {width:0, height:10}, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  loaderTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 8 },
  loaderSub: { fontSize: 14, fontWeight: '600', color: '#64748b', textAlign: 'center' }
});