import { Link, useLocation } from "wouter";
import { BellIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import SyncStatusPanel from "@/components/ui-design-system/components/SyncStatusPanel";

export default function Navbar() {
  const [location] = useLocation();
  
  // Format the current path into breadcrumbs
  const formatBreadcrumb = () => {
    const path = location === "/" ? "/dashboard" : location;
    const segments = path.split('/').filter(Boolean);
    
    return segments.map((segment, index) => {
      const displayName = segment.charAt(0).toUpperCase() + segment.slice(1);
      return {
        name: displayName,
        path: '/' + segments.slice(0, index + 1).join('/'),
        current: index === segments.length - 1
      };
    });
  };
  
  const breadcrumbs = formatBreadcrumb();

  return (
    <header className="bg-white border-b border-gray-200 z-10">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Logo and Breadcrumbs */}
        <div className="flex items-center">
          <div className="flex-shrink-0 flex items-center">
            <svg className="h-8 w-8 text-[#1a5dff]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
            <span className="ml-2 font-semibold text-xl text-gray-900">TerraFusion</span>
          </div>
          
          {/* Breadcrumbs */}
          <nav className="hidden sm:ml-6 sm:flex">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <Link href="/" className="text-gray-500 hover:text-gray-700">
                  Dashboard
                </Link>
              </li>
              
              {breadcrumbs.length > 0 && breadcrumbs[0].name !== "Dashboard" && (
                <>
                  <li><span className="text-gray-400">/</span></li>
                  {breadcrumbs.map((crumb, idx) => (
                    <li key={idx}>
                      {idx < breadcrumbs.length - 1 ? (
                        <>
                          <Link href={crumb.path} className="text-gray-500 hover:text-gray-700">
                            {crumb.name}
                          </Link>
                          <span className="text-gray-400 ml-2">/</span>
                        </>
                      ) : (
                        <span className="text-gray-900 font-medium">{crumb.name}</span>
                      )}
                    </li>
                  ))}
                </>
              )}
            </ol>
          </nav>
        </div>
        
        {/* User Menu and Notifications */}
        <div className="flex items-center space-x-4">
          {/* Sync Status Panel */}
          <SyncStatusPanel />
          
          <div className="relative">
            <Button variant="ghost" size="icon" className="relative p-1 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none">
              <BellIcon className="h-5 w-5" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-destructive"></span>
            </Button>
          </div>
          <div className="relative">
            <Avatar>
              <AvatarFallback className="bg-primary text-white">TF</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}
