// Location: app/resources/index.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, 
  Platform, KeyboardAvoidingView, ScrollView, ActivityIndicator, Alert,
  LayoutAnimation, UIManager
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

// Firebase Imports
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { AIGeneratorService } from '../../lib/services/aiGeneratorService';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MODES = [
  { id: 'scratch', title: 'Start from Scratch', icon: 'egg-outline', desc: 'Step-by-step concepts' },
  { id: 'revise', title: 'Exam Revision', icon: 'book-outline', desc: 'Balanced concepts & quizzes' },
  { id: 'practice', title: 'Hardcore Practice', icon: 'flame-outline', desc: 'Only tricky MCQs & Games' }
];

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

export default function AdvancedPlannerHub() {
  const router = useRouter();
  
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);

  const [learningMode, setLearningMode] = useState('revise');
  const [currentLevel, setCurrentLevel] = useState('Intermediate');
  
  const [currentTopic, setCurrentTopic] = useState('');
  const [topicsList, setTopicsList] = useState<string[]>([]);
  
  // 📁 Material Sources
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]); 
  const [driveLink, setDriveLink] = useState(''); // 🔥 NEW: Drive Link State
  
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const uid = auth.currentUser?.uid;
      if (uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) setUserProfile(userDoc.data());
        } catch (error) { console.error("Error fetching user:", error); }
      }
      setIsFetchingProfile(false);
    };
    fetchUserData();
  }, []);

  const addTopic = () => {
    if (currentTopic.trim().length > 0 && !topicsList.includes(currentTopic.trim())) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setTopicsList([...topicsList, currentTopic.trim()]);
      setCurrentTopic('');
    }
  };

  const pickDocument = async () => {
    let result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
    if (!result.canceled) {
      setAttachedFiles([...attachedFiles, { type: 'document', uri: result.assets[0].uri, name: result.assets[0].name }]);
    }
  };

 const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, 
      quality: 0.8,
      base64: true, // 🔥 DIRECT BASE64: Ab FileReader ki zaroorat hi nahi!
    });
    
    if (!result.canceled) {
      const asset = result.assets[0];
      // Hum direct base64 aur mimeType save kar lenge
      setAttachedFiles([...attachedFiles, { 
        type: 'image', 
        uri: asset.uri, 
        name: 'Uploaded Image',
        base64: asset.base64, // Pure clean base64
        mimeType: asset.uri.endsWith('.png') ? 'image/png' : 'image/jpeg'
      }]);
    }
  };


  const removeFile = (index: number) => {
    const newFiles = [...attachedFiles];
    newFiles.splice(index, 1);
    setAttachedFiles(newFiles);
  };

 // 📸 HELPER: Convert URI to Base64 (STRICTLY CLEANED FOR GEMINI)
const convertUriToBase64 = async (uri: string) => {
    try {
      const response = await fetch(uri);
      if (!response.ok) throw new Error(`HTTP Fetch Error: ${response.status}`);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result?.toString() || "";
          // 🔥 Ultimate Regex Filter: Ye kisi bhi tarah ke 'data:image/...;base64,' prefix ko uda dega
          const pureBase64 = result.replace(/^data:.*?;base64,/, "");
          resolve(pureBase64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Base64 Conversion Error:", error);
      return null;
    }
  };
 // 🌐 REAL ENGINE: Extract Drive ID and fetch as Base64 (Smart Platform Detection)
  const processDriveLink = async (url: string) => {
    try {
      // Step 1: Extract File ID
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
      if (!fileIdMatch) {
        Alert.alert("Invalid Link", "Bhai, Google Drive ka link sahi format me nahi hai.");
        return null;
      }
      
      const fileId = fileIdMatch[1];
      console.log("Extracted Drive File ID:", fileId);

      // Step 2: Google's direct download endpoint
      const directDownloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      
      // 🛑 THE WEB REALITY CHECK
      if (Platform.OS === 'web') {
        Alert.alert(
          "Web Limitation ⚠️", 
          "Bhai, Web browser pe Google Drive ki security (CORS) direct download block kar deti hai. PC pe testing ke liye 'Upload File' ya 'Scan Photo' button use kar lo.\n\nPhone (Expo Go) pe ye Drive link ekdum perfect chalega!"
        );
        return null; // Rok do, kyunki proxy fail hi hogi
      }
      
      // 📱 MOBILE MAGIC (CORS doesn't exist here)
      console.log("Mobile platform detected: Fetching directly from Google Drive...");
      const base64Data = await convertUriToBase64(directDownloadUrl);
      
      if (!base64Data) {
        throw new Error("Failed to fetch. Is the link set to 'Anyone with the link can view'?");
      }
      
      console.log("Google Drive File successfully converted to Base64!");
      return base64Data;

    } catch (error: any) {
      console.error("Drive Link Process Error:", error);
      Alert.alert("Drive Error 🔒", error.message || "File fetch nahi ho payi. Link check karo.");
      return null;
    }
  };
  const handleGeneratePlan = async () => {
    if (topicsList.length === 0 && !currentTopic.trim() && attachedFiles.length === 0 && !driveLink.trim()) {
      Alert.alert("Input Needed", "Please provide a topic, upload a file, or paste a Drive link.");
      return;
    }

    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsUploading(true);
    setSuccess(false);

    const finalTopics = [...topicsList];
    if (currentTopic.trim()) finalTopics.push(currentTopic.trim());

    try {
      let base64Data = null;
      let detectedMimeType = "image/jpeg"; // Default fallback

      // Handle Image Files FIRST
      const imageFile = attachedFiles.find(f => f.type === 'image');
      if (imageFile) {
        console.log("Processing Local Image...");
        base64Data = imageFile.base64; // Direct use, no fetch needed!
        detectedMimeType = imageFile.mimeType;
      } 
      // Handle Drive Link
      else if (driveLink.trim()) {
        console.log("Processing Drive Link...");
        base64Data = await processDriveLink(driveLink.trim());
      }
      // Handle Local Document (PDF etc)
      else if (attachedFiles.length > 0) {
        console.log("Processing Local Document...");
        base64Data = await convertUriToBase64(attachedFiles[0].uri);
        if (attachedFiles[0].name.endsWith('.pdf')) detectedMimeType = "application/pdf";
      }

      // 🔥 Send mimeType in payload!
      const aiPayload = {
        subject: "Custom Learning Module",
        topic: finalTopics.join(', ') || "Uploaded Material Context",
        examType: userProfile?.targetExam || 'General Prep',
        goal: learningMode,
        time: "Custom Session",
        difficulty: currentLevel,
        contentPreferences: [],
        hasFiles: !!base64Data,
        fileBase64: base64Data, 
        mimeType: detectedMimeType, // Naya field AI ko batane ke liye
        fileNames: attachedFiles.map(f => f.name),
        directText: `Student mode: ${learningMode}. Level: ${currentLevel}. Analyze the material and generate strict micro-learning content.`,
        userClass: userProfile?.class || 'Not specified',
        userBoard: userProfile?.board || 'Not specified',
        weakAreas: 'Not specified' 
      };

      const result = await AIGeneratorService.processMaterialAndGenerateFeed(aiPayload);
      
      if (result) {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSuccess(true);
        setTimeout(() => router.replace('/(tabs)'), 2000);
      } else {
        Alert.alert("AI Error", "Failed to generate AI Feed. Try again.");
      }
    } catch (error) {
      console.error("Plan Gen Error:", error);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setIsUploading(false);
    }
  };
  if (isFetchingProfile) return <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5"/></View>;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="close" size={24} color="#0f172a" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Module</Text>
        <View style={styles.helpBtn}><Ionicons name="sparkles" size={20} color="#4f46e5" /></View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {success ? (
            <Animated.View entering={ZoomIn} style={styles.successBox}>
              <Ionicons name="rocket" size={80} color="#4f46e5" />
              <Text style={styles.successTitle}>Module Ready!</Text>
              <Text style={styles.successSub}>Your personalized feed has been loaded.</Text>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.springify()}>
              
              {/* 🎯 STEP 1: LEARNING MODE */}
              <View style={styles.card}>
                <Text style={styles.sectionHeader}>1. How do you want to learn?</Text>
                <View style={styles.modesContainer}>
                  {MODES.map((mode) => (
                    <TouchableOpacity 
                      key={mode.id} 
                      style={[styles.modeCard, learningMode === mode.id && styles.modeCardActive]}
                      onPress={() => { if(Platform.OS !== 'web') Haptics.selectionAsync(); setLearningMode(mode.id); }}
                    >
                      <Ionicons name={mode.icon as any} size={28} color={learningMode === mode.id ? '#fff' : '#4f46e5'} />
                      <Text style={[styles.modeTitle, learningMode === mode.id && {color: '#fff'}]}>{mode.title}</Text>
                      <Text style={[styles.modeDesc, learningMode === mode.id && {color: '#e0e7ff'}]}>{mode.desc}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.label, {marginTop: 20}]}>Your Current Level</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 10}}>
                  {LEVELS.map(lvl => (
                    <TouchableOpacity key={lvl} style={[styles.chip, currentLevel === lvl && styles.chipActive]} onPress={() => setCurrentLevel(lvl)}>
                      <Text style={[styles.chipText, currentLevel === lvl && styles.chipTextActive]}>{lvl}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* 📚 STEP 2: SOURCE MATERIAL */}
              <View style={styles.card}>
                <Text style={styles.sectionHeader}>2. What are we studying?</Text>
                
                <View style={styles.inputRow}>
                  <TextInput 
                    style={styles.topicInput} placeholder="Type topics (e.g. Thermodynamics)" 
                    value={currentTopic} onChangeText={setCurrentTopic} onSubmitEditing={addTopic}
                  />
                  <TouchableOpacity style={styles.addBtn} onPress={addTopic}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
                </View>

                <View style={styles.topicTagsContainer}>
                  {topicsList.map((topic, idx) => (
                    <View key={idx} style={styles.topicTag}>
                      <Text style={styles.topicTagText}>{topic}</Text>
                      <TouchableOpacity onPress={() => removeTopic(topic)} style={{marginLeft: 8}}><Ionicons name="close-circle" size={18} color="#ef4444" /></TouchableOpacity>
                    </View>
                  ))}
                </View>

                <View style={styles.divider}>
                  <Text style={styles.dividerText}>OR PROVIDE MATERIAL</Text>
                </View>

                {/* 🔥 NEW: Google Drive Link Input */}
                <View style={styles.driveInputContainer}>
                  <Ionicons name="logo-google" size={20} color="#6366f1" style={{marginRight: 10}} />
                  <TextInput 
                    style={styles.driveInput} 
                    placeholder="Paste Google Drive Link here..." 
                    value={driveLink} 
                    onChangeText={setDriveLink}
                    autoCapitalize="none"
                  />
                </View>

                {/* Upload Zone */}
                <View style={styles.uploadRow}>
                  <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
                    <Ionicons name="camera-outline" size={30} color="#6366f1" />
                    <Text style={styles.uploadBoxText}>Scan Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.uploadBox} onPress={pickDocument}>
                    <Ionicons name="document-text-outline" size={30} color="#6366f1" />
                    <Text style={styles.uploadBoxText}>Upload File</Text>
                  </TouchableOpacity>
                </View>

                {/* Show Attached Files */}
                {attachedFiles.map((file, idx) => (
                  <Animated.View entering={ZoomIn} key={idx} style={styles.attachedFileRow}>
                    <Ionicons name={file.type === 'image' ? "image" : "document"} size={24} color="#4f46e5" />
                    <Text style={styles.attachedFileName} numberOfLines={1}>{file.name}</Text>
                    <TouchableOpacity onPress={() => removeFile(idx)}><Ionicons name="trash-outline" size={20} color="#ef4444" /></TouchableOpacity>
                  </Animated.View>
                ))}

              </View>

              {/* 🚀 SUBMIT ACTION */}
              <TouchableOpacity style={styles.generateBtn} onPress={handleGeneratePlan} disabled={isUploading}>
                <LinearGradient colors={['#0f172a', '#4f46e5']} style={styles.btnGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
                  {isUploading ? <ActivityIndicator color="#fff" /> : (
                    <><Ionicons name="flash" size={24} color="#fde047" style={{marginRight: 10}} /><Text style={styles.btnText}>Ignite AI Engine</Text></>
                  )}
                </LinearGradient>
              </TouchableOpacity>

            </Animated.View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#f4f4f5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e4e4e7' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f4f4f5', justifyContent: 'center', alignItems: 'center' },
  helpBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  scrollContent: { padding: 15, paddingBottom: 50 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 15, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  sectionHeader: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 15 },
  label: { fontSize: 13, fontWeight: '800', color: '#475569', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  modesContainer: { gap: 10 },
  modeCard: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 16, borderWidth: 2, borderColor: '#e2e8f0' },
  modeCardActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  modeTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginTop: 8 },
  modeDesc: { fontSize: 13, color: '#64748b', marginTop: 4, fontWeight: '500' },
  
  chip: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#f4f4f5', borderRadius: 20, borderWidth: 1, borderColor: '#e4e4e7' },
  chipActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  chipText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  chipTextActive: { color: '#fff' },

  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  topicInput: { flex: 1, backgroundColor: '#f4f4f5', height: 50, borderRadius: 12, paddingHorizontal: 15, fontSize: 15, fontWeight: '600', color: '#0f172a', borderWidth: 1, borderColor: '#e4e4e7' },
  addBtn: { width: 50, height: 50, backgroundColor: '#0f172a', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  topicTagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  topicTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#c7d2fe' },
  topicTagText: { fontSize: 14, fontWeight: '700', color: '#4f46e5' },

  divider: { marginVertical: 20, alignItems: 'center' },
  dividerText: { fontSize: 12, fontWeight: '800', color: '#94a3b8', letterSpacing: 1 },

  // 🔥 NEW DRIVE INPUT STYLE
  driveInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#c7d2fe', borderRadius: 12, paddingHorizontal: 15, height: 50, marginBottom: 15 },
  driveInput: { flex: 1, fontSize: 14, fontWeight: '600', color: '#0f172a' },
  
  uploadRow: { flexDirection: 'row', gap: 15 },
  uploadBox: { flex: 1, backgroundColor: '#f8fafc', borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed', borderRadius: 16, padding: 20, alignItems: 'center', justifyContent: 'center' },
  uploadBoxText: { fontSize: 14, fontWeight: '700', color: '#64748b', marginTop: 8 },

  attachedFileRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef2ff', padding: 12, borderRadius: 12, marginTop: 15, borderWidth: 1, borderColor: '#c7d2fe' },
  attachedFileName: { flex: 1, fontSize: 14, fontWeight: '700', color: '#4f46e5', marginLeft: 10 },

  generateBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 15, elevation: 8 },
  btnGradient: { flexDirection: 'row', height: 60, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  successBox: { alignItems: 'center', padding: 40 },
  successTitle: { fontSize: 24, fontWeight: '900', marginTop: 20 },
  successSub: { fontSize: 14, color: '#64748b', textAlign: 'center' }
});