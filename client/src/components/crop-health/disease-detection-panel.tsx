import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PestRiskType, RiskLevel } from "@shared/schema";
import { AlertTriangle, Bug, Camera, Clock, FileText, UploadCloud, Virus } from "lucide-react";

interface DiseaseDetection {
  id: string;
  name: string;
  type: PestRiskType;
  confidence: number;
  severity: RiskLevel;
  affectedArea: number;
  symptoms: string[];
  progression: 'early' | 'developing' | 'advanced';
  recommendations: string[];
  detectedAt: string;
  images?: string[];
}

interface DiseaseDetectionPanelProps {
  parcelId: string;
  parcelName: string;
  cropType: string;
  detectedDiseases: DiseaseDetection[];
  onUploadImage?: (file: File) => void;
  onAnalyzeImage?: (imageUrl: string) => void;
}

/**
 * A panel showing disease detection information for a crop
 */
export function DiseaseDetectionPanel({
  parcelId,
  parcelName,
  cropType,
  detectedDiseases,
  onUploadImage,
  onAnalyzeImage
}: DiseaseDetectionPanelProps) {
  const [activeTab, setActiveTab] = useState(detectedDiseases.length > 0 ? "detected" : "analyze");
  const [selectedDisease, setSelectedDisease] = useState<DiseaseDetection | null>(
    detectedDiseases.length > 0 ? detectedDiseases[0] : null
  );
  const [fileUpload, setFileUpload] = useState<File | null>(null);

  // Get severity color
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

  // Get disease type icon
  const getDiseaseIcon = (type: PestRiskType) => {
    switch (type) {
      case "insect":
        return <Bug className="h-4 w-4" />;
      case "fungal":
      case "bacterial":
      case "viral":
        return <Virus className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileUpload(e.target.files[0]);
    }
  };

  // Handle file upload
  const handleUpload = () => {
    if (fileUpload && onUploadImage) {
      onUploadImage(fileUpload);
      setFileUpload(null);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Disease Detection</CardTitle>
        <CardDescription>
          {parcelName} ({cropType})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="detected">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Detected Issues
              </div>
            </TabsTrigger>
            <TabsTrigger value="analyze">
              <div className="flex items-center">
                <Camera className="h-4 w-4 mr-2" />
                Analyze New
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="detected" className="space-y-4">
            {detectedDiseases.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">No diseases detected yet</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {/* Disease List */}
                <div className="md:col-span-2 border rounded-lg p-2 space-y-2 max-h-[400px] overflow-y-auto">
                  {detectedDiseases.map((disease) => (
                    <div
                      key={disease.id}
                      className={`p-2 rounded-md cursor-pointer ${
                        selectedDisease?.id === disease.id
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedDisease(disease)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium text-sm flex items-center">
                          {getDiseaseIcon(disease.type)}
                          <span className="ml-1">{disease.name}</span>
                        </div>
                        <Badge className={getSeverityColor(disease.severity)}>
                          {disease.severity}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {disease.progression}
                        </span>
                        <span className="text-xs font-medium">
                          {Math.round(disease.confidence * 100)}% confidence
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Disease Details */}
                <div className="md:col-span-5">
                  {selectedDisease && (
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{selectedDisease.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {selectedDisease.type} pathogen • {selectedDisease.progression} stage
                          </p>
                        </div>
                        <Badge className={getSeverityColor(selectedDisease.severity)}>
                          {selectedDisease.severity} risk
                        </Badge>
                      </div>

                      <div className="space-y-4">
                        {/* Confidence & Affected Area */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">Confidence</span>
                              <span className="text-sm font-medium">
                                {Math.round(selectedDisease.confidence * 100)}%
                              </span>
                            </div>
                            <Progress value={selectedDisease.confidence * 100} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">Affected Area</span>
                              <span className="text-sm font-medium">
                                {selectedDisease.affectedArea}%
                              </span>
                            </div>
                            <Progress value={selectedDisease.affectedArea} className="h-2" />
                          </div>
                        </div>

                        {/* Symptoms */}
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Symptoms</h4>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {selectedDisease.symptoms.map((symptom, index) => (
                              <li key={index}>{symptom}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Recommendations */}
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Recommendations</h4>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {selectedDisease.recommendations.map((rec, index) => (
                              <li key={index}>{rec}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Images if available */}
                        {selectedDisease.images && selectedDisease.images.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Images</h4>
                            <div className="grid grid-cols-3 gap-2">
                              {selectedDisease.images.map((img, index) => (
                                <img
                                  key={index}
                                  src={img}
                                  alt={`${selectedDisease.name} evidence ${index + 1}`}
                                  className="w-full h-20 object-cover rounded-md border"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analyze">
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Early detection is crucial</AlertTitle>
                <AlertDescription>
                  Upload images of plant symptoms for AI-powered disease detection. The earlier a disease is detected, the easier it is to treat.
                </AlertDescription>
              </Alert>

              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <div className="flex flex-col items-center space-y-3">
                  <UploadCloud className="h-10 w-10 text-muted-foreground" />
                  <div className="text-muted-foreground">
                    <span className="font-medium">Click to upload</span> or drag and drop plant images
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    id="disease-image-upload"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <label
                    htmlFor="disease-image-upload"
                    className="cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors"
                  >
                    Select Image
                  </label>
                </div>
              </div>

              {fileUpload && (
                <div className="mt-4">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 text-sm truncate">{fileUpload.name}</div>
                    <Button size="sm" onClick={handleUpload}>
                      Upload & Analyze
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Powered by AI disease detection technology
      </CardFooter>
    </Card>
  );
}