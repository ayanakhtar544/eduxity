import React, { useState, useCallback, useMemo } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet, Platform } from "react-native";
import Animated from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

// Core Paths (Update if needed)
import { useUserStore } from "../../store/useUserStore";
import { useFeedData } from "../../hooks/queries/useFeedData";
import FeedItemRenderer from "./FeedItemRenderer";

const AnimatedFlatList = Animated.createAnimatedComponent(Animated.FlatList);

interface ForYouFeedProps {
  searchQuery: string;
}

export default function ForYouFeed({ searchQuery = "", onScroll }: any) {
  const { user, userProfile } = useUserStore();
  const currentUid = user?.uid;

  // Local Gamification State
  const [streak, setStreak] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);

  // 📡 FETCH DATA
  const { 
    data, 
    isLoading, 
    isFetching, 
    refetch, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useFeedData(currentUid, "FOR_YOU", null, null, userProfile, streak, wrongStreak);

  // 🧠 FLATLIST MEMORY OPTIMIZATION
  const flattenedPosts = useMemo(() => {
    if (!data) return [];
    const allPosts = data.pages.flatMap(page => page.posts);
    
    // Apply Search Filter locally if searchQuery exists
    let filtered = Array.from(new Map(allPosts.map(item => [item.id, item])).values());
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(post => 
        post.topic?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        post.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [data, searchQuery]);

  // 🎮 GAMIFICATION HANDLERS
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

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 📱 UI RENDERS
  if (isLoading && flattenedPosts.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Curating your learning feed...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {streak > 0 && (
        <View style={styles.streakBadge}>
          <Ionicons name="flame" size={16} color="#ea580c" />
          <Text style={styles.streakText}>{streak} Streak!</Text>
        </View>
      )}

      <AnimatedFlatList
        data={flattenedPosts}
        keyExtractor={(item: any) => String(item.id)}
        renderItem={renderFeedItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        
        // Performance Props
        removeClippedSubviews={Platform.OS === 'android'} 
        maxToRenderPerBatch={5}
        initialNumToRender={5}
        windowSize={5}

        // Refresh logic
        refreshing={isFetching && !isFetchingNextPage}
        onRefresh={refetch}

        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No posts found. Try adjusting your profile!</Text>
          </View>
        }

        ListFooterComponent={
          hasNextPage ? (
            <View style={styles.footer}>
              <TouchableOpacity style={styles.loadMoreBtn} onPress={handleLoadMore} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? <ActivityIndicator color="#fff" /> : <Text style={styles.loadMoreText}>Dive Deeper 🚀</Text>}
              </TouchableOpacity>
            </View>
          ) : <View style={{ height: 40 }} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 50 },
  loadingText: { color: "#64748b", marginTop: 10, fontWeight: "600" },
  emptyText: { color: "#94a3b8", fontSize: 16, fontWeight: "500" },
  listContainer: { paddingTop: 20, paddingBottom: 120 },
  streakBadge: { position: 'absolute', top: 10, right: 20, zIndex: 10, flexDirection: 'row', backgroundColor: '#ffedd5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#fdba74', alignItems: 'center' },
  streakText: { color: '#ea580c', fontWeight: '800', marginLeft: 4, fontSize: 12 },
  footer: { paddingVertical: 20, alignItems: "center" },
  loadMoreBtn: { backgroundColor: "#0f172a", paddingHorizontal: 30, paddingVertical: 14, borderRadius: 20, minWidth: 200, alignItems: "center", elevation: 4 },
  loadMoreText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});