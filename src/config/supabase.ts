
export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'
};

// Note: You'll need to set these environment variables in your Lovable project settings:
// VITE_SUPABASE_URL=your_supabase_project_url
// VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
