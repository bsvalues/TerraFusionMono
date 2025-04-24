import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CropHealthStatus } from "@shared/schema";
import { InfoIcon, AlertTriangle, CheckCircle, Activity, CalendarDays } from "lucide-react";

interface HealthStatusCardProps {
  parcelId: string;
  parcelName: string;
  cropType: string;
  overallHealth: CropHealthStatus;
  healthScore: number;
  lastUpdated: string;
  growthStage: string;
  daysToHarvest: number;
  estimatedHarvestDate: string;
  recommendations?: string[];
  alerts?: { type: string; message: string }[];
  onClick?: () => void;
}

/**
 * A card showing the overall health status of a crop in a parcel
 */
export function HealthStatusCard({
  parcelId,
  parcelName,
  cropType,
  overallHealth,
  healthScore,
  lastUpdated,
  growthStage,
  daysToHarvest,
  estimatedHarvestDate,
  recommendations,
  alerts,
  onClick
}: HealthStatusCardProps) {
  // Determine status color based on health status
  const getStatusColor = (status: CropHealthStatus) => {
    switch (status) {
      case "excellent":
        return "bg-green-500";
      case "good":
        return "bg-green-400";
      case "fair":
        return "bg-yellow-400";
      case "poor":
        return "bg-orange-500";
      case "critical":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  // Determine text color based on health status
  const getTextColor = (status: CropHealthStatus) => {
    switch (status) {
      case "excellent":
      case "good":
        return "text-green-600";
      case "fair":
        return "text-yellow-600";
      case "poor":
        return "text-orange-600";
      case "critical":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  // Determine status label with capitalized first letter
  const getStatusLabel = (status: CropHealthStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer" 
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{parcelName}</CardTitle>
            <CardDescription>
              {cropType.charAt(0).toUpperCase() + cropType.slice(1)}
            </CardDescription>
          </div>
          <Badge 
            className={`${getStatusColor(overallHealth)} text-white`}
            variant="outline"
          >
            {getStatusLabel(overallHealth)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="h-5 w-5 text-muted-foreground mr-1" />
              <span className="text-sm text-muted-foreground mr-1">Health Score:</span>
            </div>
            <div className="font-medium">
              <span className={getTextColor(overallHealth)}>{healthScore}/100</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground mr-1">Growth Stage:</span>
            </div>
            <div className="font-medium">
              {growthStage}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CalendarDays className="h-5 w-5 text-muted-foreground mr-1" />
              <span className="text-sm text-muted-foreground mr-1">Harvest In:</span>
            </div>
            <div className="font-medium">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="cursor-help underline decoration-dotted">
                    {daysToHarvest} days
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Estimated harvest date: {estimatedHarvestDate}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {alerts && alerts.length > 0 && (
            <div className="mt-2 border-t pt-2">
              {alerts.map((alert, i) => (
                <div key={i} className="flex items-start mt-1">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mr-1 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-orange-700">{alert.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2 text-xs text-muted-foreground">
        <div className="flex items-center">
          <InfoIcon className="h-3 w-3 mr-1" />
          Last updated: {lastUpdated}
        </div>
      </CardFooter>
    </Card>
  );
}