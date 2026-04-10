// Location: app/(tabs)/profile.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import {
  arrayRemove,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../core/firebase/firebaseConfig";

const { width } = Dimensions.get("window");
const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

export default function ProfileScreen() {
  const router = useRouter();
  const user = auth.currentUser;

  const [activeTab, setActiveTab] = useState<"posts" | "saved">("posts");
  const [myPosts, setMyPosts] = useState<any[]>([]); 
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [myTests, setMyTests] = useState<any[]>([]); 
  const [loadingTests, setLoadingTests] = useState(true);

  const [savedAIPosts, setSavedAIPosts] = useState<any[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // ==========================================
  // 1. FETCH MY CREATED TESTS
  // ==========================================
  useEffect(() => {
    const fetchMyCreatedTests = async () => {
      if (!user?.uid) return;
      try {
        const q = query(
          collection(db, "exams_enterprise"),
          where("authorId", "==", user.uid),
        );
        const querySnapshot = await getDocs(q);
        const testsArray = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          isExamEngineTest: true,
          ...doc.data(),
        }));
        setMyTests(testsArray);
      } catch (error) {
        console.error("Error fetching my tests: ", error);
      } finally {
        setLoadingTests(false);
      }
    };

    fetchMyCreatedTests();
  }, [user]);

  // ==========================================
  // 2. LIVE USER DATA LISTENER
  // ==========================================
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      }
    });

    fetchProfileData();

    return () => unsubscribeUser();
  }, [user]);

  // ==========================================
  // 3. FETCH REAL POSTS DATA
  // ==========================================
  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const postsQuery = query(
        collection(db, "posts"),
        where("authorId", "==", user?.uid),
      );
      const postsSnapshot = await getDocs(postsQuery);
      let fetchedMyPosts = postsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      fetchedMyPosts.sort(
        (a: any, b: any) => b.createdAt?.toMillis() - a.createdAt?.toMillis(),
      );
      setMyPosts(fetchedMyPosts);
    } catch (error) {
      console.log("Error fetching profile posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchSavedAIPosts = async () => {
      if (activeTab === "saved" && user?.uid) {
        setLoadingSaved(true);
        try {
          const q = query(
            collection(db, "ai_feed_items"),
            where("savedBy", "array-contains", user.uid),
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            setSavedAIPosts(
              snap.docs.map((doc) => ({
                id: doc.id,
                isSavedAIPost: true,
                ...doc.data(),
              })),
            );
          } else {
            setSavedAIPosts([]);
          }
        } catch (error) {
          console.error("Error fetching saved AI posts:", error);
        } finally {
          setLoadingSaved(false);
        }
      }
    };

    fetchSavedAIPosts();
  }, [activeTab, user]);

  // ==========================================
  // 4. LOGOUT LOGIC
  // ==========================================
  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to exit?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
            router.replace("/login");
          } catch (error) {
            Alert.alert("Error", "Logout failed, please try again.");
            console.error(error);
          }
        },
      },
    ]);
  };

  // ==========================================
  // 5. DELETE ACTIONS
  // ==========================================
  const handleDeleteFromProfile = async (postId: string) => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post forever?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "posts", postId));
              setMyPosts((prev) => prev.filter((p) => p.id !== postId));
            } catch (error) {
              Alert.alert("Error", "Could not delete the post.");
            }
          },
        },
      ],
    );
  };

  const handleDeleteTest = async (testId: string) => {
    Alert.alert(
      "Delete Exam?",
      "This will permanently remove the test and all its responses.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "exams_enterprise", testId));
              setMyTests((prev) => prev.filter((t) => t.id !== testId));
            } catch (error) {
              Alert.alert("Error", "Could not delete test.");
            }
          },
        },
      ],
    );
  };

  const handleRemoveBookmark = async (postId: string) => {
    if (!user?.uid) return;
    setSavedAIPosts((prev) => prev.filter((p) => p.id !== postId));
    try {
      await updateDoc(doc(db, "ai_feed_items", postId), {
        savedBy: arrayRemove(user.uid),
      });
    } catch (e) {
      console.error("Error removing bookmark", e);
    }
  };

  // ==========================================
  // 6. RENDERERS FOR LIST
  // ==========================================
  const combinedFeed = [...myTests, ...myPosts].sort((a: any, b: any) => {
    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return timeB - timeA;
  });

  const renderFeedItem = ({ item, index }: { item: any; index: number }) => {
    if (item.isSavedAIPost) {
      const safeContent = typeof item.content === "object" && item.content !== null ? item.content : {};
      let previewText = safeContent.title || safeContent.front || safeContent.question || safeContent.statement || "Saved Item";

      return (
        <Animated.View entering={FadeInDown.delay(index * 50).springify()} style={styles.savedCard}>
          <View style={styles.savedCardHeader}>
            <Text style={styles.savedBadge}>{item.type.replace("_", " ").toUpperCase()}</Text>
            <TouchableOpacity onPress={() => handleRemoveBookmark(item.id)}>
              <Ionicons name="bookmark" size={24} color="#4f46e5" />
            </TouchableOpacity>
          </View>
          <Text style={styles.savedTopicText}>{item.topic || "General Topic"}</Text>
          <Text style={styles.savedPreviewText} numberOfLines={2}>{previewText}</Text>
        </Animated.View>
      );
    }

    if (item.isExamEngineTest) {
      return (
        <Animated.View entering={FadeInDown.delay(index * 100).springify()} style={styles.testCard}>
          <TouchableOpacity activeOpacity={0.8} onPress={() => router.push(`/test-analysis/${item.id}`)} style={{ flex: 1 }}>
            <View style={styles.testCardHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={styles.testBadgeContainer}>
                  <Ionicons name="school" size={14} color="#10b981" />
                  <Text style={styles.testBadgeTxt}>CBT EXAM</Text>
                </View>
                <Text style={[styles.testCategory, { marginLeft: 10 }]}>{item.category || "TEST"}</Text>
              </View>
              {activeTab === "posts" && (
                <TouchableOpacity onPress={() => handleDeleteTest(item.id)} style={styles.deleteMiniBtn}>
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.testCardTitle} numberOfLines={2}>{item.title}</Text>
            <View style={styles.testCardFooter}>
              <View style={styles.testFooterStat}>
                <Ionicons name="list" size={14} color="#64748b" />
                <Text style={styles.testFooterTxt}>{item.questions?.length || 0} Qs</Text>
              </View>
              <View style={styles.testFooterStat}>
                <Ionicons name="time" size={14} color="#64748b" />
                <Text style={styles.testFooterTxt}>
                  {item.rules?.globalDuration || item.settings?.totalDuration || 0} Mins
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    }

    return (
      <Animated.View entering={FadeInDown.delay(index * 100).springify()} style={styles.miniPostCard}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => router.push(`/post/${item.id}`)}>
          <View style={styles.miniPostHeader}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={styles.badgeContainer}>
                <Ionicons name="text" size={14} color="#4f46e5" />
                <Text style={styles.miniPostType}>{item.type?.toUpperCase() || "POST"}</Text>
              </View>
            </View>
            {activeTab === "posts" && (
              <TouchableOpacity onPress={() => handleDeleteFromProfile(item.id)} style={styles.deleteMiniBtn}>
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
          {item.title ? <Text style={styles.miniPostTitle} numberOfLines={1}>{item.title}</Text> : null}
          {item.imageUrl && (
            <View style={styles.miniImageContainer}>
              <Image source={{ uri: item.imageUrl }} style={styles.miniImage} />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // ==========================================
  // 🎮 SIMPLIFIED MVP STATS
  // ==========================================
  // Fallback to old gamification object if new fields aren't present yet
  const totalPoints = userData?.totalPoints || userData?.gamification?.eduCoins || 0;
  const currentStreak = userData?.currentStreak || userData?.gamification?.currentStreak || 0;
  const totalCreations = combinedFeed.length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* --- 🔝 TOP ACTION BAR --- */}
      <View style={styles.topBar}>
        <Text style={styles.username}>
          @{user?.displayName?.replace(/\s/g, "").toLowerCase() || "student"}
        </Text>
        <View style={styles.topIcons}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/edit-profile")}>
            <Ionicons name="pencil-outline" size={24} color="#0f172a" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={26} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={activeTab === "posts" ? combinedFeed : savedAIPosts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshing={activeTab === "posts" ? loading : loadingSaved}
        onRefresh={fetchProfileData}
        ListHeaderComponent={
          <View style={styles.headerWrapper}>
            {/* --- 👤 MAIN PROFILE HEADER --- */}
            <View style={styles.profileSection}>
              <View style={styles.avatarWrapper}>
                <Image source={{ uri: user?.photoURL || DEFAULT_AVATAR }} style={styles.profileAvatar} />
              </View>

              <View style={styles.profileDetails}>
                <Text style={styles.fullName}>{user?.displayName || "Eduxity User"}</Text>
                <View style={styles.roleContainer}>
                  <Ionicons name="school" size={14} color="#4f46e5" />
                  <Text style={styles.roleText}>{userData?.roleDetail || "Community Member"}</Text>
                </View>
              </View>
            </View>

            {/* --- 🔥 MVP STATS DASHBOARD --- */}
            <View style={styles.highlightCardsContainer}>
              <View style={[styles.highlightCard, { backgroundColor: "#fff7ed", borderColor: "#ffedd5" }]}>
                <Text style={styles.highlightEmoji}>🔥</Text>
                <Text style={styles.highlightValue}>{currentStreak}</Text>
                <Text style={styles.highlightLabel}>Day Streak</Text>
              </View>
              <View style={[styles.highlightCard, { backgroundColor: "#fefce8", borderColor: "#fef9c3" }]}>
                <Text style={styles.highlightEmoji}>🪙</Text>
                <Text style={styles.highlightValue}>{totalPoints}</Text>
                <Text style={styles.highlightLabel}>Total Points</Text>
              </View>
              <View style={[styles.highlightCard, { backgroundColor: "#fdf2f8", borderColor: "#fce7f3" }]}>
                <Text style={styles.highlightEmoji}>📝</Text>
                <Text style={styles.highlightValue}>{totalCreations}</Text>
                <Text style={styles.highlightLabel}>Creations</Text>
              </View>
            </View>

            {/* --- 📍 ABOUT CARD --- */}
            <View style={styles.aboutCard}>
              <Text style={styles.cardTitle}>About Me</Text>
              <Text style={styles.bioText}>{userData?.bio || "No bio added yet."}</Text>

              <View style={styles.infoRowGrid}>
                {userData?.institutionName && (
                  <View style={styles.infoRow}>
                    <Ionicons name="business" size={16} color="#64748b" />
                    <Text style={styles.infoText}>{userData.institutionName}</Text>
                  </View>
                )}
                {(userData?.city || userData?.state) && (
                  <View style={styles.infoRow}>
                    <Ionicons name="location" size={16} color="#64748b" />
                    <Text style={styles.infoText}>
                      {[userData?.city, userData?.state].filter(Boolean).join(", ")}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* --- 🗂️ TAB SELECTOR --- */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === "posts" && styles.activeTabBtn]}
                onPress={() => setActiveTab("posts")}
              >
                <Ionicons name="grid-outline" size={20} color={activeTab === "posts" ? "#4f46e5" : "#64748b"} />
                <Text style={[styles.tabText, activeTab === "posts" && styles.activeTabText]}>
                  My Creation ({combinedFeed.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === "saved" && styles.activeTabBtn]}
                onPress={() => setActiveTab("saved")}
              >
                <Ionicons name="bookmark-outline" size={20} color={activeTab === "saved" ? "#4f46e5" : "#64748b"} />
                <Text style={[styles.tabText, activeTab === "saved" && styles.activeTabText]}>
                  Saved ({savedAIPosts.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={renderFeedItem}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name={activeTab === "posts" ? "document-text-outline" : "bookmarks-outline"} size={60} color="#cbd5e1" />
            <Text style={styles.emptyText}>
              {activeTab === "posts" ? "You haven't posted or created tests yet." : "You haven't saved any AI posts yet."}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 CLEAN MVP STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  username: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  topIcons: { flexDirection: "row", gap: 15 },
  iconBtn: { padding: 4 },

  headerWrapper: { backgroundColor: "#f8fafc", paddingBottom: 10 },

  profileSection: {
    flexDirection: "row",
    padding: 20,
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  avatarWrapper: { position: "relative", marginRight: 20 },
  profileAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: "#e2e8f0",
  },

  profileDetails: { flex: 1 },
  fullName: { fontSize: 22, fontWeight: "900", color: "#0f172a" },
  roleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  roleText: {
    fontSize: 13,
    color: "#4f46e5",
    fontWeight: "800",
    marginLeft: 6,
  },

  highlightCardsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    marginTop: 15,
  },
  highlightCard: {
    width: (width - 50) / 3,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  highlightEmoji: { fontSize: 26, marginBottom: 5 },
  highlightValue: { fontSize: 18, fontWeight: "900", color: "#0f172a" },
  highlightLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748b",
    marginTop: 2,
    textTransform: "uppercase",
  },

  aboutCard: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 15,
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardTitle: { fontSize: 16, fontWeight: "900", color: "#0f172a" },
  bioText: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 15,
    fontWeight: "500",
  },
  infoRowGrid: { gap: 10, marginBottom: 5 },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  infoText: {
    fontSize: 13,
    color: "#475569",
    marginLeft: 8,
    fontWeight: "700",
  },

  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    marginTop: 15,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
  },
  activeTabBtn: { borderBottomWidth: 3, borderBottomColor: "#4f46e5" },
  tabText: { fontSize: 14, fontWeight: "800", color: "#64748b", marginLeft: 8 },
  activeTabText: { color: "#4f46e5" },

  miniPostCard: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 12,
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 1,
  },
  miniPostHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eef2ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  miniPostType: {
    fontSize: 10,
    fontWeight: "900",
    color: "#4f46e5",
    marginLeft: 6,
  },
  deleteMiniBtn: {
    backgroundColor: "#fef2f2",
    padding: 6,
    borderRadius: 10,
  },
  miniPostTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  miniImageContainer: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
    backgroundColor: "#f1f5f9",
  },
  miniImage: { width: "100%", height: "100%", resizeMode: "cover" },

  testCard: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 12,
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 2,
  },
  testCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  testBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  testBadgeTxt: {
    fontSize: 10,
    fontWeight: "900",
    color: "#10b981",
    marginLeft: 4,
  },
  testCategory: { fontSize: 11, fontWeight: "800", color: "#64748b" },
  testCardTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 12,
  },
  testCardFooter: {
    flexDirection: "row",
    gap: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
    alignItems: "center",
  },
  testFooterStat: { flexDirection: "row", alignItems: "center", gap: 4 },
  testFooterTxt: { fontSize: 12, fontWeight: "800", color: "#64748b" },

  savedCard: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  savedCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  savedBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savedTopicText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#4f46e5",
    marginBottom: 6,
  },
  savedPreviewText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: 24,
  },

  emptyState: { alignItems: "center", marginTop: 60 },
  emptyText: {
    marginTop: 15,
    fontSize: 15,
    fontWeight: "700",
    color: "#94a3b8",
  },
});