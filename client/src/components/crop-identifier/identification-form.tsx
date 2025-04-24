import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Camera, Upload, MapPin, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Define the result type
export interface CropIdentificationResult {
  cropName: string;
  scientificName: string;
  confidence: number;
  estimatedGrowthStage: string;
  details: string;
  characteristics: string[];
  possibleAlternatives: string[];
}

interface IdentificationFormProps {
  onIdentify: (result: CropIdentificationResult) => void;
  loading: boolean;
}

export default function IdentificationForm({ onIdentify, loading }: IdentificationFormProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [geolocation, setGeolocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    if (selectedFile) {
      setFile(selectedFile);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      
      toast({
        title: "Image selected",
        description: `${selectedFile.name} (${Math.round(selectedFile.size / 1024)} KB)`,
      });
    }
  };
  
  // Capture user's location
  const getLocation = () => {
    setLocationLoading(true);
    
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not available",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
      setLocationLoading(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGeolocation({ lat: latitude, lng: longitude });
        setLocationLoading(false);
        toast({
          title: "Location captured",
          description: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`,
        });
      },
      (error) => {
        toast({
          title: "Could not get location",
          description: error.message,
          variant: "destructive",
        });
        setLocationLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };
  
  // Trigger file selection
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Submit the form
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!file) {
      toast({
        title: "No image selected",
        description: "Please select an image of the crop to identify",
        variant: "destructive",
      });
      return;
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('image', file);
    
    // Add location if available
    if (geolocation) {
      formData.append('latitude', geolocation.lat.toString());
      formData.append('longitude', geolocation.lng.toString());
    }
    
    try {
      const response = await fetch('/api/crop-identification/identify', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      onIdentify(result);
    } catch (error) {
      toast({
        title: "Identification failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" /> 
          Crop Identification
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="crop-image">Crop Image</Label>
            <Input
              id="crop-image"
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            
            {previewUrl ? (
              <div className="relative rounded-md overflow-hidden border border-border">
                <img 
                  src={previewUrl} 
                  alt="Selected crop" 
                  className="w-full h-56 object-cover"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 bg-background/80 hover:bg-background/90"
                  onClick={triggerFileInput}
                >
                  Change
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full h-56 flex flex-col items-center justify-center gap-2 border-dashed"
                onClick={triggerFileInput}
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Click to select an image
                </span>
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Location Data</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={getLocation}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <MapPin className="h-4 w-4 mr-2" />
                )}
                {geolocation ? "Update Location" : "Get Location"}
              </Button>
            </div>
            
            {geolocation ? (
              <div className="text-sm text-muted-foreground">
                Latitude: {geolocation.lat.toFixed(6)}, Longitude: {geolocation.lng.toFixed(6)}
              </div>
            ) : (
              <div className="flex items-center text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                <span>No location data. Location helps improve identification accuracy.</span>
              </div>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSubmit}
          disabled={!file || loading} 
          className="w-full"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {loading ? "Identifying Crop..." : "Identify Crop"}
        </Button>
      </CardFooter>
    </Card>
  );
}