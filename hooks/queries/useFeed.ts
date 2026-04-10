import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient, ApiResponse } from "@/core/network/apiClient";

export function useFeed(uid?: string | null, mode: "FOR_YOU" | "PERSONALIZED" = "FOR_YOU") {
  return useInfiniteQuery({
    queryKey: ["feed", uid, mode],
    enabled: !!uid,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const query = new URLSearchParams({
        mode,
        take: "20",
      });
      if (pageParam) {
        query.set("cursor", pageParam);
      }

      const res = await apiClient<ApiResponse<{ items: any[]; nextPage: number | null }>>(
        `/api/feed?${query.toString()}`,
      );
      return res.data;
    },
    getNextPageParam: (lastPage: any) => lastPage?.nextCursor ?? undefined,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
    maxPages: 3, // keep roughly last 50-60 items in memory
  });
}
