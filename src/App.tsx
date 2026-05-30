import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { useIdleLogout } from "@/lib/idleLogout";
import { ProtectedRoute, PublicOnlyRoute } from "@/components/RouteGuard";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import PageLoader from "@/components/PageLoader";
import { LayoutErrorBoundary, PageErrorBoundary } from "@/components/ErrorBoundaries";
import AppShell from "./components/layout/AppShell.tsx";

// Eager load landing + auth (critical path)
import Index from "./pages/Index.tsx";
import SignIn from "./pages/SignIn.tsx";
import NotFound from "./pages/NotFound.tsx";
import Opportunities from "./pages/Opportunities.tsx";
import Profile from "./pages/Profile.tsx";
import OrganizationPage from "./pages/OrganizationPage.tsx";

// New onboarding pages (eager — critical path)
import SignupPage from "./pages/SignupPage.tsx";
import VerifyEmailPage from "./pages/VerifyEmailPage.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import AuthCallback from "./pages/AuthCallback.tsx";

// Lazy load everything else
const Welcome = lazyWithRetry(() => import("./pages/Welcome.tsx"), "Welcome");
const Feed = lazyWithRetry(() => import("./pages/Feed.tsx"), "Feed");
const ProfilePosts = lazyWithRetry(() => import("./pages/ProfilePosts.tsx"), "ProfilePosts");
const Explore = lazyWithRetry(() => import("./pages/Explore.tsx"), "Explore");
const MyWork = lazyWithRetry(() => import("./pages/MyWork.tsx"), "MyWork");
const ProjectHub = lazyWithRetry(() => import("./pages/ProjectHub.tsx"), "ProjectHub");
const Strands = lazyWithRetry(() => import("./pages/Strands.tsx"), "Strands");
const ConnectionsPage = lazyWithRetry(() => import("./pages/Connections.tsx"), "ConnectionsPage");
const Alerts = lazyWithRetry(() => import("./pages/Alerts.tsx"), "Alerts");
const SettingsPage = lazyWithRetry(() => import("./pages/Settings.tsx"), "SettingsPage");
const WorkDetail = lazyWithRetry(() => import("./pages/WorkDetail.tsx"), "WorkDetail");
const CreatePage = lazyWithRetry(() => import("./pages/CreatePage.tsx"), "CreatePage");
const PageProfile = lazyWithRetry(() => import("./pages/PageProfile.tsx"), "PageProfile");
const VerifyInvite = lazyWithRetry(() => import("./pages/VerifyInvite.tsx"), "VerifyInvite");
const Privacy = lazyWithRetry(() => import("./pages/Privacy.tsx"), "Privacy");
const Terms = lazyWithRetry(() => import("./pages/Terms.tsx"), "Terms");
const HelpCentre = lazyWithRetry(() => import("./pages/HelpCentre.tsx"), "HelpCentre");

const PostCreate = lazyWithRetry(() => import("./pages/PostCreate.tsx"), "PostCreate");
const CertificatePage = lazyWithRetry(() => import("./pages/CertificatePage.tsx"), "CertificatePage");
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword.tsx"), "ResetPassword");
const PostDetail = lazyWithRetry(() => import("./pages/PostDetail.tsx"), "PostDetail");
const JoinAsInstitution = lazyWithRetry(() => import("./pages/JoinAsInstitution.tsx"), "JoinAsInstitution");
const OrganizationCreate = lazyWithRetry(() => import("./pages/OrganizationCreate.tsx"), "OrganizationCreate");
const ApplicationsDashboard = lazyWithRetry(() => import("./pages/ApplicationsDashboard.tsx"), "ApplicationsDashboard");
const OpportunityCreate = lazyWithRetry(() => import("./pages/OpportunityCreate.tsx"), "OpportunityCreate");
const WorkspacePage = lazyWithRetry(() => import("./pages/Workspace.tsx"), "WorkspacePage");

const VerificationInbox = lazyWithRetry(() => import("./pages/VerificationInbox.tsx"), "VerificationInbox");
const Academy = lazyWithRetry(() => import("./pages/Academy.tsx"), "Academy");
const BuildLog = lazyWithRetry(() => import("./pages/BuildLog.tsx"), "BuildLog");
const AcceptAdminInvite = lazyWithRetry(() => import("./pages/AcceptAdminInvite.tsx"), "AcceptAdminInvite");
const OrgSignup = lazyWithRetry(() => import("./pages/OrgSignup.tsx"), "OrgSignup");
const HashtagFeed = lazyWithRetry(() => import("./pages/HashtagFeed.tsx"), "HashtagFeed");
const MyApplications = lazyWithRetry(() => import("./pages/MyApplications.tsx"), "MyApplications");
const CampaignApplicants = lazyWithRetry(() => import("./pages/CampaignApplicants.tsx"), "CampaignApplicants");
const TiikmePilot = lazyWithRetry(() => import("./pages/TiikmePilot.tsx"), "TiikmePilot");
const Flicks = lazyWithRetry(() => import("./pages/Flicks.tsx"), "Flicks");
const FlickCreate = lazyWithRetry(() => import("./pages/FlickCreate.tsx"), "FlickCreate");
const Stash = lazyWithRetry(() => import("./pages/Stash.tsx"), "Stash");

// SEO guides hub
const GuidesHub = lazyWithRetry(() => import("./pages/guides/GuidesHub.tsx"), "GuidesHub");
const GuideProfileSummaryResume = lazyWithRetry(() => import("./pages/guides/ProfileSummaryResume.tsx"), "GuideProfileSummaryResume");
const GuideResumeSummaryExamples = lazyWithRetry(() => import("./pages/guides/ResumeSummaryExamples.tsx"), "GuideResumeSummaryExamples");
const GuideProfileSummaryFreshers = lazyWithRetry(() => import("./pages/guides/ProfileSummaryFreshers.tsx"), "GuideProfileSummaryFreshers");
const GuideProfessionalHeadlineExamples = lazyWithRetry(() => import("./pages/guides/ProfessionalHeadlineExamples.tsx"), "GuideProfessionalHeadlineExamples");
const GuideProfessionalProfilePicture = lazyWithRetry(() => import("./pages/guides/ProfessionalProfilePicture.tsx"), "GuideProfessionalProfilePicture");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,        // 10 min — fresh window
      gcTime: 60 * 60 * 1000,            // 1 hr — keep in cache for fast back-nav
      refetchOnMount: true,              // default — refetch on mount only if stale
      refetchOnWindowFocus: false,       // user complaint: tab-switch should be instant
      refetchOnReconnect: true,          // refetch only if stale
      retry: 1,
    },
    mutations: { retry: 0 },
  },
});

const CachePerfOverlay = import.meta.env.DEV
  ? lazyWithRetry(() => import("@/components/dev/CachePerfOverlay"), "CachePerfOverlay")
  : null;

const Shell = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute><LayoutErrorBoundary><AppShell><PageErrorBoundary>{children}</PageErrorBoundary></AppShell></LayoutErrorBoundary></ProtectedRoute>
);

/** Inner component runs hooks that need AuthProvider in scope (e.g. idle logout). */
const AppRoutes = () => {
  useIdleLogout();
  return (
    <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<PageErrorBoundary><Index /></PageErrorBoundary>} />
            <Route path="/signin" element={<PublicOnlyRoute><PageErrorBoundary><SignIn /></PageErrorBoundary></PublicOnlyRoute>} />
            <Route path="/signup" element={<PageErrorBoundary><SignupPage /></PageErrorBoundary>} />
            <Route path="/verify-email" element={<PageErrorBoundary><VerifyEmailPage /></PageErrorBoundary>} />
            <Route path="/onboarding" element={<PageErrorBoundary><Onboarding /></PageErrorBoundary>} />
            <Route path="/onboarding/:step" element={<PageErrorBoundary><Onboarding /></PageErrorBoundary>} />
            <Route path="/auth/callback" element={<PageErrorBoundary><AuthCallback /></PageErrorBoundary>} />
            <Route path="/onboarding/role" element={<Navigate to="/onboarding" replace />} />
            <Route path="/onboarding/details" element={<Navigate to="/onboarding" replace />} />
            <Route path="/onboarding/welcome" element={<Navigate to="/onboarding" replace />} />
            <Route path="/welcome" element={<PageErrorBoundary><Welcome /></PageErrorBoundary>} />
            <Route path="/verify-invite" element={<PageErrorBoundary><VerifyInvite /></PageErrorBoundary>} />
            <Route path="/privacy" element={<PageErrorBoundary><Privacy /></PageErrorBoundary>} />
            <Route path="/terms" element={<PageErrorBoundary><Terms /></PageErrorBoundary>} />
            <Route path="/help" element={<PageErrorBoundary><HelpCentre /></PageErrorBoundary>} />

            {/* SEO Guides */}
            <Route path="/guides" element={<PageErrorBoundary><GuidesHub /></PageErrorBoundary>} />
            <Route path="/guides/profile-summary-for-resume" element={<PageErrorBoundary><GuideProfileSummaryResume /></PageErrorBoundary>} />
            <Route path="/guides/resume-summary-examples" element={<PageErrorBoundary><GuideResumeSummaryExamples /></PageErrorBoundary>} />
            <Route path="/guides/profile-summary-for-freshers" element={<PageErrorBoundary><GuideProfileSummaryFreshers /></PageErrorBoundary>} />
            <Route path="/guides/professional-headline-examples" element={<PageErrorBoundary><GuideProfessionalHeadlineExamples /></PageErrorBoundary>} />
            <Route path="/guides/professional-profile-picture" element={<PageErrorBoundary><GuideProfessionalProfilePicture /></PageErrorBoundary>} />
            
            <Route path="/reset-password" element={<PageErrorBoundary><ResetPassword /></PageErrorBoundary>} />
            <Route path="/join-as-institution" element={<PageErrorBoundary><JoinAsInstitution /></PageErrorBoundary>} />
            <Route path="/org-signup" element={<PageErrorBoundary><OrgSignup /></PageErrorBoundary>} />
            <Route path="/institution-signup" element={<PageErrorBoundary><OrgSignup /></PageErrorBoundary>} />
            <Route path="/accept-admin-invite" element={<PageErrorBoundary><AcceptAdminInvite /></PageErrorBoundary>} />

            <Route path="/certificate/:id" element={<PageErrorBoundary><CertificatePage /></PageErrorBoundary>} />
            <Route path="/create-page" element={<Shell><CreatePage /></Shell>} />
            <Route path="/post/create" element={<Shell><PostCreate /></Shell>} />
            <Route path="/flick/create" element={<Shell><FlickCreate /></Shell>} />
            <Route path="/post/:postId" element={<Shell><PostDetail /></Shell>} />

            {/* Public shorthand redirects */}
            <Route path="/home" element={<Navigate to="/app/feed" replace />} />
            <Route path="/feed" element={<Navigate to="/app/feed" replace />} />
            <Route path="/jobs" element={<Navigate to="/app/opportunities" replace />} />
            <Route path="/opportunities" element={<Navigate to="/app/opportunities" replace />} />
            <Route path="/circles" element={<Navigate to="/app/circles" replace />} />
            <Route path="/profile" element={<Navigate to="/app/profile" replace />} />

            {/* App (protected) */}
            <Route path="/app/home" element={<Shell><Feed /></Shell>} />
            <Route path="/app/feed" element={<Shell><Feed /></Shell>} />
            <Route path="/app/post/create" element={<Shell><PostCreate /></Shell>} />
            <Route path="/app/post/:postId" element={<Shell><PostDetail /></Shell>} />
            <Route path="/app/explore" element={<Shell><Explore /></Shell>} />
            <Route path="/app/profile" element={<Shell><Profile /></Shell>} />
            <Route path="/app/profile/:id" element={<Shell><Profile /></Shell>} />
            <Route path="/app/u/:username/posts" element={<Shell><ProfilePosts /></Shell>} />
            <Route path="/app/teams" element={<Shell><MyWork /></Shell>} />
            <Route path="/app/teams/:projectId" element={<Shell><ProjectHub /></Shell>} />
            <Route path="/app/opportunities" element={<Shell><Opportunities /></Shell>} />
            <Route path="/app/opportunities/create" element={<Shell><OpportunityCreate /></Shell>} />
            <Route path="/app/opportunities/applicants" element={<Shell><Opportunities /></Shell>} />
            <Route path="/app/opportunities/:id/edit" element={<Shell><OpportunityCreate /></Shell>} />
            <Route path="/app/opportunities/:id/applications" element={<Shell><ApplicationsDashboard /></Shell>} />
            <Route path="/app/opportunities/campaign/:campaignId/applicants" element={<Shell><CampaignApplicants /></Shell>} />
            <Route path="/app/applications" element={<Shell><MyApplications /></Shell>} />
            <Route path="/app/pilot" element={<Shell><TiikmePilot /></Shell>} />
            <Route path="/app/workspace" element={<Navigate to="/app/feed" replace />} />
            <Route path="/app/circles" element={<Navigate to="/app/feed" replace />} />
            <Route path="/app/circles/*" element={<Navigate to="/app/feed" replace />} />
            <Route path="/app/connections" element={<Shell><ConnectionsPage /></Shell>} />
            <Route path="/app/strands" element={<Shell><Strands /></Shell>} />
            <Route path="/app/alerts" element={<Shell><Alerts /></Shell>} />
            <Route path="/app/verification-inbox" element={<Shell><VerificationInbox /></Shell>} />
            <Route path="/app/settings" element={<Shell><SettingsPage /></Shell>} />
            <Route path="/app/organizations/create" element={<Shell><OrganizationCreate /></Shell>} />


            {/* Organization profiles */}
            <Route path="/org/:slug" element={<Shell><OrganizationPage /></Shell>} />

            {/* Pages (org profiles) */}
            <Route path="/p/:slug" element={<Shell><PageProfile /></Shell>} />

            {/* Hashtag discovery — public, SEO-friendly */}
            <Route path="/tag/:tag" element={<PageErrorBoundary><HashtagFeed /></PageErrorBoundary>} />

            {/* Feature routes */}
            <Route path="/app/academy" element={<Shell><Academy /></Shell>} />
            <Route path="/app/build-log" element={<Shell><BuildLog /></Shell>} />
            <Route path="/app/flicks" element={<PageErrorBoundary><Flicks /></PageErrorBoundary>} />
            <Route path="/app/stash" element={<Shell><Stash /></Shell>} />

            {/* Legacy redirects */}
            <Route path="/app/nexus" element={<Shell><Explore /></Shell>} />
            <Route path="/app/work" element={<Shell><MyWork /></Shell>} />
            <Route path="/app/my-work" element={<Shell><MyWork /></Shell>} />
            <Route path="/app/challenges" element={<Shell><Opportunities /></Shell>} />

            {/* Public profile */}
            <Route path="/:username/:slug" element={<PageErrorBoundary><WorkDetail /></PageErrorBoundary>} />
            <Route path="/:username" element={<PageErrorBoundary><Profile /></PageErrorBoundary>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-right" />
        {CachePerfOverlay && <Suspense fallback={null}><CachePerfOverlay /></Suspense>}
        <AppRoutes />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
