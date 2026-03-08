import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, SafeAreaView, StatusBar, 
  ActivityIndicator, Alert, Dimensions, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithCredential, signInWithPopup } from 'firebase/auth';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Animated, { FadeInDown, FadeInUp, Layout, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function AuthScreen() {
  const router = useRouter();
  
  // --- STATES ---
  const [isLogin, setIsLogin] = useState(true); 
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // 🔥 GOOGLE CONFIGURATION
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '533697646387-g625mqqnmaj2mmm0ve7f6tvqaistm1kq.apps.googleusercontent.com', 
    });
  }, []);

  // --- ANIMATIONS ---
  const buttonScale = useSharedValue(1);
  const animatedBtnStyle = useAnimatedStyle(() => ({ transform: [{ scale: buttonScale.value }] }));

  // ==========================================
  // 📧 EMAIL AUTH LOGIC (WITH UNIQUE USERNAME)
  // ==========================================
const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Hold on!", "Email aur password daalna zaroori hai bhai.");
      return;
    }
    if (!isLogin && (!name.trim() || !username.trim())) {
      Alert.alert("Hold on!", "Bhai Name aur Username dono bharna padega Signup ke liye.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        // 🟢 LOGIN (Purana User -> Seedha Home par)
        await signInWithEmailAndPassword(auth, email.trim(), password);
        router.replace('/(tabs)/'); 
      } else {
        // 🔵 SIGNUP (Naya User -> Onboarding par)
        const usernameLower = username.trim().toLowerCase();
        const usernameRegex = /^[a-zA-Z0-9_]{3,15}$/;
        if (!usernameRegex.test(usernameLower)) {
          Alert.alert("Invalid Username", "Username 3-15 characters, no spaces.");
          setLoading(false); return;
        }

        const q = query(collection(db, 'users'), where('username', '==', usernameLower));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          Alert.alert("Username Taken", "Bhai ye username pehle se kisi ne le liya hai.");
          setLoading(false); return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: name.trim() });
        
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid, name: name.trim(), username: usernameLower,
          email: email.trim().toLowerCase(),
          profilePic: `https://ui-avatars.com/api/?name=${name.trim()}&background=random`,
          xp: 0, level: 1, joinedGroups: [], createdAt: serverTimestamp(),
        });
        
        // 🚨 NAYA USER -> ONBOARDING
        router.replace('/onboarding');
      }
    } catch (error: any) {
      Alert.alert("Error", error.message); 
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 🌐 SOCIAL AUTH LOGIC
  // ==========================================
const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      let user;
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        user = userCredential.user;
      } else {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        await GoogleSignin.signIn();
        const { idToken } = await GoogleSignin.getTokens();
        if (!idToken) throw new Error("No ID token found");
        const credential = GoogleAuthProvider.credential(idToken);
        const userCredential = await signInWithCredential(auth, credential);
        user = userCredential.user;
      }

      // 🕵️‍♂️ CHECK KARO KYA USER PEHLE SE HAI
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // 🟢 PURANA USER -> Seedha Home
        router.replace('/(tabs)/');
      } else {
        // 🔵 NAYA USER -> Data save karo aur Onboarding par bhejo
        const defaultUsername = user.email ? user.email.split('@')[0] : `user${Math.floor(Math.random() * 10000)}`;
        await setDoc(docRef, {
          uid: user.uid, name: user.displayName || "Student", username: defaultUsername,
          email: user.email, profilePic: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`,
          xp: 0, level: 1, createdAt: serverTimestamp(),
        });
        router.replace('/onboarding');
      }
    } catch (error: any) {
      console.log("Google Login Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = () => {
    Alert.alert("Coming Soon", "Facebook login abhi setup karna baaki hai!");
  };

  // ==========================================
  // 🎨 MAIN RENDER
  // ==========================================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Background Decoration */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'center' }}>
        
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(800).springify()} style={styles.headerContainer}>
          <View style={styles.logoBox}>
            <Ionicons name="rocket" size={40} color="#2563eb" />
          </View>
          <Text style={styles.title}>Eduxity</Text>
          <Text style={styles.subtitle}>{isLogin ? 'Welcome back, Scholar!' : 'Join the smartest community!'}</Text>
        </Animated.View>

        {/* Form Card */}
        <Animated.View layout={Layout.springify()} style={styles.formCard}>
          
          {/* Dynamic Signup Fields */}
          {!isLogin && (
            <Animated.View entering={FadeInUp.duration(400)}>
              {/* Name Input */}
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} placeholder="Full Name (e.g. Abushahma)" placeholderTextColor="#94a3b8"
                  value={name} onChangeText={setName}
                />
              </View>
              {/* Username Input */}
              <View style={styles.inputWrapper}>
                <Ionicons name="at-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} placeholder="Unique Username" placeholderTextColor="#94a3b8"
                  value={username} onChangeText={setUsername} autoCapitalize="none"
                />
              </View>
            </Animated.View>
          )}

          {/* Email Input */}
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput 
              style={styles.input} placeholder="Email Address" placeholderTextColor="#94a3b8"
              value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput 
              style={styles.input} placeholder="Password" placeholderTextColor="#94a3b8"
              value={password} onChangeText={setPassword} secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          {isLogin && (
            <TouchableOpacity style={styles.forgotPassBtn}>
              <Text style={styles.forgotPassText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          {/* Main Action Button */}
          <Animated.View style={[animatedBtnStyle, { marginTop: 10 }]}>
            <TouchableOpacity 
              activeOpacity={0.8}
              onPressIn={() => buttonScale.value = withSpring(0.95)}
              onPressOut={() => buttonScale.value = withSpring(1)}
              onPress={handleAuth}
              disabled={loading}
            >
              <LinearGradient colors={['#3b82f6', '#1d4ed8']} style={styles.mainBtn}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainBtnText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Social Auth Section */}
        <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.socialSection}>
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtonsRow}>
            <TouchableOpacity style={styles.socialBtn} onPress={handleGoogleLogin}>
              <Image source={{uri: 'https://cdn-icons-png.flaticon.com/512/3002/3002219.png'}} style={styles.socialIcon} />
              <Text style={styles.socialBtnText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialBtn} onPress={handleFacebookLogin}>
              <FontAwesome5 name="facebook" size={22} color="#1877F2" style={{marginRight: 8}} />
              <Text style={styles.socialBtnText}>Facebook</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Toggle Login/Signup */}
        <TouchableOpacity style={styles.toggleBtn} onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.toggleText}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <Text style={styles.toggleTextBold}>{isLogin ? 'Sign Up' : 'Log In'}</Text>
          </Text>
        </TouchableOpacity>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 ULTRA MODERN STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' }, 
  
  bgCircle1: { position: 'absolute', top: -100, right: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(59, 130, 246, 0.15)' },
  bgCircle2: { position: 'absolute', bottom: -50, left: -100, width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(16, 185, 129, 0.1)' },

  headerContainer: { alignItems: 'center', marginTop: 40, marginBottom: 30 },
  logoBox: { width: 80, height: 80, backgroundColor: '#ffffff', borderRadius: 24, justifyContent: 'center', alignItems: 'center', shadowColor: '#3b82f6', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10, marginBottom: 15, transform: [{rotate: '-5deg'}] },
  title: { fontSize: 32, fontWeight: '900', color: '#ffffff', letterSpacing: 1 },
  subtitle: { fontSize: 14, color: '#94a3b8', marginTop: 5, fontWeight: '500' },

  formCard: { backgroundColor: '#ffffff', marginHorizontal: 20, borderRadius: 30, padding: 25, shadowColor: '#000', shadowOffset: {width: 0, height: 20}, shadowOpacity: 0.15, shadowRadius: 30, elevation: 15 },
  
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16, height: 55, paddingHorizontal: 15, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1e293b', fontWeight: '500' },
  
  forgotPassBtn: { alignSelf: 'flex-end', marginBottom: 15 },
  forgotPassText: { color: '#3b82f6', fontWeight: '700', fontSize: 13 },

  mainBtn: { height: 55, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#2563eb', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.3, shadowRadius: 15 },
  mainBtnText: { color: '#ffffff', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },

  socialSection: { marginTop: 30, paddingHorizontal: 20 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { color: '#64748b', paddingHorizontal: 10, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  
  socialButtonsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  socialBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', height: 50, borderRadius: 14, marginHorizontal: 5, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  socialIcon: { width: 20, height: 20, marginRight: 8 },
  socialBtnText: { fontSize: 15, fontWeight: '700', color: '#1e293b' },

  toggleBtn: { marginTop: 30, alignItems: 'center' },
  toggleText: { color: '#94a3b8', fontSize: 14, fontWeight: '500' },
  toggleTextBold: { color: '#ffffff', fontWeight: '800' },
});