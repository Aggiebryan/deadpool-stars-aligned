
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smile, Clock, RefreshCw, Settings, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export const WikipediaLookupManager = () => {
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Get stats about celebrity descriptions
  const { data: descriptionStats, refetch: refetchStats } = useQuery({
    queryKey: ['wikipedia-description-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deceased_celebrities')
        .select('id, canonical_name, celebrity_description')
        .eq('game_year', 2025);
      
      if (error) throw error;
      
      const total = data.length;
      const withDescriptions = data.filter(d => d.celebrity_description).length;
      
      return {
        total,
        withDescriptions,
        withoutDescriptions: total - withDescriptions,
        percentage: total > 0 ? Math.round((withDescriptions / total) * 100) : 0
      };
    }
  });

  // Get unique celebrity picks for lookup
  const { data: pickStats } = useQuery({
    queryKey: ['celebrity-picks-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('celebrity_picks')
        .select('celebrity_name')
        .eq('game_year', 2025);
      
      if (error) throw error;
      
      const uniqueNames = new Set(data.map(p => p.celebrity_name.toLowerCase()));
      return {
        totalPicks: data.length,
        uniqueCelebrities: uniqueNames.size
      };
    }
  });

  const handleManualLookup = async () => {
    setIsLookingUp(true);
    try {
      console.log('Starting Wikipedia lookup...');
      
      const { data, error } = await supabase.functions.invoke('lookup-celebrity-wikipedia', {
        body: { manual: true }
      });
      
      console.log('Function response:', { data, error });
      
      if (error) {
        console.error('Function error:', error);
        throw error;
      }
      
      toast({
        title: "Wikipedia lookup completed",
        description: `Processed ${data.celebritiesProcessed} celebrities, updated ${data.dataUpdated} records`,
      });
      
      // Refresh stats
      refetchStats();
      
    } catch (error: any) {
      console.error('Error in handleManualLookup:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to lookup celebrities on Wikipedia",
        variant: "destructive",
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Smile className="h-5 w-5 text-yellow-400" />
            Wikipedia Celebrity Lookup Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-sm text-gray-300 mb-1">Celebrity Picks</div>
              <div className="text-2xl font-bold text-white">
                {pickStats?.uniqueCelebrities || 0}
              </div>
              <div className="text-xs text-gray-400">
                unique from {pickStats?.totalPicks || 0} total picks
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-sm text-gray-300 mb-1">Deaths with Bios</div>
              <div className="text-2xl font-bold text-white">
                {descriptionStats?.withDescriptions || 0}
              </div>
              <div className="text-xs text-gray-400">
                of {descriptionStats?.total || 0} total deaths
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-sm text-gray-300 mb-1">Bio Coverage</div>
              <div className="text-2xl font-bold text-white">
                {descriptionStats?.percentage || 0}%
              </div>
              <div className="text-xs text-gray-400">
                completion rate
              </div>
            </div>
          </div>

          {/* Manual Lookup */}
          <div className="border border-gray-600 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Manual Lookup
            </h3>
            <p className="text-gray-300 text-sm mb-4">
              Manually trigger Wikipedia lookup for all celebrity picks. This will search for biographical 
              information and create funny descriptions for celebrities.
            </p>
            <Button
              onClick={handleManualLookup}
              disabled={isLookingUp}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLookingUp ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Smile className="h-4 w-4 mr-2" />
              )}
              {isLookingUp ? "Looking up celebrities..." : "Lookup Celebrity Picks on Wikipedia"}
            </Button>
          </div>

          {/* Scheduled Lookup Info */}
          <div className="border border-gray-600 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Scheduled Lookup
            </h3>
            <p className="text-gray-300 text-sm mb-3">
              Automatic Wikipedia lookup runs daily at 6:00 AM UTC via cron job.
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-green-400 text-green-400">
                <CheckCircle className="h-3 w-3 mr-1" />
                Enabled
              </Badge>
              <span className="text-xs text-gray-400">Next run: Daily at 06:00 UTC</span>
            </div>
          </div>

          {/* Configuration Notes */}
          <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
            <h3 className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration Notes
            </h3>
            <ul className="text-blue-200 text-sm space-y-1">
              <li>• The pg_cron extension must be enabled in Supabase</li>
              <li>• Service role key must be configured for scheduled runs</li>
              <li>• Lookup processes all unique celebrity names from user picks</li>
              <li>• Automatically scores matching picks when celebrities are found deceased</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
