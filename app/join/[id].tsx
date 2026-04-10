import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    FadeIn,
    FadeInDown,
    SlideInUp,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../core/firebase/firebaseConfig"; // Path adjust kar lena agar zaroorat ho

export default function JoinGroupScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;

  const [groupData, setGroupData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [alreadyMember, setAlreadyMember] = useState(false);

  // ==========================================
  // 🚀 FETCH GROUP DETAILS
  // ==========================================
  useEffect(() => {
    const fetchGroup = async () => {
      if (!id) return;
      try {
        const groupDoc = await getDoc(doc(db, "groups", id as string));
        if (groupDoc.exists()) {
          const data = groupDoc.data();
          setGroupData({ id: groupDoc.id, ...data });

          // Check agar user pehle se hi group me hai
          const membersList = data.members || data.participants || [];
          if (currentUid && membersList.includes(currentUid)) {
            setAlreadyMember(true);
          }
        }
      } catch (error) {
        console.log("Error fetching invite:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [id, currentUid]);

  // ==========================================
  // 🤝 JOIN GROUP LOGIC
  // ==========================================
  const handleJoinGroup = async () => {
    if (!currentUid) {
      Alert.alert("Login Required", "Please login to join this study group.");
      router.push("/auth");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsJoining(true);

    try {
      // Firebase ArrayUnion se current user ko members list me daal do
      await updateDoc(doc(db, "groups", id as string), {
        members: arrayUnion(currentUid),
        participants: arrayUnion(currentUid), // Backup for older structure
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Join hone ke baad direct us group ke chat page par bhej do
      router.replace(`/chat/${id}`);
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Could not join the group. Try again.");
      setIsJoining(false);
    }
  };

  // ==========================================
  // 💀 LOADING & ERROR STATES
  // ==========================================
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Fetching invite details...</Text>
      </View>
    );
  }

  if (!groupData) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="link-outline" size={80} color="#cbd5e1" />
        <Text style={styles.errorText}>Invalid or Expired Invite Link</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace("/(tabs)/explore")}
        >
          <Text style={styles.backBtnText}>Go to Explore</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ==========================================
  // 🎨 RENDER MAIN INVITE UI
  // ==========================================
  const totalMembers =
    groupData.members?.length || groupData.participants?.length || 1;
  const groupIcon =
    groupData.icon ||
    `https://ui-avatars.com/api/?name=${groupData.name}&background=1e293b&color=fff&size=200`;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* 🌌 Background Blobs (Premium feel) */}
      <View style={styles.bgBlobs}>
        <Animated.View
          entering={FadeIn.duration(1000)}
          style={[
            styles.blob,
            {
              top: -100,
              left: -50,
              backgroundColor: "rgba(79, 70, 229, 0.15)",
            },
          ]}
        />
        <Animated.View
          entering={FadeIn.duration(1500)}
          style={[
            styles.blob,
            {
              bottom: -150,
              right: -50,
              backgroundColor: "rgba(236, 72, 153, 0.1)",
            },
          ]}
        />
      </View>

      <View style={styles.content}>
        {/* Top Logo */}
        <Animated.View
          entering={SlideInUp.duration(600).springify()}
          style={styles.topLogo}
        >
          <Text style={styles.appName}>Eduxity</Text>
        </Animated.View>

        {/* 🃏 The Invite Card */}
        <Animated.View
          entering={FadeInDown.duration(800).springify().damping(15)}
          style={styles.inviteCard}
        >
          <Text style={styles.inviteLabel}>You've been invited to join</Text>

          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: groupIcon }}
              style={styles.groupAvatar}
              contentFit="cover"
            />
            <View style={styles.onlineBadge} />
          </View>

          <Text style={styles.groupName} numberOfLines={2}>
            {groupData.name}
          </Text>
          <Text style={styles.memberCount}>
            <Ionicons name="people" size={14} color="#64748b" /> {totalMembers}{" "}
            Members
          </Text>

          {groupData.description && (
            <View style={styles.descBox}>
              <Text style={styles.groupDesc} numberOfLines={3}>
                {groupData.description}
              </Text>
            </View>
          )}

          <View style={styles.tagsRow}>
            <View style={styles.tagPill}>
              <Text style={styles.tagText}>
                {groupData.category || groupData.subject || "Study"}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* 🔘 ACTION BUTTONS */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(800).springify()}
          style={styles.actionContainer}
        >
          {alreadyMember ? (
            <TouchableOpacity
              style={styles.openChatBtn}
              onPress={() => router.replace(`/chat/${id}`)}
            >
              <Text style={styles.openChatBtnText}>Open Group Chat</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.joinBtnWrapper}
              onPress={handleJoinGroup}
              disabled={isJoining}
            >
              <LinearGradient
                colors={["#4f46e5", "#3b82f6"]}
                style={styles.joinBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isJoining ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Text style={styles.joinBtnText}>Accept Invite</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color="#fff"
                      style={{ marginLeft: 8 }}
                    />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelBtnText}>No, thanks</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 DISCORD-LEVEL STYLING
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 20,
  },
  loadingText: { marginTop: 15, color: "#64748b", fontWeight: "700" },
  errorText: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
  },
  backBtn: {
    marginTop: 25,
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: { color: "#0f172a", fontWeight: "700" },

  bgBlobs: { ...StyleSheet.absoluteFillObject, overflow: "hidden", zIndex: -1 },
  blob: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    filter: "blur(50px)",
  },

  content: { flex: 1, paddingHorizontal: 20, justifyContent: "center" },

  topLogo: { alignItems: "center", marginBottom: 40 },
  appName: {
    fontSize: 24,
    fontWeight: "900",
    color: "#4f46e5",
    letterSpacing: -0.5,
  },

  inviteCard: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 25,
    alignItems: "center",
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
    elevation: 5,
    marginBottom: 30,
  },
  inviteLabel: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 20,
  },

  avatarContainer: { position: "relative", marginBottom: 15 },
  groupAvatar: {
    width: 100,
    height: 100,
    borderRadius: 35,
    backgroundColor: "#f1f5f9",
    borderWidth: 2,
    borderColor: "#f8fafc",
  },
  onlineBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#10b981",
    borderWidth: 4,
    borderColor: "#fff",
  },

  groupName: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  memberCount: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "700",
    marginBottom: 20,
  },

  descBox: {
    backgroundColor: "#f1f5f9",
    padding: 15,
    borderRadius: 16,
    width: "100%",
    marginBottom: 20,
  },
  groupDesc: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 20,
    textAlign: "center",
  },

  tagsRow: { flexDirection: "row", justifyContent: "center" },
  tagPill: {
    backgroundColor: "#eef2ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tagText: { color: "#4f46e5", fontSize: 12, fontWeight: "800" },

  actionContainer: { alignItems: "center", width: "100%" },

  joinBtnWrapper: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
    elevation: 8,
    marginBottom: 15,
  },
  joinBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
  },
  joinBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  openChatBtn: {
    width: "100%",
    backgroundColor: "#10b981",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 15,
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
    elevation: 8,
  },
  openChatBtnText: { color: "#fff", fontSize: 16, fontWeight: "900" },

  cancelBtn: { paddingVertical: 10 },
  cancelBtnText: { color: "#64748b", fontSize: 15, fontWeight: "700" },
});
