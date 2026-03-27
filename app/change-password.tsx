// Location: app/change-password.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ActivityIndicator, Platform, ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { auth, db } from '../firebaseConfig';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { doc, getDoc, updateDoc, deleteField } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const user = auth.currentUser;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockRemainingTime, setLockRemainingTime] = useState<string | null>(null);

  useEffect(() => {
    const checkSecurityStatus = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.lockoutUntil && data.lockoutUntil > Date.now()) {
            setIsLocked(true);
            calculateRemainingTime(data.lockoutUntil);
          } else {
            setFailedAttempts(data.failedPasswordAttempts || 0);
            setIsLocked(false);
          }
        }
      } catch (error) {
        console.error("Failed to fetch security status", error);
      }
    };
    checkSecurityStatus();
  }, [user]);

  const calculateRemainingTime = (unlockTime: number) => {
    const diff = unlockTime - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    setLockRemainingTime(`${hours}h ${minutes}m`);
  };

  const handleChangePassword = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (isLocked) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMessage(`Account locked. Try again after ${lockRemainingTime}.`);
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage("Saare fields bharna zaroori hai bhai.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Naya password aur confirm password match nahi kar rahe.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("Password kam se kam 6 characters ka hona chahiye.");
      return;
    }

    if (!user || !user.email) return;

    setLoading(true);

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      await updateDoc(doc(db, 'users', user.uid), {
        failedPasswordAttempts: 0,
        lockoutUntil: deleteField()
      });

      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccessMessage("Tera password successfully update ho gaya hai! 🎉");
      
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setTimeout(() => { router.back(); }, 2000);
      
    } catch (error: any) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        const newAttempts = failedAttempts + 1;
        if (newAttempts >= 3) {
          const unlockTime = Date.now() + (24 * 60 * 60 * 1000); 
          await updateDoc(doc(db, 'users', user.uid), {
            failedPasswordAttempts: 0,
            lockoutUntil: unlockTime
          });
          setIsLocked(true);
          calculateRemainingTime(unlockTime);
          setErrorMessage("Too many failed attempts! Feature locked for 24 hours.");
        } else {
          await updateDoc(doc(db, 'users', user.uid), { failedPasswordAttempts: newAttempts });
          setFailedAttempts(newAttempts);
          setErrorMessage(`Galat password! ${3 - newAttempts} attempts remaining.`);
        }
      } else if (error.code === 'auth/requires-recent-login') {
        setErrorMessage("Security issue: Ek baar logout karke wapas login karo, phir try karna.");
      } else {
        setErrorMessage("Password update fail ho gaya. Shayad tumne Google se login kiya tha?");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* MAHA JUGAD: Simple ScrollView without KeyboardAvoidingView conflicts */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <Animated.View entering={FadeInDown.duration(400)} style={styles.iconContainer}>
          <View style={[styles.lockIconBg, isLocked && {backgroundColor: '#fef2f2'}]}>
            <Ionicons name={isLocked ? "lock-closed" : "shield-checkmark"} size={40} color={isLocked ? "#ef4444" : "#4f46e5"} />
          </View>
          <Text style={styles.titleText}>{isLocked ? "Access Locked" : "Change Password"}</Text>
          <Text style={styles.subText}>
            {isLocked 
              ? `You have entered wrong passwords 3 times. Try again after ${lockRemainingTime}.` 
              : "Make sure your new password is strong and easy to remember."}
          </Text>
        </Animated.View>

        {errorMessage && (
          <Animated.View entering={FadeIn} style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color="#ef4444" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </Animated.View>
        )}

        {successMessage && (
          <Animated.View entering={FadeIn} style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.successText}>{successMessage}</Text>
          </Animated.View>
        )}

        {!isLocked && (
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.formContainer}>
            
            <Text style={styles.label}>Current Password</Text>
            <View style={[styles.inputWrapper, errorMessage?.includes('Current') && { borderColor: '#ef4444' }]}>
              <Ionicons name="key-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} placeholder="Enter current password" placeholderTextColor="#94a3b8" 
                secureTextEntry={!showCurrent} value={currentPassword}
                onChangeText={(text) => { setCurrentPassword(text); setErrorMessage(null); }}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={styles.eyeBtn}>
                <Ionicons name={showCurrent ? "eye-off-outline" : "eye-outline"} size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>New Password</Text>
            <View style={[styles.inputWrapper, errorMessage?.includes('match') && { borderColor: '#ef4444' }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} placeholder="Enter new password" placeholderTextColor="#94a3b8" 
                secureTextEntry={!showNew} value={newPassword}
                onChangeText={(text) => { setNewPassword(text); setErrorMessage(null); }}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeBtn}>
                <Ionicons name={showNew ? "eye-off-outline" : "eye-outline"} size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Confirm New Password</Text>
            <View style={[styles.inputWrapper, errorMessage?.includes('match') && { borderColor: '#ef4444' }]}>
              <Ionicons name="checkmark-done-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} placeholder="Re-type new password" placeholderTextColor="#94a3b8" 
                secureTextEntry={!showConfirm} value={confirmPassword}
                onChangeText={(text) => { setConfirmPassword(text); setErrorMessage(null); }}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* 🔥 BUTTON IS NOW INLINE WITH THE FORM, RIGHT BELOW INPUTS 🔥 */}
            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={handleChangePassword} 
              disabled={loading || !!successMessage} 
              style={styles.inlineSubmitBtn}
            >
              <LinearGradient colors={['#4f46e5', '#3b82f6']} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.submitGradient}>
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>{successMessage ? "Updated Successfully!" : "Update Password"}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f5f9' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  
  // Padding thodi badha di hai end me, tab bar overlap issue se bachne ke liye
  scrollContent: { padding: 25, paddingBottom: 150 },
  
  iconContainer: { alignItems: 'center', marginBottom: 20, marginTop: 10 },
  lockIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  titleText: { fontSize: 24, fontWeight: '900', color: '#0f172a', marginBottom: 8 },
  subText: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 },
  
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#fecaca', marginBottom: 15 },
  errorText: { color: '#ef4444', fontSize: 13, fontWeight: '700', marginLeft: 8, flex: 1 },
  successBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#a7f3d0', marginBottom: 15 },
  successText: { color: '#10b981', fontSize: 13, fontWeight: '800', marginLeft: 8, flex: 1 },

  formContainer: { marginTop: 5 },
  label: { fontSize: 13, fontWeight: '800', color: '#475569', marginBottom: 8, marginLeft: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 },
  inputIcon: { marginLeft: 15 },
  input: { flex: 1, paddingHorizontal: 12, height: 55, fontSize: 15, color: '#0f172a', fontWeight: '600' },
  eyeBtn: { padding: 15 },

  // 🔥 NAYA BUTTON STYLE JO FORM KE SAATH CHALEGA
  inlineSubmitBtn: { width: '100%', borderRadius: 16, overflow: 'hidden', marginTop: 15, shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  submitGradient: { height: 55, justifyContent: 'center', alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
});