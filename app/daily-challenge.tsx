import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDailyChallenge } from '@/hooks/queries/useEngagement';
import { useStreak } from '@/hooks/queries/useEngagement';

export default function DailyChallengeScreen() {
  const { challenge, completeChallenge } = useDailyChallenge();
  const { updateStreak } = useStreak();

  const data = challenge.data?.data;
  const items = data?.items || [];

  const handleComplete = async () => {
    if (!data?.id) return;
    try {
      await completeChallenge.mutateAsync(data.id);
      await updateStreak.mutateAsync();
      Alert.alert('🎉 Challenge Complete!', 'You earned 100 points and a streak boost!');
    } catch {
      Alert.alert('Error', 'Could not complete challenge. Please try again.');
    }
  };

  if (challenge.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#6366f1" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="calendar" size={28} color="#6366f1" />
        <Text style={styles.title}>Daily Challenge</Text>
      </View>
      <Text style={styles.subtitle}>
        Complete all 10 items to earn 100 pts + streak boost!
      </Text>

      <FlatList
        data={items}
        keyExtractor={(item, i) => item.id || String(i)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item, index }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemIndex}>{index + 1}</Text>
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemTopic}>{item.topic}</Text>
              <Text style={styles.itemType}>{item.type}</Text>
              <Text style={styles.itemQuestion} numberOfLines={2}>
                {item.payload?.question || item.payload?.front || item.payload?.prompt}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No challenge items for today yet!</Text>
        }
        ListFooterComponent={
          items.length > 0 ? (
            <TouchableOpacity style={styles.completeBtn} onPress={handleComplete}>
              <Text style={styles.completeBtnText}>
                {completeChallenge.isPending ? 'Completing...' : 'Complete Challenge 🏆'}
              </Text>
            </TouchableOpacity>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginLeft: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginHorizontal: 20,
    marginBottom: 8,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  itemLeft: {
    width: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemIndex: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366f1',
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
  },
  itemTopic: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366f1',
    textTransform: 'capitalize',
  },
  itemType: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemQuestion: {
    fontSize: 14,
    color: '#334155',
    marginTop: 4,
    lineHeight: 20,
  },
  completeBtn: {
    backgroundColor: '#6366f1',
    marginTop: 8,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  completeBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  empty: {
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: 40,
    fontSize: 15,
  },
});
