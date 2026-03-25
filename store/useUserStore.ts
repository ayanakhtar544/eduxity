// Location: store/useUserStore.ts
import { create } from 'zustand';

// ============================================================================
// 🧠 1. TYPESCRIPT INTERFACES (For Auto-Complete & Safety)
// ============================================================================

// User ke data ka structure (Tere Firebase document jaisa)
export interface UserProfileData {
  uid?: string;
  displayName?: string;
  photoURL?: string;
  targetExam?: string;
  class?: string;
  studyTime?: string;
  city?: string;
  strongSubjects?: string[];
  weakSubjects?: string[];
  interests?: string[];
  friendIds?: string[];
  gamification?: {
    level: number;
    xp: number;
    eduCoins: number;
    currentStreak: number;
  };
  [key: string]: any; // Agar koi aur naya field aaye toh error na de
}

// Zustand Store ke Functions aur States ka structure
interface UserState {
  userData: UserProfileData | null;
  isLoggedIn: boolean;
  
  // Actions (Functions)
  setUserData: (data: UserProfileData) => void;
  updateUserData: (partialData: Partial<UserProfileData>) => void;
  clearUserData: () => void;
}

// ============================================================================
// 🚀 2. THE GLOBAL ZUSTAND STORE
// ============================================================================

export const useUserStore = create<UserState>((set) => ({
  // Initial States
  userData: null,
  isLoggedIn: false,

  // 📥 1. Set Full Data (Jab user login ho ya app start ho)
  setUserData: (data) => 
    set({ 
      userData: data, 
      isLoggedIn: true 
    }),

  // 🔄 2. Update Partial Data (Jaise XP badha, ya user ne city change ki)
  // Isse poora store overwrite nahi hoga, sirf wo field change hoga jo bheja hai
  updateUserData: (partialData) => 
    set((state) => ({
      userData: state.userData 
        ? { ...state.userData, ...partialData } 
        : (partialData as UserProfileData)
    })),

  // 🗑️ 3. Clear Data (Jab user Logout kare)
  clearUserData: () => 
    set({ 
      userData: null, 
      isLoggedIn: false 
    }),
}));