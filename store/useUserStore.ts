// File: store/useUserStore.ts
import { apiClient } from "@/core/network/apiClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// ========================================================
// 🔐 USER STATE INTERFACE
// ========================================================
interface UserState {
  user: any | null;
  sqlUser: any | null;
  authReady: boolean;
  authError: string | null;
  isLoading: boolean;

  setUser: (user: any) => void;
  setAuthReady: (ready: boolean) => void;
  setAuthError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  clearUserData: () => void;
  syncUserWithDatabase: (firebaseUser: any) => Promise<void>;
  setSqlUser: (user: any | null) => void;
}

// ========================================================
// ✅ GLOBAL STATE MANAGEMENT WITH PERSISTENCE
// ========================================================
export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      sqlUser: null,
      authReady: false,
      authError: null,
      isLoading: false,

      setUser: (user) => set({ user }),
      setSqlUser: (sqlUser) => set({ sqlUser }),
      setAuthReady: (ready) => set({ authReady: ready }),
      setAuthError: (error) => set({ authError: error }),
      setIsLoading: (loading) => set({ isLoading: loading }),

      clearUserData: () => {
        // 🚨 IMPORTANT: Clear everything on logout
        set({
          user: null,
          sqlUser: null,
          authReady: true,
          authError: null,
          isLoading: false,
        });
        // Also clear async storage to force full logout
        AsyncStorage.removeItem("user-storage").catch((e) =>
          console.error("Error clearing storage:", e),
        );
      },

      syncUserWithDatabase: async (firebaseUser: any) => {
        try {
          set({ isLoading: true, authError: null });

          if (!firebaseUser?.uid || !firebaseUser?.email) {
            throw new Error("Invalid Firebase user data");
          }

          const res = await apiClient<any>("/api/auth/sync", {
            method: "POST",
            body: JSON.stringify({
              firebaseUid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || undefined,
            }),
          });

          if (res?.data) {
            set({ sqlUser: res.data, authError: null });
          }
        } catch (error: any) {
          const errorMsg =
            error?.message || "Failed to sync user with database";
          console.error("❌ Sync error:", errorMsg);
          set({ authError: errorMsg });
          // Don't throw - let the app continue even if sync fails
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist sqlUser to avoid persisting sensitive auth data
      partialize: (state) => ({
        sqlUser: state.sqlUser,
      }),
    },
  ),
);
