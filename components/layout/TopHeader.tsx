// Location: components/layout/TopHeader.tsx
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useNavigation, useRouter } from "expo-router";
import React from "react";
import {
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated from "react-native-reanimated";

export default function TopHeader({
  setIsMenuOpen,
  unreadCount,
  searchQuery,
  setSearchQuery,
}: {
  setIsMenuOpen: any;
  unreadCount?: number;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
}) {
  const router = useRouter();
  const navigation = useNavigation();

  return (
    <View style={styles.mainHeader}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {/* Hamburger Menu */}
        <TouchableOpacity
          onPress={() => setIsMenuOpen(true)}
          style={styles.hamburgerBtn}
        >
          <Ionicons name="menu" size={28} color="#0f172a" />
        </TouchableOpacity>

        {/* Direct Local Logo */}
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.directLogo}
          contentFit="contain"
          transition={200}
        />

        <Text style={styles.brandName}>Eduxity</Text>
      </View>

      {/* Header Icons (Right Side) */}
      <View style={styles.headerIcons}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.push("/search-users")}
        >
          <Ionicons name="search" size={24} color="#0f172a" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.push("/chat")}
        >
          <Ionicons name="chatbubbles-outline" size={24} color="#0f172a" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.push("/notification")}
        >
          <Ionicons name="notifications-outline" size={24} color="#0f172a" />
          {(unreadCount ?? 0) > 0 && (
            <Animated.View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>
                {(unreadCount ?? 0) > 9 ? "9+" : unreadCount}
              </Text>
            </Animated.View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ==========================================
// 🎨 UPDATED STYLES
// ==========================================
const styles = StyleSheet.create({
  mainHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingTop: Platform.OS === "ios" ? 8 : 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  directLogo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  brandName: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  headerIcons: {
    flexDirection: "row",
    gap: 15,
  },
  iconBtn: {
    padding: 4,
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#ef4444",
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "bold",
  },
  hamburgerBtn: {
    marginRight: 15,
    padding: 4,
  },
});
