import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { Layout } from 'react-native-reanimated';

interface FeedTabsProps {
  feedType: "FOR_YOU" | "PERSONALIZED";
  setFeedType: (type: "FOR_YOU" | "PERSONALIZED") => void;
}

export default function FeedTabs({ feedType, setFeedType }: FeedTabsProps) {
  return (
    <View style={styles.feedTabsContainer}>
      <View style={{ flexDirection: "row", flex: 1, justifyContent: "center" }}>
        
        {/* 🟢 FOR YOU TAB */}
        <TouchableOpacity 
          style={styles.feedTab} 
          onPress={() => setFeedType("FOR_YOU")}
          activeOpacity={0.7}
        >
          <Text style={[styles.feedTabText, feedType === "FOR_YOU" && styles.feedTabTextActive]}>
            For You
          </Text>
          {feedType === "FOR_YOU" && (
            <Animated.View layout={Layout.springify()} style={styles.activeTabIndicator} />
          )}
        </TouchableOpacity>
        
        {/* 🟢 MY SPACE TAB */}
        <TouchableOpacity 
          style={styles.feedTab} 
          onPress={() => setFeedType("PERSONALIZED")}
          activeOpacity={0.7}
        >
          <Text style={[styles.feedTabText, feedType === "PERSONALIZED" && styles.feedTabTextActive]}>
            My Space
          </Text>
          {feedType === "PERSONALIZED" && (
            <Animated.View layout={Layout.springify()} style={styles.activeTabIndicator} />
          )}
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  feedTabsContainer: {
    width: "100%",
    height: 50,
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 20,
    alignItems: "center",
  },
  feedTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    position: "relative",
  },
  feedTabText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#64748b",
  },
  feedTabTextActive: {
    color: "#0f172a",
    fontWeight: "900",
  },
  activeTabIndicator: {
    position: "absolute",
    bottom: -1,
    width: 40,
    height: 4,
    backgroundColor: "#4f46e5",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
});