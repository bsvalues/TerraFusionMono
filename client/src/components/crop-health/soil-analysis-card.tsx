import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RiskLevel } from "@shared/schema";
import { DropletIcon, InfoIcon, Leaf, Waves } from "lucide-react";

interface SoilAnalysisCardProps {
  parcelId: string;
  parcelName: string;
  soilType: string;
  ph: number;
  organicMatter: number;
  nutrients: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  };
  waterRetention: string;
  deficiencies: Array<{
    nutrient: string;
    severity: RiskLevel;
    recommendations: string[];
  }>;
  suitabilityScore: number;
  lastUpdated: string;
  onClick?: () => void;
}

/**
 * A card showing soil analysis data for a specific parcel
 */
export function SoilAnalysisCard({
  parcelId,
  parcelName,
  soilType,
  ph,
  organicMatter,
  nutrients,
  waterRetention,
  deficiencies,
  suitabilityScore,
  lastUpdated,
  onClick
}: SoilAnalysisCardProps) {
  // Get color for pH value
  const getPhColor = (ph: number) => {
    if (ph < 5.5) return "text-red-500";
    if (ph < 6.0) return "text-orange-500";
    if (ph <= 7.5) return "text-green-500";
    if (ph < 8.0) return "text-orange-500";
    return "text-red-500";
  };

  // Get color for nutrient level
  const getNutrientColor = (value: number, nutrient: string) => {
    // Different optimal ranges for different nutrients
    const ranges: Record<string, [number, number]> = {
      nitrogen: [30, 60],
      phosphorus: [20, 40],
      potassium: [150, 250],
    };

    const [min, max] = ranges[nutrient.toLowerCase()] || [0, 100];

    if (value < min * 0.5) return "text-red-500";
    if (value < min) return "text-orange-500";
    if (value <= max) return "text-green-500";
    if (value < max * 1.5) return "text-orange-500";
    return "text-red-500";
  };

  // Get severity badge color
  const getSeverityColor = (severity: RiskLevel) => {
    switch (severity) {
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "severe":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Format nutrient value with unit
  const formatNutrient = (value: number) => {
    return `${value} ppm`;
  };

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Soil Analysis</CardTitle>
            <CardDescription>{parcelName}</CardDescription>
          </div>
          <Badge variant="outline">
            {soilType.charAt(0).toUpperCase() + soilType.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-4">
          {/* pH Level */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Soil pH</span>
              <span className={`text-sm font-medium ${getPhColor(ph)}`}>{ph}</span>
            </div>
            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="absolute inset-0 flex">
                <div className="h-full bg-red-400" style={{ width: '14%' }}></div>
                <div className="h-full bg-orange-400" style={{ width: '8%' }}></div>
                <div className="h-full bg-green-400" style={{ width: '26%' }}></div>
                <div className="h-full bg-orange-400" style={{ width: '8%' }}></div>
                <div className="h-full bg-red-400" style={{ width: '44%' }}></div>
              </div>
              <div 
                className="absolute top-0 h-full w-1 bg-black" 
                style={{ left: `${(ph / 14) * 100}%`, transform: 'translateX(-50%)' }}
              ></div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>Acidic</span>
              <span>Neutral</span>
              <span>Alkaline</span>
            </div>
          </div>

          {/* Organic Matter */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Organic Matter</span>
              <span className="text-sm font-medium">{organicMatter}%</span>
            </div>
            <Progress value={Math.min(organicMatter / 10 * 100, 100)} className="h-2" />
          </div>

          {/* Nutrients */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Leaf className="h-4 w-4 mr-1 text-green-500" />
                <span className="text-sm">Nitrogen</span>
              </div>
              <span className={`text-sm font-medium ${getNutrientColor(nutrients.nitrogen, 'nitrogen')}`}>
                {formatNutrient(nutrients.nitrogen)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Leaf className="h-4 w-4 mr-1 text-blue-500" />
                <span className="text-sm">Phosphorus</span>
              </div>
              <span className={`text-sm font-medium ${getNutrientColor(nutrients.phosphorus, 'phosphorus')}`}>
                {formatNutrient(nutrients.phosphorus)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Leaf className="h-4 w-4 mr-1 text-purple-500" />
                <span className="text-sm">Potassium</span>
              </div>
              <span className={`text-sm font-medium ${getNutrientColor(nutrients.potassium, 'potassium')}`}>
                {formatNutrient(nutrients.potassium)}
              </span>
            </div>
          </div>

          {/* Water Retention */}
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <DropletIcon className="h-4 w-4 mr-1 text-blue-500" />
              <span className="text-sm">Water Retention</span>
            </div>
            <span className="text-sm font-medium capitalize">{waterRetention}</span>
          </div>

          {/* Deficiencies */}
          {deficiencies.length > 0 && (
            <div className="mt-2 space-y-2">
              <h4 className="text-sm font-semibold">Nutrient Deficiencies</h4>
              <div className="flex flex-wrap gap-1">
                {deficiencies.map((deficiency, index) => (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="outline"
                          className={`${getSeverityColor(deficiency.severity)}`}
                        >
                          {deficiency.nutrient}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-semibold">Recommendations:</p>
                        <ul className="list-disc pl-4 text-xs">
                          {deficiency.recommendations.map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}

          {/* Suitability Score */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Crop Suitability</span>
              <span className="text-sm font-medium">{suitabilityScore}/100</span>
            </div>
            <Progress value={suitabilityScore} className="h-2" />
          </div>
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