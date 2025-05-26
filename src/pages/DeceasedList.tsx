
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skull, ArrowLeft, Calendar, Users } from "lucide-react";
import { getDeceasedCelebrities, getPicks } from "@/utils/localStorage";
import { DeceasedCelebrity } from "@/types";

const DeceasedList = () => {
  const [deceasedCelebrities, setDeceasedCelebrities] = useState<DeceasedCelebrity[]>([]);
  const [selectedDeceased, setSelectedDeceased] = useState<DeceasedCelebrity | null>(null);

  useEffect(() => {
    loadDeceasedCelebrities();
  }, []);

  const loadDeceasedCelebrities = () => {
    const deceased = getDeceasedCelebrities().filter(d => d.gameYear === 2025);
    deceased.sort((a, b) => new Date(b.dateOfDeath).getTime() - new Date(a.dateOfDeath).getTime());
    setDeceasedCelebrities(deceased);
  };

  const getCauseColor = (cause: string) => {
    switch (cause) {
      case 'Natural': return 'bg-green-600';
      case 'Accidental': return 'bg-yellow-600';
      case 'Violent': return 'bg-red-600';
      case 'Suicide': return 'bg-orange-600';
      case 'RareOrUnusual': return 'bg-purple-600';
      case 'PandemicOrOutbreak': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  const getPickersForCelebrity = (canonicalName: string) => {
    const allPicks = getPicks();
    return allPicks.filter(pick => 
      pick.celebrityName.toLowerCase() === canonicalName.toLowerCase() && 
      pick.gameYear === 2025 &&
      pick.isHit
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-purple-800/30 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Skull className="h-8 w-8 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">DeadPool 2025</h1>
          </Link>
          <Link to="/">
            <Button variant="ghost" className="text-white hover:text-purple-300">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">
            <Skull className="inline h-10 w-10 text-red-400 mr-3" />
            Celebrity Deaths 2025
          </h1>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Deaths List */}
            <Card className="bg-black/40 border-purple-800/30">
              <CardHeader>
                <CardTitle className="text-white text-xl">
                  Recent Deaths ({deceasedCelebrities.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {deceasedCelebrities.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    No celebrity deaths recorded yet for 2025
                  </p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {deceasedCelebrities.map((deceased) => {
                      const pickers = getPickersForCelebrity(deceased.canonicalName);
                      return (
                        <div
                          key={deceased.id}
                          className={`p-4 rounded-lg cursor-pointer transition-colors ${
                            selectedDeceased?.id === deceased.id
                              ? 'bg-purple-900/40 border border-purple-600/50'
                              : 'bg-black/20 hover:bg-black/40'
                          }`}
                          onClick={() => setSelectedDeceased(deceased)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-white font-semibold">{deceased.canonicalName}</h3>
                            <Badge className={getCauseColor(deceased.causeOfDeathCategory)}>
                              {deceased.causeOfDeathCategory}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">
                              Age {deceased.ageAtDeath} • {new Date(deceased.dateOfDeath).toLocaleDateString()}
                            </span>
                            {pickers.length > 0 && (
                              <Badge variant="outline" className="border-purple-400 text-purple-400">
                                {pickers.length} hit{pickers.length !== 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Death Details */}
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
                      <h3 className="text-white text-lg font-semibold mb-3">{selectedDeceased.canonicalName}</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Date of Birth</p>
                          <p className="text-white">{new Date(selectedDeceased.dateOfBirth).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Date of Death</p>
                          <p className="text-white">{new Date(selectedDeceased.dateOfDeath).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Age at Death</p>
                          <p className="text-white">{selectedDeceased.ageAtDeath} years old</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Cause of Death</p>
                          <Badge className={getCauseColor(selectedDeceased.causeOfDeathCategory)}>
                            {selectedDeceased.causeOfDeathCategory}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Special Circumstances */}
                    {(selectedDeceased.diedOnBirthday || selectedDeceased.diedOnMajorHoliday || 
                      selectedDeceased.diedDuringPublicEvent || selectedDeceased.diedInExtremeSport ||
                      selectedDeceased.isFirstDeathOfYear || selectedDeceased.isLastDeathOfYear) && (
                      <div>
                        <h4 className="text-white font-semibold mb-2">Special Circumstances</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedDeceased.diedOnBirthday && (
                            <Badge variant="outline" className="border-yellow-400 text-yellow-400">
                              Died on Birthday (+15 pts)
                            </Badge>
                          )}
                          {selectedDeceased.diedOnMajorHoliday && (
                            <Badge variant="outline" className="border-blue-400 text-blue-400">
                              Died on Holiday (+10 pts)
                            </Badge>
                          )}
                          {selectedDeceased.diedDuringPublicEvent && (
                            <Badge variant="outline" className="border-green-400 text-green-400">
                              During Public Event (+25 pts)
                            </Badge>
                          )}
                          {selectedDeceased.diedInExtremeSport && (
                            <Badge variant="outline" className="border-orange-400 text-orange-400">
                              Extreme Sport (+30 pts)
                            </Badge>
                          )}
                          {selectedDeceased.isFirstDeathOfYear && (
                            <Badge variant="outline" className="border-purple-400 text-purple-400">
                              First Death of Year (+10 pts)
                            </Badge>
                          )}
                          {selectedDeceased.isLastDeathOfYear && (
                            <Badge variant="outline" className="border-red-400 text-red-400">
                              Last Death of Year (+10 pts)
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Additional Details */}
                    {selectedDeceased.causeOfDeathDetails && (
                      <div>
                        <h4 className="text-white font-semibold mb-2">Additional Details</h4>
                        <p className="text-gray-300 text-sm">{selectedDeceased.causeOfDeathDetails}</p>
                      </div>
                    )}

                    {/* Players who picked this celebrity */}
                    <div>
                      <h4 className="text-white font-semibold mb-2">Players who scored</h4>
                      {(() => {
                        const pickers = getPickersForCelebrity(selectedDeceased.canonicalName);
                        return pickers.length === 0 ? (
                          <p className="text-gray-400 text-sm">No players had this celebrity in their picks</p>
                        ) : (
                          <div className="space-y-2">
                            {pickers.map((pick) => (
                              <div key={pick.id} className="flex items-center justify-between p-2 bg-green-900/20 rounded">
                                <span className="text-green-400">Player hit!</span>
                                <Badge className="bg-green-600">
                                  +{pick.pointsAwarded} pts
                                </Badge>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
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
