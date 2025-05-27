
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Trophy, Target } from "lucide-react";
import { RecentDeaths } from "@/components/dashboard/RecentDeaths";

interface Pick {
  id: string;
  celebrity_name: string;
  is_hit: boolean;
  points_awarded: number;
  created_at: string;
}

const PlayerDetails = () => {
  const { playerId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const username = location.state?.username || "Player";

  const { data: picks = [], isLoading } = useQuery({
    queryKey: ['player-picks', playerId],
    queryFn: async () => {
      if (!playerId) return [];
      
      const { data, error } = await supabase
        .from('celebrity_picks')
        .select('*')
        .eq('user_id', playerId)
        .eq('game_year', 2025)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Pick[];
    },
    enabled: !!playerId
  });

  const totalScore = picks.reduce((sum, pick) => sum + (pick.points_awarded || 0), 0);
  const hits = picks.filter(pick => pick.is_hit).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="border-purple-800/30 text-white hover:bg-purple-800/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <User className="h-8 w-8 text-purple-400" />
              <h1 className="text-4xl font-bold text-white">{username}'s Picks</h1>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-black/40 border-purple-800/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                  <div>
                    <p className="text-sm text-gray-400">Total Score</p>
                    <p className="text-2xl font-bold text-yellow-400">{totalScore}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-purple-800/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="text-sm text-gray-400">Hits</p>
                    <p className="text-2xl font-bold text-green-400">{hits}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-purple-800/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-400">Total Picks</p>
                    <p className="text-2xl font-bold text-blue-400">{picks.length}/10</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-black/40 border-purple-800/30 mb-8">
            <CardHeader>
              <CardTitle className="text-white">Celebrity Picks for 2025</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-400">Loading picks...</div>
              ) : picks.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No picks found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-purple-800/30">
                      <TableHead className="text-purple-300">Celebrity</TableHead>
                      <TableHead className="text-purple-300">Status</TableHead>
                      <TableHead className="text-purple-300">Points</TableHead>
                      <TableHead className="text-purple-300">Date Added</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {picks.map((pick) => (
                      <TableRow key={pick.id} className="border-purple-800/30 hover:bg-purple-800/10">
                        <TableCell className="text-white font-semibold">
                          {pick.celebrity_name}
                        </TableCell>
                        <TableCell>
                          <Badge className={pick.is_hit ? "bg-green-600" : "bg-gray-600"}>
                            {pick.is_hit ? "Hit" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-yellow-400 font-bold">
                          {pick.points_awarded || 0}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {new Date(pick.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <RecentDeaths />
        </div>
      </div>
    </div>
  );
};

export default PlayerDetails;
