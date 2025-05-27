
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Globe } from "lucide-react";

export const IncendarScrapeButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleScrapeIncendar = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-incendar-deaths');
      
      if (error) {
        throw error;
      }

      toast({
        title: "Incendar scrape completed",
        description: `Found ${data.totalDeaths} deaths, added ${data.deathsAdded} new records, scored ${data.picksScored} picks.`,
      });
    } catch (error: any) {
      console.error('Error scraping Incendar:', error);
      toast({
        title: "Error scraping Incendar",
        description: error.message || "Failed to scrape deaths from Incendar",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleScrapeIncendar}
      disabled={isLoading}
      className="bg-green-600 hover:bg-green-700"
    >
      <Globe className="h-4 w-4 mr-2" />
      {isLoading ? "Scraping Incendar..." : "Scrape Incendar Deaths"}
    </Button>
  );
};
