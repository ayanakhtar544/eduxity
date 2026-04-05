// Location: core/api/aiGeneratorService.ts
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase/firebaseConfig"; // Ensure functions is exported from your config

export const AIGeneratorService = {
  processMaterialAndGenerateFeed: async (params: {
    topic: string;
    subject?: string;
    userClass: string;
    examType: string;
    difficulty: string;
    directText?: string; 
    language?: string; 
    count?: number;
    sessionId?: string | null; 
  }): Promise<boolean> => {
    try {
      console.log(`🚀 Sending secure AI request to backend for topic: ${params.topic}`);
      
      // Call the secure Cloud Function
      const generateSecureAIFeed = httpsCallable(functions, 'generateSecureAIFeed');
      
      // Pass the parameters. The backend will handle Gemini API calls and Firestore saving.
      const result = await generateSecureAIFeed(params);
      
      if ((result.data as any).success) {
          console.log(`✅ Secure Generation Complete! Posts saved.`);
          return true;
      }
      return false;

    } catch (error: any) {
      // Handle the Rate Limit Error gracefully
      if (error.code === 'resource-exhausted') {
         alert("Slow down! You've hit the AI generation limit for this hour. Take a break and review your saved posts.");
      } else {
         console.error(`❌ Secure Generation Failed:`, error.message);
      }
      return false;
    }
  }
};