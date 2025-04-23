import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Preload SVG icons to ensure they're available
import("lucide-react");

// Set up app title
document.title = "TerraFusion Platform";

// Add favicon if needed
const setFavicon = () => {
  const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
  link.setAttribute('rel', 'icon');
  link.setAttribute('href', 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%231a5dff"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>');
  document.head.appendChild(link);
};

// Add meta info
const setMeta = () => {
  const meta = document.createElement('meta');
  meta.name = 'description';
  meta.content = 'TerraFusion - Integrated Property Tax Administration Platform';
  document.head.appendChild(meta);
};

// Set page title and description
setFavicon();
setMeta();

createRoot(document.getElementById("root")!).render(<App />);
