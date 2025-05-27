
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skull, Shield, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { UserStatsCards } from "@/components/dashboard/UserStatsCards";
import { AddPickForm } from "@/components/dashboard/AddPickForm";
import { PicksList } from "@/components/dashboard/PicksList";

interface CelebrityPick {
  id: string;
  celebrity_name: string;
  is_hit: boolean;
  points_awarded: number;
  created_at: string;
}

const Dashboard = () => {
  const { user, profile, signOut } = useAuth();
  const [userPicks, setUserPicks] = useState<CelebrityPick[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadUserPicks();
    }
  }, [user]);

  const loadUserPicks = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('celebrity_picks')
      .select('*')
      .eq('user_id', user.id)
      .eq('game_year', 2025);

    if (error) {
      console.error('Error loading picks:', error);
      return;
    }

    setUserPicks(data || []);
  };

  const handleAddPick = async (celebrityName: string) => {
    if (!user) return;

    // Check if user already has 10 picks (enforced on frontend too)
    if (userPicks.length >= 10) {
      toast({
        title: "Pick limit reached",
        description: "You can only have 10 celebrities in your DeadPool list",
        variant: "destructive",
      });
      return;
    }

    // Check if celebrity is already picked by this user
    if (userPicks.some(pick => pick.celebrity_name.toLowerCase() === celebrityName.toLowerCase())) {
      toast({
        title: "Duplicate pick",
        description: "You've already picked this celebrity",
        variant: "destructive",
      });
      return;
    }

    // Check if celebrity is already picked by another user
    const { data: existingPicks } = await supabase
      .from('celebrity_picks')
      .select('id')
      .ilike('celebrity_name', celebrityName)
      .eq('game_year', 2025)
      .neq('user_id', user.id);

    if (existingPicks && existingPicks.length > 0) {
      toast({
        title: "Celebrity unavailable",
        description: "This celebrity has already been picked by another player",
        variant: "destructive",
      });
      return;
    }

    // Add new pick with timestamp set to December 31, 2024
    const { error } = await supabase
      .from('celebrity_picks')
      .insert({
        user_id: user.id,
        celebrity_name: celebrityName,
        game_year: 2025,
        created_at: '2024-12-31T23:59:59+00:00',
        updated_at: '2024-12-31T23:59:59+00:00'
      });

    if (error) {
      console.error('Error adding pick:', error);
      if (error.message.includes('Cannot have more than 10 picks')) {
        toast({
          title: "Pick limit reached",
          description: "You can only have 10 celebrities in your DeadPool list",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add celebrity pick",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Celebrity added",
        description: `${celebrityName} has been added to your DeadPool list`,
      });
      loadUserPicks();
    }
  };

  const handleRemovePick = async (pickId: string) => {
    const { error } = await supabase
      .from('celebrity_picks')
      .delete()
      .eq('id', pickId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove celebrity pick",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Celebrity removed",
        description: "Celebrity has been removed from your DeadPool list",
      });
      loadUserPicks();
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  if (!user || !profile) {
    return null;
  }

  const hitPicks = userPicks.filter(pick => pick.is_hit);
  const maxPicks = 10;

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
            <span className="text-white">Welcome, {profile.username}</span>
            {profile.is_admin && (
              <Link to="/admin">
                <Button variant="outline" className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white">
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Panel
                </Button>
              </Link>
            )}
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
          <UserStatsCards
            totalScore={profile.total_score}
            picksCount={userPicks.length}
            maxPicks={maxPicks}
            hitCount={hitPicks.length}
          />

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Add New Pick */}
            <AddPickForm
              picksCount={userPicks.length}
              maxPicks={maxPicks}
              onAddPick={handleAddPick}
            />

            {/* Current Picks */}
            <PicksList
              picks={userPicks}
              maxPicks={maxPicks}
              onRemovePick={handleRemovePick}
            />
          </div>

          {/* Navigation Links */}
          <div className="mt-8 text-center space-x-4">
            <Link to="/scoreboard">
              <Button variant="outline" className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white">
                View Scoreboard
              </Button>
            </Link>
            <Link to="/players">
              <Button variant="outline" className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white">
                All Players
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
