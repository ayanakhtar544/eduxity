 // core/firebase/firebaseConfig.js

import { initializeApp, getApps, getApp } from 'firebase/app';
// FIX: Web aur Native dono ke persistence import karne hain
import { initializeAuth, getAuth, getReactNativePersistence, browserLocalPersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

// Apni .env variables se config setup
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// 1. App initialize karo (check karke ki already initialized toh nahi hai)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.authDomain) {
  console.error("[Firebase] Missing required config: apiKey/projectId/authDomain");
}

// 2. 🚨 CRITICAL FIX: Platform check lagaya hai
// Agar Web hai toh browserLocalPersistence, nahi toh AsyncStorage
const auth = (() => {
  try {
    return initializeAuth(app, {
      persistence: Platform.OS === 'web'
        ? browserLocalPersistence
        : getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
})();

// 3. Database initialize
const db = getFirestore(app);

export { app, auth, db };