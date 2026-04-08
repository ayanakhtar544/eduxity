type RankInput = {
  topicMatch: number;
  difficultyMatch: number;
  engagementScore: number;
  freshness: number;
  unseenBoost: number;
  userPreference: number;
};

export function scoreFeedItem(input: RankInput) {
  return (
    0.25 * input.topicMatch +
    0.2 * input.difficultyMatch +
    0.2 * input.engagementScore +
    0.15 * input.freshness +
    0.1 * input.unseenBoost +
    0.1 * input.userPreference
  );
}

export function normalize(value: number, min: number, max: number) {
  if (max <= min) return 0;
  const result = (value - min) / (max - min);
  return Math.max(0, Math.min(1, result));
}

export function recencyDecay(hoursOld: number) {
  // Half-life style decay for smoother ranking.
  return Math.exp(-hoursOld / 72);
}
