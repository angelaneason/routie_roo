import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import RouteDetail from "./pages/RouteDetail";
import MissedStops from "./pages/MissedStops";
import SharedRouteExecution from "./pages/SharedRouteExecution";
import Calendar from "./pages/Calendar";
import ArchivedRoutes from "./pages/ArchivedRoutes";
import ChangedAddresses from "./pages/ChangedAddresses";
import ReminderHistory from "./pages/ReminderHistory";
import RescheduleHistory from "./pages/RescheduleHistory";
import AdminUsers from "./pages/AdminUsers";
import SmartRoutingDashboard from "./pages/SmartRoutingDashboard";
import { useAuth } from "./_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { ImpersonationBanner } from "./components/ImpersonationBanner";

function Router() {
  const { user, loading } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // If not authenticated, show landing page
  if (!user) {
    return (
      <Switch>
        <Route path="/share/:token" component={SharedRouteExecution} />
        <Route path="/" component={LandingPage} />
        <Route component={LandingPage} />
      </Switch>
    );
  }

  // Authenticated routes
  return (
    <>
      <ImpersonationBanner />
      <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/workspace"} component={Home} />
      <Route path={"/plan-route"} component={Home} />
      <Route path={"/contacts"} component={Home} />
      <Route path="/settings" component={Settings} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/route/:id" component={RouteDetail} />
      <Route path="/share/:token" component={SharedRouteExecution} />
      <Route path="/missed-stops" component={MissedStops} />
      <Route path="/archived-routes" component={ArchivedRoutes} />
      <Route path={"/changed-addresses"} component={ChangedAddresses} />
      <Route path={"/reminder-history"} component={ReminderHistory} />
      <Route path={"/reschedule-history"} component={RescheduleHistory} />
      <Route path={"/admin/users"} component={AdminUsers} />
      <Route path={"/smart-routing"} component={SmartRoutingDashboard} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
    </>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
