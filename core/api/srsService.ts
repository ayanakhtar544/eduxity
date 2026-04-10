// Location: core/api/srsService.ts
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { calculateNextReview, SRSData } from '../utils/srsAlgorithm';

export const SRSService = {
  
  /**
   * Updates or creates the SRS record for a specific card when user answers.
   */
  processAnswer: async (userId: string, item: any, isCorrect: boolean) => {
    try {
      // 1. Reference to the specific card in user's personal deck
      const cardRef = doc(db, 'users', userId, 'srs_deck', item.id);
      const snap = await getDoc(cardRef);
      
      const previousSRS: SRSData | undefined = snap.exists() ? snap.data().srs : undefined;

      // 2. Calculate new dates using SM-2
      const newSRS = calculateNextReview(isCorrect, previousSRS);

      // 3. Save back to Firestore
      // Hum card ka content (item) bhi save kar rahe hain taaki next day DB se 
      // seedha render kar sakein bina main feed collection ko join kiye.
      await setDoc(cardRef, {
        itemId: item.id,
        type: item.type,
        topic: item.topic || "General",
        cardContent: item, 
        srs: newSRS,
        lastReviewedAt: Date.now()
      }, { merge: true });

      console.log(`🧠 SRS Updated: Next review in ${newSRS.interval} day(s)`);
      return newSRS;

    } catch (error) {
      console.error("❌ SRS Service Error:", error);
    }
  }
};