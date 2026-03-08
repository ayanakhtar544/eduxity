import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, 
  TextInput, ActivityIndicator, Alert, SafeAreaView, 
  KeyboardAvoidingView, Platform, StatusBar, Switch
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { auth, db, storage } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

export default function CreateStoryScreen() {
  const router = useRouter();
  
  // 🧠 State Management
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isLive, setIsLive] = useState(false); // 🔥 Live Badge Toggle
  const [loading, setLoading] = useState(false);

  // Jab page khule, turant gallery khol do (Insta UX)
  useEffect(() => {
    pickImage();
  }, []);

  // 📸 Image Picker Logic
  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16], // Story format (Vertical)
        quality: 0.7, // Fast upload
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      } else {
        // Agar user ne cancel kar diya bina photo chune, toh wapas feed pe bhej do
        if (!imageUri) router.back();
      }
    } catch (error) {
      Alert.alert('Error', 'Gallery kholne mein dikkat aayi.');
    }
  };

  // 🚀 Upload Engine
  const handleUploadStory = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "Login zaroori hai bhai!");
      return;
    }
    if (!imageUri) {
      Alert.alert("Image missing", "Story ke liye photo select karna zaroori hai.");
      return;
    }

    setLoading(true);

    try {
      // 1. Upload Image to Firebase Storage
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const storageRef = ref(storage, `stories/${user.uid}_${Date.now()}.jpg`);
      await uploadBytes(storageRef, blob);
      const finalImageUrl = await getDownloadURL(storageRef);

      // 2. Save Story Data to Firestore
      const storyData = {
        authorId: user.uid,
        authorName: user.displayName || 'Eduxity User',
        authorAvatar: user.photoURL || DEFAULT_AVATAR,
        imageUrl: finalImageUrl,
        caption: caption.trim(),
        isLive: isLive, // Agar true hoga toh Feed par Laal rang ka LIVE dikhega
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'stories'), storyData);
      
      setLoading(false);
      router.back(); // Feed par wapas

    } catch (error) {
      console.error("Story Upload Error:", error);
      Alert.alert("Failed", "Story upload nahi ho payi. Internet check karo.");
      setLoading(false);
    }
  };

  // 🎨 UI RENDERER
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Agar photo select nahi hui toh Loading dikhao */}
      {!imageUri ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Opening Gallery...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Animated.View entering={FadeIn} style={styles.previewContainer}>
            
            {/* FULL SCREEN IMAGE PREVIEW */}
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />

            {/* TOP HEADER OVERLAY */}
            <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.topOverlay}>
              <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
                <Ionicons name="close" size={30} color="#fff" />
              </TouchableOpacity>
              
              <View style={styles.liveToggleContainer}>
                <Text style={styles.liveToggleText}>Make it LIVE</Text>
                <Switch 
                  value={isLive} 
                  onValueChange={setIsLive} 
                  trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#ef4444' }}
                  thumbColor="#fff"
                />
              </View>
            </LinearGradient>

            {/* BOTTOM CAPTION & UPLOAD OVERLAY */}
            <Animated.View entering={SlideInDown.delay(200)} style={styles.bottomOverlay}>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.captionInput}
                  placeholder="Add a caption..."
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  value={caption}
                  onChangeText={setCaption}
                  maxLength={100}
                />
                
                <TouchableOpacity 
                  style={[styles.sendBtn, loading && { opacity: 0.7 }]} 
                  onPress={handleUploadStory}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="send" size={20} color="#fff" style={{ marginLeft: 3 }} />
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>

          </Animated.View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 PREMIUM INSTA-STYLE STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff', marginTop: 15, fontSize: 16, fontWeight: '600' },
  
  previewContainer: { flex: 1, position: 'relative', backgroundColor: '#000', borderRadius: Platform.OS === 'ios' ? 20 : 0, overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  
  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 120, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20 },
  closeBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  
  liveToggleContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, height: 40 },
  liveToggleText: { color: '#fff', fontWeight: '700', fontSize: 12, marginRight: 8 },

  bottomOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20, paddingTop: 30, backgroundColor: 'rgba(0,0,0,0.4)' },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  captionInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 16, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', marginRight: 15 },
  sendBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 5 }
});