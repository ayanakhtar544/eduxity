// Location: app/admin/_layout.tsx
import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useUserStore } from '../../store/useUserStore';

export default function AdminLayout() {
  const router = useRouter();
  const { currentUser, userProfile, isLoading } = useUserStore();

  useEffect(() => {
    // Wait for the store to finish loading the profile
    if (isLoading) return;

    // 🛡️ The Gatekeeper: Strict Role Check
    // If not logged in, or NOT an admin, throw them back to the home screen instantly
    if (!currentUser || userProfile?.role !== 'admin') {
      console.warn("🚨 Unauthorized Admin Access Attempted!");
      router.replace('/(tabs)');
    }
  }, [currentUser, userProfile, isLoading]);

  if (isLoading || userProfile?.role !== 'admin') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#fde047" />
      </View>
    );
  }

  // Only renders if the user is a verified Admin
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" />
      {/* other admin screens */}
    </Stack>
  );
}