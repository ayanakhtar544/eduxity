import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    addDoc,
    collection,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../core/firebase/firebaseConfig"; // Path check kar lena

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
const SEARCH_TABS = ["All", "Users", "Posts", "Resources"];

// 🕒 TIME FORMATTER FOR POSTS
const timeAgo = (timestamp: any) => {
  if (!timestamp) return "Just now";
  const seconds = Math.floor((Date.now() - timestamp.toMillis()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export default function GlobalSearchScreen() {
  const router = useRouter();
  const currentUser = auth.currentUser;

  // 🧠 CORE STATES
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  // 📦 DATA STATES
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allPosts, setAllPosts] = useState<any[]>([]); // Includes Resources & Posts
  const [loading, setLoading] = useState(true);

  // 🤝 CONNECTION STATE
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  // ==========================================
  // 📡 FETCH EVERYTHING ON MOUNT
  // ==========================================
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      // 1. Fetch Users
      const usersSnap = await getDocs(
        query(collection(db, "users"), limit(100)),
      );
      let usersList: any[] = [];
      usersSnap.forEach((doc) => {
        if (doc.id !== currentUser?.uid)
          usersList.push({ id: doc.id, dataType: "user", ...doc.data() });
      });

      // 2. Fetch Posts & Resources
      const postsSnap = await getDocs(
        query(
          collection(db, "posts"),
          orderBy("createdAt", "desc"),
          limit(100),
        ),
      );
      let postsList: any[] = [];
      postsSnap.forEach((doc) => {
        postsList.push({ id: doc.id, dataType: "post", ...doc.data() });
      });

      setAllUsers(usersList);
      setAllPosts(postsList);
      setLoading(false);
    } catch (error) {
      console.log("Error fetching search data:", error);
      setLoading(false);
    }
  };

  // ==========================================
  // 🔍 THE OMNI-SEARCH ENGINE (Memoized for Speed)
  // ==========================================
  const filteredData = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase().trim();

    // 1. Filter Users
    const matchedUsers = allUsers.filter(
      (user) =>
        user.displayName?.toLowerCase().includes(lowerQuery) ||
        user.role?.toLowerCase().includes(lowerQuery) ||
        user.city?.toLowerCase().includes(lowerQuery),
    );

    // 2. Filter Posts & Resources
    const matchedPosts = allPosts.filter(
      (post) =>
        post.text?.toLowerCase().includes(lowerQuery) ||
        post.title?.toLowerCase().includes(lowerQuery) ||
        post.authorName?.toLowerCase().includes(lowerQuery) ||
        post.category?.toLowerCase().includes(lowerQuery),
    );

    // 3. Tab Routing Logic
    if (activeTab === "Users") return matchedUsers;
    if (activeTab === "Posts")
      return matchedPosts.filter((p) => p.type !== "resource");
    if (activeTab === "Resources")
      return matchedPosts.filter((p) => p.type === "resource");

    // Default 'All' Tab: Mix them up beautifully (Users first, then posts)
    return [...matchedUsers.slice(0, 5), ...matchedPosts];
  }, [searchQuery, activeTab, allUsers, allPosts]);

  // ==========================================
  // 🤝 ACTIONS
  // ==========================================
  const sendRequest = async (targetUser: any) => {
    if (!currentUser) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSentRequests((prev) => new Set(prev).add(targetUser.id));

    try {
      await addDoc(collection(db, "notifications"), {
        recipientId: targetUser.id,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || "Eduxity Scholar",
        senderAvatar: currentUser.photoURL || DEFAULT_AVATAR,
        type: "friend_request",
        status: "pending",
        isRead: false,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      Alert.alert("Error", "Could not send request.");
      setSentRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(targetUser.id);
        return newSet;
      });
    }
  };

  // ==========================================
  // 🃏 RENDERERS
  // ==========================================
  const renderUserCard = (item: any) => {
    const isRequested = sentRequests.has(item.id);
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push(`/user/${item.id}`)}
        style={styles.userCard}
      >
        <Image
          source={{ uri: item.photoURL || DEFAULT_AVATAR }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {item.displayName || "Unknown User"}
          </Text>
          <Text style={styles.userRole} numberOfLines={1}>
            {item.role || "Scholar"}
          </Text>
          {item.city && (
            <Text style={styles.userCity}>
              <Ionicons name="location" size={10} /> {item.city}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.connectBtn, isRequested && styles.requestedBtn]}
          onPress={() => sendRequest(item)}
          disabled={isRequested}
        >
          <Ionicons
            name={isRequested ? "checkmark" : "person-add"}
            size={14}
            color={isRequested ? "#64748b" : "#fff"}
          />
          <Text
            style={[
              styles.connectBtnText,
              isRequested && styles.requestedBtnText,
            ]}
          >
            {isRequested ? "Sent" : "Connect"}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderPostCard = (item: any) => {
    const isResource = item.type === "resource";
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push(`/post/${item.id}`)}
        style={styles.postCard}
      >
        <View style={styles.postHeader}>
          <Image
            source={{ uri: item.authorAvatar || DEFAULT_AVATAR }}
            style={styles.miniAvatar}
          />
          <Text style={styles.postAuthor}>{item.authorName}</Text>
          <Text style={styles.postTime}>• {timeAgo(item.createdAt)}</Text>
        </View>

        {isResource ? (
          <View style={styles.resourceBox}>
            <View style={styles.resourceIconBg}>
              <Ionicons name="document-text" size={20} color="#4f46e5" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.resourceTitle} numberOfLines={2}>
                {item.title || "Study Material"}
              </Text>
              <Text style={styles.resourceBadge}>Resource</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.postText} numberOfLines={3}>
            {item.text || item.title || "View Post..."}
          </Text>
        )}

        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.postThumb} />
        )}

        <View style={styles.postFooter}>
          <View style={styles.stat}>
            <Ionicons name="heart-outline" size={14} color="#64748b" />
            <Text style={styles.statText}>{item.likes?.length || 0}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="chatbubble-outline" size={14} color="#64748b" />
            <Text style={styles.statText}>{item.commentsCount || 0}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* 🔝 HEADER & SEARCH BAR */}
      <View style={styles.header}>
        <View style={styles.topRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#64748b"
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { outlineStyle: "none" } as any]}
              placeholder="Search users, notes, posts..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={styles.clearBtn}
              >
                <Ionicons name="close-circle" size={18} color="#cbd5e1" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 🗂️ ADVANCED TABS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
        >
          {SEARCH_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab(tab);
              }}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
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
        </ScrollView>
      </View>

      {/* 📋 RESULTS LIST */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>
          {searchQuery.trim() === ""
            ? `Suggested ${activeTab}`
            : `Search Results in ${activeTab}`}
        </Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#4f46e5"
            style={{ marginTop: 50 }}
          />
        ) : (
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 50 }}
            renderItem={({ item, index }) => (
              <Animated.View
                entering={FadeInDown.delay(index * 40).springify()}
                layout={Layout.springify()}
              >
                {item.dataType === "user"
                  ? renderUserCard(item)
                  : renderPostCard(item)}
              </Animated.View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIconBg}>
                  <Ionicons name="search-outline" size={50} color="#94a3b8" />
                </View>
                <Text style={styles.emptyText}>No results found</Text>
                <Text style={styles.emptySubText}>
                  We couldn't find any {activeTab.toLowerCase()} matching "
                  {searchQuery}".
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 ULTRA PREMIUM STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },

  header: {
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 2,
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 5,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  backBtn: {
    padding: 5,
    marginRight: 10,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
  },

  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: "#0f172a", fontWeight: "500" },
  clearBtn: { padding: 4 },

  tabScroll: { paddingHorizontal: 15, paddingBottom: 12, marginTop: 5 },
  tabBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  tabBtnActive: { backgroundColor: "#0f172a", borderColor: "#0f172a" },
  tabText: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  tabTextActive: { color: "#fff" },

  content: { flex: 1, paddingHorizontal: 15, paddingTop: 15 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#94a3b8",
    marginBottom: 15,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // 👥 USER CARD
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.03,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f1f5f9",
    marginRight: 15,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  userInfo: { flex: 1, marginRight: 10 },
  userName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: "#4f46e5",
    fontWeight: "700",
    marginBottom: 3,
  },
  userCity: { fontSize: 11, color: "#64748b", fontWeight: "600" },
  connectBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4f46e5",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#4f46e5",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  connectBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 4,
  },
  requestedBtn: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    elevation: 0,
  },
  requestedBtnText: { color: "#64748b" },

  // 📝 POST / RESOURCE CARD
  postCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.03,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  postHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  miniAvatar: { width: 24, height: 24, borderRadius: 12, marginRight: 8 },
  postAuthor: { fontSize: 13, fontWeight: "700", color: "#334155" },
  postTime: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
    marginLeft: 6,
  },
  postText: {
    fontSize: 14,
    color: "#0f172a",
    lineHeight: 20,
    fontWeight: "500",
    marginBottom: 10,
  },
  postThumb: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    marginTop: 10,
    backgroundColor: "#f1f5f9",
  },
  postFooter: {
    flexDirection: "row",
    marginTop: 10,
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
    paddingTop: 10,
  },
  stat: { flexDirection: "row", alignItems: "center", marginRight: 15 },
  statText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
    marginLeft: 4,
  },

  resourceBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 5,
  },
  resourceIconBg: { padding: 10, backgroundColor: "#e0e7ff", borderRadius: 10 },
  resourceTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  resourceBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#e0e7ff",
    color: "#4f46e5",
    fontSize: 10,
    fontWeight: "800",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    textTransform: "uppercase",
  },

  // 📭 EMPTY STATE
  emptyState: { alignItems: "center", marginTop: 60, paddingHorizontal: 40 },
  emptyIconBg: {
    backgroundColor: "#f1f5f9",
    padding: 20,
    borderRadius: 40,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
  },
  emptySubText: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "500",
  },
});
