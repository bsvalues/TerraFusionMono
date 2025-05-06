import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import MainLayout from "@/components/layout/main-layout";

// Import only the Dashboard and Loading component eagerly - everything else is lazy loaded
import Dashboard from "@/pages/dashboard";
import LoadingScreen from "@/components/ui/loading-screen";

// Lazy load all other pages to improve initial load time
const NotFound = lazy(() => import("@/pages/not-found"));
const Marketplace = lazy(() => import("@/pages/marketplace"));
const PluginMarketplace = lazy(() => import("@/pages/plugin-marketplace"));
const BillingPage = lazy(() => import("@/pages/billing"));
const OnboardingPage = lazy(() => import("@/pages/onboarding"));
const Checkout = lazy(() => import("@/pages/checkout"));
const Subscribe = lazy(() => import("@/pages/subscribe"));
const AppDetails = lazy(() => import("@/pages/app-details"));
const PluginDetails = lazy(() => import("@/pages/plugin-details"));
const ToolsPage = lazy(() => import("@/pages/tools"));
const MetricsPage = lazy(() => import("@/pages/metrics"));
const JobQueuePage = lazy(() => import("@/pages/jobs"));
const ParcelsPage = lazy(() => import("@/pages/parcels"));
const GeocodePage = lazy(() => import("@/pages/geocode"));
const CropHealthDashboard = lazy(() => import("@/pages/crop-health-dashboard"));
const CropIdentifierPage = lazy(() => import("@/pages/crop-identifier-page"));
const CropAnalysisPage = lazy(() => import("@/pages/CropAnalysisPage"));
const AdvancedCropAnalysisPage = lazy(() => import("@/pages/AdvancedCropAnalysisPage"));
const YieldPredictionPage = lazy(() => import("@/pages/YieldPredictionPage"));
const CollaborationDemo = lazy(() => import("@/pages/CollaborationDemo"));
const FieldDataPage = lazy(() => import("@/pages/FieldDataPage"));
const ImportPage = lazy(() => import("@/pages/import"));
const ValuationPage = lazy(() => import("@/pages/valuation"));
const GISExplorerPage = lazy(() => import("@/pages/GISExplorerPage"));

function Router() {
  return (
    <MainLayout>
      <Suspense fallback={<LoadingScreen />}>
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
          <Route path="/gis-explorer" component={GISExplorerPage} />
          <Route path="/crop-health" component={CropHealthDashboard} />
          <Route path="/crop-identifier" component={CropIdentifierPage} />
          <Route path="/crop-analysis" component={CropAnalysisPage} />
          <Route path="/advanced-crop-analysis" component={AdvancedCropAnalysisPage} />
          <Route path="/yield-prediction" component={YieldPredictionPage} />
          <Route path="/collaboration" component={CollaborationDemo} />
          <Route path="/field-data" component={FieldDataPage} />
          <Route path="/import" component={ImportPage} />
          <Route path="/valuation" component={ValuationPage} />
          
          {/* Dynamic routes for apps and plugins */}
          <Route path="/apps/:name" component={AppDetails} />
          <Route path="/plugins/:name" component={PluginDetails} />
          
          {/* Fallback to 404 */}
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={0}>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
