
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

interface CelebrityPick {
  id: string;
  celebrity_name: string;
  is_hit: boolean;
  points_awarded: number;
  created_at: string;
}

interface PicksListProps {
  picks: CelebrityPick[];
  maxPicks: number;
  onRemovePick: (pickId: string) => Promise<void>;
}

export const PicksList = ({ picks, maxPicks, onRemovePick }: PicksListProps) => {
  return (
    <Card className="bg-black/40 border-purple-800/30">
      <CardHeader>
        <CardTitle className="text-white">Your DeadPool Picks</CardTitle>
        <CardDescription className="text-gray-400">
          {picks.length}/{maxPicks} celebrities selected
        </CardDescription>
      </CardHeader>
      <CardContent>
        {picks.length === 0 ? (
          <p className="text-gray-400 text-center py-4">
            No picks yet. Add your first celebrity to get started!
          </p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {picks.map((pick) => (
              <div
                key={pick.id}
                className="flex items-center justify-between p-3 bg-black/20 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-white">{pick.celebrity_name}</span>
                  {pick.is_hit && (
                    <Badge className="bg-red-600">
                      Hit! +{pick.points_awarded} pts
                    </Badge>
                  )}
                </div>
                {!pick.is_hit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRemovePick(pick.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
