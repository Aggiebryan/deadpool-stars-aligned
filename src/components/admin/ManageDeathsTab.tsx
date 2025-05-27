
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Edit, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface DeceasedCelebrity {
  id: string;
  canonical_name: string;
  date_of_death: string;
  age_at_death: number;
  cause_of_death_category: string;
  cause_of_death_details?: string;
  is_approved?: boolean;
  died_on_birthday?: boolean;
  died_on_major_holiday?: boolean;
  died_during_public_event?: boolean;
  died_in_extreme_sport?: boolean;
  is_first_death_of_year?: boolean;
  is_last_death_of_year?: boolean;
}

interface ManageDeathsTabProps {
  deceasedCelebrities: DeceasedCelebrity[];
}

export const ManageDeathsTab = ({ deceasedCelebrities }: ManageDeathsTabProps) => {
  const [editingDeath, setEditingDeath] = useState<DeceasedCelebrity | null>(null);
  const [scrapeDate, setScrapeDate] = useState("");
  const [isScrapingDate, setIsScrapingDate] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('deceased_celebrities')
        .update({ 
          is_approved: true,
          approved_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Death approved",
        description: "The death has been approved and scores have been calculated.",
      });

      queryClient.invalidateQueries({ queryKey: ['deceased-celebrities-admin'] });
      queryClient.invalidateQueries({ queryKey: ['deceased-celebrities'] });
      queryClient.invalidateQueries({ queryKey: ['celebrity-picks'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('deceased_celebrities')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Death rejected",
        description: "The death record has been removed.",
      });

      queryClient.invalidateQueries({ queryKey: ['deceased-celebrities-admin'] });
      queryClient.invalidateQueries({ queryKey: ['deceased-celebrities'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingDeath) return;

    try {
      const { error } = await supabase
        .from('deceased_celebrities')
        .update({
          canonical_name: editingDeath.canonical_name,
          age_at_death: editingDeath.age_at_death,
          cause_of_death_category: editingDeath.cause_of_death_category,
          cause_of_death_details: editingDeath.cause_of_death_details,
          died_on_birthday: editingDeath.died_on_birthday,
          died_on_major_holiday: editingDeath.died_on_major_holiday,
          died_during_public_event: editingDeath.died_during_public_event,
          died_in_extreme_sport: editingDeath.died_in_extreme_sport,
          is_first_death_of_year: editingDeath.is_first_death_of_year,
          is_last_death_of_year: editingDeath.is_last_death_of_year,
        })
        .eq('id', editingDeath.id);

      if (error) throw error;

      toast({
        title: "Death updated",
        description: "The death record has been updated.",
      });

      setEditingDeath(null);
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['deceased-celebrities-admin'] });
      queryClient.invalidateQueries({ queryKey: ['deceased-celebrities'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleScrapeSpecificDate = async () => {
    if (!scrapeDate) return;

    setIsScrapingDate(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-wikipedia-deaths', {
        body: { targetDate: scrapeDate }
      });

      if (error) throw error;

      toast({
        title: "Wikipedia scrape completed",
        description: `Scraped deaths for ${scrapeDate}: Found ${data.totalDeaths} deaths, added ${data.deathsAdded} new records`,
      });

      queryClient.invalidateQueries({ queryKey: ['deceased-celebrities-admin'] });
      queryClient.invalidateQueries({ queryKey: ['deceased-celebrities'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to scrape Wikipedia",
        variant: "destructive",
      });
    } finally {
      setIsScrapingDate(false);
    }
  };

  return (
    <Card className="bg-black/40 border-purple-800/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          Manage Deaths ({deceasedCelebrities.length})
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={scrapeDate}
                onChange={(e) => setScrapeDate(e.target.value)}
                className="bg-black/20 border-purple-800/30 text-white"
              />
              <Button
                onClick={handleScrapeSpecificDate}
                disabled={isScrapingDate || !scrapeDate}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {isScrapingDate ? "Scraping..." : "Scrape Date"}
              </Button>
            </div>
          </div>
        </CardTitle>
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
                  <div className="flex items-center gap-2">
                    <Badge className={deceased.is_approved ? "bg-green-600" : "bg-yellow-600"}>
                      {deceased.is_approved ? "Approved" : "Pending"}
                    </Badge>
                    <Badge className="bg-red-600">{deceased.cause_of_death_category}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-300 mb-3">
                  <div>Age: {deceased.age_at_death}</div>
                  <div>Date: {new Date(deceased.date_of_death).toLocaleDateString()}</div>
                </div>
                {deceased.cause_of_death_details && (
                  <p className="text-gray-400 text-sm mb-3">{deceased.cause_of_death_details}</p>
                )}
                
                {/* Show bonus points if any are active */}
                {(deceased.died_on_birthday || deceased.died_on_major_holiday || deceased.died_during_public_event || 
                  deceased.died_in_extreme_sport || deceased.is_first_death_of_year || deceased.is_last_death_of_year) && (
                  <div className="mb-3">
                    <p className="text-xs text-yellow-400 mb-1">Active Bonuses:</p>
                    <div className="flex flex-wrap gap-1">
                      {deceased.died_on_birthday && <Badge variant="outline" className="text-xs">Birthday +15pts</Badge>}
                      {deceased.died_on_major_holiday && <Badge variant="outline" className="text-xs">Holiday +10pts</Badge>}
                      {deceased.died_during_public_event && <Badge variant="outline" className="text-xs">Public Event +25pts</Badge>}
                      {deceased.died_in_extreme_sport && <Badge variant="outline" className="text-xs">Extreme Sport +30pts</Badge>}
                      {deceased.is_first_death_of_year && <Badge variant="outline" className="text-xs">First Death +10pts</Badge>}
                      {deceased.is_last_death_of_year && <Badge variant="outline" className="text-xs">Last Death +10pts</Badge>}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {!deceased.is_approved && (
                    <>
                      <Button
                        onClick={() => handleApprove(deceased.id)}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleReject(deceased.id)}
                        className="bg-red-600 hover:bg-red-700"
                        size="sm"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setEditingDeath(deceased);
                          setIsDialogOpen(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="sm"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-purple-800/30 text-white max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Edit Death Record</DialogTitle>
                        <DialogDescription>
                          Edit the death record details and bonus point modifiers.
                        </DialogDescription>
                      </DialogHeader>
                      {editingDeath && (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="name">Name</Label>
                            <Input
                              id="name"
                              value={editingDeath.canonical_name}
                              onChange={(e) => setEditingDeath({ ...editingDeath, canonical_name: e.target.value })}
                              className="bg-black/20 border-purple-800/30"
                            />
                          </div>
                          <div>
                            <Label htmlFor="age">Age at Death</Label>
                            <Input
                              id="age"
                              type="number"
                              value={editingDeath.age_at_death}
                              onChange={(e) => setEditingDeath({ ...editingDeath, age_at_death: parseInt(e.target.value) })}
                              className="bg-black/20 border-purple-800/30"
                            />
                          </div>
                          <div>
                            <Label htmlFor="cause">Cause of Death Category</Label>
                            <Select
                              value={editingDeath.cause_of_death_category}
                              onValueChange={(value) => setEditingDeath({ ...editingDeath, cause_of_death_category: value })}
                            >
                              <SelectTrigger className="bg-black/20 border-purple-800/30">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-900 border-purple-800/30">
                                <SelectItem value="Natural">Natural</SelectItem>
                                <SelectItem value="Accidental">Accidental</SelectItem>
                                <SelectItem value="Violent">Violent</SelectItem>
                                <SelectItem value="Suicide">Suicide</SelectItem>
                                <SelectItem value="RareOrUnusual">Rare/Unusual</SelectItem>
                                <SelectItem value="PandemicOrOutbreak">Pandemic/Outbreak</SelectItem>
                                <SelectItem value="Unknown">Unknown</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="details">Cause Details</Label>
                            <Textarea
                              id="details"
                              value={editingDeath.cause_of_death_details || ""}
                              onChange={(e) => setEditingDeath({ ...editingDeath, cause_of_death_details: e.target.value })}
                              className="bg-black/20 border-purple-800/30"
                            />
                          </div>
                          <div>
                            <Label className="text-base font-semibold">Bonus Point Modifiers</Label>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="birthday"
                                  checked={editingDeath.died_on_birthday || false}
                                  onCheckedChange={(checked) => setEditingDeath({ ...editingDeath, died_on_birthday: !!checked })}
                                />
                                <Label htmlFor="birthday">Died on Birthday (+15pts)</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="holiday"
                                  checked={editingDeath.died_on_major_holiday || false}
                                  onCheckedChange={(checked) => setEditingDeath({ ...editingDeath, died_on_major_holiday: !!checked })}
                                />
                                <Label htmlFor="holiday">Died on Holiday (+10pts)</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="public"
                                  checked={editingDeath.died_during_public_event || false}
                                  onCheckedChange={(checked) => setEditingDeath({ ...editingDeath, died_during_public_event: !!checked })}
                                />
                                <Label htmlFor="public">Died During Public Event (+25pts)</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="extreme"
                                  checked={editingDeath.died_in_extreme_sport || false}
                                  onCheckedChange={(checked) => setEditingDeath({ ...editingDeath, died_in_extreme_sport: !!checked })}
                                />
                                <Label htmlFor="extreme">Died in Extreme Sport (+30pts)</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="first"
                                  checked={editingDeath.is_first_death_of_year || false}
                                  onCheckedChange={(checked) => setEditingDeath({ ...editingDeath, is_first_death_of_year: !!checked })}
                                />
                                <Label htmlFor="first">First Death of Year (+10pts)</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="last"
                                  checked={editingDeath.is_last_death_of_year || false}
                                  onCheckedChange={(checked) => setEditingDeath({ ...editingDeath, is_last_death_of_year: !!checked })}
                                />
                                <Label htmlFor="last">Last Death of Year (+10pts)</Label>
                              </div>
                            </div>
                          </div>
                          <Button onClick={handleSaveEdit} className="bg-green-600 hover:bg-green-700 w-full">
                            Save Changes
                          </Button>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
