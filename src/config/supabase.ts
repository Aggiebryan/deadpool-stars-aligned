
export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'
};

// Note: You'll need to set these environment variables in your Lovable project settings:
// VITE_SUPABASE_URL=your_supabase_project_url
// VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
