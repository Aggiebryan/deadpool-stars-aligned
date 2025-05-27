
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skull, Trophy, ArrowLeft, Crown } from "lucide-react";
import { getUsers, getPicks, getDeceasedCelebrities } from "@/utils/localStorage";
import { User, CelebrityPick } from "@/types";

interface PlayerScore {
  user: User;
  hits: CelebrityPick[];
  totalScore: number;
  rank: number;
}

const Scoreboard = () => {
  const [playerScores, setPlayerScores] = useState<PlayerScore[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerScore | null>(null);

  useEffect(() => {
    loadScoreboard();
  }, []);

  const loadScoreboard = () => {
    const users = getUsers().filter(u => !u.isAdmin);
    const allPicks = getPicks();
    const deceased = getDeceasedCelebrities();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-purple-800/30 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Skull className="h-8 w-8 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">DeadPool 2025</h1>
          </Link>
          <Link to="/">
            <Button variant="ghost" className="text-white hover:text-purple-300">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">
            <Trophy className="inline h-10 w-10 text-yellow-400 mr-3" />
            Scoreboard
          </h1>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Leaderboard */}
            <Card className="bg-black/40 border-purple-800/30">
              <CardHeader>
                <CardTitle className="text-white text-xl">Rankings</CardTitle>
              </CardHeader>
              <CardContent>

<table className="w-full text-white text-sm">
  <thead>
    <tr className="text-purple-400 border-b border-purple-800">
      <th className="text-left py-2">Rank</th>
      <th className="text-left py-2">Player</th>
      <th className="text-left py-2">Score</th>
      <th className="text-left py-2">Hits</th>
    </tr>
  </thead>
  <tbody>
    {playerScores.map(player => (
      <tr key={player.user.id} className="border-b border-purple-800/30 hover:bg-purple-900/20">
        <td className="py-2">{player.rank}</td>
        <td className="py-2">{player.user.displayName}</td>
        <td className="py-2">{player.totalScore}</td>
        <td className="py-2">{player.hits.length}</td>
      </tr>
    ))}
  </tbody>
</table>

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
                        onClick={() => setSelectedPlayer(playerScore)}
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

            {/* Player Details */}
            <Card className="bg-black/40 border-purple-800/30">
              <CardHeader>
                <CardTitle className="text-white text-xl">
                  {selectedPlayer ? `${selectedPlayer.user.username}'s Hits` : 'Select a Player'}
                </CardTitle>
              </CardHeader>
              <CardContent>

<table className="w-full text-white text-sm">
  <thead>
    <tr className="text-purple-400 border-b border-purple-800">
      <th className="text-left py-2">Rank</th>
      <th className="text-left py-2">Player</th>
      <th className="text-left py-2">Score</th>
      <th className="text-left py-2">Hits</th>
    </tr>
  </thead>
  <tbody>
    {playerScores.map(player => (
      <tr key={player.user.id} className="border-b border-purple-800/30 hover:bg-purple-900/20">
        <td className="py-2">{player.rank}</td>
        <td className="py-2">{player.user.displayName}</td>
        <td className="py-2">{player.totalScore}</td>
        <td className="py-2">{player.hits.length}</td>
      </tr>
    ))}
  </tbody>
</table>

                {!selectedPlayer ? (
                  <p className="text-gray-400 text-center py-8">
                    Click on a player to see their scoring details
                  </p>
                ) : selectedPlayer.hits.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    {selectedPlayer.user.username} hasn't scored any hits yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {selectedPlayer.hits.map((hit) => (
                      <div
                        key={hit.id}
                        className="p-4 bg-red-900/20 border border-red-800/30 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-semibold">{hit.celebrityName}</h3>
                          <Badge className="bg-red-600">
                            {hit.pointsAwarded} points
                          </Badge>
                        </div>
                        <p className="text-gray-400 text-sm">
                          Added: {new Date(hit.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                    
                    <div className="mt-6 p-4 bg-purple-900/20 border border-purple-600/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-semibold">Total Score:</span>
                        <span className="text-purple-400 font-bold text-xl">
                          {selectedPlayer.totalScore} points
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Navigation */}
          <div className="mt-8 text-center space-x-4">
            <Link to="/deceased">
              <Button variant="outline" className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white">
                View Deaths
              </Button>
            </Link>
            <Link to="/rules">
              <Button variant="outline" className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white">
                Game Rules
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scoreboard;



{selectedPlayer && (
  <Card className="mt-8 bg-black/40 border-purple-800/30">
    <CardHeader>
      <CardTitle className="text-white text-xl">
        {selectedPlayer.user.displayName}'s Picks
      </CardTitle>
    </CardHeader>
    <CardContent>
      <ul className="list-disc pl-6 text-purple-300">
        {selectedPlayer.hits.map((hit, i) => (
          <li key={i}>
            {hit.celebrityName} – {hit.pointsAwarded} pts
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
)}
