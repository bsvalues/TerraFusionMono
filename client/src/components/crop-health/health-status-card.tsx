import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { SproutIcon, AlertTriangleIcon, DropletIcon, CalendarIcon } from "lucide-react";

interface Alert {
  type: string;
  message: string;
}

interface HealthStatusCardProps {
  parcelId: string;
  parcelName: string;
  cropType: string;
  overallHealth: string;
  healthScore: number;
  lastUpdated: string;
  growthStage: string;
  daysToHarvest: number;
  estimatedHarvestDate: string;
  alerts: Alert[];
}

/**
 * Card displaying overall crop health status and key metrics
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
  alerts
}: HealthStatusCardProps) {
  // Determine health status color
  const healthColor = 
    healthScore >= 80 ? "bg-green-100 text-green-800" :
    healthScore >= 60 ? "bg-yellow-100 text-yellow-800" :
    "bg-red-100 text-red-800";

  // Capitalize crop type for display
  const displayCropType = cropType.charAt(0).toUpperCase() + cropType.slice(1);
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-1 pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Health Status</CardTitle>
          <Badge 
            variant="outline" 
            className={healthColor}
          >
            {overallHealth.toUpperCase()}
          </Badge>
        </div>
        <CardDescription>
          {displayCropType} • {parcelName}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-6 space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <p className="text-sm font-medium">Health Score</p>
            <p className="text-sm font-bold">{healthScore}%</p>
          </div>
          <Progress 
            value={healthScore} 
            className={`h-2 ${healthScore >= 80 ? 'bg-green-200' : healthScore >= 60 ? 'bg-yellow-200' : 'bg-red-200'}`}
          />
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-2">Key Indicators</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <SproutIcon className="h-4 w-4 text-green-600" />
              <span className="text-sm">{growthStage}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-blue-600" />
              <span className="text-sm">{daysToHarvest} days to harvest</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Est. harvest: {estimatedHarvestDate}</p>
        </div>

        {alerts.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2">Alerts</p>
              <div className="space-y-2">
                {alerts.map((alert, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 rounded-md bg-amber-50">
                    <AlertTriangleIcon className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-amber-800">
                        {alert.type.toUpperCase()}
                      </p>
                      <p className="text-xs">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <p className="text-xs text-muted-foreground pt-2">
          Last updated: {lastUpdated}
        </p>
      </CardContent>
    </Card>
  );
}