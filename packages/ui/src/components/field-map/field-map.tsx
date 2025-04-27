import * as React from 'react';
import { cn } from '../../utils';
import { 
  Map,
  MapPin,
  Pin,
  Tractor,
  Droplets,
  ThermometerSun,
  Image,
  Leaf,
  AlertCircle,
  Info,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../card';
import { Button } from '../button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../tooltip';
import { CropHealthStatus } from '../crop-health-indicator/crop-health-indicator';

export interface FieldMapRegion {
  id: string;
  name: string;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  status?: CropHealthStatus;
  data?: Record<string, any>;
}

export interface FieldMapProps {
  /**
   * Field name or identifier
   */
  fieldName: string;
  /**
   * Field image URL
   */
  imageUrl?: string;
  /**
   * Field area in hectares
   */
  area?: number;
  /**
   * Field regions with data
   */
  regions?: FieldMapRegion[];
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether the map is loading
   */
  loading?: boolean;
  /**
   * Error message to display if loading fails
   */
  error?: string;
  /**
   * Map width
   */
  width?: number | string;
  /**
   * Map height
   */
  height?: number | string;
  /**
   * Callback when a region is selected
   */
  onRegionSelect?: (region: FieldMapRegion) => void;
  /**
   * Whether to show the inspect button
   */
  showInspectButton?: boolean;
  /**
   * Whether to display overlays for all regions or only on hover
   */
  alwaysShowOverlays?: boolean;
  /**
   * The selected region ID
   */
  selectedRegionId?: string;
}

/**
 * Interactive field map for visualizing agricultural data
 */
export const FieldMap = ({
  fieldName,
  imageUrl,
  area,
  regions = [],
  className = '',
  loading = false,
  error,
  width = '100%',
  height = 300,
  onRegionSelect,
  showInspectButton = true,
  alwaysShowOverlays = false,
  selectedRegionId
}: FieldMapProps) => {
  // State for highlighted region on hover
  const [hoveredRegionId, setHoveredRegionId] = React.useState<string | null>(null);
  
  // Function to get color based on health status
  const getStatusColor = (status?: CropHealthStatus) => {
    switch (status) {
      case 'excellent':
        return 'rgba(90, 184, 37, 0.5)'; // Green with opacity
      case 'good':
        return 'rgba(124, 200, 70, 0.5)';
      case 'fair':
        return 'rgba(188, 124, 69, 0.5)'; // Soil/amber with opacity
      case 'poor':
        return 'rgba(164, 98, 58, 0.5)';
      case 'critical':
        return 'rgba(239, 68, 68, 0.5)'; // Red with opacity
      default:
        return 'rgba(148, 163, 184, 0.3)'; // Slate with opacity
    }
  };
  
  // Function to get border color based on health status
  const getStatusBorderColor = (status?: CropHealthStatus) => {
    switch (status) {
      case 'excellent':
        return 'rgb(90, 184, 37)';
      case 'good':
        return 'rgb(124, 200, 70)';
      case 'fair':
        return 'rgb(188, 124, 69)';
      case 'poor':
        return 'rgb(164, 98, 58)';
      case 'critical':
        return 'rgb(239, 68, 68)';
      default:
        return 'rgb(148, 163, 184)';
    }
  };
  
  // Function to get status icon
  const getStatusIcon = (status?: CropHealthStatus) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return <Leaf className="h-4 w-4" />;
      case 'fair':
        return <ThermometerSun className="h-4 w-4" />;
      case 'poor':
      case 'critical':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };
  
  // Handle region click
  const handleRegionClick = (region: FieldMapRegion) => {
    if (onRegionSelect) {
      onRegionSelect(region);
    }
  };
  
  // Render placeholder if there's no image
  if (!imageUrl && !error && !loading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Map className="h-5 w-5" />
            {fieldName}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-6" style={{ height }}>
          <div className="text-center text-slate-500">
            <Image className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p>No field imagery available</p>
            {area && <p className="text-sm mt-1">Field area: {area} hectares</p>}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Map className="h-5 w-5" />
            {fieldName}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-6" style={{ height }}>
          <div className="text-center text-destructive">
            <AlertCircle className="h-12 w-12 mx-auto mb-3" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Map className="h-5 w-5" />
          {fieldName}
          {area && <span className="text-sm font-normal text-slate-500 ml-auto">{area} ha</span>}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 relative">
        <div 
          className="relative"
          style={{ width, height }}
        >
          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 bg-slate-100/80 flex items-center justify-center z-10">
              <div className="text-slate-500 animate-pulse">Loading field data...</div>
            </div>
          )}
          
          {/* Field image */}
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={`Field map of ${fieldName}`} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
              <Image className="h-12 w-12 text-slate-300" />
            </div>
          )}
          
          {/* Region overlays */}
          {regions.map((region) => {
            const isSelected = region.id === selectedRegionId;
            const isHovered = region.id === hoveredRegionId;
            const shouldShowOverlay = alwaysShowOverlays || isHovered || isSelected;
            
            return (
              <div
                key={region.id}
                className={cn(
                  "absolute cursor-pointer transition-all duration-200",
                  isSelected ? "ring-2 ring-primary z-20" : "z-10"
                )}
                style={{
                  left: `${region.coordinates.x}%`,
                  top: `${region.coordinates.y}%`,
                  width: `${region.coordinates.width}%`,
                  height: `${region.coordinates.height}%`,
                  backgroundColor: shouldShowOverlay ? getStatusColor(region.status) : 'transparent',
                  border: `1px solid ${isSelected || isHovered ? getStatusBorderColor(region.status) : 'transparent'}`
                }}
                onClick={() => handleRegionClick(region)}
                onMouseEnter={() => setHoveredRegionId(region.id)}
                onMouseLeave={() => setHoveredRegionId(null)}
              >
                {(isHovered || isSelected) && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="absolute top-2 left-2 bg-white rounded-full p-1 shadow-sm">
                          {getStatusIcon(region.status)}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">{region.name}</p>
                        <p className="text-xs">{region.status || 'Unknown'} condition</p>
                        {region.data && Object.keys(region.data).length > 0 && (
                          <div className="text-xs mt-1 text-slate-300">
                            Click to view details
                          </div>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {isSelected && showInspectButton && (
                  <div className="absolute bottom-2 right-2">
                    <Button 
                      size="sm" 
                      variant="terrafusion-green"
                      className="text-xs py-0 px-2 h-7"
                      icon={<ArrowRight className="h-3 w-3" />}
                      iconPosition="right"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRegionClick(region);
                      }}
                    >
                      Inspect
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
      
      <CardFooter className="text-xs text-slate-500 p-2">
        <div className="flex items-center">
          <Pin className="h-3 w-3 mr-1" />
          {regions.length} {regions.length === 1 ? 'region' : 'regions'} mapped
        </div>
      </CardFooter>
    </Card>
  );
};