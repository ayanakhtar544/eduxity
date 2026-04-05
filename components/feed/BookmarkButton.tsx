// Location: components/feed/BookmarkButton.tsx
import React, { useState } from 'react';
import { TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; // Ensure this path matches your setup

export default function BookmarkButton({ item, currentUid }: { item: any; currentUid: string | undefined; }) {
  const [isSaved, setIsSaved] = useState(item.savedBy?.includes(currentUid) || false);

  const toggleSave = async () => {
    if (!currentUid || !item.id) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newState = !isSaved;
    setIsSaved(newState);

    const postRef = doc(db, "ai_feed_items", item.id);
    try {
      if (newState) await updateDoc(postRef, { savedBy: arrayUnion(currentUid) });
      else await updateDoc(postRef, { savedBy: arrayRemove(currentUid) });
    } catch (e) {
      setIsSaved(!newState);
    }
  };

  return (
    <TouchableOpacity onPress={toggleSave} style={{ padding: 4, marginLeft: 10 }}>
      <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={22} color={isSaved ? "#4f46e5" : "#94a3b8"} />
    </TouchableOpacity>
  );
}