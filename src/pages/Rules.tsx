
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skull, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Rules = () => {
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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">Game Rules & Scoring</h1>
          
          {/* Basic Rules */}
          <Card className="bg-black/40 border-purple-800/30 mb-8">
            <CardHeader>
              <CardTitle className="text-purple-400 text-2xl">Basic Rules</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-4">
              <ul className="list-disc list-inside space-y-2">
                <li>Each player selects 10 celebrities they think will die in 2025</li>
                <li>Picks must be submitted before the deadline (TBD)</li>
                <li>Players can modify their list until the deadline</li>
                <li>Each celebrity can only be picked by one player (first come, first served)</li>
                <li>If a player dies during 2025, that player wins automatically</li>
                <li>The player with the highest total score at the end of 2025 wins</li>
              </ul>
            </CardContent>
          </Card>

          {/* Scoring System */}
          <Card className="bg-black/40 border-purple-800/30 mb-8">
            <CardHeader>
              <CardTitle className="text-purple-400 text-2xl">Scoring System</CardTitle>
              <CardDescription className="text-gray-400">
                Points are awarded based on multiple factors when a celebrity dies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Base Points */}
              <div>
                <h3 className="text-white text-lg font-semibold mb-3">Base Points</h3>
                <div className="bg-purple-900/20 p-4 rounded-lg">
                  <p className="text-gray-300 mb-2">
                    <strong className="text-purple-400">Formula:</strong> 100 - Age at Death
                  </p>
                  <p className="text-gray-400 text-sm">
                    Example: If a 75-year-old celebrity dies, you get 25 base points (100 - 75 = 25)
                  </p>
                </div>
              </div>

              {/* Cause of Death Bonuses */}
              <div>
                <h3 className="text-white text-lg font-semibold mb-3">Cause of Death Bonuses</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Natural (80+)</span>
                      <Badge variant="outline" className="border-green-500 text-green-400">+5 pts</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Natural (Under 80)</span>
                      <Badge variant="outline" className="border-green-500 text-green-400">+10 pts</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Accidental (80+)</span>
                      <Badge variant="outline" className="border-yellow-500 text-yellow-400">+15 pts</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Accidental (Under 80)</span>
                      <Badge variant="outline" className="border-yellow-500 text-yellow-400">+25 pts</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Suicide (80+)</span>
                      <Badge variant="outline" className="border-orange-500 text-orange-400">+20 pts</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Suicide (Under 80)</span>
                      <Badge variant="outline" className="border-orange-500 text-orange-400">+40 pts</Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Violent (80+)</span>
                      <Badge variant="outline" className="border-red-500 text-red-400">+30 pts</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Violent (Under 80)</span>
                      <Badge variant="outline" className="border-red-500 text-red-400">+50 pts</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Pandemic/Outbreak (80+)</span>
                      <Badge variant="outline" className="border-blue-500 text-blue-400">+20 pts</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Pandemic/Outbreak (Under 80)</span>
                      <Badge variant="outline" className="border-blue-500 text-blue-400">+35 pts</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Rare/Unusual</span>
                      <Badge variant="outline" className="border-purple-500 text-purple-400">+50 pts</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Circumstances */}
              <div>
                <h3 className="text-white text-lg font-semibold mb-3">Special Circumstance Bonuses</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Dies on Birthday</span>
                      <Badge className="bg-purple-600">+15 pts</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Dies on Major Holiday</span>
                      <Badge className="bg-purple-600">+10 pts</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">First Death of Year</span>
                      <Badge className="bg-purple-600">+10 pts</Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Last Death of Year</span>
                      <Badge className="bg-purple-600">+10 pts</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Dies During Public Event</span>
                      <Badge className="bg-purple-600">+25 pts</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Dies in Extreme Sport</span>
                      <Badge className="bg-purple-600">+30 pts</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Bonus */}
              <div>
                <h3 className="text-white text-lg font-semibold mb-3">Weekly Death Bonus</h3>
                <div className="bg-purple-900/20 p-4 rounded-lg">
                  <p className="text-gray-300">
                    <strong className="text-purple-400">+5 points</strong> for each additional celebrity death in the same week
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    If multiple celebrities from anyone's lists die in the same week, all players get bonus points for each additional death
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Example Calculation */}
          <Card className="bg-black/40 border-purple-800/30">
            <CardHeader>
              <CardTitle className="text-purple-400 text-2xl">Example Calculation</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <div className="bg-purple-900/20 p-6 rounded-lg">
                <h4 className="text-white font-semibold mb-3">Celebrity X dies at age 65 from accidental causes on their birthday during a public event</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Base Points (100 - 65):</span>
                    <span className="text-purple-400 font-semibold">35 pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Accidental Death (Under 80):</span>
                    <span className="text-purple-400 font-semibold">+25 pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dies on Birthday:</span>
                    <span className="text-purple-400 font-semibold">+15 pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dies During Public Event:</span>
                    <span className="text-purple-400 font-semibold">+25 pts</span>
                  </div>
                  <hr className="border-purple-800/30 my-2" />
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-white">Total Score:</span>
                    <span className="text-purple-400">100 pts</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Rules;
