import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface RSSFeed {
  id: string;
  name: string;
  url: string;
  is_active: boolean;
}

interface FetchLog {
  id: string;
  started_at: string;
  completed_at?: string;
  status: 'running' | 'completed' | 'failed';
  deaths_found: number;
  deaths_added: number;
  picks_scored: number;
  error_message?: string;
}

export const useAdminData = () => {
  const queryClient = useQueryClient();

  // Queries
  const { data: deceasedCelebrities = [] } = useQuery({
    queryKey: ['deceased-celebrities-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deceased_celebrities')
        .select('*')
        .eq('game_year', 2025)
        .order('created_at', { ascending: false }); // Show newest first for admin
      if (error) throw error;
      return data;
    }
  });

  const { data: users = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_admin', false)
        .order('total_score', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: picks = [] } = useQuery({
    queryKey: ['celebrity-picks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('celebrity_picks')
        .select('*')
        .eq('game_year', 2025);
      if (error) throw error;
      return data;
    }
  });

  const { data: rssFeeds = [] } = useQuery({
    queryKey: ['rss-feeds'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('rss_feeds')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as RSSFeed[];
    }
  });

  const { data: fetchLogs = [] } = useQuery({
    queryKey: ['fetch-logs'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('fetch_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as FetchLog[];
    }
  });

  // Mutations
  const fetchDeathsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-celebrity-deaths');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Death fetch started",
        description: "Celebrity deaths are being fetched and processed.",
      });
      queryClient.invalidateQueries({ queryKey: ['deceased-celebrities-admin'] });
      queryClient.invalidateQueries({ queryKey: ['fetch-logs'] });
      queryClient.invalidateQueries({ queryKey: ['celebrity-picks'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch deaths",
        variant: "destructive",
      });
    }
  });

  const addFeedMutation = useMutation({
    mutationFn: async (feed: { name: string; url: string }) => {
      const { data, error } = await (supabase as any)
        .from('rss_feeds')
        .insert(feed)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "RSS feed added successfully" });
      queryClient.invalidateQueries({ queryKey: ['rss-feeds'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error adding RSS feed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const toggleFeedMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any)
        .from('rss_feeds')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rss-feeds'] });
    }
  });

  return {
    deceasedCelebrities,
    users,
    picks,
    rssFeeds,
    fetchLogs,
    fetchDeathsMutation,
    addFeedMutation,
    toggleFeedMutation,
    queryClient
  };
};
