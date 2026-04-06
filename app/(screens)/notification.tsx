// Location: app/notification.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  Layout,
  SlideOutRight,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../core/firebase/firebaseConfig";

const { width } = Dimensions.get("window");
const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

// ==========================================
// ✨ BREATHING SKELETON LOADER
// ==========================================
const BreathingSkeleton = () => {
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.4, { duration: 800 }),
      ),
      -1,
      true,
    );
  }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.skeletonCard, animStyle]}>
      <View style={styles.skeletonAvatar} />
      <View style={styles.skeletonTextContainer}>
        <View style={styles.skeletonTextLine1} />
        <View style={styles.skeletonTextLine2} />
      </View>
    </Animated.View>
  );
};

export default function NotificationScreen() {
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<
    "All" | "Unread" | "Doubts" | "System"
  >("All");

  // ==========================================
  // 📡 FETCH REAL-TIME NOTIFICATIONS (FIXED)
  // ==========================================
  useEffect(() => {
    if (!currentUid) {
      setLoading(false);
      return;
    }

    console.log("📡 Listening for notifications for user:", currentUid);

    // 🔥 FIX: Removed orderBy from query to avoid composite index error.
    // We sort it on the client side instead.
    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", currentUid),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let notifsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // 🔥 FIX: Client-side sorting (Newest first)
        notifsData.sort((a: any, b: any) => {
          const timeA = a.createdAt?.toMillis() || 0;
          const timeB = b.createdAt?.toMillis() || 0;
          return timeB - timeA;
        });

        console.log(`✅ Loaded ${notifsData.length} notifications.`);
        setNotifications(notifsData);
        setLoading(false);
      },
      (error) => {
        console.error("❌ Firebase Query Error:", error.message);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [currentUid]);

  // ==========================================
  // 🖱️ ACTIONS
  // ==========================================
  const handleNotificationPress = async (item: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!item.isRead) {
      try {
        await updateDoc(doc(db, "notifications", item.id), { isRead: true });
      } catch (error) {
        console.log(error);
      }
    }

    // Smart Navigation
    if (item.type === "doubt_solved") router.push("/doubts");
    else if (item.postId) router.push(`/post/${item.postId}`);
    else if (item.senderId && item.type !== "broadcast")
      router.push(`/user/${item.senderId}`);
  };

  const handleAvatarPress = (senderId: string, type: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (type !== "broadcast" && senderId) {
      router.push(`/user/${senderId}`);
    }
  };

  const deleteNotification = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await deleteDoc(doc(db, "notifications", id));
    } catch (error) {
      console.log(error);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifs = notifications.filter((n) => !n.isRead);
    if (unreadNotifs.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const batch = writeBatch(db);
      unreadNotifs.forEach((notif) => {
        const notifRef = doc(db, "notifications", notif.id);
        batch.update(notifRef, { isRead: true });
      });
      await batch.commit();
    } catch (error) {
      console.log(error);
    }
  };

  const timeAgo = (timestamp: any) => {
    if (!timestamp) return "Just now";
    const seconds = Math.floor((Date.now() - timestamp.toMillis()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const getNotificationMeta = (type: string) => {
    switch (type) {
      case "like":
        return {
          name: "heart",
          color: "#ef4444",
          bg: "#fef2f2",
          border: "#ef4444",
        };
      case "comment":
        return {
          name: "chatbubble",
          color: "#3b82f6",
          bg: "#eff6ff",
          border: "#3b82f6",
        };
      case "follow":
        return {
          name: "person-add",
          color: "#10b981",
          bg: "#ecfdf5",
          border: "#10b981",
        };
      case "mention":
        return {
          name: "at",
          color: "#8b5cf6",
          bg: "#f5f3ff",
          border: "#8b5cf6",
        };
      case "doubt_solved":
        return {
          name: "bulb",
          color: "#f59e0b",
          bg: "#fffbeb",
          border: "#f59e0b",
        };
      case "broadcast":
        return {
          name: "megaphone",
          color: "#4f46e5",
          bg: "#eef2ff",
          border: "#4f46e5",
        };
      default:
        return {
          name: "notifications",
          color: "#64748b",
          bg: "#f8fafc",
          border: "#cbd5e1",
        };
    }
  };

  // 🔥 NEW FILTER LOGIC
  const filteredNotifications = notifications.filter((notif) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Unread") return !notif.isRead;
    if (activeFilter === "Doubts") return notif.type === "doubt_solved";
    if (activeFilter === "System") return notif.type === "broadcast"; // New System filter
    return true;
  });

  // ==========================================
  // 🃏 RENDER CARD
  // ==========================================
  const renderNotification = ({
    item,
    index,
  }: {
    item: any;
    index: number;
  }) => {
    const meta = getNotificationMeta(item.type);

    return (
      <Animated.View
        entering={FadeInDown.delay(Math.min(index * 40, 400)).springify()}
        layout={Layout.springify()}
        exiting={SlideOutRight.duration(300)}
      >
        <View
          style={[
            styles.notificationCard,
            { borderLeftColor: meta.border },
            !item.isRead && styles.unreadCardBg,
          ]}
        >
          <View style={styles.cardLayout}>
            {/* Avatar Area */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleAvatarPress(item.senderId, item.type)}
              style={styles.avatarContainer}
            >
              <Image
                source={{ uri: item.senderAvatar || DEFAULT_AVATAR }}
                style={styles.avatar}
              />
              <View
                style={[styles.typeIconBadge, { backgroundColor: meta.color }]}
              >
                <Ionicons name={meta.name as any} size={12} color="#fff" />
              </View>
            </TouchableOpacity>

            {/* Text Area */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleNotificationPress(item)}
              style={styles.textContainer}
            >
              <View style={styles.textHeaderRow}>
                <Text style={styles.boldText} numberOfLines={1}>
                  {item.senderName}
                </Text>
                <Text style={styles.timeText}>{timeAgo(item.createdAt)}</Text>
              </View>

              {/* 🔥 FIX: Cleaned up Text rendering logic */}
              <Text style={styles.notificationText} numberOfLines={3}>
                {item.type === "like" && "Liked your recent post. Keep it up!"}
                {item.type === "comment" &&
                  `Commented: "${item.text || "Awesome post!"}"`}
                {item.type === "follow" && "Started following your journey."}
                {item.type === "mention" && "Mentioned you in a discussion."}
                {item.type === "doubt_solved" &&
                  `Solved your ${item.text || "doubt"}. Check it out!`}
                {item.type === "broadcast" && (
                  <Text style={{ fontWeight: "700", color: "#0f172a" }}>
                    📢 {item.title}:{" "}
                  </Text>
                )}
                {item.type === "broadcast" && item.text}
              </Text>

              {/* Inline Actions */}
              {item.type === "follow" && (
                <View style={styles.quickActionRow}>
                  <View style={styles.quickActionBtn}>
                    <Text style={styles.quickActionText}>View Profile</Text>
                  </View>
                </View>
              )}
              {item.type === "doubt_solved" && (
                <View style={styles.quickActionRow}>
                  <View
                    style={[
                      styles.quickActionBtn,
                      { backgroundColor: "#fefce8", borderColor: "#fef08a" },
                    ]}
                  >
                    <Ionicons
                      name="bulb"
                      size={12}
                      color="#ca8a04"
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[styles.quickActionText, { color: "#ca8a04" }]}
                    >
                      View Solution
                    </Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>

            {!item.isRead && (
              <View
                style={[styles.unreadDot, { backgroundColor: meta.color }]}
              />
            )}
          </View>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => deleteNotification(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* 🔝 HEADER */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Activity</Text>
        </View>
        <TouchableOpacity onPress={markAllAsRead} style={styles.markReadBtn}>
          <Ionicons name="checkmark-done-circle" size={24} color="#4f46e5" />
          <Text style={styles.markReadText}>Mark All</Text>
        </TouchableOpacity>
      </View>

      {/* 🗂️ SMART FILTERS */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 15, paddingVertical: 10 }}
        >
          {["All", "Unread", "System", "Doubts"].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterPill,
                activeFilter === filter && styles.activeFilterPill,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveFilter(filter as any);
              }}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter && styles.activeFilterText,
                ]}
              >
                {filter}
              </Text>
              {filter === "Unread" && notifications.some((n) => !n.isRead) && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>
                    {notifications.filter((n) => !n.isRead).length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 📜 LIST */}
      {loading ? (
        <View style={styles.listContent}>
          {[1, 2, 3, 4, 5].map((i) => (
            <BreathingSkeleton key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={renderNotification}
          ListEmptyComponent={
            <Animated.View entering={FadeInDown} style={styles.emptyState}>
              <View style={styles.emptyIconBg}>
                <Ionicons
                  name={
                    activeFilter === "All"
                      ? "notifications-off"
                      : "checkmark-done"
                  }
                  size={60}
                  color="#94a3b8"
                />
              </View>
              <Text style={styles.emptyText}>
                {activeFilter === "Unread"
                  ? "You're all caught up!"
                  : "No activity yet"}
              </Text>
              <Text style={styles.emptySubText}>
                {activeFilter === "Unread"
                  ? "You have read all your notifications."
                  : "When someone interacts with you, it will magically appear right here."}
              </Text>
            </Animated.View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 15,
    backgroundColor: "#fff",
  },
  backBtn: {
    padding: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  markReadBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eef2ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  markReadText: {
    color: "#4f46e5",
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 4,
  },

  filterContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  activeFilterPill: { backgroundColor: "#0f172a", borderColor: "#0f172a" },
  filterText: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  activeFilterText: { color: "#fff" },
  filterBadge: {
    backgroundColor: "#ef4444",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  filterBadgeText: { color: "#fff", fontSize: 10, fontWeight: "900" },

  listContent: { padding: 15, paddingBottom: 100 },

  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderLeftWidth: 5,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    overflow: "hidden",
  },
  unreadCardBg: { backgroundColor: "#f4f6ff" },

  cardLayout: { flex: 1, flexDirection: "row", padding: 15, paddingRight: 10 },

  avatarContainer: {
    position: "relative",
    marginRight: 15,
    alignSelf: "flex-start",
    padding: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e2e8f0",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  typeIconBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    elevation: 2,
  },

  textContainer: { flex: 1, justifyContent: "center" },
  textHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  boldText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
    flex: 1,
    marginRight: 10,
  },
  timeText: { fontSize: 11, color: "#94a3b8", fontWeight: "700" },

  notificationText: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
    fontWeight: "500",
  },

  quickActionRow: { flexDirection: "row", marginTop: 10 },
  quickActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  quickActionText: { fontSize: 11, fontWeight: "800", color: "#334155" },

  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    alignSelf: "center",
    marginLeft: 10,
  },

  deleteBtn: {
    paddingHorizontal: 15,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderLeftWidth: 1,
    borderColor: "#f1f5f9",
    backgroundColor: "#fef2f2",
  },

  skeletonCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  skeletonAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e2e8f0",
    marginRight: 15,
  },
  skeletonTextContainer: { flex: 1 },
  skeletonTextLine1: {
    width: "60%",
    height: 14,
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonTextLine2: {
    width: "90%",
    height: 12,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
  },

  emptyState: { alignItems: "center", marginTop: 80, paddingHorizontal: 40 },
  emptyIconBg: {
    backgroundColor: "#f1f5f9",
    padding: 25,
    borderRadius: 50,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "500",
  },
});
