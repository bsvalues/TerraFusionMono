import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import IdentificationForm, { CropIdentificationResult } from '@/components/crop-identifier/identification-form';
import IdentificationResult from '@/components/crop-identifier/identification-result';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScanLine, Camera, Leaf, History } from 'lucide-react';

export default function CropIdentifierPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CropIdentificationResult | null>(null);
  const [identificationHistory, setIdentificationHistory] = useState<CropIdentificationResult[]>([]);
  const [activeTab, setActiveTab] = useState('identify');

  // Handle crop identification
  const handleIdentify = (identificationResult: CropIdentificationResult) => {
    setResult(identificationResult);
    
    // Add to history
    setIdentificationHistory(prev => [identificationResult, ...prev].slice(0, 10)); // Keep last 10 items
    
    setLoading(false);
  };

  // Reset identification
  const handleBack = () => {
    setResult(null);
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <Helmet>
        <title>Crop Identification | TerraFusion</title>
      </Helmet>

      <div className="flex flex-col space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ScanLine className="h-8 w-8 text-primary" />
            Augmented Reality Crop Identification
          </h1>
          <p className="text-muted-foreground">
            Use AI-powered computer vision to identify crop species and their growth stage from images.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main functionality area */}
          <div className="lg:col-span-2 space-y-6">
            {!result ? (
              <IdentificationForm onIdentify={handleIdentify} loading={loading} />
            ) : (
              <IdentificationResult result={result} onBack={handleBack} />
            )}

            {/* How it works */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How it works</CardTitle>
                <CardDescription>
                  Our advanced computer vision system uses AI to analyze crop images
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Camera className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-medium">Capture</h3>
                    <p className="text-sm text-muted-foreground">
                      Take a clear photo of the crop or plant you want to identify
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <ScanLine className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-medium">Analyze</h3>
                    <p className="text-sm text-muted-foreground">
                      Our AI analyzes visual features like leaf shape, color patterns and growth structure
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Leaf className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-medium">Identify</h3>
                    <p className="text-sm text-muted-foreground">
                      Get detailed identification with growth stage and characteristics
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar area */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Recent Identifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {identificationHistory.length > 0 ? (
                  <div className="space-y-3">
                    {identificationHistory.map((item, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        className="w-full justify-start h-auto py-2 px-3"
                        onClick={() => setResult(item)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Leaf className="h-4 w-4 text-primary" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-sm">{item.cropName}</p>
                            <p className="text-xs text-muted-foreground">
                              {Math.round(item.confidence * 100)}% confidence
                            </p>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Leaf className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p>No identification history yet</p>
                    <p className="text-sm">Identified crops will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tips for Best Results</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 list-disc pl-5 text-sm">
                  <li>Take clear, well-lit photos in daylight</li>
                  <li>Include leaves, stems, and flowers/fruits if possible</li>
                  <li>Capture multiple parts of the plant if uncertain</li>
                  <li>Enable location access for regional context</li>
                  <li>Avoid blurry images or extreme close-ups</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}