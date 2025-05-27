
import { useState, useEffect } from "react";
import { getUsers, getPicks } from "@/utils/localStorage";
import { User, CelebrityPick } from "@/types";

interface PlayerScore {
  user: User;
  hits: CelebrityPick[];
  totalScore: number;
  rank: number;
}

export const useScoreboardData = () => {
  const [playerScores, setPlayerScores] = useState<PlayerScore[]>([]);

  const loadScoreboard = () => {
    const users = getUsers().filter(u => !u.isAdmin);
    const allPicks = getPicks();

    const scores: PlayerScore[] = users.map(user => {
      const userPicks = allPicks.filter(pick => pick.userId === user.id && pick.gameYear === 2025);
      const hits = userPicks.filter(pick => pick.isHit);
      const totalScore = hits.reduce((sum, hit) => sum + hit.pointsAwarded, 0);

      return {
        user,
        hits,
        totalScore,
        rank: 0 // Will be calculated after sorting
      };
    });

    // Sort by total score (descending) and assign ranks
    scores.sort((a, b) => b.totalScore - a.totalScore);
    scores.forEach((score, index) => {
      score.rank = index + 1;
    });

    setPlayerScores(scores);
  };

  useEffect(() => {
    loadScoreboard();
  }, []);

  return { playerScores, loadScoreboard };
};
