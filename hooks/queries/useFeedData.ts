// Location: hooks/queries/useFeedData.ts (Ya jahan bhi tera ye hook bana hua hai)
import { useInfiniteQuery } from "@tanstack/react-query";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "../../core/firebase/firebaseConfig";
import { apiClient, ApiResponse } from "../../core/network/apiClient";

export interface FeedItem {
  id: string;
  title: string;
  topic?: string | null;
  category: string;
  content?: string | null;
  createdAt?: string;
}

interface FeedApiPayload {
  items: FeedItem[];
  nextCursor: string | null;
}

interface UseFeedDataOptions {
  scope?: "FOR_YOU" | "PERSONALIZED";
  sessionId?: string | null;
  sessionTopic?: string | null;
}

export function useFeedData(currentUid?: string, options: UseFeedDataOptions = {}) {
  const { scope = "PERSONALIZED", sessionId, sessionTopic } = options;
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => setAuthReady(true));
    return unsubscribe;
  }, []);

  return useInfiniteQuery({
    queryKey: ["feedData", scope, currentUid, sessionId, sessionTopic],
    enabled: authReady && (scope === "FOR_YOU" || !!currentUid),
    queryFn: async ({ pageParam = null }) => {
      const query = new URLSearchParams({
        mode: scope,
        take: "20",
      });

      if (sessionId) query.set("sessionId", sessionId);
      if (sessionTopic) query.set("sessionTopic", sessionTopic);
      if (pageParam) query.set("cursor", String(pageParam));

      const result = await apiClient<ApiResponse<FeedApiPayload>>(`/api/feed?${query.toString()}`);

      return {
        posts: result.data.items ?? [],
        nextCursor: result.data.nextCursor,
      };
    },
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
    initialPageParam: null as string | null,
    retry: 2,
  });
}
