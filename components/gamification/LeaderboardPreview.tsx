import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLeaderboard } from '@/hooks/queries/useEngagement';
import { router } from 'expo-router';

export const LeaderboardPreview = () => {
    const { data: leaderboardRes } = useLeaderboard();
    const topUsers = leaderboardRes?.data?.slice(0, 3) || [];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Global Leaderboard</Text>
                <TouchableOpacity onPress={() => router.push('/leaderboard')}>
                    <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
            </View>
            {topUsers.map((item, index) => (
                <View key={index} style={styles.userRow}>
                    <View style={styles.rankContainer}>
                        <Text style={styles.rank}>#{index + 1}</Text>
                    </View>
                    <Text style={styles.userName} numberOfLines={1}>
                        {item.user?.name || item.user?.email || 'Anonymous'}
                    </Text>
                    <Text style={styles.userScore}>{item.score.toFixed(0)} pts</Text>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginVertical: 12,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
    },
    seeAll: {
        fontSize: 14,
        color: '#6366f1',
        fontWeight: '600',
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    rankContainer: {
        width: 32,
    },
    rank: {
        fontSize: 14,
        fontWeight: '700',
        color: '#94a3b8',
    },
    userName: {
        flex: 1,
        fontSize: 14,
        color: '#334155',
        fontWeight: '500',
    },
    userScore: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
    },
});
