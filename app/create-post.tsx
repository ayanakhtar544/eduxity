import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Image, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, 
  Alert, KeyboardAvoidingView, Platform, Keyboard 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { auth, db, storage } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn, SlideInDown, Layout } from 'react-native-reanimated';

// Types definition for Strict Architecture
type PostType = 'text' | 'image' | 'code' | 'poll';
const CATEGORIES = ['General', 'JEE Warriors', 'Coding Group', 'Doubts', 'Resources'];

export default function CreatePostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // ==========================================
  // 🧠 1. STATE MANAGEMENT (THE BRAIN)
  // ==========================================
  const [postType, setPostType] = useState<PostType>((params.type as PostType) || 'text');
  const [text, setText] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [showCategories, setShowCategories] = useState(false);
  const [loading, setLoading] = useState(false);

  // Image Specific States
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Code Specific States
  const [codeSnippet, setCodeSnippet] = useState('');
  const [language, setLanguage] = useState('javascript');

  // Poll Specific States
  const [pollOptions, setPollOptions] = useState(['', '']); // Default 2 options

  // Keyboard adjustment state
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  // ==========================================
  // 📸 2. MEDIA HANDLING
  // ==========================================
  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.6, // Fast upload via optimized size
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        setPostType('image');
      }
    } catch (error) {
      Alert.alert('Error', 'Image select karne mein dikkat aayi.');
    }
  };

  // ==========================================
  // 📊 3. POLL ENGINE
  // ==========================================
  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    } else {
      Alert.alert("Limit Reached", "A maximum of 4 options are allowed for a clean UI.");
    }
  };

  const updatePollOption = (value: string, index: number) => {
    const updatedOptions = [...pollOptions];
    updatedOptions[index] = value;
    setPollOptions(updatedOptions);
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      const updatedOptions = pollOptions.filter((_, i) => i !== index);
      setPollOptions(updatedOptions);
    }
  };

  // ==========================================
  // 🚀 4. UPLOAD ENGINE (THE BEAST)
  // ==========================================
  const handlePublish = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "You must be logged in to post.");
      return;
    }

    // 🚨 Validations
    if (!text.trim() && postType === 'text') {
      Alert.alert("Empty Post", "Kuch toh likho bhai!");
      return;
    }
    if (postType === 'code' && !codeSnippet.trim()) {
      Alert.alert("Empty Code", "Code snippet is missing.");
      return;
    }
    if (postType === 'poll') {
      const validOptions = pollOptions.filter(opt => opt.trim() !== '');
      if (validOptions.length < 2) {
        Alert.alert("Invalid Poll", "Poll mein kam se kam 2 valid options hone chahiye.");
        return;
      }
    }

    setLoading(true);

    try {
      let finalImageUrl = null;

      // 🖼️ Step A: Image Upload to Firebase Storage (If applicable)
      if (postType === 'image' && imageUri) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        // Unique filename generation
        const storageRef = ref(storage, `posts/${user.uid}_${Date.now()}.jpg`);
        await uploadBytes(storageRef, blob);
        finalImageUrl = await getDownloadURL(storageRef);
      }

      // 📦 Step B: Constructing Database Object
      const postData: any = {
        authorId: user.uid,
        authorName: user.displayName || 'Eduxity User',
        authorAvatar: user.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
        type: postType,
        category: category,
        text: text.trim(),
        likes: [],
        savedBy: [],
        commentsCount: 0,
        createdAt: serverTimestamp(),
      };

      // Attaching specific data based on type
      if (finalImageUrl) postData.imageUrl = finalImageUrl;
      
      if (postType === 'code') {
        postData.codeSnippet = codeSnippet;
        postData.language = language;
      }

      if (postType === 'poll') {
        // Structuring poll options for real-time voting tracking
        postData.pollOptions = pollOptions
          .filter(opt => opt.trim() !== '')
          .map(opt => ({ text: opt.trim(), votes: 0 }));
        postData.totalVotes = 0;
        postData.voters = []; // To track who voted
      }

      // 🔥 Step C: Sending to Firestore
      await addDoc(collection(db, 'posts'), postData);
      
      // Cleanup & Navigate
      setLoading(false);
      router.back();

    } catch (error) {
      console.error("Publish Error:", error);
      Alert.alert("Upload Failed", "Post upload nahi ho payi. Network check karo.");
      setLoading(false);
    }
  };

  // ==========================================
  // 🎨 5. DYNAMIC UI RENDERERS
  // ==========================================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* 🔝 TOP NAVBAR */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} disabled={loading}>
          <Ionicons name="close" size={28} color="#0f172a" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Create Post</Text>
        
        <TouchableOpacity 
          style={[styles.publishBtn, (!text.trim() && postType === 'text') ? styles.publishBtnDisabled : null]} 
          onPress={handlePublish}
          disabled={loading || (!text.trim() && postType === 'text')}
        >
          {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.publishBtnText}>Post</Text>}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* 👤 AUTHOR PROFILE & CATEGORY SELECTOR */}
          <View style={styles.authorSection}>
            <Image source={{ uri: auth.currentUser?.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} style={styles.authorAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.authorName}>{auth.currentUser?.displayName || 'User'}</Text>
              
              {/* Category Dropdown Toggle */}
              <TouchableOpacity style={styles.categorySelector} onPress={() => setShowCategories(!showCategories)}>
                <Text style={styles.categoryText}>{category}</Text>
                <Ionicons name={showCategories ? "caret-up" : "caret-down"} size={12} color="#2563eb" style={{ marginLeft: 5 }} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Category Dropdown Menu */}
          {showCategories && (
            <Animated.View entering={SlideInDown.duration(200)} style={styles.categoryDropdown}>
              {CATEGORIES.map((cat, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={[styles.categoryOption, category === cat && styles.categoryOptionActive]}
                  onPress={() => { setCategory(cat); setShowCategories(false); }}
                >
                  <Text style={[styles.categoryOptionText, category === cat && { color: '#fff' }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}

          {/* ✍️ MAIN TEXT INPUT (Used for Caption/Doubt/Question) */}
          <TextInput
            style={styles.mainInput}
            placeholder={postType === 'poll' ? "Ask a question..." : "What's on your mind?"}
            placeholderTextColor="#94a3b8"
            multiline
            value={text}
            onChangeText={setText}
            autoFocus
          />

          {/* 🖼️ DYNAMIC SECTION: IMAGE PREVIEW */}
          {postType === 'image' && imageUri && (
            <Animated.View entering={FadeIn} layout={Layout.springify()} style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
              <TouchableOpacity style={styles.removeMediaBtn} onPress={() => { setImageUri(null); setPostType('text'); }}>
                <Ionicons name="trash" size={20} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* 💻 DYNAMIC SECTION: CODE EDITOR */}
          {postType === 'code' && (
            <Animated.View entering={FadeIn} layout={Layout.springify()} style={styles.codeSection}>
              <View style={styles.codeHeader}>
                <View style={styles.macDots}>
                  <View style={[styles.macDot, { backgroundColor: '#ff5f56' }]} />
                  <View style={[styles.macDot, { backgroundColor: '#ffbd2e' }]} />
                  <View style={[styles.macDot, { backgroundColor: '#27c93f' }]} />
                </View>
                <TextInput 
                  style={styles.langInput} 
                  placeholder="Language (e.g. JSX, Python)" 
                  placeholderTextColor="#64748b"
                  value={language} 
                  onChangeText={setLanguage} 
                />
              </View>
              <TextInput 
                style={styles.codeEditor} 
                placeholder="// Paste or write your code here..." 
                placeholderTextColor="#64748b"
                multiline
                value={codeSnippet}
                onChangeText={setCodeSnippet}
                spellCheck={false}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </Animated.View>
          )}

          {/* 📊 DYNAMIC SECTION: POLL BUILDER */}
          {postType === 'poll' && (
            <Animated.View entering={FadeIn} layout={Layout.springify()} style={styles.pollSection}>
              <View style={styles.pollHeader}>
                <Ionicons name="stats-chart" size={18} color="#3b82f6" />
                <Text style={styles.pollSectionTitle}>Create Live Poll</Text>
              </View>
              
              {pollOptions.map((opt, idx) => (
                <View key={idx} style={styles.pollOptionRow}>
                  <TextInput
                    style={styles.pollInput}
                    placeholder={`Option ${idx + 1}`}
                    placeholderTextColor="#94a3b8"
                    value={opt}
                    onChangeText={(val) => updatePollOption(val, idx)}
                    maxLength={50}
                  />
                  {pollOptions.length > 2 && (
                    <TouchableOpacity onPress={() => removePollOption(idx)} style={styles.removeOptBtn}>
                      <Ionicons name="close-circle" size={22} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {pollOptions.length < 4 && (
                <TouchableOpacity style={styles.addOptionBtn} onPress={handleAddPollOption}>
                  <Ionicons name="add-circle-outline" size={20} color="#2563eb" />
                  <Text style={styles.addOptionText}>Add Option</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          )}

        </ScrollView>

        {/* 🛠️ BOTTOM TOOLBAR (Type Selector) */}
        {!isKeyboardVisible && (
          <View style={styles.toolbar}>
            <Text style={styles.toolbarTitle}>Add to your post</Text>
            <View style={styles.toolbarIcons}>
              <TouchableOpacity 
                style={[styles.toolBtn, postType === 'image' && styles.toolBtnActive]} 
                onPress={pickImage}
              >
                <Ionicons name="image" size={24} color={postType === 'image' ? '#fff' : '#10b981'} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.toolBtn, postType === 'poll' && styles.toolBtnActive]} 
                onPress={() => setPostType('poll')}
              >
                <Ionicons name="stats-chart" size={24} color={postType === 'poll' ? '#fff' : '#3b82f6'} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.toolBtn, postType === 'code' && styles.toolBtnActive]} 
                onPress={() => setPostType('code')}
              >
                <Ionicons name="code-slash" size={24} color={postType === 'code' ? '#fff' : '#8b5cf6'} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.toolBtn, postType === 'text' && styles.toolBtnActive]} 
                onPress={() => { setPostType('text'); setImageUri(null); }}
              >
                <Ionicons name="text" size={24} color={postType === 'text' ? '#fff' : '#64748b'} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 PREMIUM STYLING
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  iconBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  publishBtn: { backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  publishBtnDisabled: { backgroundColor: '#93c5fd' },
  publishBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  
  // Content Layout
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  // Author Section
  authorSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, zIndex: 10 },
  authorAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  authorName: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  categorySelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 4, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#bfdbfe' },
  categoryText: { fontSize: 12, color: '#2563eb', fontWeight: '700' },
  
  // Dropdown Menu
  categoryDropdown: { backgroundColor: '#fff', borderRadius: 12, padding: 10, position: 'absolute', top: 75, left: 65, right: 20, zIndex: 100, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  categoryOption: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, marginBottom: 4 },
  categoryOptionActive: { backgroundColor: '#2563eb' },
  categoryOptionText: { fontSize: 14, fontWeight: '600', color: '#1e293b' },

  // Text Input
  mainInput: { fontSize: 18, color: '#0f172a', lineHeight: 28, minHeight: 120, textAlignVertical: 'top' },
  
  // Image Preview
  imagePreviewContainer: { marginTop: 15, position: 'relative', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  imagePreview: { width: '100%', height: 300, backgroundColor: '#f8fafc' },
  removeMediaBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20 },

  // Code Editor UI (Mac Dark Mode)
  codeSection: { marginTop: 15, backgroundColor: '#18181b', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#27272a' },
  codeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#27272a', paddingHorizontal: 15, paddingVertical: 10 },
  macDots: { flexDirection: 'row', gap: 6 },
  macDot: { width: 12, height: 12, borderRadius: 6 },
  langInput: { color: '#38bdf8', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', padding: 0 },
  codeEditor: { color: '#e4e4e7', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 14, padding: 15, minHeight: 180, textAlignVertical: 'top', lineHeight: 22 },

  // Poll Builder UI
  pollSection: { marginTop: 15, backgroundColor: '#f8fafc', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  pollHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  pollSectionTitle: { fontSize: 15, fontWeight: '800', color: '#1e293b', marginLeft: 8 },
  pollOptionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  pollInput: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 12, fontSize: 15, fontWeight: '600', color: '#0f172a' },
  removeOptBtn: { padding: 10, marginLeft: 5 },
  addOptionBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 5, paddingVertical: 8 },
  addOptionText: { color: '#2563eb', fontWeight: '700', fontSize: 14, marginLeft: 6 },

  // Bottom Toolbar
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#f1f5f9', paddingBottom: Platform.OS === 'ios' ? 30 : 15 },
  toolbarTitle: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  toolbarIcons: { flexDirection: 'row', gap: 15 },
  toolBtn: { width: 44, height: 44, backgroundColor: '#f8fafc', borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  toolBtnActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' }
});