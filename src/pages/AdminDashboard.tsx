
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skull, Shield, Users, Plus, LogOut, Calendar, Rss, Play, Clock, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface DeceasedCelebrity {
  id: string;
  canonical_name: string;
  date_of_death: string;
  age_at_death: number;
  cause_of_death_category: string;
  cause_of_death_details?: string;
}

interface RSSFeed {
  id: string;
  name: string;
  url: string;
  is_active: boolean;
}

interface FetchLog {
  id: string;
  started_at: string;
  completed_at?: string;
  status: 'running' | 'completed' | 'failed';
  deaths_found: number;
  deaths_added: number;
  picks_scored: number;
  error_message?: string;
}

const AdminDashboard = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'addDeath' | 'manageDeath' | 'feeds' | 'monitoring'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form state for adding new death
  const [newDeath, setNewDeath] = useState({
    canonicalName: '',
    dateOfBirth: '',
    dateOfDeath: '',
    causeOfDeathCategory: 'Natural' as any,
    causeOfDeathDetails: '',
    diedDuringPublicEvent: false,
    diedInExtremeSport: false,
    isFirstDeathOfYear: false,
    isLastDeathOfYear: false
  });

  // RSS Feed form state
  const [newFeed, setNewFeed] = useState({ name: '', url: '' });

  useEffect(() => {
    if (!user || !profile?.is_admin) {
      navigate("/login");
    }
  }, [user, profile, navigate]);

  // Queries
  const { data: deceasedCelebrities = [] } = useQuery({
    queryKey: ['deceased-celebrities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deceased_celebrities')
        .select('*')
        .eq('game_year', 2025)
        .order('date_of_death', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: users = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_admin', false)
        .order('total_score', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: picks = [] } = useQuery({
    queryKey: ['celebrity-picks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('celebrity_picks')
        .select('*')
        .eq('game_year', 2025);
      if (error) throw error;
      return data;
    }
  });

  const { data: rssFeeds = [] } = useQuery({
    queryKey: ['rss-feeds'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('rss_feeds')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as RSSFeed[];
    }
  });

  const { data: fetchLogs = [] } = useQuery({
    queryKey: ['fetch-logs'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('fetch_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as FetchLog[];
    }
  });

  // Mutations
  const fetchDeathsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-celebrity-deaths');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Death fetch started",
        description: "Celebrity deaths are being fetched and processed.",
      });
      queryClient.invalidateQueries({ queryKey: ['deceased-celebrities'] });
      queryClient.invalidateQueries({ queryKey: ['fetch-logs'] });
      queryClient.invalidateQueries({ queryKey: ['celebrity-picks'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch deaths",
        variant: "destructive",
      });
    }
  });

  const addFeedMutation = useMutation({
    mutationFn: async (feed: { name: string; url: string }) => {
      const { data, error } = await (supabase as any)
        .from('rss_feeds')
        .insert(feed)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "RSS feed added successfully" });
      setNewFeed({ name: '', url: '' });
      queryClient.invalidateQueries({ queryKey: ['rss-feeds'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error adding RSS feed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const toggleFeedMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any)
        .from('rss_feeds')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rss-feeds'] });
    }
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
    toast({
      title: "Logged out",
      description: "Admin session ended",
    });
  };

  const handleFetchDeaths = () => {
    fetchDeathsMutation.mutate();
  };

  const handleAddFeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFeed.name && newFeed.url) {
      addFeedMutation.mutate(newFeed);
    }
  };

  const handleAddDeath = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const birthDate = new Date(newDeath.dateOfBirth);
      const deathDate = new Date(newDeath.dateOfDeath);
      const ageAtDeath = deathDate.getFullYear() - birthDate.getFullYear();

      const { error } = await supabase
        .from('deceased_celebrities')
        .insert({
          canonical_name: newDeath.canonicalName,
          date_of_birth: newDeath.dateOfBirth,
          date_of_death: newDeath.dateOfDeath,
          age_at_death: ageAtDeath,
          cause_of_death_category: newDeath.causeOfDeathCategory,
          cause_of_death_details: newDeath.causeOfDeathDetails || null,
          died_during_public_event: newDeath.diedDuringPublicEvent,
          died_in_extreme_sport: newDeath.diedInExtremeSport,
          is_first_death_of_year: newDeath.isFirstDeathOfYear,
          is_last_death_of_year: newDeath.isLastDeathOfYear,
          game_year: 2025
        });

      if (error) throw error;

      toast({
        title: "Death recorded successfully",
        description: "Celebrity death has been added and scores updated.",
      });

      // Reset form
      setNewDeath({
        canonicalName: '',
        dateOfBirth: '',
        dateOfDeath: '',
        causeOfDeathCategory: 'Natural',
        causeOfDeathDetails: '',
        diedDuringPublicEvent: false,
        diedInExtremeSport: false,
        isFirstDeathOfYear: false,
        isLastDeathOfYear: false
      });

      queryClient.invalidateQueries({ queryKey: ['deceased-celebrities'] });
      queryClient.invalidateQueries({ queryKey: ['celebrity-picks'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    } catch (error: any) {
      toast({
        title: "Error recording death",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || !profile?.is_admin) {
    return null;
  }

  const totalHits = picks.filter(pick => pick.is_hit).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-purple-800/30 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Skull className="h-8 w-8 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">DeadPool 2025 Admin</h1>
          </Link>
          <div className="flex items-center space-x-4">
            <Badge className="bg-red-600">
              <Shield className="h-3 w-3 mr-1" />
              Admin
            </Badge>
            <span className="text-white">Welcome, {profile.username}</span>
            <Button onClick={handleLogout} variant="ghost" className="text-white hover:text-purple-300">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex space-x-4 mb-8">
            {[
              { key: 'overview', label: 'Overview', icon: Users },
              { key: 'feeds', label: 'RSS Feeds', icon: Rss },
              { key: 'monitoring', label: 'Monitoring', icon: Clock },
              { key: 'addDeath', label: 'Record Death', icon: Plus },
              { key: 'manageDeath', label: 'Manage Deaths', icon: Skull }
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                onClick={() => setActiveTab(key as any)}
                variant={activeTab === key ? "default" : "outline"}
                className={activeTab === key ? "bg-purple-600" : "border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white"}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </Button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="bg-black/40 border-purple-800/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-purple-400 text-sm">Total Players</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-purple-400" />
                      <span className="text-2xl font-bold text-white">{users.length}</span>
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
                      <span className="text-2xl font-bold text-white">{deceasedCelebrities.length}</span>
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
          )}

          {/* RSS Feeds Tab */}
          {activeTab === 'feeds' && (
            <div className="space-y-6">
              <Card className="bg-black/40 border-purple-800/30">
                <CardHeader>
                  <CardTitle className="text-white">Add RSS Feed</CardTitle>
                  <CardDescription className="text-gray-400">
                    Add new RSS feeds to monitor for celebrity deaths
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddFeed} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="feedName" className="text-white">Feed Name</Label>
                        <Input
                          id="feedName"
                          value={newFeed.name}
                          onChange={(e) => setNewFeed({...newFeed, name: e.target.value})}
                          className="bg-black/20 border-purple-800/30 text-white"
                          placeholder="e.g., TMZ Deaths"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="feedUrl" className="text-white">RSS URL</Label>
                        <Input
                          id="feedUrl"
                          type="url"
                          value={newFeed.url}
                          onChange={(e) => setNewFeed({...newFeed, url: e.target.value})}
                          className="bg-black/20 border-purple-800/30 text-white"
                          placeholder="https://example.com/deaths.rss"
                          required
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      disabled={addFeedMutation.isPending}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {addFeedMutation.isPending ? "Adding..." : "Add RSS Feed"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-purple-800/30">
                <CardHeader>
                  <CardTitle className="text-white">Manage RSS Feeds ({rssFeeds.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {rssFeeds.map((feed: RSSFeed) => (
                      <div key={feed.id} className="flex items-center justify-between p-4 bg-black/20 border border-purple-800/30 rounded-lg">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold">{feed.name}</h3>
                          <p className="text-gray-400 text-sm">{feed.url}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={feed.is_active ? "bg-green-600" : "bg-red-600"}>
                            {feed.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            onClick={() => toggleFeedMutation.mutate({ id: feed.id, is_active: !feed.is_active })}
                            variant="outline"
                            size="sm"
                            className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white"
                          >
                            {feed.is_active ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Monitoring Tab */}
          {activeTab === 'monitoring' && (
            <Card className="bg-black/40 border-purple-800/30">
              <CardHeader>
                <CardTitle className="text-white">Fetch Logs ({fetchLogs.length})</CardTitle>
                <CardDescription className="text-gray-400">
                  Monitor automated and manual celebrity death fetching operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fetchLogs.map((log: FetchLog) => (
                    <div key={log.id} className="p-4 bg-black/20 border border-purple-800/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge className={
                            log.status === 'completed' ? "bg-green-600" :
                            log.status === 'failed' ? "bg-red-600" : "bg-yellow-600"
                          }>
                            {log.status === 'running' && <Clock className="h-3 w-3 mr-1" />}
                            {log.status === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
                            {log.status}
                          </Badge>
                          <span className="text-white text-sm">
                            Started: {new Date(log.started_at).toLocaleString()}
                          </span>
                        </div>
                        {log.completed_at && (
                          <span className="text-gray-400 text-sm">
                            Completed: {new Date(log.completed_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-gray-300">
                          Deaths Found: <span className="text-white font-semibold">{log.deaths_found}</span>
                        </div>
                        <div className="text-gray-300">
                          Deaths Added: <span className="text-white font-semibold">{log.deaths_added}</span>
                        </div>
                        <div className="text-gray-300">
                          Picks Scored: <span className="text-white font-semibold">{log.picks_scored}</span>
                        </div>
                      </div>
                      {log.error_message && (
                        <div className="mt-2 p-2 bg-red-900/20 border border-red-800 rounded">
                          <p className="text-red-400 text-sm">{log.error_message}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Death Tab */}
          {activeTab === 'addDeath' && (
            <Card className="bg-black/40 border-purple-800/30">
              <CardHeader>
                <CardTitle className="text-white">Record Celebrity Death</CardTitle>
                <CardDescription className="text-gray-400">
                  Enter death details to automatically score matching player picks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddDeath} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="canonicalName" className="text-white">Celebrity Name *</Label>
                      <Input
                        id="canonicalName"
                        value={newDeath.canonicalName}
                        onChange={(e) => setNewDeath({...newDeath, canonicalName: e.target.value})}
                        className="bg-black/20 border-purple-800/30 text-white"
                        placeholder="Enter the celebrity's full name"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="causeOfDeathCategory" className="text-white">Cause of Death *</Label>
                      <Select value={newDeath.causeOfDeathCategory} onValueChange={(value) => 
                        setNewDeath({...newDeath, causeOfDeathCategory: value as DeceasedCelebrity['causeOfDeathCategory']})
                      }>
                        <SelectTrigger className="bg-black/20 border-purple-800/30 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Natural">Natural</SelectItem>
                          <SelectItem value="Accidental">Accidental</SelectItem>
                          <SelectItem value="Violent">Violent</SelectItem>
                          <SelectItem value="Suicide">Suicide</SelectItem>
                          <SelectItem value="RareOrUnusual">Rare/Unusual</SelectItem>
                          <SelectItem value="PandemicOrOutbreak">Pandemic/Outbreak</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth" className="text-white">Date of Birth *</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={newDeath.dateOfBirth}
                        onChange={(e) => setNewDeath({...newDeath, dateOfBirth: e.target.value})}
                        className="bg-black/20 border-purple-800/30 text-white"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dateOfDeath" className="text-white">Date of Death *</Label>
                      <Input
                        id="dateOfDeath"
                        type="date"
                        value={newDeath.dateOfDeath}
                        onChange={(e) => setNewDeath({...newDeath, dateOfDeath: e.target.value})}
                        className="bg-black/20 border-purple-800/30 text-white"
                        max={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="causeOfDeathDetails" className="text-white">Additional Details</Label>
                    <Textarea
                      id="causeOfDeathDetails"
                      value={newDeath.causeOfDeathDetails}
                      onChange={(e) => setNewDeath({...newDeath, causeOfDeathDetails: e.target.value})}
                      className="bg-black/20 border-purple-800/30 text-white"
                      placeholder="Optional additional details about the death"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-white">Special Circumstances</Label>
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        { key: 'diedDuringPublicEvent', label: 'Died During Public Event (+25 pts)' },
                        { key: 'diedInExtremeSport', label: 'Died in Extreme Sport (+30 pts)' },
                        { key: 'isFirstDeathOfYear', label: 'First Death of 2025 (+10 pts)' },
                        { key: 'isLastDeathOfYear', label: 'Last Death of 2025 (+10 pts)' }
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox
                            id={key}
                            checked={newDeath[key as keyof typeof newDeath] as boolean}
                            onCheckedChange={(checked) => setNewDeath({...newDeath, [key]: checked})}
                          />
                          <Label htmlFor={key} className="text-gray-300 text-sm">{label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="bg-purple-600 hover:bg-purple-700"
                    disabled={isLoading}
                  >
                    {isLoading ? "Recording Death..." : "Record Death & Score Players"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Manage Deaths Tab */}
          {activeTab === 'manageDeath' && (
            <Card className="bg-black/40 border-purple-800/30">
              <CardHeader>
                <CardTitle className="text-white">Manage Deaths ({deceasedCelebrities.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {deceasedCelebrities.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    No deaths recorded yet for 2025
                  </p>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {deceasedCelebrities.map((deceased: DeceasedCelebrity) => (
                      <div key={deceased.id} className="p-4 bg-black/20 border border-purple-800/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-semibold">{deceased.canonical_name}</h3>
                          <Badge className="bg-red-600">{deceased.cause_of_death_category}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                          <div>Age: {deceased.age_at_death}</div>
                          <div>Date: {new Date(deceased.date_of_death).toLocaleDateString()}</div>
                        </div>
                        {deceased.cause_of_death_details && (
                          <p className="text-gray-400 text-sm mt-2">{deceased.cause_of_death_details}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
