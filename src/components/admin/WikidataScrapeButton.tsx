
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const WikidataScrapeButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleScrape = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-wikidata-deaths');
      
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
    <Button
      onClick={handleScrape}
      disabled={isLoading}
      className="bg-green-600 hover:bg-green-700"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Search className="h-4 w-4 mr-2" />
      )}
      {isLoading ? "Querying Wikidata..." : "Query Wikidata Deaths"}
    </Button>
  );
};
