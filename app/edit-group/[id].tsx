// Location: app/edit-group/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
import Animated, { FadeInDown, SlideInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
// 🔥 Firestore se deleteDoc aur arrayRemove bhi import kar liya
import * as Haptics from "expo-haptics";
import {
    arrayRemove,
    deleteDoc,
    doc,
    getDoc,
    updateDoc,
} from "firebase/firestore";
import { auth, db } from "../../core/firebase/firebaseConfig";

// 🔑 IMGBB API KEY (.env se fetch kar rahe hain)
const IMGBB_API_KEY = process.env.EXPO_PUBLIC_IMGBB_API_KEY;

export default function EditGroupScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("JEE");

  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null); // 🔥 Naya Base64 state upload ke liye
  const [existingLogo, setExistingLogo] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); // 🔥 Role check karne ke liye

  const CATEGORIES = [
    { name: "JEE", icon: "calculator-outline" },
    { name: "NEET", icon: "pulse-outline" },
    { name: "UPSC", icon: "book-outline" },
    { name: "Coding", icon: "code-slash-outline" },
    { name: "General", icon: "planet-outline" },
  ];

  // ==========================================
  // 1️⃣ FETCH EXISTING DATA & CHECK ROLE
  // ==========================================
  useEffect(() => {
    const fetchGroupData = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "groups", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || "");
          setDescription(data.description || "");
          setCategory(data.category || "General");
          setExistingLogo(data.icon || data.avatar || "");

          // 🔥 Check if current user is Admin
          const groupAdminId =
            data.adminId || (data.admins ? data.admins[0] : null);
          if (
            currentUid === groupAdminId ||
            data.admins?.includes(currentUid)
          ) {
            setIsAdmin(true);
          }
        }
      } catch (error) {
        Alert.alert("Error", "Could not fetch group details.");
      } finally {
        setFetching(false);
      }
    };
    fetchGroupData();
  }, [id, currentUid]);

  // ==========================================
  // 2️⃣ PICK IMAGE (Base64 Ke Sath)
  // ==========================================
  const pickImage = async () => {
    if (!isAdmin) {
      Alert.alert("Access Denied", "Only admins can change the group logo.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Camera roll access needed.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,
      base64: true, // 🔥 Image ko direct text me lene ke liye
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setLogoUri(result.assets[0].uri);
      setLogoBase64(result.assets[0].base64 || null);
    }
  };

  // ==========================================
  // 🚀 3️⃣ UPLOAD TO IMGBB
  // ==========================================
  const uploadToImgBB = async (base64String: string) => {
    try {
      if (!IMGBB_API_KEY) throw new Error("API Key missing in .env file!");

      const formData = new FormData();
      formData.append("image", base64String);

      const response = await fetch(
        `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
        {
          method: "POST",
          body: formData,
        },
      );

      const json = await response.json();
      if (json.success) return json.data.url;
      throw new Error(json.error?.message || "Upload failed");
    } catch (error) {
      console.error("ImgBB Error:", error);
      throw error;
    }
  };

  // ==========================================
  // 💾 4️⃣ SAVE UPDATES
  // ==========================================
  const handleUpdateGroup = async () => {
    if (!isAdmin) return; // Security check

    if (!name.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Hold up!", "Group name cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      let finalLogoUrl = existingLogo;

      // 🔥 Agar nayi image hai toh base64 use karke upload karo
      if (logoBase64) {
        const uploadedUrl = await uploadToImgBB(logoBase64);
        if (!uploadedUrl) {
          setLoading(false);
          Alert.alert("Upload Failed", "Image upload nahi ho paayi.");
          return;
        }
        finalLogoUrl = uploadedUrl;
      } else if (!existingLogo) {
        finalLogoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f172a&color=fff&size=200&bold=true`;
      }

      const updateData = {
        name: name.trim(),
        description: description.trim(),
        category,
        icon: finalLogoUrl,
      };

      await updateDoc(doc(db, "groups", id as string), updateData);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Group updated successfully!");
      router.back();
    } catch (error: any) {
      console.log(error);
      Alert.alert("Error", error.message || "Failed to update group.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 🗑️ 5️⃣ DANGER ZONE: DELETE OR LEAVE
  // ==========================================
  const handleDeleteGroup = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Alert.alert(
      "Delete Group 🔥",
      "This action will permanently delete all messages, notes, and the group itself. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Permanently",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await deleteDoc(doc(db, "groups", id as string));
              router.replace("/(tabs)/explore");
            } catch (e) {
              Alert.alert("Error", "Could not delete the group.");
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleLeaveGroup = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Leave Group",
      "Are you sure you want to leave this study group?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              if (!currentUid) return;
              await updateDoc(doc(db, "groups", id as string), {
                members: arrayRemove(currentUid),
                participants: arrayRemove(currentUid),
              });
              router.replace("/(tabs)/explore");
            } catch (e) {
              Alert.alert("Error", "Could not leave the group.");
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  if (fetching)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );

  const displayImage =
    logoUri ||
    existingLogo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f172a&color=fff&size=200&bold=true`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={28} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isAdmin ? "Group Settings" : "Group Info"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            entering={FadeInDown.duration(500).springify()}
            style={styles.logoUploadContainer}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.logoPlaceholder}
              onPress={pickImage}
              disabled={!isAdmin}
            >
              <Image
                source={{ uri: displayImage }}
                style={styles.previewImage}
                transition={200}
              />
              {isAdmin && (
                <View style={styles.editBadge}>
                  <Ionicons name="pencil" size={14} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.hintText}>
              {isAdmin ? "Tap to change logo" : "Group Logo"}
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(150).duration(600).springify()}
            style={styles.formGroup}
          >
            <Text style={styles.label}>Group Name</Text>
            <View
              style={[styles.inputWrapper, !isAdmin && styles.inputDisabled]}
            >
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                maxLength={30}
                editable={isAdmin}
              />
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(250).duration(600).springify()}
            style={styles.formGroup}
          >
            <Text style={styles.label}>Description</Text>
            <View
              style={[
                styles.inputWrapper,
                { height: 100 },
                !isAdmin && styles.inputDisabled,
              ]}
            >
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                maxLength={150}
                editable={isAdmin}
              />
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(350).duration(600).springify()}
            style={styles.formGroup}
          >
            <Text style={styles.label}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
            >
              {CATEGORIES.map((cat) => {
                const isActive = category === cat.name;
                return (
                  <TouchableOpacity
                    key={cat.name}
                    disabled={!isAdmin}
                    style={[
                      styles.catPill,
                      isActive && styles.catPillActive,
                      !isAdmin && !isActive && { opacity: 0.5 },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setCategory(cat.name);
                    }}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={16}
                      color={isActive ? "#fff" : "#64748b"}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[styles.catText, isActive && styles.catTextActive]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* 🔥 DANGER ZONE 🔥 */}
          <Animated.View
            entering={FadeInDown.delay(450).duration(600).springify()}
            style={styles.dangerZone}
          >
            <Text style={styles.dangerTitle}>Danger Zone</Text>
            {isAdmin ? (
              <TouchableOpacity
                style={styles.deleteGroupBtn}
                onPress={handleDeleteGroup}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                <Text style={styles.deleteGroupText}>
                  Delete Group Permanently
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.leaveGroupBtn}
                onPress={handleLeaveGroup}
              >
                <Ionicons name="exit-outline" size={20} color="#f59e0b" />
                <Text style={styles.leaveGroupText}>Leave this Group</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* SAVE BUTTON (SIRF ADMIN KO DIKHEGA) */}
      {isAdmin && (
        <Animated.View
          entering={SlideInUp.delay(400).springify()}
          style={styles.footer}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleUpdateGroup}
            disabled={loading}
            style={styles.submitBtnWrapper}
          >
            <LinearGradient
              colors={["#4f46e5", "#3b82f6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Save Changes</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

// PREMIUM STYLES
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  backBtn: { padding: 4, backgroundColor: "#f1f5f9", borderRadius: 20 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -0.5,
  },

  // Isme thodi extra padding di hai taaki scroll karke Danger Zone tak easily ja sakein
  scrollContent: { padding: 25, paddingBottom: 140 },

  logoUploadContainer: { alignItems: "center", marginBottom: 35 },
  logoPlaceholder: {
    width: 130,
    height: 130,
    borderRadius: 40,
    backgroundColor: "#fff",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#fff",
  },
  editBadge: {
    position: "absolute",
    bottom: -5,
    right: -5,
    backgroundColor: "#0f172a",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  hintText: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 15,
    fontWeight: "700",
  },

  formGroup: { marginBottom: 25 },
  label: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 10,
  },
  inputWrapper: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
  },
  inputDisabled: {
    backgroundColor: "#f1f5f9",
    borderColor: "#e2e8f0",
    opacity: 0.8,
  },
  input: {
    paddingHorizontal: 18,
    height: 55,
    fontSize: 16,
    color: "#0f172a",
    fontWeight: "600",
  },
  textArea: { paddingTop: 15, textAlignVertical: "top" },

  categoryRow: { flexDirection: "row", gap: 12, paddingVertical: 5 },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
  },
  catPillActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  catText: { color: "#64748b", fontWeight: "800", fontSize: 14 },
  catTextActive: { color: "#fff" },

  // 🔥 DANGER ZONE STYLES
  dangerZone: {
    marginTop: 15,
    paddingTop: 25,
    borderTopWidth: 1,
    borderColor: "#e2e8f0",
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#ef4444",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 15,
  },

  deleteGroupBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fef2f2",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  deleteGroupText: {
    color: "#ef4444",
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 8,
  },

  leaveGroupBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fffbeb",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  leaveGroupText: {
    color: "#f59e0b",
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 8,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 25,
    backgroundColor: "#f8fafc",
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
  },
  submitBtnWrapper: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  submitGradient: {
    flexDirection: "row",
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
