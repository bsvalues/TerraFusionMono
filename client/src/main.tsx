import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set up app title
document.title = "TerraFusion Platform";

// Add favicon if needed (move to function to reduce initial load time)
const setupDocument = () => {
  // Add favicon
  const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
  link.setAttribute('rel', 'icon');
  link.setAttribute('href', 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%231a5dff"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>');
  document.head.appendChild(link);

  // Add meta info
  const meta = document.createElement('meta');
  meta.name = 'description';
  meta.content = 'TerraFusion - Integrated Property Tax Administration Platform';
  document.head.appendChild(meta);
  
  // Add performance optimization for dev tools
  if (process.env.NODE_ENV === 'development') {
    // Reduce console log noise in development
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Filter out non-critical React errors about missing props
      if (
        typeof args[0] === 'string' && 
        (args[0].includes('Warning: ') || 
         args[0].includes('Invalid prop'))
      ) {
        return;
      }
      originalConsoleError(...args);
    };
  }
};

// Run setup in the next frame to not block initial render
setTimeout(setupDocument, 0);

// Don't preload icons in initial load - load them on demand
// Removed: import("lucide-react");

// Use StrictMode in development only to reduce double-renders in production
const AppWithMode = process.env.NODE_ENV === 'development' 
  ? <StrictMode><App /></StrictMode> 
  : <App />;

// Create root and render
const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(AppWithMode);
} else {
  console.error("Root element not found");
}
