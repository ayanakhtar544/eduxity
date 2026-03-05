// File: app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Sabse pehle Welcome page */}
      <Stack.Screen name="index" />
      
      {/* Phir Onboarding page */}
      <Stack.Screen name="onboarding" />
      
      {/* Phir Main App jisme niche Tabs honge */}
      <Stack.Screen name="(tabs)" />
      
      {/* Expo ka default modal */}
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}