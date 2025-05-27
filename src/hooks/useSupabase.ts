import { createClient } from '@supabase/supabase-js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseConfig } from '@/config/supabase';

// Only create the client if we have valid configuration
let supabase: any = null;

try {
  if (supabaseConfig.url !== 'https://placeholder.supabase.co' && supabaseConfig.anonKey !== 'placeholder-anon-key') {
    supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
  }
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
}

export { supabase };

export interface SupabaseDeceasedCelebrity {
  id: string;
  canonical_name: string;
  date_of_birth?: string;
  date_of_death: string;
  age_at_death: number;
  cause_of_death_category: 'Natural' | 'Accidental' | 'Violent' | 'Suicide' | 'RareOrUnusual' | 'PandemicOrOutbreak' | 'Unknown';
  cause_of_death_details?: string;
  died_during_public_event: boolean;
  died_in_extreme_sport: boolean;
  died_on_birthday: boolean;
  died_on_major_holiday: boolean;
  is_first_death_of_year: boolean;
  is_last_death_of_year: boolean;
  game_year: number;
  source_url?: string;
  created_at: string;
}

export interface SupabaseCelebrityPick {
  id: string;
  user_id: string;
  celebrity_name: string;
  game_year: number;
  is_hit: boolean;
  points_awarded: number;
  created_at: string;
}

export interface SupabaseUser {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
  total_score: number;
  created_at: string;
}

export const useDeceasedCelebrities = (gameYear: number = 2025) => {
  return useQuery({
    queryKey: ['deceased-celebrities', gameYear],
    queryFn: async () => {
      if (!supabase) {
        console.log('Supabase not configured, returning mock data');
        return [];
      }
      
      const { data, error } = await supabase
        .from('deceased_celebrities')
        .select('*')
        .eq('game_year', gameYear)
        .order('date_of_death', { ascending: false });
      
      if (error) throw error;
      return data as SupabaseDeceasedCelebrity[];
    }
  });
};

export const useCelebrityPicks = (userId?: string, gameYear: number = 2025) => {
  return useQuery({
    queryKey: ['celebrity-picks', userId, gameYear],
    queryFn: async () => {
      if (!userId || !supabase) return [];
      
      const { data, error } = await supabase
        .from('celebrity_picks')
        .select('*')
        .eq('user_id', userId)
        .eq('game_year', gameYear);
      
      if (error) throw error;
      return data as SupabaseCelebrityPick[];
    },
    enabled: !!userId
  });
};

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      if (!supabase) {
        console.log('Supabase not configured, returning empty users');
        return [];
      }
      
      const { data, error } = await supabase
        .from('users')
        .select('id, username, email, is_admin, total_score, created_at')
        .order('total_score', { ascending: false });
      
      if (error) throw error;
      return data as SupabaseUser[];
    }
  });
};

export const useFetchCelebrityDeaths = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }
      
      const { data, error } = await supabase.functions.invoke('fetch-celebrity-deaths');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deceased-celebrities'] });
    }
  });
};

export const useCreateDeceasedCelebrity = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (celebrity: Omit<SupabaseDeceasedCelebrity, 'id' | 'created_at'>) => {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }
      
      const { data, error } = await supabase
        .from('deceased_celebrities')
        .insert(celebrity)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deceased-celebrities'] });
    }
  });
};
