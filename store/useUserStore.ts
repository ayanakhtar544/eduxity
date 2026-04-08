// File: store/useUserStore.ts
import { create } from 'zustand';
import { apiClient } from '@/core/network/apiClient';

// Explicit type define kar rahe hain
interface UserState {
  user: any | null;
  sqlUser: any | null;
  authReady: boolean;
  setUser: (user: any) => void;
  setAuthReady: (ready: boolean) => void;
  syncUserWithDatabase: (firebaseUser: any) => Promise<void>;
  setSqlUser: (user: any | null) => void;
}

// Named export (Very Important!)
export const useUserStore = create<UserState>((set) => ({
  user: null,
  sqlUser: null,
  authReady: false,
  setUser: (user) => set({ user }),
  setSqlUser: (sqlUser) => set({ sqlUser }),
  setAuthReady: (ready) => set({ authReady: ready }),
  
  // firebaseUser ko explicitly 'any' ya Firebase User type do
  syncUserWithDatabase: async (firebaseUser: any) => {
    try {
      if (!firebaseUser?.uid || !firebaseUser?.email) return;
      const res = await apiClient<any>('/api/auth/sync', {
        method: 'POST',
        body: JSON.stringify({
          firebaseUid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || undefined,
        }),
      });
      set({ sqlUser: res?.data ?? null });
    } catch (error) {
      console.error(error);
    }
  }
}));