import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import SignIn from "./pages/SignIn.tsx";
import SignUp from "./pages/SignUp.tsx";
import Feed from "./pages/Feed.tsx";
import Profile from "./pages/Profile.tsx";
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
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/app/feed" element={<AppLayout><Feed /></AppLayout>} />
          <Route path="/app/profile" element={<AppLayout><Profile /></AppLayout>} />
          <Route path="/app/nexus" element={<AppLayout><div className="p-8 text-center text-muted-foreground">Nexus — Coming soon</div></AppLayout>} />
          <Route path="/app/build-log" element={<AppLayout><div className="p-8 text-center text-muted-foreground">Build Log — Coming soon</div></AppLayout>} />
          <Route path="/app/challenges" element={<AppLayout><div className="p-8 text-center text-muted-foreground">Challenges — Coming soon</div></AppLayout>} />
          <Route path="/app/strands" element={<AppLayout><div className="p-8 text-center text-muted-foreground">My Strands — Coming soon</div></AppLayout>} />
          <Route path="/app/alerts" element={<AppLayout><div className="p-8 text-center text-muted-foreground">Alerts — Coming soon</div></AppLayout>} />
          <Route path="/app/settings" element={<AppLayout><div className="p-8 text-center text-muted-foreground">Settings — Coming soon</div></AppLayout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
