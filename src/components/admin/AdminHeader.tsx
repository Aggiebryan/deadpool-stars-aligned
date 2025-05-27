
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skull, Shield, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface AdminHeaderProps {
  username: string;
}

export const AdminHeader = ({ username }: AdminHeaderProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
    toast({
      title: "Logged out",
      description: "Admin session ended",
    });
  };

  return (
    <header className="border-b border-purple-800/30 bg-black/20 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <Skull className="h-8 w-8 text-purple-400" />
          <h1 className="text-2xl font-bold text-white">DeadPool 2025 Admin</h1>
        </Link>
        <div className="flex items-center space-x-4">
          <Badge className="bg-red-600">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
          <span className="text-white">Welcome, {username}</span>
          <Button onClick={handleLogout} variant="ghost" className="text-white hover:text-purple-300">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};
