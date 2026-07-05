import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { useUserRole } from "@/hooks/useUserRole";
import { useSubscription } from "@/hooks/useSubscription";
import MobileLayout from "@/components/MobileLayout";
import Enterprise from "./pages/Enterprise";
import Sales from "./pages/Sales";
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
import More from "./pages/More";
import Notifications from "./pages/Notifications";
import Security from "./pages/Security";
import HelpSupport from "./pages/HelpSupport";
import WorkerDashboard from "./pages/WorkerDashboard";
import MarketplaceKYC from "./pages/MarketplaceKYC";
import MarketplaceDisputes from "./pages/MarketplaceDisputes";
import MarketplaceNotifications from "./pages/MarketplaceNotifications";
import MarketplaceAnalytics from "./pages/MarketplaceAnalytics";
import DevLogin from "./pages/DevLogin";
import RoleCheck from "./pages/RoleCheck";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function OwnerRoute({ children }: { children: React.ReactNode }) {
  const { isOwner, isSuperAdmin, loading } = useUserRole();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!isOwner && !isSuperAdmin) return <Navigate to="/settings" replace />;
  return <>{children}</>;
}

type RoleName = "owner" | "manager" | "worker" | "super_admin";
function RoleRoute({ children, allow }: { children: React.ReactNode; allow: RoleName[] }) {
  const { primaryRole, isSuperAdmin, loading } = useUserRole();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (isSuperAdmin) return <>{children}</>;
  const role = (primaryRole ?? "owner") as RoleName;
  if (!allow.includes(role)) {
    return <Navigate to={role === "worker" ? "/worker" : "/"} replace />;
  }
  return <>{children}</>;
}

function EnterpriseRoute({ children }: { children: React.ReactNode }) {
  const { currentTier, loading } = useSubscription();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (currentTier !== "enterprise") return <Navigate to="/subscription" replace />;
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
      <Route path="/dev-login" element={<DevLogin />} />
      <Route path="/farm-setup" element={<ProtectedRoute><FarmSetup /></ProtectedRoute>} />
      <Route path="/" element={<ProtectedRoute><MobileLayout><Index /></MobileLayout></ProtectedRoute>} />
      <Route path="/batches" element={<ProtectedRoute><RoleRoute allow={["owner","manager","worker"]}><MobileLayout><Batches /></MobileLayout></RoleRoute></ProtectedRoute>} />
      <Route path="/feeding" element={<ProtectedRoute><RoleRoute allow={["owner","manager","worker"]}><MobileLayout><Feeding /></MobileLayout></RoleRoute></ProtectedRoute>} />
      <Route path="/water" element={<ProtectedRoute><RoleRoute allow={["owner","manager","worker"]}><MobileLayout><WaterQuality /></MobileLayout></RoleRoute></ProtectedRoute>} />
      <Route path="/health" element={<ProtectedRoute><RoleRoute allow={["owner","manager","worker"]}><MobileLayout><Health /></MobileLayout></RoleRoute></ProtectedRoute>} />
      <Route path="/financial" element={<ProtectedRoute><RoleRoute allow={["owner","manager"]}><MobileLayout><Financial /></MobileLayout></RoleRoute></ProtectedRoute>} />
      <Route path="/marketplace" element={<ProtectedRoute><RoleRoute allow={["owner","manager"]}><MobileLayout><Marketplace /></MobileLayout></RoleRoute></ProtectedRoute>} />
      <Route path="/my-listings" element={<ProtectedRoute><RoleRoute allow={["owner","manager"]}><MobileLayout><MyListings /></MobileLayout></RoleRoute></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><MobileLayout><Settings /></MobileLayout></ProtectedRoute>} />
      <Route path="/more" element={<ProtectedRoute><MobileLayout><More /></MobileLayout></ProtectedRoute>} />
      <Route path="/subscription" element={<ProtectedRoute><RoleRoute allow={["owner"]}><MobileLayout><Subscription /></MobileLayout></RoleRoute></ProtectedRoute>} />
      <Route path="/ai-predictions" element={<ProtectedRoute><RoleRoute allow={["owner","manager"]}><MobileLayout><AIPredictions /></MobileLayout></RoleRoute></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><OwnerRoute><MobileLayout><Admin /></MobileLayout></OwnerRoute></ProtectedRoute>} />
      <Route path="/enterprise" element={<ProtectedRoute><EnterpriseRoute><MobileLayout><Enterprise /></MobileLayout></EnterpriseRoute></ProtectedRoute>} />
      <Route path="/sales" element={<ProtectedRoute><RoleRoute allow={["owner","manager"]}><MobileLayout><Sales /></MobileLayout></RoleRoute></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><MobileLayout><Notifications /></MobileLayout></ProtectedRoute>} />
      <Route path="/security" element={<ProtectedRoute><MobileLayout><Security /></MobileLayout></ProtectedRoute>} />
      <Route path="/help" element={<ProtectedRoute><MobileLayout><HelpSupport /></MobileLayout></ProtectedRoute>} />
      <Route path="/worker" element={<ProtectedRoute><MobileLayout><WorkerDashboard /></MobileLayout></ProtectedRoute>} />
      <Route path="/marketplace/kyc" element={<ProtectedRoute><RoleRoute allow={["owner"]}><MobileLayout><MarketplaceKYC /></MobileLayout></RoleRoute></ProtectedRoute>} />
      <Route path="/marketplace/disputes" element={<ProtectedRoute><RoleRoute allow={["owner","manager"]}><MobileLayout><MarketplaceDisputes /></MobileLayout></RoleRoute></ProtectedRoute>} />
      <Route path="/marketplace/disputes/:id" element={<ProtectedRoute><RoleRoute allow={["owner","manager"]}><MobileLayout><MarketplaceDisputes /></MobileLayout></RoleRoute></ProtectedRoute>} />
      <Route path="/marketplace/notifications" element={<ProtectedRoute><RoleRoute allow={["owner","manager"]}><MobileLayout><MarketplaceNotifications /></MobileLayout></RoleRoute></ProtectedRoute>} />
      <Route path="/marketplace/analytics" element={<ProtectedRoute><RoleRoute allow={["owner","manager"]}><MobileLayout><MarketplaceAnalytics /></MobileLayout></RoleRoute></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
