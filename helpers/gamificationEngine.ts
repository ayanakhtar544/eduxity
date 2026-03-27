import { doc, setDoc, collection, query, where, getDocs, documentId, runTransaction } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// ==========================================
// 🎯 1. THE ACTION DICTIONARY (XP & Coins Config)
// ==========================================
const ACTION_MAP = {
  'UPLOAD_NOTE': { baseXP: 100, coins: 10, statKey: 'notesUploaded' },
  'CREATE_POST': { baseXP: 20, coins: 2, statKey: 'postsCreated' },
  'POLL_ANSWER': { baseXP: 10, coins: 1, statKey: 'pollsAnswered' },
  'POLL_CORRECT': { baseXP: 30, coins: 5, statKey: 'pollsCorrect' }, 
  'RECEIVE_LIKE': { baseXP: 5, coins: 1, statKey: 'likesReceived' },
  'STUDY_SESSION': { baseXP: 50, coins: 5, statKey: 'studySessions' }
};

export type ActionType = keyof typeof ACTION_MAP;

// ==========================================
// 🎖️ 2. THE 12 DYNAMIC BADGES SYSTEM (UPDATED WITH CUSTOM ICONS)
// ==========================================
export const BADGES_LIST = [
  { id: 'b1', name: 'First Step', icon: require('../assets/images/badges/b1.png'), condition: (stats: any) => stats.postsCreated >= 1 },
  { id: 'b2', name: 'Content Creator', icon: require('../assets/images/badges/b2.png'), condition: (stats: any) => stats.postsCreated >= 10 },
  { id: 'b3', name: 'Scholar', icon: require('../assets/images/badges/b3.png'), condition: (stats: any) => stats.notesUploaded >= 1 },
  { id: 'b4', name: 'Library Master', icon: require('../assets/images/badges/b4.png'), condition: (stats: any) => stats.notesUploaded >= 10 },
  { id: 'b5', name: 'Voter', icon: require('../assets/images/badges/b5.png'), condition: (stats: any) => stats.pollsAnswered >= 5 },
  { id: 'b6', name: 'Quiz Whiz', icon: require('../assets/images/badges/b6.png'), condition: (stats: any) => stats.pollsCorrect >= 10 },
  { id: 'b7', name: 'Getting Noticed', icon: require('../assets/images/badges/b7.png'), condition: (stats: any) => stats.likesReceived >= 10 },
  { id: 'b8', name: 'Famous', icon: require('../assets/images/badges/b8.png'), condition: (stats: any) => stats.likesReceived >= 100 },
  { id: 'b9', name: 'Consistent', icon: require('../assets/images/badges/b9.png'), condition: (stats: any) => stats.currentStreak >= 3 },
  { id: 'b10', name: 'Unstoppable', icon: require('../assets/images/badges/b10.png'), condition: (stats: any) => stats.currentStreak >= 7 },
  { id: 'b11', name: 'Addict', icon: require('../assets/images/badges/b11.png'), condition: (stats: any) => stats.currentStreak >= 30 },
  { id: 'b12', name: 'Eduxity Pro', icon: require('../assets/images/badges/b12.png'), condition: (stats: any, level: number) => level >= 10 },
];

// ==========================================
// 🚀 3. THE MAIN GAMIFICATION ENGINE (TRANSACTIONAL & HACK-PROOF)
// ==========================================
export const processAction = async (userId: string, action: ActionType) => {
  try {
    const userRef = doc(db, 'users', userId);
    const actionData = ACTION_MAP[action];

    // 🔥 TRANSACTION SHURU: Ye block queue me chalega, koi race condition nahi hogi
    const result = await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists()) {
        throw new Error("User does not exist");
      }

      let userData = userSnap.data();
      let gamification = userData.gamification || { 
        xp: 0, level: 1, eduCoins: 0, currentStreak: 0, lastActiveDate: '', 
        badges: [], stats: { notesUploaded: 0, postsCreated: 0, pollsAnswered: 0, pollsCorrect: 0, likesReceived: 0 } 
      };

      // --- STREAK LOGIC ---
      const todayStr = new Date().toDateString();
      let streak = gamification.currentStreak || 0;
      
      if (gamification.lastActiveDate !== todayStr) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (gamification.lastActiveDate === yesterday.toDateString()) {
          streak += 1; 
        } else {
          streak = 1;  
        }
      }
      
      const streakMultiplier = 1 + (Math.min(streak, 10) * 0.1); 

      // --- XP & COINS CALCULATION ---
      const finalXP = Math.round(actionData.baseXP * streakMultiplier);
      const finalCoins = actionData.coins;
      
      const newTotalXP = (gamification.xp || 0) + finalXP;
      const newTotalCoins = (gamification.eduCoins || 0) + finalCoins;
      
      const newLevel = Math.floor(Math.sqrt(newTotalXP / 100)) + 1;
      const leveledUp = newLevel > (gamification.level || 1);

      // --- STATS & BADGES ENGINE ---
      let currentStats = gamification.stats || {};
      currentStats[actionData.statKey] = (currentStats[actionData.statKey] || 0) + 1;
      currentStats.currentStreak = streak;

      let earnedBadges = gamification.badges || [];
      let newBadgesUnlocked: any[] = [];

      BADGES_LIST.forEach(badge => {
        if (!earnedBadges.includes(badge.id) && badge.condition(currentStats, newLevel)) {
          earnedBadges.push(badge.id);
          newBadgesUnlocked.push(badge);
        }
      });

      // 🔥 TRANSACTION UPDATE (Safe Merge)
      transaction.set(userRef, {
        gamification: {
          xp: newTotalXP,
          eduCoins: newTotalCoins,
          level: newLevel,
          currentStreak: streak,
          lastActiveDate: todayStr,
          stats: currentStats,
          badges: earnedBadges
        }
      }, { merge: true });

      return {
        success: true, xpEarned: finalXP, coinsEarned: finalCoins,
        leveledUp: leveledUp, newLevel: newLevel, newBadges: newBadgesUnlocked, currentStreak: streak
      };
    });

    return result;

  } catch (e) {
    console.log("Gamification Engine Error:", e);
    return { success: false };
  }
};

// ==========================================
// 🏆 4. THE FRIEND LEADERBOARD ENGINE
// ==========================================
export const getFriendsLeaderboard = async (currentUserId: string, friendsListIds: string[]) => {
  try {
    const idsToFetch = [currentUserId, ...friendsListIds];
    const users: any[] = [];

    for (let i = 0; i < idsToFetch.length; i += 10) {
      const chunk = idsToFetch.slice(i, i + 10);
      const q = query(collection(db, 'users'), where(documentId(), 'in', chunk));
      const snap = await getDocs(q);
      snap.forEach(doc => users.push({ id: doc.id, ...doc.data() }));
    }

    users.sort((a, b) => (b.gamification?.xp || 0) - (a.gamification?.xp || 0));

    return users.map((u, index) => ({
      rank: index + 1, id: u.id, name: u.displayName || 'Eduxity Warrior',
      avatar: u.photoURL, level: u.gamification?.level || 1, xp: u.gamification?.xp || 0, streak: u.gamification?.currentStreak || 0
    }));

  } catch (e) {
    console.log("Leaderboard Error:", e);
    return [];
  }
};

// ==========================================
// ⭐ 5. CUSTOM XP AWARDER (TRANSACTIONAL & HACK-PROOF)
// ==========================================
export const awardXP = async (userId: string, xpToAdd: number, reason: string) => {
  try {
    const userRef = doc(db, 'users', userId);

    // 🔥 TRANSACTION SHURU: XP loss bypass fix
    const result = await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists()) {
        throw new Error("User does not exist");
      }

      let userData = userSnap.data();
      let gamification = userData.gamification || { 
        xp: 0, level: 1, eduCoins: 0, currentStreak: 0, lastActiveDate: '', 
        badges: [], stats: {} 
      };

      const newTotalXP = (gamification.xp || 0) + xpToAdd;
      
      const newLevel = Math.floor(Math.sqrt(newTotalXP / 100)) + 1;
      const leveledUp = newLevel > (gamification.level || 1);

      transaction.set(userRef, {
        gamification: {
          xp: newTotalXP,
          level: newLevel
        }
      }, { merge: true });

      return { 
        leveledUp: leveledUp, 
        newLevel: newLevel, 
        xpAdded: xpToAdd 
      };
    });

    return result;

  } catch (e) {
    console.log("Award XP Error:", e);
    return null;
  }
};