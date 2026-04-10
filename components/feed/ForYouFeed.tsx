// Location: components/feed/ForYouFeed.tsx

import React, { useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFeed } from '@/hooks/queries/useFeed';
import { useUserStore } from '@/store/useUserStore';

interface ForYouFeedProps {
  onScroll?: any;
  searchQuery?: string;
}

export default function ForYouFeed({ onScroll = () => {}, searchQuery }: ForYouFeedProps) {
  const { user } = useUserStore();
  const { 
    data, 
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    refetch
  } = useFeed(user?.uid, "FOR_YOU");

  // Refresh animation ke liye local state
  const [isRefreshing, setIsRefreshing] = useState(false);

  const allPosts = data?.pages
  .flatMap((page: any) => page?.items || [])
  .filter((item: any) => item && item.id)
  .filter((item: any, idx: number, arr: any[]) => arr.findIndex((x) => x.id === item.id) === idx)
  .slice(-50) || [];

  // Pull to Refresh ka main function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const loadMore = async () => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  const renderPost = ({ item }: { item: any }) => (
    <View style={styles.postCard}>
      <Text style={styles.title}>{item.topic}</Text>
      <Text style={styles.category}>{item.type} - level {item.difficulty}</Text>
      <Text style={styles.content}>
        {item.payload?.question || item.payload?.front || item.payload?.prompt || "Micro learning item"}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.FlatList
        data={allPosts}
        keyExtractor={(item, index) => item?.id ? String(item.id) : String(index)}
        renderItem={renderPost}

        // List ke content ke upar aur neeche jagah dena
        contentContainerStyle={{
          paddingTop: 140, // Header ki height ke hisaab se
          paddingBottom: 100, // Neeche tab bar ke liye jagah
        }}
        
        // Parent se aane wala animation scroll handler
        onScroll={(event) => {
          onScroll(event);
          const y = event.nativeEvent.contentOffset.y;
          const viewport = event.nativeEvent.layoutMeasurement.height;
          const content = event.nativeEvent.contentSize.height;
          const progress = content > 0 ? (y + viewport) / content : 0;
          if (progress >= 0.7 && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        scrollEventThrottle={16}
        
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={handleRefresh} 
            colors={['#4f46e5']} 
            tintColor={'#4f46e5'} 
          />
        }

        onEndReached={loadMore}
        onEndReachedThreshold={0.5} 
        
        ListFooterComponent={() => 
          isFetchingNextPage ? (
            <ActivityIndicator style={{ padding: 20 }} size="small" color="#4f46e5" />
          ) : null
        }
        
        ListEmptyComponent={() => (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No posts found. Swipe down to refresh!</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  postCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  title: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  category: { fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: '600', textTransform: 'uppercase' },
  content: { fontSize: 14, marginTop: 8, color: '#334155', lineHeight: 20 },
  emptyText: { color: '#94a3b8', fontSize: 15, fontWeight: '600' }
});