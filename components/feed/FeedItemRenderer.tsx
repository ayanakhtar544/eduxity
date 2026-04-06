// Location: components/feed/FeedItemRenderer.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  interpolate 
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Core Imports
import { SRSService } from '../../core/api/srsService';

// --- TYPES ---
interface FeedItemProps {
  item: any;
  currentUid?: string;
  onCorrect?: () => void;
  onWrong?: () => void;
}

// ==========================================
// 🔴 REUSABLE REVIEW BADGE
// ==========================================
const ReviewBadge = ({ isReviewCard }: { isReviewCard?: boolean }) => {
  if (!isReviewCard) return null;
  return (
    <View style={styles.reviewBadge}>
      <Ionicons name="repeat" size={14} color="#ea580c" />
      <Text style={styles.reviewBadgeText}>Due for Review</Text>
    </View>
  );
};

// ==========================================
// 1. CONCEPT & ANALOGY CARD
// ==========================================
const ConceptCard = ({ item }: { item: any }) => {
  const isAnalogy = item.type === 'analogy';
  
  return (
    <View style={[styles.card, isAnalogy ? styles.analogyCard : styles.conceptCard]}>
      <ReviewBadge isReviewCard={item.isReviewCard} />
      <View style={styles.cardHeader}>
        <Ionicons 
          name={isAnalogy ? "bulb" : "book"} 
          size={20} 
          color={isAnalogy ? "#ea580c" : "#4f46e5"} 
        />
        <Text style={[styles.cardTag, isAnalogy ? {color: '#ea580c'} : {color: '#4f46e5'}]}>
          {isAnalogy ? "Analogy" : "Concept"}
        </Text>
      </View>
      <Text style={styles.contentText}>{item.content}</Text>
    </View>
  );
};

// ==========================================
// 2. INTERACTIVE FLASHCARD (3D Flip + SRS)
// ==========================================
const Flashcard = ({ item, currentUid, onCorrect, onWrong }: FeedItemProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const spin = useSharedValue(0);

  const handleFlip = () => {
    if (!isFlipped) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsFlipped(true);
      spin.value = withTiming(180, { duration: 400 });
    }
  };

  const handleSelfAssess = (isCorrect: boolean) => {
    if (isAnswered) return;
    setIsAnswered(true);

    if (currentUid) {
      SRSService.processAnswer(currentUid, item, isCorrect);
    }

    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (onCorrect) onCorrect();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (onWrong) onWrong();
    }
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const spinVal = interpolate(spin.value, [0, 180], [0, 180]);
    return { transform: [{ rotateY: `${spinVal}deg` }], backfaceVisibility: 'hidden' };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const spinVal = interpolate(spin.value, [0, 180], [180, 360]);
    return { transform: [{ rotateY: `${spinVal}deg` }], backfaceVisibility: 'hidden', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 };
  });

  return (
    <View style={styles.flashcardContainer}>
      <ReviewBadge isReviewCard={item.isReviewCard} />
      
      {/* FRONT SIDE */}
      <Animated.View style={[styles.card, styles.flashcardFront, frontAnimatedStyle]}>
        <TouchableOpacity activeOpacity={0.9} onPress={handleFlip} style={{ flex: 1, justifyContent: 'center' }}>
          <View style={styles.cardHeader}>
            <Ionicons name="albums" size={20} color="#0891b2" />
            <Text style={[styles.cardTag, { color: '#0891b2' }]}>Tap to Flip</Text>
          </View>
          <Text style={styles.flashcardText}>{item.front}</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* BACK SIDE */}
      <Animated.View style={[styles.card, styles.flashcardBack, backAnimatedStyle]}>
        <View style={styles.cardHeader}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={[styles.cardTag, { color: '#fff' }]}>Answer</Text>
        </View>
        <Text style={[styles.flashcardText, { color: '#fff' }]}>{item.back}</Text>
        
        {/* SRS Assessment Buttons */}
        <View style={styles.flashcardActions}>
          <TouchableOpacity 
            style={[styles.flashcardBtn, styles.flashcardBtnWrong, isAnswered && { opacity: 0.5 }]} 
            onPress={() => handleSelfAssess(false)}
            disabled={isAnswered}
          >
            <Text style={styles.flashcardBtnText}>Forgot ❌</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.flashcardBtn, styles.flashcardBtnCorrect, isAnswered && { opacity: 0.5 }]} 
            onPress={() => handleSelfAssess(true)}
            disabled={isAnswered}
          >
            <Text style={styles.flashcardBtnText}>Remembered ✅</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

// ==========================================
// 3. QUIZ MCQ CARD (With SRS Trigger)
// ==========================================
const QuizCard = ({ item, currentUid, onCorrect, onWrong }: FeedItemProps) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const handleSelect = async (index: number) => {
    if (isAnswered) return; 

    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index === item.answerIndex;
    
    // 🚀 Trigger Background SRS
    if (currentUid) {
      SRSService.processAnswer(currentUid, item, isCorrect);
    }
    
    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (onCorrect) onCorrect();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (onWrong) onWrong();
    }
  };

  const options = Array.isArray(item.options) ? item.options : [];

  return (
    <View style={styles.card}>
      <ReviewBadge isReviewCard={item.isReviewCard} />
      <View style={styles.cardHeader}>
        <Ionicons name="help-circle" size={22} color="#9333ea" />
        <Text style={[styles.cardTag, { color: '#9333ea' }]}>Knowledge Check</Text>
      </View>
      
      <Text style={styles.quizQuestion}>{item.question}</Text>

      <View style={styles.optionsContainer}>
        {options.map((option: string, index: number) => {
          let btnStyle = styles.optionBtn;
          let textStyle = styles.optionText;
          let icon = null;

          if (isAnswered) {
            if (index === item.answerIndex) {
              btnStyle = styles.optionCorrect;
              textStyle = styles.optionTextCorrect;
              icon = <Ionicons name="checkmark-circle" size={20} color="#16a34a" />;
            } else if (index === selectedOption) {
              btnStyle = styles.optionWrong;
              textStyle = styles.optionTextWrong;
              icon = <Ionicons name="close-circle" size={20} color="#dc2626" />;
            } else {
              btnStyle = styles.optionDisabled;
            }
          }

          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.7}
              onPress={() => handleSelect(index)}
              style={btnStyle}
            >
              <Text style={textStyle}>{option}</Text>
              {icon}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ==========================================
// 🚀 MAIN EXPORTED COMPONENT
// ==========================================
export default function FeedItemRenderer({ item, currentUid, onCorrect, onWrong }: FeedItemProps) {
  if (!item) return null;

  switch (item.type) {
    case 'concept_micro':
    case 'analogy':
      return <ConceptCard item={item} />;
    
    case 'flashcard':
      return <Flashcard item={item} currentUid={currentUid} onCorrect={onCorrect} onWrong={onWrong} />;
    
    case 'quiz_mcq':
      return <QuizCard item={item} currentUid={currentUid} onCorrect={onCorrect} onWrong={onWrong} />;
      
    default:
      return (
        <View style={styles.card}>
          <Text style={styles.contentText}>Unsupported content type: {item.type}</Text>
        </View>
      );
  }
}

// ==========================================
// 🎨 PREMIUM STYLES
// ==========================================
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    position: 'relative',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTag: { fontSize: 13, fontWeight: '800', marginLeft: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  // Review Badge
  reviewBadge: { position: 'absolute', top: -12, left: 20, backgroundColor: '#ffedd5', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#fdba74', zIndex: 10 },
  reviewBadgeText: { color: '#ea580c', fontSize: 11, fontWeight: '800', marginLeft: 4, textTransform: 'uppercase' },

  // Content Styles
  conceptCard: { backgroundColor: '#f8fafc', borderColor: '#eef2ff' },
  analogyCard: { backgroundColor: '#fff7ed', borderColor: '#ffedd5' },
  contentText: { fontSize: 16, color: '#334155', lineHeight: 26, fontWeight: '500' },

  // Flashcard Styles
  flashcardContainer: { marginHorizontal: 20, marginBottom: 20, minHeight: 220, position: 'relative' },
  flashcardFront: { backgroundColor: '#e0f2fe', borderColor: '#bae6fd', minHeight: 220, justifyContent: 'center', marginHorizontal: 0, marginBottom: 0 },
  flashcardBack: { backgroundColor: '#0ea5e9', borderColor: '#0284c7', minHeight: 220, justifyContent: 'center', marginHorizontal: 0, marginBottom: 0 },
  flashcardText: { fontSize: 18, color: '#0f172a', fontWeight: '700', textAlign: 'center', lineHeight: 28 },
  flashcardActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 20 },
  flashcardBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  flashcardBtnWrong: { backgroundColor: 'rgba(255,255,255,0.2)' },
  flashcardBtnCorrect: { backgroundColor: '#fff' },
  flashcardBtnText: { fontSize: 15, fontWeight: '800', color: '#0f172a' },

  // Quiz Styles
  quizQuestion: { fontSize: 17, color: '#1e293b', fontWeight: '700', marginBottom: 20, lineHeight: 26 },
  optionsContainer: { gap: 12 },
  optionBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 14, backgroundColor: '#f8fafc', borderWidth: 2, borderColor: '#f1f5f9' },
  optionText: { fontSize: 15, fontWeight: '600', color: '#475569', flex: 1 },
  optionCorrect: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 14, backgroundColor: '#f0fdf4', borderWidth: 2, borderColor: '#22c55e' },
  optionTextCorrect: { fontSize: 15, fontWeight: '700', color: '#16a34a', flex: 1 },
  optionWrong: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 14, backgroundColor: '#fef2f2', borderWidth: 2, borderColor: '#ef4444' },
  optionTextWrong: { fontSize: 15, fontWeight: '700', color: '#dc2626', flex: 1 },
  optionDisabled: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 14, backgroundColor: '#f8fafc', borderWidth: 2, borderColor: '#f1f5f9', opacity: 0.5 },
});