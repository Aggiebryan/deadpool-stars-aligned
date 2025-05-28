
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skull } from "lucide-react";

interface RecentDeath {
  id: string;
  canonical_name: string;
  date_of_death: string;
  age_at_death: number;
  cause_of_death_category: string;
  cause_of_death_details?: string;
}

export const RecentDeaths = () => {
  const { data: recentDeaths = [], isLoading } = useQuery({
    queryKey: ['recent-deaths'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deceased_celebrities')
        .select('id, canonical_name, date_of_death, age_at_death, cause_of_death_category, cause_of_death_details')
        .eq('game_year', 2025)
        .eq('is_approved', true)
        .order('date_of_death', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as RecentDeath[];
    }
  });

  const getCauseColor = (cause: string) => {
    switch (cause) {
      case 'Natural': return 'bg-blue-600';
      case 'Accidental': return 'bg-yellow-600';
      case 'Violent': return 'bg-red-600';
      case 'Suicide': return 'bg-purple-600';
      case 'RareOrUnusual': return 'bg-orange-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <Card className="bg-black/40 border-purple-800/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Skull className="h-5 w-5 text-red-400" />
          Recent Deaths ({recentDeaths.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-gray-400">Loading recent deaths...</div>
        ) : recentDeaths.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No recent deaths found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-purple-800/30">
                <TableHead className="text-purple-300">Date</TableHead>
                <TableHead className="text-purple-300">Name</TableHead>
                <TableHead className="text-purple-300">Age</TableHead>
                <TableHead className="text-purple-300">Cause</TableHead>
                <TableHead className="text-purple-300">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentDeaths.map((death) => (
                <TableRow key={death.id} className="border-purple-800/30 hover:bg-purple-800/10">
                  <TableCell className="text-gray-300">
                    {new Date(death.date_of_death).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-white font-semibold">
                    {death.canonical_name}
                  </TableCell>
                  <TableCell className="text-white">
                    {death.age_at_death}
                  </TableCell>
                  <TableCell>
                    <Badge className={getCauseColor(death.cause_of_death_category)}>
                      {death.cause_of_death_category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-300 max-w-xs">
                    {death.cause_of_death_details || "No details available"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
