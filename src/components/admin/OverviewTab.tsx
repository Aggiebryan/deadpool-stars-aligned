
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users, Skull, Trophy } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";
import { IncendarScrapeButton } from "./IncendarScrapeButton";

interface OverviewTabProps {
  usersCount: number;
  deceasedCelebritiesCount: number;
  totalHits: number;
  fetchDeathsMutation: UseMutationResult<any, Error, void, unknown>;
}

export const OverviewTab = ({ usersCount, deceasedCelebritiesCount, totalHits, fetchDeathsMutation }: OverviewTabProps) => {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-black/40 border-purple-800/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-purple-400 text-sm">Total Users</CardTitle>
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
            <CardTitle className="text-purple-400 text-sm">Deceased Celebrities</CardTitle>
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
              <Trophy className="h-5 w-5 text-purple-400" />
              <span className="text-2xl font-bold text-white">{totalHits}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-black/40 border-purple-800/30">
          <CardHeader>
            <CardTitle className="text-white">Data Sources</CardTitle>
            <CardDescription className="text-gray-400">
              Fetch celebrity deaths from various sources
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-3">
              <Button
                onClick={() => fetchDeathsMutation.mutate()}
                disabled={fetchDeathsMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {fetchDeathsMutation.isPending ? "Fetching..." : "Fetch from RSS Feeds"}
              </Button>
              
              <IncendarScrapeButton />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-purple-800/30">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
            <CardDescription className="text-gray-400">
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-gray-300">
              <p>• Review and approve new celebrity deaths</p>
              <p>• Monitor RSS feed performance</p>
              <p>• Check system logs for errors</p>
              <p>• Update scoring rules as needed</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
