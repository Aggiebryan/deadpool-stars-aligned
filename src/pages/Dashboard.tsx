
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserStatsCards } from "@/components/dashboard/UserStatsCards";
import { AddPickForm } from "@/components/dashboard/AddPickForm";
import { PicksList } from "@/components/dashboard/PicksList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { user, profile, signOut } = useAuth();
  const queryClient = useQueryClient();

  const { data: picks = [] } = useQuery({
    queryKey: ['user-picks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('celebrity_picks')
        .select('*')
        .eq('user_id', user.id)
        .eq('game_year', 2025)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Get total users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('total_score')
        .eq('is_admin', false);
      
      if (usersError) throw usersError;

      // Get total approved deaths
      const { data: deaths, error: deathsError } = await supabase
        .from('deceased_celebrities')
        .select('id')
        .eq('game_year', 2025)
        .eq('is_approved', true);
      
      if (deathsError) throw deathsError;

      const totalUsers = users?.length || 0;
      const totalDeaths = deaths?.length || 0;
      const topScore = users?.reduce((max, user) => Math.max(max, user.total_score || 0), 0) || 0;

      return { totalUsers, totalDeaths, topScore };
    }
  });

  const addPickMutation = useMutation({
    mutationFn: async (celebrityName: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('celebrity_picks')
        .insert({
          user_id: user.id,
          celebrity_name: celebrityName,
          game_year: 2025,
          is_hit: false,
          points_awarded: 0
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-picks', user?.id] });
      toast({
        title: "Pick added successfully",
        description: "Your celebrity pick has been added to your list.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error adding pick",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const removePickMutation = useMutation({
    mutationFn: async (pickId: string) => {
      const { error } = await supabase
        .from('celebrity_picks')
        .delete()
        .eq('id', pickId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-picks', user?.id] });
      toast({
        title: "Pick removed",
        description: "Your celebrity pick has been removed from your list.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error removing pick",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddPick = async (celebrityName: string) => {
    await addPickMutation.mutateAsync(celebrityName);
  };

  const handleRemovePick = async (pickId: string) => {
    await removePickMutation.mutateAsync(pickId);
  };

  const totalScore = picks.reduce((sum, pick) => sum + (pick.points_awarded || 0), 0);
  const picksCount = picks.length;
  const maxPicks = 20;
  const hitCount = picks.filter(pick => pick.is_hit).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Welcome, {profile?.username || 'Player'}!
              </h1>
              <p className="text-gray-300">
                Manage your celebrity death pool picks for 2025
              </p>
            </div>
            <Button 
              onClick={handleSignOut}
              variant="outline"
              className="border-purple-800/30 text-white hover:bg-purple-800/20"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {stats && (
            <UserStatsCards
              totalUsers={stats.totalUsers}
              totalDeaths={stats.totalDeaths}
              topScore={stats.topScore}
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <div className="space-y-6">
              <Card className="bg-black/40 border-purple-800/30">
                <CardHeader>
                  <CardTitle className="text-white">Your Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-400 mb-2">
                    {totalScore} points
                  </div>
                  <p className="text-gray-300">
                    {hitCount} hits out of {picksCount} picks
                  </p>
                </CardContent>
              </Card>

              <AddPickForm 
                picksCount={picksCount} 
                maxPicks={maxPicks} 
                onAddPick={handleAddPick}
              />
            </div>

            <PicksList 
              picks={picks} 
              maxPicks={maxPicks} 
              onRemovePick={handleRemovePick}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
