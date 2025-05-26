
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
import { Skull, Shield, Users, Plus, LogOut, Calendar } from "lucide-react";
import { 
  getCurrentUser, 
  setCurrentUser, 
  getDeceasedCelebrities, 
  saveDeceasedCelebrities, 
  getPicks, 
  savePicks,
  getUsers,
  saveUsers,
  generateId,
  updateUserScore
} from "@/utils/localStorage";
import { toast } from "@/hooks/use-toast";
import { DeceasedCelebrity } from "@/types";
import { calculateScore, calculateAge, checkIfBirthday, checkIfMajorHoliday, getWeekNumber, MAJOR_HOLIDAYS_2025 } from "@/utils/gameLogic";

const AdminDashboard = () => {
  const [currentUser, setCurrentUserState] = useState(getCurrentUser());
  const [activeTab, setActiveTab] = useState<'overview' | 'addDeath' | 'manageDeath' | 'users'>('overview');
  const [deceasedCelebrities, setDeceasedCelebrities] = useState<DeceasedCelebrity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Form state for adding new death
  const [newDeath, setNewDeath] = useState({
    canonicalName: '',
    dateOfBirth: '',
    dateOfDeath: '',
    causeOfDeathCategory: 'Natural' as DeceasedCelebrity['causeOfDeathCategory'],
    causeOfDeathDetails: '',
    diedDuringPublicEvent: false,
    diedInExtremeSport: false,
    isFirstDeathOfYear: false,
    isLastDeathOfYear: false
  });

  useEffect(() => {
    if (!currentUser || !currentUser.isAdmin) {
      navigate("/login");
      return;
    }

    loadDeceasedCelebrities();
  }, [currentUser, navigate]);

  const loadDeceasedCelebrities = () => {
    const deceased = getDeceasedCelebrities().filter(d => d.gameYear === 2025);
    deceased.sort((a, b) => new Date(b.dateOfDeath).getTime() - new Date(a.dateOfDeath).getTime());
    setDeceasedCelebrities(deceased);
  };

  const handleAddDeath = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsLoading(true);

    try {
      // Calculate age and special circumstances
      const ageAtDeath = calculateAge(newDeath.dateOfBirth, newDeath.dateOfDeath);
      const diedOnBirthday = checkIfBirthday(newDeath.dateOfBirth, newDeath.dateOfDeath);
      const diedOnMajorHoliday = checkIfMajorHoliday(newDeath.dateOfDeath, MAJOR_HOLIDAYS_2025);

      // Create new deceased celebrity record
      const deceasedCelebrity: DeceasedCelebrity = {
        id: generateId(),
        canonicalName: newDeath.canonicalName.trim(),
        dateOfBirth: newDeath.dateOfBirth,
        dateOfDeath: newDeath.dateOfDeath,
        ageAtDeath,
        causeOfDeathCategory: newDeath.causeOfDeathCategory,
        causeOfDeathDetails: newDeath.causeOfDeathDetails.trim(),
        diedDuringPublicEvent: newDeath.diedDuringPublicEvent,
        diedInExtremeSport: newDeath.diedInExtremeSport,
        diedOnBirthday,
        diedOnMajorHoliday,
        isFirstDeathOfYear: newDeath.isFirstDeathOfYear,
        isLastDeathOfYear: newDeath.isLastDeathOfYear,
        gameYear: 2025,
        enteredByAdminId: currentUser.id,
        createdAt: new Date().toISOString()
      };

      // Save deceased celebrity
      const allDeceased = getDeceasedCelebrities();
      allDeceased.push(deceasedCelebrity);
      saveDeceasedCelebrities(allDeceased);

      // Find matching picks and score them
      const allPicks = getPicks();
      const matchingPicks = allPicks.filter(pick => 
        pick.celebrityName.toLowerCase() === deceasedCelebrity.canonicalName.toLowerCase() &&
        pick.gameYear === 2025 &&
        !pick.isHit
      );

      console.log(`Found ${matchingPicks.length} matching picks for ${deceasedCelebrity.canonicalName}`);

      if (matchingPicks.length > 0) {
        // Calculate weekly deaths for bonus
        const deathWeek = getWeekNumber(deceasedCelebrity.dateOfDeath);
        const otherDeathsThisWeek = allDeceased.filter(d => 
          d.gameYear === 2025 && 
          d.id !== deceasedCelebrity.id &&
          getWeekNumber(d.dateOfDeath) === deathWeek
        ).length;

        // Score each matching pick
        const users = getUsers();
        
        matchingPicks.forEach(pick => {
          const scoreBreakdown = calculateScore(deceasedCelebrity, otherDeathsThisWeek);
          
          // Update pick
          pick.isHit = true;
          pick.pointsAwarded = scoreBreakdown.totalPoints;

          // Update user's total score
          const user = users.find(u => u.id === pick.userId);
          if (user) {
            user.totalScore += scoreBreakdown.totalPoints;
            console.log(`Updated ${user.username}'s score: +${scoreBreakdown.totalPoints} (total: ${user.totalScore})`);
          }
        });

        // Save updates
        savePicks(allPicks);
        saveUsers(users);
      }

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

      loadDeceasedCelebrities();

      toast({
        title: "Death recorded successfully",
        description: `${deceasedCelebrity.canonicalName} has been added. ${matchingPicks.length} player(s) scored points.`,
      });

      setActiveTab('overview');

    } catch (error) {
      console.error('Error adding death:', error);
      toast({
        title: "Error",
        description: "Failed to record death. Please try again.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    navigate("/");
    toast({
      title: "Logged out",
      description: "Admin session ended",
    });
  };

  if (!currentUser || !currentUser.isAdmin) {
    return null;
  }

  const allUsers = getUsers().filter(u => !u.isAdmin);
  const allPicks = getPicks();
  const totalHits = allPicks.filter(pick => pick.isHit).length;

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
          {/* Tab Navigation */}
          <div className="flex space-x-4 mb-8">
            {[
              { key: 'overview', label: 'Overview', icon: Users },
              { key: 'addDeath', label: 'Record Death', icon: Plus },
              { key: 'manageDeath', label: 'Manage Deaths', icon: Skull },
              { key: 'users', label: 'Users', icon: Users }
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
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-black/40 border-purple-800/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-purple-400 text-sm">Total Players</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-purple-400" />
                    <span className="text-2xl font-bold text-white">{allUsers.length}</span>
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
                    {deceasedCelebrities.map((deceased) => (
                      <div key={deceased.id} className="p-4 bg-black/20 border border-purple-800/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-semibold">{deceased.canonicalName}</h3>
                          <Badge className="bg-red-600">{deceased.causeOfDeathCategory}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                          <div>Age: {deceased.ageAtDeath}</div>
                          <div>Date: {new Date(deceased.dateOfDeath).toLocaleDateString()}</div>
                        </div>
                        {deceased.causeOfDeathDetails && (
                          <p className="text-gray-400 text-sm mt-2">{deceased.causeOfDeathDetails}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <Card className="bg-black/40 border-purple-800/30">
              <CardHeader>
                <CardTitle className="text-white">Users ({allUsers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {allUsers.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    No users registered yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {allUsers.map((user) => {
                      const userPicks = allPicks.filter(pick => pick.userId === user.id && pick.gameYear === 2025);
                      const userHits = userPicks.filter(pick => pick.isHit);
                      return (
                        <div key={user.id} className="flex items-center justify-between p-4 bg-black/20 border border-purple-800/30 rounded-lg">
                          <div>
                            <h3 className="text-white font-semibold">{user.username}</h3>
                            <p className="text-gray-400 text-sm">{user.email}</p>
                            <p className="text-gray-400 text-sm">
                              {userPicks.length}/10 picks • {userHits.length} hits
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-purple-400 font-bold text-lg">{user.totalScore}</p>
                            <p className="text-gray-400 text-sm">points</p>
                          </div>
                        </div>
                      );
                    })}
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
