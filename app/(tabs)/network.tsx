// Location: app/(tabs)/network.tsx
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInUp, LinearTransition } from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { auth, db } from "../../core/firebase/firebaseConfig";
import { useSmartRecommendations } from "../../hooks/queries/useSmartRecommendations";

const { width } = Dimensions.get("window");
const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

export default function NetworkScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeUid, setActiveUid] = useState<string | null>(null);
  const [currentUserData, setCurrentUserData] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<
    "recommended" | "requests" | "friends"
  >("recommended");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [myConnections, setMyConnections] = useState<any[]>([]);

  // Hook handles algorithm (Assume it returns { recommendedList: [] })
  const { recommendedList } = useSmartRecommendations(
    currentUserData,
    allUsers,
    myConnections,
  );

  // ==========================================
  // 🔒 1. AUTH & FETCH MY DATA
  // ==========================================
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setActiveUid(user.uid);
        try {
          const myDoc = await getDoc(doc(db, "users", user.uid));
          if (myDoc.exists()) {
            setCurrentUserData(myDoc.data());
          }
        } catch (error) {
          console.log("Error fetching my data:", error);
        }
      } else {
        setActiveUid(null);
        setCurrentUserData(null);
        setAllUsers([]);
        setMyConnections([]);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // ==========================================
  // 📡 2. REAL FIREBASE FETCHING ENGINE
  // ==========================================
  useEffect(() => {
    if (!activeUid) return;
    setLoading(true);

    // Fetch all users
    const usersRef = collection(db, "users");
    const unsubUsers = onSnapshot(usersRef, (snap) => {
      const users = snap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((u: any) => u.uid !== activeUid);
      setAllUsers(users);
    });

    // Fetch connections
    const connRef = collection(db, "connections");
    const unsubSent = onSnapshot(
      query(connRef, where("senderId", "==", activeUid)),
      (sentSnap) => {
        const sentData = sentSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const unsubRec = onSnapshot(
          query(connRef, where("receiverId", "==", activeUid)),
          (recSnap) => {
            const recData = recSnap.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            }));
            setMyConnections([...sentData, ...recData]);
            setLoading(false);
          },
        );
        return () => unsubRec();
      },
    );

    return () => {
      unsubUsers();
      unsubSent();
    };
  }, [activeUid]);

  // ==========================================
  // 🧠 3. LINKEDIN KILLER MATRIX
  // ==========================================
  const calculateMatchMatrix = (user: any, me: any) => {
    let score = 0;
    let matchReasons: { reason: string; weight: number; color: string }[] = [];

    if (!me) return { score: 0, primaryReason: null, badgeColor: "#64748b" };

    // Tier 0: Mutual Friends
    if (user.friendIds && me.friendIds) {
      const mutualFriends = user.friendIds.filter((id: string) =>
        me.friendIds.includes(id),
      );
      if (mutualFriends.length > 0) {
        score += mutualFriends.length * 25;
        matchReasons.push({
          reason: `🤝 ${mutualFriends.length} Mutual Connection${mutualFriends.length > 1 ? "s" : ""}`,
          weight: mutualFriends.length * 25,
          color: "#f43f5e",
        });
      }
    }
    // Tier 1: Core
    if (user.targetExam && me.targetExam && user.targetExam === me.targetExam) {
      score += 40;
      matchReasons.push({
        reason: "Same Target Exam",
        weight: 40,
        color: "#2563eb",
      });
    }
    if (user.class && me.class && user.class === me.class) {
      score += 20;
      matchReasons.push({ reason: "Same Class", weight: 20, color: "#8b5cf6" });
    }
    // Tier 2: Synergy
    const synergyMatch = user.strongSubjects?.some((s: string) =>
      me.weakSubjects?.includes(s),
    );
    if (synergyMatch) {
      score += 35;
      matchReasons.push({
        reason: "Can help you study",
        weight: 35,
        color: "#10b981",
      });
    }
    // Tier 3: Logistics
    if (user.studyTime && me.studyTime && user.studyTime === me.studyTime) {
      score += 15;
      const timeLabel = user.studyTime.includes("Night")
        ? "🌙 Night Owl Buddy"
        : "☀️ Morning Buddy";
      matchReasons.push({ reason: timeLabel, weight: 15, color: "#f59e0b" });
    }
    // Tier 4: Interests
    if (
      user.city &&
      me.city &&
      user.city.toLowerCase() === me.city.toLowerCase()
    ) {
      score += 10;
      matchReasons.push({
        reason: "From your City",
        weight: 10,
        color: "#3b82f6",
      });
    }

    matchReasons.sort((a, b) => b.weight - a.weight);
    return {
      score,
      primaryReason: matchReasons.length > 0 ? matchReasons[0].reason : null,
      badgeColor: matchReasons.length > 0 ? matchReasons[0].color : "#64748b",
    };
  };

  // ==========================================
  // 🧠 4. FILTER & SORT
  // ==========================================
  let rawRecommended = allUsers.filter((user) => {
    const hasConnection = myConnections.some(
      (conn) => conn.senderId === user.uid || conn.receiverId === user.uid,
    );
    return !hasConnection;
  });

  let recommendedUsers = rawRecommended.map((user) => {
    const matchData = calculateMatchMatrix(user, currentUserData);
    return {
      ...user,
      matchScore: matchData.score,
      matchReason: matchData.primaryReason,
      badgeColor: matchData.badgeColor,
    };
  });
  recommendedUsers.sort((a, b) => b.matchScore - a.matchScore);

  let incomingRequests = myConnections.filter(
    (conn) => conn.receiverId === activeUid && conn.status === "pending",
  );
  let acceptedFriends = myConnections.filter(
    (conn) => conn.status === "accepted",
  );

  if (searchQuery.trim() !== "") {
    const q = searchQuery.toLowerCase();
    recommendedUsers = recommendedUsers.filter(
      (u) =>
        u.displayName?.toLowerCase().includes(q) ||
        u.name?.toLowerCase().includes(q),
    );
    incomingRequests = incomingRequests.filter((c) =>
      c.senderName?.toLowerCase().includes(q),
    );
    acceptedFriends = acceptedFriends.filter((c) => {
      const friendName =
        c.senderId === activeUid ? c.receiverName : c.senderName;
      return friendName?.toLowerCase().includes(q);
    });
  }

  // ==========================================
  // ⚡ 5. ACTIONS
  // ==========================================
  const handleSendRequest = async (receiver: any) => {
    if (!activeUid) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await addDoc(collection(db, "connections"), {
        senderId: activeUid,
        senderName: auth.currentUser?.displayName || "Student",
        senderAvatar: auth.currentUser?.photoURL || DEFAULT_AVATAR,
        receiverId: receiver.uid || receiver.id,
        receiverName: receiver.displayName || receiver.name || "Student",
        receiverAvatar:
          receiver.photoURL || receiver.profilePic || DEFAULT_AVATAR,
        status: "pending",
        timestamp: serverTimestamp(),
      });
      Alert.alert("Success", "Connection request sent!");
    } catch (error) {
      Alert.alert("Error", "Request failed.");
    }
  };

  const handleAcceptRequest = async (requestId: string, senderId: string) => {
    if (!senderId || !requestId) {
      Alert.alert("Error", "Invalid request data");
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const myUid = auth.currentUser!.uid;
      const myRef = doc(db, "users", myUid);
      const senderRef = doc(db, "users", senderId);

      await updateDoc(myRef, { connections: arrayUnion(senderId) });
      await updateDoc(senderRef, { connections: arrayUnion(myUid) });

      // Mark connection doc as accepted instead of deleting (if you use connections collection)
      await updateDoc(doc(db, "connections", requestId), {
        status: "accepted",
      });
    } catch (error) {
      console.error("Error accepting request: ", error);
    }
  };

  const handleRejectRequest = async (connectionId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await deleteDoc(doc(db, "connections", connectionId));
    } catch (error) {
      console.log("Error rejecting:", error);
    }
  };

  // ==========================================
  // 🎨 6. UI RENDERERS (GLASSY & PREMIUM)
  // ==========================================
  const renderHeader = () => (
    <View
      style={[
        styles.headerContainer,
        { paddingTop: Platform.OS === "ios" ? insets.top + 30 : 0 },
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
          <Text style={styles.headerTitle}>Network</Text>
          <Text style={styles.headerSub}>Find your study partners</Text>
        </View>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => router.push("/search-users")}
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
          placeholder="Search scholars..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.tabContainer}>
        {(["recommended", "requests", "friends"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.activeTabBtn]}
            onPress={() => {
              setActiveTab(tab);
              Haptics.selectionAsync();
            }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === "requests" &&
                incomingRequests.length > 0 &&
                ` (${incomingRequests.length})`}
            </Text>
            {tab === "requests" && incomingRequests.length > 0 && (
              <View style={styles.badgeDot} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderMatchmakingBanner = () => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => router.push("/matchmaking")}
      style={styles.matchBannerContainer}
    >
      <LinearGradient
        colors={["#ec4899", "#8b5cf6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.matchBannerGradient}
      >
        <View style={styles.matchBannerTextContainer}>
          <Text style={styles.matchBannerTitle}>🤝 Find a Study Partner</Text>
          <Text style={styles.matchBannerSub}>
            Swipe & connect with serious aspirants
          </Text>
        </View>
        <View style={styles.matchBannerAction}>
          <Text style={styles.matchBannerActionText}>Swipe</Text>
          <Ionicons name="flash" size={14} color="#ec4899" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderRecommendedCard = ({ item, index }: any) => (
    <Animated.View
      entering={FadeInUp.delay(index * 100)}
      layout={LinearTransition.springify()}
      style={styles.cardPremium}
    >
      <TouchableOpacity
        style={styles.cardInfoCenter}
        activeOpacity={0.7}
        onPress={() =>
          router.push({
            pathname: "/user/[id]",
            params: { id: item.uid || item.id },
          })
        }
      >
        <Image
          source={{
            uri:
              item.photoURL || item.profilePic || item.avatar || DEFAULT_AVATAR,
          }}
          style={styles.avatarLarge}
        />

        <Text style={styles.userNameLarge} numberOfLines={1}>
          {item.displayName || item.name || "User"}
        </Text>
        <Text style={styles.userSubtitle} numberOfLines={1}>
          {item.targetExam || item.roleDetail || "Scholar"}
        </Text>

        {item.matchReason && (
          <View
            style={[
              styles.algoBadge,
              {
                backgroundColor: item.badgeColor + "15",
                borderColor: item.badgeColor + "30",
              },
            ]}
          >
            <Text style={[styles.algoBadgeText, { color: item.badgeColor }]}>
              {item.matchReason}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionBtnFull}
        onPress={() => handleSendRequest(item)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#2563EB", "#4F46E5"]}
          style={styles.btnGradientFull}
        >
          <Ionicons name="person-add" size={14} color="#fff" />
          <Text style={styles.btnTextFull}>Connect</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderRequestCard = ({ item, index }: any) => {
    const sId = item.senderId || item.from || item.uid;
    return (
      <Animated.View
        entering={FadeInUp.delay(index * 100)}
        layout={LinearTransition.springify()}
        style={styles.listCard}
      >
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
          onPress={() =>
            router.push({ pathname: "/user/[id]", params: { id: sId } })
          }
        >
          <Image
            source={{ uri: item.senderAvatar || DEFAULT_AVATAR }}
            style={styles.avatarMedium}
          />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.userNameList} numberOfLines={1}>
              {item.senderName}
            </Text>
            <Text style={styles.userSubtitleList}>Sent you a request</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.requestActionRow}>
          <TouchableOpacity
            style={styles.iconBtnReject}
            onPress={() => handleRejectRequest(item.id)}
          >
            <Ionicons name="close" size={20} color="#ef4444" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtnAccept}
            onPress={() => handleAcceptRequest(item.id, sId)}
          >
            <Ionicons name="checkmark" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const renderFriendCard = ({ item, index }: any) => {
    const isMeSender = item.senderId === activeUid;
    const friendName = isMeSender ? item.receiverName : item.senderName;
    const friendAvatar = isMeSender ? item.receiverAvatar : item.senderAvatar;
    const friendId = isMeSender ? item.receiverId : item.senderId;

    return (
      <Animated.View
        entering={FadeInUp.delay(index * 50)}
        layout={LinearTransition.springify()}
        style={styles.listCard}
      >
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
          onPress={() =>
            router.push({ pathname: "/user/[id]", params: { id: friendId } })
          }
        >
          <View>
            <Image
              source={{ uri: friendAvatar || DEFAULT_AVATAR }}
              style={styles.avatarMedium}
            />
            <View style={styles.onlineDot} />
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.userNameList} numberOfLines={1}>
              {friendName}
            </Text>
            <Text style={[styles.userSubtitleList, { color: "#10b981" }]}>
              Connected
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.chatIconBtn}
          onPress={() =>
            router.push({
              pathname: "/chat/[id]",
              params: { id: item.id, name: friendName },
            })
          }
        >
          <Ionicons name="chatbubbles" size={20} color="#2563EB" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // ==========================================
  // 📱 7. MAIN RENDER LAYOUT
  // ==========================================
  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <StatusBar barStyle="dark-content" />

      {renderHeader()}

      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={styles.loaderCenter}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : (
          <>
            {activeTab === "recommended" && (
              <FlatList
                data={recommendedUsers}
                keyExtractor={(item) => item.uid || item.id}
                numColumns={2}
                columnWrapperStyle={{
                  justifyContent: "space-between",
                  paddingHorizontal: 15,
                }}
                contentContainerStyle={{
                  paddingTop: Platform.OS === "ios" ? 210 : 200,
                  paddingBottom: 150,
                }}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={renderMatchmakingBanner}
                renderItem={renderRecommendedCard}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No new scholars found.</Text>
                }
              />
            )}

            {activeTab === "requests" && (
              <FlatList
                data={incomingRequests}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{
                  paddingTop: Platform.OS === "ios" ? 210 : 200,
                  paddingBottom: 150,
                  paddingHorizontal: 15,
                }}
                showsVerticalScrollIndicator={false}
                renderItem={renderRequestCard}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No pending requests.</Text>
                }
              />
            )}

            {activeTab === "friends" && (
              <FlatList
                data={acceptedFriends}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{
                  paddingTop: Platform.OS === "ios" ? 210 : 200,
                  paddingBottom: 150,
                  paddingHorizontal: 15,
                }}
                showsVerticalScrollIndicator={false}
                renderItem={renderFriendCard}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    No friends yet. Start connecting!
                  </Text>
                }
              />
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 STYLES (Glassy, Premium, Spaced)
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },

  // 🍏 Glass Header
  headerContainer: {
    position: "absolute",
    top: 0,
    width: "100%",
    zIndex: 50,
    borderBottomWidth: 1,
    borderColor: "rgba(226,232,240,0.6)",
    paddingBottom: 15,
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
    borderWidth: 1,
    borderColor: "#e2e8f0",
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
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "500",
    height: "100%",
  },

  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    padding: 4,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 16,
    position: "relative",
  },
  activeTabBtn: {
    backgroundColor: "#fff",
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
    elevation: 2,
  },
  tabText: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  activeTabText: { color: "#0f172a", fontWeight: "900" },
  badgeDot: {
    position: "absolute",
    top: 8,
    right: 12,
    width: 8,
    height: 8,
    backgroundColor: "#ef4444",
    borderRadius: 4,
  },

  // Matchmaking Banner
  matchBannerContainer: {
    marginBottom: 20,
    borderRadius: 24,
    overflow: "hidden",
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
    elevation: 5,
  },
  matchBannerGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  matchBannerTextContainer: { flex: 1, paddingRight: 10 },
  matchBannerTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 4,
  },
  matchBannerSub: {
    color: "#fdf2f8",
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.9,
  },
  matchBannerAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 2,
  },
  matchBannerActionText: {
    color: "#ec4899",
    fontWeight: "900",
    fontSize: 13,
    marginRight: 4,
  },

  // Recommended Grid Cards
  cardPremium: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 15,
    marginBottom: 15,
    alignItems: "center",
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  cardInfoCenter: { alignItems: "center", marginBottom: 15, width: "100%" },
  avatarLarge: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#f1f5f9",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  userNameLarge: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
    letterSpacing: -0.2,
  },
  userSubtitle: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },

  algoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
  },
  algoBadgeText: { fontSize: 10, fontWeight: "800" },

  actionBtnFull: { width: "100%", borderRadius: 14, overflow: "hidden" },
  btnGradientFull: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  btnTextFull: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    marginLeft: 6,
  },

  // List Cards (Requests & Friends)
  listCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 20,
    marginBottom: 12,
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
    elevation: 1,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  avatarMedium: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  onlineDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    backgroundColor: "#10b981",
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#fff",
  },

  userNameList: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  userSubtitleList: { fontSize: 13, color: "#64748b", fontWeight: "500" },

  requestActionRow: { flexDirection: "row", gap: 10 },
  iconBtnReject: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fee2e2",
  },
  iconBtnAccept: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#10b981",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },

  chatIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e7ff",
  },

  loaderCenter: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    color: "#94a3b8",
    fontSize: 15,
    fontWeight: "600",
  },
});
