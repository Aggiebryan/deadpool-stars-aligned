
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Skull } from "lucide-react";

interface Death {
  id: string;
  canonical_name: string;
  date_of_death: string;
  age_at_death: number;
  cause_of_death_category: string;
  cause_of_death_details?: string;
}

const AllDeaths = () => {
  const navigate = useNavigate();

  const { data: deaths = [], isLoading } = useQuery({
    queryKey: ['approved-deaths'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deceased_celebrities')
        .select('*')
        .eq('game_year', 2025)
        .eq('is_approved', true)
        .order('date_of_death', { ascending: false });
      
      if (error) throw error;
      return data as Death[];
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="border-purple-800/30 text-white hover:bg-purple-800/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Skull className="h-8 w-8 text-purple-400" />
              <h1 className="text-4xl font-bold text-white">Confirmed Deaths 2025</h1>
            </div>
          </div>

          <Card className="bg-black/40 border-purple-800/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Skull className="h-5 w-5 text-red-400" />
                Approved Deaths ({deaths.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-400">Loading deaths...</div>
              ) : deaths.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No confirmed deaths found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-purple-800/30">
                      <TableHead className="text-purple-300">Name</TableHead>
                      <TableHead className="text-purple-300">Date of Death</TableHead>
                      <TableHead className="text-purple-300">Age</TableHead>
                      <TableHead className="text-purple-300">Cause</TableHead>
                      <TableHead className="text-purple-300">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deaths.map((death) => (
                      <TableRow key={death.id} className="border-purple-800/30 hover:bg-purple-800/10">
                        <TableCell className="text-white font-semibold">
                          {death.canonical_name}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {new Date(death.date_of_death).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-white">
                          {death.age_at_death}
                        </TableCell>
                        <TableCell>
                          <Badge className={getCauseColor(death.cause_of_death_category)}>
                            {death.cause_of_death_category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300 max-w-xs truncate">
                          {death.cause_of_death_details || "No details available"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AllDeaths;
