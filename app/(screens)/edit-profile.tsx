// Location: app/edit-profile.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ActivityIndicator, ScrollView, Alert, KeyboardAvoidingView, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker'; 
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth'; // Auth profile update ke liye
import { db, auth } from '../../firebaseConfig';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '../../store/useUserStore';

export default function EditProfileScreen() {
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;
  const setUserData = useUserStore((state) => state.setUserData); // Zustand update ke liye

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [existingAvatar, setExistingAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Load existing user data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUid) return;
      try {
        const docRef = doc(db, 'users', currentUid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.displayName || data.name || '');
          setBio(data.bio || '');
          setExistingAvatar(data.photoURL || data.avatar || '');
        }
      } catch (error) {
        console.log(error);
      } finally {
        setFetching(false);
      }
    };
    fetchProfile();
  }, [currentUid]);

  // ==========================================
  // 📸 PICK AVATAR WITH LOW RES LIMIT
  // ==========================================
  const pickAvatar = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, 
      aspect: [1, 1], // Square dp
      quality: 0.2, // 🔥 Sirf 20% quality! Super fast load hoga feed me
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const uploadAvatarAsync = async (uri: string) => {
    const storage = getStorage();
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `profile_pictures/${currentUid}_dp.jpg`; // Overwrites old dp
    const storageRef = ref(storage, filename);
    
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  // ==========================================
  // ✅ SAVE PROFILE
  // ==========================================
  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Name cannot be empty.');
      return;
    }

    setLoading(true);
    try {
      let finalAvatarUrl = existingAvatar;

      if (avatarUri) {
        finalAvatarUrl = await uploadAvatarAsync(avatarUri);
      }

      // 1. Update Firestore
      const updateData = {
        displayName: name.trim(),
        name: name.trim(), // fallback
        bio: bio.trim(),
        photoURL: finalAvatarUrl,
        avatar: finalAvatarUrl // fallback
      };
      
      await updateDoc(doc(db, 'users', currentUid as string), updateData);

      // 2. Update Firebase Auth Profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: name.trim(),
          photoURL: finalAvatarUrl
        });
      }

      // 3. Update Zustand Store Locally
      setUserData((prev: any) => ({ ...prev, ...updateData }));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Profile updated successfully!');
      router.back();
      
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Could not update profile.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <View style={styles.center}><ActivityIndicator color="#4f46e5" /></View>;

  const displayAvatar = avatarUri || existingAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=0f172a&color=fff&size=200`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={26} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSaveProfile} disabled={loading} style={styles.saveBtn}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: displayAvatar }} style={styles.avatarImg} />
              <TouchableOpacity style={styles.editAvatarBtn} onPress={pickAvatar}>
                <Ionicons name="pencil" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.avatarHint}>We optimize image size automatically.</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your full name" placeholderTextColor="#94a3b8" />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Bio (About You)</Text>
            <TextInput style={[styles.input, styles.textArea]} value={bio} onChangeText={setBio} placeholder="Targeting IIT Bombay | Dropper" placeholderTextColor="#94a3b8" multiline numberOfLines={3} maxLength={100} />
            <Text style={styles.charCount}>{bio.length}/100</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  saveBtn: { backgroundColor: '#0f172a', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  
  scrollContent: { padding: 20 },
  
  avatarSection: { alignItems: 'center', marginBottom: 35, marginTop: 10 },
  avatarWrapper: { position: 'relative' },
  avatarImg: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#e2e8f0', borderWidth: 3, borderColor: '#fff' },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#4f46e5', width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  avatarHint: { fontSize: 11, color: '#94a3b8', marginTop: 12, fontWeight: '600' },

  formGroup: { marginBottom: 25 },
  label: { fontSize: 13, fontWeight: '800', color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 15, height: 50, fontSize: 16, color: '#0f172a', fontWeight: '600' },
  textArea: { height: 90, paddingTop: 15, textAlignVertical: 'top' },
  charCount: { textAlign: 'right', fontSize: 11, color: '#94a3b8', marginTop: 5, fontWeight: '600' },
});