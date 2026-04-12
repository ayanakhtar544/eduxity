import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useQueryClient } from "@tanstack/react-query";
import { AIGeneratorService } from "../../core/api/aiGeneratorService";
import { useUserStore } from "../../store/useUserStore";

interface ResourceState {
  title: string;
  language: "English" | "Hindi" | "Hinglish";
}

const LANGUAGE_OPTIONS = ["English", "Hindi", "Hinglish"] as const;

export default function ResourcesGeneratorScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<ResourceState>({
    title: "",
    language: "English",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const getInputQualityLevel = () => {
    if (!form.title.trim()) {
      return {
        text: "Enter a topic to get fast AI posts.",
        color: "#64748b",
        width: "10%",
      };
    }
    if (form.title.trim().length < 15) {
      return {
        text: "Good start — one more word makes the prompt stronger.",
        color: "#f59e0b",
        width: "45%",
      };
    }
    return {
      text: "Ready to generate high-quality learning posts.",
      color: "#10b981",
      width: "100%",
    };
  };

  const quality = getInputQualityLevel();

  const handleAddLink = () => {
    // Removed: links are simplified out
  };

  const removeLink = (index: number) => {
    // Removed: links are simplified out
  };

  const pickDocument = async () => {
    // Removed: file uploads are simplified out
  };

  const pickImage = async () => {
    // Removed: file uploads are simplified out
  };

  const removeFile = (index: number) => {
    // Removed: file uploads are simplified out
  };

  // ==========================================
  // 🚀 SUBMISSION & CACHE FIX LOGIC
  // ==========================================
  const handleSubmit = async () => {
    console.log("🔥 handleSubmit triggered");

    if (!form.title.trim()) {
      console.log("❌ No title provided");
      Alert.alert(
        "Required Field",
        "Topic/Title is mandatory to generate posts.",
      );
      return;
    }

    if (!user?.uid) {
      console.log("❌ No user logged in, user:", user);
      Alert.alert("Auth Error", "Please login again to generate posts.");
      return;
    }

    console.log("✅ Validation passed, setting isSubmitting=true");
    setIsSubmitting(true);

    try {
      const payload = {
        topic: form.title,
        language: form.language,
        uid: user.uid,
      };

      console.log("📤 Sending payload:", payload);

      const response =
        await AIGeneratorService.processMaterialAndGenerateFeed(payload);
      console.log("📥 API response received:", response);

      console.log("✅ API call successful");

      // 🚨 CRITICAL FIX: Invalidate BOTH feed query keys exactly as they're used in useFeed hook
      // useFeed uses queryKey: ["feed", uid, mode]
      await queryClient.invalidateQueries({
        queryKey: ["feed", user.uid, "PERSONALIZED"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["feed", user.uid, "FOR_YOU"],
      });

      // 🚨 Success alert before navigation
      Alert.alert(
        "Success! 🚀",
        "15 Posts successfully added to your My Space!",
        [
          {
            text: "Go to Feed",
            onPress: () => router.replace("/(tabs)"),
          },
        ],
      );
    } catch (error) {
      console.error("❌ Generator Error: ", error);
      Alert.alert(
        "Error",
        "Failed to generate posts. The AI took too long or server failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Generator</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.qualityContainer}>
            <Text style={[styles.qualityText, { color: quality.color }]}>
              {quality.text}
            </Text>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: quality.width as any,
                    backgroundColor: quality.color,
                  },
                ]}
              />
            </View>
          </View>

          <Text style={styles.label}>
            TOPIC / TITLE <Text style={{ color: "red" }}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Newton's Laws of Motion"
            value={form.title}
            onChangeText={(text) => setForm({ ...form, title: text })}
            maxLength={100}
            placeholderTextColor="#cbd5e1"
          />

          <Text style={styles.label}>LANGUAGE</Text>
          <View style={styles.languageRow}>
            {LANGUAGE_OPTIONS.map((language) => (
              <TouchableOpacity
                key={language}
                style={[
                  styles.languageOption,
                  form.language === language && styles.languageOptionSelected,
                ]}
                onPress={() => setForm({ ...form, language })}
              >
                <Text
                  style={
                    form.language === language
                      ? styles.languageTextSelected
                      : styles.languageText
                  }
                >
                  {language}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitBtn,
            (!form.title.trim() || isSubmitting) && styles.submitBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!form.title.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons
                name="sparkles"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.submitBtnText}>Generate 15 Posts</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  scrollContent: { padding: 20 },
  qualityContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  qualityText: { fontSize: 13, fontWeight: "800", marginBottom: 8 },
  progressBarBg: {
    height: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", borderRadius: 3 },
  label: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
    marginBottom: 8,
    letterSpacing: 0.5,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 15,
    fontSize: 15,
    color: "#0f172a",
    marginBottom: 20,
  },
  languageRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  languageOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  languageOptionSelected: {
    backgroundColor: "#4f46e5",
    borderColor: "#4f46e5",
  },
  languageText: {
    color: "#0f172a",
    fontWeight: "700",
  },
  languageTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 20,
    borderTopWidth: 1,
    borderColor: "#e2e8f0",
  },
  submitBtn: {
    flexDirection: "row",
    backgroundColor: "#4f46e5",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
