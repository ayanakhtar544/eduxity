// Location: app/_layout.tsx
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// 🔥 FIrebase & Store Imports
import { auth, db } from '../firebaseConfig'; // Apne path ke hisaab se check kar lena
import { useUserStore } from '../store/useUserStore';
import RewardOverlay from '../components/RewardOverlay'; // Reward component

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const router = useRouter();
  const segments = useSegments();
  
  // Zustand State
  const setUserData = useUserStore((state) => state.setUserData);
  const clearUserData = useUserStore((state) => state.clearUserData);

  // ============================================================================
  // 🔥 1. GLOBAL DATA FETCH (Auth Listener)
  // ============================================================================
  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            setUserData(userDocSnap.data()); 
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        clearUserData(); 
      }
      setInitializing(false);
    });

    return () => subscriber();
  }, []);

  // ============================================================================
  // 🛡️ 2. ROUTE PROTECTION (THE GATEKEEPER)
  // ============================================================================
  useEffect(() => {
    if (initializing) return;

    const user = auth.currentUser;
    // Check if user is on an auth screen (login, signup, or root)
    const inAuthGroup = segments[0] === 'auth' || segments[0] === 'login' || !segments[0];

    if (!user && !inAuthGroup) {
      // User logout ho gaya hai -> Seedha Welcome/Login page pe phenko
      router.replace('/'); 
    } else if (user && inAuthGroup) {
      // User login hai -> Dashboard pe bhej do
      router.replace('/(tabs)');
    }
  }, [initializing, auth.currentUser, segments]); 

  // ============================================================================
  // ⏳ 3. LOADING STATE
  // ============================================================================
  if (initializing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  // ============================================================================
  // 📱 4. MAIN RENDER WITH GLOBAL OVERLAYS (Crucial for Animations)
  // ============================================================================
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      {/* 🔥 REWARD OVERLAY HAMESHA TOP PAR RAHEGA. ISKE BINA ANIMATION NAHI AAYEGA */}
      <RewardOverlay /> 
    </>
  );
}

// ============================================================================
// 🎨 STYLES
// ============================================================================
const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#f8fafc'
  }
});