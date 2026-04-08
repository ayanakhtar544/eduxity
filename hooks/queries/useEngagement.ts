import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiResponse } from "@/core/network/apiClient";
import { useUserStore } from "@/store/useUserStore";

export function useStreak() {
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const updateStreak = useMutation({
    mutationFn: async () => {
      if (!user?.uid) throw new Error("User not authenticated");
      return apiClient<ApiResponse<any>>("/streak/update", {
        method: "POST",
        body: { uid: user.uid },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["streak", user?.uid] });
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
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const challenge = useQuery({
    queryKey: ["daily-challenge"],
    queryFn: () => apiClient<ApiResponse<any>>("/daily-challenge"),
  });

  const completeChallenge = useMutation({
    mutationFn: async (challengeId: string) => {
      if (!user?.uid) throw new Error("User not authenticated");
      return apiClient<ApiResponse<any>>("/daily-challenge/complete", {
        method: "POST",
        body: { uid: user.uid, challengeId },
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
  const { user } = useUserStore();
  
  return useQuery({
    queryKey: ["review-due", user?.uid],
    queryFn: () => {
      if (!user?.uid) return null;
      return apiClient<ApiResponse<any[]>>(`/review/due?uid=${user.uid}`);
    },
    enabled: !!user?.uid,
  });
}
