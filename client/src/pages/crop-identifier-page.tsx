import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import IdentificationForm from "@/components/crop-identifier/identification-form";
import IdentificationResult from "@/components/crop-identifier/identification-result";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  FileImage, 
  History, 
  Loader2
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// CropIdentificationResult interface type definition
interface CropIdentificationResult {
  id: number;
  userId: number;
  parcelId?: string;
  cropName: string;
  scientificName?: string;
  confidence: number;
  estimatedGrowthStage?: string;
  details?: string;
  characteristics?: string[];
  possibleAlternatives?: string[];
  imageUrl?: string;
  thumbnailUrl?: string;
  timestamp: string;
  verified?: boolean;
  feedback?: string;
}

export default function CropIdentifierPage() {
  const [activeTab, setActiveTab] = useState<string>("identify");
  const [selectedIdentification, setSelectedIdentification] = useState<CropIdentificationResult | null>(null);
  
  // Query for parcels (optional - for selecting which parcel an image belongs to)
  const parcelsQuery = useQuery({
    queryKey: ["/api/parcels"],
    queryFn: async () => {
      const response = await fetch("/api/parcels");
      if (!response.ok) {
        throw new Error("Failed to fetch parcels");
      }
      return response.json();
    },
    enabled: true, // Only fetch parcels when needed
  });
  
  // Query for existing identifications
  const identificationsQuery = useQuery({
    queryKey: ["/api/crop-identifications"],
    queryFn: async () => {
      const response = await fetch("/api/crop-identifications");
      if (!response.ok) {
        throw new Error("Failed to fetch identification history");
      }
      return response.json();
    },
  });
  
  // Handle successful identification
  const handleIdentificationSuccess = (result: CropIdentificationResult) => {
    setSelectedIdentification(result);
    setActiveTab("result");
  };
  
  // Handle selecting an identification from history
  const handleSelectIdentification = (identification: CropIdentificationResult) => {
    setSelectedIdentification(identification);
    setActiveTab("result");
  };
  
  // Handle closing the result view
  const handleCloseResult = () => {
    setActiveTab("identify");
    setSelectedIdentification(null);
  };
  
  // Format relative time for history display
  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Crop Identifier</h2>
      </div>
      
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="identify" className="flex items-center gap-2">
              <FileImage className="h-4 w-4" />
              <span>Identify</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span>History</span>
            </TabsTrigger>
            {selectedIdentification && (
              <TabsTrigger value="result" className="flex items-center gap-2">
                <span>Result</span>
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="identify" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <IdentificationForm 
                    onSuccess={handleIdentificationSuccess}
                    parcels={parcelsQuery.data?.parcels || []}
                  />
                </CardContent>
              </Card>
              
              <div className="flex flex-col space-y-4">
                <div className="bg-muted p-6 rounded-lg text-center space-y-4">
                  <h3 className="text-xl font-medium">Crop Identifier</h3>
                  <p className="text-muted-foreground">
                    The TerraFusion Crop Identifier uses advanced AI to identify crop types from images. Simply upload an
                    image or take a photo of the crop in the field, and let our system analyze and identify it for you.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-background p-4 rounded">
                      <h4 className="font-medium">High Accuracy</h4>
                      <p className="text-sm text-muted-foreground">
                        Trained on millions of agricultural images for precise identification
                      </p>
                    </div>
                    <div className="bg-background p-4 rounded">
                      <h4 className="font-medium">Field Ready</h4>
                      <p className="text-sm text-muted-foreground">
                        Works with mobile device cameras for in-field identification
                      </p>
                    </div>
                    <div className="bg-background p-4 rounded">
                      <h4 className="font-medium">Detailed Analysis</h4>
                      <p className="text-sm text-muted-foreground">
                        Provides scientific details and growth stage estimations
                      </p>
                    </div>
                    <div className="bg-background p-4 rounded">
                      <h4 className="font-medium">Continuous Learning</h4>
                      <p className="text-sm text-muted-foreground">
                        Feedback system improves accuracy over time
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Identification History</h3>
                
                {identificationsQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : identificationsQuery.isError ? (
                  <div className="text-center py-8 text-destructive">
                    <p>Error loading identification history.</p>
                    <Button 
                      variant="outline"
                      onClick={() => identificationsQuery.refetch()}
                      className="mt-2"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : identificationsQuery.data?.identifications?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No identification history found.</p>
                    <Button 
                      onClick={() => setActiveTab("identify")}
                      className="mt-2"
                    >
                      Identify a Crop
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-4">
                      {identificationsQuery.data?.identifications?.map((identification: CropIdentificationResult) => (
                        <div 
                          key={identification.id}
                          className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                          onClick={() => handleSelectIdentification(identification)}
                        >
                          {identification.thumbnailUrl || identification.imageUrl ? (
                            <div className="h-16 w-16 rounded-md overflow-hidden bg-muted">
                              <img
                                src={identification.thumbnailUrl || identification.imageUrl}
                                alt={identification.cropName}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center">
                              <FileImage className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          
                          <div className="flex-1">
                            <h4 className="font-medium">{identification.cropName}</h4>
                            {identification.scientificName && (
                              <p className="text-sm text-muted-foreground italic">
                                {identification.scientificName}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {formatRelativeTime(identification.timestamp)}
                            </p>
                          </div>
                          
                          <div>
                            <div className="text-sm text-muted-foreground">
                              {Math.round(identification.confidence * 100)}% Confidence
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="result">
            {selectedIdentification && (
              <Card>
                <CardContent className="pt-6">
                  <IdentificationResult 
                    result={selectedIdentification}
                    onClose={handleCloseResult}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}