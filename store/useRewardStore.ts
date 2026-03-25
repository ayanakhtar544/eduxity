import { create } from 'zustand';

// ============================================================================
// 🧠 1. STRICT TYPESCRIPT INTERFACES
// ============================================================================
export interface BadgeData {
  id: string;
  name: string;
  icon: string;
}

export interface RewardPayload {
  xpEarned?: number;
  coinsEarned?: number;
  leveledUp?: boolean;
  newLevel?: number;
  newBadges?: BadgeData[];
}

interface RewardState {
  isVisible: boolean;
  data: RewardPayload | null;
  timeoutId: NodeJS.Timeout | null; // ⚡ Memory leak se bachne ke liye
  
  // Actions
  showReward: (payload: RewardPayload) => void;
  hideReward: () => void;
}

// ============================================================================
// 🚀 2. THE ZUSTAND ENGINE
// ============================================================================
export const useRewardStore = create<RewardState>((set, get) => ({
  isVisible: false,
  data: null,
  timeoutId: null,

  showReward: (payload) => {
    // 🧹 Purana timer clear karo agar user ne jaldi se 2 task kar diye
    const currentTimeout = get().timeoutId;
    if (currentTimeout) {
      clearTimeout(currentTimeout);
    }

    // ⏱️ Naya 4-second ka timer lagao
    const newTimeoutId = setTimeout(() => {
      set({ isVisible: false });
      // Animation poori hone ke baad data clear karo (0.5s delay)
      setTimeout(() => set({ data: null, timeoutId: null }), 500);
    }, 4000);

    set({
      isVisible: true,
      data: payload,
      timeoutId: newTimeoutId,
    });
  },

  hideReward: () => {
    const currentTimeout = get().timeoutId;
    if (currentTimeout) clearTimeout(currentTimeout);
    
    set({ isVisible: false });
    setTimeout(() => set({ data: null, timeoutId: null }), 500);
  },
}));