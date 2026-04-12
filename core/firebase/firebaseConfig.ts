import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { browserLocalPersistence, getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

// ========================================================
// 🔥 FIREBASE CONFIGURATION WITH VALIDATION
// ========================================================
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// ⚠️ Validate Firebase config on initialization
const validateFirebaseConfig = () => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);
  
  if (missingFields.length > 0) {
    console.warn(
      `⚠️ Firebase Config Warning: Missing ${missingFields.join(', ')}.\n` +
      `Please ensure all EXPO_PUBLIC_FIREBASE_* environment variables are set.\n` +
      `See .env.local.example for reference.`
    );
  }
};

validateFirebaseConfig();

let app;
let auth;
let db;

// 🚨 STRICT INITIALIZATION: Initialize only once
try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    auth = initializeAuth(app, {
      persistence: Platform.OS === 'web' 
        ? browserLocalPersistence 
        : getReactNativePersistence(AsyncStorage),
    });
  } else {
    // Reuse existing instance (prevents session loss on hot reload)
    app = getApp();
    auth = getAuth(app);
  }
  
  db = getFirestore(app);
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  throw error;
}

export { app, auth, db };
