import { createRoot } from "react-dom/client";
import React from "react";
import "./index.css";
import App from "./App";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { ThemeProvider } from './components/ui/theme-provider';

// Create the root element first
const root = createRoot(document.getElementById("root")!);

console.log("main.tsx executing, rendering App component");

// Then render the actual app with all necessary providers
// Note: AppraisalProvider temporarily removed until we resolve the context issues
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
