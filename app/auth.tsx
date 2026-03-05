// File: app/auth.tsx
// Advanced Authentication Screen with Social Login UI

import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';

export default function AuthScreen() {
  const router = useRouter();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async () => {
    if (!email || !password) {
      setErrorMsg("Bhai, Email aur Password dono dalna zaroori hai!");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password kam se kam 6 characters ka hona chahiye.");
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        router.replace('/(tabs)');
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        router.replace('/onboarding');
      }
    } catch (error: any) {
      let msg = "Kuch galat ho gaya bhai, wapas try karo.";
      if (error.code === 'auth/invalid-email') msg = "Email ka format galat hai.";
      else if (error.code === 'auth/email-already-in-use') msg = "Is email se pehle hi account ban chuka hai!";
      else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') msg = "Email ya Password galat hai.";
      
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // Social Login 'Coming Soon' Alert
  const handleSocialLogin = (provider: string) => {
    Alert.alert(
      `${provider} Login`, 
      "Beta version mein abhi Email/Password use karo. Ye feature Final Launch mein aayega! 🚀"
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        
        <View style={styles.header}>
          <Text style={styles.title}>Eduxity</Text>
          <Text style={styles.subtitle}>
            {isLogin ? "Welcome back! Login to continue." : "Join the ultimate study network."}
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={(text) => { setEmail(text); setErrorMsg(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={(text) => { setPassword(text); setErrorMsg(''); }}
            secureTextEntry
          />

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
          
          {isLogin && (
            <TouchableOpacity style={styles.forgotPasswordBtn}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.mainButton, loading && styles.mainButtonDisabled]} 
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.mainButtonText}>
                {isLogin ? "Log In" : "Create Account"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* --- DIVIDER --- */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* --- SOCIAL BUTTONS --- */}
        <TouchableOpacity style={styles.googleButton} onPress={() => handleSocialLogin('Google')}>
          <Text style={styles.googleButtonText}>🌐 Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.facebookButton} onPress={() => handleSocialLogin('Facebook')}>
          <Text style={styles.facebookButtonText}>📘 Continue with Facebook</Text>
        </TouchableOpacity>

        {/* Toggle Login/Signup */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </Text>
          <TouchableOpacity onPress={() => { setIsLogin(!isLogin); setErrorMsg(''); setEmail(''); setPassword(''); }}>
            <Text style={styles.footerLink}>
              {isLogin ? "Sign Up" : "Log In"}
            </Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  content: { flex: 1, paddingHorizontal: 30, justifyContent: 'center' },
  header: { marginBottom: 40 },
  title: { fontSize: 40, fontWeight: '900', color: '#2563EB', marginBottom: 10, letterSpacing: -1 },
  subtitle: { fontSize: 16, color: '#6B7280', fontWeight: '500' },
  form: { width: '100%', marginBottom: 20 },
  input: { backgroundColor: '#F9FAFB', padding: 18, borderRadius: 16, fontSize: 16, marginBottom: 15, color: '#111827', borderWidth: 1, borderColor: '#F3F4F6' },
  errorText: { color: '#EF4444', fontSize: 14, marginBottom: 15, fontWeight: '500', textAlign: 'center' },
  forgotPasswordBtn: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotPasswordText: { color: '#6B7280', fontSize: 14, fontWeight: '600' },
  mainButton: { backgroundColor: '#2563EB', padding: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  mainButtonDisabled: { backgroundColor: '#93C5FD', shadowOpacity: 0 },
  mainButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  
  // Divider Styles
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { marginHorizontal: 15, color: '#9CA3AF', fontWeight: 'bold' },

  // Social Buttons Styles
  googleButton: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 1 },
  googleButtonText: { color: '#374151', fontSize: 16, fontWeight: '600' },
  facebookButton: { backgroundColor: '#1877F2', padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 20 },
  facebookButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  footerText: { color: '#6B7280', fontSize: 15 },
  footerLink: { color: '#2563EB', fontSize: 15, fontWeight: 'bold' },
});