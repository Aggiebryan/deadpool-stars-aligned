
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skull, ArrowLeft, Users, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Player {
  id: string;
  username: string;
  email: string;
  total_score: number;
  is_admin: boolean;
}

interface PlayerPick {
  id: string;
  celebrity_name: string;
  is_hit: boolean;
  points_awarded: number;
  created_at: string;
}

const Players = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerPicks, setPlayerPicks] = useState<PlayerPick[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('total_score', { ascending: false });

    if (error) {
      console.error('Error loading players:', error);
    } else {
      setPlayers(data || []);
    }
    setIsLoading(false);
  };

  const loadPlayerPicks = async (playerId: string) => {
    const { data, error } = await supabase
      .from('celebrity_picks')
      .select('*')
      .eq('user_id', playerId)
      .eq('game_year', 2025)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading player picks:', error);
      setPlayerPicks([]);
    } else {
      setPlayerPicks(data || []);
    }
  };

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
    loadPlayerPicks(player.id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading players...</div>
      </div>
    );
  }

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
            <Users className="inline h-10 w-10 text-purple-400 mr-3" />
            All Players
          </h1>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Players List */}
            <Card className="bg-black/40 border-purple-800/30">
              <CardHeader>
                <CardTitle className="text-white text-xl">Players ({players.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {players.map((player, index) => (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors ${
                        selectedPlayer?.id === player.id
                          ? 'bg-purple-900/40 border border-purple-600/50'
                          : 'bg-black/20 hover:bg-black/40'
                      }`}
                      onClick={() => handlePlayerSelect(player)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600">
                          <span className="text-white font-bold text-sm">{index + 1}</span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="text-white font-semibold">{player.username}</p>
                            {player.is_admin && (
                              <Badge className="bg-red-600 text-xs">Admin</Badge>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm">{player.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-purple-400 font-bold text-lg">{player.total_score}</p>
                        <p className="text-gray-400 text-sm">points</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Player Picks */}
            <Card className="bg-black/40 border-purple-800/30">
              <CardHeader>
                <CardTitle className="text-white text-xl">
                  {selectedPlayer ? `${selectedPlayer.username}'s Picks` : 'Select a Player'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedPlayer ? (
                  <p className="text-gray-400 text-center py-8">
                    Click on a player to see their celebrity picks
                  </p>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {playerPicks.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">
                        {selectedPlayer.username} hasn't made any picks yet
                      </p>
                    ) : (
                      <>
                        {playerPicks.map((pick) => (
                          <div
                            key={pick.id}
                            className={`p-4 rounded-lg border ${
                              pick.is_hit 
                                ? 'bg-red-900/20 border-red-800/30' 
                                : 'bg-black/20 border-purple-800/30'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-white font-semibold">{pick.celebrity_name}</h3>
                              {pick.is_hit && (
                                <Badge className="bg-red-600">
                                  Hit! +{pick.points_awarded} pts
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm">
                              Added: {new Date(pick.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                        
                        <div className="mt-6 p-4 bg-purple-900/20 border border-purple-600/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-white font-semibold">Picks: {playerPicks.length}/10</span>
                            <span className="text-white font-semibold">Hits: {playerPicks.filter(p => p.is_hit).length}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Navigation */}
          <div className="mt-8 text-center space-x-4">
            <Link to="/scoreboard">
              <Button variant="outline" className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white">
                View Scoreboard
              </Button>
            </Link>
            <Link to="/deceased">
              <Button variant="outline" className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white">
                View Deaths
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Players;
