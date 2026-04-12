import { apiClient, ApiResponse } from "@/core/network/apiClient";

export const AIGeneratorService = {
  processMaterialAndGenerateFeed: async (payload: any) => {
    try {
      console.log(
        "🤖 AIGeneratorService: Calling apiClient with payload:",
        payload,
      );

      const data = await apiClient(
  "/generate-learning-posts",
  {
    method: "POST",
    body: JSON.stringify(payload),
    timeout: 60000
  }
)

      console.log("🤖 AIGeneratorService: Received response:", data);
      return data.data;
    } catch (error) {
      console.error("❌ AIGeneratorService Error:", error);
      throw error;
    }
  },
};
