import { Switch, Route } from "wouter";
import Home from "./pages/Home";
import FormPage from "./pages/FormPage";
import CompsPage from "./pages/CompsPage";
import PhotosPage from "./pages/PhotosPage";
import SketchesPage from "./pages/SketchesPage";
import ReportsPage from "./pages/ReportsPage";
import CompliancePage from "./pages/CompliancePage";
import AIValuationPage from "./pages/AIValuationPage";
import EmailOrderPage from "./pages/EmailOrderPage";
import PropertyDataPage from "./pages/PropertyDataPage";
import UADFormPage from "./pages/UADFormPage";
import { ComparablePropertiesPage } from "./pages/ComparablePropertiesPage";
import ImportPage from "./pages/ImportPage";
import NotFound from "./pages/not-found";
import { useState } from "react";
import { TooltipProvider } from "./contexts/TooltipContext";
import TermsPage from "./pages/TermsPage";
import CRDTTestPage from "./pages/CRDTTestPage";
import PhotoEnhancementPage from "./pages/PhotoEnhancementPage";
import PhotoSyncTestPage from "./pages/PhotoSyncTestPage";
import NotificationTestPage from "./pages/NotificationTestPage";

// Temporary basic app structure that doesn't use AppraisalContext
// This will help us get the app running, then we'll gradually add more functionality
function App() {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <header className="bg-primary text-primary-foreground p-4 shadow-md">
        <div className="flex items-center justify-between container">
          <div className="flex items-center space-x-2">
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3" />
            </svg>
            <h1 className="text-xl font-bold">AppraisalCore</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span>John Appraiser</span>
            <span className="text-sm bg-green-500 text-white px-2 py-1 rounded-full">Synced</span>
          </div>
        </div>
      </header>
      <div className="flex flex-1 container">
        <nav className="w-64 border-r p-4 space-y-4 hidden md:block">
          <ul className="space-y-2">
            <li><a href="/" className="block p-2 rounded hover:bg-accent" onClick={() => console.log("Dashboard clicked")}>Dashboard</a></li>
            <li><a href="/form" className="block p-2 rounded hover:bg-accent" onClick={() => console.log("Form clicked")}>Form</a></li>
            <li><a href="/uad-form" className="block p-2 rounded hover:bg-accent bg-green-50 text-green-700 font-medium" onClick={() => console.log("UAD Form clicked")}>UAD Form</a></li>
            <li><a href="/comps" className="block p-2 rounded hover:bg-accent" onClick={() => console.log("Comps clicked")}>Comparables</a></li>
            <li><a href="/comparables/1" className="block p-2 rounded hover:bg-accent bg-blue-50 text-blue-700 font-medium" onClick={() => console.log("Comparable Properties clicked")}>Comparable Properties</a></li>
            <li><a href="/photos" className="block p-2 rounded hover:bg-accent" onClick={() => console.log("Photos clicked")}>Photos</a></li>
            <li><a href="/sketches" className="block p-2 rounded hover:bg-accent" onClick={() => console.log("Sketches clicked")}>Sketches</a></li>
            <li><a href="/reports" className="block p-2 rounded hover:bg-accent" onClick={() => console.log("Reports clicked")}>Reports</a></li>
            <li><a href="/compliance" className="block p-2 rounded hover:bg-accent" onClick={() => console.log("Compliance clicked")}>Compliance</a></li>
            <li><a href="/ai-valuation" className="block p-2 rounded hover:bg-accent" onClick={() => console.log("AI Valuation clicked")}>AI Valuation</a></li>
            <li><a href="/email-order" className="block p-2 rounded hover:bg-accent" onClick={() => console.log("Import Order clicked")}>Import Order</a></li>
            <li><a href="/property-data" className="block p-2 rounded hover:bg-accent" onClick={() => console.log("Property Data clicked")}>Property Data</a></li>
            <li><a href="/import" className="block p-2 rounded hover:bg-accent" onClick={() => console.log("Import clicked")}>Import Data</a></li>
            <li><a href="/terms" className="block p-2 rounded hover:bg-accent bg-green-50 text-green-700 font-medium" onClick={() => console.log("Terms clicked")}>Real Estate Terms</a></li>
            <li><a href="/crdt-test" className="block p-2 rounded hover:bg-accent bg-purple-50 text-purple-700 font-medium" onClick={() => console.log("CRDT Test clicked")}>TerraField CRDT Test</a></li>
            <li><a href="/photo-enhancement" className="block p-2 rounded hover:bg-accent bg-blue-50 text-blue-700 font-medium" onClick={() => console.log("Photo Enhancement clicked")}>TerraField Photo Enhancement</a></li>
            <li><a href="/photo-sync-test" className="block p-2 rounded hover:bg-accent bg-orange-50 text-orange-700 font-medium" onClick={() => console.log("Photo Sync Test clicked")}>TerraField Photo Sync</a></li>
            <li><a href="/notification-test" className="block p-2 rounded hover:bg-accent bg-red-50 text-red-700 font-medium" onClick={() => console.log("Notification Test clicked")}>TerraField Notifications</a></li>
          </ul>
        </nav>
        <main className="flex-1 p-4">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/form" component={FormPage} />
            <Route path="/comps" component={CompsPage} />
            <Route path="/photos" component={PhotosPage} />
            <Route path="/sketches" component={SketchesPage} />
            <Route path="/reports" component={ReportsPage} />
            <Route path="/compliance" component={CompliancePage} />
            <Route path="/ai-valuation" component={AIValuationPage} />
            <Route path="/email-order" component={EmailOrderPage} />
            <Route path="/property-data" component={PropertyDataPage} />
            <Route path="/property/:id" component={PropertyDataPage} />
            <Route path="/uad-form" component={UADFormPage} />
            <Route path="/uad-form/:id" component={UADFormPage} />
            <Route path="/comparables/:reportId" component={ComparablePropertiesPage} />
            <Route path="/terms" component={TermsPage} />
            <Route path="/import" component={ImportPage} />
            <Route path="/crdt-test" component={CRDTTestPage} />
            <Route path="/photo-enhancement" component={PhotoEnhancementPage} />
            <Route path="/photo-sync-test" component={PhotoSyncTestPage} />
            <Route path="/notification-test" component={NotificationTestPage} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
      <footer className="bg-muted p-4 text-center text-sm">
        &copy; 2025 AppraisalCore - Real Estate Appraisal Platform
      </footer>
    </div>
    </TooltipProvider>
  );
}

export default App;
