// Location: app/_layout.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged, signOut } from 'firebase/auth'; // 🔥 signOut import kiya
import { doc, onSnapshot } from 'firebase/firestore'; // 🔥 getDoc ki jagah onSnapshot

import 'react-native-gesture-handler';

// 🔥 Naya Loader Import
import EduxityLoader from '../components/EduxityLoader';

// 🔥 Firebase & Store Imports
import { auth, db } from '../firebaseConfig'; 
import { useUserStore } from '../store/useUserStore';
import RewardOverlay from '../components/RewardOverlay'; 

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const router = useRouter();
  const segments = useSegments();
  
  // Zustand State
  const setUserData = useUserStore((state) => state.setUserData);
  const clearUserData = useUserStore((state) => state.clearUserData);

  // ============================================================================
  // 🔥 1. GLOBAL REAL-TIME DATA FETCH (Auth Listener)
  // ============================================================================
  useEffect(() => {
    let unsubscribeUserDoc: any = null;

    const subscriber = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // User logged in hai, uska document real-time me suno
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        unsubscribeUserDoc = onSnapshot(userDocRef, async (userDocSnap) => {
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            
            // 🚨 ENFORCE BAN: Agar admin ne ban kiya hai toh user ko fauran bahar feko
            if (data.isBanned) {
              Alert.alert("Access Denied", "Your account has been suspended by Eduxity Admin.");
              await signOut(auth);
              clearUserData();
              return;
            }

            // 🎁 GIFT COINS & SYNC: Agar ban nahi hai, toh uska data (coins, xp) update karo
            setUserData(data); 
          }
        });
      } else {
        // User logged out hai
        if (unsubscribeUserDoc) unsubscribeUserDoc();
        clearUserData(); 
      }
      setInitializing(false);
    });

    return () => {
      subscriber();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, []);

  // ============================================================================
  // 🛡️ 2. ROUTE PROTECTION (THE GATEKEEPER)
  // ============================================================================
  useEffect(() => {
    if (initializing) return;

    const user = auth.currentUser;
    const inAuthGroup = segments[0] === 'auth' || segments[0] === 'login' || !segments[0];

    if (!user && !inAuthGroup) {
      router.replace('/'); 
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [initializing, auth.currentUser, segments]); 

  // ============================================================================
  // ⏳ 3. LOADING STATE
  // ============================================================================
  if (initializing) {
    return (
      <View style={styles.loaderContainer}>
        <EduxityLoader />
      </View>
    );
  }

  // ============================================================================
  // 📱 4. MAIN RENDER WITH GLOBAL OVERLAYS 
  // ============================================================================
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <RewardOverlay /> 
    </>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#f8fafc' 
  }
});