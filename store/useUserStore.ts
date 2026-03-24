import { create } from 'zustand';

interface UserState {
  userData: any | null;
  isLoggedIn: boolean;
  setUserData: (data: any) => void;
  clearUserData: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  userData: null,
  isLoggedIn: false,
  setUserData: (data) => set({ userData: data, isLoggedIn: true }),
  clearUserData: () => set({ userData: null, isLoggedIn: false }),
}));