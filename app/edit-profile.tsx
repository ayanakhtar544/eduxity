import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  SafeAreaView, StatusBar, ScrollView, ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { auth, db, storage } from '../firebaseConfig';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

export default function EditProfileScreen() {
  const router = useRouter();
  const user = auth.currentUser;

  // 🧠 UI States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 📦 Form Data States
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  
  // Demographics
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [institution, setInstitution] = useState('');
  const [dob, setDob] = useState('');
  
  // Social Links
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [instagram, setInstagram] = useState('');

  // 🚀 FETCH EXISTING DATA (From Onboarding & Previous Edits)
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    if (!user) return;
    try {
      setName(user.displayName || '');
      setImageUri(user.photoURL || DEFAULT_AVATAR);

      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        setBio(data.bio || '');
        setCity(data.city || '');
        setStateName(data.state || '');
        setInstitution(data.institutionName || '');
        setDob(data.dob || '');
        setGithub(data.githubLink || '');
        setLinkedin(data.linkedinLink || '');
        setInstagram(data.instagramLink || '');
      }
    } catch (error) {
      console.log("Error fetching profile details:", error);
    } finally {
      setLoading(false);
    }
  };

  // 📸 IMAGE PICKER ENGINE
  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  // 💾 SAVE MASTER FUNCTION
  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) {
      Alert.alert("Missing Info", "Name cannot be empty.");
      return;
    }

    setSaving(true);
    try {
      let finalImageUrl = imageUri;

      if (imageUri && !imageUri.startsWith('http')) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const storageRef = ref(storage, `avatars/${user.uid}_${Date.now()}.jpg`);
        await uploadBytes(storageRef, blob);
        finalImageUrl = await getDownloadURL(storageRef);
      }

      await updateProfile(user, {
        displayName: name.trim(),
        photoURL: finalImageUrl,
      });

      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: name.trim(),
        photoURL: finalImageUrl,
        bio: bio.trim(),
        city: city.trim(),
        state: stateName.trim(),
        institutionName: institution.trim(),
        dob: dob.trim(),
        githubLink: github.trim(),
        linkedinLink: linkedin.trim(),
        instagramLink: instagram.trim()
      });

      setSaving(false);
      Alert.alert("Success", "Profile updated successfully!", [
        { text: "Awesome", onPress: () => router.back() }
      ]);

    } catch (error) {
      console.error("Save Error:", error);
      Alert.alert("Error", "Could not save profile changes.");
      setSaving(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* 🔝 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} disabled={saving}>
          <Ionicons name="close" size={28} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#2563eb" /> : <Text style={styles.saveBtnText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* 📸 AVATAR SECTION */}
          <Animated.View entering={FadeInUp} style={styles.avatarSection}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
              <Image source={{ uri: imageUri || DEFAULT_AVATAR }} style={styles.avatar} />
              <View style={styles.cameraBadge}><Ionicons name="camera" size={16} color="#fff" /></View>
            </TouchableOpacity>
          </Animated.View>

          {/* 📝 BASIC INFO */}
          <Animated.View entering={FadeInUp.delay(100)} style={styles.formSection}>
            <Text style={styles.sectionTitle}>Basic Info</Text>
            
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />

            <Text style={styles.inputLabel}>Bio (Tell the community about yourself)</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder="I am passionate about..."
              value={bio}
              onChangeText={setBio}
              multiline
              maxLength={200}
            />
          </Animated.View>

          {/* 📍 EDUCATION & LOCATION */}
          <Animated.View entering={FadeInUp.delay(200)} style={styles.formSection}>
            <Text style={styles.sectionTitle}>Education & Location</Text>
            
            <Text style={styles.inputLabel}>School/College/Institute</Text>
            <TextInput style={styles.input} value={institution} onChangeText={setInstitution} placeholder="e.g. IIT Delhi, DPS..." />

            <View style={{ flexDirection: 'row', gap: 15 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>City</Text>
                <TextInput style={styles.input} value={city} onChangeText={setCity} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>State</Text>
                <TextInput style={styles.input} value={stateName} onChangeText={setStateName} />
              </View>
            </View>

            <Text style={styles.inputLabel}>Date of Birth (DD/MM/YYYY)</Text>
            <TextInput style={styles.input} value={dob} onChangeText={setDob} placeholder="e.g. 15/08/2005" />
          </Animated.View>

          {/* 🔗 SOCIAL LINKS */}
          <Animated.View entering={FadeInUp.delay(300)} style={styles.formSection}>
            <Text style={styles.sectionTitle}>Social Presence</Text>
            
            <View style={styles.socialInputRow}>
              <Ionicons name="logo-github" size={24} color="#0f172a" style={styles.socialIcon} />
              <TextInput style={styles.socialInput} value={github} onChangeText={setGithub} placeholder="GitHub Username/Link" autoCapitalize="none" />
            </View>

            <View style={styles.socialInputRow}>
              <Ionicons name="logo-linkedin" size={24} color="#0077b5" style={styles.socialIcon} />
              <TextInput style={styles.socialInput} value={linkedin} onChangeText={setLinkedin} placeholder="LinkedIn Profile Link" autoCapitalize="none" />
            </View>

            <View style={styles.socialInputRow}>
              <Ionicons name="logo-instagram" size={24} color="#e1306c" style={styles.socialIcon} />
              <TextInput style={styles.socialInput} value={instagram} onChangeText={setInstagram} placeholder="Instagram Handle" autoCapitalize="none" />
            </View>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 PREMIUM STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  iconBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  saveBtnText: { fontSize: 16, fontWeight: '800', color: '#2563eb' },
  
  scrollContent: { padding: 20, paddingBottom: 50 },
  
  avatarSection: { alignItems: 'center', marginBottom: 25 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#e2e8f0', borderWidth: 3, borderColor: '#fff' },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#2563eb', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },

  formSection: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 15, borderBottomWidth: 1, borderColor: '#f1f5f9', paddingBottom: 10 },
  
  inputLabel: { fontSize: 13, fontWeight: '800', color: '#64748b', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 12, fontSize: 15, color: '#0f172a', marginBottom: 15 },
  bioInput: { minHeight: 90, textAlignVertical: 'top' },

  socialInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 15, marginBottom: 15 },
  socialIcon: { marginRight: 10 },
  socialInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#0f172a' },
});