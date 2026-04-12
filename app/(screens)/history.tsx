// Location: app/(screens)/history.tsx
import { apiClient } from "@/core/network/apiClient";
import { useUserStore } from "@/store/useUserStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

interface SessionHistory {
  id: string;
  topic: string;
  language: string;
  totalGenerated: number;
  createdAt: string;
  itemCount: number;
}

export default function HistoryScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const [sessions, setSessions] = useState<SessionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSessionHistory();
  }, [user?.uid]);

  const fetchSessionHistory = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const response = await apiClient<SessionHistory[]>(
        "/api/sessions/history",
        {
          method: "GET",
        },
      );
      setSessions(response.data || []);
    } catch (error) {
      console.error("Failed to fetch history:", error);
      Alert.alert("Error", "Failed to load session history");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSessionHistory();
    setRefreshing(false);
  };

  const handleDeleteSession = async (sessionId: string) => {
    Alert.alert(
      "Delete Session",
      "Are you sure you want to delete this session? This action cannot be undone.",
      [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await apiClient(`/api/sessions/${sessionId}`, {
                method: "DELETE",
              });
              setSessions((prev) => prev.filter((s) => s.id !== sessionId));
              Alert.alert("Success", "Session deleted successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to delete session");
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  const renderSession = ({ item }: { item: SessionHistory; index: number }) => {
    const createdDate = new Date(item.createdAt);
    const formattedDate = createdDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const formattedTime = createdDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <Animated.View entering={FadeInDown} style={styles.sessionCard}>
        <View style={styles.cardHeader}>
          <View style={styles.titleSection}>
            <Text style={styles.topic} numberOfLines={2}>
              {item.topic}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.badge}>
                <Ionicons name="language" size={12} color="#4f46e5" />
                <Text style={styles.badgeText}>{item.language}</Text>
              </View>
              <Text style={styles.postCount}>
                <Ionicons name="layers" size={12} color="#64748b" />{" "}
                {item.itemCount} posts
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDeleteSession(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>{formattedDate}</Text>
          <Text style={styles.timeText}>{formattedTime}</Text>
        </View>

        <TouchableOpacity
          style={styles.viewBtn}
          onPress={() => router.push(`/session/${item.id}`)}
        >
          <Text style={styles.viewBtnText}>View Posts</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Loading your history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Generation History</Text>
        <View style={{ width: 24 }} />
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="folder-open-outline" size={60} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No sessions yet</Text>
          <Text style={styles.emptySubtitle}>
            Generate your first batch of learning posts to see history here
          </Text>
          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => router.push("/resources")}
          >
            <Ionicons name="sparkles" size={20} color="#fff" />
            <Text style={styles.startBtnText}>Generate Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={renderSession}
          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
    fontWeight: "600",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },

  listContent: { padding: 16, paddingBottom: 30 },

  sessionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  titleSection: { flex: 1, marginRight: 12 },
  topic: { fontSize: 16, fontWeight: "800", color: "#0f172a", lineHeight: 22 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eef2ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: "#4f46e5",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 4,
  },
  postCount: { fontSize: 12, color: "#64748b", fontWeight: "600" },
  deleteBtn: { padding: 8 },

  cardFooter: { flexDirection: "row", gap: 16, marginBottom: 12 },
  dateText: { fontSize: 13, color: "#475569", fontWeight: "600" },
  timeText: { fontSize: 13, color: "#94a3b8", fontWeight: "600" },

  viewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4f46e5",
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  viewBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4f46e5",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 24,
    gap: 8,
  },
  startBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
