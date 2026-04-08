// Location: core/api/aiGeneratorService.ts

import { apiClient, ApiResponse } from "@/core/network/apiClient";

export const AIGeneratorService = {
  
  processMaterialAndGenerateFeed: async (payload: any) => {
    try {
      const data = await apiClient<ApiResponse<any>>("/api/ai/generate", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return data.data;
      
    } catch (error) {
      console.error("❌ AIGeneratorService Error:", error);
      throw error; 
    }
  },

};