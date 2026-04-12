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
// 🔐 STRUCTURED ERROR HANDLING
// ========================================================
export interface AuthError {
  code: string;
  message: string;
  userMessage: string; // User-friendly message
}

const parseFirebaseError = (error: any): AuthError => {
  const code = error?.code || "unknown_error";
  const message = error?.message || "An unknown error occurred";

  // Map Firebase error codes to user-friendly messages
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
// 🔐 GOOGLE AUTH CONFIGURATION FOR EXPO
// ========================================================
// Setup must happen outside component to prevent re-initialization
WebBrowser.maybeCompleteAuthSession();

// Note: Mobile Google Auth setup would go here
// Currently using web-only signInWithPopup
// For production mobile, integrate @react-native-google-signin/google-signin

// ========================================================
// 📧 EMAIL/PASSWORD AUTHENTICATION
// ========================================================
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

        // Update user profile with display name
        if (userCred.user) {
          await updateProfile(userCred.user, { displayName: fullName.trim() });
        }

        return userCred.user;
      } catch (error: any) {
        throw parseFirebaseError(error);
      }
    },
    [],
  );

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
export const useGoogleAuth = () => {
  const signInWithGoogle = useCallback(async () => {
    try {
      let result: any;

      if (Platform.OS === "web") {
        // 🌐 WEB: Use Firebase signInWithPopup
        const provider = new GoogleAuthProvider();

        // Add custom parameters to ensure email is returned
        provider.addScope("profile");
        provider.addScope("email");

        // Set custom parameters
        provider.setCustomParameters({
          prompt: "select_account",
        });

        const response = await signInWithPopup(auth as Auth, provider);
        result = response;
      } else {
        // 📱 MOBILE: Use Expo Google Sign-In with native support
        console.log("📱 Attempting mobile Google Sign-In...");

        // For now, we use a fallback approach via Firebase
        // This requires the Google Sign-In to be properly configured
        // You can replace this with native @react-native-google-signin/google-signin
        const provider = new GoogleAuthProvider();
        provider.addScope("profile");
        provider.addScope("email");

        // Note: signInWithPopup doesn't work well on native
        // Use native Google Sign-In package instead
        throw new Error(
          "Mobile Google Sign-In requires proper OAuth setup. " +
            "Please ensure google-services.json is properly configured in Firebase Console.",
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
// 🛡️ AUTH STATE OBSERVER
// ========================================================
export const useAuthStateListener = (callback: (user: any) => void) => {
  const listener = useCallback(() => {
    const unsubscribe = auth.onAuthStateChanged(callback);
    return unsubscribe;
  }, [callback]);

  return { listener };
};
