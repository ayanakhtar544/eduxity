import { apiClient, ApiResponse } from "@/core/network/apiClient";

export const AIGeneratorService = {
  processMaterialAndGenerateFeed: async (payload: any) => {
    try {
      const data = await apiClient<ApiResponse<any>>("/api/ai/generate", {
        method: "POST",
        body: JSON.stringify(payload),
        timeout: 60000, // 🚨 Pass 60s timeout to network client
      } as any);
      return data.data;
      
    } catch (error) {
      console.error("❌ AIGeneratorService Error:", error);
      throw error; 
    }
  },
};