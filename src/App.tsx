import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, PublicOnlyRoute } from "@/components/RouteGuard";
import Index from "./pages/Index.tsx";
import SignIn from "./pages/SignIn.tsx";
import SignUp from "./pages/SignUp.tsx";
import Welcome from "./pages/Welcome.tsx";
import Feed from "./pages/Feed.tsx";
import Profile from "./pages/Profile.tsx";
import Explore from "./pages/Explore.tsx";
import MyWork from "./pages/MyWork.tsx";
import ProjectHub from "./pages/ProjectHub.tsx";
import Opportunities from "./pages/Opportunities.tsx";
import Strands from "./pages/Strands.tsx";
import Pings from "./pages/Pings.tsx";
import Alerts from "./pages/Alerts.tsx";
import SettingsPage from "./pages/Settings.tsx";
import Institution from "./pages/Institution.tsx";
import WorkDetail from "./pages/WorkDetail.tsx";
import Workspace from "./pages/Workspace.tsx";
import CreatePage from "./pages/CreatePage.tsx";
import PageProfile from "./pages/PageProfile.tsx";
import VerifyInvite from "./pages/VerifyInvite.tsx";
import Privacy from "./pages/Privacy.tsx";
import Terms from "./pages/Terms.tsx";
import JoinAsInstitution from "./pages/JoinAsInstitution.tsx";
import Academy from "./pages/Academy.tsx";
import AppShell from "./components/layout/AppShell.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const Shell = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute><AppShell>{children}</AppShell></ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner position="bottom-right" />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Index />} />
          <Route path="/signin" element={<PublicOnlyRoute><SignIn /></PublicOnlyRoute>} />
          <Route path="/signup" element={<PublicOnlyRoute><SignUp /></PublicOnlyRoute>} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/verify-invite" element={<VerifyInvite />} />
          <Route path="/join-as-institution" element={<JoinAsInstitution />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/create-page" element={<Shell><CreatePage /></Shell>} />
          {/* App (protected) */}
          <Route path="/app/feed" element={<Shell><Feed /></Shell>} />
          <Route path="/app/explore" element={<Shell><Explore /></Shell>} />
          <Route path="/app/profile" element={<Shell><Profile /></Shell>} />
          <Route path="/app/profile/:id" element={<Shell><Profile /></Shell>} />
          <Route path="/app/teams" element={<Shell><MyWork /></Shell>} />
          <Route path="/app/teams/:projectId" element={<Shell><ProjectHub /></Shell>} />
          <Route path="/app/opportunities" element={<Shell><Opportunities /></Shell>} />
          <Route path="/app/strands" element={<Shell><Strands /></Shell>} />
          <Route path="/app/pings" element={<Shell><Pings /></Shell>} />
          <Route path="/app/pings/:id" element={<Shell><Pings /></Shell>} />
          <Route path="/app/alerts" element={<Shell><Alerts /></Shell>} />
          <Route path="/app/settings" element={<Shell><SettingsPage /></Shell>} />
          <Route path="/app/institution/:id" element={<Shell><Institution /></Shell>} />
          <Route path="/app/workspace" element={<Shell><Workspace /></Shell>} />
          <Route path="/app/academy" element={<Shell><Academy /></Shell>} />
          {/* Pages (org profiles) */}
          <Route path="/p/:slug" element={<Shell><PageProfile /></Shell>} />
          {/* Legacy redirects */}
          <Route path="/app/nexus" element={<Shell><Explore /></Shell>} />
          <Route path="/app/work" element={<Shell><MyWork /></Shell>} />
          <Route path="/app/my-work" element={<Shell><MyWork /></Shell>} />
          <Route path="/app/build-log" element={<Shell><MyWork /></Shell>} />
          <Route path="/app/challenges" element={<Shell><Opportunities /></Shell>} />
          <Route path="/app/messages" element={<Shell><Pings /></Shell>} />
          {/* Public profile */}
          <Route path="/:username/:slug" element={<WorkDetail />} />
          <Route path="/:username" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
