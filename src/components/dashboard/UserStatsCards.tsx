
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Skull } from "lucide-react";

interface UserStatsCardsProps {
  totalScore: number;
  picksCount: number;
  maxPicks: number;
  hitCount: number;
}

export const UserStatsCards = ({ totalScore, picksCount, maxPicks, hitCount }: UserStatsCardsProps) => {
  return (
    <div className="grid md:grid-cols-3 gap-6 mb-8">
      <Card className="bg-black/40 border-purple-800/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-purple-400 text-sm">Total Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-purple-400" />
            <span className="text-2xl font-bold text-white">{totalScore}</span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-black/40 border-purple-800/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-purple-400 text-sm">Picks Made</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-purple-400" />
            <span className="text-2xl font-bold text-white">{picksCount}/{maxPicks}</span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-black/40 border-purple-800/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-purple-400 text-sm">Hits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Skull className="h-5 w-5 text-purple-400" />
            <span className="text-2xl font-bold text-white">{hitCount}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
