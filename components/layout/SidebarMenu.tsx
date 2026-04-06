import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInLeft,
  SlideOutLeft,
} from "react-native-reanimated";
import { auth } from "../../core/firebase/firebaseConfig";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

export default function SidebarMenu({
  isOpen,
  onClose,
  currentUid,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentUid: string | undefined;
}) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={styles.menuOverlay}
    >
      <TouchableOpacity
        style={styles.menuBackdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <Animated.View
        entering={SlideInLeft.duration(250)}
        exiting={SlideOutLeft.duration(200)}
        style={styles.menuDrawer}
      >
        <View style={styles.menuDrawerHeader}>
          <Image
            source={{ uri: auth.currentUser?.photoURL || DEFAULT_AVATAR }}
            style={styles.menuAvatar}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.menuUserName} numberOfLines={1}>
              {auth.currentUser?.displayName || "Scholar"}
            </Text>
            <Text style={styles.menuUserSub}>Ready to grind? 🔥</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.menuCloseBtn}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.menuScroll}>
          <Text style={styles.menuSectionTitle}>EXPLORE</Text>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              onClose();
              router.push("/resources");
            }}
          >
            <View style={[styles.menuIconBg, { backgroundColor: "#eef2ff" }]}>
              <Ionicons name="book" size={20} color="#4f46e5" />
            </View>
            <Text style={styles.menuItemText}>Study Resources</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              onClose();
              router.push("/tests");
            }}
          >
            <View style={[styles.menuIconBg, { backgroundColor: "#fef3c7" }]}>
              <Ionicons name="document-text" size={20} color="#d97706" />
            </View>
            <Text style={styles.menuItemText}>Tests</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              onClose();
              router.push("/grind");
            }}
          >
            <View style={[styles.menuIconBg, { backgroundColor: "#ecfdf5" }]}>
              <Ionicons name="timer" size={20} color="#10b981" />
            </View>
            <Text style={styles.menuItemText}>Live Grind Room</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              onClose();
              router.push("/doubts");
            }}
          >
            <View style={[styles.menuIconBg, { backgroundColor: "#e0e7ff" }]}>
              <Ionicons name="help-buoy" size={20} color="#4f46e5" />
            </View>
            <Text style={styles.menuItemText}>Doubt Hub ❓</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              onClose();
              router.push("/network");
            }}
          >
            <View style={[styles.menuIconBg, { backgroundColor: "#f0fdf4" }]}>
              <Ionicons name="people" size={20} color="#10b981" />
            </View>
            <Text style={styles.menuItemText}>My Network</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              onClose();
              router.push("/matchmaking");
            }}
          >
            <View style={[styles.menuIconBg, { backgroundColor: "#fdf2f8" }]}>
              <Ionicons name="heart" size={20} color="#ec4899" />
            </View>
            <Text style={styles.menuItemText}>Find Study Partner</Text>
          </TouchableOpacity>

          <Text style={styles.menuSectionTitle}>ACCOUNT</Text>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              onClose();
              router.push(`/user/${currentUid}`);
            }}
          >
            <View style={[styles.menuIconBg, { backgroundColor: "#f1f5f9" }]}>
              <Ionicons name="person" size={20} color="#475569" />
            </View>
            <Text style={styles.menuItemText}>My Profile</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    elevation: 100,
  },
  menuBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  menuDrawer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: "75%",
    backgroundColor: "#fff",
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 20,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 40,
  },
  menuDrawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  menuAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f1f5f9",
  },
  menuUserName: { fontSize: 18, fontWeight: "900", color: "#0f172a" },
  menuUserSub: {
    fontSize: 12,
    color: "#ec4899",
    fontWeight: "800",
    marginTop: 2,
  },
  menuCloseBtn: { padding: 5, backgroundColor: "#f8fafc", borderRadius: 20 },
  menuScroll: { padding: 20 },
  menuSectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 1.5,
    marginBottom: 15,
    marginTop: 10,
  },
  menuItem: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  menuIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  menuItemText: { fontSize: 16, fontWeight: "700", color: "#334155" },
});
