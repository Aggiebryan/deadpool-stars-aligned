import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skull, ArrowLeft, RefreshCw, Smile } from "lucide-react";
import { useDeceasedCelebrities, useFetchCelebrityDeaths, SupabaseDeceasedCelebrity } from "@/hooks/useSupabase";
import { calculateScore } from "@/utils/gameLogic";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DeceasedCelebrityWithDescription extends SupabaseDeceasedCelebrity {
  celebrity_description?: string;
}

const DeceasedList = () => {
  const [selectedDeceased, setSelectedDeceased] = useState<DeceasedCelebrityWithDescription | null>(null);
  const { data: deceasedCelebrities = [], isLoading, error } = useDeceasedCelebrities(2025);
  const fetchDeathsMutation = useFetchCelebrityDeaths();
  const [isLookingUp, setIsLookingUp] = useState(false);

  const getCauseColor = (cause: string) => {
    switch (cause) {
      case 'Natural': return 'bg-green-600';
      case 'Accidental': return 'bg-yellow-600';
      case 'Violent': return 'bg-red-600';
      case 'Suicide': return 'bg-orange-600';
      case 'RareOrUnusual': return 'bg-purple-600';
      case 'PandemicOrOutbreak': return 'bg-blue-600';
      case 'Unknown': return 'bg-gray-600';
      default: return 'bg-gray-600';
    }
  };

  const calculatePoints = (deceased: DeceasedCelebrityWithDescription) => {
    const scoreBreakdown = calculateScore({
      ...deceased,
      id: deceased.id,
      canonicalName: deceased.canonical_name,
      dateOfBirth: deceased.date_of_birth || '',
      dateOfDeath: deceased.date_of_death,
      ageAtDeath: deceased.age_at_death,
      causeOfDeathCategory: deceased.cause_of_death_category as any,
      causeOfDeathDetails: deceased.cause_of_death_details,
      diedDuringPublicEvent: deceased.died_during_public_event,
      diedInExtremeSport: deceased.died_in_extreme_sport,
      diedOnBirthday: deceased.died_on_birthday,
      diedOnMajorHoliday: deceased.died_on_major_holiday,
      isFirstDeathOfYear: deceased.is_first_death_of_year,
      isLastDeathOfYear: deceased.is_last_death_of_year,
      gameYear: deceased.game_year,
      enteredByAdminId: '',
      createdAt: deceased.created_at
    });
    return scoreBreakdown.totalPoints;
  };

  const handleRefreshDeaths = async () => {
    try {
      await fetchDeathsMutation.mutateAsync();
      toast({
        title: "Success",
        description: "Celebrity deaths updated from external sources"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch celebrity deaths",
        variant: "destructive"
      });
    }
  };

  const handleLookupWikipedia = async () => {
    setIsLookingUp(true);
    try {
      const { data, error } = await supabase.functions.invoke('lookup-celebrity-wikipedia');
      
      if (error) throw error;
      
      toast({
        title: "Wikipedia lookup completed",
        description: `Processed ${data.celebritiesProcessed} celebrities, updated ${data.dataUpdated} records`,
      });
      
      // Refresh the data
      window.location.reload();
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to lookup celebrities on Wikipedia",
        variant: "destructive",
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Error Loading Deaths</h2>
          <p className="text-gray-400">Failed to load celebrity death data</p>
        </div>
      </div>
    );
  }

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
            <Button 
              onClick={handleLookupWikipedia}
              disabled={isLookingUp}
              variant="outline" 
              className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white"
            >
              <Smile className={`h-4 w-4 mr-2 ${isLookingUp ? 'animate-spin' : ''}`} />
              {isLookingUp ? "Looking up..." : "Get Wikipedia Bios"}
            </Button>
            <Button 
              onClick={handleRefreshDeaths}
              disabled={fetchDeathsMutation.isPending}
              variant="outline" 
              className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${fetchDeathsMutation.isPending ? 'animate-spin' : ''}`} />
              Update Deaths
            </Button>
            <Link to="/">
              <Button variant="ghost" className="text-white hover:text-purple-300">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">
            <Skull className="inline h-10 w-10 text-red-400 mr-3" />
            Celebrity Deaths 2025
          </h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Deaths Table */}
            <div className="lg:col-span-2">
              <Card className="bg-black/40 border-purple-800/30">
                <CardHeader>
                  <CardTitle className="text-white text-xl">
                    Recent Deaths ({deceasedCelebrities.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
                      <p className="text-gray-400 mt-4">Loading celebrity deaths...</p>
                    </div>
                  ) : deceasedCelebrities.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">
                      No celebrity deaths recorded yet for 2025
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-purple-300">Date of Death</TableHead>
                            <TableHead className="text-purple-300">Celebrity Name</TableHead>
                            <TableHead className="text-purple-300">Cause of Death</TableHead>
                            <TableHead className="text-purple-300">Age</TableHead>
                            <TableHead className="text-purple-300">Points</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {deceasedCelebrities.map((deceased) => (
                            <TableRow
                              key={deceased.id}
                              className={`cursor-pointer transition-colors ${
                                selectedDeceased?.id === deceased.id
                                  ? 'bg-purple-900/40'
                                  : 'hover:bg-black/40'
                              }`}
                              onClick={() => setSelectedDeceased(deceased as DeceasedCelebrityWithDescription)}
                            >
                              <TableCell className="text-white">
                                {new Date(deceased.date_of_death).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-white font-medium">
                                <div className="flex items-center gap-2">
                                  {deceased.canonical_name}
                                  {(deceased as DeceasedCelebrityWithDescription).celebrity_description && (
                                    <Smile className="h-4 w-4 text-yellow-400" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={getCauseColor(deceased.cause_of_death_category)}>
                                  {deceased.cause_of_death_category}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-white">
                                {deceased.age_at_death}
                              </TableCell>
                              <TableCell className="text-green-400 font-bold">
                                {calculatePoints(deceased as DeceasedCelebrityWithDescription)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Death Details */}
            <div className="lg:col-span-1">
              <Card className="bg-black/40 border-purple-800/30">
                <CardHeader>
                  <CardTitle className="text-white text-xl">
                    {selectedDeceased ? 'Death Details' : 'Select a Celebrity'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedDeceased ? (
                    <p className="text-gray-400 text-center py-8">
                      Click on a celebrity to see death details and scoring information
                    </p>
                  ) : (
                    <div className="space-y-6">
                      {/* Basic Info */}
                      <div>
                        <h3 className="text-white text-lg font-semibold mb-3">{selectedDeceased.canonical_name}</h3>
                        <div className="space-y-2 text-sm">
                          {selectedDeceased.date_of_birth && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Date of Birth:</span>
                              <span className="text-white">{new Date(selectedDeceased.date_of_birth).toLocaleDateString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-400">Date of Death:</span>
                            <span className="text-white">{new Date(selectedDeceased.date_of_death).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Age at Death:</span>
                            <span className="text-white">{selectedDeceased.age_at_death} years old</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Cause of Death:</span>
                            <Badge className={getCauseColor(selectedDeceased.cause_of_death_category)}>
                              {selectedDeceased.cause_of_death_category}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Total Points:</span>
                            <span className="text-green-400 font-bold">{calculatePoints(selectedDeceased)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Funny Biography */}
                      {selectedDeceased.celebrity_description && (
                        <div>
                          <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                            <Smile className="h-4 w-4 text-yellow-400" />
                            Celebrity Bio
                          </h4>
                          <div className="bg-purple-900/20 p-3 rounded-lg border border-purple-600/30">
                            <p className="text-gray-200 text-sm italic">
                              {selectedDeceased.celebrity_description}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Special Circumstances */}
                      {(selectedDeceased.died_on_birthday || selectedDeceased.died_on_major_holiday || 
                        selectedDeceased.died_during_public_event || selectedDeceased.died_in_extreme_sport ||
                        selectedDeceased.is_first_death_of_year || selectedDeceased.is_last_death_of_year) && (
                        <div>
                          <h4 className="text-white font-semibold mb-2">Special Circumstances</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedDeceased.died_on_birthday && (
                              <Badge variant="outline" className="border-yellow-400 text-yellow-400">
                                Died on Birthday (+15 pts)
                              </Badge>
                            )}
                            {selectedDeceased.died_on_major_holiday && (
                              <Badge variant="outline" className="border-blue-400 text-blue-400">
                                Died on Holiday (+10 pts)
                              </Badge>
                            )}
                            {selectedDeceased.died_during_public_event && (
                              <Badge variant="outline" className="border-green-400 text-green-400">
                                During Public Event (+25 pts)
                              </Badge>
                            )}
                            {selectedDeceased.died_in_extreme_sport && (
                              <Badge variant="outline" className="border-orange-400 text-orange-400">
                                Extreme Sport (+30 pts)
                              </Badge>
                            )}
                            {selectedDeceased.is_first_death_of_year && (
                              <Badge variant="outline" className="border-purple-400 text-purple-400">
                                First Death of Year (+10 pts)
                              </Badge>
                            )}
                            {selectedDeceased.is_last_death_of_year && (
                              <Badge variant="outline" className="border-red-400 text-red-400">
                                Last Death of Year (+10 pts)
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Additional Details */}
                      {selectedDeceased.cause_of_death_details && (
                        <div>
                          <h4 className="text-white font-semibold mb-2">Additional Details</h4>
                          <p className="text-gray-300 text-sm">{selectedDeceased.cause_of_death_details}</p>
                        </div>
                      )}

                      {/* Source */}
                      {selectedDeceased.source_url && (
                        <div>
                          <h4 className="text-white font-semibold mb-2">Source</h4>
                          <a 
                            href={selectedDeceased.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 text-sm underline"
                          >
                            View Original Article
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-8 text-center space-x-4">
            <Link to="/scoreboard">
              <Button variant="outline" className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white">
                View Scoreboard
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

export default DeceasedList;
