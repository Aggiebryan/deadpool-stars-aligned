
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown } from "lucide-react";

interface PlayerScore {
  user: {
    id: string;
    username: string;
  };
  hits: any[];
  totalScore: number;
  rank: number;
}

interface PlayerRankingsProps {
  playerScores: PlayerScore[];
  selectedPlayer: PlayerScore | null;
  onSelectPlayer: (player: PlayerScore) => void;
}

export const PlayerRankings = ({ playerScores, selectedPlayer, onSelectPlayer }: PlayerRankingsProps) => {
  return (
    <Card className="bg-black/40 border-purple-800/30">
      <CardHeader>
        <CardTitle className="text-white text-xl">Rankings</CardTitle>
      </CardHeader>
      <CardContent>
        {playerScores.length === 0 ? (
          <p className="text-gray-400 text-center py-4">
            No players registered yet
          </p>
        ) : (
          <div className="space-y-3">
            {playerScores.map((playerScore) => (
              <div
                key={playerScore.user.id}
                className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors ${
                  selectedPlayer?.user.id === playerScore.user.id
                    ? 'bg-purple-900/40 border border-purple-600/50'
                    : 'bg-black/20 hover:bg-black/40'
                }`}
                onClick={() => onSelectPlayer(playerScore)}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600">
                    {playerScore.rank === 1 && <Crown className="h-4 w-4 text-yellow-400" />}
                    {playerScore.rank !== 1 && <span className="text-white font-bold text-sm">{playerScore.rank}</span>}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{playerScore.user.username}</p>
                    <p className="text-gray-400 text-sm">{playerScore.hits.length} hits</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-purple-400 font-bold text-lg">{playerScore.totalScore}</p>
                  <p className="text-gray-400 text-sm">points</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
