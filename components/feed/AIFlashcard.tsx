// Location: components/feed/AIFlashcard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import Animated, { FadeInDown, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import BookmarkButton from './BookmarkButton';
import { feedStyles as styles } from '../../components/feed/FeedStyle';

export default function AIFlashcard({ item, currentUid }: { item: any; currentUid: string | undefined; }) {
  const flipAnim = useSharedValue(0);
  
  const frontAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(flipAnim.value, [0, 1], [0, 180])}deg` }],
    backfaceVisibility: "hidden", zIndex: flipAnim.value < 0.5 ? 1 : 0,
  }));
  
  const backAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(flipAnim.value, [0, 1], [180, 360])}deg` }],
    backfaceVisibility: "hidden", position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    zIndex: flipAnim.value > 0.5 ? 1 : 0,
  }));

  const handleFlip = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    flipAnim.value = withTiming(flipAnim.value === 0 ? 1 : 0, { duration: 500 });
  };

  const safeContent = typeof item.content === "object" && item.content !== null ? item.content : {};
  
  return (
    <Animated.View entering={FadeInDown.springify()} style={[styles.aiCard, { perspective: 1000 }]}>
      <View style={styles.cardHeaderRow}>
        <View style={[styles.typeBadge, { backgroundColor: "rgba(167, 139, 250, 0.1)" }]}>
          <Ionicons name="copy" size={14} color="#a78bfa" />
          <Text style={[styles.typeText, { color: "#a78bfa" }]}>Flashcard</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={styles.topicText}>{item.topic}</Text>
          <BookmarkButton item={item} currentUid={currentUid} />
        </View>
      </View>
      <TouchableOpacity activeOpacity={1} onPress={handleFlip} style={styles.flashcardContainer}>
        <Animated.View style={[styles.flashcardFace, frontAnimatedStyle]}>
          <Text style={styles.flashcardQText}>{safeContent.front}</Text>
          <Text style={styles.tapPrompt}>Tap to flip 🔄</Text>
        </Animated.View>
        <Animated.View style={[styles.flashcardFace, styles.flashcardBack, backAnimatedStyle]}>
          <Text style={styles.flashcardAText}>{safeContent.back}</Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}