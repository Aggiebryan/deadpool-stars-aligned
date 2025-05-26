
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skull, Trophy, Users, Plus, Trash2, LogOut } from "lucide-react";
import { getCurrentUser, setCurrentUser, getUserPicks, getPicks, savePicks, generateId } from "@/utils/localStorage";
import { toast } from "@/hooks/use-toast";
import { CelebrityPick } from "@/types";

const Dashboard = () => {
  const [currentUser, setCurrentUserState] = useState(getCurrentUser());
  const [userPicks, setUserPicks] = useState<CelebrityPick[]>([]);
  const [newCelebrityName, setNewCelebrityName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    if (currentUser.isAdmin) {
      navigate("/admin");
      return;
    }

    loadUserPicks();
  }, [currentUser, navigate]);

  const loadUserPicks = () => {
    if (currentUser) {
      const picks = getUserPicks(currentUser.id);
      setUserPicks(picks);
    }
  };

  const handleAddPick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newCelebrityName.trim()) return;

    setIsLoading(true);

    // Check if user already has 10 picks
    if (userPicks.length >= 10) {
      toast({
        title: "Pick limit reached",
        description: "You can only have 10 celebrities in your list",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Check if celebrity is already picked by this user
    if (userPicks.some(pick => pick.celebrityName.toLowerCase() === newCelebrityName.toLowerCase())) {
      toast({
        title: "Duplicate pick",
        description: "You've already picked this celebrity",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Check if celebrity is already picked by another user
    const allPicks = getPicks();
    const existingPick = allPicks.find(pick => 
      pick.celebrityName.toLowerCase() === newCelebrityName.toLowerCase() && 
      pick.gameYear === 2025 &&
      pick.userId !== currentUser.id
    );

    if (existingPick) {
      toast({
        title: "Celebrity unavailable",
        description: "This celebrity has already been picked by another player",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Add new pick
    const newPick: CelebrityPick = {
      id: generateId(),
      userId: currentUser.id,
      celebrityName: newCelebrityName.trim(),
      gameYear: 2025,
      isHit: false,
      pointsAwarded: 0,
      createdAt: new Date().toISOString()
    };

    const updatedPicks = [...allPicks, newPick];
    savePicks(updatedPicks);
    setUserPicks([...userPicks, newPick]);
    setNewCelebrityName("");

    toast({
      title: "Celebrity added",
      description: `${newCelebrityName} has been added to your list`,
    });

    setIsLoading(false);
  };

  const handleRemovePick = (pickId: string) => {
    const allPicks = getPicks();
    const updatedPicks = allPicks.filter(pick => pick.id !== pickId);
    savePicks(updatedPicks);
    setUserPicks(userPicks.filter(pick => pick.id !== pickId));

    toast({
      title: "Celebrity removed",
      description: "Celebrity has been removed from your list",
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    navigate("/");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  if (!currentUser) {
    return null;
  }

  const hitPicks = userPicks.filter(pick => pick.isHit);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-purple-800/30 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Skull className="h-8 w-8 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">DeadPool 2025</h1>
          </Link>
          <div className="flex items-center space-x-4">
            <span className="text-white">Welcome, {currentUser.username}</span>
            <Button onClick={handleLogout} variant="ghost" className="text-white hover:text-purple-300">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* User Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-black/40 border-purple-800/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-purple-400 text-sm">Total Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-purple-400" />
                  <span className="text-2xl font-bold text-white">{currentUser.totalScore}</span>
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
                  <span className="text-2xl font-bold text-white">{userPicks.length}/10</span>
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
                  <span className="text-2xl font-bold text-white">{hitPicks.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Add New Pick */}
            <Card className="bg-black/40 border-purple-800/30">
              <CardHeader>
                <CardTitle className="text-white">Add Celebrity Pick</CardTitle>
                <CardDescription className="text-gray-400">
                  You can pick up to 10 celebrities for 2025
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddPick} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="celebrity" className="text-white">Celebrity Name</Label>
                    <Input
                      id="celebrity"
                      type="text"
                      value={newCelebrityName}
                      onChange={(e) => setNewCelebrityName(e.target.value)}
                      placeholder="Enter celebrity name..."
                      className="bg-black/20 border-purple-800/30 text-white"
                      disabled={userPicks.length >= 10}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="bg-purple-600 hover:bg-purple-700"
                    disabled={isLoading || userPicks.length >= 10 || !newCelebrityName.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {isLoading ? "Adding..." : "Add Pick"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Current Picks */}
            <Card className="bg-black/40 border-purple-800/30">
              <CardHeader>
                <CardTitle className="text-white">Your Celebrity Picks</CardTitle>
                <CardDescription className="text-gray-400">
                  {userPicks.length}/10 celebrities selected
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userPicks.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">
                    No picks yet. Add your first celebrity to get started!
                  </p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {userPicks.map((pick) => (
                      <div
                        key={pick.id}
                        className="flex items-center justify-between p-3 bg-black/20 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-white">{pick.celebrityName}</span>
                          {pick.isHit && (
                            <Badge className="bg-red-600">
                              Hit! +{pick.pointsAwarded} pts
                            </Badge>
                          )}
                        </div>
                        {!pick.isHit && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemovePick(pick.id)}
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
          </div>

          {/* Navigation Links */}
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
            <Link to="/rules">
              <Button variant="outline" className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white">
                Game Rules
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
