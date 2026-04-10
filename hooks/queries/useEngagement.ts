import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiResponse } from "@/core/network/apiClient";

// NOTE: uid is intentionally NOT sent in request bodies here.
// All authed API routes extract the user identity exclusively from the
// Firebase Bearer token (set by apiClient from the auth store). Passing
// uid in the body is redundant and creates a defence-in-depth risk.

export function useStreak() {
  const queryClient = useQueryClient();

  const updateStreak = useMutation({
    mutationFn: async () => {
      return apiClient<ApiResponse<any>>("/streak/update", { method: "POST", body: {} });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["streak"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });

  return { updateStreak };
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => apiClient<ApiResponse<any[]>>("/leaderboard"),
  });
}

export function useDailyChallenge() {
  const queryClient = useQueryClient();

  const challenge = useQuery({
    queryKey: ["daily-challenge"],
    queryFn: () => apiClient<ApiResponse<any>>("/daily-challenge"),
  });

  const completeChallenge = useMutation({
    mutationFn: async (challengeId: string) => {
      // uid is NOT sent — server resolves identity from Bearer token
      return apiClient<ApiResponse<any>>("/daily-challenge/complete", {
        method: "POST",
        body: { challengeId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-challenge"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });

  return { challenge, completeChallenge };
}

export function useReviewDue() {
  return useQuery({
    queryKey: ["review-due"],
    // uid is NOT sent as query param — server resolves from Bearer token
    queryFn: () => apiClient<ApiResponse<any[]>>("/review/due"),
  });
}
