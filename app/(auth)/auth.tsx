// Location: app/(auth)/auth.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
    Text
} from "react-native";
import Animated, { FadeInDown, FadeOutUp, SlideInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

// 🔥 Firebase Services
import { auth, db } from "../../core/firebase/firebaseConfig";
import BrandLogo from "../../components/ui/BrandLogo";
import {
    createUserWithEmailAndPassword,
    FacebookAuthProvider,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    signInWithPopup,
    updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

export default function AuthScreen() {
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // 🔥 NAYA: Confirm Password ko dikhane/chhipane ka state
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // 🔥 NAYA: Confirm Password store karne ka state
  const [confirmPassword, setConfirmPassword] = useState("");

  // 🍞 Custom Toast State
  const [toastMessage, setToastMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const showToast = (message: string, error: boolean = false) => {
    setToastMessage(message);
    setIsError(error);
    if (Platform.OS !== "web") {
      if (error)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setTimeout(() => setToastMessage(""), 4000);
  };

  // 🚀 1. EMAIL/PASSWORD AUTH LOGIC
  const handleAuth = async () => {
    // Basic validation
    if (!email.trim() || !password.trim() || (!isLogin && !fullName.trim())) {
      showToast("Please fill all the required fields.", true);
      return;
    }
    
    // Password length validation
    if (password.length < 6) {
      showToast("Password must be at least 6 characters.", true);
      return;
    }

    // 🔥 NAYA: Sign Up ke time password match check karna
    if (!isLogin && password !== confirmPassword) {
      showToast("Passwords do not match!", true);
      return;
    }

    setLoading(true);
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      if (isLogin) {
        // LOGIN
        await signInWithEmailAndPassword(auth, email.trim(), password);
        showToast("Welcome back!", false);
        router.replace("/(tabs)");
      } else {
        // SIGNUP
        const userCred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        const user = userCred.user;

        await updateProfile(user, { displayName: fullName.trim() });

        // 💾 Save to Firestore
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          fullName: fullName.trim(),
          email: user.email,
          photoURL: "",
          bio: "Eduxity Learner",
          interests: [],
          eduCoins: 50,
          xp: 100,
          level: 1,
          streak: 0,
          joinedAt: serverTimestamp(),
          followers: 0,
          following: 0,
        });

        showToast("Account created successfully!", false);
        router.replace({
          pathname: "/onboarding",
          params: { name: fullName.trim() },
        });
      }
    } catch (error: any) {
      console.error(error);
      let msg = "Something went wrong. Please try again.";
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        msg = "Invalid email or password.";
      } else if (error.code === "auth/email-already-in-use") {
        msg = "This email is already registered.";
      } else if (error.code === "auth/invalid-email") {
        msg = "Invalid email format.";
      }
      showToast(msg, true);
    } finally {
      setLoading(false);
    }
  };

  // 🌐 2. GOOGLE & FACEBOOK LOGIC
  const handleSocialAuth = async (providerType: "google" | "facebook") => {
    try {
      setLoading(true);
      if (Platform.OS !== "web")
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const provider =
        providerType === "google"
          ? new GoogleAuthProvider()
          : new FacebookAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        const fetchedName = user.displayName || "Eduxity User";

        await setDoc(userRef, {
          uid: user.uid,
          fullName: fetchedName,
          email: user.email,
          photoURL: user.photoURL || "",
          bio: "Eduxity Learner",
          eduCoins: 50,
          xp: 100,
          level: 1,
          streak: 0,
          joinedAt: serverTimestamp(),
          followers: 0,
          following: 0,
        });

        showToast(`Welcome ${fetchedName}! Let's set up your profile.`, false);
        router.replace({
          pathname: "/onboarding",
          params: { name: fetchedName },
        });
      } else {
        showToast(`Welcome back ${user.displayName || ""}!`, false);
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      console.error(error);
      showToast(`${providerType} login failed.`, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {toastMessage !== "" && (
        <Animated.View
          entering={SlideInUp.springify().damping(15)}
          exiting={FadeOutUp}
          style={styles.toastContainer}
        >
          <View style={[styles.toastPill, isError ? styles.toastError : styles.toastSuccess]}>
            <Ionicons
              name={isError ? "warning" : "checkmark-circle"}
              size={20}
              color={isError ? "#ef4444" : "#10b981"}
            />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </Animated.View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Animated.View entering={FadeInDown.duration(600)} style={styles.headerArea}>
            <View style={styles.header}>
              <View style={styles.logoWrapper}>
                <BrandLogo variant="large" withGlow={true} />
              </View>
              <Text style={styles.title}>{isLogin ? "Welcome Back" : "Create Account"}</Text>
            </View>
            <Text style={styles.subtitle}>
              {isLogin
                ? "Log in to access your study materials"
                : "Join Eduxity and start learning today"}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.formArea}>
            
            {/* FULL NAME (SIGNUP ONLY) */}
            {!isLogin && (
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#94a3b8"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>
            )}

            {/* EMAIL */}
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* PASSWORD */}
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 10 }}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* 🔥 NAYA: CONFIRM PASSWORD (SIGNUP ONLY) */}
            {!isLogin && (
              <Animated.View entering={FadeInDown.duration(400)} style={styles.inputWrapper}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#94a3b8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ padding: 10 }}>
                  <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#94a3b8" />
                </TouchableOpacity>
              </Animated.View>
            )}

            {isLogin && (
              <TouchableOpacity style={styles.forgotPassBtn}>
                <Text style={styles.forgotPassText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.mainBtn} onPress={handleAuth} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.mainBtnText}>{isLogin ? "Log In" : "Sign Up"}</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(600)}>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* SOCIAL LOGIN BUTTONS */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn} onPress={() => handleSocialAuth("google")} disabled={loading}>
                <Ionicons name="logo-google" size={22} color="#db4437" />
                <Text style={styles.socialBtnText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.socialBtn} onPress={() => handleSocialAuth("facebook")} disabled={loading}>
                <Ionicons name="logo-facebook" size={22} color="#1877f2" />
                <Text style={[styles.socialBtnText, { color: "#1877f2" }]}>Facebook</Text>
              </TouchableOpacity>
            </View>

            {/* BOTTOM TOGGLE */}
            <View style={styles.footerArea}>
              <Text style={styles.footerText}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsLogin(!isLogin);
                  setEmail("");
                  setPassword("");
                  setConfirmPassword(""); // Reset confirm password too
                  setFullName("");
                }}
              >
                <Text style={styles.footerLink}>
                  {isLogin ? "Sign Up" : "Log In"}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  toastContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100,
    elevation: 100,
  },
  toastPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    // 🔥 FIX: Modern BoxShadow instead of deprecated props
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
    elevation: 5,
    borderWidth: 1,
  },
  toastError: { borderColor: "#fecaca" },
  toastSuccess: { borderColor: "#a7f3d0" },
  toastText: { marginLeft: 8, fontSize: 14, fontWeight: "700", color: "#0f172a" },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingBottom: 40,
    justifyContent: "center",
  },

  headerArea: { alignItems: "center", marginBottom: 35, marginTop: Platform.OS === "web" ? 40 : 10 },
  header: { alignItems: "center", width: "100%" },
  logoWrapper: { alignItems: "center", justifyContent: "center", marginBottom: 20, width: "100%" },
  title: { fontSize: 28, fontWeight: "900", color: "#0f172a", marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: "#64748b", textAlign: "center", paddingHorizontal: 20 },

  formArea: { width: "100%", marginBottom: 25 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    marginBottom: 16,
    height: 56,
  },
  inputIcon: { marginLeft: 16, marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "500",
    height: "100%",
    outlineStyle: "none",
  } as any,

  forgotPassBtn: { alignSelf: "flex-end", marginBottom: 20 },
  forgotPassText: { fontSize: 13, color: "#4f46e5", fontWeight: "700" },

  mainBtn: {
    backgroundColor: "#4f46e5",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    // 🔥 FIX: Modern BoxShadow
    boxShadow: '0px 6px 12px rgba(79, 70, 229, 0.3)',
    elevation: 5,
    marginTop: 10,
  },
  mainBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  dividerRow: { flexDirection: "row", alignItems: "center", marginBottom: 25 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#e2e8f0" },
  dividerText: { fontSize: 12, fontWeight: "800", color: "#94a3b8", marginHorizontal: 15, letterSpacing: 1 },

  socialRow: { flexDirection: "row", gap: 15, marginBottom: 40 },
  socialBtn: {
    flex: 1,
    height: 56,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    // 🔥 FIX: Modern BoxShadow
    boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  socialBtnText: { fontSize: 15, fontWeight: "800", color: "#334155", marginLeft: 10 },

  footerArea: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: "auto" },
  footerText: { fontSize: 14, color: "#64748b", fontWeight: "500" },
  footerLink: { fontSize: 14, color: "#4f46e5", fontWeight: "800" },
});