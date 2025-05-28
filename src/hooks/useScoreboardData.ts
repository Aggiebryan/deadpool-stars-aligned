
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User, CelebrityPick } from "@/types";

interface PlayerScore {
  user: User;
  hits: CelebrityPick[];
  totalScore: number;
  rank: number;
}

export const useScoreboardData = () => {
  const [playerScores, setPlayerScores] = useState<PlayerScore[]>([]);

  // Query all users and their picks from Supabase
  const { data: users = [] } = useQuery({
    queryKey: ['scoreboard-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_admin', false)
        .order('total_score', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: picks = [] } = useQuery({
    queryKey: ['scoreboard-picks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('celebrity_picks')
        .select('*')
        .eq('game_year', 2025)
        .eq('is_hit', true);
      
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (users.length === 0) return;

    const scores: PlayerScore[] = users.map(user => {
      const userPicks = picks.filter(pick => pick.user_id === user.id);
      const hits = userPicks.map(pick => ({
        id: pick.id,
        userId: pick.user_id,
        celebrityName: pick.celebrity_name,
        gameYear: pick.game_year,
        isHit: pick.is_hit,
        pointsAwarded: pick.points_awarded,
        createdAt: pick.created_at
      }));

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isAdmin: user.is_admin,
          totalScore: user.total_score,
          createdAt: user.created_at
        },
        hits,
        totalScore: user.total_score,
        rank: 0 // Will be calculated after sorting
      };
    });

    // Sort by total score (descending) and assign ranks
    scores.sort((a, b) => b.totalScore - a.totalScore);
    scores.forEach((score, index) => {
      score.rank = index + 1;
    });

    setPlayerScores(scores);
  }, [users, picks]);

  const loadScoreboard = () => {
    // This function is kept for compatibility but data is loaded via React Query
  };

  return { playerScores, loadScoreboard };
};
