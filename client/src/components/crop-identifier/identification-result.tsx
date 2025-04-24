import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  AlertCircle, 
  CheckCircle2, 
  Leaf, 
  ThumbsUp, 
  ThumbsDown,
  ClipboardCheck
} from "lucide-react";
import {
  Badge
} from "@/components/ui/badge";

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

interface IdentificationResultProps {
  result: CropIdentificationResult;
  onClose?: () => void;
}

export default function IdentificationResult({ result, onClose }: IdentificationResultProps) {
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(result.verified || false);
  const [feedback, setFeedback] = useState(result.feedback || "");
  
  // Convert characteristics from string to array if needed
  const characteristics = result.characteristics || [];
  const alternatives = result.possibleAlternatives || [];
  
  // Format confidence as percentage
  const confidencePercentage = Math.round(result.confidence * 100);
  
  // Determine confidence level for UI display
  const confidenceLevel = 
    confidencePercentage >= 90 ? "high" :
    confidencePercentage >= 70 ? "medium" : "low";
  
  // Mutation for updating verification status
  const verificationMutation = useMutation({
    mutationFn: async (data: { verified: boolean; feedback: string }) => {
      const response = await apiRequest("PATCH", `/api/crop-identifications/${result.id}`, data);
      return await response.json();
    },
    onSuccess: (data) => {
      // Update UI with verification status
      setVerified(data.identification.verified);
      setFeedback(data.identification.feedback);
      setIsVerifying(false);
      
      // Show success toast
      toast({
        title: "Feedback Saved",
        description: "Your verification and feedback have been saved.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/crop-identifications"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Saving Feedback",
        description: error.message || "Failed to save your verification and feedback.",
        variant: "destructive", 
      });
      setIsVerifying(false);
    },
  });
  
  // Handle verification submission
  const handleSubmitVerification = () => {
    verificationMutation.mutate({
      verified,
      feedback
    });
  };
  
  // Handle copy to clipboard
  const copyToClipboard = () => {
    const textToCopy = `
Crop: ${result.cropName}
Scientific Name: ${result.scientificName || 'Not available'}
Confidence: ${confidencePercentage}%
Growth Stage: ${result.estimatedGrowthStage || 'Not identified'}
Details: ${result.details || 'Not available'}
    `;
    
    navigator.clipboard.writeText(textToCopy.trim()).then(() => {
      toast({
        title: "Copied to Clipboard",
        description: "Identification details copied to clipboard",
      });
    }).catch(err => {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Leaf className="mr-2 h-5 w-5 text-green-600" />
            {result.cropName}
          </span>
          <Badge 
            variant={
              confidenceLevel === "high" ? "default" : 
              confidenceLevel === "medium" ? "secondary" : 
              "outline"
            }
            className={
              confidenceLevel === "high" ? "bg-green-600" : 
              confidenceLevel === "medium" ? "bg-amber-500" : 
              "bg-gray-200 text-gray-700"
            }
          >
            {confidencePercentage}% Confidence
          </Badge>
        </CardTitle>
        <CardDescription>
          {result.scientificName && (
            <span className="italic">{result.scientificName}</span>
          )}
          {result.estimatedGrowthStage && (
            <span className="ml-2 block text-sm">
              Growth Stage: {result.estimatedGrowthStage}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Image */}
        {result.imageUrl && (
          <div className="rounded-md overflow-hidden h-48 bg-gray-100">
            <img 
              src={result.imageUrl} 
              alt={result.cropName} 
              className="h-full w-full object-contain" 
            />
          </div>
        )}
        
        {/* Details */}
        {result.details && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Details</h4>
            <p className="text-sm text-muted-foreground">{result.details}</p>
          </div>
        )}
        
        {/* Characteristics */}
        {characteristics.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Characteristics</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              {characteristics.map((trait, i) => (
                <li key={i}>{trait}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Alternative options */}
        {alternatives.length > 0 && confidencePercentage < 90 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Possible Alternatives</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              {alternatives.map((alt, i) => (
                <li key={i}>{alt}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Timestamp */}
        <div className="text-xs text-muted-foreground">
          Identified on {new Date(result.timestamp).toLocaleString()}
        </div>
        
        {/* Verification Section */}
        <div className="border-t pt-4 mt-4">
          <h4 className="font-medium text-sm mb-2">Verification & Feedback</h4>
          {!isVerifying ? (
            result.verified !== undefined ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {result.verified ? 
                    <CheckCircle2 className="h-5 w-5 text-green-600" /> : 
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  }
                  <span>
                    {result.verified ? 
                      "Verified as correct" : 
                      "Marked as incorrect"
                    }
                  </span>
                </div>
                {result.feedback && (
                  <div className="bg-gray-50 p-3 rounded-md text-sm">
                    {result.feedback}
                  </div>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsVerifying(true)}
                >
                  Update Feedback
                </Button>
              </div>
            ) : (
              <div className="flex">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsVerifying(true)}
                >
                  Provide Feedback
                </Button>
              </div>
            )
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="verify-correct" 
                    checked={verified}
                    onCheckedChange={(checked) => setVerified(checked as boolean)}
                  />
                  <Label htmlFor="verify-correct">Identification is correct</Label>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback (Optional)</Label>
                <Textarea 
                  id="feedback" 
                  placeholder="Add any additional observations or corrections"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={handleSubmitVerification}>
                  Save Feedback
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    setIsVerifying(false);
                    setVerified(result.verified || false);
                    setFeedback(result.feedback || "");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2 border-t">
        <Button variant="ghost" size="sm" onClick={copyToClipboard}>
          <ClipboardCheck className="mr-2 h-4 w-4" />
          Copy Details
        </Button>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}