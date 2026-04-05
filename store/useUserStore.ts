import { create } from 'zustand';
import { User } from 'firebase/auth';

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void; // 🔥 Ye line zaroori hai
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  
  // 🎯 setUser function jo Firebase se data lega aur store me save karega
  setUser: (user) => set({ user: user }),
  
  // Logout ke liye helper
  clearUser: () => set({ user: null }),
}));