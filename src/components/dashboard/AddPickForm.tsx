
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

interface AddPickFormProps {
  picksCount: number;
  maxPicks: number;
  onAddPick: (celebrityName: string) => Promise<void>;
}

export const AddPickForm = ({ picksCount, maxPicks, onAddPick }: AddPickFormProps) => {
  const [newCelebrityName, setNewCelebrityName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCelebrityName.trim()) return;

    setIsLoading(true);
    try {
      await onAddPick(newCelebrityName.trim());
      setNewCelebrityName("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-black/40 border-purple-800/30">
      <CardHeader>
        <CardTitle className="text-white">Add Celebrity Pick</CardTitle>
        <CardDescription className="text-gray-400">
          You can pick up to {maxPicks} celebrities for 2025 ({picksCount}/{maxPicks} used)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="celebrity" className="text-white">Celebrity Name</Label>
            <Input
              id="celebrity"
              type="text"
              value={newCelebrityName}
              onChange={(e) => setNewCelebrityName(e.target.value)}
              placeholder="Enter celebrity name..."
              className="bg-black/20 border-purple-800/30 text-white"
              disabled={picksCount >= maxPicks}
            />
          </div>
          {picksCount >= maxPicks && (
            <p className="text-red-400 text-sm">
              You have reached the maximum of {maxPicks} celebrity picks.
            </p>
          )}
          <Button 
            type="submit" 
            className="bg-purple-600 hover:bg-purple-700"
            disabled={isLoading || picksCount >= maxPicks || !newCelebrityName.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isLoading ? "Adding..." : "Add Pick"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
