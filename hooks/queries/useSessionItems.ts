import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient, ApiResponse } from "@/core/network/apiClient";

export function useSessionItems(sessionId?: string | null, progress = 0) {
  return useInfiniteQuery({
    queryKey: ["sessionItems", sessionId, Math.floor(progress * 10)],
    enabled: !!sessionId,
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const res = await apiClient<ApiResponse<{ items: any[]; nextPage: number | null }>>(
        `/api/sessions/${sessionId}/items?page=${pageParam}&take=20&progress=${progress.toFixed(2)}`,
      );
      return res.data;
    },
    getNextPageParam: (lastPage) => lastPage?.nextPage ?? undefined,
  });
}
