
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skull, ArrowLeft } from "lucide-react";
import { getUsers, saveUsers, setCurrentUser, generateId } from "@/utils/localStorage";
import { toast } from "@/hooks/use-toast";
import { User } from "@/types";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Check if username or email already exists
    const users = getUsers();
    const existingUser = users.find(u => u.username === username || u.email === email);
    
    if (existingUser) {
      toast({
        title: "Registration failed",
        description: "Username or email already exists",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Create new user
    const newUser: User = {
      id: generateId(),
      username,
      email,
      isAdmin: false,
      totalScore: 0,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);
    setCurrentUser(newUser);

    toast({
      title: "Welcome to DeadPool 2025!",
      description: `Account created for ${username}`,
    });

    navigate("/dashboard");
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
            <CardTitle className="text-white text-2xl text-center">Join the Pool</CardTitle>
            <CardDescription className="text-gray-400 text-center">
              Create your account and start picking celebrities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
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
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-black/20 border-purple-800/30 text-white"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-gray-400">
                Already have an account?{" "}
                <Link to="/login" className="text-purple-400 hover:text-purple-300">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
