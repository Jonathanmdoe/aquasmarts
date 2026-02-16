import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MobileLayout from "@/components/MobileLayout";
import Index from "./pages/Index";
import Batches from "./pages/Batches";
import Feeding from "./pages/Feeding";
import WaterQuality from "./pages/WaterQuality";
import Marketplace from "./pages/Marketplace";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <MobileLayout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/batches" element={<Batches />} />
            <Route path="/feeding" element={<Feeding />} />
            <Route path="/water" element={<WaterQuality />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MobileLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
