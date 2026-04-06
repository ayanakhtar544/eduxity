// Location: app/chat/info/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import {
    arrayRemove,
    arrayUnion,
    deleteDoc,
    doc,
    getDoc,
    onSnapshot,
    updateDoc,
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import Animated, {
    FadeInDown,
    FadeInUp,
    LinearTransition,
    SlideInDown,
    SlideOutDown,
} from "react-native-reanimated";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { auth, db } from "../../../core/firebase/firebaseConfig";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

export default function GroupInfoScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentUid = auth.currentUser?.uid;
  const qrRef = useRef<any>(null);

  const [groupData, setGroupData] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Members");
  const [showShareSheet, setShowShareSheet] = useState(false);

  const INVITE_LINK = `https://eduxity.com/join/${id}`;

  // ==========================================
  // 📡 REAL-TIME LISTENER
  // ==========================================
  useEffect(() => {
    if (!id) return;

    const unsub = onSnapshot(
      doc(db, "groups", id as string),
      async (groupDoc) => {
        if (groupDoc.exists()) {
          const data = groupDoc.data();
          setGroupData(data);

          // Fetch Members
          const memberIds = data.members || [];
          const memberPromises = memberIds.map((uid: string) =>
            getDoc(doc(db, "users", uid)),
          );
          const memberDocs = await Promise.all(memberPromises);
          setMembers(
            memberDocs
              .filter((d) => d.exists())
              .map((d) => ({ id: d.id, ...d.data() })),
          );

          // Fetch Pending Requests
          const pendingIds = data.pendingRequests || [];
          const pendingPromises = pendingIds.map((uid: string) =>
            getDoc(doc(db, "users", uid)),
          );
          const pendingDocs = await Promise.all(pendingPromises);
          setPendingUsers(
            pendingDocs
              .filter((d) => d.exists())
              .map((d) => ({ id: d.id, ...d.data() })),
          );

          setLoading(false);
        }
      },
    );

    return () => unsub();
  }, [id]);

  const adminId =
    groupData?.adminId || (groupData?.admins ? groupData.admins[0] : null);
  const isAdmin =
    currentUid === adminId || groupData?.admins?.includes(currentUid);

  // ==========================================
  // 🤝 ADMIN CONTROLS (APPROVE/REJECT)
  // ==========================================
  const handleApproveRequest = async (userId: string) => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await updateDoc(doc(db, "groups", id as string), {
        pendingRequests: arrayRemove(userId),
        members: arrayUnion(userId),
      });
    } catch (e) {
      Alert.alert("Error", "Could not approve user.");
    }
  };

  const handleRejectRequest = async (userId: string) => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await updateDoc(doc(db, "groups", id as string), {
        pendingRequests: arrayRemove(userId),
      });
    } catch (e) {
      console.log(e);
    }
  };

  // ==========================================
  // 📸 QR CODE DOWNLOAD (WEB + MOBILE)
  // ==========================================
  const downloadQR = () => {
    if (!qrRef.current) return;
    if (Platform.OS !== "web")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    qrRef.current.toDataURL(async (data: string) => {
      const base64Data = `data:image/png;base64,${data}`;

      if (Platform.OS === "web") {
        try {
          // Web Download Logic
          const link = document.createElement("a");
          link.href = base64Data;
          link.download = `Eduxity-${groupData?.name || "Group"}-QR.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (err) {
          alert("Couldn't download QR on Web.");
        }
      } else {
        try {
          // Mobile Share Logic
          const uri = FileSystem.cacheDirectory + "hub-qr.png";
          await FileSystem.writeAsStringAsync(uri, data, {
            encoding: FileSystem.EncodingType.Base64,
          });

          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, {
              mimeType: "image/png",
              dialogTitle: "Share Group QR",
            });
          } else {
            Alert.alert("Error", "Sharing not available on this device");
          }
        } catch (err) {
          console.log(err);
        }
      }
    });
  };

  // ==========================================
  // 🔗 SHARE & COPY
  // ==========================================
  const handleCopyLink = async () => {
    if (Platform.OS !== "web")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync(INVITE_LINK);
    Alert.alert("Link Copied!", "Share it with your friends.");
  };

  const handleCopyCode = async () => {
    if (!groupData?.inviteCode) return;
    if (Platform.OS !== "web")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync(groupData.inviteCode);
    Alert.alert("Code Copied!", `Invite Code: ${groupData.inviteCode}`);
  };

  // ==========================================
  // 🚪 DANGER ACTIONS
  // ==========================================
  const handleLeaveGroup = async () => {
    Alert.alert("Leave Group", "Are you sure you want to leave?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          await updateDoc(doc(db, "groups", id as string), {
            members: arrayRemove(currentUid),
          });
          router.replace("/(tabs)/explore");
        },
      },
    ]);
  };

  const handleDeleteGroup = async () => {
    Alert.alert("Delete Group", "Permanently delete this group for everyone?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteDoc(doc(db, "groups", id as string));
          router.replace("/(tabs)/explore");
        },
      },
    ]);
  };

  if (loading)
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );

  const groupIcon = groupData?.avatar || DEFAULT_AVATAR;

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <StatusBar barStyle="light-content" translucent />

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* 🎨 HEADER */}
        <View style={styles.coverPhotoContainer}>
          <LinearGradient
            colors={["#2563EB", "#4F46E5"]}
            style={styles.coverPhoto}
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.5)", "transparent"]}
            style={styles.headerGradient}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <Ionicons name="chevron-back" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowShareSheet(true)}
              style={styles.menuBtn}
            >
              <Ionicons name="qr-code-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* 🛡️ INFO CARD */}
        <Animated.View
          entering={FadeInDown.duration(500)}
          style={styles.infoContainer}
        >
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: groupIcon }} style={styles.avatar} />
            <View
              style={[
                styles.subjectBadge,
                groupData.isPrivate && { backgroundColor: "#ef4444" },
              ]}
            >
              <Ionicons
                name={groupData.isPrivate ? "lock-closed" : "earth"}
                size={10}
                color="#fff"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.subjectText}>
                {groupData.isPrivate ? "PRIVATE" : "PUBLIC"}
              </Text>
            </View>
          </View>

          <View style={styles.nameSection}>
            <Text style={styles.groupName}>{groupData.name}</Text>
            <Text style={styles.groupDesc}>
              {groupData.desc || "A premium study space on Eduxity."}
            </Text>
          </View>

          {/* 🔥 INVITE CODE BOX */}
          <TouchableOpacity
            style={styles.inviteCodeBox}
            onPress={handleCopyCode}
            activeOpacity={0.7}
          >
            <View style={styles.inviteCodeLabelRow}>
              <Ionicons name="key-outline" size={14} color="#4F46E5" />
              <Text style={styles.inviteCodeLabel}>INVITE CODE</Text>
            </View>
            <Text style={styles.inviteCodeValue}>{groupData.inviteCode}</Text>
            <View style={styles.copyIconBadge}>
              <Ionicons name="copy" size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{members.length}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{groupData.totalNotes || 0}</Text>
              <Text style={styles.statLabel}>Resources</Text>
            </View>
          </View>
        </Animated.View>

        {/* 📑 TABS */}
        <View style={styles.tabContainer}>
          {["Members", "Media"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => {
                setActiveTab(tab);
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
          {isAdmin && groupData.isPrivate && (
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === "Requests" && styles.tabBtnActive,
              ]}
              onPress={() => {
                setActiveTab("Requests");
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "Requests" && styles.tabTextActive,
                ]}
              >
                Requests {pendingUsers.length > 0 && `(${pendingUsers.length})`}
              </Text>
              {pendingUsers.length > 0 && <View style={styles.redDot} />}
            </TouchableOpacity>
          )}
        </View>

        {/* 📄 LIST CONTENT */}
        <View style={styles.tabContent}>
          {activeTab === "Members" &&
            members.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={styles.memberItem}
                onPress={() => router.push(`/user/${member.id}`)}
              >
                <Image
                  source={{ uri: member.photoURL || DEFAULT_AVATAR }}
                  style={styles.memberAvatar}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.memberName}>
                    {member.displayName || "Scholar"}
                  </Text>
                </View>
                {groupData.admins?.includes(member.id) && (
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminText}>Admin</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}

          {activeTab === "Requests" &&
            isAdmin &&
            (pendingUsers.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No pending requests.</Text>
              </View>
            ) : (
              pendingUsers.map((user) => (
                <Animated.View
                  key={user.id}
                  layout={LinearTransition}
                  entering={FadeInUp}
                  style={styles.pendingItem}
                >
                  <Image
                    source={{ uri: user.photoURL || DEFAULT_AVATAR }}
                    style={styles.memberAvatar}
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.memberName}>{user.displayName}</Text>
                    <Text style={styles.memberStatus}>Wants to join</Text>
                  </View>
                  <View style={styles.pendingActions}>
                    <TouchableOpacity
                      style={styles.rejBtn}
                      onPress={() => handleRejectRequest(user.id)}
                    >
                      <Ionicons name="close" size={20} color="#ef4444" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.accBtn}
                      onPress={() => handleApproveRequest(user.id)}
                    >
                      <Ionicons name="checkmark" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              ))
            ))}
          {activeTab === "Media" && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No media shared yet.</Text>
            </View>
          )}
        </View>

        {/* 🚪 EXIT STRATEGY */}
        <View style={{ padding: 20 }}>
          {isAdmin ? (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDeleteGroup}
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
              <Text style={styles.leaveBtnText}>Delete Group</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.leaveBtn}
              onPress={handleLeaveGroup}
            >
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text style={styles.leaveBtnText}>Leave Group</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* 📱 SHARE SHEET MODAL */}
      <Modal visible={showShareSheet} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBg}
            onPress={() => setShowShareSheet(false)}
          />
          <Animated.View
            entering={SlideInDown}
            exiting={SlideOutDown}
            style={styles.sheetContainer}
          >
            <View style={styles.dragHandle} />
            <Text style={styles.sheetTitle}>Invite to {groupData.name}</Text>

            <View style={styles.qrSection}>
              <View style={styles.qrWrapper}>
                <QRCode
                  value={INVITE_LINK}
                  size={160}
                  getRef={(c) => (qrRef.current = c)}
                />
              </View>
              <TouchableOpacity style={styles.qrShareBtn} onPress={downloadQR}>
                <Ionicons name="download-outline" size={18} color="#4F46E5" />
                <Text style={styles.qrShareText}>Download / Share QR</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inviteLinkBox}>
              <Text style={styles.linkTxt} numberOfLines={1}>
                {INVITE_LINK}
              </Text>
              <TouchableOpacity onPress={handleCopyLink}>
                <Ionicons name="copy-outline" size={20} color="#4F46E5" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  coverPhotoContainer: { height: 140, position: "relative" },
  coverPhoto: { width: "100%", height: "100%" },
  headerGradient: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: 100,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: 45,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  menuBtn: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  infoContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingHorizontal: 25,
    paddingBottom: 25,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  avatarWrapper: { marginTop: -50, position: "relative" },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: "#fff",
  },
  subjectBadge: {
    position: "absolute",
    bottom: -8,
    alignSelf: "center",
    backgroundColor: "#4F46E5",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fff",
  },
  subjectText: { color: "#fff", fontSize: 10, fontWeight: "900" },

  nameSection: { alignItems: "center", marginVertical: 15 },
  groupName: { fontSize: 24, fontWeight: "900", color: "#0f172a" },
  groupDesc: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginTop: 5,
  },

  inviteCodeBox: {
    backgroundColor: "#f0f7ff",
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#c7d2fe",
    borderStyle: "dashed",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  inviteCodeLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  inviteCodeLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#4F46E5",
    marginLeft: 5,
    letterSpacing: 1,
  },
  inviteCodeValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: 4,
  },
  copyIconBadge: {
    position: "absolute",
    right: 10,
    top: 10,
    backgroundColor: "#4F46E5",
    padding: 5,
    borderRadius: 8,
  },

  statsRow: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    padding: 15,
    width: "100%",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  statBox: { flex: 1, alignItems: "center" },
  statNumber: { fontSize: 18, fontWeight: "900", color: "#0f172a" },
  statLabel: { fontSize: 12, color: "#64748b", fontWeight: "600" },
  statDivider: { width: 1, height: "100%", backgroundColor: "#e2e8f0" },

  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 10,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
    position: "relative",
  },
  tabBtnActive: { borderBottomWidth: 3, borderColor: "#4F46E5" },
  tabText: { fontSize: 14, fontWeight: "700", color: "#94a3b8" },
  tabTextActive: { color: "#0f172a" },
  redDot: {
    position: "absolute",
    top: 12,
    right: "20%",
    width: 8,
    height: 8,
    backgroundColor: "#ef4444",
    borderRadius: 4,
  },

  tabContent: { padding: 20 },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f1f5f9",
  },
  memberName: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  adminBadge: {
    backgroundColor: "#eef2ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  adminText: { color: "#4F46E5", fontSize: 10, fontWeight: "900" },

  pendingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fffbeb",
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#fef08a",
  },
  memberStatus: { fontSize: 12, color: "#d97706", fontWeight: "600" },
  pendingActions: { flexDirection: "row", gap: 8 },
  accBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#10b981",
    justifyContent: "center",
    alignItems: "center",
  },
  rejBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fecaca",
  },

  leaveBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff1f2",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fecdd3",
  },
  deleteBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fef2f2",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  leaveBtnText: { color: "#ef4444", fontWeight: "800", marginLeft: 10 },

  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheetContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 25,
    alignItems: "center",
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#e2e8f0",
    borderRadius: 3,
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 20,
  },
  qrSection: { alignItems: "center", marginBottom: 20 },
  qrWrapper: {
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  qrShareBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#f0f7ff",
    borderRadius: 16,
  },
  qrShareText: {
    color: "#4F46E5",
    fontWeight: "800",
    fontSize: 14,
    marginLeft: 8,
  },
  inviteLinkBox: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    padding: 15,
    borderRadius: 16,
    width: "100%",
    marginBottom: 20,
  },
  linkTxt: { flex: 1, color: "#64748b", fontSize: 13, fontWeight: "600" },
  emptyState: { padding: 20, alignItems: "center" },
  emptyText: { color: "#94a3b8", fontWeight: "600" },
});
