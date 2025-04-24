import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangleIcon,
  ShieldAlertIcon,
  DropletIcon,
  CalendarIcon,
  MapPinIcon,
  PercentIcon,
  SprayCanIcon
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DiseaseImage {
  url: string;
  timestamp: string;
  location: string;
}

interface DetectedDisease {
  name: string;
  scientificName: string;
  severity: string;
  spreadPercentage: number;
  affectedAreas: string[];
  symptoms: string[];
  treatmentRecommendations: string[];
  images: DiseaseImage[];
}

interface RiskAssessment {
  spreadRisk: string;
  economicImpact: string;
  controlDifficulty: string;
}

interface DiseaseDetectionCardProps {
  parcelId: string;
  scanDate: string;
  cropType: string;
  detectedDiseases: DetectedDisease[];
  riskAssessment: RiskAssessment;
}

/**
 * Card displaying detected crop diseases and risk assessments
 */
export function DiseaseDetectionCard({
  parcelId,
  scanDate,
  cropType,
  detectedDiseases,
  riskAssessment
}: DiseaseDetectionCardProps) {
  // Helper for risk level styling
  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return "text-green-600";
      case 'moderate': return "text-yellow-600";
      case 'medium': return "text-yellow-600";
      case 'high': return "text-red-600";
      case 'severe': return "text-red-700";
      case 'critical': return "text-red-800";
      default: return "text-blue-600";
    }
  };

  // Helper for severity badge styling
  const getSeverityBadgeClass = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'low': return "bg-green-100 text-green-800";
      case 'moderate': return "bg-yellow-100 text-yellow-800";
      case 'medium': return "bg-yellow-100 text-yellow-800"; 
      case 'high': return "bg-red-100 text-red-800";
      case 'severe': return "bg-red-200 text-red-900";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-1 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Disease Detection</CardTitle>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            <span>{scanDate}</span>
          </div>
        </div>
        <CardDescription>
          {cropType.charAt(0).toUpperCase() + cropType.slice(1)} crop health analysis
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {detectedDiseases.length > 0 ? (
          <div className="space-y-3">
            {detectedDiseases.map((disease, index) => (
              <div key={index} className="rounded-md border p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-sm">{disease.name}</h4>
                    <p className="text-xs text-muted-foreground italic">{disease.scientificName}</p>
                  </div>
                  <Badge variant="outline" className={getSeverityBadgeClass(disease.severity)}>
                    {disease.severity.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <PercentIcon className="h-3 w-3 text-blue-500" />
                    <span>Spread: <strong>{disease.spreadPercentage}%</strong></span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <MapPinIcon className="h-3 w-3 text-blue-500" />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="text-left">
                          {disease.affectedAreas.length > 1 
                            ? `${disease.affectedAreas.length} areas affected` 
                            : disease.affectedAreas[0]}
                        </TooltipTrigger>
                        {disease.affectedAreas.length > 1 && (
                          <TooltipContent>
                            <ul className="list-disc pl-4">
                              {disease.affectedAreas.map((area, i) => (
                                <li key={i}>{area}</li>
                              ))}
                            </ul>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                
                {disease.symptoms.length > 0 && (
                  <div className="text-xs">
                    <p className="font-medium mb-1">Symptoms:</p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {disease.symptoms.map((symptom, i) => (
                        <li key={i}>{symptom}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {disease.treatmentRecommendations.length > 0 && (
                  <div className="text-xs pt-1">
                    <p className="font-medium mb-1 flex items-center gap-1">
                      <SprayCanIcon className="h-3 w-3 text-green-600" />
                      Treatment Plan:
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {disease.treatmentRecommendations.map((treatment, i) => (
                        <li key={i}>{treatment}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {disease.images.length > 0 && (
                  <div className="flex gap-2 pt-1 overflow-x-auto pb-1">
                    {disease.images.map((image, i) => (
                      <div key={i} className="relative flex-shrink-0">
                        <img 
                          src={image.url} 
                          alt={`${disease.name} evidence`} 
                          className="h-16 w-20 object-cover rounded-sm border" 
                        />
                        <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[8px] px-1 rounded-tl-sm">
                          {image.location}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <ShieldAlertIcon className="h-10 w-10 text-green-500 mb-2" />
            <h3 className="font-medium">No Diseases Detected</h3>
            <p className="text-sm text-muted-foreground max-w-[250px] mt-1">
              Your crop appears to be healthy with no signs of disease at this time.
            </p>
          </div>
        )}
        
        <Separator />
        
        <div>
          <h4 className="text-sm font-medium mb-2">Risk Assessment</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center border rounded-md p-2">
              <span className="text-xs text-muted-foreground">Spread Risk</span>
              <span className={`text-sm font-semibold ${getRiskColor(riskAssessment.spreadRisk)}`}>
                {riskAssessment.spreadRisk}
              </span>
            </div>
            
            <div className="flex flex-col items-center border rounded-md p-2">
              <span className="text-xs text-muted-foreground">Economic Impact</span>
              <span className={`text-sm font-semibold ${getRiskColor(riskAssessment.economicImpact)}`}>
                {riskAssessment.economicImpact}
              </span>
            </div>
            
            <div className="flex flex-col items-center border rounded-md p-2">
              <span className="text-xs text-muted-foreground">Control</span>
              <span className={`text-sm font-semibold ${getRiskColor(riskAssessment.controlDifficulty)}`}>
                {riskAssessment.controlDifficulty}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}