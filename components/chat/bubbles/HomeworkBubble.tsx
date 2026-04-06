import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import { doc, increment, updateDoc } from "firebase/firestore"; // 🔥 Changed imports
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInUp, LinearTransition } from "react-native-reanimated";
import { auth, db } from "../../../core/firebase/firebaseConfig";

const IMGBB_API_KEY = process.env.EXPO_PUBLIC_IMGBB_API_KEY;

export default function HomeworkBubble({
  message,
  isMe,
  timeString,
  openDashboard,
}: any) {
  const [isUploadingHW, setIsUploadingHW] = useState(false);
  const currentUid = auth.currentUser?.uid;
  const mySubmission = message.submissions?.[currentUid || ""];

  // URL se Chat ID / Group ID nikalo
  const { id: groupId } = useLocalSearchParams();

  const handleUploadHomework = async () => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // 1. Image Pick Karo (New Syntax & Multiple Images)
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.6,
      base64: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) return;

    setIsUploadingHW(true);

    try {
      if (!IMGBB_API_KEY) throw new Error("API Key missing from .env");
      if (!groupId) throw new Error("Group ID is missing.");

      const uploadedUrls: string[] = [];

      // 2. Upload images to ImgBB
      for (const asset of result.assets) {
        if (!asset.base64) continue;

        const formData = new FormData();
        formData.append("image", asset.base64);

        const response = await fetch(
          `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
          {
            method: "POST",
            body: formData,
          },
        );

        const data = await response.json();
        if (data.success) {
          uploadedUrls.push(data.data.url);
        }
      }

      if (uploadedUrls.length === 0)
        throw new Error("No images were successfully uploaded.");

      // 3. 🔥 THE REAL FIX: Save straight to the Message Document!
      const myUid = auth.currentUser?.uid;
      const myName = auth.currentUser?.displayName || "Student";

      const messageRef = doc(
        db,
        "groups",
        groupId as string,
        "messages",
        message.id,
      );

      await updateDoc(messageRef, {
        [`submissions.${myUid}`]: {
          name: myName,
          pages: uploadedUrls, // 🔥 Dashboard is looking for this exact array!
          submittedAt: new Date().toISOString(),
        },
      });

      // 4. Reward the student! 🚀
      if (myUid) {
        await updateDoc(doc(db, "users", myUid), {
          eduCoins: increment(10),
          "gamification.xp": increment(50),
        });
      }

      if (Platform.OS !== "web")
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Success! 🎉",
        `Successfully submitted ${uploadedUrls.length} page(s).`,
      );
    } catch (error: any) {
      console.error("Homework Upload Error: ", error);
      Alert.alert(
        "Upload Failed",
        error.message || "Could not submit homework. Check internet.",
      );
    } finally {
      setIsUploadingHW(false);
    }
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(400).springify()}
      layout={LinearTransition.springify()}
      style={[styles.wrapper, isMe ? styles.wrapperMe : styles.wrapperOther]}
    >
      <View
        style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}
      >
        {/* 🎨 Header */}
        <View style={styles.headerRow}>
          <View style={styles.iconContainer}>
            <Ionicons name="folder-open" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.titleText} numberOfLines={2}>
              {message.title || "New Homework"}
            </Text>
            <Text style={styles.subtitleText}>Assignment Task</Text>
          </View>
        </View>

        {/* ✅ Submission Status */}
        {mySubmission ? (
          <View style={styles.statusBadgeSuccess}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={styles.statusTextSuccess}>
              Submitted {mySubmission.pages?.length || 1} pages
            </Text>
          </View>
        ) : (
          <View style={styles.statusBadgePending}>
            <Ionicons name="time" size={16} color="#d97706" />
            <Text style={styles.statusTextPending}>Pending Submission</Text>
          </View>
        )}

        {/* 🚀 Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.submitBtn,
              mySubmission && styles.btnDisabled,
            ]}
            onPress={handleUploadHomework}
            disabled={isUploadingHW || !!mySubmission}
            activeOpacity={0.8}
          >
            {isUploadingHW ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={18} color="#fff" />
                <Text style={styles.submitBtnText}>
                  {mySubmission ? "Submitted" : "Upload HW"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.dashBtn]}
            onPress={() => openDashboard(message)}
            activeOpacity={0.8}
          >
            <Ionicons name="stats-chart" size={16} color="#0f172a" />
            <Text style={styles.dashBtnText}>Dashboard</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.time}>{timeString}</Text>
      </View>
    </Animated.View>
  );
}

// ==========================================
// 🎨 PREMIUM STYLES
// ==========================================
const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 15,
    width: "100%",
    paddingHorizontal: 10,
  },
  wrapperMe: { justifyContent: "flex-end" },
  wrapperOther: { justifyContent: "flex-start" },

  bubble: {
    width: 280,
    padding: 16,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  bubbleMe: {
    backgroundColor: "#ffffff",
    borderBottomRightRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  bubbleOther: {
    backgroundColor: "#f8fafc",
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#4F46E5",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  titleText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
    lineHeight: 20,
  },
  subtitleText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    marginTop: 2,
  },

  statusBadgeSuccess: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d1fae5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 15,
    alignSelf: "flex-start",
  },
  statusTextSuccess: {
    color: "#059669",
    fontWeight: "800",
    fontSize: 12,
    marginLeft: 6,
  },

  statusBadgePending: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 15,
    alignSelf: "flex-start",
  },
  statusTextPending: {
    color: "#d97706",
    fontWeight: "800",
    fontSize: 12,
    marginLeft: 6,
  },

  actionRow: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },

  submitBtn: { backgroundColor: "#4F46E5" },
  submitBtnText: { color: "#fff", fontWeight: "900", fontSize: 13 },
  btnDisabled: { backgroundColor: "#94a3b8" },

  dashBtn: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  dashBtnText: { color: "#0f172a", fontWeight: "800", fontSize: 13 },

  time: {
    fontSize: 10,
    marginTop: 12,
    color: "#94a3b8",
    alignSelf: "flex-end",
    fontWeight: "600",
  },
});
