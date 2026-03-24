import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig'; // Apne path ke hisaab se check kar lena
import { useUserStore } from '../store/useUserStore';

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const router = useRouter();
  const segments = useSegments();
  
  // Zustand State
  const setUserData = useUserStore((state) => state.setUserData);
  const clearUserData = useUserStore((state) => state.clearUserData);

  // 🔥 1. CRACK 4 FIX: GLOBAL DATA FETCH
  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // App khulte hi sirf 1 baar data fetch hoga aur RAM mein save ho jayega
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            setUserData(userDocSnap.data()); 
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        clearUserData(); // Logout hone pe data saaf
      }
      setInitializing(false);
    });

    return () => subscriber();
  }, []);

  // 🔥 2. CRACK 5 FIX: ROUTE PROTECTION (THE GATEKEEPER)
  useEffect(() => {
    if (initializing) return; // Jab tak loading chal rahi hai tab tak ruk jao

    const isLoggedOut = !auth.currentUser;
    // Yeh wo pages hain jahan bina login ke jaa sakte hain (e.g. login, onboarding)
    const inAuthGroup = segments[0] === 'auth' || segments[0] === 'login' || segments[0] === 'onboarding' || !segments[0] || segments[0] === 'index';

    if (isLoggedOut && !inAuthGroup) {
      // Koi bina login test ya chat khol raha hai -> Usko login pe feko
      router.replace('/'); 
    } else if (!isLoggedOut && inAuthGroup) {
      // User logged in hai par login page par ghum raha hai -> Usko feed pe bhejo
      router.replace('/(tabs)'); 
    }
  }, [initializing, segments]);

  // Skeletons ki jagah ek global smooth loader dikhao jab app start ho
  if (initializing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  // Sab secure hai, ab pages dikhao
  return (
    <Stack screenOptions={{ headerShown: false }} />
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