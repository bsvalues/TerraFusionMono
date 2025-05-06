// Ultra-minimal main.tsx for maximum performance
import { createRoot } from "react-dom/client";
import App from "./App";

// Set document title
document.title = "TerraFusion Platform";

// Find root element
const rootElement = document.getElementById("root");

// Render app if root element exists
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
