
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skull, Trophy, Users, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { user, profile } = useAuth();
  const [gameStats, setGameStats] = useState({
    totalPlayers: 0,
    totalDeaths: 0,
    topScore: 0,
    daysRemaining: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Calculate days remaining in 2025
    const endOfYear = new Date('2025-12-31');
    const today = new Date();
    const timeDiff = endOfYear.getTime() - today.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    setGameStats(prev => ({ ...prev, daysRemaining: Math.max(0, daysRemaining) }));
    
    // Load real game statistics
    loadGameStats();
  }, []);

  const loadGameStats = async () => {
    try {
      // Get total players (excluding admins)
      const { data: players, error: playersError } = await supabase
        .from('profiles')
        .select('total_score')
        .eq('is_admin', false);

      if (playersError) {
        console.error('Error loading players:', playersError);
      }

      // Get total deaths
      const { data: deaths, error: deathsError } = await supabase
        .from('deceased_celebrities')
        .select('id')
        .eq('game_year', 2025);

      if (deathsError) {
        console.error('Error loading deaths:', deathsError);
      }

      // Calculate statistics
      const totalPlayers = players?.length || 0;
      const totalDeaths = deaths?.length || 0;
      const topScore = players?.length > 0 ? Math.max(...players.map(p => p.total_score)) : 0;

      setGameStats(prev => ({
        ...prev,
        totalPlayers,
        totalDeaths,
        topScore
      }));
    } catch (error) {
      console.error('Error loading game stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-purple-800/30 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Skull className="h-8 w-8 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">DeadPool 2025</h1>
          </div>
          <nav className="flex space-x-4">
            <Link to="/rules">
              <Button variant="ghost" className="text-white hover:text-purple-300">Rules</Button>
            </Link>
            <Link to="/scoreboard">
              <Button variant="ghost" className="text-white hover:text-purple-300">Scoreboard</Button>
            </Link>
            <Link to="/players">
              <Button variant="ghost" className="text-white hover:text-purple-300">Players</Button>
            </Link>
            <Link to="/deceased">
              <Button variant="ghost" className="text-white hover:text-purple-300">Deaths</Button>
            </Link>
            {user ? (
              <Link to={profile?.is_admin ? "/admin" : "/dashboard"}>
                <Button className="bg-purple-600 hover:bg-purple-700">Dashboard</Button>
              </Link>
            ) : (
              <div className="space-x-2">
                <Link to="/login">
                  <Button variant="outline" className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white">Login</Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-purple-600 hover:bg-purple-700">Register</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            Welcome to the Ultimate 
            <span className="text-purple-400"> Death Pool</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Pick 10 celebrities you think might shuffle off this mortal coil in 2025. 
            Score points based on age, cause of death, and special circumstances.
          </p>
          
          {/* Game Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-12 max-w-4xl mx-auto">
            <Card className="bg-black/40 border-purple-800/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-purple-400 text-sm">Players</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-purple-400" />
                  <span className="text-2xl font-bold text-white">
                    {isLoading ? "..." : gameStats.totalPlayers}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-black/40 border-purple-800/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-purple-400 text-sm">Deaths</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Skull className="h-5 w-5 text-purple-400" />
                  <span className="text-2xl font-bold text-white">
                    {isLoading ? "..." : gameStats.totalDeaths}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-black/40 border-purple-800/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-purple-400 text-sm">Top Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-purple-400" />
                  <span className="text-2xl font-bold text-white">
                    {isLoading ? "..." : gameStats.topScore}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-black/40 border-purple-800/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-purple-400 text-sm">Days Left</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-purple-400" />
                  <span className="text-2xl font-bold text-white">{gameStats.daysRemaining}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {!user && (
            <div className="space-x-4">
              <Link to="/register">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-3">
                  Join the Pool
                </Button>
              </Link>
              <Link to="/rules">
                <Button size="lg" variant="outline" className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white text-lg px-8 py-3">
                  View Rules
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-black/20">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-white text-center mb-12">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="bg-black/40 border-purple-800/30 text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">1</span>
                </div>
                <CardTitle className="text-white">Make Your Picks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Choose 10 celebrities you think might die in 2025. You have until the deadline to modify your list.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-black/40 border-purple-800/30 text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">2</span>
                </div>
                <CardTitle className="text-white">Earn Points</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Score points based on age (100 - age), cause of death, and special circumstances like dying on birthday.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-black/40 border-purple-800/30 text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">3</span>
                </div>
                <CardTitle className="text-white">Win Glory</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  The player with the most points at the end of 2025 wins eternal bragging rights!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-purple-800/30 bg-black/20 py-8">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>&copy; 2025 DeadPool Game. May the odds be ever in your favor.</p>
          <p className="text-sm mt-2">Remember: We're not rooting for anyone to die, just predicting the inevitable.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
