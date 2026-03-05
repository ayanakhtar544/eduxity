// File: app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ 
      headerShown: true, 
      tabBarActiveTintColor: '#2563EB', 
    }}>
      
      {/* 1. Home Feed */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text>, 
        }}
      />
      
      {/* 2. Study Groups */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Study Groups',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>💬</Text>,
        }}
      />

      {/* 3. NAYA TAB: Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}