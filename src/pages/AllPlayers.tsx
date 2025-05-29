import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trophy, Users, ArrowLeft } from "lucide-react";
interface Player {
  id: string;
  username: string;
  total_score: number;
  created_at: string;
}
const AllPlayers = () => {
  const navigate = useNavigate();
  const {
    data: players = [],
    isLoading
  } = useQuery({
    queryKey: ['all-players'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('profiles').select('id, username, total_score, created_at').eq('is_admin', false).order('total_score', {
        ascending: false
      });
      if (error) throw error;
      return data as Player[];
    }
  });
  const handleViewPicks = (playerId: string, username: string) => {
    navigate(`/player/${playerId}`, {
      state: {
        username
      }
    });
  };
  return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button onClick={() => navigate(-1)} variant="outline" className="border-purple-800/30 text-gray-800 bg-zinc-200 hover:bg-zinc-100">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-purple-400" />
              <h1 className="text-4xl font-bold text-white">All Players</h1>
            </div>
          </div>

          <Card className="bg-black/40 border-purple-800/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
                Player Rankings ({players.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <div className="text-center py-8 text-gray-400">Loading players...</div> : players.length === 0 ? <div className="text-center py-8 text-gray-400">No players found</div> : <Table>
                  <TableHeader>
                    <TableRow className="border-purple-800/30">
                      <TableHead className="text-purple-300">Rank</TableHead>
                      <TableHead className="text-purple-300">Player</TableHead>
                      <TableHead className="text-purple-300">Total Score</TableHead>
                      <TableHead className="text-purple-300">Joined</TableHead>
                      <TableHead className="text-purple-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {players.map((player, index) => <TableRow key={player.id} className="border-purple-800/30 hover:bg-purple-800/10">
                        <TableCell className="text-white font-medium">
                          #{index + 1}
                        </TableCell>
                        <TableCell className="text-white font-semibold">
                          {player.username}
                        </TableCell>
                        <TableCell className="text-yellow-400 font-bold">
                          {player.total_score}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {new Date(player.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button onClick={() => handleViewPicks(player.id, player.username)} className="bg-purple-600 hover:bg-purple-700" size="sm">
                            View Picks
                          </Button>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
};
export default AllPlayers;