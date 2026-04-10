// Location: app/join-group.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

// Firebase Imports
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../../core/firebase/firebaseConfig";

// Reanimated for Advanced Shake & Slide animations
import Animated, {
  FadeInDown,
  FadeOutDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";

const CODE_LENGTH = 6;
const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

export default function JoinGroupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [groupPreview, setGroupPreview] = useState<any>(null);
  const [joining, setJoining] = useState(false);

  const shakeTranslateX = useSharedValue(0);

  // 🚀 SHAKE ANIMATION FOR INVALID CODE
  const triggerShake = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    shakeTranslateX.value = withSequence(
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  };

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeTranslateX.value }],
  }));

  // ==========================================
  // 📡 AUTO-VERIFY CODE LOGIC
  // ==========================================
  useEffect(() => {
    if (code.length === CODE_LENGTH) {
      Keyboard.dismiss();
      verifyCode(code.toUpperCase());
    } else {
      setGroupPreview(null);
      setErrorMsg("");
    }
  }, [code]);

  const verifyCode = async (inviteCode: string) => {
    setLoading(true);
    setErrorMsg("");

    try {
      // Assumes your groups have an 'inviteCode' field
      const q = query(
        collection(db, "groups"),
        where("inviteCode", "==", inviteCode),
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        triggerShake();
        setErrorMsg("Invalid or expired code. Please try again.");
        setCode("");
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const groupDoc = querySnapshot.docs[0];
        setGroupPreview({ id: groupDoc.id, ...groupDoc.data() });
      }
    } catch (error) {
      console.log(error);
      setErrorMsg("Something went wrong. Check your connection.");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // ⚡ STRICT JOIN GROUP ACTION
  // ==========================================
  const handleJoinGroup = async () => {
    if (!groupPreview || !auth.currentUser) return;
    setJoining(true);
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const myUid = auth.currentUser.uid;
    const groupRef = doc(db, "groups", groupPreview.id);

    try {
      // 1. Agar already member hai toh chat me le jao
      if (groupPreview.members?.includes(myUid)) {
        router.replace(`/chat/${groupPreview.id}`);
        return;
      }

      // 2. 🔥 STRICT PRIVATE CHECK
      // Agar group private hai, toh sirf request jayegi
      if (groupPreview.isPrivate === true) {
        await updateDoc(groupRef, {
          pendingRequests: arrayUnion(myUid),
        });

        if (Platform.OS !== "web")
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Custom Alert & Redirect
        alert(
          "Request Sent! 🔒\n\nThe admin needs to approve your request before you can join.",
        );

        // Wapas pichle page pe bhej do, chat me nahi!
        setTimeout(() => {
          router.back();
        }, 800);
      } else {
        // 3. Agar Public hai, toh seedha add karo aur chat me ghus jao
        await updateDoc(groupRef, {
          members: arrayUnion(myUid),
        });

        if (Platform.OS !== "web")
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
          router.replace(`/chat/${groupPreview.id}`);
        }, 500);
      }
    } catch (error) {
      console.log("Error joining group: ", error);
      alert("Something went wrong. Try again.");
    } finally {
      setJoining(false);
    }
  };
  // ==========================================
  // 🎨 OTP BOX RENDERER
  // ==========================================
  const renderCodeBoxes = () => {
    const codeArray = code.split("");
    const boxes = [];

    for (let i = 0; i < CODE_LENGTH; i++) {
      const char = codeArray[i] || "";
      const isCurrent = i === code.length;

      boxes.push(
        <View
          key={i}
          style={[
            styles.codeBox,
            isCurrent && styles.codeBoxActive,
            char && styles.codeBoxFilled,
          ]}
        >
          <Text style={styles.codeText}>{char.toUpperCase()}</Text>
        </View>,
      );
    }
    return boxes;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Glass Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === "ios" ? insets.top : 20 },
        ]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        {/* Title & Instructions */}
        <Animated.View
          entering={FadeInDown.delay(100)}
          style={styles.titleSection}
        >
          <View style={styles.iconWrapper}>
            <Ionicons name="keypad" size={32} color="#2563EB" />
          </View>
          <Text style={styles.title}>Join via Code</Text>
          <Text style={styles.subtitle}>
            Enter the 6-character invite code provided by your group admin or
            friend.
          </Text>
        </Animated.View>

        {/* 🚀 HIDDEN INPUT & OTP BOXES */}
        <Animated.View
          entering={FadeInDown.delay(200)}
          style={styles.inputSection}
        >
          <Animated.View style={[styles.boxesContainer, shakeStyle]}>
            {renderCodeBoxes()}
            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              value={code}
              onChangeText={(text) =>
                setCode(text.replace(/[^a-zA-Z0-9]/g, ""))
              }
              maxLength={CODE_LENGTH}
              keyboardType="default"
              autoCapitalize="characters"
              autoFocus
              caretHidden
            />
          </Animated.View>

          {loading && (
            <View style={styles.loaderBox}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={styles.loadingText}>Verifying code...</Text>
            </View>
          )}

          {errorMsg !== "" && (
            <Animated.Text entering={ZoomIn} style={styles.errorText}>
              {errorMsg}
            </Animated.Text>
          )}
        </Animated.View>

        {/* 🌟 SMART GROUP PREVIEW CARD */}
        {groupPreview && (
          <Animated.View
            entering={FadeInDown.springify()}
            exiting={FadeOutDown}
            style={styles.previewContainer}
          >
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <Image
                  source={{
                    uri:
                      groupPreview.avatar ||
                      groupPreview.groupImage ||
                      DEFAULT_AVATAR,
                  }}
                  style={styles.previewAvatar}
                />
                <View style={{ flex: 1, marginLeft: 15 }}>
                  <Text style={styles.previewName} numberOfLines={1}>
                    {groupPreview.name}
                  </Text>
                  <Text style={styles.previewMembers}>
                    {groupPreview.members?.length || 1} Members
                  </Text>
                </View>
                <View style={styles.successBadge}>
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                </View>
              </View>

              <TouchableOpacity
                style={styles.joinBtn}
                onPress={handleJoinGroup}
                disabled={joining}
              >
                <LinearGradient
                  colors={["#2563EB", "#4F46E5"]}
                  style={styles.joinBtnGradient}
                >
                  {joining ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.joinBtnText}>
                        {groupPreview.members?.includes(auth.currentUser?.uid)
                          ? "Go to Chat"
                          : groupPreview.isPrivate
                            ? "Send Request to Join 🔒"
                            : "Join Group Now ⚡"}
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={20}
                        color="#fff"
                        style={{ marginLeft: 8 }}
                      />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 ADVANCED GLASSY STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 15,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(241,245,249,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },

  content: { flex: 1, justifyContent: "center", paddingHorizontal: 25 },

  titleSection: { alignItems: "center", marginBottom: 40 },
  iconWrapper: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },

  inputSection: { alignItems: "center", height: 100 },
  boxesContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    position: "relative",
  },
  codeBox: {
    width: 48,
    height: 56,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
    elevation: 1,
  },
  codeBoxActive: { borderColor: "#2563EB", backgroundColor: "#eff6ff" },
  codeBoxFilled: { borderColor: "#cbd5e1", backgroundColor: "#f8fafc" },
  codeText: { fontSize: 24, fontWeight: "900", color: "#0f172a" },

  hiddenInput: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    fontSize: 1,
  }, // Hidden but covers the boxes

  loaderBox: { flexDirection: "row", alignItems: "center", marginTop: 25 },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  errorText: {
    marginTop: 25,
    fontSize: 14,
    fontWeight: "700",
    color: "#ef4444",
    textAlign: "center",
  },

  previewContainer: { position: "absolute", bottom: 50, left: 20, right: 20 },
  previewCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
    elevation: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  previewAvatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  previewName: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 4,
  },
  previewMembers: { fontSize: 13, color: "#64748b", fontWeight: "600" },
  successBadge: { backgroundColor: "#ecfdf5", padding: 4, borderRadius: 20 },

  joinBtn: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
    elevation: 5,
  },
  joinBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  joinBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
