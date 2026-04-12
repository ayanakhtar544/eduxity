// Location: app/(tabs)/index.tsx
import React, { useState } from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
} from "react-native-reanimated";

import { SafeAreaView } from "react-native-safe-area-context";

import { useLocalSearchParams } from "expo-router";

import ForYouFeed from "../../components/feed/ForYouFeed";
import MySpaceFeed from "../../components/feed/MySpaceFeed";
import FeedTabs from "../../components/layout/FeedTabs";
import SidebarMenu from "../../components/layout/SidebarMenu";
import TopHeader from "../../components/layout/TopHeader";
import { auth } from "../../core/firebase/firebaseConfig";

const HEADER_HEIGHT = 110; // Header + Tabs height

export default function AILearningFeedScreen() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const params = useLocalSearchParams();
  const [feedType, setFeedType] = useState<"FOR_YOU" | "PERSONALIZED">(
    params.feed === "PERSONALIZED" ? "PERSONALIZED" : "FOR_YOU",
  );

  const [searchQuery, setSearchQuery] = useState("");

  // 🔥 SCROLL ANIMATION STATE
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT],
      [0, -HEADER_HEIGHT],
      Extrapolation.CLAMP,
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

      <SidebarMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        currentUid={auth.currentUser?.uid}
      />
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
  },
});
