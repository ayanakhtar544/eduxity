import React, { useEffect } from 'react';
import { Stack } from 'expo-router'; 
import * as SplashScreen from 'expo-splash-screen';

// TanStack Query Offline Persister
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Local Imports (SENTRY AUR PUSH NOTIFICATIONS HATA DIYE 🚨)
import { useUserStore } from '../store/useUserStore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../core/firebase/firebaseConfig';
import Toast from 'react-native-toast-message';

SplashScreen.preventAutoHideAsync().catch(() => {});

// =========================================================
// 1. TanStack Query & AsyncStorage Configuration
// =========================================================
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, 
      staleTime: 1000 * 60 * 5,    
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

// =========================================================
// 2. Main Layout Component
// =========================================================
export default function RootLayout() {
  const { user, authReady, setUser, setAuthReady, syncUserWithDatabase } = useUserStore();

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      setAuthReady(true);
      SplashScreen.hideAsync().catch(() => {});
    }, 5000);

    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ?? null);
      
      if (firebaseUser) {
        // 🔥 SILENT BACKGROUND SYNC: 
        // Await hata diya taaki UI block na ho aur app instantly khul jaye
        firebaseUser.getIdToken(true).then(() => {
          syncUserWithDatabase(firebaseUser).catch(e => console.error("Sync failed silently", e));
        }).catch(e => console.error("Token refresh failed", e));
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

  if (!authReady) return null;

  return (
    <PersistQueryClientProvider 
      client={queryClient} 
      persistOptions={{ persister: asyncStoragePersister }}
    >
      {/* Main App Navigation Stack */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="chat" />
      </Stack>
      <Toast />
    </PersistQueryClientProvider>
  );    
}