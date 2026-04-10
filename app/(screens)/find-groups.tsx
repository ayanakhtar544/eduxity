// Location: app/find-group.tsx (or explore.tsx)
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    FadeInDown,
    FadeInUp,
    LinearTransition,
} from "react-native-reanimated";
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
    updateDoc,
} from "firebase/firestore";
import { auth, db } from "../../core/firebase/firebaseConfig";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

export default function FindGroupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const myUid = auth.currentUser?.uid;

  const [searchQuery, setSearchQuery] = useState("");
  const [allGroups, setAllGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"For You" | "Trending" | "New">(
    "For You",
  );
  const [processingId, setProcessingId] = useState<string | null>(null);

  // ==========================================
  // 📡 FETCH & FILTER GROUPS
  // ==========================================
  useEffect(() => {
    fetchDiscoverableGroups();
  }, []);

  const fetchDiscoverableGroups = async () => {
    if (!myUid) return;
    try {
      const snapshot = await getDocs(collection(db, "groups"));
      const groupsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filter out groups where I am already a member
      const discoverable = groupsData.filter((g: any) => {
        const members = g.members || [];
        return !members.includes(myUid);
      });

      setAllGroups(discoverable);
    } catch (error) {
      console.log("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 🧠 THE RECOMMENDATION ALGORITHM
  // ==========================================
  const displayedGroups = useMemo(() => {
    let filtered = [...allGroups];

    // 1. Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (g) =>
          g.name?.toLowerCase().includes(q) ||
          g.desc?.toLowerCase().includes(q),
      );
    }

    // 2. Algorithmic Sorting based on Tabs
    if (activeTab === "Trending") {
      // Trending: Sort purely by member count (Highest first)
      filtered.sort(
        (a, b) => (b.members?.length || 0) - (a.members?.length || 0),
      );
    } else if (activeTab === "New") {
      // New: Sort by creation date (Newest first)
      filtered.sort(
        (a, b) =>
          (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0),
      );
    } else {
      // 🔥 'For You' Algorithm (Telegram Style Mix)
      // Combines moderate size with activity. (Formula: Members * 2 + Notes * 5)
      filtered.sort((a, b) => {
        const scoreA = (a.members?.length || 0) * 2 + (a.totalNotes || 0) * 5;
        const scoreB = (b.members?.length || 0) * 2 + (b.totalNotes || 0) * 5;
        return scoreB - scoreA;
      });
    }

    return filtered;
  }, [allGroups, searchQuery, activeTab]);

  // ==========================================
  // ⚡ STRICT JOIN / REQUEST LOGIC
  // ==========================================
  const handleAction = async (group: any) => {
    if (!myUid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProcessingId(group.id);

    const groupRef = doc(db, "groups", group.id);

    try {
      if (group.isPrivate) {
        // 🔒 PRIVATE: Send Request to Pending
        await updateDoc(groupRef, {
          pendingRequests: arrayUnion(myUid),
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "Request Sent 🔒",
          "The admin will review your request to join this private hub.",
        );

        // Update Local UI instantly
        setAllGroups((prev) =>
          prev.map((g) =>
            g.id === group.id
              ? { ...g, pendingRequests: [...(g.pendingRequests || []), myUid] }
              : g,
          ),
        );
      } else {
        // 🌍 PUBLIC: Direct Join
        await updateDoc(groupRef, {
          members: arrayUnion(myUid),
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Remove from list and navigate to chat
        setAllGroups((prev) => prev.filter((g) => g.id !== group.id));
        router.push(`/chat/${group.id}`);
      }
    } catch (error) {
      console.log("Action error:", error);
      Alert.alert("Error", "Could not process your request.");
    } finally {
      setProcessingId(null);
    }
  };

  // ==========================================
  // 🎨 RENDER GROUP CARD
  // ==========================================
  const renderGroupCard = ({ item, index }: { item: any; index: number }) => {
    const isPrivate = item.isPrivate === true;
    const hasRequested = item.pendingRequests?.includes(myUid);
    const memberCount = item.members?.length || 1;

    return (
      <Animated.View
        entering={FadeInUp.delay(index * 100).springify()}
        layout={LinearTransition.springify()}
        style={styles.card}
      >
        <TouchableOpacity
          style={styles.cardInfo}
          activeOpacity={0.7}
          onPress={() => router.push(`/chat/info/${item.id}`)} // Let them view info before joining
        >
          <Image
            source={{ uri: item.avatar || DEFAULT_AVATAR }}
            style={styles.avatar}
          />

          <View style={styles.textData}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <Text style={styles.groupName} numberOfLines={1}>
                {item.name}
              </Text>
              {isPrivate && (
                <Ionicons
                  name="lock-closed"
                  size={12}
                  color="#94a3b8"
                  style={{ marginLeft: 6 }}
                />
              )}
            </View>

            <Text style={styles.groupDesc} numberOfLines={2}>
              {item.desc || "A study hub on Eduxity for focused scholars."}
            </Text>

            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Ionicons name="people" size={12} color="#4F46E5" />
                <Text style={styles.badgeText}>{memberCount} Scholars</Text>
              </View>
              {isPrivate ? (
                <View style={[styles.badge, { backgroundColor: "#fef2f2" }]}>
                  <Text style={[styles.badgeText, { color: "#ef4444" }]}>
                    Private
                  </Text>
                </View>
              ) : (
                <View style={[styles.badge, { backgroundColor: "#ecfdf5" }]}>
                  <Text style={[styles.badgeText, { color: "#10b981" }]}>
                    Public
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* 🔥 DYNAMIC ACTION BUTTON */}
        <TouchableOpacity
          style={[
            styles.actionBtn,
            isPrivate ? styles.btnPrivate : styles.btnPublic,
            hasRequested && styles.btnRequested,
          ]}
          onPress={() => handleAction(item)}
          disabled={hasRequested || processingId === item.id}
        >
          {processingId === item.id ? (
            <ActivityIndicator
              color={hasRequested || isPrivate ? "#0f172a" : "#fff"}
              size="small"
            />
          ) : hasRequested ? (
            <>
              <Ionicons name="time" size={16} color="#64748b" />
              <Text style={styles.btnRequestedText}>Requested</Text>
            </>
          ) : isPrivate ? (
            <>
              <Ionicons name="hand-right" size={16} color="#0f172a" />
              <Text style={styles.btnPrivateText}>Request</Text>
            </>
          ) : (
            <>
              <Ionicons name="flash" size={16} color="#fff" />
              <Text style={styles.btnPublicText}>Join Hub</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // ==========================================
  // 📱 MAIN LAYOUT
  // ==========================================
  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <StatusBar barStyle="dark-content" />

      {/* 🍏 GLASS HEADER */}
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === "ios" ? insets.top + 10 : 20 },
        ]}
      >
        {Platform.OS === "ios" ? (
          <BlurView
            intensity={90}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "rgba(255,255,255,0.96)" },
            ]}
          />
        )}

        <View style={styles.headerTop}>
          <Text style={styles.title}>Discover</Text>
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={() => router.push("/join-group")}
          >
            <Ionicons name="qr-code" size={20} color="#0f172a" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchWrapper}>
          <Ionicons
            name="search"
            size={20}
            color="#94a3b8"
            style={{ marginLeft: 15 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search study groups, topics..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={{ padding: 10 }}
            >
              <Ionicons name="close-circle" size={20} color="#cbd5e1" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tabsWrapper}>
          {["For You", "Trending", "New"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => {
                setActiveTab(tab as any);
                Haptics.selectionAsync();
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 📜 CONTENT LIST */}
      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : (
          <FlatList
            data={displayedGroups}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            renderItem={renderGroupCard}
            ListEmptyComponent={() => (
              <Animated.View entering={FadeInDown} style={styles.emptyState}>
                <Image
                  source={{
                    uri: "https://cdn3d.iconscout.com/3d/premium/thumb/empty-box-4994248-4161726.png",
                  }}
                  style={{ width: 150, height: 150 }}
                />
                <Text style={styles.emptyTitle}>No Hubs Found</Text>
                <Text style={styles.emptyDesc}>
                  Try searching for a different topic or create your own study
                  hub!
                </Text>
                <TouchableOpacity
                  style={styles.createBtn}
                  onPress={() => router.push("/create-group")}
                >
                  <Text style={{ color: "#fff", fontWeight: "800" }}>
                    Create New Hub
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 PREMIUM STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    position: "absolute",
    top: 0,
    width: "100%",
    zIndex: 10,
    borderBottomWidth: 1,
    borderColor: "rgba(226,232,240,0.8)",
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -1,
  },
  scanBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    marginHorizontal: 20,
    borderRadius: 16,
    height: 50,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#0f172a",
    fontWeight: "500",
    height: "100%",
  },

  tabsWrapper: { flexDirection: "row", paddingHorizontal: 20, gap: 10 },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  tabActive: { backgroundColor: "#0f172a" },
  tabText: { fontSize: 14, fontWeight: "700", color: "#64748b" },
  tabTextActive: { color: "#fff" },

  listContainer: { paddingTop: 210, paddingBottom: 120, paddingHorizontal: 15 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  cardInfo: { flexDirection: "row", alignItems: "flex-start" },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  textData: { flex: 1, marginLeft: 15 },
  groupName: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
    flexShrink: 1,
  },
  groupDesc: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
    marginTop: 2,
    lineHeight: 18,
  },

  badgeRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eef2ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4F46E5",
    marginLeft: 4,
  },

  actionBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 15,
  },
  btnPublic: {
    backgroundColor: "#2563EB",
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
    elevation: 4,
  },
  btnPublicText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
    marginLeft: 6,
  },

  btnPrivate: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  btnPrivateText: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 6,
  },

  btnRequested: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  btnRequestedText: {
    color: "#64748b",
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 6,
  },

  emptyState: { alignItems: "center", marginTop: 60, paddingHorizontal: 20 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
    marginTop: 20,
    marginBottom: 8,
  },
  emptyDesc: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 25,
  },
  createBtn: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 16,
  },
});
