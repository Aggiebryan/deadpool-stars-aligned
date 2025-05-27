
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Trophy, Skull } from "lucide-react";

interface UserStatsCardsProps {
  totalUsers: number;
  totalDeaths: number;
  topScore: number;
}

export const UserStatsCards = ({ totalUsers, totalDeaths, topScore }: UserStatsCardsProps) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card 
        className="bg-black/40 border-purple-800/30 hover:bg-black/60 transition-colors cursor-pointer"
        onClick={() => navigate('/players')}
      >
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Users className="h-8 w-8 text-purple-400" />
            <div>
              <p className="text-sm font-medium text-gray-400">Total Players</p>
              <p className="text-2xl font-bold text-white">{totalUsers}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card 
        className="bg-black/40 border-purple-800/30 hover:bg-black/60 transition-colors cursor-pointer"
        onClick={() => navigate('/deaths')}
      >
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Skull className="h-8 w-8 text-red-400" />
            <div>
              <p className="text-sm font-medium text-gray-400">Confirmed Deaths</p>
              <p className="text-2xl font-bold text-white">{totalDeaths}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card 
        className="bg-black/40 border-purple-800/30 hover:bg-black/60 transition-colors cursor-pointer"
        onClick={() => navigate('/scoreboard')}
      >
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Trophy className="h-8 w-8 text-yellow-400" />
            <div>
              <p className="text-sm font-medium text-gray-400">Top Score</p>
              <p className="text-2xl font-bold text-white">{topScore}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
