
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export const AddDeathTab = () => {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  
  const [newDeath, setNewDeath] = useState({
    canonicalName: '',
    dateOfBirth: '',
    dateOfDeath: '',
    causeOfDeathCategory: 'Natural' as any,
    causeOfDeathDetails: '',
    diedDuringPublicEvent: false,
    diedInExtremeSport: false,
    isFirstDeathOfYear: false,
    isLastDeathOfYear: false
  });

  const handleAddDeath = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const birthDate = new Date(newDeath.dateOfBirth);
      const deathDate = new Date(newDeath.dateOfDeath);
      const ageAtDeath = deathDate.getFullYear() - birthDate.getFullYear();

      const { error } = await supabase
        .from('deceased_celebrities')
        .insert({
          canonical_name: newDeath.canonicalName,
          date_of_birth: newDeath.dateOfBirth,
          date_of_death: newDeath.dateOfDeath,
          age_at_death: ageAtDeath,
          cause_of_death_category: newDeath.causeOfDeathCategory,
          cause_of_death_details: newDeath.causeOfDeathDetails || null,
          died_during_public_event: newDeath.diedDuringPublicEvent,
          died_in_extreme_sport: newDeath.diedInExtremeSport,
          is_first_death_of_year: newDeath.isFirstDeathOfYear,
          is_last_death_of_year: newDeath.isLastDeathOfYear,
          game_year: 2025
        });

      if (error) throw error;

      toast({
        title: "Death recorded successfully",
        description: "Celebrity death has been added and scores updated.",
      });

      // Reset form
      setNewDeath({
        canonicalName: '',
        dateOfBirth: '',
        dateOfDeath: '',
        causeOfDeathCategory: 'Natural',
        causeOfDeathDetails: '',
        diedDuringPublicEvent: false,
        diedInExtremeSport: false,
        isFirstDeathOfYear: false,
        isLastDeathOfYear: false
      });

      queryClient.invalidateQueries({ queryKey: ['deceased-celebrities'] });
      queryClient.invalidateQueries({ queryKey: ['celebrity-picks'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    } catch (error: any) {
      toast({
        title: "Error recording death",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-black/40 border-purple-800/30">
      <CardHeader>
        <CardTitle className="text-white">Record Celebrity Death</CardTitle>
        <CardDescription className="text-gray-400">
          Enter death details to automatically score matching player picks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddDeath} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="canonicalName" className="text-white">Celebrity Name *</Label>
              <Input
                id="canonicalName"
                value={newDeath.canonicalName}
                onChange={(e) => setNewDeath({...newDeath, canonicalName: e.target.value})}
                className="bg-black/20 border-purple-800/30 text-white"
                placeholder="Enter the celebrity's full name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="causeOfDeathCategory" className="text-white">Cause of Death *</Label>
              <Select value={newDeath.causeOfDeathCategory} onValueChange={(value) => 
                setNewDeath({...newDeath, causeOfDeathCategory: value as any})
              }>
                <SelectTrigger className="bg-black/20 border-purple-800/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Natural">Natural</SelectItem>
                  <SelectItem value="Accidental">Accidental</SelectItem>
                  <SelectItem value="Violent">Violent</SelectItem>
                  <SelectItem value="Suicide">Suicide</SelectItem>
                  <SelectItem value="RareOrUnusual">Rare/Unusual</SelectItem>
                  <SelectItem value="PandemicOrOutbreak">Pandemic/Outbreak</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="text-white">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={newDeath.dateOfBirth}
                onChange={(e) => setNewDeath({...newDeath, dateOfBirth: e.target.value})}
                className="bg-black/20 border-purple-800/30 text-white"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateOfDeath" className="text-white">Date of Death *</Label>
              <Input
                id="dateOfDeath"
                type="date"
                value={newDeath.dateOfDeath}
                onChange={(e) => setNewDeath({...newDeath, dateOfDeath: e.target.value})}
                className="bg-black/20 border-purple-800/30 text-white"
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="causeOfDeathDetails" className="text-white">Additional Details</Label>
            <Textarea
              id="causeOfDeathDetails"
              value={newDeath.causeOfDeathDetails}
              onChange={(e) => setNewDeath({...newDeath, causeOfDeathDetails: e.target.value})}
              className="bg-black/20 border-purple-800/30 text-white"
              placeholder="Optional additional details about the death"
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <Label className="text-white">Special Circumstances</Label>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { key: 'diedDuringPublicEvent', label: 'Died During Public Event (+25 pts)' },
                { key: 'diedInExtremeSport', label: 'Died in Extreme Sport (+30 pts)' },
                { key: 'isFirstDeathOfYear', label: 'First Death of 2025 (+10 pts)' },
                { key: 'isLastDeathOfYear', label: 'Last Death of 2025 (+10 pts)' }
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={newDeath[key as keyof typeof newDeath] as boolean}
                    onCheckedChange={(checked) => setNewDeath({...newDeath, [key]: checked})}
                  />
                  <Label htmlFor={key} className="text-gray-300 text-sm">{label}</Label>
                </div>
              ))}
            </div>
          </div>

          <Button 
            type="submit" 
            className="bg-purple-600 hover:bg-purple-700"
            disabled={isLoading}
          >
            {isLoading ? "Recording Death..." : "Record Death & Score Players"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
