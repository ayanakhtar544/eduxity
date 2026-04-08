// Location: components/feed/FeedItemRenderer.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { apiClient } from '@/core/network/apiClient';
import { useUserStore } from '@/store/useUserStore';

// 🚨 Ye interface tumhare Prisma DB model se 100% match hona chahiye
interface FeedItemProps {
  item: {
    id: string;
    topic?: string;
    type?: string;
    difficulty?: number;
    payload?: any;
    title?: string;
    category?: string;
    content?: string;
    createdAt?: Date | string;
  };
  currentUid?: string;
  onCorrect?: () => void;
  onWrong?: () => void;
}

export default function FeedItemRenderer({ item, onCorrect, onWrong }: FeedItemProps) {
  const { user } = useUserStore();
  const track = async (type: "VIEW" | "CORRECT" | "WRONG" | "SKIP" | "SAVE" | "LIKE" | "SHARE" | "BOOKMARK") => {
    if (!user?.uid || !item?.id) return;
    try {
      await apiClient("/api/interactions", {
        method: "POST",
        body: JSON.stringify({ uid: user.uid, learningItemId: item.id, type }),
      });
    } catch {}
  };
  let interactive: any = null;
  if (item.payload) {
    interactive = { items: [{ type: item.type, ...item.payload }] };
  } else if (item.content) {
    try {
      interactive = JSON.parse(item.content);
    } catch {
      interactive = null;
    }
  }

  const firstItem = interactive?.items?.[0];

  return (
    <View style={styles.cardContainer}>
      
      {/* 1. Header Mapping: Title and Category */}
      <View style={styles.cardHeader}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.type || item.category || "General"}</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="bookmark-outline" size={22} color="#64748b" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>{item.topic || item.title || "Micro Learning"}</Text>

      {/* 2. Content Mapping: AI Markdown Renderer */}
      <View style={styles.contentContainer}>
        {firstItem?.type === "quiz" ? (
          <View>
            <Text style={styles.title}>{firstItem.question}</Text>
            {(firstItem.options || []).map((opt: string, idx: number) => (
              <Text key={`${item.id}-${idx}`} style={styles.content}>
                {`${idx + 1}. ${opt}`}
              </Text>
            ))}
          </View>
        ) : firstItem?.type === "flashcard" ? (
          <View>
            <Text style={styles.category}>Front</Text>
            <Text style={styles.content}>{firstItem.front}</Text>
            <Text style={styles.category}>Back</Text>
            <Text style={styles.content}>{firstItem.back}</Text>
          </View>
        ) : item.content ? (
          <Markdown style={markdownStyles}>
            {item.content}
          </Markdown>
        ) : (
          <Text style={styles.emptyContent}>No notes available for this topic.</Text>
        )}
      </View>

      {/* 3. Interactive Footer (Optional, based on your props) */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => { track("CORRECT"); onCorrect?.(); }}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#10b981" />
          <Text style={[styles.actionText, { color: '#10b981' }]}>Got It</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionBtn} onPress={() => { track("WRONG"); onWrong?.(); }}>
          <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
          <Text style={[styles.actionText, { color: '#ef4444' }]}>Review Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => track("LIKE")}>
          <Ionicons name="heart-outline" size={20} color="#f43f5e" />
          <Text style={[styles.actionText, { color: '#f43f5e' }]}>Like</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => track("BOOKMARK")}>
          <Ionicons name="bookmark-outline" size={20} color="#4f46e5" />
          <Text style={[styles.actionText, { color: '#4f46e5' }]}>Bookmark</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => track("SHARE")}>
          <Ionicons name="share-social-outline" size={20} color="#0ea5e9" />
          <Text style={[styles.actionText, { color: '#0ea5e9' }]}>Share</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

// 🎨 STYLING
const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    color: '#4f46e5',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 15,
  },
  contentContainer: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  emptyContent: {
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  category: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  content: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 15,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
    paddingTop: 15,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '700',
  },
});

// Custom Markdown Styles for the AI text
const markdownStyles = StyleSheet.create({
  body: { fontSize: 15, color: '#334155', lineHeight: 24 },
  heading2: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginTop: 10, marginBottom: 5 },
  heading3: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginTop: 10, marginBottom: 5 },
  strong: { fontWeight: 'bold', color: '#0f172a' },
  bullet_list: { marginTop: 5, marginBottom: 15 },
  list_item: { marginBottom: 5 },
});