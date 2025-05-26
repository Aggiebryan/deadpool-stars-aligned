
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skull, ArrowLeft } from "lucide-react";
import { getUsers, setCurrentUser } from "@/utils/localStorage";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simple authentication check (in real app, this would be server-side)
    const users = getUsers();
    const user = users.find(u => u.username === username);

    if (user) {
      // In a real app, you'd verify the password hash
      setCurrentUser(user);
      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.username}`,
      });
      navigate(user.isAdmin ? "/admin" : "/dashboard");
    } else {
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 text-white hover:text-purple-300 mb-4">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Skull className="h-8 w-8 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">DeadPool 2025</h1>
          </div>
        </div>

        <Card className="bg-black/40 border-purple-800/30">
          <CardHeader>
            <CardTitle className="text-white text-2xl text-center">Welcome Back</CardTitle>
            <CardDescription className="text-gray-400 text-center">
              Sign in to manage your death pool picks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-black/20 border-purple-800/30 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-black/20 border-purple-800/30 text-white"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-gray-400">
                Don't have an account?{" "}
                <Link to="/register" className="text-purple-400 hover:text-purple-300">
                  Register here
                </Link>
              </p>
            </div>

            <div className="mt-4 p-4 bg-purple-900/20 rounded-lg">
              <p className="text-sm text-gray-300 mb-2">Demo Accounts:</p>
              <p className="text-xs text-gray-400">Admin: username "admin", any password</p>
              <p className="text-xs text-gray-400">Or register as a new player</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
