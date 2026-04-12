// File: server/utils/feedRanking.ts

export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

export function recencyDecay(createdAt: Date): number {
  const now = new Date();
  const hoursSince = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  // Exponential decay: newer items get higher score
  return Math.exp(-hoursSince / 24); // Half-life of 24 hours
}

export function scoreFeedItem(item: any, userInteractions: any[]): number {
  let score = 0;

  // Base recency score
  score += recencyDecay(item.createdAt) * 10;

  // Engagement score
  const likes = item._count?.likes || 0;
  const comments = item._count?.comments || 0;
  const shares = item._count?.shares || 0;
  score += likes * 2 + comments * 3 + shares * 5;

  // User interaction boost
  const userInteracted = userInteractions.some(
    (interaction) => interaction.feedItemId === item.id,
  );
  if (userInteracted) {
    score *= 1.2; // 20% boost for interacted items
  }

  // Difficulty adjustment (easier items might be more engaging)
  const difficultyMultiplier =
    item.learningItem?.difficulty === 1
      ? 1.1
      : item.learningItem?.difficulty === 2
        ? 1.0
        : item.learningItem?.difficulty === 3
          ? 0.9
          : 1.0;
  score *= difficultyMultiplier;

  return score;
}
