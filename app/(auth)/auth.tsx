// Location: app/(auth)/auth.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    FadeInDown,
    FadeOutUp,
    SlideInUp,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

// Firebase Services
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../core/firebase/firebaseConfig";

// Auth handlers
import { useEmailAuth, useGoogleAuth } from "../../core/auth/useAuthHandler";

// UI Components
import BrandLogo from "../../components/ui/BrandLogo";

// Close browser after OAuth redirect
WebBrowser.maybeCompleteAuthSession();

// ========================================================
// 📧 AUTHENTICATION SCREEN
// ========================================================
export default function AuthScreen() {
  const router = useRouter();
  const { signUp, signIn } = useEmailAuth();
  const { signInWithGoogle } = useGoogleAuth();

  // ========================================================
  // 🎯 STATE MANAGEMENT
  // ========================================================
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Toast notifications
  const [toastMessage, setToastMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // ========================================================
  // 🍞 TOAST NOTIFICATION HELPER
  // ========================================================
  const showToast = useCallback((message: string, error: boolean = false) => {
    setToastMessage(message);
    setIsError(error);
    if (Platform.OS !== "web") {
      if (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
    setTimeout(() => setToastMessage(""), 4000);
  }, []);

  // ========================================================
  // 📧 EMAIL/PASSWORD AUTHENTICATION
  // ========================================================
  const handleAuth = async () => {
    // 1. Validation
    if (!email.trim() || !password.trim() || (!isLogin && !fullName.trim())) {
      showToast("Please fill all the required fields.", true);
      return;
    }

    if (password.length < 6) {
      showToast("Password must be at least 6 characters.", true);
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      showToast("Passwords do not match!", true);
      return;
    }

    setLoading(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      let user;

      if (isLogin) {
        // 🔐 LOGIN
        console.log("🔐 Attempting login...");
        user = await signIn(email, password);
        showToast("Welcome back!", false);
        router.replace("/(tabs)");
      } else {
        // ✍️ SIGNUP
        console.log("✍️ Creating new account...");
        user = await signUp(email, password, fullName);

        // 💾 Create Firestore user document
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
      console.error("❌ Auth error:", error);
      const errorMsg =
        error?.userMessage ||
        error?.message ||
        "Authentication failed. Please try again.";
      showToast(errorMsg, true);
    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // 🌐 GOOGLE AUTHENTICATION
  // ========================================================
  const handleGoogleSignIn = useCallback(async () => {
    setLoading(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      console.log("🌐 Starting Google Sign-In...");
      const user = await signInWithGoogle();

      if (!user) {
        throw new Error("Google sign-in returned no user");
      }

      // Check if user already exists in Firestore
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        // New user - create profile
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
        // Existing user
        showToast(`Welcome back ${user.displayName || ""}!`, false);
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      console.error("❌ Google sign-in error:", error);
      const errorMsg =
        error?.userMessage ||
        error?.message ||
        "Google login failed. Please try again.";
      showToast(errorMsg, true);
    } finally {
      setLoading(false);
    }
  }, [signInWithGoogle, showToast, router]);

  // ========================================================
  // 🎨 RENDER UI
  // ========================================================
  return (
    <SafeAreaView style={styles.container}>
      {/* Toast Message */}
      {toastMessage !== "" && (
        <Animated.View
          entering={SlideInUp.springify().damping(15)}
          exiting={FadeOutUp}
          style={styles.toastContainer}
        >
          <View
            style={[
              styles.toastPill,
              isError ? styles.toastError : styles.toastSuccess,
            ]}
          >
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View
            entering={FadeInDown.duration(600)}
            style={styles.headerArea}
          >
            <View style={styles.header}>
              <View style={styles.logoWrapper}>
                <BrandLogo variant="large" withGlow={true} />
              </View>
              <Text style={styles.title}>
                {isLogin ? "Welcome Back" : "Create Account"}
              </Text>
            </View>
            <Text style={styles.subtitle}>
              {isLogin
                ? "Log in to access your study materials"
                : "Join Eduxity and start learning today"}
            </Text>
          </Animated.View>

          {/* Form Fields */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(600)}
            style={styles.formArea}
          >
            {/* Full Name (Signup only) */}
            {!isLogin && (
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#94a3b8"
                  style={styles.inputIcon}
                />
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

            {/* Email */}
            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#94a3b8"
                style={styles.inputIcon}
              />
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

            {/* Password */}
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#94a3b8"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={{ padding: 10 }}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password (Signup only) */}
            {!isLogin && (
              <Animated.View
                entering={FadeInDown.duration(400)}
                style={styles.inputWrapper}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color="#94a3b8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#94a3b8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ padding: 10 }}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={20}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Forgot Password (Login only) */}
            {isLogin && (
              <TouchableOpacity style={styles.forgotPassBtn}>
                <Text style={styles.forgotPassText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {/* Main Button */}
            <TouchableOpacity
              style={styles.mainBtn}
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.mainBtnText}>
                  {isLogin ? "Log In" : "Sign Up"}
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Social Login & Toggle */}
          <Animated.View entering={FadeInDown.delay(400).duration(600)}>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Button */}
            <View style={styles.socialRow}>
              <TouchableOpacity
                style={styles.socialBtn}
                onPress={handleGoogleSignIn}
                disabled={loading}
              >
                <Ionicons name="logo-google" size={22} color="#db4437" />
                <Text style={styles.socialBtnText}>Google</Text>
              </TouchableOpacity>
            </View>

            {/* Toggle Login/Signup */}
            <View style={styles.footerArea}>
              <Text style={styles.footerText}>
                {isLogin
                  ? "Don't have an account? "
                  : "Already have an account? "}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsLogin(!isLogin);
                  setEmail("");
                  setPassword("");
                  setConfirmPassword("");
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

// ========================================================
// 🎨 STYLES
// ========================================================
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
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)" as any,
    elevation: 5,
    borderWidth: 1,
  },
  toastError: { borderColor: "#fecaca" },
  toastSuccess: { borderColor: "#a7f3d0" },
  toastText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingBottom: 40,
    justifyContent: "center",
  },

  headerArea: {
    alignItems: "center",
    marginBottom: 35,
    marginTop: Platform.OS === "web" ? 40 : 10,
  },
  header: { alignItems: "center", width: "100%" },
  logoWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    width: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    paddingHorizontal: 20,
  },

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
    outlineStyle: "none" as any,
  },

  forgotPassBtn: { alignSelf: "flex-end", marginBottom: 20 },
  forgotPassText: { fontSize: 13, color: "#4f46e5", fontWeight: "700" },

  mainBtn: {
    backgroundColor: "#4f46e5",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0px 6px 12px rgba(79, 70, 229, 0.3)" as any,
    elevation: 5,
    marginTop: 10,
  },
  mainBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  dividerRow: { flexDirection: "row", alignItems: "center", marginBottom: 25 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#e2e8f0" },
  dividerText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#94a3b8",
    marginHorizontal: 15,
    letterSpacing: 1,
  },

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
    boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.05)" as any,
    elevation: 2,
  },
  socialBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#334155",
    marginLeft: 10,
  },

  footerArea: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "auto",
  },
  footerText: { fontSize: 14, color: "#64748b", fontWeight: "500" },
  footerLink: { fontSize: 14, color: "#4f46e5", fontWeight: "800" },
});
