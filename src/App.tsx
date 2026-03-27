import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import SignIn from "./pages/SignIn.tsx";
import SignUp from "./pages/SignUp.tsx";
import Welcome from "./pages/Welcome.tsx";
import Feed from "./pages/Feed.tsx";
import Profile from "./pages/Profile.tsx";
import Nexus from "./pages/Nexus.tsx";
import BuildLog from "./pages/BuildLog.tsx";
import Challenges from "./pages/Challenges.tsx";
import Strands from "./pages/Strands.tsx";
import Alerts from "./pages/Alerts.tsx";
import SettingsPage from "./pages/Settings.tsx";
import AppShell from "./components/layout/AppShell.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <AppShell>{children}</AppShell>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="bottom-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/app/feed" element={<AppLayout><Feed /></AppLayout>} />
          <Route path="/app/profile" element={<AppLayout><Profile /></AppLayout>} />
          <Route path="/app/nexus" element={<AppLayout><Nexus /></AppLayout>} />
          <Route path="/app/build-log" element={<AppLayout><BuildLog /></AppLayout>} />
          <Route path="/app/challenges" element={<AppLayout><Challenges /></AppLayout>} />
          <Route path="/app/strands" element={<AppLayout><Strands /></AppLayout>} />
          <Route path="/app/alerts" element={<AppLayout><Alerts /></AppLayout>} />
          <Route path="/app/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
