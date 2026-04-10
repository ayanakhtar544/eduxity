import { useMutation } from "@tanstack/react-query";
import { apiClient, ApiResponse } from "@/core/network/apiClient";

type StartSessionPayload = {
  topic: string;
  preferredType?: string;
  targetExam?: string;
};

export function useSession() {
  return useMutation({
    mutationFn: async (payload: StartSessionPayload) => {
      const res = await apiClient<ApiResponse<any>>("/api/sessions/start", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res.data;
    },
  });
}
