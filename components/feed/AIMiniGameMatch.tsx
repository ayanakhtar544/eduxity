// Location: components/feed/AIMiniGameMatch.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import BookmarkButton from './BookmarkButton';
import { feedStyles as styles } from './FeedStyle';

export default function AIMiniGameMatch({ item, currentUid, onCorrect }: { item: any; currentUid: string | undefined; onCorrect: () => void; }) {
  let originalPairs: any[] = [];
  if (item.content) {
    if (Array.isArray(item.content.pairs)) originalPairs = item.content.pairs;
    else if (Array.isArray(item.content)) originalPairs = item.content;
  }

  const [cards, setCards] = useState<any[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);

  useEffect(() => {
    if (originalPairs.length > 0) {
      let deck: any[] = [];
      originalPairs.forEach((pair: any, index: number) => {
        const termText = pair.term || pair.word || pair.question || "Term";
        const defText = pair.definition || pair.meaning || pair.answer || "Definition";
        deck.push({ id: `term-${index}`, matchId: index, text: termText, type: "term" });
        deck.push({ id: `def-${index}`, matchId: index, text: defText, type: "def" });
      });
      deck.sort(() => Math.random() - 0.5);

      setCards(deck);
      setFlippedIndices([]);
      setMatchedIds([]);
    }
  }, [item.id]);

  const handleCardTap = (index: number) => {
    if (flippedIndices.length === 2 || flippedIndices.includes(index) || matchedIds.includes(cards[index].matchId)) return;
    if (Platform.OS !== "web") Haptics.selectionAsync();

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      const card1 = cards[newFlipped[0]];
      const card2 = cards[newFlipped[1]];

      if (card1.matchId === card2.matchId) {
        setTimeout(() => {
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setMatchedIds((prev) => [...prev, card1.matchId]);
          setFlippedIndices([]);
          if (matchedIds.length + 1 === originalPairs.length) onCorrect();
        }, 500);
      } else {
        setTimeout(() => {
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  const isGameWon = matchedIds.length === originalPairs.length && originalPairs.length > 0;

  if (originalPairs.length === 0) {
    return (
      <Animated.View entering={FadeInDown.springify()} style={styles.aiCard}>
        <Text style={styles.topicText}>Game data corrupted. Swipe to skip.</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.springify()} style={styles.aiCard}>
      <View style={styles.cardHeaderRow}>
        <View style={[styles.typeBadge, { backgroundColor: "#eef2ff" }]}>
          <Ionicons name="game-controller" size={14} color="#4f46e5" />
          <Text style={[styles.typeText, { color: "#4f46e5" }]}>Memory Match</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={styles.topicText}>Matched: {matchedIds.length}/{originalPairs.length}</Text>
          <BookmarkButton item={item} currentUid={currentUid} />
        </View>
      </View>

      {isGameWon ? (
        <Animated.View entering={ZoomIn} style={{ alignItems: "center", padding: 20 }}>
          <Ionicons name="trophy" size={50} color="#f59e0b" />
          <Text style={{ fontSize: 18, fontWeight: "900", color: "#b45309", marginTop: 10 }}>Mind Blown! 🎉</Text>
        </Animated.View>
      ) : (
        <View>
          <Text style={styles.quizQuestion}>Flip cards to find matching pairs!</Text>
          <View style={styles.memoryGrid}>
            {cards.map((card, idx) => {
              const isFlipped = flippedIndices.includes(idx) || matchedIds.includes(card.matchId);
              const isMatched = matchedIds.includes(card.matchId);
              return (
                <TouchableOpacity
                  key={idx} activeOpacity={0.8} onPress={() => handleCardTap(idx)}
                  style={[styles.memoryCard, isFlipped && styles.memoryCardFlipped, isMatched && styles.memoryCardMatched]}
                >
                  <Text style={[styles.memoryCardText, (isFlipped || isMatched) && { color: isMatched ? "#fff" : "#0f172a" }]}>
                    {isFlipped ? card.text : "❓"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </Animated.View>
  );
}