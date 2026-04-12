// core/auth/useAuthHandler.ts
/*
 * ========================================================
 * 🔐 CENTRALIZED AUTHENTICATION HANDLER
 * ========================================================
 *
 * This module provides all authentication utilities for
 * Eduxity with cross-platform support (Web, iOS, Android).
 *
 * Features:
 * - Email/Password signup and login
 * - Google Sign-In for web and mobile
 * - Structured error handling
 * - User-friendly error messages
 * - Platform-specific implementations
 */

import * as WebBrowser from "expo-web-browser";
import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
    type Auth,
} from "firebase/auth";
import { useCallback } from "react";
import { Platform } from "react-native";
import { auth } from "../firebase/firebaseConfig";

// ========================================================
// 🔐 ERROR HANDLING
// ========================================================

/**
 * Structured error format for consistent error handling
 */
export interface AuthError {
  code: string;
  message: string;
  userMessage: string; // User-friendly message to display
}

/**
 * Parse Firebase auth errors into user-friendly messages
 *
 * Usage:
 * ```typescript
 * try {
 *   await signUp(email, password, name);
 * } catch (error: any) {
 *   const parsedError = parseFirebaseError(error);
 *   showToast(parsedError.userMessage);
 * }
 * ```
 */
export const parseFirebaseError = (error: any): AuthError => {
  const code = error?.code || "unknown_error";
  const message = error?.message || "An unknown error occurred";

  const errorMap: Record<string, string> = {
    "auth/invalid-credential": "Invalid email or password. Please try again.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/email-already-in-use": "This email is already registered.",
    "auth/invalid-email": "Invalid email format. Please check and try again.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/operation-not-allowed": "Authentication method is not enabled.",
    "auth/too-many-requests":
      "Too many login attempts. Please try again later.",
    "auth/network-request-failed":
      "Network error. Please check your connection.",
    "auth/popup-blocked": "Login popup was blocked. Please enable popups.",
    "auth/popup-closed-by-user": "Login was cancelled.",
  };

  return {
    code,
    message,
    userMessage: errorMap[code] || "Login failed. Please try again.",
  };
};

// ========================================================
// 🌐 GOOGLE AUTH SETUP (For future mobile support)
// ========================================================

// Important: This is prepared for native mobile support
// Currently web uses signInWithPopup, mobile uses error handling
WebBrowser.maybeCompleteAuthSession();

// ========================================================
// 📧 EMAIL/PASSWORD AUTHENTICATION
// ========================================================

/**
 * Email signup hook
 *
 * Usage:
 * ```typescript
 * const { signUp } = useEmailAuth();
 *
 * try {
 *   const user = await signUp('email@test.com', 'password123', 'John');
 *   console.log('User created:', user.uid);
 * } catch (error: any) {
 *   console.error(error.userMessage);
 * }
 * ```
 */
export const useEmailAuth = () => {
  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      try {
        if (!email || !password || !fullName) {
          throw new Error("Missing required fields");
        }

        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }

        const userCred = await createUserWithEmailAndPassword(
          auth as Auth,
          email.trim(),
          password,
        );

        // Update display name
        if (userCred.user) {
          await updateProfile(userCred.user, {
            displayName: fullName.trim(),
          });
        }

        return userCred.user;
      } catch (error: any) {
        throw parseFirebaseError(error);
      }
    },
    [],
  );

  /**
   * Email login
   *
   * Usage:
   * ```typescript
   * const { signIn } = useEmailAuth();
   *
   * try {
   *   const user = await signIn('email@test.com', 'password123');
   *   console.log('Logged in as:', user.email);
   * } catch (error: any) {
   *   console.error(error.userMessage);
   * }
   * ```
   */
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      if (!email || !password) {
        throw new Error("Missing email or password");
      }

      const userCred = await signInWithEmailAndPassword(
        auth as Auth,
        email.trim(),
        password,
      );

      return userCred.user;
    } catch (error: any) {
      throw parseFirebaseError(error);
    }
  }, []);

  return { signUp, signIn };
};

// ========================================================
// 🌐 GOOGLE AUTHENTICATION (CROSS-PLATFORM)
// ========================================================

/**
 * Google authentication hook
 *
 * Supports:
 * - Web: Uses Firebase signInWithPopup
 * - Mobile: Requires native Google Sign-In setup
 *
 * Usage:
 * ```typescript
 * const { signInWithGoogle } = useGoogleAuth();
 *
 * try {
 *   const user = await signInWithGoogle();
 *   console.log('Google user:', user.email);
 * } catch (error: any) {
 *   console.error(error.userMessage);
 * }
 * ```
 */
export const useGoogleAuth = () => {
  const signInWithGoogle = useCallback(async () => {
    try {
      let result: any;

      if (Platform.OS === "web") {
        // 🌐 WEB ONLY: Use Firebase signInWithPopup
        const provider = new GoogleAuthProvider();

        // Add required scopes
        provider.addScope("profile");
        provider.addScope("email");

        // Prompt user to select account
        provider.setCustomParameters({
          prompt: "select_account",
        });

        const response = await signInWithPopup(auth as Auth, provider);
        result = response;
      } else {
        // 📱 MOBILE: Requires proper OAuth setup
        console.log("📱 Mobile Google Sign-In");

        // For production, use @react-native-google-signin/google-signin
        // This is a placeholder for the error message
        const provider = new GoogleAuthProvider();
        provider.addScope("profile");
        provider.addScope("email");

        throw new Error(
          "Mobile Google Sign-In requires proper OAuth setup. " +
            "Install @react-native-google-signin/google-signin and configure it.",
        );
      }

      return result?.user;
    } catch (error: any) {
      throw parseFirebaseError(error);
    }
  }, []);

  return { signInWithGoogle };
};

// ========================================================
// 🚪 LOGOUT
// ========================================================

/**
 * Logout hook
 *
 * Note: Always call clearUserData() from store after logout
 *
 * Usage:
 * ```typescript
 * const { logout } = useLogout();
 * const { clearUserData } = useUserStore();
 *
 * const handleLogout = async () => {
 *   try {
 *     clearUserData(); // Clear store first
 *     await logout();   // Then sign out
 *     router.replace('/'); // Redirect
 *   } catch (error) {
 *     console.error('Logout failed');
 *   }
 * }
 * ```
 */
export const useLogout = () => {
  const logout = useCallback(async () => {
    try {
      await signOut(auth as Auth);
    } catch (error: any) {
      throw parseFirebaseError(error);
    }
  }, []);

  return { logout };
};

// ========================================================
// 🛡️ AUTH STATE LISTENER
// ========================================================

/**
 * Listen to Firebase auth state changes
 *
 * Usage:
 * ```typescript
 * useEffect(() => {
 *   const unsubscribe = auth.onAuthStateChanged((user) => {
 *     if (user) {
 *       console.log('User logged in:', user.email);
 *     } else {
 *       console.log('User logged out');
 *     }
 *   });
 *
 *   return () => unsubscribe();
 * }, []);
 * ```
 */
export const useAuthStateListener = (callback: (user: any) => void) => {
  const listener = useCallback(() => {
    const unsubscribe = auth.onAuthStateChanged(callback);
    return unsubscribe;
  }, [callback]);

  return { listener };
};

// ========================================================
// 📋 EXAMPLE IMPLEMENTATION
// ========================================================

/*
 * Example in a React component:
 *
 * import { useEmailAuth, useGoogleAuth } from '@/core/auth/useAuthHandler';
 * import { useUserStore } from '@/store/useUserStore';
 * import { useRouter } from 'expo-router';
 *
 * export default function AuthScreen() {
 *   const router = useRouter();
 *   const { signUp, signIn } = useEmailAuth();
 *   const { signInWithGoogle } = useGoogleAuth();
 *
 *   const handleSignUp = async () => {
 *     try {
 *       const user = await signUp(email, password, fullName);
 *       // User is now in Firebase
 *       router.replace('/onboarding');
 *     } catch (error: any) {
 *       showToast(error.userMessage, true); // Show error toast
 *     }
 *   };
 *
 *   const handleGoogleSignIn = async () => {
 *     try {
 *       const user = await signInWithGoogle();
 *       // Create/check user in Firestore here
 *       router.replace('/(tabs)');
 *     } catch (error: any) {
 *       showToast(error.userMessage, true);
 *     }
 *   };
 *
 *   return (
 *     <View>
 *       <TouchableOpacity onPress={handleSignUp}>
 *         <Text>Sign Up</Text>
 *       </TouchableOpacity>
 *       <TouchableOpacity onPress={handleGoogleSignIn}>
 *         <Text>Sign In with Google</Text>
 *       </TouchableOpacity>
 *     </View>
 *   );
 * }
 */

export default {};
