import { Link } from "wouter";
import { 
  Server as ServerIcon, 
  Terminal as TerminalIcon, 
  Code as CodeIcon, 
  AppWindow as AppWindowIcon,
  Puzzle as PuzzleIcon,
  BarChart as BarChartIcon,
  BookOpen as BookOpenIcon,
  RefreshCw as RefreshCwIcon,
  Database as DatabaseIcon,
  Users as UsersIcon,
  GitMerge as GitMergeIcon,
  ShoppingCart as ShoppingCartIcon
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type Application = {
  id: number;
  name: string;
  displayName: string;
  description: string;
  status: string;
  version: string;
  icon: string;
  path: string;
};

interface ApplicationsGridProps {
  applications?: Application[];
  isLoading: boolean;
}

export default function ApplicationsGrid({ applications, isLoading }: ApplicationsGridProps) {
  // Map icon strings to Lucide components
  const getIcon = (iconName?: string) => {
    const icons: Record<string, React.ElementType> = {
      "server": ServerIcon,
      "terminal": TerminalIcon,
      "code": CodeIcon,
      "workflow": RefreshCwIcon,
      "database": DatabaseIcon,
      "book": BookOpenIcon, 
      "bar-chart": BarChartIcon,
      "refresh-cw": RefreshCwIcon,
      "git-merge": GitMergeIcon,
      "shopping-cart": ShoppingCartIcon,
      "users": UsersIcon
    };
    
    const IconComponent = iconName && icons[iconName] ? icons[iconName] : AppWindowIcon;
    return <IconComponent className="h-6 w-6" />;
  };
  
  // Render loading skeletons when data is loading
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="h-64">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-2/3 mb-2" />
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6 mb-2" />
              <Skeleton className="h-4 w-4/6" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-9 w-full rounded-md" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }
  
  // If no applications are found
  if (!applications || applications.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-gray-50">
        <AppWindowIcon className="h-10 w-10 mx-auto text-gray-400 mb-2" />
        <h3 className="text-lg font-medium">No Applications Found</h3>
        <p className="text-gray-600 mt-1">No TerraFusion applications are currently available.</p>
      </div>
    );
  }

  // Render the applications grid
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {applications.map((app) => (
        <Card key={app.id} className="h-64 transition-shadow hover:shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                {getIcon(app.icon)}
              </div>
              <div>
                <CardTitle className="text-lg">{app.displayName}</CardTitle>
                <div className="flex space-x-2 mt-1">
                  <Badge variant={app.status === 'active' ? 'default' : 'outline'}>
                    {app.status}
                  </Badge>
                  <span className="text-xs text-gray-500 mt-0.5">v{app.version}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-gray-600 line-clamp-3">
              {app.description}
            </CardDescription>
          </CardContent>
          <CardFooter className="pt-0">
            <Link href={app.path}>
              <Button variant="outline" className="w-full">
                Open Application
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}