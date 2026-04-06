// Location: components/feed/MySpaceFeed.tsx
import React, { useState, useCallback, useMemo } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet, Platform, Modal, ScrollView } from "react-native";
import Animated from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { useRouter } from "expo-router";

// Core Paths
import { db } from "../../core/firebase/firebaseConfig";
import { useUserStore } from "../../store/useUserStore";
import { useFeedData } from "../../hooks/queries/useFeedData";
import FeedItemRenderer from "./FeedItemRenderer";

const AnimatedFlatList = Animated.createAnimatedComponent(Animated.FlatList);

export default function MySpaceFeed({ onScroll, searchQuery = "" }: { onScroll?: any, searchQuery?: string }) {
  const router = useRouter();
  const { user, userProfile } = useUserStore();
  const currentUid = user?.uid;

  // Local State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedSessionTopic, setSelectedSessionTopic] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);

  // 📡 FETCH PERSONALIZED DATA
  const { 
    data, isLoading, isFetching, refetch, fetchNextPage, hasNextPage, isFetchingNextPage 
  } = useFeedData(currentUid, "PERSONALIZED", selectedSessionId, selectedSessionTopic, userProfile, streak, wrongStreak);

  // 🗂️ FETCH VAULT HISTORY
  const { data: historySessions = [] } = useQuery({
    queryKey: ["history_sessions", currentUid],
    enabled: !!currentUid,
    queryFn: async () => {
      const q = query(
        collection(db, "generation_sessions"), 
        where("userId", "==", currentUid), 
        orderBy("createdAt", "desc"),
        limit(30)
      );
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
  });

  // 🔥 ADVANCED TIMELINE GROUPING (By Date)
  const groupedHistory = useMemo(() => {
    if (!historySessions.length) return [];
    
    const groups: Record<string, any[]> = {};

    historySessions.forEach((session: any) => {
      const dateObj = session.createdAt?.toDate ? session.createdAt.toDate() : new Date();
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const isToday = dateObj.toDateString() === today.toDateString();
      const isYesterday = dateObj.toDateString() === yesterday.toDateString();

      let dateLabel = dateObj.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      if (isToday) dateLabel = "Today";
      else if (isYesterday) dateLabel = "Yesterday";

      if (!groups[dateLabel]) groups[dateLabel] = [];
      groups[dateLabel].push(session);
    });

    return Object.entries(groups).map(([date, sessions]) => ({ date, sessions }));
  }, [historySessions]);

  // 🧠 FLATLIST MEMORY OPTIMIZATION
  const flattenedPosts = useMemo(() => {
    if (!data) return [];
    let allPosts = data.pages.flatMap(page => page.posts);
    
    let filtered = Array.from(new Map(allPosts.map(item => [item.id, item])).values());
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(post => 
        post.topic?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        post.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [data, searchQuery]);

  const renderFeedItem = useCallback(({ item }: { item: any }) => (
    <FeedItemRenderer 
      item={item} currentUid={currentUid} 
      onCorrect={() => setStreak(s => s + 1)} 
      onWrong={() => { setStreak(0); setWrongStreak(w => w + 1); }} 
    />
  ), [currentUid]);

  return (
    <View style={styles.container}>
      
      {/* 🗂️ ADVANCED TIMELINE MODAL */}
      <Modal visible={showHistoryModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Study History</Text>
                <Text style={styles.modalSub}>Your personalized timeline</Text>
              </View>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ marginTop: 20 }} showsVerticalScrollIndicator={false}>
              
              {/* All Spaces Reset Button */}
              <TouchableOpacity
                style={[styles.allSpacesBtn, !selectedSessionId && styles.activeSpaceBtn]}
                onPress={() => { setSelectedSessionId(null); setSelectedSessionTopic(null); setShowHistoryModal(false); }}
              >
                <Ionicons name="apps" size={20} color={!selectedSessionId ? "#fff" : "#4f46e5"} />
                <Text style={[styles.allSpacesTxt, !selectedSessionId && { color: "#fff" }]}>View All Spaces (Mixed Feed)</Text>
              </TouchableOpacity>

              {/* TIMELINE RENDERER */}
              <View style={styles.timelineWrapper}>
                {groupedHistory.map((group, groupIdx) => (
                  <View key={group.date} style={styles.timelineGroup}>
                    
                    {/* Date Badge */}
                    <View style={styles.dateBadge}>
                      <Text style={styles.dateText}>{group.date}</Text>
                    </View>

                    {/* Sessions inside the Date */}
                    {group.sessions.map((session: any, idx: number) => {
                      const isLastItem = idx === group.sessions.length - 1 && groupIdx === groupedHistory.length - 1;
                      const isActive = selectedSessionId === session.id;

                      return (
                        <View key={session.id} style={styles.timelineItem}>
                          {/* Vertical Line & Dot */}
                          <View style={styles.timelineNode}>
                            <View style={[styles.dot, isActive && styles.dotActive]} />
                            {!isLastItem && <View style={styles.verticalLine} />}
                          </View>

                          {/* Content Card */}
                          <TouchableOpacity
                            style={[styles.sessionCard, isActive && styles.sessionCardActive]}
                            onPress={() => { setSelectedSessionId(session.id); setSelectedSessionTopic(session.topic); setShowHistoryModal(false); }}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.sessionTitle, isActive && { color: "#fff" }]} numberOfLines={1}>
                              {session.topic}
                            </Text>
                            <Text style={[styles.sessionMeta, isActive && { color: "#c7d2fe" }]}>
                              {session.createdAt?.toDate ? session.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 📱 MAIN LIST */}
      <AnimatedFlatList
        onScroll={onScroll}
        scrollEventThrottle={16}
        data={flattenedPosts}
        keyExtractor={(item: any) => String(item.id)}
        renderItem={renderFeedItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === 'android'}
        refreshing={isFetching && !isFetchingNextPage}
        onRefresh={refetch}

        ListHeaderComponent={
          <View style={styles.historySection}>
            <TouchableOpacity style={styles.historyCard} onPress={() => setShowHistoryModal(true)} activeOpacity={0.8}>
              <View style={styles.iconCircle}>
                <Ionicons name={selectedSessionTopic ? "folder-open" : "time"} size={24} color="#4f46e5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{selectedSessionTopic || "Study History"}</Text>
                <Text style={styles.cardSub}>{selectedSessionTopic ? "Viewing specific session" : "Review previous sessions"}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        }

        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>Your space is empty. Generate some AI notes first!</Text>
            </View>
          ) : (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#4f46e5" />
              <Text style={styles.loadingText}>Loading your space...</Text>
            </View>
          )
        }

        ListFooterComponent={
          hasNextPage ? (
            <View style={{ paddingVertical: 20, alignItems: "center" }}>
              <TouchableOpacity style={styles.loadMoreBtn} onPress={() => fetchNextPage()} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? <ActivityIndicator color="#fff" /> : <Text style={styles.loadMoreText}>Load More</Text>}
              </TouchableOpacity>
            </View>
          ) : <View style={{ height: 100 }} />
        }
      />

      {/* 🚀 AI GENERATE FLOATING BUTTON */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push("/resources")}
        activeOpacity={0.9}
      >
        <Ionicons name="sparkles" size={22} color="#fff" />
        <Text style={styles.fabText}>Generate AI</Text>
      </TouchableOpacity>

    </View>
  );
}

// 🎨 ADVANCED STYLING
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 50 },
  loadingText: { color: "#64748b", marginTop: 10, fontWeight: "600" },
  emptyText: { color: "#94a3b8", fontSize: 16, fontWeight: "500", textAlign: "center", paddingHorizontal: 20 },
  listContainer: { paddingTop: 60, paddingBottom: 120 },
  
  historySection: { padding: 20, paddingBottom: 10 },
  historyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  iconCircle: { width: 45, height: 45, borderRadius: 22, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  cardSub: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  
  fab: { position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 80, right: 20, backgroundColor: '#4f46e5', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderRadius: 30, elevation: 8, shadowColor: '#4f46e5', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  fabText: { color: '#fff', fontWeight: '800', marginLeft: 8, fontSize: 15 },
  
  loadMoreBtn: { backgroundColor: "#0f172a", paddingHorizontal: 30, paddingVertical: 14, borderRadius: 20, minWidth: 200, alignItems: "center" },
  loadMoreText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  // --- MODAL & TIMELINE STYLES ---
  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.6)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", height: "80%", borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: 24, fontWeight: "900", color: "#0f172a", letterSpacing: -0.5 },
  modalSub: { fontSize: 15, color: "#64748b", marginTop: 4, fontWeight: "500" },
  closeBtn: { backgroundColor: '#f1f5f9', padding: 8, borderRadius: 20 },

  allSpacesBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eef2ff', padding: 16, borderRadius: 16, marginBottom: 25, borderWidth: 1, borderColor: '#c7d2fe' },
  activeSpaceBtn: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  allSpacesTxt: { color: '#4f46e5', fontWeight: '800', marginLeft: 10, fontSize: 15 },

  timelineWrapper: { paddingLeft: 10 },
  timelineGroup: { marginBottom: 20 },
  dateBadge: { backgroundColor: '#f1f5f9', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 15, marginLeft: 25 },
  dateText: { color: '#475569', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  timelineItem: { flexDirection: 'row', marginBottom: 15 },
  timelineNode: { width: 30, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#cbd5e1', zIndex: 2, marginTop: 18 },
  dotActive: { backgroundColor: '#4f46e5', shadowColor: '#4f46e5', shadowOpacity: 0.4, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  verticalLine: { width: 2, flex: 1, backgroundColor: '#e2e8f0', position: 'absolute', top: 30, bottom: -15, zIndex: 1 },
  
  sessionCard: { flex: 1, backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginLeft: 10 },
  sessionCardActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5', shadowColor: '#4f46e5', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  sessionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  sessionMeta: { fontSize: 13, color: '#64748b', marginTop: 6, fontWeight: '600' },
});