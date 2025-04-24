import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Camera, Upload, Loader2 } from "lucide-react";

// Form schema for crop identification
const identificationFormSchema = z.object({
  parcelId: z.string().optional(),
  image: z.instanceof(File).refine(file => file.size <= 5 * 1024 * 1024, {
    message: "Image must be less than 5MB"
  }).refine(
    file => ["image/jpeg", "image/png", "image/webp", "image/heic"].includes(file.type),
    {
      message: "File must be an image (JPEG, PNG, WEBP, HEIC)"
    }
  ),
});

type IdentificationFormValues = z.infer<typeof identificationFormSchema>;

interface IdentificationFormProps {
  onSuccess: (data: any) => void;
  parcels?: Array<{ id: string; name: string }>;
}

export default function IdentificationForm({ onSuccess, parcels = [] }: IdentificationFormProps) {
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  // Form definition
  const form = useForm<IdentificationFormValues>({
    resolver: zodResolver(identificationFormSchema),
    defaultValues: {
      parcelId: undefined,
    },
  });

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, onChange: (file: File) => void) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    onChange(file);
    
    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    // Cleanup camera if active
    if (isCameraActive) {
      stopCamera();
    }
    
    // Clean up URL when component unmounts
    return () => URL.revokeObjectURL(objectUrl);
  };

  // Handle camera activation
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      setIsCameraActive(true);
      
      // Get video element
      const videoElement = document.getElementById('camera-preview') as HTMLVideoElement;
      if (videoElement) {
        videoElement.srcObject = stream;
        videoElement.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Could not access your camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  // Capture photo from camera
  const capturePhoto = () => {
    try {
      const videoElement = document.getElementById('camera-preview') as HTMLVideoElement;
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      // Draw video frame to canvas
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            // Create file from blob
            const file = new File([blob], "captured-image.jpg", { type: "image/jpeg" });
            
            // Set file in form
            form.setValue("image", file, { shouldValidate: true });
            
            // Create preview URL
            const objectUrl = URL.createObjectURL(blob);
            setPreviewUrl(objectUrl);
            
            // Stop camera
            stopCamera();
          }
        }, 'image/jpeg', 0.95);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      toast({
        title: "Capture Error",
        description: "Failed to capture image. Please try again.",
        variant: "destructive",
      });
    }
  };

  // API mutation for crop identification
  const cropIdentificationMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/crop-identification", data, {
        processData: false
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Identification Complete",
        description: `${data.identification.cropName} identified successfully.`,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/crop-identifications"] });
      
      // Call parent success handler
      onSuccess(data.identification);
      
      // Reset form
      form.reset();
      setPreviewUrl(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Identification Failed",
        description: error.message || "Failed to identify crop. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: IdentificationFormValues) => {
    // Create form data for file upload
    const formData = new FormData();
    
    // Add parcel ID if selected
    if (values.parcelId) {
      formData.append("parcelId", values.parcelId);
    }
    
    // Add image file
    formData.append("image", values.image);
    
    // Submit to API
    cropIdentificationMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Identify Crop</h2>
        <p className="text-muted-foreground">
          Upload an image or take a photo to identify crop species
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Parcel selection */}
          <FormField
            control={form.control}
            name="parcelId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parcel (Optional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a parcel" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {parcels.map((parcel) => (
                      <SelectItem key={parcel.id} value={parcel.id}>
                        {parcel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Image upload */}
          <FormField
            control={form.control}
            name="image"
            render={({ field: { onChange, value, ...rest } }) => (
              <FormItem>
                <FormLabel>Image</FormLabel>
                <div className="space-y-4">
                  {/* Hidden file input */}
                  <input
                    type="file"
                    id="image-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, onChange)}
                  />
                  
                  {/* Camera preview */}
                  {isCameraActive && (
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                      <video
                        id="camera-preview"
                        className="w-full h-full object-cover"
                        autoPlay
                        playsInline
                        muted
                      />
                      <Button
                        type="button"
                        className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
                        onClick={capturePhoto}
                      >
                        Capture
                      </Button>
                    </div>
                  )}
                  
                  {/* Image preview */}
                  {previewUrl && !isCameraActive && (
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                      <img
                        src={previewUrl}
                        className="w-full h-full object-cover"
                        alt="Preview"
                      />
                    </div>
                  )}
                  
                  {/* Action buttons */}
                  <div className="flex space-x-4">
                    {/* Camera button */}
                    <Button
                      type="button"
                      variant={isCameraActive ? "destructive" : "secondary"}
                      onClick={isCameraActive ? stopCamera : startCamera}
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      {isCameraActive ? "Cancel" : "Camera"}
                    </Button>
                    
                    {/* Upload button */}
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </Button>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full"
            disabled={cropIdentificationMutation.isPending || !form.formState.isValid}
          >
            {cropIdentificationMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Identifying...
              </>
            ) : (
              "Identify Crop"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}