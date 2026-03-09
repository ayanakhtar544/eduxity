import { doc, getDoc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const awardXP = async (userId: string, xpToAdd: number, actionName: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      
      // Default to 0 if gamification object doesn't exist yet
      const currentXP = userData.gamification?.xp || 0;
      const currentLevel = userData.gamification?.level || 1;
      
      const newXP = currentXP + xpToAdd;

      // 🧠 PRO-MAX LEVEL FORMULA: Every level requires more XP than the last
      const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;
      
      // 🪙 ECONOMY: 10% of earned XP converts to EduCoins
      const coinsToAdd = Math.floor(xpToAdd * 0.1); 

      // Update Database
      await updateDoc(userRef, {
        'gamification.xp': increment(xpToAdd),
        'gamification.eduCoins': increment(coinsToAdd),
        'gamification.level': newLevel,
        'gamification.lastActiveDate': new Date().toISOString()
      });

      // 🚀 Return true if LEVEL UP happened, so UI can show celebration!
      return {
         success: true,
         leveledUp: newLevel > currentLevel,
         newLevel: newLevel,
         earnedCoins: coinsToAdd
      };
    } else {
      // First time user init
      await setDoc(userRef, {
        gamification: { xp: xpToAdd, level: 1, eduCoins: Math.floor(xpToAdd * 0.1), currentStreak: 1 }
      }, { merge: true });
      return { success: true, leveledUp: false, newLevel: 1, earnedCoins: 0 };
    }
  } catch (e) {
    console.log("Gamification Engine Error:", e);
    return { success: false };
  }
};