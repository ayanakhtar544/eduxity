// Location: components/feed/FeedItemRenderer.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { apiClient } from '@/core/network/apiClient';
import { useUserStore } from '@/store/useUserStore';

// 🚨 Updated Interface matching new Prisma Schema
interface FeedItemProps {
  item: {
    id: string;
    topic: string;
    type: string; // "remember" | "quiz" | "flashcard" | "match" | "mini_game"
    difficulty?: number;
    payload: any; // AI se aane wala actual data
  };
  currentUid?: string;
  onCorrect?: () => void;
  onWrong?: () => void;
}

export default function FeedItemRenderer({ item, onCorrect, onWrong }: FeedItemProps) {
  const { user } = useUserStore();
  const payload = item.payload || {};

  // 🔄 Interactions State
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const track = async (type: "VIEW" | "CORRECT" | "WRONG" | "SKIP" | "SAVE" | "LIKE" | "SHARE" | "BOOKMARK") => {
    if (!user?.uid || !item?.id) return;
    try {
      await apiClient("/api/interactions", {
        method: "POST",
        body: JSON.stringify({ learningItemId: item.id, type }),
      });
    } catch {}
  };

  // ==========================================
  // 🧠 1. RENDERERS FOR DIFFERENT POST TYPES
  // ==========================================
  const renderContent = () => {
    switch (item.type) {
      case "quiz":
        return (
          <View>
            <Text style={styles.questionText}>{payload.question}</Text>
            {(payload.options || []).map((opt: string, idx: number) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === payload.correctOption;
              const showResult = selectedOption !== null;

              let bgColor = '#fff';
              let borderColor = '#e2e8f0';
              let textColor = '#334155';

              if (showResult) {
                if (isCorrect) {
                  bgColor = '#ecfdf5'; borderColor = '#10b981'; textColor = '#065f46';
                } else if (isSelected) {
                  bgColor = '#fef2f2'; borderColor = '#ef4444'; textColor = '#991b1b';
                }
              } else if (isSelected) {
                bgColor = '#eef2ff'; borderColor = '#4f46e5';
              }

              return (
                <TouchableOpacity 
                  key={idx} 
                  disabled={showResult}
                  style={[styles.quizOption, { backgroundColor: bgColor, borderColor }]}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setSelectedOption(idx);
                    if (idx === payload.correctOption) {
                      track("CORRECT"); onCorrect?.();
                    } else {
                      track("WRONG"); onWrong?.();
                    }
                  }}
                >
                  <Text style={[styles.quizOptionText, { color: textColor }]}>{opt}</Text>
                  {showResult && isCorrect && <Ionicons name="checkmark-circle" size={20} color="#10b981" />}
                  {showResult && isSelected && !isCorrect && <Ionicons name="close-circle" size={20} color="#ef4444" />}
                </TouchableOpacity>
              );
            })}
            {selectedOption !== null && payload.explanation && (
              <View style={styles.explanationBox}>
                <Text style={styles.explanationLabel}>Explanation:</Text>
                <Text style={styles.explanationText}>{payload.explanation}</Text>
              </View>
            )}
          </View>
        );

      case "flashcard":
        return (
          <TouchableOpacity 
            activeOpacity={0.9} 
            style={styles.flashcardBox}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
              setShowAnswer(!showAnswer);
            }}
          >
            <Text style={styles.flashcardLabel}>{showAnswer ? "ANSWER" : "QUESTION"}</Text>
            <Text style={styles.flashcardText}>
              {showAnswer ? payload.back : payload.front}
            </Text>
            <Text style={styles.tapToFlipHint}>Tap to flip ↺</Text>
          </TouchableOpacity>
        );

      case "match":
      case "mini_game":
        return (
          <View style={styles.gameBox}>
            <Text style={styles.gameTitle}>{payload.statement || payload.task || "Interactive Game"}</Text>
            {!showAnswer ? (
              <TouchableOpacity style={styles.revealBtn} onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setShowAnswer(true);
              }}>
                <Text style={styles.revealBtnText}>Reveal Answer</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.revealedAnswerBox}>
                <Text style={styles.revealedAnswerText}>{payload.answer || payload.hint || JSON.stringify(payload.pairs)}</Text>
              </View>
            )}
          </View>
        );

      case "remember":
      default:
        const contentStr = payload.content || payload.codeOrSteps || (payload.points && payload.points.join('\n- '));
        return (
          <View>
            {payload.title && <Text style={styles.summaryTitle}>{payload.title}</Text>}
            {contentStr ? (
              <Markdown style={markdownStyles}>{contentStr}</Markdown>
            ) : (
              <Text style={styles.emptyContent}>No content available.</Text>
            )}
          </View>
        );
    }
  };

  // ==========================================
  // 🎨 2. MAIN CARD RENDER
  // ==========================================
  return (
    <View style={styles.cardContainer}>
      
      {/* HEADER */}
      <View style={styles.cardHeader}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.type.replace('_', ' ')}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Text style={styles.difficultyText}>Lvl {item.difficulty || 1}</Text>
          <TouchableOpacity onPress={() => track("BOOKMARK")}>
            <Ionicons name="bookmark-outline" size={22} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.topicTitle}>{item.topic || "Learning Resource"}</Text>

      {/* DYNAMIC CONTENT */}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>

     {/* 🎯 PURE LEARNING FOCUSED FOOTER */}
      <View style={styles.footer}>
        {/* Only show "Got it" for theory/remember type cards */}
        {item.type === "remember" && (
          <TouchableOpacity style={styles.primaryActionBtn} onPress={() => { track("CORRECT"); onCorrect?.(); }}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.primaryActionText}>Mark Complete</Text>
          </TouchableOpacity>
        )}
        
        <View style={{ flex: 1 }} />
        
        <TouchableOpacity style={styles.secondaryActionBtn} onPress={() => track("BOOKMARK")}>
          <Ionicons name="bookmark" size={18} color="#64748b" />
          <Text style={styles.secondaryActionText}>Review Later</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ==========================================
// 🎨 3. PREMIUM STYLES
// ==========================================
const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  categoryText: {
    color: '#4f46e5',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  difficultyText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '800',
    alignSelf: 'center',
  },
  topicTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 15,
    letterSpacing: -0.5,
  },
  contentContainer: {
    marginBottom: 20,
  },
  emptyContent: {
    color: '#94a3b8',
    fontStyle: 'italic',
  },

  // Quiz Styles
  questionText: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 15 },
  quizOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 16, borderWidth: 2, marginBottom: 10 },
  quizOptionText: { fontSize: 15, fontWeight: '700', flex: 1 },
  explanationBox: { marginTop: 15, padding: 15, backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  explanationLabel: { fontSize: 12, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: 4 },
  explanationText: { fontSize: 14, color: '#334155', fontWeight: '500', lineHeight: 20 },

  // Flashcard Styles
  flashcardBox: { backgroundColor: '#0f172a', padding: 25, borderRadius: 20, alignItems: 'center', justifyContent: 'center', minHeight: 180, shadowColor: '#4f46e5', shadowOpacity: 0.2, shadowRadius: 15, elevation: 5 },
  flashcardLabel: { fontSize: 12, fontWeight: '900', color: '#64748b', letterSpacing: 1, marginBottom: 15 },
  flashcardText: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 30 },
  tapToFlipHint: { fontSize: 12, color: '#475569', fontWeight: '600', position: 'absolute', bottom: 15 },

  // Game/Match Styles
  gameBox: { backgroundColor: '#f8fafc', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  gameTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 20 },
  revealBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  revealBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  revealedAnswerBox: { backgroundColor: '#ecfdf5', padding: 15, borderRadius: 12, width: '100%', borderWidth: 1, borderColor: '#10b981' },
  revealedAnswerText: { color: '#065f46', fontSize: 16, fontWeight: '700', textAlign: 'center' },

  // Summary Styles
  summaryTitle: { fontSize: 16, fontWeight: '800', color: '#3b82f6', marginBottom: 8 },

  footer: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderColor: '#f1f5f9', paddingTop: 15, marginTop: 5 },
  iconBtn: { padding: 8, backgroundColor: '#f8fafc', borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  primaryActionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#a7f3d0' },
  primaryActionText: { color: '#065f46', fontWeight: '800', fontSize: 14, marginLeft: 6 },
  secondaryActionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  secondaryActionText: { color: '#475569', fontWeight: '700', fontSize: 13, marginLeft: 6 },
});

// Custom Markdown Styles
const markdownStyles = StyleSheet.create({
  body: { fontSize: 15, color: '#334155', lineHeight: 26, fontWeight: '500' },
  heading2: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginTop: 15, marginBottom: 8 },
  heading3: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginTop: 10, marginBottom: 5 },
  strong: { fontWeight: '900', color: '#0f172a' },
  bullet_list: { marginTop: 5, marginBottom: 15 },
  list_item: { marginBottom: 8 },
  code_inline: { backgroundColor: '#f1f5f9', color: '#ec4899', fontWeight: 'bold', padding: 4, borderRadius: 4 },
});