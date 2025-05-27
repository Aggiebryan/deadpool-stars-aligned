
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skull, ArrowLeft, Trophy } from "lucide-react";

export const ScoreboardHeader = () => {
  return (
    <>
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

      {/* Page Title */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">
            <Trophy className="inline h-10 w-10 text-yellow-400 mr-3" />
            Scoreboard
          </h1>
        </div>
      </div>
    </>
  );
};
