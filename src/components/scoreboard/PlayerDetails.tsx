
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CelebrityPick {
  id: string;
  celebrityName: string;
  pointsAwarded: number;
  createdAt: string;
}

interface PlayerScore {
  user: {
    id: string;
    username: string;
  };
  hits: CelebrityPick[];
  totalScore: number;
  rank: number;
}

interface PlayerDetailsProps {
  selectedPlayer: PlayerScore | null;
}

export const PlayerDetails = ({ selectedPlayer }: PlayerDetailsProps) => {
  return (
    <Card className="bg-black/40 border-purple-800/30">
      <CardHeader>
        <CardTitle className="text-white text-xl">
          {selectedPlayer ? `${selectedPlayer.user.username}'s Hits` : 'Select a Player'}
        </CardTitle>
      </CardHeader>
      <CardContent>
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
  );
};
