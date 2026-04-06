import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useUserStore } from '../store/useUserStore'; // Tumhara existing store

export default function RootLayout() {
  const { expoPushToken } = usePushNotifications();
  const { user } = useUserStore(); // Current logged-in user

  useEffect(() => {
    // Agar user logged in hai aur token generate ho gaya hai, toh DB me save karo
    if (user && expoPushToken) {
      saveTokenToDatabase(user.id, expoPushToken);
    }
  }, [user, expoPushToken]); // Jab bhi user login kare ya token aaye, yeh run hoga

  const saveTokenToDatabase = async (userId: string, token: string) => {
    try {
      // Yahan apne backend ya Firebase/Supabase ka endpoint call karo
      // Example with standard fetch API:
      const response = await fetch('https://tumhara-backend.com/api/users/save-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${user.authToken}` // Agar auth zaroori hai
        },
        body: JSON.stringify({
          userId: userId,
          pushToken: token,
        }),
      });

      if (response.ok) {
        console.log('Token securely saved to database! 🚀');
      }
    } catch (error) {
      console.error('Error saving push token to DB:', error);
    }
  };

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );    
}