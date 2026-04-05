// Location: components/feed/AIQuizTF.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import BookmarkButton from './BookmarkButton';
import { feedStyles as styles } from './FeedStyle';

export default function AIQuizTF({ item, currentUid, onCorrect, onWrong }: { item: any; currentUid: string | undefined; onCorrect: () => void; onWrong: () => void; }) {
  const [selectedOpt, setSelectedOpt] = useState<boolean | null>(null);
  const safeContent = typeof item.content === "object" && item.content !== null ? item.content : {};
  const isTrue = safeContent.isTrue ?? true;

  const handleSelect = (val: boolean) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(val);
    if (val === isTrue) {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onCorrect();
    } else {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      onWrong();
    }
  };

  return (
    <Animated.View entering={FadeInDown.springify()} style={styles.aiCard}>
      <View style={styles.cardHeaderRow}>
        <View style={[styles.typeBadge, { backgroundColor: "rgba(245, 158, 11, 0.1)" }]}>
          <Ionicons name="git-compare" size={14} color="#f59e0b" />
          <Text style={[styles.typeText, { color: "#f59e0b" }]}>True or False</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={styles.topicText}>{item.topic}</Text>
          <BookmarkButton item={item} currentUid={currentUid} />
        </View>
      </View>
      <Text style={styles.quizQuestion}>{safeContent.statement}</Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <TouchableOpacity
          style={[styles.optionBtn, { flex: 1, alignItems: "center" }, selectedOpt === true && (isTrue ? styles.optionCorrect : styles.optionWrong)]}
          onPress={() => handleSelect(true)}
        >
          <Text style={[styles.optionText, selectedOpt === true && { color: "#fff" }]}>True</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionBtn, { flex: 1, alignItems: "center" }, selectedOpt === false && (!isTrue ? styles.optionCorrect : styles.optionWrong)]}
          onPress={() => handleSelect(false)}
        >
          <Text style={[styles.optionText, selectedOpt === false && { color: "#fff" }]}>False</Text>
        </TouchableOpacity>
      </View>
      {selectedOpt !== null && (
        <Animated.View entering={ZoomIn} style={[styles.explanationBox, { borderColor: selectedOpt === isTrue ? "#10b981" : "#ef4444", borderWidth: 1 }]}>
          <Text style={[styles.expTitle, { color: selectedOpt === isTrue ? "#10b981" : "#ef4444" }]}>
            {selectedOpt === isTrue ? "Perfect! 🔥" : "Nope! 💡"}
          </Text>
          <Text style={styles.expText}>{safeContent.explanation}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}