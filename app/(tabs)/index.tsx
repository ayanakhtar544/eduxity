// Location: app/(tabs)/index.tsx
import React, { useState, useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  Layout,
  ZoomIn,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

// 🔥 CORE LAYER (Data & Logic)
import { useUserStore } from "../../store/useUserStore";
import { useFeedData } from "../../hooks/queries/useFeedData"; 
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "../../core/firebase/firebaseConfig";

// 🎨 UI COMPONENTS
import SidebarMenu from "../../components/layout/SidebarMenu";
import TopHeader from "../../components/layout/TopHeader";
import FeedItemRenderer from "../../components/feed/FeedItemRenderer"; 

const { width } = Dimensions.get("window");
const LOGO_HEADER_H = 60;
const TABS_H = 50;
const TOTAL_HIDABLE_H = LOGO_HEADER_H + TABS_H;
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

// ==========================================
// 🌟 MAIN AI FEED SCREEN
// ==========================================
export default function AILearningFeedScreen() {
  const router = useRouter();
  
  // 🧠 GLOBAL STATE
  const { currentUser, userProfile } = useUserStore();
  const currentUid = currentUser?.uid;

  // 🎛️ LOCAL UI STATE
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [feedType, setFeedType] = useState<"FOR_YOU" | "PERSONALIZED">("FOR_YOU");
  const [searchQuery, setSearchQuery] = useState("");

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedSessionTopic, setSelectedSessionTopic] = useState<string | null>(null);

  const [streak, setStreak] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);

  const scrollY = useSharedValue(0);
  const diffClampY = useSharedValue(0);

  // ============================================================================
  // 📡 INFINITE QUERY INJECTION
  // ============================================================================
  const { 
    data, 
    isLoading, 
    isFetching, 
    refetch, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useFeedData(currentUid, feedType, selectedSessionId, selectedSessionTopic, userProfile, streak, wrongStreak);

  // 🗂️ HISTORY VAULT QUERY
  const { data: historySessions = [] } = useQuery({
    queryKey: ["history_sessions", currentUid],
    enabled: !!currentUid,
    queryFn: async () => {
      const q = query( collection(db, "generation_sessions"), where("userId", "==", currentUid), limit(50));
      const snap = await getDocs(q);
      const mySessions = snap.docs.map(doc => doc.data());
      return snap.docs.map(doc => doc.data()).filter(s => s.userId === currentUid);
    },
  });

  // 🎢 SCROLL HANDLERS
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      const currentY = e.contentOffset.y;
      const diff = currentY - scrollY.value;
      if (currentY < 0) diffClampY.value = 0; 
      else diffClampY.value = Math.max(0, Math.min(TOTAL_HIDABLE_H, diffClampY.value + diff));
      scrollY.value = currentY;
    },
  });

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(diffClampY.value, [0, TABS_H, TOTAL_HIDABLE_H], [0, 0, -LOGO_HEADER_H], Extrapolation.CLAMP) }] 
  }));
  const tabsStyle = useAnimatedStyle(() => ({ 
    transform: [{ translateY: interpolate(diffClampY.value, [0, 0, TABS_H + LOGO_HEADER_H], [0, 0, -(TABS_H + LOGO_HEADER_H)], Extrapolation.CLAMP) }] 
  }));

  // ============================================================================
  // 🔥 STABLE MEMORY OPTIMIZATIONS
  // ============================================================================
  
  // Flattening React Query pages cleanly and ensuring unique IDs so FlatList never crashes
  const flattenedPosts = useMemo(() => {
    if (!data) return [];
    const allPosts = data.pages.flatMap(page => page.posts);
    // Bulletproof de-duplication
    return Array.from(new Map(allPosts.map(item => [item.id, item])).values());
  }, [data]);

  const handleCorrect = useCallback(() => {
    setStreak((s) => s + 1);
    setWrongStreak(0);
  }, []);

  const handleWrong = useCallback(() => {
    setStreak(0);
    setWrongStreak((w) => w + 1);
  }, []);

  const renderFeedItem = useCallback(({ item }: { item: any }) => (
    <FeedItemRenderer 
      item={item} 
      currentUid={currentUid} 
      onCorrect={handleCorrect} 
      onWrong={handleWrong} 
    />
  ), [currentUid, handleCorrect, handleWrong]);

  const keyExtractor = useCallback((item: any) => String(item.id), []);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ============================================================================
  // 📱 UI RENDER
  // ============================================================================
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <SidebarMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} currentUid={currentUid} />

      {/* 🗂️ HISTORY MODAL */}
      <Modal visible={showHistoryModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>My Resource Vault 🗂️</Text>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                <Ionicons name="close-circle" size={28} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Jump back into your previous learning sessions.</Text>

            <ScrollView style={{ marginTop: 15 }} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.historyItem, !selectedSessionId && styles.historyItemActive]}
                onPress={() => { setSelectedSessionId(null); setSelectedSessionTopic(null); setShowHistoryModal(false); }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="grid" size={20} color={!selectedSessionId ? "#fff" : "#4f46e5"} style={{ marginRight: 10 }} />
                  <View>
                    <Text style={[styles.historyText, !selectedSessionId && { color: "#fff" }]}>All My Spaces</Text>
                    <Text style={[styles.historyMeta, !selectedSessionId && { color: "#c7d2fe" }]}>Mixed feed of all resources</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {historySessions.map((session, idx) => {
                const dateObj = session.createdAt?.toDate ? session.createdAt.toDate() : new Date();
                const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

                return (
                  <TouchableOpacity
                    key={session.id || idx}
                    style={[styles.historyItem, selectedSessionId === session.id && styles.historyItemActive]}
                    onPress={() => { setSelectedSessionId(session.id); setSelectedSessionTopic(session.topic); setShowHistoryModal(false); }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Ionicons name="folder-open" size={20} color={selectedSessionId === session.id ? "#fff" : "#94a3b8"} style={{ marginRight: 10 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.historyText, selectedSessionId === session.id && { color: "#fff" }]} numberOfLines={1}>
                          {session.topic}
                        </Text>
                        <Text style={[styles.historyMeta, selectedSessionId === session.id && { color: "#c7d2fe" }]}>
                          {session.language || "Hinglish"} • {dateStr}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={{ flex: 1, position: "relative" }}>
        {/* TABS */}
        <Animated.View style={[styles.feedTabsContainer, { zIndex: 2, top: LOGO_HEADER_H }, tabsStyle]}>
          <View style={{ flexDirection: "row", flex: 1 }}>
            <TouchableOpacity style={[styles.feedTab, feedType === "FOR_YOU" && styles.feedTabActive]} onPress={() => { setFeedType("FOR_YOU"); setSelectedSessionId(null); }}>
              <Text style={[styles.feedTabText, feedType === "FOR_YOU" && styles.feedTabTextActive]}>For You</Text>
              {feedType === "FOR_YOU" && <Animated.View layout={Layout.springify()} style={styles.activeTabIndicator} />}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.feedTab, feedType === "PERSONALIZED" && styles.feedTabActive]} onPress={() => setFeedType("PERSONALIZED")}>
              <Text style={[styles.feedTabText, feedType === "PERSONALIZED" && styles.feedTabTextActive]}>My Space</Text>
              {feedType === "PERSONALIZED" && <Animated.View layout={Layout.springify()} style={styles.activeTabIndicator} />}
            </TouchableOpacity>
          </View>
          
          {feedType === "PERSONALIZED" && (
            <TouchableOpacity style={styles.historyBtn} onPress={() => setShowHistoryModal(true)}>
              <Ionicons name="folder" size={18} color="#4f46e5" />
              <Text style={styles.historyBtnTxt}>Vault</Text>
            </TouchableOpacity>
          )}
          
          {feedType !== "PERSONALIZED" && streak > 0 && (
            <Animated.View entering={ZoomIn} style={styles.streakBox}>
              <Ionicons name="flame" size={18} color="#f97316" />
              <Text style={styles.streakText}>{streak}</Text>
            </Animated.View>
          )}
        </Animated.View>

        {/* HEADER */}
        <Animated.View style={[styles.logoHeaderWrapper, { zIndex: 3, top: 0 }, headerStyle]}>
          <TopHeader setIsMenuOpen={setIsMenuOpen} unreadCount={0} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        </Animated.View>

        {/* FEED LIST */}
        {isLoading && flattenedPosts.length === 0 ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text style={{ color: "#64748b", marginTop: 10, fontWeight: "600" }}>Loading Feed...</Text>
          </View>
        ) : (
          <AnimatedFlatList
            data={flattenedPosts}
            keyExtractor={keyExtractor}
            renderItem={renderFeedItem}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingTop: LOGO_HEADER_H + TABS_H + 20, paddingBottom: 120 }}
            refreshControl={<RefreshControl refreshing={isFetching && !isFetchingNextPage} onRefresh={() => refetch()} tintColor="#4f46e5" />}
            
            // 🔥 PERFORMANCE OPTIMIZATIONS
            removeClippedSubviews={Platform.OS === 'android'} 
            maxToRenderPerBatch={5}
            initialNumToRender={5}
            windowSize={5}

            ListFooterComponent={
              hasNextPage ? (
                <View style={{ paddingVertical: 20, alignItems: "center" }}>
                  <TouchableOpacity style={styles.loadMoreBtn} onPress={handleLoadMore} disabled={isFetchingNextPage}>
                    {isFetchingNextPage ? <ActivityIndicator color="#fff" /> : <Text style={styles.loadMoreText}>Dive Deeper 🚀</Text>}
                  </TouchableOpacity>
                </View>
              ) : null
            }
          />
        )}
      </View>
      
      <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={() => router.push("/resources")}>
        <View style={styles.fabInner}><Ionicons name="sparkles" size={28} color="#fde047" /></View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  logoHeaderWrapper: { position: "absolute", width: "100%", height: LOGO_HEADER_H, backgroundColor: "#f8fafc" },
  feedTabsContainer: { position: "absolute", width: "100%", height: TABS_H, flexDirection: "row", backgroundColor: "#f8fafc", borderBottomWidth: 1, borderColor: "#e2e8f0", paddingHorizontal: 20, alignItems: "center" },
  feedTab: { flex: 1, alignItems: "center", paddingVertical: 14, position: "relative" },
  feedTabText: { fontSize: 15, fontWeight: "700", color: "#64748b" },
  feedTabTextActive: { color: "#0f172a", fontWeight: "900" },
  activeTabIndicator: { position: "absolute", bottom: -1, width: 40, height: 4, backgroundColor: "#4f46e5", borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  historyBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#eef2ff", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: "#c7d2fe" },
  historyBtnTxt: { fontSize: 12, fontWeight: "800", color: "#4f46e5", marginLeft: 4 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", height: "70%", borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1, elevation: 10 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: 20, fontWeight: "900", color: "#0f172a" },
  modalSub: { fontSize: 14, color: "#64748b", marginTop: 5, fontWeight: "500" },
  historyItem: { padding: 16, backgroundColor: "#f8fafc", borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: "#e2e8f0" },
  historyItemActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  historyText: { fontSize: 15, fontWeight: "700", color: "#334155" },
  historyMeta: { fontSize: 12, color: "#64748b", marginTop: 4, fontWeight: "600" },
  streakBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#ffedd5", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#fdba74" },
  streakText: { fontSize: 16, fontWeight: "900", color: "#ea580c", marginLeft: 4 },
  fab: { position: "absolute", bottom: Platform.OS === "ios" ? 100 : 90, right: 20, zIndex: 100 },
  fabInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center", elevation: 10 },
  loadMoreBtn: { backgroundColor: "#0f172a", paddingHorizontal: 30, paddingVertical: 14, borderRadius: 20, elevation: 4, minWidth: 200, alignItems: "center" },
  loadMoreText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});