// Location: components/feed/MySpaceFeed.tsx
import React, { useState, useMemo } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet, RefreshControl, LayoutAnimation, Platform, UIManager } from "react-native";
import Animated from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useUserStore } from "../../store/useUserStore";
import { useFeed } from "../../hooks/queries/useFeed";
import FeedItemRenderer from "./FeedItemRenderer";

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// 📦 SUB-COMPONENT: COLLAPSIBLE TOPIC BLOCK
const TopicBlock = ({ topicName, items, currentUid, isInitiallyExpanded = false }: any) => {
  const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded);

  // Mock Progress: Calculate completed items (You can map this to actual DB state later)
  const completedCount = items.filter((i: any) => i.isMastered).length || 0; // Replace with your actual completion logic
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={styles.topicBlockContainer}>
      {/* TOPIC HEADER */}
      <TouchableOpacity activeOpacity={0.8} style={styles.topicHeader} onPress={toggleExpand}>
        <View style={{ flex: 1 }}>
          <Text style={styles.topicTitle}>{topicName}</Text>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>{completedCount} / {totalCount} completed</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>
        </View>
        <View style={styles.toggleIconBtn}>
          <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={24} color="#64748b" />
        </View>
      </TouchableOpacity>

      {/* COLLAPSIBLE POSTS */}
      {isExpanded && (
        <View style={styles.topicContent}>
          {items.map((item: any, index: number) => (
            <FeedItemRenderer 
              key={item.id || index} 
              item={item} 
              currentUid={currentUid} 
            />
          ))}
          
          {completedCount === totalCount && totalCount > 0 ? (
             <View style={styles.topicCompleteMsg}>
                <Ionicons name="trophy" size={24} color="#f59e0b" />
                <Text style={styles.topicCompleteText}>Topic Mastered!</Text>
             </View>
          ) : (
            <TouchableOpacity style={styles.continueBtn} onPress={toggleExpand}>
              <Text style={styles.continueBtnText}>Collapse Topic</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

// 📱 MAIN FEED COMPONENT
export default function MySpaceFeed({ onScroll, searchQuery = "" }: { onScroll?: any, searchQuery?: string }) {
  const router = useRouter();
  const { user } = useUserStore();
  const currentUid = user?.uid;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data, isLoading, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed(currentUid, "PERSONALIZED");

 // 🧠 SMART GROUPING LOGIC (Group 15 posts by Topic)
  const groupedTopics = useMemo(() => {
    // 🚨 FIX: Add strict check for data and data.pages
    if (!data || !data.pages) return [];
    
    // 🚨 FIX: Use optional chaining (page?.items) so it doesn't crash on null pages
    let allPosts = data.pages.flatMap((page: any) => page?.items || []);
    
    // Filter by search
    if (searchQuery.trim() !== "") {
      allPosts = allPosts.filter((post: any) => 
        post?.topic?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Grouping
    const groups: Record<string, any[]> = {};
    allPosts.forEach((post: any) => {
      if (!post) return; // Safe guard for empty posts
      const topicName = post.topic || "General Learning";
      if (!groups[topicName]) groups[topicName] = [];
      groups[topicName].push(post);
    });

    return Object.entries(groups).map(([topicName, items]) => ({
      topicName,
      items
    }));
  }, [data, searchQuery]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Loading your learning space...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.FlatList
        onScroll={onScroll}
        scrollEventThrottle={16}
        data={groupedTopics}
        keyExtractor={(item, index) => item.topicName + index}
        renderItem={({ item, index }) => (
          <TopicBlock 
            topicName={item.topicName} 
            items={item.items} 
            currentUid={currentUid}
            isInitiallyExpanded={index === 0} // Pehla topic open rakho baaki band
          />
        )}
        contentContainerStyle={{ paddingTop: 140, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#4f46e5']} />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="library-outline" size={60} color="#cbd5e1" />
            <Text style={styles.emptyText}>No learning topics found. Generate some resources!</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push("/resources")} activeOpacity={0.9}>
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.fabText}>New Topic</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 50 },
  loadingText: { color: "#64748b", marginTop: 10, fontWeight: "600" },
  emptyText: { color: "#94a3b8", fontSize: 16, fontWeight: "600", textAlign: "center", paddingHorizontal: 20, marginTop: 15 },
  
  // Topic Block Styles
  topicBlockContainer: { marginHorizontal: 15, marginBottom: 15, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  topicHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  topicTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 8 },
  progressRow: { flexDirection: 'row', alignItems: 'center' },
  progressText: { fontSize: 12, fontWeight: '700', color: '#64748b', marginRight: 10 },
  progressBarBg: { flex: 1, height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#10b981', borderRadius: 3 },
  toggleIconBtn: { padding: 5, backgroundColor: '#f8fafc', borderRadius: 12 },
  
  topicContent: { paddingBottom: 20, backgroundColor: '#f8fafc', borderTopWidth: 1, borderColor: '#f1f5f9', paddingTop: 15 },
  continueBtn: { alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#e2e8f0', borderRadius: 12, marginTop: 10 },
  continueBtnText: { color: '#475569', fontWeight: '800', fontSize: 13 },
  topicCompleteMsg: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, backgroundColor: '#fef3c7', padding: 12, marginHorizontal: 20, borderRadius: 12 },
  topicCompleteText: { color: '#b45309', fontWeight: '900', fontSize: 15, marginLeft: 8 },

  fab: { position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 80, right: 20, backgroundColor: '#4f46e5', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderRadius: 30, elevation: 5, shadowColor: '#4f46e5', shadowOpacity: 0.3, shadowRadius: 10 },
  fabText: { color: '#fff', fontWeight: '800', marginLeft: 8, fontSize: 15 },
});