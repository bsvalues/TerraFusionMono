import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Search, Loader2, MapPin, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface GeocodeSearchProps {
  onResultSelected?: (result: GeocodeResult) => void;
  showResultCard?: boolean;
}

interface GeocodeResult {
  address: string;
  lat: number;
  lng: number;
  formattedAddress: string;
  confidence: number;
  components: {
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    street?: string;
    houseNumber?: string;
  };
}

export function GeocodeSearch({ onResultSelected, showResultCard = true }: GeocodeSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [result, setResult] = useState<GeocodeResult | null>(null);
  const { toast } = useToast();

  // Mutation for the geocoding API
  const { mutate, isPending, error } = useMutation({
    mutationFn: async (address: string): Promise<GeocodeResult> => {
      const response = await apiRequest('POST', '/api/geocode/search', { address });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to geocode address');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      onResultSelected?.(data);
    },
    onError: (error: Error) => {
      toast({
        title: 'Geocoding Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    mutate(searchQuery);
  };

  // Render confidence badge with appropriate color
  const renderConfidenceBadge = (confidence: number) => {
    let className = '';
    
    if (confidence >= 0.9) {
      className = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    } else if (confidence >= 0.7) {
      className = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    } else {
      className = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    }
    
    return (
      <Badge variant="outline" className={className}>
        {Math.round(confidence * 100)}% match
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for an address or location..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isPending}
          />
        </div>
        <Button type="submit" disabled={isPending || !searchQuery.trim()}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </Button>
      </form>

      {isPending && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {error instanceof Error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 dark:bg-red-900/10 dark:border-red-900/30">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 mr-2" />
            <div>
              <h3 className="font-medium text-red-600 dark:text-red-400">Error Geocoding Address</h3>
              <p className="text-sm text-red-600/90 dark:text-red-400/90 mt-1">
                {error.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {result && showResultCard && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">Location Found</CardTitle>
              {renderConfidenceBadge(result.confidence)}
            </div>
            <CardDescription>{result.formattedAddress}</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <MapPin className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  Coordinates: <strong>{result.lat.toFixed(6)}, {result.lng.toFixed(6)}</strong>
                </span>
              </div>
              
              {result.components && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {result.components.street && (
                    <div>
                      <span className="text-muted-foreground">Street: </span>
                      <span className="font-medium">{result.components.street}</span>
                    </div>
                  )}
                  {result.components.city && (
                    <div>
                      <span className="text-muted-foreground">City: </span>
                      <span className="font-medium">{result.components.city}</span>
                    </div>
                  )}
                  {result.components.state && (
                    <div>
                      <span className="text-muted-foreground">State/Province: </span>
                      <span className="font-medium">{result.components.state}</span>
                    </div>
                  )}
                  {result.components.postalCode && (
                    <div>
                      <span className="text-muted-foreground">Postal Code: </span>
                      <span className="font-medium">{result.components.postalCode}</span>
                    </div>
                  )}
                  {result.components.country && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Country: </span>
                      <span className="font-medium">{result.components.country}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => onResultSelected?.(result)}
            >
              Use This Location
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}