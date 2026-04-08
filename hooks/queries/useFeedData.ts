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
  nextPage: number | null;
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
    queryFn: async ({ pageParam = 1 }) => {
      const query = new URLSearchParams({
        page: String(pageParam),
        mode: scope,
        take: "20",
      });

      if (currentUid) query.set("uid", currentUid);
      if (sessionId) query.set("sessionId", sessionId);
      if (sessionTopic) query.set("sessionTopic", sessionTopic);

      const result = await apiClient<ApiResponse<FeedApiPayload>>(`/api/feed?${query.toString()}`);

      return {
        posts: result.data.items ?? [],
        nextPage: result.data.nextPage,
      };
    },
    getNextPageParam: (lastPage) => lastPage?.nextPage ?? undefined,
    initialPageParam: 1,
    retry: 2,
  });
}