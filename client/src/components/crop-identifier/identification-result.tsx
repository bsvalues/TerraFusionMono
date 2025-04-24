import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Leaf, Info, ArrowLeft, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { CropIdentificationResult } from './identification-form';

interface IdentificationResultProps {
  result: CropIdentificationResult;
  onBack: () => void;
}

export default function IdentificationResult({ result, onBack }: IdentificationResultProps) {
  const confidencePercentage = Math.round(result.confidence * 100);
  
  // Function to determine confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-success text-success-foreground';
    if (confidence >= 0.5) return 'bg-warning text-warning-foreground';
    return 'bg-destructive text-destructive-foreground';
  };
  
  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Leaf className="h-5 w-5 text-success" />
            Crop Identified
          </CardTitle>
          <Badge className={getConfidenceColor(result.confidence)}>
            {confidencePercentage}% Confidence
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Primary identification */}
        <div className="space-y-3">
          <div className="text-center">
            <h3 className="text-2xl font-bold">{result.cropName}</h3>
            <p className="text-sm italic text-muted-foreground">{result.scientificName}</p>
          </div>
          
          <Progress 
            value={confidencePercentage} 
            className="h-2" 
          />
          
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Low confidence</span>
            <span>High confidence</span>
          </div>
        </div>
        
        <Separator />
        
        {/* Growth information */}
        <div>
          <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
            <Info className="h-4 w-4" />
            Growth Information
          </h4>
          <p className="text-sm">
            <strong>Growth Stage:</strong> {result.estimatedGrowthStage}
          </p>
        </div>
        
        {/* Details */}
        <div>
          <h4 className="font-medium text-sm mb-2">Details</h4>
          <p className="text-sm">{result.details}</p>
        </div>
        
        {/* Characteristics */}
        <div>
          <h4 className="font-medium text-sm mb-2">Characteristics</h4>
          <div className="flex flex-wrap gap-2">
            {result.characteristics.map((trait, index) => (
              <Badge key={index} variant="outline">{trait}</Badge>
            ))}
          </div>
        </div>
        
        {/* Possible alternatives */}
        {result.possibleAlternatives.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Possible Alternatives</h4>
            <div className="flex flex-wrap gap-2">
              {result.possibleAlternatives.map((alt, index) => (
                <Badge key={index} variant="secondary">{alt}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
          <Button
            variant="outline"
            className="flex-1"
          >
            <ThumbsDown className="h-4 w-4 mr-2" />
            Incorrect
          </Button>
          <Button
            variant="default"
            className="flex-1"
          >
            <ThumbsUp className="h-4 w-4 mr-2" />
            Correct
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}