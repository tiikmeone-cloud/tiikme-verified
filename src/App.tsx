import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, PublicOnlyRoute } from "@/components/RouteGuard";
import PageLoader from "@/components/PageLoader";
import AppShell from "./components/layout/AppShell.tsx";

// Eager load landing + auth (critical path)
import Index from "./pages/Index.tsx";
import SignIn from "./pages/SignIn.tsx";
import NotFound from "./pages/NotFound.tsx";

// New onboarding pages (eager — critical path)
import SignupPage from "./pages/SignupPage.tsx";
import VerifyEmailPage from "./pages/VerifyEmailPage.tsx";
import OnboardingRole from "./pages/OnboardingRole.tsx";

// Lazy load everything else
const OnboardingDetails = lazy(() => import("./pages/OnboardingDetails.tsx"));
const OnboardingWelcome = lazy(() => import("./pages/OnboardingWelcome.tsx"));
const Welcome = lazy(() => import("./pages/Welcome.tsx"));
const Feed = lazy(() => import("./pages/Feed.tsx"));
const Profile = lazy(() => import("./pages/Profile.tsx"));
const Explore = lazy(() => import("./pages/Explore.tsx"));
const MyWork = lazy(() => import("./pages/MyWork.tsx"));
const ProjectHub = lazy(() => import("./pages/ProjectHub.tsx"));
const Opportunities = lazy(() => import("./pages/Opportunities.tsx"));
const Strands = lazy(() => import("./pages/Strands.tsx"));
const Pings = lazy(() => import("./pages/Pings.tsx"));
const Alerts = lazy(() => import("./pages/Alerts.tsx"));
const SettingsPage = lazy(() => import("./pages/Settings.tsx"));
const Institution = lazy(() => import("./pages/Institution.tsx"));
const WorkDetail = lazy(() => import("./pages/WorkDetail.tsx"));
const Workspace = lazy(() => import("./pages/Workspace.tsx"));
const CreatePage = lazy(() => import("./pages/CreatePage.tsx"));
const PageProfile = lazy(() => import("./pages/PageProfile.tsx"));
const VerifyInvite = lazy(() => import("./pages/VerifyInvite.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const JoinAsInstitution = lazy(() => import("./pages/JoinAsInstitution.tsx"));
const CreateOrganization = lazy(() => import("./pages/CreateOrganization.tsx"));
const OrganizationPage = lazy(() => import("./pages/OrganizationPage.tsx"));
const OrgAdmin = lazy(() => import("./pages/OrgAdmin.tsx"));
const PostCreate = lazy(() => import("./pages/PostCreate.tsx"));

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
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/signin" element={<PublicOnlyRoute><SignIn /></PublicOnlyRoute>} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/onboarding/role" element={<OnboardingRole />} />
            <Route path="/onboarding/details" element={<OnboardingDetails />} />
            <Route path="/onboarding/welcome" element={<OnboardingWelcome />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/verify-invite" element={<VerifyInvite />} />
            <Route path="/join-as-institution" element={<JoinAsInstitution />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/create-organization" element={<ProtectedRoute><CreateOrganization /></ProtectedRoute>} />
            <Route path="/org/:slug" element={<OrganizationPage />} />
            <Route path="/org/:slug/admin" element={<ProtectedRoute><OrgAdmin /></ProtectedRoute>} />
            <Route path="/create-page" element={<Shell><CreatePage /></Shell>} />
            <Route path="/post/create" element={<Shell><PostCreate /></Shell>} />
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
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
