
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Database, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const WikipediaScrapeButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleScrape = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-wikipedia-deaths');
      
      if (error) throw error;
      
      toast({
        title: "Wikipedia scrape completed",
        description: `Found ${data.totalDeaths} deaths, added ${data.deathsAdded} new records`,
      });
    } catch (error: any) {
      console.error('Error scraping Wikipedia:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to scrape Wikipedia",
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
      className="bg-blue-600 hover:bg-blue-700"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Database className="h-4 w-4 mr-2" />
      )}
      {isLoading ? "Scraping Wikipedia..." : "Scrape Wikipedia Deaths"}
    </Button>
  );
};
