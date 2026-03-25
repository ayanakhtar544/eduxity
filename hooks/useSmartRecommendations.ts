import { useState, useEffect, useMemo } from 'react';
import { RecommendationEngine, MatchResult, UserProfile } from '../services/RecommendationEngine';

export const useSmartRecommendations = (
  currentUser: UserProfile | null, 
  allUsers: UserProfile[], 
  myConnections: any[]
) => {
  const [recommendedList, setRecommendedList] = useState<MatchResult[]>([]);

  useEffect(() => {
    if (!currentUser || allUsers.length === 0) return;

    // 1. Filter out people I am already connected to or have pending requests with
    const connectionUids = new Set(
      myConnections.map(conn => 
        conn.senderId === currentUser.uid ? conn.receiverId : conn.senderId
      )
    );

    const strangersOnly = allUsers.filter(user => !connectionUids.has(user.uid || user.id));

    // 2. Pass to our Engine
    const rankedMatches = RecommendationEngine.generateTopMatches(currentUser, strangersOnly);

    // 3. Set to State
    setRecommendedList(rankedMatches);

  }, [currentUser, allUsers, myConnections]);

  return { recommendedList };
};