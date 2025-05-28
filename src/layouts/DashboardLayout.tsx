import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Skull, List, Users, ScrollText, LogOut, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session) {
        navigate('/');
      } else {
        // Check if user is admin (you can customize this logic)
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .single();
        
        // Simple admin check - you can make this more sophisticated
        // For now, check if username contains 'admin' or is in a specific list
        const adminUsernames = ['admin', 'administrator', 'root'];
        setIsAdmin(adminUsernames.includes(profile?.username?.toLowerCase() || ''));
      }
    });
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Skull className="h-8 w-8 text-red-500" />
              <span className="ml-2 text-xl font-bold text-white">2025 Deadpool Contest</span>
            </div>
            <div className="flex space-x-4">
              <NavLink to="/my-list" icon={<List className="w-5 h-5" />}>
                My List
              </NavLink>
              <NavLink to="/celebrity-deaths" icon={<Skull className="w-5 h-5" />}>
                Celebrity Deaths
              </NavLink>
              <NavLink to="/leaderboard" icon={<Users className="w-5 h-5" />}>
                Leaderboard
              </NavLink>
              <NavLink to="/rules" icon={<ScrollText className="w-5 h-5" />}>
                Rules
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" icon={<Settings className="w-5 h-5" />}>
                  Admin
                </NavLink>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center px-3 py-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 px-4">
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="flex items-center px-3 py-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700"
    >
      {icon}
      <span className="ml-2">{children}</span>
    </Link>
  );
}
