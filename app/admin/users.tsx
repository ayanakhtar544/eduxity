// Location: app/admin/users.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 🔥 FIREBASE
import {
    collection,
    doc,
    getDocs,
    increment,
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
interface UserData {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  role: string;
  eduCoins: number;
  xp: number;
  isBanned: boolean;
  joinedAt: Date;
  targetExam?: string;
  class?: string;
  expoPushToken?: string;
}

interface UserActivity {
  id: string;
  type: string;
  text: string;
  createdAt: Date;
}

export default function AdvancedUsersManager() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // 🗃️ STATES
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // 🕵️ DETAILED VIEW (CRM MODAL) STATES
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  // ==========================================
  // 🧠 1. FETCH ALL USERS
  // ==========================================
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"), orderBy("joinedAt", "desc"));
      const snapshot = await getDocs(q);

      const fetchedUsers: UserData[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.displayName || data.name || "Unknown User",
          username: data.username || "no_username",
          email: data.email || "N/A",
          avatar: data.photoURL || data.avatar || DEFAULT_AVATAR,
          role: data.accountType || data.role || "Student",
          eduCoins: data.eduCoins || 0,
          xp: data.gamification?.xp || data.xp || 0,
          isBanned: data.isBanned === true,
          joinedAt: data.joinedAt?.toDate ? data.joinedAt.toDate() : new Date(),
          targetExam: data.targetExam || "N/A",
          class: data.class || "N/A",
          expoPushToken: data.expoPushToken || null,
        };
      });

      setUsers(fetchedUsers);
      setFilteredUsers(fetchedUsers);
    } catch (error) {
      console.error("❌ Error fetching users:", error);
      if (isWeb) window.alert("Failed to load users from database.");
      else Alert.alert("Error", "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    const lower = text.toLowerCase();
    if (lower === "") setFilteredUsers(users);
    else {
      setFilteredUsers(
        users.filter(
          (u) =>
            u.name.toLowerCase().includes(lower) ||
            u.email.toLowerCase().includes(lower) ||
            u.username.toLowerCase().includes(lower),
        ),
      );
    }
  };

  // ==========================================
  // 🧠 2. FETCH SPECIFIC USER'S ACTIVITY (ON DEMAND)
  // ==========================================
  const openUserDetails = (user: UserData) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();

    // 🔥 Modal kholne ki jagah naye page par push kar rahe hain
    router.push(`/admin/user/${user.id}`);
  };

  // ==========================================
  // ⚡ 3. ADMIN ACTIONS (BAN & GIFT COINS)
  // ==========================================
  const executeAction = async (actionType: "ban" | "gift", user: UserData) => {
    setProcessingAction(true);
    try {
      const userRef = doc(db, "users", user.id);

      if (actionType === "ban") {
        const newBanStatus = !user.isBanned;
        await updateDoc(userRef, { isBanned: newBanStatus });

        // Optimistic UI Updates
        const updatedUser = { ...user, isBanned: newBanStatus };
        setSelectedUser(updatedUser);
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? updatedUser : u)),
        );
        setFilteredUsers((prev) =>
          prev.map((u) => (u.id === user.id ? updatedUser : u)),
        );

        if (!isWeb)
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (isWeb)
          window.alert(
            `User has been successfully ${newBanStatus ? "BANNED" : "UNBANNED"}.`,
          );
      } else if (actionType === "gift") {
        await updateDoc(userRef, { eduCoins: increment(100) });

        // Optimistic UI Updates
        const updatedUser = { ...user, eduCoins: user.eduCoins + 100 };
        setSelectedUser(updatedUser);
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? updatedUser : u)),
        );
        setFilteredUsers((prev) =>
          prev.map((u) => (u.id === user.id ? updatedUser : u)),
        );

        if (!isWeb)
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (isWeb) window.alert(`100 EduCoins gifted to ${user.name}! 💰`);
      }
    } catch (error: any) {
      console.error("❌ Action Failed:", error);
      if (isWeb)
        window.alert(`Action failed: ${error.message}. Check Firebase Rules.`);
      else Alert.alert("Error", "Action failed. Check permissions.");
    } finally {
      setProcessingAction(false);
    }
  };

  const confirmAction = (actionType: "ban" | "gift", user: UserData) => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    let msg =
      actionType === "ban"
        ? `Are you sure you want to ${user.isBanned ? "UNBAN" : "BAN"} ${user.name}?`
        : `Gift 100 EduCoins to ${user.name}?`;

    if (isWeb) {
      if (window.confirm(msg)) executeAction(actionType, user);
    } else {
      Alert.alert(
        actionType === "ban" ? "Account Control" : "Gift Coins",
        msg,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Confirm",
            style: actionType === "ban" ? "destructive" : "default",
            onPress: () => executeAction(actionType, user),
          },
        ],
      );
    }
  };

  // ==========================================
  // 🎨 UI RENDERERS
  // ==========================================
  const renderUserListCard = ({ item }: { item: UserData }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => openUserDetails(item)}
      style={[styles.userCard, item.isBanned && styles.bannedCard]}
    >
      <Image
        source={{ uri: item.avatar }}
        style={[styles.listAvatar, item.isBanned && { opacity: 0.5 }]}
      />
      <View style={styles.listInfo}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text
            style={[
              styles.listName,
              item.isBanned && {
                textDecorationLine: "line-through",
                color: "#94a3b8",
              },
            ]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {item.isBanned && (
            <View style={styles.bannedBadge}>
              <Text style={styles.bannedBadgeText}>BANNED</Text>
            </View>
          )}
        </View>
        <Text style={styles.listEmail} numberOfLines={1}>
          {item.email}
        </Text>
      </View>
      <View style={styles.listArrow}>
        <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* 🎩 MAIN HEADER */}
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
            <Text style={styles.pageTitle}>User Directory</Text>
            <Text style={styles.pageSubtitle}>
              {filteredUsers.length} total users
            </Text>
          </View>
        </View>
      </View>

      {/* 🔍 SEARCH BAR */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => handleSearch("")}
            style={{ padding: 4 }}
          >
            <Ionicons name="close-circle" size={20} color="#cbd5e1" />
          </TouchableOpacity>
        )}
      </View>

      {/* 📜 USER LIST */}
      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color="#0f172a" />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUserListCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>No users found.</Text>
          )}
        />
      )}

      {/* ========================================== */}
      {/* 🕵️ DETAILED CRM MODAL (POPUPS OVER LIST) */}
      {/* ========================================== */}
      <Modal
        visible={!!selectedUser}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedUser(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { paddingBottom: insets.bottom || 20 },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Details</Text>
              <TouchableOpacity
                onPress={() => setSelectedUser(null)}
                style={styles.closeModalBtn}
              >
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* 1. Identity Section */}
                <View style={styles.identitySection}>
                  <Image
                    source={{ uri: selectedUser.avatar }}
                    style={styles.largeAvatar}
                  />
                  <Text style={styles.largeName}>{selectedUser.name}</Text>
                  <Text style={styles.largeEmail}>{selectedUser.email}</Text>

                  <View style={styles.tagsRow}>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>{selectedUser.role}</Text>
                    </View>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>{selectedUser.class}</Text>
                    </View>
                    {selectedUser.isBanned && (
                      <View
                        style={[
                          styles.tag,
                          {
                            backgroundColor: "#fef2f2",
                            borderColor: "#fecaca",
                          },
                        ]}
                      >
                        <Text style={[styles.tagText, { color: "#ef4444" }]}>
                          BANNED
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* 2. Stats Section */}
                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>EduCoins</Text>
                    <Text style={styles.statVal}>{selectedUser.eduCoins}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Total XP</Text>
                    <Text style={styles.statVal}>{selectedUser.xp}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Joined Date</Text>
                    <Text style={[styles.statVal, { fontSize: 14 }]}>
                      {selectedUser.joinedAt.toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {/* 3. Admin Action Controls */}
                <Text style={styles.sectionLabel}>ADMIN CONTROLS</Text>
                <View style={styles.actionGrid}>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" },
                    ]}
                    onPress={() => confirmAction("gift", selectedUser)}
                    disabled={processingAction || selectedUser.isBanned}
                  >
                    <Ionicons name="gift" size={18} color="#059669" />
                    <Text style={[styles.actionBtnText, { color: "#059669" }]}>
                      Gift 100 Coins
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      selectedUser.isBanned
                        ? { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }
                        : {
                            backgroundColor: "#fef2f2",
                            borderColor: "#fecaca",
                          },
                    ]}
                    onPress={() => confirmAction("ban", selectedUser)}
                    disabled={processingAction}
                  >
                    {processingAction ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <>
                        <Ionicons
                          name={
                            selectedUser.isBanned ? "shield-checkmark" : "ban"
                          }
                          size={18}
                          color={selectedUser.isBanned ? "#2563eb" : "#ef4444"}
                        />
                        <Text
                          style={[
                            styles.actionBtnText,
                            {
                              color: selectedUser.isBanned
                                ? "#2563eb"
                                : "#ef4444",
                            },
                          ]}
                        >
                          {selectedUser.isBanned ? "Unban User" : "Ban User"}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* 4. Activity Log (Posts) */}
                <Text style={[styles.sectionLabel, { marginTop: 30 }]}>
                  RECENT ACTIVITY (POSTS)
                </Text>
                <View style={styles.activityBox}>
                  {activityLoading ? (
                    <ActivityIndicator
                      size="small"
                      color="#94a3b8"
                      style={{ padding: 20 }}
                    />
                  ) : userActivities.length === 0 ? (
                    <Text style={styles.emptyActivity}>
                      No recent posts found for this user.
                    </Text>
                  ) : (
                    userActivities.map((act, index) => (
                      <View
                        key={act.id}
                        style={[
                          styles.activityItem,
                          index === userActivities.length - 1 && {
                            borderBottomWidth: 0,
                          },
                        ]}
                      >
                        <View style={styles.actDot} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.actText} numberOfLines={2}>
                            "{act.text}"
                          </Text>
                          <Text style={styles.actDate}>
                            {act.createdAt.toLocaleDateString()} at{" "}
                            {act.createdAt.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>

                <View style={{ height: 50 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ==========================================
// 🎨 PREMIUM CRM STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },

  // Header & Search
  header: {
    flexDirection: "row",
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
    color: "#2563eb",
    fontWeight: "700",
    marginTop: 2,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "500",
  },

  // Main List
  listContent: { padding: 20, paddingBottom: 100 },
  loaderCenter: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#94a3b8",
    fontWeight: "600",
  },

  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  bannedCard: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  listAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  listInfo: { flex: 1, marginLeft: 15 },
  listName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 2,
  },
  listEmail: { fontSize: 13, color: "#64748b", fontWeight: "500" },
  bannedBadge: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  bannedBadgeText: { color: "#fff", fontSize: 9, fontWeight: "900" },
  listArrow: { marginLeft: 10 },

  // 🚀 CRM MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#f8fafc",
    height: "85%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  closeModalBtn: { backgroundColor: "#e2e8f0", padding: 6, borderRadius: 20 },

  identitySection: { alignItems: "center", marginBottom: 25 },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#e2e8f0",
    marginBottom: 15,
  },
  largeName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 4,
  },
  largeEmail: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
    marginBottom: 15,
  },
  tagsRow: { flexDirection: "row", gap: 10 },
  tag: {
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  tagText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
  },

  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 25,
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

  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 5,
  },

  actionGrid: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 14, fontWeight: "800", marginLeft: 8 },

  activityBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 15,
  },
  emptyActivity: {
    padding: 20,
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "500",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  actDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#cbd5e1",
    marginTop: 6,
    marginRight: 15,
  },
  actText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    lineHeight: 20,
  },
  actDate: { fontSize: 11, color: "#94a3b8", fontWeight: "500", marginTop: 4 },
});
