// Location: app/create-group.tsx
import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ActivityIndicator, ScrollView, Alert, KeyboardAvoidingView, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, SlideInUp } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig'; 
import * as Haptics from 'expo-haptics';

// 🔥 ENV SE API KEY LE RAHE HAIN
const IMGBB_API_KEY = process.env.EXPO_PUBLIC_IMGBB_API_KEY; 

export default function CreateGroupScreen() {
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('JEE');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null); // 🔥 Naya state Base64 ke liye
  const [loading, setLoading] = useState(false);

  const CATEGORIES = [
    { name: 'JEE', icon: 'calculator-outline' },
    { name: 'NEET', icon: 'pulse-outline' },
    { name: 'UPSC', icon: 'book-outline' },
    { name: 'Coding', icon: 'code-slash-outline' },
    { name: 'General', icon: 'planet-outline' }
  ];

  // ==========================================
  // 📸 PICK IMAGE (WITH BASE64)
  // ==========================================
  const pickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera roll access needed.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, 
      aspect: [1, 1], 
      quality: 0.3,
      base64: true, // 🔥 ISSE IMAGE TEXT FORMAT MEIN MIL JAYEGI
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setLogoUri(result.assets[0].uri); // UI me dikhane ke liye
      setLogoBase64(result.assets[0].base64 || null); // Upload karne ke liye
    }
  };

// ==========================================
  // 🚀 UPLOAD BASE64 TO IMGBB API (BULLETPROOF)
  // ==========================================
  const uploadToImgBB = async (base64String: string) => {
    try {
      // 🔥 TESTING KE LIYE APNI API KEY DIRECT YAHAN PASTE KAR:
      const IMGBB_KEY = process.env.EXPO_PUBLIC_IMGBB_API_KEY || 'YAHAN_APNI_REAL_API_KEY_DAAL_DO'; 

      if (!IMGBB_KEY || IMGBB_KEY === 'YAHAN_APNI_REAL_API_KEY_DAAL_DO') {
        Alert.alert("Error", "Bhai ImgBB ki API Key missing hai code mein.");
        return null;
      }

      const formData = new FormData();
      formData.append('image', base64String);

      // Fetch request with Explicit Headers
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          // Boundary React Native khud set karega
        }
      });

      const json = await response.json();
      console.log("🚀 ImgBB Response: ", json); // Terminal mein dekhna kya error aaya

      if (json.success) {
        return json.data.url; 
      } else {
        Alert.alert("ImgBB Reject", json.error?.message || "ImgBB ne image reject kar di.");
        return null;
      }
    } catch (error: any) {
      console.error("Network Fetch Error:", error);
      Alert.alert("Upload Error", "Network issue. Image upload nahi ho paayi.");
      return null;
    }
  };

  // ==========================================
  // ✅ SUBMIT LOGIC (WITH STRICT CHECKS)
  // ==========================================
  const handleCreateGroup = async () => {
    if (!name.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Hold up!', 'Your study group needs a cool name.');
      return;
    }

    setLoading(true);
    try {
      let finalLogoUrl = '';

      if (logoBase64) {
        const uploadedUrl = await uploadToImgBB(logoBase64);
        
        // Agar upload fail hua toh aage mat badho
        if (!uploadedUrl) {
          setLoading(false);
          return; // Stop process
        }
        finalLogoUrl = uploadedUrl;
      } else {
        // Fallback default avatar
        finalLogoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f172a&color=fff&size=200&bold=true`;
      }

      const groupData = {
        name: name.trim(),
        description: description.trim(),
        category,
        icon: finalLogoUrl,
        adminId: currentUid,
        admins: [currentUid],
        members: [currentUid],
        participants: [currentUid],
        createdAt: serverTimestamp(),
        totalNotes: 0,
        totalTests: 0,
      };

      const docRef = await addDoc(collection(db, 'groups'), groupData);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/chat/info/${docRef.id}`); 
      
    } catch (error: any) {
      console.log("Full Error: ", error);
      Alert.alert('Error', error.message || 'Failed to create group. Check your Network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="close" size={28} color="#0f172a" /></TouchableOpacity>
        <Text style={styles.headerTitle}>New Study Group</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.logoUploadContainer}>
            <TouchableOpacity activeOpacity={0.8} style={styles.logoPlaceholder} onPress={pickImage}>
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.previewImage} transition={200} />
              ) : (
                <LinearGradient colors={['#f1f5f9', '#e2e8f0']} style={styles.uploadGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
                  <View style={styles.iconCircle}><Ionicons name="camera" size={28} color="#4f46e5" /></View>
                  <Text style={styles.uploadText}>Upload Logo</Text>
                </LinearGradient>
              )}
              {logoUri && <View style={styles.editBadge}><Ionicons name="pencil" size={14} color="#fff" /></View>}
            </TouchableOpacity>
            <Text style={styles.hintText}>Square image • Free Hosting</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150).duration(600).springify()} style={styles.formGroup}>
            <Text style={styles.label}>Group Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.input} placeholder="e.g., Target IIT 2026" placeholderTextColor="#94a3b8" value={name} onChangeText={setName} maxLength={30} />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(250).duration(600).springify()} style={styles.formGroup}>
            <Text style={styles.label}>Description <Text style={styles.optionalText}>(Optional)</Text></Text>
            <View style={[styles.inputWrapper, { height: 100 }]}>
              <TextInput style={[styles.input, styles.textArea]} placeholder="What is the main goal of this group?" placeholderTextColor="#94a3b8" value={description} onChangeText={setDescription} multiline numberOfLines={3} maxLength={150} />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(350).duration(600).springify()} style={styles.formGroup}>
            <Text style={styles.label}>Select Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
              {CATEGORIES.map(cat => {
                const isActive = category === cat.name;
                return (
                  <TouchableOpacity key={cat.name} style={[styles.catPill, isActive && styles.catPillActive]} onPress={() => { Haptics.selectionAsync(); setCategory(cat.name); }}>
                    <Ionicons name={cat.icon as any} size={16} color={isActive ? '#fff' : '#64748b'} style={{ marginRight: 6 }} />
                    <Text style={[styles.catText, isActive && styles.catTextActive]}>{cat.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Animated.View entering={SlideInUp.delay(400).springify()} style={styles.footer}>
        <TouchableOpacity activeOpacity={0.9} onPress={handleCreateGroup} disabled={loading} style={styles.submitBtnWrapper}>
          <LinearGradient colors={['#4f46e5', '#3b82f6']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.submitGradient}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : (
              <><Text style={styles.submitBtnText}>Create Group</Text><Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} /></>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

// Exactly same Premium Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f5f9' },
  backBtn: { padding: 4, backgroundColor: '#f1f5f9', borderRadius: 20 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  scrollContent: { padding: 25, paddingBottom: 100 },
  logoUploadContainer: { alignItems: 'center', marginBottom: 35 },
  logoPlaceholder: { width: 130, height: 130, borderRadius: 40, backgroundColor: '#fff', shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 15, elevation: 8, justifyContent: 'center', alignItems: 'center' },
  uploadGradient: { width: '100%', height: '100%', borderRadius: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  uploadText: { fontSize: 13, fontWeight: '800', color: '#4f46e5' },
  previewImage: { width: '100%', height: '100%', borderRadius: 40, borderWidth: 2, borderColor: '#fff' },
  editBadge: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#0f172a', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  hintText: { fontSize: 12, color: '#94a3b8', marginTop: 15, fontWeight: '700' },
  formGroup: { marginBottom: 25 },
  label: { fontSize: 14, fontWeight: '800', color: '#1e293b', marginBottom: 10 },
  optionalText: { color: '#94a3b8', fontWeight: '600', fontSize: 12 },
  inputWrapper: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 5 },
  input: { paddingHorizontal: 18, height: 55, fontSize: 16, color: '#0f172a', fontWeight: '600' },
  textArea: { paddingTop: 15, textAlignVertical: 'top' },
  categoryRow: { flexDirection: 'row', gap: 12, paddingVertical: 5 },
  catPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5 },
  catPillActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  catText: { color: '#64748b', fontWeight: '800', fontSize: 14 },
  catTextActive: { color: '#fff' },
  footer: { position: 'absolute', bottom: 0, width: '100%', padding: 25, backgroundColor: '#f8fafc', borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.8)' },
  submitBtnWrapper: { width: '100%', borderRadius: 20, overflow: 'hidden', shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  submitGradient: { flexDirection: 'row', height: 60, justifyContent: 'center', alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
});