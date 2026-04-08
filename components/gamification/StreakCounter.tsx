import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/store/useUserStore';

export const StreakCounter = () => {
    const { sqlUser } = useUserStore();
    const streak = sqlUser?.streak?.currentStreak || 0;

    return (
        <View style={styles.container}>
            <Ionicons name="flame" size={20} color="#ff9500" />
            <Text style={styles.text}>{streak} Day Streak</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 149, 0, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    text: {
        marginLeft: 4,
        fontWeight: '700',
        color: '#ff9500',
        fontSize: 14,
    },
});
