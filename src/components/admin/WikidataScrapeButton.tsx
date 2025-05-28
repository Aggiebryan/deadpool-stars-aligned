
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const WikidataScrapeButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState("2025-04-27");
  const [endDate, setEndDate] = useState("2025-05-27");

  const handleScrape = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast({
        title: "Error",
        description: "Start date must be before end date",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-wikidata-deaths', {
        body: { startDate, endDate }
      });
      
      if (error) throw error;
      
      toast({
        title: "Wikidata query completed",
        description: `Found ${data.totalDeaths} deaths, added ${data.deathsAdded} new records`,
      });
    } catch (error: any) {
      console.error('Error querying Wikidata:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to query Wikidata",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border border-purple-800/30 rounded-lg bg-black/20">
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="h-4 w-4 text-purple-400" />
        <h3 className="text-white font-semibold">Query Wikidata Deaths</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-purple-300 block mb-1">Start Date</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-black/40 border-purple-800/30 text-white"
          />
        </div>
        <div>
          <label className="text-sm text-purple-300 block mb-1">End Date</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-black/40 border-purple-800/30 text-white"
          />
        </div>
      </div>

      <Button
        onClick={handleScrape}
        disabled={isLoading}
        className="bg-green-600 hover:bg-green-700 w-full"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Search className="h-4 w-4 mr-2" />
        )}
        {isLoading ? "Querying Wikidata..." : "Query Wikidata Deaths"}
      </Button>
    </div>
  );
};
