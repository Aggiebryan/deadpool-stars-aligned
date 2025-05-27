
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DeceasedCelebrity {
  id: string;
  canonical_name: string;
  date_of_death: string;
  age_at_death: number;
  cause_of_death_category: string;
  cause_of_death_details?: string;
}

interface ManageDeathsTabProps {
  deceasedCelebrities: DeceasedCelebrity[];
}

export const ManageDeathsTab = ({ deceasedCelebrities }: ManageDeathsTabProps) => {
  return (
    <Card className="bg-black/40 border-purple-800/30">
      <CardHeader>
        <CardTitle className="text-white">Manage Deaths ({deceasedCelebrities.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {deceasedCelebrities.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            No deaths recorded yet for 2025
          </p>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {deceasedCelebrities.map((deceased: DeceasedCelebrity) => (
              <div key={deceased.id} className="p-4 bg-black/20 border border-purple-800/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-semibold">{deceased.canonical_name}</h3>
                  <Badge className="bg-red-600">{deceased.cause_of_death_category}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                  <div>Age: {deceased.age_at_death}</div>
                  <div>Date: {new Date(deceased.date_of_death).toLocaleDateString()}</div>
                </div>
                {deceased.cause_of_death_details && (
                  <p className="text-gray-400 text-sm mt-2">{deceased.cause_of_death_details}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
