// Location: app/admin/resources.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 🔥 FIREBASE IMPORTS
import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    limit,
    orderBy,
    query,
    updateDoc,
} from "firebase/firestore";
import { db } from "../../core/firebase/firebaseConfig";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
const isWeb = Platform.OS === "web";

// ==========================================
// 📊 INTERFACES
// ==========================================
interface PostData {
  id: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  likesCount: number;
  commentsCount: number;
  isBoosted: boolean;
  createdAt: Date;
  engagementScore: number; // Used for trending calculation
}

export default function GlobalPostManager() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<
    "Recent" | "Trending" | "Boosted"
  >("Recent");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAllPosts();
  }, []);

  // ==========================================
  // 🧠 1. FETCH & SORT POSTS
  // ==========================================
  const fetchAllPosts = async () => {
    setLoading(true);
    try {
      console.log("⏳ Fetching global posts...");

      // Fetching the latest 200 posts to manage memory and performance
      const q = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc"),
        limit(200),
      );
      const snapshot = await getDocs(q);

      const fetchedPosts: PostData[] = snapshot.docs.map((d) => {
        const data = d.data();

        // Defensive checks for different database structures
        const likes =
          typeof data.likesCount === "number"
            ? data.likesCount
            : data.likes?.length || 0;
        const comments =
          typeof data.commentsCount === "number"
            ? data.commentsCount
            : data.comments?.length || 0;

        return {
          id: d.id,
          authorName: data.authorName || data.userName || "Unknown User",
          authorAvatar: data.authorAvatar || data.userAvatar || DEFAULT_AVATAR,
          text:
            data.text ||
            data.content ||
            data.caption ||
            "No text content. (Media/Image)",
          likesCount: likes,
          commentsCount: comments,
          isBoosted: data.isBoosted === true,
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : new Date(),
          engagementScore: likes * 2 + comments * 3, // Algorithm: Comments carry more weight
        };
      });

      setPosts(fetchedPosts);
      console.log(`✅ Loaded ${fetchedPosts.length} posts.`);
    } catch (error: any) {
      console.error("❌ Fetch Posts Error:", error);
      if (isWeb) window.alert("Failed to load posts.");
    } finally {
      setLoading(false);
    }
  };

  // 🗂️ FILTERING LOGIC (Handled Client-Side to avoid Firebase Index Errors)
  const getFilteredPosts = () => {
    let result = [...posts];

    if (activeFilter === "Trending") {
      result.sort((a, b) => b.engagementScore - a.engagementScore);
    } else if (activeFilter === "Boosted") {
      result = result.filter((p) => p.isBoosted);
      result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else {
      // Recent (Default)
      result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    return result;
  };

  // ==========================================
  // ⚡ 2. ADMIN ACTIONS (BOOST & DELETE)
  // ==========================================

  // 🚀 THE BOOST FEATURE
  const toggleBoostPost = async (postId: string, currentStatus: boolean) => {
    const action = currentStatus ? "Remove Boost" : "Boost Post";
    const msg = currentStatus
      ? "Remove this post from the algorithm's priority list?"
      : "Push this post to the top of everyone's feed?";

    const proceed = async () => {
      setProcessingId(postId);
      try {
        await updateDoc(doc(db, "posts", postId), {
          isBoosted: !currentStatus,
        });

        // Update UI Instantly
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, isBoosted: !currentStatus } : p,
          ),
        );

        if (!isWeb)
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error: any) {
        console.error("❌ Boost Error:", error);
        if (isWeb) window.alert("Failed to boost post.");
      } finally {
        setProcessingId(null);
      }
    };

    if (isWeb && window.confirm(msg)) proceed();
    else if (!isWeb)
      Alert.alert(action, msg, [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", style: "default", onPress: proceed },
      ]);
  };

  // 🗑️ THE DELETE FEATURE
  const deletePost = async (postId: string) => {
    const proceed = async () => {
      setProcessingId(postId);
      try {
        await deleteDoc(doc(db, "posts", postId));

        // Remove from UI Instantly
        setPosts((prev) => prev.filter((p) => p.id !== postId));

        if (!isWeb)
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error: any) {
        console.error("❌ Delete Error:", error);
        if (isWeb) window.alert("Failed to delete post. Check permissions.");
      } finally {
        setProcessingId(null);
      }
    };

    if (
      isWeb &&
      window.confirm(
        "Permanently delete this post from the platform? This cannot be undone.",
      )
    )
      proceed();
    else if (!isWeb)
      Alert.alert("Delete Post", "Permanently delete this post?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: proceed },
      ]);
  };

  // ==========================================
  // 🎨 UI RENDERERS
  // ==========================================
  const renderPostCard = ({ item }: { item: PostData }) => {
    const isProcessing = processingId === item.id;

    return (
      <View style={[styles.postCard, item.isBoosted && styles.boostedCard]}>
        {/* Author Header */}
        <View style={styles.cardHeader}>
          <Image source={{ uri: item.authorAvatar }} style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.authorName} numberOfLines={1}>
                {item.authorName}
              </Text>
              {item.isBoosted && (
                <View style={styles.boostBadge}>
                  <Ionicons
                    name="rocket"
                    size={10}
                    color="#fff"
                    style={{ marginRight: 2 }}
                  />
                  <Text style={styles.boostBadgeText}>BOOSTED</Text>
                </View>
              )}
            </View>
            <Text style={styles.timeText}>
              {item.createdAt.toLocaleDateString()} at{" "}
              {item.createdAt.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        </View>

        {/* Post Content */}
        <Text style={styles.postText} numberOfLines={4}>
          {item.text}
        </Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="heart" size={14} color="#ef4444" />
            <Text style={styles.statText}>{item.likesCount} Likes</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble" size={14} color="#3b82f6" />
            <Text style={styles.statText}>{item.commentsCount} Comments</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="analytics" size={14} color="#8b5cf6" />
            <Text style={styles.statText}>Score: {item.engagementScore}</Text>
          </View>
        </View>

        {/* Admin Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              item.isBoosted ? styles.unboostBtn : styles.boostBtn,
            ]}
            onPress={() => toggleBoostPost(item.id, item.isBoosted)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator
                size="small"
                color={item.isBoosted ? "#f59e0b" : "#fff"}
              />
            ) : (
              <>
                <Ionicons
                  name="rocket"
                  size={16}
                  color={item.isBoosted ? "#f59e0b" : "#fff"}
                />
                <Text
                  style={
                    item.isBoosted ? styles.unboostBtnText : styles.boostBtnText
                  }
                >
                  {item.isBoosted ? "Remove Boost" : "Boost Post"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => deletePost(item.id)}
            disabled={isProcessing}
          >
            <Ionicons name="trash" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const filteredPosts = getFilteredPosts();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* 🎩 HEADER */}
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === "ios" ? insets.top : 20 },
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <View>
            <Text style={styles.pageTitle}>Content Control</Text>
            <Text style={styles.pageSubtitle}>Manage All Posts</Text>
          </View>
        </View>
      </View>

      {/* 🎛️ SMART FILTERS */}
      <View style={styles.filterContainer}>
        {["Recent", "Trending", "Boosted"].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              activeFilter === filter && styles.filterTabActive,
            ]}
            onPress={() => {
              if (!isWeb) Haptics.selectionAsync();
              setActiveFilter(filter as any);
            }}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === filter && styles.filterTextActive,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 📜 POSTS LIST */}
      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={{ marginTop: 10, color: "#64748b", fontWeight: "600" }}>
            Fetching Platform Feed...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item.id}
          renderItem={renderPostCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons
                name="document-text-outline"
                size={48}
                color="#cbd5e1"
              />
              <Text style={styles.emptyText}>
                No posts found in this category.
              </Text>
            </View>
          )}
        />
      )}
    </View>
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
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  backBtn: { marginRight: 15 },
  pageTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
    marginTop: 2,
  },

  filterContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  filterTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderColor: "transparent",
  },
  filterTabActive: { borderColor: "#0f172a" },
  filterText: { fontSize: 13, fontWeight: "600", color: "#94a3b8" },
  filterTextActive: { color: "#0f172a", fontWeight: "800" },

  listContent: { padding: 15, paddingBottom: 100 },
  loaderCenter: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyState: { alignItems: "center", marginTop: 60 },
  emptyText: {
    marginTop: 15,
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "500",
  },

  // POST CARD
  postCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
    elevation: 1,
  },
  boostedCard: {
    borderColor: "#fcd34d",
    backgroundColor: "#fffbeb",
    borderWidth: 2,
  },

  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e2e8f0",
    marginRight: 12,
  },
  authorName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
    marginRight: 8,
  },
  timeText: { fontSize: 11, color: "#94a3b8", fontWeight: "600", marginTop: 2 },

  boostBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f59e0b",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  boostBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  postText: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 22,
    fontWeight: "500",
    marginBottom: 15,
  },

  statsRow: {
    flexDirection: "row",
    gap: 15,
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  statItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  statText: { fontSize: 11, fontWeight: "700", color: "#64748b" },

  actionRow: { flexDirection: "row", gap: 10 },

  boostBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f59e0b",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  boostBtnText: { color: "#fff", fontSize: 13, fontWeight: "800" },

  unboostBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#fde68a",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  unboostBtnText: { color: "#f59e0b", fontSize: 13, fontWeight: "800" },

  deleteBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fef2f2",
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
});
