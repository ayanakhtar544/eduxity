import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
 StatusBar,ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { auth, db } from '../firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function AuthScreen() {
  const router = useRouter();
  
  // 🧠 Toggle State: true = Login, false = Sign Up
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // 📝 Form States
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 🔍 Real-Time Username Checker States
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  // 🚀 SMART DEBOUNCE LOGIC FOR USERNAME CHECK
  useEffect(() => {
    // Agar login page par hai, ya username 3 character se chota hai toh check mat karo
    if (isLogin || username.trim().length < 3) {
      setUsernameStatus('idle');
      return;
    }

    // Username mein space ya special characters na hon
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username.trim())) {
      setUsernameStatus('taken'); // Invalid format ko taken maankar red dikhayenge
      return;
    }

    // Har key press par Firebase hit na ho, isliye 500ms ka Debounce lagaya hai
    const delayDebounceFn = setTimeout(async () => {
      setUsernameStatus('checking');
      try {
        const q = query(
          collection(db, 'users'), 
          where('username', '==', username.toLowerCase().trim())
        );
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setUsernameStatus('available');
        } else {
          setUsernameStatus('taken');
        }
      } catch (error) {
        console.log("Username check error:", error);
        setUsernameStatus('idle');
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [username, isLogin]);


  // 🚀 CORE AUTHENTICATION ENGINE
  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Email aur Password dono daalna zaroori hai bhai!");
      return;
    }
    
    // Naye account ke validations
    if (!isLogin) {
      if (!name) {
        Alert.alert("Missing Name", "Apna naam toh batao!");
        return;
      }
      if (usernameStatus !== 'available') {
        Alert.alert("Invalid Username", "Kripya ek unique aur valid username chunein.");
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        // 🔐 1. LOGIN SYSTEM
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        
        // Check if user has completed Onboarding
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists() && userDocSnap.data().onboardingCompleted) {
          router.replace('/(tabs)'); 
        } else {
          router.replace('/onboarding'); 
        }

      } else {
        // 🚀 2. SIGN UP (CREATE ACCOUNT) SYSTEM
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        
        // Update Name in Firebase Auth
        await updateProfile(userCredential.user, {
          displayName: name.trim()
        });

        // 💾 Pehli baar Database mein User ko initialize karo with UNIQUE USERNAME
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: email.trim(),
          displayName: name.trim(),
          username: username.toLowerCase().trim(), // Handle hamesha lowercase mein
          onboardingCompleted: false
        });

        // Naya account ban gaya, ab aage ki deep detail ke liye Onboarding pe bhejo
        router.replace('/onboarding');
      }
    } catch (error: any) {
      console.log("Auth Error:", error);
      let errorMsg = "Kuch galat ho gaya. Dobara try karo.";
      if (error.code === 'auth/email-already-in-use') errorMsg = "Ye email pehle se registered hai. Niche se Login select karo!";
      if (error.code === 'auth/wrong-password') errorMsg = "Password galat hai bhai.";
      if (error.code === 'auth/user-not-found') errorMsg = "Account nahi mila. Pehle Create Account karo.";
      Alert.alert("Authentication Failed", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex1}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          {/* 🎓 LOGO & HEADER */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.headerContainer}>
            <View style={styles.logoBox}>
              <Ionicons name="school" size={40} color="#fff" />
            </View>
            <Text style={styles.appName}>Eduxity</Text>
            <Text style={styles.tagline}>
              {isLogin ? 'Welcome back! Ready to learn?' : 'Join the fastest growing student network!'}
            </Text>
          </Animated.View>

          {/* 📝 FORM CONTAINER */}
          <Animated.View entering={FadeInUp.delay(200)} style={styles.formContainer}>
            
            {/* 🆕 Create Account Fields */}
            {!isLogin && (
              <>
                {/* Full Name Input */}
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name (e.g. Ayaan Akhtar)"
                    placeholderTextColor="#94a3b8"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                {/* Unique Username Input */}
                <View style={[
                  styles.inputWrapper, 
                  usernameStatus === 'available' && { borderColor: '#10b981', borderWidth: 1.5 },
                  usernameStatus === 'taken' && { borderColor: '#ef4444', borderWidth: 1.5 }
                ]}>
                  <Text style={styles.atSymbol}>@</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="unique_username"
                    placeholderTextColor="#94a3b8"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    maxLength={15}
                  />
                  
                  {/* Real-time Indicator Icons */}
                  {usernameStatus === 'checking' && <ActivityIndicator size="small" color="#2563eb" />}
                  {usernameStatus === 'available' && <Ionicons name="checkmark-circle" size={20} color="#10b981" />}
                  {usernameStatus === 'taken' && <Ionicons name="close-circle" size={20} color="#ef4444" />}
                </View>
                
                {/* Username helper text */}
                {!isLogin && username.length > 0 && (
                  <Text style={[
                    styles.usernameHelper, 
                    usernameStatus === 'taken' ? { color: '#ef4444' } : { color: '#10b981' }
                  ]}>
                    {usernameStatus === 'checking' && 'Checking availability...'}
                    {usernameStatus === 'available' && 'Awesome! Username is available.'}
                    {usernameStatus === 'taken' && 'Oops! Taken or invalid format.'}
                  </Text>
                )}
              </>
            )}

            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {isLogin && (
              <TouchableOpacity style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {/* 🚀 MAIN ACTION BUTTON */}
            <TouchableOpacity 
              style={[
                styles.actionBtn, 
                (!isLogin && usernameStatus !== 'available') && { opacity: 0.6 } // Disable look if username is not available
              ]} 
              onPress={handleAuth}
              disabled={loading || (!isLogin && usernameStatus !== 'available')}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.actionBtnText}>
                  {isLogin ? 'Login' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

          </Animated.View>

          {/* 🔄 TOGGLE BUTTON */}
          <Animated.View entering={FadeInDown.delay(300)} style={styles.footer}>
            <Text style={styles.footerText}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </Text>
            <TouchableOpacity onPress={() => {
              setIsLogin(!isLogin);
              setName(''); 
              setUsername(''); // Reset handle
              setUsernameStatus('idle');
            }}>
              <Text style={styles.toggleText}>
                {isLogin ? 'Sign Up' : 'Login'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Firebase login success ke baad ye code chalana:
const syncUserToPostgres = async (firebaseUser: any) => {
  try {
    await fetch('/api/auth/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
      })
    });
    console.log("User successfully synced to PostgreSQL!");
  } catch (error) {
    console.error("Failed to sync user:", error);
  }
};

// ==========================================
// 🎨 PREMIUM AUTHENTICATION STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  flex1: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 25, justifyContent: 'center', paddingVertical: 40 },
  
  headerContainer: { alignItems: 'center', marginBottom: 35 },
  logoBox: { width: 80, height: 80, backgroundColor: '#2563eb', borderRadius: 25, justifyContent: 'center', alignItems: 'center', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, marginBottom: 15 },
  appName: { fontSize: 32, fontWeight: '900', color: '#0f172a', marginBottom: 5 },
  tagline: { fontSize: 15, color: '#64748b', textAlign: 'center', fontWeight: '500' },

  formContainer: { backgroundColor: '#fff', padding: 25, borderRadius: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5 },
  
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 15, marginBottom: 15, paddingHorizontal: 15, height: 55, borderWidth: 1, borderColor: '#e2e8f0' },
  inputIcon: { marginRight: 10 },
  atSymbol: { fontSize: 18, fontWeight: '700', color: '#64748b', marginRight: 5 },
  input: { flex: 1, fontSize: 16, color: '#0f172a' },
  eyeIcon: { padding: 5 },

  usernameHelper: { fontSize: 12, fontWeight: '600', marginTop: -10, marginBottom: 15, marginLeft: 5 },

  forgotBtn: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: { color: '#2563eb', fontSize: 13, fontWeight: '700' },

  actionBtn: { backgroundColor: '#2563eb', borderRadius: 15, height: 55, justifyContent: 'center', alignItems: 'center', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 10, marginTop: 10 },
  actionBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 30 },
  footerText: { fontSize: 15, color: '#64748b', fontWeight: '500' },
  toggleText: { fontSize: 15, color: '#2563eb', fontWeight: '800' }
});