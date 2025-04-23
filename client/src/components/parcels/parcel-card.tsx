import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MoreHorizontal, Map, CalendarDays, Edit, Trash2, ChevronDown, Layers } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';

interface ParcelCardProps {
  parcelId: number;
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export function ParcelCard({ parcelId, onView, onEdit, onDelete }: ParcelCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch parcel data from API
  const { data: parcel, isLoading, error } = useQuery({
    queryKey: ['/api/parcels', parcelId],
  });

  // Early return for loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-3/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
        <CardFooter className="pt-2">
          <Skeleton className="h-9 w-20 mr-2" />
          <Skeleton className="h-9 w-9" />
        </CardFooter>
      </Card>
    );
  }

  // Early return for error state
  if (error || !parcel) {
    return (
      <Card className="w-full border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-red-600 dark:text-red-400">Error Loading Parcel</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600 dark:text-red-400">
            {error instanceof Error ? error.message : 'Unable to load parcel data'}
          </p>
        </CardContent>
        <CardFooter className="pt-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Format area with appropriate units
  const formatArea = (areaHectares: number) => {
    if (areaHectares < 1) {
      return `${Math.round(areaHectares * 10000)} m²`;
    }
    if (areaHectares < 100) {
      return `${areaHectares.toFixed(2)} ha`;
    }
    return `${Math.round(areaHectares)} ha`;
  };

  // Format date or return placeholder
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Generate a status badge with appropriate styling
  const renderStatusBadge = (status: string) => {
    let className = '';
    
    switch (status.toLowerCase()) {
      case 'active':
        className = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
        break;
      case 'inactive':
        className = 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        break;
      case 'archived':
        className = 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
        break;
      default:
        className = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    }
    
    return (
      <Badge variant="outline" className={className}>
        {status}
      </Badge>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{parcel.name}</CardTitle>
          <div className="flex items-center space-x-2">
            {renderStatusBadge(parcel.status)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView?.(parcelId)}>
                  <Map className="mr-2 h-4 w-4" />
                  <span>View on Map</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(parcelId)}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Edit Parcel</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete?.(parcelId)}
                  className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {parcel.description && (
            <p className="text-sm text-muted-foreground">{parcel.description}</p>
          )}
          <div className="flex items-center text-sm">
            <Layers className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
            <span>
              Area: <strong>{formatArea(parcel.areaHectares || 0)}</strong>
            </span>
          </div>
          {parcel.currentCrop && (
            <div className="flex items-center text-sm">
              <span className="mr-1.5">🌱</span>
              <span>
                Current crop: <strong>{parcel.currentCrop}</strong>
              </span>
            </div>
          )}
          {parcel.soilType && (
            <div className="flex items-center text-sm">
              <span className="mr-1.5">🧱</span>
              <span>
                Soil type: <strong>{parcel.soilType}</strong>
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full flex justify-center items-center">
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            <span className="ml-1 text-xs">
              {isOpen ? 'Show less' : 'Show more'}
            </span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 border-t">
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Planting Date</p>
                <p className="text-sm font-medium flex items-center">
                  <CalendarDays className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                  {formatDate(parcel.plantingDate)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Harvest Date</p>
                <p className="text-sm font-medium flex items-center">
                  <CalendarDays className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                  {formatDate(parcel.harvestDate)}
                </p>
              </div>
              {parcel.irrigationType && (
                <div className="space-y-1 col-span-2">
                  <p className="text-xs text-muted-foreground">Irrigation</p>
                  <p className="text-sm font-medium">
                    {parcel.irrigationType} {parcel.waterSource ? `(${parcel.waterSource})` : ''}
                  </p>
                </div>
              )}
              {parcel.soilPh && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Soil pH</p>
                  <p className="text-sm font-medium">{parcel.soilPh}</p>
                </div>
              )}
              {parcel.soilOrganicMatter && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Organic Matter</p>
                  <p className="text-sm font-medium">{parcel.soilOrganicMatter}%</p>
                </div>
              )}
              <div className="space-y-1 col-span-2">
                <p className="text-xs text-muted-foreground">Last Visited</p>
                <p className="text-sm font-medium">
                  {formatDate(parcel.lastVisited) || 'Never'}
                </p>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
      <CardFooter className="pt-0">
        <Button variant="outline" size="sm" className="mr-2" onClick={() => onView?.(parcelId)}>
          <Map className="mr-2 h-4 w-4" />
          View on Map
        </Button>
        <Button variant="outline" size="sm" onClick={() => onEdit?.(parcelId)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </CardFooter>
    </Card>
  );
}