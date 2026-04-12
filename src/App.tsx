import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrgIdentityProvider } from "@/contexts/OrgIdentityContext";
import { ProtectedRoute, PublicOnlyRoute } from "@/components/RouteGuard";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import PageLoader from "@/components/PageLoader";
import { LayoutErrorBoundary, PageErrorBoundary } from "@/components/ErrorBoundaries";
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

// Org sub-pages
const OrgSettingsPage = lazyWithRetry(() => import("./components/org/OrgSettingsPage.tsx"), "OrgSettingsPage");
const OrgVerifyPage = lazyWithRetry(() => import("./components/org/OrgVerifyPage.tsx"), "OrgVerifyPage");

const queryClient = new QueryClient();

const Shell = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute><LayoutErrorBoundary><AppShell><PageErrorBoundary>{children}</PageErrorBoundary></AppShell></LayoutErrorBoundary></ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
    <OrgIdentityProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner position="bottom-right" />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<PageErrorBoundary><Index /></PageErrorBoundary>} />
            <Route path="/signin" element={<PublicOnlyRoute><PageErrorBoundary><SignIn /></PageErrorBoundary></PublicOnlyRoute>} />
            <Route path="/signup" element={<PageErrorBoundary><SignupPage /></PageErrorBoundary>} />
            <Route path="/verify-email" element={<PageErrorBoundary><VerifyEmailPage /></PageErrorBoundary>} />
            <Route path="/onboarding/role" element={<PageErrorBoundary><OnboardingRole /></PageErrorBoundary>} />
            <Route path="/onboarding/details" element={<PageErrorBoundary><OnboardingDetails /></PageErrorBoundary>} />
            <Route path="/onboarding/welcome" element={<PageErrorBoundary><OnboardingWelcome /></PageErrorBoundary>} />
            <Route path="/welcome" element={<PageErrorBoundary><Welcome /></PageErrorBoundary>} />
            <Route path="/verify-invite" element={<PageErrorBoundary><VerifyInvite /></PageErrorBoundary>} />
            <Route path="/join" element={<PageErrorBoundary><JoinRedirect /></PageErrorBoundary>} />
            <Route path="/join-as-institution" element={<PageErrorBoundary><JoinAsInstitution /></PageErrorBoundary>} />
            <Route path="/privacy" element={<PageErrorBoundary><Privacy /></PageErrorBoundary>} />
            <Route path="/terms" element={<PageErrorBoundary><Terms /></PageErrorBoundary>} />
            <Route path="/grievance" element={<PageErrorBoundary><Grievance /></PageErrorBoundary>} />
            <Route path="/reset-password" element={<PageErrorBoundary><ResetPassword /></PageErrorBoundary>} />
            <Route path="/create-organization" element={<ProtectedRoute><PageErrorBoundary><CreateOrganization /></PageErrorBoundary></ProtectedRoute>} />

            {/* Organisation pages — public */}
            <Route path="/org/:slug" element={<PageErrorBoundary><OrganizationPage /></PageErrorBoundary>} />
            <Route path="/org/:slug/:tab" element={<PageErrorBoundary><OrganizationPage /></PageErrorBoundary>} />

            {/* Organisation admin pages — protected */}
            <Route path="/org/:slug/admin" element={<ProtectedRoute><PageErrorBoundary><OrgAdmin /></PageErrorBoundary></ProtectedRoute>} />
            <Route path="/org/:slug/settings" element={<ProtectedRoute><PageErrorBoundary><OrgSettingsPage /></PageErrorBoundary></ProtectedRoute>} />
            <Route path="/org/:slug/verify" element={<ProtectedRoute><PageErrorBoundary><OrgVerifyPage /></PageErrorBoundary></ProtectedRoute>} />

            <Route path="/certificate/:id" element={<PageErrorBoundary><CertificatePage /></PageErrorBoundary>} />
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
            <Route path="/:username/:slug" element={<PageErrorBoundary><WorkDetail /></PageErrorBoundary>} />
            <Route path="/:username" element={<PageErrorBoundary><Profile /></PageErrorBoundary>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
    </OrgIdentityProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
