import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLeaderboard } from '@/hooks/queries/useEngagement';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardScreen() {
  const { data: res, isLoading } = useLeaderboard();
  const entries = res?.data || [];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>🏆 Global Leaderboard</Text>
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#6366f1" />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item, i) => item.id || String(i)}
          contentContainerStyle={{ paddingBottom: 32 }}
          renderItem={({ item, index }) => (
            <View style={[styles.row, index === 0 && styles.topRow]}>
              <Text style={styles.rank}>
                {index < 3 ? MEDALS[index] : `#${index + 1}`}
              </Text>
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.user?.name || item.user?.email || 'Anonymous'}
                </Text>
                <Text style={styles.meta}>
                  {item.correctAnswers} correct · {item.sessionsCompleted} sessions · 🔥{item.streak}
                </Text>
              </View>
              <Text style={styles.score}>{Math.round(item.score)} pts</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="trophy-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No entries yet. Start learning!</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  topRow: {
    borderColor: '#fbbf24',
    backgroundColor: '#fffbeb',
  },
  rank: { fontSize: 20, width: 36, textAlign: 'center' },
  info: { flex: 1, marginHorizontal: 12 },
  name: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  meta: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  score: { fontSize: 16, fontWeight: '700', color: '#6366f1' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#94a3b8', marginTop: 12, fontSize: 15 },
});
