import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import Index from "./pages/Index";
import AddDrink from "./pages/AddDrink";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import CalendarView from "./pages/CalendarView";
import UserProfile from "./pages/UserProfile";
import Notifications from "./pages/Notifications";
import Minigames from "./pages/Minigames";
import Settings from "./pages/Settings";
import VenueDetail from "./pages/VenueDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/add" element={<AddDrink />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/search" element={<Search />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/user/:userId" element={<UserProfile />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/minigames" element={<Minigames />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/venue/:venueName" element={<VenueDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
