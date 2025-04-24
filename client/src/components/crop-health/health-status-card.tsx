import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Leaf, 
  AlertCircle, 
  CalendarDays, 
  Timer,
  DropletIcon,
  FlaskConicalIcon
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

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
 * Card displaying overall crop health status and alerts
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
  // Helper to get health rating details
  const getHealthDetails = () => {
    if (healthScore >= 80) {
      return {
        label: "Good",
        color: "bg-green-100 text-green-800"
      };
    } else if (healthScore >= 60) {
      return {
        label: "Fair",
        color: "bg-yellow-100 text-yellow-800"
      };
    } else {
      return {
        label: "Poor",
        color: "bg-red-100 text-red-800"
      };
    }
  };
  
  // Helper to format dates
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  // Get health status details
  const healthDetails = getHealthDetails();
  
  // Helper to get progress color based on health score
  const getHealthScoreColor = () => {
    if (healthScore >= 80) return "bg-green-500";
    if (healthScore >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  // Helper to get alert icon based on type
  const getAlertIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'water':
        return <DropletIcon className="h-4 w-4 text-blue-500" />;
      case 'nutrient':
        return <FlaskConicalIcon className="h-4 w-4 text-green-500" />;
      case 'pest':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-1 pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">{parcelName}</CardTitle>
          <Badge 
            variant="outline" 
            className={healthDetails.color}
          >
            {healthDetails.label.toUpperCase()}
          </Badge>
        </div>
        <CardDescription className="flex justify-between items-center">
          <span>{cropType.charAt(0).toUpperCase() + cropType.slice(1)}</span>
          <span className="text-xs">ID: {parcelId}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium">Health Score</p>
            <p className="text-sm font-bold">{healthScore}/100</p>
          </div>
          <Progress 
            value={healthScore} 
            className={`h-2 ${getHealthScoreColor()}`}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-md p-3 space-y-1">
            <div className="flex items-center gap-2">
              <Leaf className="h-4 w-4 text-green-500" />
              <p className="text-sm font-medium">Growth Stage</p>
            </div>
            <p className="text-xl font-semibold">{growthStage}</p>
          </div>
          
          <div className="border rounded-md p-3 space-y-1">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-blue-500" />
              <p className="text-sm font-medium">Days to Harvest</p>
            </div>
            <p className="text-xl font-semibold">{daysToHarvest}</p>
          </div>
        </div>
        
        <div className="border rounded-md p-3 space-y-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-purple-500" />
            <p className="text-sm font-medium">Estimated Harvest Date</p>
          </div>
          <p className="text-lg font-semibold">{formatDate(estimatedHarvestDate)}</p>
        </div>
        
        {alerts.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Alerts ({alerts.length})</p>
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <div key={index} className="border rounded-md p-3 flex gap-3">
                  {getAlertIcon(alert.type)}
                  <div>
                    <p className="text-sm font-medium capitalize">{alert.type}</p>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <p className="text-xs text-muted-foreground pt-2">
          Last updated: {formatDate(lastUpdated)} {new Date(lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </p>
      </CardContent>
    </Card>
  );
}