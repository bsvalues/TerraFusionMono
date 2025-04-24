import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SoilIcon, DropletIcon, LeafIcon, MoveUpRightIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Deficiency {
  nutrient: string;
  severity: string;
}

interface SoilAnalysisCardProps {
  parcelId: string;
  soilType: string;
  ph: number;
  organicMatter: number;
  nitrogenLevel: number;
  phosphorusLevel: number;
  potassiumLevel: number;
  waterRetention: string;
  deficiencies: Deficiency[];
  suitabilityScore: number;
  timestamp: string;
  recommendations: string[];
}

/**
 * Card displaying soil analysis data for a crop parcel
 */
export function SoilAnalysisCard({
  parcelId,
  soilType,
  ph,
  organicMatter,
  nitrogenLevel,
  phosphorusLevel,
  potassiumLevel,
  waterRetention,
  deficiencies,
  suitabilityScore,
  timestamp,
  recommendations
}: SoilAnalysisCardProps) {
  // Helper function to determine colors for values
  const getNutrientColor = (value: number, type: 'N' | 'P' | 'K') => {
    const ranges = {
      N: { low: 30, medium: 60, high: 100 },
      P: { low: 20, medium: 40, high: 70 },
      K: { low: 150, medium: 200, high: 300 }
    };
    
    const range = ranges[type];
    
    if (value < range.low) return "text-red-600";
    if (value < range.medium) return "text-yellow-600";
    if (value < range.high) return "text-green-600";
    return "text-blue-600";
  };
  
  // Helper to format soil type display
  const formatSoilType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };
  
  // Helper to determine pH suitability
  const getPhColor = () => {
    if (ph < 5.5) return "text-red-600";
    if (ph < 6.0 || ph > 7.5) return "text-yellow-600";
    return "text-green-600";
  };
  
  // Helper for water retention badge color
  const getWaterRetentionColor = () => {
    switch (waterRetention.toLowerCase()) {
      case 'poor': return "bg-red-100 text-red-800";
      case 'fair': return "bg-yellow-100 text-yellow-800";
      case 'good': return "bg-green-100 text-green-800";
      case 'excellent': return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Determine score color
  const scoreColor = 
    suitabilityScore >= 80 ? "bg-green-200" :
    suitabilityScore >= 60 ? "bg-yellow-200" :
    "bg-red-200";
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-1 pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Soil Analysis</CardTitle>
          <Badge 
            variant="outline" 
            className={getWaterRetentionColor()}
          >
            {waterRetention.toUpperCase()} WATER RETENTION
          </Badge>
        </div>
        <CardDescription>
          {formatSoilType(soilType)} Soil
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-6 space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <p className="text-sm font-medium">Suitability Score</p>
            <p className="text-sm font-bold">{suitabilityScore}%</p>
          </div>
          <Progress 
            value={suitabilityScore} 
            className={`h-2 ${scoreColor}`}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">pH Level</p>
            <p className={`text-lg font-semibold ${getPhColor()}`}>{ph.toFixed(1)}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Organic Matter</p>
            <p className="text-lg font-semibold">{organicMatter.toFixed(1)}%</p>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <p className="text-sm font-medium mb-2">NPK Levels</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center p-2 rounded-md bg-gray-50">
              <span className="text-xs text-muted-foreground">Nitrogen</span>
              <span className={`text-lg font-semibold ${getNutrientColor(nitrogenLevel, 'N')}`}>
                {nitrogenLevel}
              </span>
              <span className="text-xs">ppm</span>
            </div>
            
            <div className="flex flex-col items-center p-2 rounded-md bg-gray-50">
              <span className="text-xs text-muted-foreground">Phosphorus</span>
              <span className={`text-lg font-semibold ${getNutrientColor(phosphorusLevel, 'P')}`}>
                {phosphorusLevel}
              </span>
              <span className="text-xs">ppm</span>
            </div>
            
            <div className="flex flex-col items-center p-2 rounded-md bg-gray-50">
              <span className="text-xs text-muted-foreground">Potassium</span>
              <span className={`text-lg font-semibold ${getNutrientColor(potassiumLevel, 'K')}`}>
                {potassiumLevel}
              </span>
              <span className="text-xs">ppm</span>
            </div>
          </div>
        </div>
        
        {deficiencies.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Deficiencies</p>
            <div className="space-y-1">
              {deficiencies.map((def, index) => (
                <div key={index} className="flex items-center gap-2">
                  <LeafIcon className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm">
                    <span className="font-medium">{def.nutrient}</span>
                    <span className="text-muted-foreground"> - {def.severity} deficiency</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {recommendations.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Recommendations</p>
            <div className="space-y-1">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2">
                  <MoveUpRightIcon className="h-4 w-4 text-green-600 mt-0.5" />
                  <p className="text-sm">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <p className="text-xs text-muted-foreground pt-2">
          Last updated: {timestamp}
        </p>
      </CardContent>
    </Card>
  );
}