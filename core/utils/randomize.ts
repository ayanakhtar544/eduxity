// lib/utils/randomize.ts
import seedrandom from 'seedrandom'; // Seeded random generator

export const shuffleArraySecurely = (array: any[], studentId: string, examSalt: string) => {
  // Hackers can guess 'studentId', but they don't know 'examSalt' (Stored only in DB)
  const generator = seedrandom(`${studentId}_${examSalt}`); 
  
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(generator() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};