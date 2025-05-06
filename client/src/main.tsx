// Optimized main.tsx with performance improvements
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set up app title
document.title = "TerraFusion Platform";

// Optimized setup - runs after initial render to avoid blocking
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
  
  // Load icons asynchronously after initial render
  import("lucide-react").catch(e => console.warn("Failed to preload icons:", e));
};

// Run setup in the next frame to not block initial render
setTimeout(setupDocument, 0);

// Only use StrictMode in development to avoid double rendering in production
const AppWithMode = process.env.NODE_ENV === 'development' 
  ? <StrictMode><App /></StrictMode> 
  : <App />;

// Create root and render
const rootElement = document.getElementById("root");
if (rootElement) {
  // Clear any existing content
  rootElement.innerHTML = '';
  
  // Create and render the app
  createRoot(rootElement).render(AppWithMode);
} else {
  console.error("Root element not found");
}
