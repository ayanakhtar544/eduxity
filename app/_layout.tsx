import React, { useEffect } from 'react';
import { Stack } from 'expo-router'; // Abhi bhi import rakho internal routing ke liye
import * as SplashScreen from 'expo-splash-screen';
import * as Sentry from '@sentry/react-native';

// TanStack Query Offline Persister Imports
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🚨 NAYA: Drawer aur Gesture Handler Imports
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Local Imports
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useUserStore } from '../store/useUserStore';
import { logger } from '../core/utils/logger';
import { apiClient } from '../core/network/apiClient';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../core/firebase/firebaseConfig';
import Toast from 'react-native-toast-message';

SplashScreen.preventAutoHideAsync().catch(() => {});

// =========================================================
// 1. Sentry Crash Reporter Initialization
// =========================================================
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enableAutoSessionTracking: true,
  tracesSampleRate: 1.0, 
});

// =========================================================
// 2. TanStack Query & AsyncStorage Configuration
// =========================================================
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, 
      staleTime: 1000 * 60 * 5,    
      retry: 2,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

// =========================================================
// 3. Main Layout Component
// =========================================================
function RootLayout() {
  const { expoPushToken } = usePushNotifications();
  const { user, authReady, setUser, setAuthReady, syncUserWithDatabase } = useUserStore();

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = setTimeout(() => {
      setAuthReady(true);
      SplashScreen.hideAsync().catch(() => {});
    }, 5000);

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser ?? null);
      if (firebaseUser) {
        await firebaseUser.getIdToken().catch(async () => {
          await firebaseUser.getIdToken(true).catch(() => null);
        });
        await syncUserWithDatabase(firebaseUser);
      }
      setAuthReady(true);
      if (timeout) clearTimeout(timeout);
      SplashScreen.hideAsync().catch(() => {});
    });
    return () => {
      if (timeout) clearTimeout(timeout);
      unsub();
    };
  }, [setAuthReady, setUser, syncUserWithDatabase]);

  // Push Token Syncing Logic
  useEffect(() => {
    if (user?.uid && expoPushToken) {
      saveTokenToDatabase(user.uid, expoPushToken);
    }
  }, [user, expoPushToken]);

  const saveTokenToDatabase = async (firebaseUid: string, token: string) => {
    try {
      await apiClient('/api/users/save-token', {
        method: 'POST',
        body: JSON.stringify({ firebaseUid, pushToken: token }),
      });
      logger.info('Push Token Synced Successfully! 🚀');
    } catch (error) {
      logger.error('Failed to save push token:', error);
    }
  };

  if (!authReady) return null;

  return (
    // 🚨 CRITICAL: Swipe animations ke liye GestureHandler zaroori hai
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PersistQueryClientProvider 
        client={queryClient} 
        persistOptions={{ persister: asyncStoragePersister }}
      >
        <Drawer 
          screenOptions={{ 
            headerShown: false,
            drawerStyle: { width: 280, backgroundColor: '#f8fafc' },
            drawerActiveBackgroundColor: '#eef2ff',
            drawerActiveTintColor: '#4f46e5',
          }}
        >
          {/* ✅ VISIBLE IN DRAWER: Tumhara Main Tabs/Feed Area */}
          <Drawer.Screen 
            name="(tabs)" 
            options={{
              drawerLabel: 'Home',
              title: 'Home',
              drawerIcon: ({ color, size }) => (
                <Ionicons name="home-outline" size={size} color={color} />
              ),
            }} 
          />

          {/* ❌ HIDDEN FROM DRAWER: Ye screens exist karti hain par side menu me nahi dikhengi */}
          <Drawer.Screen name="index" options={{ drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="(auth)" options={{ drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="admin" options={{ drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="chat" options={{ drawerItemStyle: { display: 'none' } }} />
        </Drawer>
        <Toast />
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );    
}

// =========================================================
// 4. Wrap & Export with Sentry Error Boundary
// =========================================================
export default Sentry.wrap(RootLayout);