
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Skull, Calendar, Play } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";

interface OverviewTabProps {
  usersCount: number;
  deceasedCelebritiesCount: number;
  totalHits: number;
  fetchDeathsMutation: UseMutationResult<any, Error, void, unknown>;
}

export const OverviewTab = ({ 
  usersCount, 
  deceasedCelebritiesCount, 
  totalHits, 
  fetchDeathsMutation 
}: OverviewTabProps) => {
  const handleFetchDeaths = () => {
    fetchDeathsMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-black/40 border-purple-800/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-purple-400 text-sm">Total Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-400" />
              <span className="text-2xl font-bold text-white">{usersCount}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-black/40 border-purple-800/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-purple-400 text-sm">Celebrity Deaths</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Skull className="h-5 w-5 text-purple-400" />
              <span className="text-2xl font-bold text-white">{deceasedCelebritiesCount}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-black/40 border-purple-800/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-purple-400 text-sm">Total Hits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-purple-400" />
              <span className="text-2xl font-bold text-white">{totalHits}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-black/40 border-purple-800/30">
        <CardHeader>
          <CardTitle className="text-white">Manual Death Fetch</CardTitle>
          <CardDescription className="text-gray-400">
            Manually trigger the celebrity death fetching process to test automation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleFetchDeaths}
            disabled={fetchDeathsMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Play className="h-4 w-4 mr-2" />
            {fetchDeathsMutation.isPending ? "Fetching Deaths..." : "Fetch Deaths Now"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
