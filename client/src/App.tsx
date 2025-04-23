import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Marketplace from "@/pages/marketplace";
import BillingPage from "@/pages/billing";
import OnboardingPage from "@/pages/onboarding";
import Checkout from "@/pages/checkout";
import Subscribe from "@/pages/subscribe";
import MainLayout from "@/components/layout/main-layout";

function Router() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/marketplace" component={Marketplace} />
        <Route path="/billing" component={BillingPage} />
        <Route path="/onboarding" component={OnboardingPage} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/subscribe" component={Subscribe} />
        {/* Add more routes here as the application grows */}
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
