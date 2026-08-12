import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { LanguageProvider } from "@/i18n";
import { useUserRole, RoleProvider } from "@/hooks/useUserRole";

import { useSubscription } from "@/hooks/useSubscription";
import MobileLayout from "@/components/MobileLayout";
import Auth from "./pages/Auth";
import Index from "./pages/Index";

const Enterprise = lazy(() => import("./pages/Enterprise"));
const Sales = lazy(() => import("./pages/Sales"));
const Batches = lazy(() => import("./pages/Batches"));
const Growth = lazy(() => import("./pages/Growth"));
const Feeding = lazy(() => import("./pages/Feeding"));
const WaterQuality = lazy(() => import("./pages/WaterQuality"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Health = lazy(() => import("./pages/Health"));
const Financial = lazy(() => import("./pages/Financial"));
const Settings = lazy(() => import("./pages/Settings"));
const FarmSetup = lazy(() => import("./pages/FarmSetup"));
const AIPredictions = lazy(() => import("./pages/AIPredictions"));
const Subscription = lazy(() => import("./pages/Subscription"));
const MyListings = lazy(() => import("./pages/MyListings"));
const Admin = lazy(() => import("./pages/Admin"));
const More = lazy(() => import("./pages/More"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Security = lazy(() => import("./pages/Security"));
const HelpSupport = lazy(() => import("./pages/HelpSupport"));
const WorkerDashboard = lazy(() => import("./pages/WorkerDashboard"));
const MarketplaceKYC = lazy(() => import("./pages/MarketplaceKYC"));
const MarketplaceDisputes = lazy(() => import("./pages/MarketplaceDisputes"));
const MarketplaceNotifications = lazy(() => import("./pages/MarketplaceNotifications"));
const MarketplaceAnalytics = lazy(() => import("./pages/MarketplaceAnalytics"));
const RoleCheck = lazy(() => import("./pages/RoleCheck"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PaymentResult = lazy(() => import("./pages/PaymentResult"));

const PageSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

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

function RoleHome() {
  const { isSuperAdmin, isWorker, isOwner, isManager, loading } = useUserRole();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (isSuperAdmin) return <Navigate to="/admin" replace />;
  if (isWorker && !isOwner && !isManager) return <Navigate to="/worker" replace />;
  return <MobileLayout><Index /></MobileLayout>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageSpinner />}>
    <Routes>
      <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
      <Route path="/dev-login" element={<Navigate to="/auth" replace />} />
      <Route path="/farm-setup" element={<ProtectedRoute><FarmSetup /></ProtectedRoute>} />
      <Route path="/" element={<ProtectedRoute><RoleHome /></ProtectedRoute>} />

      <Route path="/batches" element={<ProtectedRoute><RoleRoute allow={["owner","manager","worker"]}><MobileLayout><Batches /></MobileLayout></RoleRoute></ProtectedRoute>} />
      <Route path="/growth" element={<ProtectedRoute><RoleRoute allow={["owner","manager","worker"]}><MobileLayout><Growth /></MobileLayout></RoleRoute></ProtectedRoute>} />
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
      <Route path="/role-check" element={<ProtectedRoute><MobileLayout><RoleCheck /></MobileLayout></ProtectedRoute>} />
      <Route path="/marketplace/kyc" element={<ProtectedRoute><RoleRoute allow={["owner"]}><MobileLayout><MarketplaceKYC /></MobileLayout></RoleRoute></ProtectedRoute>} />
      <Route path="/marketplace/disputes" element={<ProtectedRoute><RoleRoute allow={["owner","manager"]}><MobileLayout><MarketplaceDisputes /></MobileLayout></RoleRoute></ProtectedRoute>} />
      <Route path="/marketplace/disputes/:id" element={<ProtectedRoute><RoleRoute allow={["owner","manager"]}><MobileLayout><MarketplaceDisputes /></MobileLayout></RoleRoute></ProtectedRoute>} />
      <Route path="/marketplace/notifications" element={<ProtectedRoute><RoleRoute allow={["owner","manager"]}><MobileLayout><MarketplaceNotifications /></MobileLayout></RoleRoute></ProtectedRoute>} />
      <Route path="/marketplace/analytics" element={<ProtectedRoute><RoleRoute allow={["owner","manager"]}><MobileLayout><MarketplaceAnalytics /></MobileLayout></RoleRoute></ProtectedRoute>} />

      <Route path="/payment-success" element={<PaymentResult outcome="success" />} />
      <Route path="/payment-canceled" element={<PaymentResult outcome="canceled" />} />
      <Route path="*" element={<NotFound />} />

    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <RoleProvider>
                <AppRoutes />
              </RoleProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

