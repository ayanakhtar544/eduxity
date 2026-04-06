// Location: app/(tabs)/index.tsx
import React, { useState } from "react";
import { SafeAreaView, StatusBar, View, StyleSheet, Animated as RNAnimated } from "react-native";
import Animated, { 
  useSharedValue, 
  useAnimatedScrollHandler, 
  useAnimatedStyle, 
  interpolate, 
  Extrapolation 
} from "react-native-reanimated";

import { useLocalSearchParams } from "expo-router";

import ForYouFeed from "../../components/feed/ForYouFeed";
import MySpaceFeed from "../../components/feed/MySpaceFeed";
import TopHeader from "../../components/layout/TopHeader";
import SidebarMenu from "../../components/layout/SidebarMenu";
import FeedTabs from "../../components/layout/FeedTabs";

const HEADER_HEIGHT = 110; // Header + Tabs height

export default function AILearningFeedScreen() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [feedType, setFeedType] = useState<"FOR_YOU" | "PERSONALIZED">("FOR_YOU");

  const [searchQuery, setSearchQuery] = useState("");
  
  // 🔥 SCROLL ANIMATION STATE
  const scrollY = useSharedValue(0);

  const params = useLocalSearchParams();

  const defaultTab = params.feed === "PERSONALIZED" ? "PERSONALIZED" : "FOR_YOU";

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT],
      [0, -HEADER_HEIGHT],
      Extrapolation.CLAMP
    );
    return { transform: [{ translateY }] };
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* ... */}
      <Animated.View style={[styles.headerWrapper, headerStyle]}>
        {/* Pass searchQuery down to Header */}
        <TopHeader 
          setIsMenuOpen={setIsMenuOpen} 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
        />
        <FeedTabs feedType={feedType} setFeedType={setFeedType} />
      </Animated.View>

      <View style={{ flex: 1 }}>
        {/* Pass searchQuery down to Feeds */}
        {feedType === "FOR_YOU" ? (
          <ForYouFeed onScroll={scrollHandler} searchQuery={searchQuery} />
        ) : (
          <MySpaceFeed onScroll={scrollHandler} searchQuery={searchQuery} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  headerWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "#f8fafc",
  }
});