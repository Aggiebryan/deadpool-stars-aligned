
import React from "react";
import AdminPage from './pages/AdminPage';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Rules from "./pages/Rules";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Scoreboard from "./pages/Scoreboard";
import Players from "./pages/Players";
import DeceasedList from "./pages/DeceasedList";
import AdminDashboard from "./pages/AdminDashboard";
import AllPlayers from "./pages/AllPlayers";
import PlayerDetails from "./pages/PlayerDetails";
import AllDeaths from "./pages/AllDeaths";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/" element={<Index />} />
              <Route path="/rules" element={<Rules />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/scoreboard" element={<Scoreboard />} />
              <Route path="/players" element={<AllPlayers />} />
              <Route path="/player/:playerId" element={<PlayerDetails />} />
              <Route path="/deaths" element={<AllDeaths />} />
              <Route path="/deceased" element={<DeceasedList />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
