
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Database, Loader2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const WikipediaScrapeButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleScrape = async () => {
    setIsLoading(true);
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
        title: "Wikipedia celebrity lookup completed",
        description: `Processed ${data.celebritiesProcessed} celebrities, updated ${data.dataUpdated} records with biographical data`,
      });
    } catch (error: any) {
      console.error('Error looking up celebrities on Wikipedia:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to lookup celebrities on Wikipedia",
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
        <Users className="h-4 w-4 mr-2" />
      )}
      {isLoading ? "Looking up celebrities..." : "Lookup Celebrity Picks on Wikipedia"}
    </Button>
  );
};
