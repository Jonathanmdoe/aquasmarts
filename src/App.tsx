import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import MobileLayout from "@/components/MobileLayout";
import Index from "./pages/Index";
import Batches from "./pages/Batches";
import Feeding from "./pages/Feeding";
import WaterQuality from "./pages/WaterQuality";
import Marketplace from "./pages/Marketplace";
import Health from "./pages/Health";
import Financial from "./pages/Financial";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import FarmSetup from "./pages/FarmSetup";
import AIPredictions from "./pages/AIPredictions";
import Subscription from "./pages/Subscription";
import MyListings from "./pages/MyListings";
import Admin from "./pages/Admin";
import Notifications from "./pages/Notifications";
import Security from "./pages/Security";
import HelpSupport from "./pages/HelpSupport";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
      <Route path="/farm-setup" element={<ProtectedRoute><FarmSetup /></ProtectedRoute>} />
      <Route path="/" element={<ProtectedRoute><MobileLayout><Index /></MobileLayout></ProtectedRoute>} />
      <Route path="/batches" element={<ProtectedRoute><MobileLayout><Batches /></MobileLayout></ProtectedRoute>} />
      <Route path="/feeding" element={<ProtectedRoute><MobileLayout><Feeding /></MobileLayout></ProtectedRoute>} />
      <Route path="/water" element={<ProtectedRoute><MobileLayout><WaterQuality /></MobileLayout></ProtectedRoute>} />
      <Route path="/health" element={<ProtectedRoute><MobileLayout><Health /></MobileLayout></ProtectedRoute>} />
      <Route path="/financial" element={<ProtectedRoute><MobileLayout><Financial /></MobileLayout></ProtectedRoute>} />
      <Route path="/marketplace" element={<ProtectedRoute><MobileLayout><Marketplace /></MobileLayout></ProtectedRoute>} />
      <Route path="/my-listings" element={<ProtectedRoute><MobileLayout><MyListings /></MobileLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><MobileLayout><Settings /></MobileLayout></ProtectedRoute>} />
      <Route path="/subscription" element={<ProtectedRoute><MobileLayout><Subscription /></MobileLayout></ProtectedRoute>} />
      <Route path="/ai-predictions" element={<ProtectedRoute><MobileLayout><AIPredictions /></MobileLayout></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><MobileLayout><Admin /></MobileLayout></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><MobileLayout><Notifications /></MobileLayout></ProtectedRoute>} />
      <Route path="/security" element={<ProtectedRoute><MobileLayout><Security /></MobileLayout></ProtectedRoute>} />
      <Route path="/help" element={<ProtectedRoute><MobileLayout><HelpSupport /></MobileLayout></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
