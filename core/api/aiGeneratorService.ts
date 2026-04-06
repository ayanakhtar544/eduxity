// Location: core/api/aiGeneratorService.ts
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase/firebaseConfig";

// 📝 Type definition for strict payload checking
export interface GenerateSpacePayload {
  topic: string;
  examType: string;
  difficulty: string;
  learningGoal: string;
  timeAvailable: string;
  language: string;
  youtubeLink?: string | null;
  hasFiles?: boolean;
  count?: number;
  userClass?: string;
  directText?: string;
}

export const AIGeneratorService = {
  
  /**
   * Securely calls the Cloud Function to generate AI learning materials.
   */
  processMaterialAndGenerateFeed: async (payload: GenerateSpacePayload): Promise<boolean> => {
    try {
      console.log(`🚀 Triggering AI Engine for topic: ${payload.topic}...`);

      // 1. Connect to the exact name of your deployed Cloud Function
      const generateLearningSpace = httpsCallable(functions, "generateLearningSpace");

      // 2. Call the function (Firebase auto-attaches Auth tokens & handles CORS)
      const response = await generateLearningSpace(payload);

      // 3. Handle the response
      const data = response.data as { success: boolean; sessionId: string; message: string };
      
      if (data.success) {
        console.log(`✅ Space Generated! Session ID: ${data.sessionId}`);
        return true;
      } else {
        throw new Error("AI generation returned failure status.");
      }

    } catch (error: any) {
      // 🚨 Detailed Error Handling for Debugging
      console.error("❌ AIGeneratorService Failed:");
      if (error.code) {
        // Firebase specific errors (e.g., 'functions/unauthenticated')
        console.error(`Code: ${error.code} | Message: ${error.message}`);
      } else {
        console.error(error.message);
      }
      throw error; // Re-throw to let the UI (index.tsx) handle the alert & loading state
    }
  }
};