import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient, ApiResponse } from "@/core/network/apiClient";

export function useFeed(uid?: string | null, mode: "FOR_YOU" | "PERSONALIZED" = "FOR_YOU") {
  return useInfiniteQuery({
    queryKey: ["feed", uid, mode],
    enabled: !!uid,
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const res = await apiClient<ApiResponse<{ items: any[]; nextPage: number | null }>>(
        `/api/feed?uid=${uid}&mode=${mode}&page=${pageParam}&take=20`,
      );
      return res.data;
    },
    getNextPageParam: (lastPage) => lastPage?.nextPage ?? undefined,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
    maxPages: 3, // keep roughly last 50-60 items in memory
  });
}
