import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, PublicOnlyRoute } from "@/components/RouteGuard";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
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
const OnboardingDetails = lazyWithRetry(() => import("./pages/OnboardingDetails.tsx"), "OnboardingDetails");
const OnboardingWelcome = lazyWithRetry(() => import("./pages/OnboardingWelcome.tsx"), "OnboardingWelcome");
const Welcome = lazyWithRetry(() => import("./pages/Welcome.tsx"), "Welcome");
const Feed = lazyWithRetry(() => import("./pages/Feed.tsx"), "Feed");
const Profile = lazyWithRetry(() => import("./pages/Profile.tsx"), "Profile");
const Explore = lazyWithRetry(() => import("./pages/Explore.tsx"), "Explore");
const MyWork = lazyWithRetry(() => import("./pages/MyWork.tsx"), "MyWork");
const ProjectHub = lazyWithRetry(() => import("./pages/ProjectHub.tsx"), "ProjectHub");
const Opportunities = lazyWithRetry(() => import("./pages/Opportunities.tsx"), "Opportunities");
const Strands = lazyWithRetry(() => import("./pages/Strands.tsx"), "Strands");
const Pings = lazyWithRetry(() => import("./pages/Pings.tsx"), "Pings");
const Alerts = lazyWithRetry(() => import("./pages/Alerts.tsx"), "Alerts");
const SettingsPage = lazyWithRetry(() => import("./pages/Settings.tsx"), "SettingsPage");
const Institution = lazyWithRetry(() => import("./pages/Institution.tsx"), "Institution");
const WorkDetail = lazyWithRetry(() => import("./pages/WorkDetail.tsx"), "WorkDetail");
const Workspace = lazyWithRetry(() => import("./pages/Workspace.tsx"), "Workspace");
const CreatePage = lazyWithRetry(() => import("./pages/CreatePage.tsx"), "CreatePage");
const PageProfile = lazyWithRetry(() => import("./pages/PageProfile.tsx"), "PageProfile");
const VerifyInvite = lazyWithRetry(() => import("./pages/VerifyInvite.tsx"), "VerifyInvite");
const Privacy = lazyWithRetry(() => import("./pages/Privacy.tsx"), "Privacy");
const Terms = lazyWithRetry(() => import("./pages/Terms.tsx"), "Terms");
const Grievance = lazyWithRetry(() => import("./pages/Grievance.tsx"), "Grievance");
const JoinAsInstitution = lazyWithRetry(() => import("./pages/JoinAsInstitution.tsx"), "JoinAsInstitution");
const CreateOrganization = lazyWithRetry(() => import("./pages/CreateOrganization.tsx"), "CreateOrganization");
const OrganizationPage = lazyWithRetry(() => import("./pages/OrganizationPage.tsx"), "OrganizationPage");
const OrgAdmin = lazyWithRetry(() => import("./pages/OrgAdmin.tsx"), "OrgAdmin");
const PostCreate = lazyWithRetry(() => import("./pages/PostCreate.tsx"), "PostCreate");
const CertificatePage = lazyWithRetry(() => import("./pages/CertificatePage.tsx"), "CertificatePage");
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword.tsx"), "ResetPassword");
const PostDetail = lazyWithRetry(() => import("./pages/PostDetail.tsx"), "PostDetail");
const JoinRedirect = lazyWithRetry(() => import("./pages/JoinRedirect.tsx"), "JoinRedirect");

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
            <Route path="/grievance" element={<Grievance />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/create-organization" element={<ProtectedRoute><CreateOrganization /></ProtectedRoute>} />
            <Route path="/org/:slug" element={<OrganizationPage />} />
            <Route path="/org/:slug/admin" element={<ProtectedRoute><OrgAdmin /></ProtectedRoute>} />
            <Route path="/certificate/:id" element={<CertificatePage />} />
            <Route path="/create-page" element={<Shell><CreatePage /></Shell>} />
            <Route path="/post/create" element={<Shell><PostCreate /></Shell>} />
            <Route path="/post/:postId" element={<Shell><PostDetail /></Shell>} />
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
