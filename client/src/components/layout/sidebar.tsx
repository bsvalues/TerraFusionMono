import { Link, useLocation } from "wouter";
import { 
  HomeIcon, 
  ServerIcon, 
  TerminalIcon, 
  CodeIcon, 
  AppWindow,
  PuzzleIcon,
  BarChartIcon,
  ListTodoIcon,
  DatabaseIcon,
  ShoppingCartIcon,
  CreditCardIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const [location] = useLocation();
  
  // Define app entries
  const apps = [
    { name: "terrafusion-core", icon: ServerIcon, path: "/apps/terrafusion-core" },
    { name: "worker-node", icon: TerminalIcon, path: "/apps/worker-node" },
    { name: "worker-python", icon: CodeIcon, path: "/apps/worker-python" },
    { name: "web-shell", icon: AppWindow, path: "/apps/web-shell" }
  ];
  
  // Define plugin entries
  const plugins = [
    { name: "levy", description: "Tax assessment calculation", path: "/plugins/levy" },
    { name: "gis", description: "Geospatial information system", path: "/plugins/gis" },
    { name: "valuation", description: "Property valuation engine", path: "/plugins/valuation" },
    { name: "appeals", description: "Appeals processing workflow", path: "/plugins/appeals" },
    { name: "public-portal", description: "Public access portal", path: "/plugins/public-portal" }
  ];
  
  // Define tools entries
  const tools = [
    { name: "Metrics", icon: BarChartIcon, path: "/tools/metrics" },
    { name: "Job Queue", icon: ListTodoIcon, path: "/tools/queue" },
    { name: "Database", icon: DatabaseIcon, path: "/tools/database" }
  ];

  return (
    <aside className="hidden md:flex md:flex-shrink-0 border-r border-gray-200">
      <div className="flex flex-col w-64">
        <div className="flex flex-col flex-1 overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {/* Dashboard */}
            <Link href="/">
              <a className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                location === "/" 
                  ? "bg-primary text-white" 
                  : "text-gray-700 hover:bg-gray-100"
              )}>
                <HomeIcon className="mr-3 h-5 w-5" />
                Dashboard
              </a>
            </Link>
            
            {/* Marketplace */}
            <Link href="/marketplace">
              <a className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                location === "/marketplace" 
                  ? "bg-primary text-white" 
                  : "text-gray-700 hover:bg-gray-100"
              )}>
                <ShoppingCartIcon className="mr-3 h-5 w-5" />
                Marketplace
              </a>
            </Link>

            {/* Apps */}
            <div>
              <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Apps
              </h3>
              <div className="space-y-1">
                {apps.map((app) => (
                  <Link key={app.name} href={app.path}>
                    <a className={cn(
                      "group flex items-center px-3 py-2 text-sm font-medium rounded-md",
                      location === app.path 
                        ? "bg-primary text-white" 
                        : "text-gray-700 hover:bg-gray-100"
                    )}>
                      <app.icon className={cn(
                        "mr-3 h-5 w-5",
                        location === app.path ? "text-white" : "text-gray-500"
                      )} />
                      {app.name}
                    </a>
                  </Link>
                ))}
              </div>
            </div>

            {/* Plugins */}
            <div>
              <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Plugins
              </h3>
              <div className="space-y-1">
                {plugins.map((plugin) => (
                  <Link key={plugin.name} href={plugin.path}>
                    <a className={cn(
                      "group flex items-center px-3 py-2 text-sm font-medium rounded-md",
                      location === plugin.path 
                        ? "bg-primary text-white" 
                        : "text-gray-700 hover:bg-gray-100"
                    )}>
                      <PuzzleIcon className={cn(
                        "mr-3 h-5 w-5",
                        location === plugin.path ? "text-white" : "text-gray-500"
                      )} />
                      {plugin.name}
                    </a>
                  </Link>
                ))}
              </div>
            </div>

            {/* Tools */}
            <div>
              <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Tools
              </h3>
              <div className="space-y-1">
                {tools.map((tool) => (
                  <Link key={tool.name} href={tool.path}>
                    <a className={cn(
                      "group flex items-center px-3 py-2 text-sm font-medium rounded-md",
                      location === tool.path 
                        ? "bg-primary text-white" 
                        : "text-gray-700 hover:bg-gray-100"
                    )}>
                      <tool.icon className={cn(
                        "mr-3 h-5 w-5",
                        location === tool.path ? "text-white" : "text-gray-500"
                      )} />
                      {tool.name}
                    </a>
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </div>
      </div>
    </aside>
  );
}
