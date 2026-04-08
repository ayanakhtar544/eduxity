// Location: core/utils/srsAlgorithm.ts

export interface SRSData {
  interval: number;       // Days until next review
  repetition: number;     // Correct streak
  easeFactor: number;     // Difficulty multiplier
  nextReviewDate: number; // Timestamp in milliseconds
}

export const calculateNextReview = (isCorrect: boolean, previousSRS?: SRSData): SRSData => {
  // Default values for a brand new card
  let { interval = 0, repetition = 0, easeFactor = 2.5 } = previousSRS || {};
  
  // Quality: 5 for easy/correct, 0 for complete blackout/wrong
  const quality = isCorrect ? 5 : 0;

  if (quality >= 3) {
    // Sahi answer: Interval badhao
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetition += 1;
  } else {
    // 🚨 Galat answer: Streak zero, next day wapas dikhao!
    repetition = 0;
    interval = 1; 
  }

  // Update ease factor (card kitna tough/easy hai)
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3; // Minimum limit

  // Calculate Next Review Timestamp
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);

  return { 
    interval, 
    repetition, 
    easeFactor, 
    nextReviewDate: nextDate.getTime() 
  };
};