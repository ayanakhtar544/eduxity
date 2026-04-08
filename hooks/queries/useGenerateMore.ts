import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiResponse } from "@/core/network/apiClient";

export function useGenerateMore(sessionId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!sessionId) throw new Error("sessionId required");
      const res = await apiClient<ApiResponse<any>>(`/api/sessions/${sessionId}/generate-more`, {
        method: "POST",
      });
      return res.data;
    },
    onSuccess: () => {
      if (sessionId) {
        queryClient.invalidateQueries({ queryKey: ["sessionItems", sessionId] });
      }
    },
  });
}
