
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";

interface RSSFeed {
  id: string;
  name: string;
  url: string;
  is_active: boolean;
}

interface RSSFeedsTabProps {
  rssFeeds: RSSFeed[];
  addFeedMutation: UseMutationResult<any, Error, { name: string; url: string }, unknown>;
  toggleFeedMutation: UseMutationResult<void, Error, { id: string; is_active: boolean }, unknown>;
}

export const RSSFeedsTab = ({ rssFeeds, addFeedMutation, toggleFeedMutation }: RSSFeedsTabProps) => {
  const [newFeed, setNewFeed] = useState({ name: '', url: '' });

  const handleAddFeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFeed.name && newFeed.url) {
      addFeedMutation.mutate(newFeed);
      setNewFeed({ name: '', url: '' });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-black/40 border-purple-800/30">
        <CardHeader>
          <CardTitle className="text-white">Add RSS Feed</CardTitle>
          <CardDescription className="text-gray-400">
            Add new RSS feeds to monitor for celebrity deaths
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddFeed} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="feedName" className="text-white">Feed Name</Label>
                <Input
                  id="feedName"
                  value={newFeed.name}
                  onChange={(e) => setNewFeed({...newFeed, name: e.target.value})}
                  className="bg-black/20 border-purple-800/30 text-white"
                  placeholder="e.g., TMZ Deaths"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedUrl" className="text-white">RSS URL</Label>
                <Input
                  id="feedUrl"
                  type="url"
                  value={newFeed.url}
                  onChange={(e) => setNewFeed({...newFeed, url: e.target.value})}
                  className="bg-black/20 border-purple-800/30 text-white"
                  placeholder="https://example.com/deaths.rss"
                  required
                />
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={addFeedMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {addFeedMutation.isPending ? "Adding..." : "Add RSS Feed"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-black/40 border-purple-800/30">
        <CardHeader>
          <CardTitle className="text-white">Manage RSS Feeds ({rssFeeds.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rssFeeds.map((feed: RSSFeed) => (
              <div key={feed.id} className="flex items-center justify-between p-4 bg-black/20 border border-purple-800/30 rounded-lg">
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{feed.name}</h3>
                  <p className="text-gray-400 text-sm">{feed.url}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={feed.is_active ? "bg-green-600" : "bg-red-600"}>
                    {feed.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    onClick={() => toggleFeedMutation.mutate({ id: feed.id, is_active: !feed.is_active })}
                    variant="outline"
                    size="sm"
                    className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white"
                  >
                    {feed.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
