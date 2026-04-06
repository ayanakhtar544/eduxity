// Location: app/create-group.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

// Firebase Imports
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../core/firebase/firebaseConfig";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

export default function CreateGroupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [imageRes, setImageRes] = useState<any>(null);
  const [privacyType, setPrivacyType] = useState<"public" | "private">(
    "public",
  ); // 🔥 Isolated State
  const [loading, setLoading] = useState(false);

  // 🎲 6-Character Unique Invite Code
  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // 📸 Image Picker with Auto-Compression
  const pickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.1, // Very low res as requested
      base64: true,
    });

    if (!result.canceled) {
      setImageRes({
        uri: result.assets[0].uri,
        base64: result.assets[0].base64,
      });
    }
  };

  // 🚀 ImgBB Upload Engine
  const uploadToImgBB = async (base64: string) => {
    const apiKey = process.env.EXPO_PUBLIC_IMGBB_API_KEY;
    if (!apiKey) {
      console.error("API Key missing in .env");
      return null;
    }

    try {
      const formData = new FormData();
      formData.append("image", base64);
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      return data.data.url;
    } catch (e) {
      return null;
    }
  };

  // ⚡ Main Launch Function
  const handleLaunchGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Error", "Bhai group ka naam toh likh de!");
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      let finalAvatar = DEFAULT_AVATAR;
      if (imageRes?.base64) {
        const uploadedUrl = await uploadToImgBB(imageRes.base64);
        if (uploadedUrl) finalAvatar = uploadedUrl;
      }

      const myUid = auth.currentUser?.uid;
      const inviteCode = generateInviteCode();

      // 🔥 DB Strict Logic
      const groupPayload = {
        name: groupName.trim(),
        desc: groupDesc.trim() || "Welcome to our Study Hub! 🚀",
        avatar: finalAvatar,
        adminId: myUid,
        admins: [myUid],
        members: [myUid],
        isGroup: true,
        inviteCode: inviteCode,
        isPrivate: privacyType === "private", // Boolean for strict checks
        pendingRequests: [], // Always start empty
        createdAt: serverTimestamp(),
        lastMessageTime: serverTimestamp(),
        lastMessage: {
          text: `Welcome to ${groupName}!`,
          senderName: "System",
          type: "text",
        },
      };

      const docRef = await addDoc(collection(db, "groups"), groupPayload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      router.replace(`/chat/${docRef.id}`);
    } catch (error) {
      console.error(error);
      Alert.alert("Fail", "Group launch failed. Check internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* 🍏 Minimal Header */}
      <View style={[styles.header, { marginTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="close" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Hub</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* PFP Section */}
          <Animated.View
            entering={FadeInDown.delay(100)}
            style={styles.pfpWrapper}
          >
            <TouchableOpacity onPress={pickImage} activeOpacity={0.9}>
              <Image
                source={{ uri: imageRes?.uri || DEFAULT_AVATAR }}
                style={styles.pfp}
              />
              <LinearGradient
                colors={["#4F46E5", "#2563EB"]}
                style={styles.camBadge}
              >
                <Ionicons name="camera" size={16} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Text Fields */}
          <Animated.View
            entering={FadeInDown.delay(200)}
            style={styles.section}
          >
            <Text style={styles.label}>Hub Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Physics Masters"
              value={groupName}
              onChangeText={setGroupName}
              maxLength={30}
            />

            <Text style={styles.label}>Hub Description (Goal)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What are we studying today?"
              value={groupDesc}
              onChangeText={setGroupDesc}
              multiline
              maxLength={120}
            />
          </Animated.View>

          {/* 🔥 Isolated Privacy Selector */}
          <Animated.View
            entering={FadeInDown.delay(300)}
            style={styles.section}
          >
            <Text style={styles.label}>Privacy Mode</Text>
            <View style={styles.privacyContainer}>
              <TouchableOpacity
                style={[
                  styles.privacyCard,
                  privacyType === "public" && styles.privacyCardActive,
                ]}
                onPress={() => {
                  setPrivacyType("public");
                  Haptics.selectionAsync();
                }}
              >
                <View
                  style={[
                    styles.radio,
                    privacyType === "public" && styles.radioActive,
                  ]}
                />
                <Ionicons
                  name="earth"
                  size={20}
                  color={privacyType === "public" ? "#2563EB" : "#94a3b8"}
                />
                <Text
                  style={[
                    styles.privacyTitle,
                    privacyType === "public" && styles.privacyTextActive,
                  ]}
                >
                  Public
                </Text>
                <Text style={styles.privacySub}>Direct Join</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.privacyCard,
                  privacyType === "private" && styles.privacyCardActivePrivate,
                ]}
                onPress={() => {
                  setPrivacyType("private");
                  Haptics.selectionAsync();
                }}
              >
                <View
                  style={[
                    styles.radio,
                    privacyType === "private" && styles.radioActivePrivate,
                  ]}
                />
                <Ionicons
                  name="lock-closed"
                  size={20}
                  color={privacyType === "private" ? "#EF4444" : "#94a3b8"}
                />
                <Text
                  style={[
                    styles.privacyTitle,
                    privacyType === "private" &&
                      styles.privacyTextActivePrivate,
                  ]}
                >
                  Private
                </Text>
                <Text style={styles.privacySub}>Admin Approval</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Launch Button */}
          <TouchableOpacity
            style={[styles.launchBtn, !groupName && styles.launchBtnDisabled]}
            onPress={handleLaunchGroup}
            disabled={loading || !groupName}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <LinearGradient
                colors={["#1e293b", "#0f172a"]}
                style={styles.launchGradient}
              >
                <Text style={styles.launchText}>Launch Hub</Text>
                <Ionicons
                  name="rocket"
                  size={20}
                  color="#fff"
                  style={{ marginLeft: 10 }}
                />
              </LinearGradient>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    height: 50,
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: { paddingHorizontal: 25, paddingTop: 20, paddingBottom: 50 },

  pfpWrapper: { alignSelf: "center", marginBottom: 30 },
  pfp: {
    width: 100,
    height: 100,
    borderRadius: 32,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  camBadge: {
    position: "absolute",
    bottom: -5,
    right: -5,
    width: 34,
    height: 34,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },

  section: { marginBottom: 25 },
  label: {
    fontSize: 12,
    fontWeight: "900",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 10,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  textArea: { height: 100, textAlignVertical: "top" },

  privacyContainer: { flexDirection: "row", gap: 12 },
  privacyCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  privacyCardActive: { borderColor: "#2563EB", backgroundColor: "#eff6ff" },
  privacyCardActivePrivate: {
    borderColor: "#EF4444",
    backgroundColor: "#fef2f2",
  },
  radio: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    marginBottom: 8,
  },
  radioActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  radioActivePrivate: { backgroundColor: "#EF4444", borderColor: "#EF4444" },
  privacyTitle: { fontSize: 15, fontWeight: "800", color: "#64748b" },
  privacyTextActive: { color: "#2563EB" },
  privacyTextActivePrivate: { color: "#EF4444" },
  privacySub: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94a3b8",
    marginTop: 2,
  },

  launchBtn: {
    marginTop: 10,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  launchBtnDisabled: { opacity: 0.5 },
  launchGradient: {
    flexDirection: "row",
    paddingVertical: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  launchText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
