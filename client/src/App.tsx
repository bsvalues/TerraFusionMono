import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Marketplace from "@/pages/marketplace";
import PluginMarketplace from "@/pages/plugin-marketplace";
import BillingPage from "@/pages/billing";
import OnboardingPage from "@/pages/onboarding";
import Checkout from "@/pages/checkout";
import Subscribe from "@/pages/subscribe";
import AppDetails from "@/pages/app-details";
import PluginDetails from "@/pages/plugin-details";
import MainLayout from "@/components/layout/main-layout";
import ToolsPage from "@/pages/tools";
import MetricsPage from "@/pages/metrics";
import JobQueuePage from "@/pages/jobs";
import ParcelsPage from "@/pages/parcels";
import GeocodePage from "@/pages/geocode";
import CropHealthDashboard from "@/pages/crop-health-dashboard";
import CropIdentifierPage from "@/pages/crop-identifier-page";

function Router() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/marketplace" component={Marketplace} />
        <Route path="/plugins" component={PluginMarketplace} />
        <Route path="/billing" component={BillingPage} />
        <Route path="/onboarding" component={OnboardingPage} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/subscribe" component={Subscribe} />
        
        {/* System management routes */}
        <Route path="/tools" component={ToolsPage} />
        <Route path="/metrics" component={MetricsPage} />
        <Route path="/jobs" component={JobQueuePage} />
        
        {/* Field management routes */}
        <Route path="/parcels" component={ParcelsPage} />
        <Route path="/geocode" component={GeocodePage} />
        <Route path="/crop-health" component={CropHealthDashboard} />
        <Route path="/crop-identifier" component={CropIdentifierPage} />
        
        {/* Dynamic routes for apps and plugins */}
        <Route path="/apps/:name" component={AppDetails} />
        <Route path="/plugins/:name" component={PluginDetails} />
        
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
