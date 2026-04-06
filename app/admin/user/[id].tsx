// Location: app/admin/user/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
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
    doc,
    getDoc,
    getDocs,
    increment,
    or,
    query,
    updateDoc,
    where,
} from "firebase/firestore";
import { db } from "../../../core/firebase/firebaseConfig";
const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
const isWeb = Platform.OS === "web";

// ==========================================
// 📊 INTERFACES
// ==========================================
interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  username: string;
  role: string;
  class: string;
  targetExam: string;
  eduCoins: number;
  xp: number;
  isBanned: boolean;
  joinedAt: Date;
}

interface UnifiedActivity {
  id: string;
  type: "post" | "comment" | "test" | "report" | "system";
  title: string;
  subtitle: string;
  timestamp: Date;
  meta?: any;
}

export default function AdvancedUserDetailView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [timeline, setTimeline] = useState<UnifiedActivity[]>([]);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"timeline" | "stats">("timeline");

  useEffect(() => {
    if (id) fetchUser360Data();
  }, [id]);

  // ==========================================
  // 🧠 THE 360-DEGREE DATA ENGINE
  // ==========================================
  const fetchUser360Data = async () => {
    setLoading(true);
    try {
      console.log(`⏳ Fetching 360-View for user: ${id}`);

      // 1. Fetch Core Profile
      const userRef = doc(db, "users", id as string);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        Alert.alert("Error", "User not found in database.");
        router.back();
        return;
      }

      const uData = userSnap.data();
      setUser({
        id: userSnap.id,
        name: uData.displayName || uData.name || "Unknown",
        email: uData.email || "N/A",
        username: uData.username || "no_username",
        avatar: uData.photoURL || uData.avatar || DEFAULT_AVATAR,
        role: uData.accountType || uData.role || "Student",
        class: uData.class || "N/A",
        targetExam: uData.targetExam || "N/A",
        eduCoins: uData.eduCoins || 0,
        xp: uData.gamification?.xp || uData.xp || 0,
        isBanned: uData.isBanned === true,
        joinedAt: uData.joinedAt?.toDate ? uData.joinedAt.toDate() : new Date(),
      });

      // 2. Fetch Activities Concurrently (Posts, Comments, Tests)
      const activities: UnifiedActivity[] = [];

      // A. Fetch Posts (THE GOD-TIER CATCH-ALL QUERY)
      try {
        console.log(`⏳ Scanning database for posts by user: ${id}`);

        // 🔥 Ye query database ke 3 alag-alag field names ko ek sath check karegi
        const postsQ = query(
          collection(db, "posts"),
          or(
            where("authorId", "==", id),
            where("userId", "==", id),
            where("uid", "==", id),
          ),
        );

        const postsSnap = await getDocs(postsQ);
        console.log(`✅ Found ${postsSnap.size} posts for this user.`);

        postsSnap.forEach((doc) => {
          const d = doc.data();
          activities.push({
            id: doc.id,
            type: "post",
            title: "Created a new post",
            // 🔥 Ye har possible text field ko check karega
            subtitle:
              d.text ||
              d.content ||
              d.caption ||
              d.description ||
              "Uploaded an image or document",
            timestamp: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(),
          });
        });
      } catch (e: any) {
        console.error("❌ Posts fetch error:", e.message);
      }

      // B. Fetch Tests Attempted (Assuming 'testHistory' collection)
      try {
        const testsQ = query(
          collection(db, "testHistory"),
          where("userId", "==", id),
        );
        const testsSnap = await getDocs(testsQ);
        testsSnap.forEach((doc) => {
          const d = doc.data();
          activities.push({
            id: doc.id,
            type: "test",
            title: `Attempted Test: ${d.testName || "Mock Test"}`,
            subtitle: `Score: ${d.score || 0} | Accuracy: ${d.accuracy || 0}%`,
            timestamp: d.completedAt?.toDate
              ? d.completedAt.toDate()
              : new Date(),
          });
        });
      } catch (e) {
        console.log("Tests fetch error:", e);
      }

      // C. System Join Event
      activities.push({
        id: "join_event",
        type: "system",
        title: "Joined Eduxity",
        subtitle: "Account successfully created.",
        timestamp: uData.joinedAt?.toDate
          ? uData.joinedAt.toDate()
          : new Date(),
      });

      // 3. Sort Everything by Date (Newest First)
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setTimeline(activities);
      console.log(`✅ Loaded ${activities.length} total activities.`);
    } catch (error) {
      console.error("❌ Deep Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // ⚡ ADMIN CONTROLS
  // ==========================================
  const toggleBan = async () => {
    if (!user) return;
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const action = user.isBanned ? "Unban" : "Ban";
    const proceed = () => {
      setProcessing(true);
      updateDoc(doc(db, "users", user.id), { isBanned: !user.isBanned })
        .then(() => {
          setUser((prev) =>
            prev ? { ...prev, isBanned: !prev.isBanned } : null,
          );
          if (!isWeb)
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        })
        .catch((err) => {
          console.error(err);
          Alert.alert("Error", "Action failed.");
        })
        .finally(() => setProcessing(false));
    };

    if (
      isWeb &&
      window.confirm(`Are you sure you want to ${action} this user?`)
    )
      proceed();
    else if (!isWeb)
      Alert.alert("Account Control", `Proceed to ${action}?`, [
        { text: "Cancel", style: "cancel" },
        { text: action, style: "destructive", onPress: proceed },
      ]);
  };

  const giftCoins = async () => {
    if (!user) return;
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const proceed = () => {
      setProcessing(true);
      updateDoc(doc(db, "users", user.id), { eduCoins: increment(100) })
        .then(() => {
          setUser((prev) =>
            prev ? { ...prev, eduCoins: prev.eduCoins + 100 } : null,
          );
          if (!isWeb)
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert("Success", "100 EduCoins gifted!");
        })
        .catch((err) => Alert.alert("Error", "Transaction failed."))
        .finally(() => setProcessing(false));
    };

    if (isWeb && window.confirm("Gift 100 EduCoins?")) proceed();
    else if (!isWeb)
      Alert.alert("Gift Reward", "Send 100 EduCoins?", [
        { text: "Cancel", style: "cancel" },
        { text: "Send", onPress: proceed },
      ]);
  };

  // ==========================================
  // 🎨 RENDERERS
  // ==========================================
  const renderActivityIcon = (type: string) => {
    switch (type) {
      case "post":
        return <Ionicons name="document-text" size={16} color="#3b82f6" />;
      case "test":
        return <Ionicons name="school" size={16} color="#8b5cf6" />;
      case "comment":
        return <Ionicons name="chatbubble" size={16} color="#10b981" />;
      case "system":
        return <Ionicons name="rocket" size={16} color="#f59e0b" />;
      default:
        return <Ionicons name="ellipse" size={16} color="#cbd5e1" />;
    }
  };

  if (loading || !user) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#0f172a" />
        <Text style={{ marginTop: 10, color: "#64748b", fontWeight: "600" }}>
          Compiling user profile...
        </Text>
      </View>
    );
  }

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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer 360</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 👤 PROFILE HERO */}
        <View style={styles.profileHero}>
          <Image
            source={{ uri: user.avatar }}
            style={[
              styles.heroAvatar,
              user.isBanned && { borderColor: "#ef4444", opacity: 0.7 },
            ]}
          />
          <View style={{ flex: 1, marginLeft: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                style={[
                  styles.heroName,
                  user.isBanned && { textDecorationLine: "line-through" },
                ]}
              >
                {user.name}
              </Text>
              {user.isBanned && (
                <View style={styles.banBadge}>
                  <Text style={styles.banBadgeText}>BANNED</Text>
                </View>
              )}
            </View>
            <Text style={styles.heroSub}>
              @{user.username} • {user.email}
            </Text>

            <View style={styles.tagsRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{user.role}</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{user.class}</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{user.targetExam}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ⚡ ACTION BAR */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" },
            ]}
            onPress={giftCoins}
            disabled={processing || user.isBanned}
          >
            <Ionicons name="gift" size={18} color="#059669" />
            <Text style={[styles.actionBtnText, { color: "#059669" }]}>
              Gift 100 Coins
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              user.isBanned
                ? { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }
                : { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
            ]}
            onPress={toggleBan}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <>
                <Ionicons
                  name={user.isBanned ? "shield-checkmark" : "ban"}
                  size={18}
                  color={user.isBanned ? "#2563eb" : "#ef4444"}
                />
                <Text
                  style={[
                    styles.actionBtnText,
                    { color: user.isBanned ? "#2563eb" : "#ef4444" },
                  ]}
                >
                  {user.isBanned ? "Unban User" : "Ban User"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* 📈 STATS GRID */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>EduCoins</Text>
            <Text style={styles.statVal}>{user.eduCoins}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total XP</Text>
            <Text style={styles.statVal}>{user.xp}</Text>
          </View>
          <View style={[styles.statBox, { borderRightWidth: 0 }]}>
            <Text style={styles.statLabel}>Joined Date</Text>
            <Text style={[styles.statVal, { fontSize: 14 }]}>
              {user.joinedAt.toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* 🕰️ TIMELINE / ACTIVITY FEED */}
        <Text style={styles.sectionTitle}>Full Activity Timeline</Text>
        <View style={styles.timelineContainer}>
          {timeline.length === 0 ? (
            <Text style={styles.emptyText}>
              No activity recorded for this user yet.
            </Text>
          ) : (
            timeline.map((act, index) => (
              <View key={act.id + index} style={styles.timelineRow}>
                {/* Connecting Line & Icon */}
                <View style={styles.timelineLeft}>
                  <View style={styles.timelineIconBg}>
                    {renderActivityIcon(act.type)}
                  </View>
                  {index !== timeline.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                </View>

                {/* Activity Details */}
                <View style={styles.timelineContent}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <Text style={styles.actTitle}>{act.title}</Text>
                    <Text style={styles.actTime}>
                      {act.timestamp.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                  <Text style={styles.actSub} numberOfLines={3}>
                    {act.subtitle}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  backBtn: { padding: 8, backgroundColor: "#f1f5f9", borderRadius: 10 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  scrollContent: { padding: 20, paddingBottom: 60 },

  profileHero: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 20,
  },
  heroAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#f1f5f9",
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  heroName: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
    marginRight: 8,
  },
  banBadge: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  banBadgeText: { color: "#fff", fontSize: 10, fontWeight: "900" },
  heroSub: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
    marginTop: 4,
    marginBottom: 10,
  },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
  },

  actionBar: { flexDirection: "row", gap: 15, marginBottom: 25 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 14, fontWeight: "800", marginLeft: 8 },

  statsGrid: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 30,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    borderRightWidth: 1,
    borderColor: "#f1f5f9",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94a3b8",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  statVal: { fontSize: 18, fontWeight: "900", color: "#0f172a" },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 15,
  },

  timelineContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 20,
  },
  emptyText: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "500",
  },
  timelineRow: { flexDirection: "row" },
  timelineLeft: { alignItems: "center", marginRight: 15, width: 30 },
  timelineIconBg: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    zIndex: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#f1f5f9",
    marginTop: -5,
    marginBottom: -5,
    zIndex: 1,
  },

  timelineContent: { flex: 1, paddingBottom: 25, paddingTop: 4 },
  actTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  actTime: { fontSize: 11, color: "#94a3b8", fontWeight: "600" },
  actSub: { fontSize: 13, color: "#475569", lineHeight: 20, fontWeight: "500" },
});
