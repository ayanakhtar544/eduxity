import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDailyChallenge } from '@/hooks/queries/useEngagement';
import { router } from 'expo-router';

export const DailyChallengeCard = () => {
    const { challenge } = useDailyChallenge();

    if (!challenge.data?.success) return null;

    return (
        <TouchableOpacity 
            style={styles.container}
            onPress={() => router.push('/daily-challenge')}
        >
            <View style={styles.header}>
                <Ionicons name="calendar-outline" size={24} color="#6366f1" />
                <Text style={styles.title}>Daily Challenge</Text>
            </View>
            <Text style={styles.description}>
                Complete 10 mixed items today to boost your streak and earn 100 points!
            </Text>
            <View style={styles.footer}>
                <Text style={styles.stats}>10 Items • Mixed Subjects</Text>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </View>
        </TouchableOpacity>
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
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        marginLeft: 8,
    },
    description: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    stats: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '500',
    },
});
