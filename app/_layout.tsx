import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";

// TanStack Query Offline Persister
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";

// Local Imports
import { onAuthStateChanged } from "firebase/auth";
import Toast from "react-native-toast-message";
import { auth } from "../core/firebase/firebaseConfig";
import { useUserStore } from "../store/useUserStore";

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
  const {
    user,
    authReady,
    setUser,
    setAuthReady,
    syncUserWithDatabase,
    setAuthError,
  } = useUserStore();

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let unsubscribe: (() => void) | null = null;

    // Set a fallback timeout in case Firebase takes too long
    timeout = setTimeout(() => {
      console.warn("⚠️ Firebase auth check timeout - showing app anyway");
      setAuthReady(true);
      SplashScreen.hideAsync().catch(() => {});
    }, 8000);

    // Listen to Firebase auth state changes
    unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      try {
        if (firebaseUser) {
          // ✅ User is logged in
          console.log("✅ User authenticated:", firebaseUser.email);
          setUser(firebaseUser);

          // 🔄 Sync with database in background (non-blocking)
          firebaseUser
            .getIdToken(true)
            .then(() => {
              syncUserWithDatabase(firebaseUser).catch((e) => {
                console.warn("Background sync failed (non-critical):", e);
                setAuthError(`Background sync failed: ${e.message}`);
              });
            })
            .catch((e) => {
              console.error("Token refresh failed:", e);
              setAuthError(`Token refresh failed: ${e.message}`);
            });
        } else {
          // ❌ User is logged out
          console.log("❌ User not authenticated");
          setUser(null);
          setAuthError(null);
        }

        setAuthReady(true);

        // Clear timeout since auth check completed
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }

        SplashScreen.hideAsync().catch(() => {});
      } catch (error) {
        console.error("❌ Auth state change error:", error);
        setAuthReady(true);
        SplashScreen.hideAsync().catch(() => {});
      }
    });

    return () => {
      // Cleanup
      if (timeout) clearTimeout(timeout);
      if (unsubscribe) unsubscribe();
    };
  }, [setAuthReady, setUser, syncUserWithDatabase, setAuthError]);

  // Don't render anything until auth is ready
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
