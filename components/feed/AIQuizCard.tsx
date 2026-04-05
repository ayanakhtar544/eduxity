// Location: components/feed/AIQuizCard.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import Animated, { FadeInDown, ZoomIn, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import BookmarkButton from './BookmarkButton';
import { feedStyles as styles } from '../../components/feed/FeedStyle';

export default function AIQuizCard({ item, currentUid, onCorrect, onWrong }: { item: any; currentUid: string | undefined; onCorrect: () => void; onWrong: () => void; }) {
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const shakeAnim = useSharedValue(0);

  const safeContent = typeof item.content === "object" && item.content !== null ? item.content : {};
  const correctIdx = typeof safeContent.correctAnswerIndex === "number" ? safeContent.correctAnswerIndex : 0;
  const safeOptions = Array.isArray(safeContent.options) && safeContent.options.length > 0 ? safeContent.options : ["Option A", "Option B", "Option C", "Option D"];

  const animatedShake = useAnimatedStyle(() => ({ transform: [{ translateX: shakeAnim.value }] }));

  const handleSelect = (idx: number) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(idx);
    if (idx === correctIdx) {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onCorrect();
    } else {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shakeAnim.value = withSequence(withTiming(10, { duration: 50 }), withTiming(-10, { duration: 50 }), withTiming(0, { duration: 50 }));
      onWrong();
    }
  };

  return (
    <Animated.View entering={FadeInDown.springify()} style={styles.aiCard}>
      <View style={styles.cardHeaderRow}>
        <View style={[styles.typeBadge, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
          <Ionicons name="help-circle" size={14} color="#10b981" />
          <Text style={[styles.typeText, { color: "#10b981" }]}>Quiz</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={styles.topicText}>{item.topic}</Text>
          <BookmarkButton item={item} currentUid={currentUid} />
        </View>
      </View>

      <Text style={styles.quizQuestion}>{safeContent.question || "Question is missing..."}</Text>

      <Animated.View style={[styles.optionsContainer, animatedShake]}>
        {safeOptions.map((opt: any, idx: number) => {
          const optionText = String(opt);
          let optStyle = styles.optionBtn;
          let textStyle = styles.optionText;

          if (selectedOpt !== null) {
            if (idx === correctIdx) {
              optStyle = [styles.optionBtn, styles.optionCorrect];
              textStyle = [styles.optionText, { color: "#fff" }];
            } else if (idx === selectedOpt) {
              optStyle = [styles.optionBtn, styles.optionWrong];
              textStyle = [styles.optionText, { color: "#fff" }];
            }
          }
          return (
            <TouchableOpacity key={idx} style={optStyle} onPress={() => handleSelect(idx)}>
              <Text style={textStyle}>{optionText}</Text>
            </TouchableOpacity>
          );
        })}
      </Animated.View>

      {selectedOpt !== null && (
        <Animated.View entering={ZoomIn} style={[styles.explanationBox, { borderColor: selectedOpt === correctIdx ? "#10b981" : "#ef4444", borderWidth: 1 }]}>
          <Text style={[styles.expTitle, { color: selectedOpt === correctIdx ? "#10b981" : "#ef4444" }]}>
            {selectedOpt === correctIdx ? "Spot On! 🎯" : "Almost! 💡"}
          </Text>
          <Text style={styles.expText}>{safeContent.explanation || "No explanation provided by AI."}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}