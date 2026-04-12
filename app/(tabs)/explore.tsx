// Location: app/(tabs)/explore.tsx
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    query,
    where,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    Image as RNImage,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import Animated, {
    FadeInDown,
    FadeOutDown,
    LinearTransition,
    ZoomIn,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { auth, db } from "../../core/firebase/firebaseConfig";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
const FILTERS = ["All", "Direct", "Groups"];
const LIMITS = { MAX_SEARCH_LENGTH: 100 };

export default function MessagesListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [groups, setGroups] = useState<any[]>([]);
  const [directChats, setDirectChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const [showFabMenu, setShowFabMenu] = useState(false);
  const fabRotation = useSharedValue(0);

  // ==========================================
  // 📡 FIREBASE SYNC (SMART FETCHING)
  // ==========================================
  useEffect(() => {
    if (!auth.currentUser) return;
    const myUid = auth.currentUser.uid;

    // 1. FETCH ALL EXISTING CHATS (Groups + Direct Messages)
    const qGroups = query(
      collection(db, "groups"),
      where("members", "array-contains", myUid),
    );

    const unsubGroups = onSnapshot(qGroups, async (snapshot) => {
      const fetchedData = await Promise.all(
        snapshot.docs.map(async (d) => {
          const data = d.data();
          let chatData = { id: d.id, ...data, isGroup: data.isGroup !== false };

          // 🔥 FETCH FRIEND INFO IF IT'S A DIRECT CHAT
          if (!chatData.isGroup && chatData.members) {
            const friendUid = chatData.members.find((m: string) => m !== myUid);
            if (friendUid) {
              const friendDoc = await getDoc(doc(db, "users", friendUid));
              if (friendDoc.exists()) {
                const fData = friendDoc.data();
                chatData.name = fData.displayName || fData.name || "Friend";
                chatData.avatar =
                  fData.photoURL ||
                  fData.avatar ||
                  fData.image ||
                  DEFAULT_AVATAR;
              }
            }
          }
          return chatData;
        }),
      );

      // Split into groups and direct for easier managing
      const justGroups = fetchedData.filter((c) => c.isGroup);
      const justDMs = fetchedData.filter((c) => !c.isGroup);

      setGroups(justGroups);

      // Update DMs (we will merge this with explicit friends list below)
      setDirectChats((prev) => {
        const merged = [...prev];
        justDMs.forEach((dm) => {
          if (!merged.find((m) => m.id === dm.id)) merged.push(dm);
          else {
            const idx = merged.findIndex((m) => m.id === dm.id);
            merged[idx] = { ...merged[idx], ...dm };
          }
        });
        return merged;
      });

      setLoading(false);
    });

    // 2. FETCH EXPLICIT FRIENDS (Even if no chat exists yet)
    const unsubUser = onSnapshot(doc(db, "users", myUid), async (userSnap) => {
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const connections =
          userData.connections || userData.friends || userData.following || [];

        if (connections.length > 0) {
          const friendsData = await Promise.all(
            connections.map(async (friendId: string) => {
              const directChatId =
                myUid < friendId
                  ? `${myUid}_${friendId}`
                  : `${friendId}_${myUid}`;
              const friendDoc = await getDoc(doc(db, "users", friendId));

              if (friendDoc.exists()) {
                const fData = friendDoc.data();
                return {
                  id: directChatId,
                  userId: friendId,
                  name: fData.displayName || fData.name || "Friend",
                  avatar:
                    fData.photoURL ||
                    fData.avatar ||
                    fData.image ||
                    DEFAULT_AVATAR,
                  isGroup: false,
                };
              }
              return null;
            }),
          );

          const validFriends = friendsData.filter(Boolean);

          // Merge explicit friends into directChats without duplicating
          setDirectChats((prev) => {
            const merged = [...prev];
            validFriends.forEach((vf) => {
              if (!merged.find((m) => m.id === vf.id)) merged.push(vf);
            });
            return merged;
          });
        }
      }
    });

    return () => {
      unsubGroups();
      unsubUser();
    };
  }, []);

  // ==========================================
  // 🧠 COMBINE & SORT (Latest Message First)
  // ==========================================
  const getTimestampValue = (ts: any) => {
    if (!ts) return 0;
    if (ts?.toMillis && typeof ts.toMillis === "function") {
      return ts.toMillis();
    }
    if (typeof ts === "number") return ts;
    const parsed = new Date(ts).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const filteredChats = useMemo(() => {
    let combinedChats = [...groups, ...directChats];
    const uid = auth.currentUser?.uid || "";

    // Remove duplicates
    const uniqueChats = [];
    const map = new Map();
    for (const item of combinedChats) {
      if (!map.has(item.id)) {
        map.set(item.id, true);
        uniqueChats.push(item);
      }
    }
    combinedChats = uniqueChats;

    // Filters
    if (searchQuery.trim()) {
      combinedChats = combinedChats.filter((c) =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    if (activeFilter === "Groups")
      combinedChats = combinedChats.filter((c) => c.isGroup === true);
    if (activeFilter === "Direct")
      combinedChats = combinedChats.filter((c) => c.isGroup === false);

    // Sort: Latest Message Time
    return combinedChats.sort((a, b) => {
      const aPinned = a.pinnedBy?.includes(uid) ? 1 : 0;
      const bPinned = b.pinnedBy?.includes(uid) ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;

      const timeA = getTimestampValue(a.lastMessageTime || a.updatedAt);
      const timeB = getTimestampValue(b.lastMessageTime || b.updatedAt);
      return timeB - timeA;
    });
  }, [groups, directChats, searchQuery, activeFilter]);

  // ==========================================
  // 🕹️ ACTIONS
  // ==========================================
  const toggleFabMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fabRotation.value = withSpring(showFabMenu ? 0 : 45);
    setShowFabMenu(!showFabMenu);
  };
  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${fabRotation.value}deg` }],
  }));

  // ==========================================
  // 🎨 COMPONENT: CHAT ROW (WhatsApp Style)
  // ==========================================
  const renderChatRow = ({ item }: { item: any }) => {
    const uid = auth.currentUser?.uid || "";

    // 🔥 THE ULTIMATE UNREAD BUBBLE FIX (Support multiple field names)
    let unreadCount = 0;
    const unreadCountsField =
      item.unreadCount || item.unread || item.unreadCounts || {};
    if (typeof unreadCountsField === "object") {
      unreadCount = Number(unreadCountsField[uid]) || 0;
    } else if (typeof unreadCountsField === "number") {
      unreadCount = unreadCountsField;
    } else if (typeof unreadCountsField === "string") {
      unreadCount = Number(unreadCountsField) || 0;
    }

    const isPinned = item.pinnedBy?.includes(uid);
    const isMuted = item.mutedBy?.includes(uid);
    const isTyping =
      item.typing?.filter((tUid: string) => tUid !== uid).length > 0;

    const timestamp = item.lastMessageTime || item.updatedAt;

    const formatTime = (ts: any) => {
      const millis = getTimestampValue(ts);
      if (!millis) return "";
      const date = new Date(millis);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
      }
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    };

    const getPreview = () => {
      if (isTyping)
        return (
          <Text style={styles.typingText}>
            {item.isGroup ? "Someone is typing..." : "Typing..."}
          </Text>
        );

      const msgObj = item.lastMessage || item.recentMessage;
      if (!msgObj)
        return <Text style={styles.msgPreview}>Tap to start chatting</Text>;

      const sender =
        item.isGroup && msgObj.senderName
          ? `${msgObj.senderName.split(" ")[0]}: `
          : "";

      switch (msgObj.type) {
        case "homework_bucket":
          return (
            <Text style={styles.richPreview} numberOfLines={1}>
              📘 {sender}Homework uploaded
            </Text>
          );
        case "mcq":
          return (
            <Text style={styles.richPreview} numberOfLines={1}>
              📊 {sender}Poll live now
            </Text>
          );
        case "test":
          return (
            <Text style={styles.richPreview} numberOfLines={1}>
              📝 {sender}Test created
            </Text>
          );
        case "resource":
          return (
            <Text style={styles.richPreview} numberOfLines={1}>
              📎 {sender}Shared a file
            </Text>
          );
        default:
          return (
            <Text
              style={[
                styles.msgPreview,
                unreadCount > 0 && { color: "#1e293b", fontWeight: "700" },
              ]}
              numberOfLines={1}
            >
              {sender}
              {msgObj.text}
            </Text>
          );
      }
    };

    const chatAvatar =
      item.groupImage ||
      item.image ||
      item.photoURL ||
      item.avatar ||
      item.icon ||
      DEFAULT_AVATAR;

    return (
      <Animated.View
        layout={LinearTransition.springify()}
        entering={FadeInDown.duration(300)}
      >
        <Swipeable
          friction={1.5}
          overshootRight={false}
          overshootLeft={false}
          renderRightActions={() => (
            <View style={styles.swipeRightBox}>
              <TouchableOpacity
                style={[styles.swipeBtn, { backgroundColor: "#64748b" }]}
              >
                <Ionicons name="notifications-off" size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.swipeBtn, { backgroundColor: "#ef4444" }]}
              >
                <Ionicons name="archive" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          renderLeftActions={() => (
            <View style={styles.swipeLeftBox}>
              <TouchableOpacity
                style={[styles.swipeBtn, { backgroundColor: "#2563EB" }]}
              >
                <Ionicons name="pin" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        >
          <TouchableOpacity
            style={[styles.chatRow, unreadCount > 0 && styles.chatRowUnread]}
            activeOpacity={0.7}
            onPress={() => router.push(`/chat/${item.id}`)}
          >
            <View style={styles.avatarWrapper}>
              <RNImage source={{ uri: chatAvatar }} style={styles.avatar} />
              {item.isGroup && (
                <View style={styles.groupBadge}>
                  <Ionicons name="people" size={10} color="#fff" />
                </View>
              )}
            </View>

            <View style={styles.chatInfo}>
              <View style={styles.chatHeaderRow}>
                <Text style={styles.chatName} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.chatTimeBox}>
                  {isMuted && (
                    <Ionicons
                      name="volume-mute"
                      size={14}
                      color="#cbd5e1"
                      style={{ marginRight: 4 }}
                    />
                  )}
                  <Text
                    style={[
                      styles.timeText,
                      unreadCount > 0 && {
                        color: "#2563EB",
                        fontWeight: "800",
                      },
                    ]}
                  >
                    {formatTime(timestamp)}
                  </Text>
                </View>
              </View>

              <View style={styles.chatFooterRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  {getPreview()}
                </View>

                {/* 🔴 WHATSAPP BUBBLE GUARANTEED TO SHOW HERE */}
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {isPinned && (
                    <Ionicons
                      name="pin"
                      size={16}
                      color="#cbd5e1"
                      style={{ marginRight: 5 }}
                    />
                  )}
                  {unreadCount > 0 && (
                    <Animated.View entering={ZoomIn} style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Text>
                    </Animated.View>
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Swipeable>
      </Animated.View>
    );
  };

  // ==========================================
  // 🎨 RENDERERS: HEADER
  // ==========================================
  const renderHeader = () => (
    <View
      style={[
        styles.headerContainer,
        { paddingTop: Platform.OS === "ios" ? insets.top + 30 : 20 },
      ]}
    >
      {Platform.OS === "ios" ? (
        <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(255,255,255,0.96)" },
          ]}
        />
      )}

      <View style={styles.headerTop}>
        <View>
          <Text style={styles.headerTitle}>Messages</Text>
          <Text style={styles.headerSub}>Your study chats</Text>
        </View>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/find-groups");
          }}
        >
          <Ionicons name="search" size={22} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrapper}>
        <Ionicons
          name="search"
          size={18}
          color="#94a3b8"
          style={{ marginLeft: 14 }}
        />
        <TextInput
          style={[
            styles.searchInput,
            Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {},
          ]}
          placeholder="Search chats, friends..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          maxLength={LIMITS.MAX_SEARCH_LENGTH}
        />
      </View>

      <View style={styles.filterScroll}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              activeFilter === filter && styles.filterTabActive,
            ]}
            onPress={() => {
              setActiveFilter(filter);
              Haptics.selectionAsync();
            }}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === filter && styles.filterTabTextActive,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <StatusBar barStyle="dark-content" translucent />

      {renderHeader()}

      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={styles.loaderCenter}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : (
          <Animated.FlatList
            itemLayoutAnimation={LinearTransition.springify()}
            data={filteredChats}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingTop: Platform.OS === "ios" ? 200 : 190,
              paddingBottom: 150,
            }}
            showsVerticalScrollIndicator={false}
            renderItem={renderChatRow}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={60}
                  color="#cbd5e1"
                />
                <Text style={styles.emptyTitle}>No messages yet</Text>
                <Text style={styles.emptySub}>
                  Connect with study groups or friends to start learning
                  together.
                </Text>
              </View>
            )}
          />
        )}
      </View>

      {/* 🟢 FAB BUTTON */}
      <View
        style={[
          styles.fabContainer,
          { bottom: Platform.OS === "ios" ? insets.bottom + 90 : 100 },
        ]}
      >
        {showFabMenu && (
          <Animated.View
            entering={FadeInDown.springify()}
            exiting={FadeOutDown}
            style={styles.fabMenu}
          >
            <TouchableOpacity
              style={styles.fabMenuItem}
              onPress={() => {
                setShowFabMenu(false);
                router.push("/create-group");
              }}
            >
              <Text style={styles.fabMenuText}>Create Group</Text>
              <View style={styles.fabMenuIconBox}>
                <Ionicons name="people" size={18} color="#2563EB" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.fabMenuItem}
              onPress={() => {
                setShowFabMenu(false);
                router.push("/find-groups");
              }}
            >
              <Text style={styles.fabMenuText}>Discover Groups</Text>
              <View style={styles.fabMenuIconBox}>
                <Ionicons name="compass" size={18} color="#10b981" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.fabMenuItem}
              onPress={() => {
                setShowFabMenu(false);
                router.push("/join-group");
              }}
            >
              <Text style={styles.fabMenuText}>Join via Code</Text>
              <View style={styles.fabMenuIconBox}>
                <Ionicons name="enter" size={18} color="#8b5cf6" />
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}
        <TouchableOpacity
          style={styles.fabBtn}
          onPress={toggleFabMenu}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#4F46E5", "#2563EB"]}
            style={styles.fabGradient}
          >
            <Animated.View style={fabAnimatedStyle}>
              <Ionicons name="add" size={32} color="#fff" />
            </Animated.View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },

  headerContainer: {
    position: "absolute",
    top: 0,
    width: "100%",
    zIndex: 50,
    borderBottomWidth: 1,
    borderColor: "rgba(226,232,240,0.6)",
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
    marginTop: 2,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
  },

  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    marginHorizontal: 20,
    borderRadius: 24,
    height: 48,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "500",
    height: "100%",
  },

  filterScroll: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 15,
    gap: 10,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filterTabActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  filterTabText: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  filterTabTextActive: { color: "#fff", fontWeight: "800" },

  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: "#ffffff",
  },
  chatRowUnread: { backgroundColor: "#f8fafc" },

  avatarWrapper: { position: "relative", marginRight: 15 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e2e8f0",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  groupBadge: {
    position: "absolute",
    bottom: 0,
    right: -4,
    backgroundColor: "#2563EB",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  chatInfo: { flex: 1, justifyContent: "center" },
  chatHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  chatName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
    flex: 1,
    paddingRight: 10,
    letterSpacing: -0.3,
  },
  chatTimeBox: { flexDirection: "row", alignItems: "center" },
  timeText: { fontSize: 12, color: "#94a3b8", fontWeight: "600" },

  chatFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  msgPreview: {
    fontSize: 15,
    color: "#64748b",
    fontWeight: "500",
    lineHeight: 20,
  },
  richPreview: { fontSize: 15, color: "#2563EB", fontWeight: "700" },
  typingText: {
    fontSize: 15,
    color: "#10b981",
    fontWeight: "800",
    fontStyle: "italic",
  },

  // 🔥 WHATSAPP BUBBLE STYLES
  unreadBadge: {
    backgroundColor: "#2563EB",
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
    elevation: 2,
  },
  unreadText: { color: "#ffffff", fontSize: 12, fontWeight: "900" },

  swipeRightBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 20,
  },
  swipeLeftBox: { flexDirection: "row", alignItems: "center", paddingLeft: 20 },
  swipeBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },

  fabContainer: {
    position: "absolute",
    right: 20,
    alignItems: "flex-end",
    zIndex: 100,
  },
  fabMenu: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 10,
    marginBottom: 15,
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
    elevation: 10,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  fabMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  fabMenuText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginRight: 15,
  },
  fabMenuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },

  fabBtn: {
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
    elevation: 8,
    borderRadius: 32,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },

  floatingDockWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 110,
  },
  floatingDock: {
    width: "85%",
    height: 70,
    borderRadius: 35,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.8)",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
    elevation: 10,
  },
  dockInner: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  dockItem: {
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    width: 50,
  },
  dockActiveDot: {
    position: "absolute",
    bottom: 10,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2563EB",
  },

  loaderCenter: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyState: { alignItems: "center", marginTop: 100, paddingHorizontal: 40 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
    marginTop: 15,
    marginBottom: 5,
  },
  emptySub: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 22,
  },
});
