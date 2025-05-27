
import { useState } from "react";
import { ScoreboardHeader } from "@/components/scoreboard/ScoreboardHeader";
import { PlayerRankings } from "@/components/scoreboard/PlayerRankings";
import { PlayerDetails } from "@/components/scoreboard/PlayerDetails";
import { ScoreboardNavigation } from "@/components/scoreboard/ScoreboardNavigation";
import { useScoreboardData } from "@/hooks/useScoreboardData";
import { User, CelebrityPick } from "@/types";

interface PlayerScore {
  user: User;
  hits: CelebrityPick[];
  totalScore: number;
  rank: number;
}

const Scoreboard = () => {
  const { playerScores } = useScoreboardData();
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerScore | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <ScoreboardHeader />

      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Leaderboard */}
            <PlayerRankings 
              playerScores={playerScores}
              selectedPlayer={selectedPlayer}
              onSelectPlayer={setSelectedPlayer}
            />

            {/* Player Details */}
            <PlayerDetails selectedPlayer={selectedPlayer} />
          </div>

          {/* Navigation */}
          <ScoreboardNavigation />
        </div>
      </div>
    </div>
  );
};

export default Scoreboard;
