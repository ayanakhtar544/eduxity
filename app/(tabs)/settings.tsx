import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, StatusBar, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function SettingsScreen() {
  const router = useRouter();
  
  // States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  
  // Editable Fields
  const [phone, setPhone] = useState('');

  // 📡 Firebase se Data Fetch karo
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!auth.currentUser) return;
      try {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setPhone(data.phone || ''); // Agar pehle se phone number hai toh set karo
        }
      } catch (error) {
        console.log("Error fetching user settings: ", error);
        Alert.alert("Error", "Details load nahi ho payi.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

  // 💾 Data Save karne ka logic
  const handleSave = async () => {
    if (!auth.currentUser) return;
    
    // Basic Phone Validation (Optional: Agar khali chhodna chahe toh chhod sakta hai)
    if (phone.length > 0 && phone.length < 10) {
      Alert.alert("Invalid Number", "Bhai phone number theek se check kar lo.");
      return;
    }

    setSaving(true);
    try {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(docRef, {
        phone: phone.trim()
      });
      
      Alert.alert("Success! 🎉", "Tumhari profile details update ho gayi hain.");
    } catch (error) {
      console.log("Error updating settings: ", error);
      Alert.alert("Error", "Details save nahi ho payi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* 🔝 Premium Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Settings</Text>
        <View style={{ width: 34 }} /> {/* Balancing div for center alignment */}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            <Text style={styles.sectionTitle}>Profile Information</Text>
            
            {/* 🛑 READ-ONLY FIELD: Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.readOnlyInput}>
                <Ionicons name="person" size={18} color="#94a3b8" style={styles.inputIcon} />
                <Text style={styles.readOnlyText}>{userData?.name || "Not Set"}</Text>
              </View>
            </View>

            {/* 🛑 READ-ONLY FIELD: Username */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.readOnlyInput}>
                <Ionicons name="at" size={18} color="#94a3b8" style={styles.inputIcon} />
                <Text style={styles.readOnlyText}>{userData?.username || "Not Set"}</Text>
              </View>
              <Text style={styles.helpText}>Username ek baar set hone ke baad change nahi kiya jaa sakta.</Text>
            </View>

            {/* 🛑 READ-ONLY FIELD: Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.readOnlyInput}>
                <Ionicons name="mail" size={18} color="#94a3b8" style={styles.inputIcon} />
                <Text style={styles.readOnlyText}>{userData?.email || "Not Set"}</Text>
              </View>
            </View>

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Contact Details</Text>

            {/* ✅ EDITABLE FIELD: Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.editableInputWrapper}>
                <Ionicons name="call" size={18} color="#3b82f6" style={styles.inputIcon} />
                <TextInput
                  style={styles.editableInput}
                  placeholder="Enter your mobile number"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  maxLength={15}
                />
              </View>
            </View>

            {/* 💾 SAVE BUTTON */}
            <TouchableOpacity 
              style={[styles.saveBtnContainer, saving && { opacity: 0.7 }]} 
              onPress={handleSave} 
              disabled={saving}
            >
              <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.saveBtn}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

// --- 🎨 PREMIUM SETTINGS STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  backBtn: { padding: 5, backgroundColor: '#f1f5f9', borderRadius: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 50 },
  
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15, marginTop: 10 },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 20 },
  
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 8, marginLeft: 4 },
  
  readOnlyInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e2e8f0', paddingHorizontal: 15, height: 55, borderRadius: 14 },
  readOnlyText: { flex: 1, fontSize: 15, color: '#475569', fontWeight: '600' },
  helpText: { fontSize: 11, color: '#94a3b8', marginTop: 6, marginLeft: 4, fontWeight: '500' },
  
  editableInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 15, height: 55, borderRadius: 14, borderWidth: 1, borderColor: '#cbd5e1', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  editableInput: { flex: 1, fontSize: 16, color: '#0f172a', fontWeight: '600' },
  inputIcon: { marginRight: 12 },
  
  saveBtnContainer: { marginTop: 30, borderRadius: 16, overflow: 'hidden', elevation: 4, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  saveBtn: { flexDirection: 'row', height: 55, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
});