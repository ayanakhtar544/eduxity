import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// 🔥 PATH CHECK: Ensure these paths match your project structure
import { deleteUser, signOut } from "firebase/auth";
import { deleteDoc, doc } from "firebase/firestore";
import { auth, db } from "../../core/firebase/firebaseConfig";
import { useUserStore } from "../../store/useUserStore";

export default function SettingsScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const username = user?.displayName || "user";

  // 🔐 ADMIN CHECK LOGIC
  const ADMIN_EMAIL = process.env.EXPO_PUBLIC_ADMIN_EMAIL;
  const isSuperAdmin = user?.email === ADMIN_EMAIL;

  // Zustand State
  const clearUserData = useUserStore((state) => state.clearUserData);

  // States for Delete Confirmation Modal
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const REQUIRED_PHRASE = `Delete my account ${username}`;

  // ==========================================
  // 🔐 1. THE LOGOUT LOGIC
  // ==========================================
  const performLogout = async () => {
    try {
      if (Platform.OS !== "web")
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );

      // Clear auth state from Zustand store first
      clearUserData();

      // Then sign out from Firebase
      await signOut(auth);

      // Finally redirect to home
      router.replace("/");
    } catch (error: any) {
      console.error("❌ Logout Error:", error);
      Alert.alert(
        "Error",
        error?.message || "Failed to logout. Please try again.",
      );
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to log out?");
      if (confirmed) performLogout();
    } else {
      Alert.alert("Logout", "Are you sure you want to log out?", [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: performLogout },
      ]);
    }
  };

  // ==========================================
  // 🧨 2. DELETE ACCOUNT LOGIC
  // ==========================================
  const executeAccountDeletion = async () => {
    if (confirmText !== REQUIRED_PHRASE) {
      Alert.alert("Error", "The confirmation text does not match.");
      return;
    }

    setIsDeleting(true);
    try {
      if (user) {
        await deleteDoc(doc(db, "users", user.uid));
        await deleteUser(user);

        clearUserData();
        setIsDeleteModalVisible(false);
        router.replace("/");
        Alert.alert("Deleted", "Your account has been removed.");
      }
    } catch (error: any) {
      console.error("Delete Error:", error);
      if (error.code === "auth/requires-recent-login") {
        Alert.alert(
          "Security",
          "Please logout and login again to verify your identity before deleting.",
        );
      } else {
        Alert.alert("Error", "Failed to delete account.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // ==========================================
  // 📜 3. LEGAL & POLICIES HANDLERS
  // ==========================================
  const handleOpenPrivacyPolicy = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    router.push("/privacy-policy");
  };

  const handleOpenTerms = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    router.push("/terms");
  };

  const forceRefreshAdminToken = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        Alert.alert("Error", "Bhai, pehle login toh kar le!");
        return;
      }

      console.log("🔄 Force refreshing Firebase Auth token...");

      // 🔥 The Magic Line: 'true' forces a network request to bypass the 1-hour cache
      await user.getIdToken(true);

      // Verification: Decode the new token to see if the 'admin' claim is actually there
      const idTokenResult = await user.getIdTokenResult();

      if (idTokenResult.claims.admin) {
        Alert.alert(
          "Success! 🎉",
          "Super Admin powers activated! You can now access the dashboard.",
        );
        console.log("✅ Admin claim verified in token:", idTokenResult.claims);
      } else {
        Alert.alert(
          "Failed",
          "Token refreshed, but 'admin' claim is missing. Check your Node script.",
        );
        console.log("❌ Current claims:", idTokenResult.claims);
      }
    } catch (error: any) {
      console.error("Token refresh error:", error);
      Alert.alert("Error", "Token refresh failed.");
    }
  };

  // ==========================================
  // 🧩 UI COMPONENTS
  // ==========================================
  const SettingsItem = ({
    icon,
    label,
    rightElement,
    onPress,
    isDestructive = false,
    isSpecial = false,
  }: any) => (
    <TouchableOpacity
      style={styles.itemRow}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.itemLeft} pointerEvents="none">
        <View
          style={[
            styles.iconBox,
            isDestructive && { backgroundColor: "#fef2f2" },
            isSpecial && { backgroundColor: "#ecfdf5" },
          ]}
        >
          <Ionicons
            name={icon}
            size={18}
            color={
              isDestructive ? "#ef4444" : isSpecial ? "#10b981" : "#64748b"
            }
          />
        </View>
        <Text
          style={[
            styles.itemLabel,
            isDestructive && { color: "#ef4444", fontWeight: "bold" },
            isSpecial && { color: "#10b981", fontWeight: "900" },
          ]}
        >
          {label}
        </Text>
      </View>
      <View style={styles.itemRight} pointerEvents="none">
        {rightElement ||
          (onPress && (
            <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
          ))}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f1f5f9" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ACCOUNT SECURITY */}
        <View style={styles.groupContainer}>
          <Text style={styles.groupTitle}>Account Security</Text>
          <View style={styles.groupContent}>
            <SettingsItem
              icon="mail-outline"
              label="Email"
              rightElement={
                <Text style={styles.valueText}>{user?.email || "N/A"}</Text>
              }
            />
            <View style={styles.divider} />
            <SettingsItem
              icon="key-outline"
              label="Change Password"
              onPress={() => router.push("/change-password")}
            />
          </View>
        </View>

        {/* HELP & SUPPORT */}
        <View style={styles.groupContainer}>
          <Text style={styles.groupTitle}>Help & Support</Text>
          <View style={styles.groupContent}>
            <SettingsItem
              icon="help-buoy-outline"
              label="FAQs & Help Center"
              onPress={() => router.push("/help-center")}
            />
            <View style={styles.divider} />
            <SettingsItem
              icon="bug-outline"
              label="Report a Bug"
              onPress={() => router.push("/report-bug")}
            />
          </View>
        </View>

        {/* LEGAL & POLICIES */}
        <View style={styles.groupContainer}>
          <Text style={styles.groupTitle}>Legal</Text>
          <View style={styles.groupContent}>
            <SettingsItem
              icon="shield-checkmark-outline"
              label="Privacy Policy"
              onPress={handleOpenPrivacyPolicy}
            />
            <View style={styles.divider} />
            <SettingsItem
              icon="document-text-outline"
              label="Terms & Conditions"
              onPress={handleOpenTerms}
            />
          </View>
        </View>

        {/* 🚀 SECRET DEVELOPER ZONE (ONLY FOR SUPER ADMIN) */}
        {isSuperAdmin && (
          <View style={styles.groupContainer}>
            <Text style={[styles.groupTitle, { color: "#10b981" }]}>
              Developer Options
            </Text>
            <View
              style={[
                styles.groupContent,
                { borderColor: "#a7f3d0", borderWidth: 2 },
              ]}
            >
              <SettingsItem
                icon="terminal-outline"
                label="Admin God Mode"
                isSpecial={true}
                onPress={() => router.push("/admin")}
              />
            </View>
          </View>
        )}

        {/* DANGER ZONE */}
        <View style={styles.groupContainer}>
          <Text style={styles.groupTitle}>Danger Zone</Text>
          <View style={styles.groupContent}>
            <SettingsItem
              icon="log-out-outline"
              label="Log Out"
              onPress={handleLogout}
            />
            <View style={styles.divider} />
            <SettingsItem
              icon="trash-outline"
              label="Delete Account"
              isDestructive={true}
              onPress={() => setIsDeleteModalVisible(true)}
            />
          </View>
        </View>

        <Text style={styles.versionText}>Eduxity App Version 1.0.0</Text>
      </ScrollView>

      {/* DELETE MODAL */}
      <Modal visible={isDeleteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Danger Zone</Text>
            <Text style={styles.modalSub}>
              This is permanent. To confirm, type exactly:
            </Text>
            <Text style={styles.phraseToCopy}>{REQUIRED_PHRASE}</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Type phrase here..."
              value={confirmText}
              onChangeText={setConfirmText}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setIsDeleteModalVisible(false);
                  setConfirmText("");
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmDeleteBtn,
                  confirmText !== REQUIRED_PHRASE && { opacity: 0.5 },
                ]}
                disabled={confirmText !== REQUIRED_PHRASE || isDeleting}
                onPress={executeAccountDeletion}
              >
                <Text style={styles.confirmDeleteText}>
                  {isDeleting ? "Deleting..." : "Confirm"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 20,
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#0f172a" },
  backBtn: { padding: 8, backgroundColor: "#f8fafc", borderRadius: 10 },
  scrollContent: { padding: 15, paddingBottom: 50 },
  groupContainer: { marginBottom: 25 },
  groupTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginLeft: 10,
    marginBottom: 8,
  },
  groupContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 15,
  },
  itemLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemLabel: { fontSize: 15, fontWeight: "600", color: "#0f172a" },
  itemRight: { flexDirection: "row", alignItems: "center" },
  valueText: { fontSize: 14, color: "#64748b", fontWeight: "500" },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginLeft: 60 },
  versionText: {
    textAlign: "center",
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#ef4444",
    marginBottom: 10,
  },
  modalSub: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 15,
  },
  phraseToCopy: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
    backgroundColor: "#f1f5f9",
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    textAlign: "center",
  },
  modalInput: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  modalActions: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    backgroundColor: "#f1f5f9",
  },
  cancelBtnText: { fontWeight: "700", color: "#64748b" },
  confirmDeleteBtn: {
    flex: 1,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    backgroundColor: "#ef4444",
  },
  confirmDeleteText: { fontWeight: "700", color: "#fff" },
});
