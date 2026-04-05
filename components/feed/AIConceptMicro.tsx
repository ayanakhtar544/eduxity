// Location: components/feed/AIConceptMicro.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import BookmarkButton from './BookmarkButton';
import { feedStyles as styles } from './FeedStyle';

import { useLikePost } from '../../hooks/mutations/useLikePost'; // Step 1 wala hook
import * as Haptics from 'expo-haptics'; // Button dabne par vibrate ke liye

export default function AIConceptMicro({ item, currentUid }: { item: any; currentUid: string | undefined; }) {
  const [revealed, setRevealed] = useState(false);
  const safeContent = typeof item.content === "object" && item.content !== null ? item.content : {};
  const displayTitle = safeContent.title || safeContent.heading || item.topic || "Concept";
  const displayBody = safeContent.explanation || safeContent.description || safeContent.text || safeContent.body || "Tap to explore this concept.";
  // 1. Hook ko bulao taaki hume 'toggleLike' (like karne wala function) mil jaye
  const { mutate: toggleLike } = useLikePost();
  
  // 2. Check karo ki kya is user ne pehle se like kiya hua hai?
  // (Agar item.likes ke array mein teri currentUid hai, toh isLiked true ho jayega)
  const isLiked = item.likes?.includes(currentUid);

  // 3. Ye function tab chalega jab koi heart icon par click karega
  const handleLikePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Halka sa phone vibrate hoga
    
    // Naye hook ko batao ki kaunsa post like hua hai
    toggleLike({ 
      postId: item.id, 
      currentUid: currentUid, 
      isLiked: isLiked // Bhej rahe hain taaki backend ko pata chale like karna hai ya unlike
    });
  };

  return (
    <Animated.View entering={FadeInDown.springify()} style={styles.aiCard}>
      <View style={styles.cardHeaderRow}>
        <View style={[styles.typeBadge, { backgroundColor: "rgba(56, 189, 248, 0.1)" }]}>
          <Ionicons name="flash" size={14} color="#38bdf8" />
          <Text style={[styles.typeText, { color: "#38bdf8" }]}>Concept</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={styles.topicText}>{item.topic || "Revision"}</Text>
          <BookmarkButton item={item} currentUid={currentUid} />
        </View>
      </View>
      <Text style={styles.conceptTitle}>{displayTitle}</Text>
      {!revealed ? (
        <TouchableOpacity onPress={() => setRevealed(true)} style={styles.revealBtn}>
          <Text style={styles.revealBtnText}>Tap to reveal 🔓</Text>
        </TouchableOpacity>
      ) : (
        <Animated.View entering={ZoomIn}>
          <Text style={styles.conceptBody}>{displayBody}</Text>
        </Animated.View>
      )}
      {/* 🔥 TERA INSTANT LIKE BUTTON */}
      <TouchableOpacity 
        onPress={handleLikePress} 
        style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15 }}
      >
        {/* Agar isLiked true hai toh bhara hua laal dil (heart), warna khali grey dil */}
        <Ionicons 
          name={isLiked ? "heart" : "heart-outline"} 
          size={24} 
          color={isLiked ? "#ef4444" : "#64748b"} 
        />
        {/* Likes ka total number dikhao */}
        <Text style={{ marginLeft: 5, color: '#64748b', fontSize: 16 }}>
          {item.likesCount || 0}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}