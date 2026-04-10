import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient, ApiResponse } from "@/core/network/apiClient";

export function useSessionItems(sessionId?: string | null, progress = 0) {
  return useInfiniteQuery({
    queryKey: ["sessionItems", sessionId, Math.floor(progress * 10)],
    enabled: !!sessionId,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const query = new URLSearchParams({
        take: "20",
        progress: progress.toFixed(2),
      });
      if (pageParam) {
        query.set("cursor", pageParam);
      }

      const res = await apiClient<ApiResponse<{ items: any[]; nextCursor: string | null }>>(
        `/api/sessions/${sessionId}/items?${query.toString()}`,
      );
      return res.data;
    },
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
  });
}
