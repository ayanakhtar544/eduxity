import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen'; // 🔥 SplashScreen control ke liye
import { onAuthStateChanged } from 'firebase/auth';

// Paths check kar lena (Tere project ke hisaab se)
import { auth } from '../core/firebase/firebaseConfig';
import { useUserStore } from '../store/useUserStore';

// 1. Splash screen ko tab tak roko jab tak hum ready na hon
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const setUser = useUserStore((state) => state.setUser);
  const segments = useSegments();
  const router = useRouter();

  // ==========================================
  // 🔐 1. AUTH & INITIALIZATION
  // ==========================================
  useEffect(() => {
    async function prepare() {
      try {
        // Firebase Auth Listener
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          console.log("🔥 Auth State Updated:", user ? "User Found" : "No User");
          setUser(user);
          setAppIsReady(true); // Signal ki ab app ready hai
        });

        return () => unsubscribe();
      } catch (e) {
        console.warn("❌ Initialization Error:", e);
        setAppIsReady(true); // Error aaye tab bhi app dikhao, crash mat karo
      }
    }

    prepare();
  }, [setUser]);

  // ==========================================
  // 🚀 2. HIDE LOGO & NAVIGATION
  // ==========================================
  useEffect(() => {
    if (!appIsReady) return;

    const hideSplashAndNavigate = async () => {
      // 1. Sabse pehle logo ko hatao screen se
      await SplashScreen.hideAsync();
      console.log("✅ Splash Screen Hidden");

      // 2. Phir check karo kahan bhejna hai
      const inAuthGroup = segments[0] === '(auth)';

      if (!auth.currentUser && !inAuthGroup) {
        router.replace('/(auth)/auth');
      } else if (auth.currentUser && inAuthGroup) {
        router.replace('/(tabs)');
      }
    };

    hideSplashAndNavigate();
  }, [appIsReady, segments]);

  // ==========================================
  // ⏳ 3. FALLBACK UI (Just in case)
  // ==========================================
  if (!appIsReady) {
    // Ye tab tak dikhega jab tak Splash Screen active hai (Background me)
    return null; 
  }

  // ✅ Ab asli screens load hongi
  return <Slot />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  }
});