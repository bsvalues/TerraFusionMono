import * as React from 'react';
import { cn } from '../../utils';
import { 
  CircleAlert,
  Droplets,
  FlaskConical,
  Bug,
  Sprout,
  MoveHorizontal,
  Ruler,
  CalendarDays,
  PlusCircle,
  MinusCircle,
  Info,
  ScrollText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../card';
import { Progress } from '../progress';
import { Button } from '../button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../tooltip';

export type NutrientStatus = 
  | 'optimal'
  | 'excess'
  | 'deficit'
  | 'critical-deficit'
  | 'critical-excess'
  | 'unknown';

export interface SoilNutrient {
  name: string;
  value: number;
  unit: string;
  status: NutrientStatus;
  // Optional ideal range
  optimalRange?: [number, number];
}

export interface PhysicalProperty {
  name: string;
  value: number;
  unit: string;
  status?: NutrientStatus;
  optimalRange?: [number, number];
}

export interface SoilAnalysisCardProps {
  /**
   * Title for the analysis card
   */
  title: string;
  /**
   * Location or field name
   */
  location?: string;
  /**
   * Date when the sample was taken
   */
  sampleDate?: Date;
  /**
   * Date when the analysis was completed
   */
  analysisDate?: Date;
  /**
   * Soil pH value
   */
  pH?: number;
  /**
   * Organic matter percentage
   */
  organicMatter?: number;
  /**
   * Main soil nutrients (N, P, K, etc.)
   */
  nutrients: SoilNutrient[];
  /**
   * Physical soil properties (texture, density, etc.)
   */
  physicalProperties?: PhysicalProperty[];
  /**
   * Recommendations based on the analysis
   */
  recommendations?: string[];
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether the component is in loading state
   */
  loading?: boolean;
  /**
   * Error message if analysis failed
   */
  error?: string;
  /**
   * Sample depth in cm
   */
  sampleDepth?: number;
  /**
   * Soil classification or type
   */
  soilType?: string;
  /**
   * Whether to show recommendations
   */
  showRecommendations?: boolean;
  /**
   * Whether to show pH visualization
   */
  showPHScale?: boolean;
  /**
   * Whether to show all nutrients or just the key ones
   */
  showAllNutrients?: boolean;
}

/**
 * Component for displaying soil analysis results and recommendations
 */
export const SoilAnalysisCard = ({
  title,
  location,
  sampleDate,
  analysisDate,
  pH,
  organicMatter,
  nutrients,
  physicalProperties = [],
  recommendations = [],
  className = '',
  loading = false,
  error,
  sampleDepth,
  soilType,
  showRecommendations = true,
  showPHScale = true,
  showAllNutrients = false
}: SoilAnalysisCardProps) => {
  // State to track if all nutrients are shown
  const [expandedNutrients, setExpandedNutrients] = React.useState(showAllNutrients);
  
  // Format date
  const formatDate = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleDateString();
  };
  
  // Get icon for a nutrient or property
  const getNutrientIcon = (name: string) => {
    const iconProps = { className: "h-4 w-4" };
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('nitrogen') || lowerName === 'n') {
      return <FlaskConical {...iconProps} />;
    } else if (lowerName.includes('phosphorus') || lowerName === 'p') {
      return <Sprout {...iconProps} />;
    } else if (lowerName.includes('potassium') || lowerName === 'k') {
      return <PanelTopOpen {...iconProps} />;
    } else if (lowerName.includes('moisture') || lowerName.includes('water')) {
      return <Droplets {...iconProps} />;
    } else if (lowerName.includes('texture') || lowerName.includes('structure')) {
      return <MoveHorizontal {...iconProps} />;
    } else if (lowerName.includes('depth') || lowerName.includes('thickness')) {
      return <Ruler {...iconProps} />;
    } else if (lowerName.includes('pest') || lowerName.includes('insect')) {
      return <Bug {...iconProps} />;
    } else {
      return <Info {...iconProps} />;
    }
  };
  
  // Get status color based on nutrient status
  const getStatusColor = (status: NutrientStatus) => {
    switch (status) {
      case 'optimal':
        return 'text-terrafusion-green-600';
      case 'excess':
        return 'text-terrafusion-soil-600';
      case 'deficit':
        return 'text-terrafusion-soil-500';
      case 'critical-deficit':
      case 'critical-excess':
        return 'text-destructive';
      default:
        return 'text-slate-500';
    }
  };
  
  // Get status icon based on nutrient status
  const getStatusIcon = (status: NutrientStatus) => {
    const iconClassName = "h-3.5 w-3.5 ml-1";
    
    switch (status) {
      case 'optimal':
        return null;
      case 'excess':
        return <PlusCircle className={cn(iconClassName, "text-terrafusion-soil-600")} />;
      case 'deficit':
        return <MinusCircle className={cn(iconClassName, "text-terrafusion-soil-500")} />;
      case 'critical-deficit':
        return <MinusCircle className={cn(iconClassName, "text-destructive")} />;
      case 'critical-excess':
        return <PlusCircle className={cn(iconClassName, "text-destructive")} />;
      default:
        return null;
    }
  };
  
  // Get pH class
  const getPHClass = (value?: number) => {
    if (value === undefined) return 'bg-slate-300';
    
    if (value < 5.0) return 'bg-destructive';
    if (value < 5.5) return 'bg-terrafusion-soil-600';
    if (value < 6.0) return 'bg-terrafusion-soil-500';
    if (value >= 6.0 && value <= 7.5) return 'bg-terrafusion-green-500';
    if (value <= 8.0) return 'bg-terrafusion-soil-500';
    if (value <= 8.5) return 'bg-terrafusion-soil-600';
    return 'bg-destructive';
  };
  
  // Calculate pH position on scale (0-100%)
  const getPHPosition = (value?: number) => {
    if (value === undefined) return 50;
    
    // Scale goes from 4.0 to 9.0
    const scaledValue = Math.max(4.0, Math.min(9.0, value));
    return ((scaledValue - 4.0) / 5.0) * 100;
  };
  
  // Get organic matter class
  const getOrganicMatterClass = (value?: number) => {
    if (value === undefined) return 'bg-slate-300';
    
    if (value < 1.5) return 'bg-destructive';
    if (value < 3.0) return 'bg-terrafusion-soil-500';
    if (value <= 6.0) return 'bg-terrafusion-green-500';
    if (value <= 8.0) return 'bg-terrafusion-soil-500';
    return 'bg-terrafusion-soil-600';
  };
  
  // Filter key nutrients
  const keyNutrients = nutrients.slice(0, 3);
  const secondaryNutrients = nutrients.slice(3);
  
  // Render loading state
  if (loading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-3/4"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-8 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-8 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-8 bg-slate-200 rounded animate-pulse"></div>
            </div>
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
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-destructive py-4">
            <CircleAlert className="h-10 w-10 mx-auto mb-2" />
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
          <FlaskConical className="h-5 w-5" />
          {title}
        </CardTitle>
        {(location || sampleDate) && (
          <div className="text-sm text-slate-500 flex flex-wrap gap-x-4">
            {location && <span>{location}</span>}
            {sampleDate && (
              <span className="flex items-center">
                <CalendarDays className="h-3 w-3 mr-1" />
                Sampled: {formatDate(sampleDate)}
              </span>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pb-2 space-y-4">
        {/* Soil Type and Sample Depth */}
        {(soilType || sampleDepth) && (
          <div className="flex flex-wrap gap-3">
            {soilType && (
              <div className="bg-slate-50 px-3 py-1.5 rounded-md text-sm">
                <span className="font-medium mr-1">Soil type:</span>
                {soilType}
              </div>
            )}
            
            {sampleDepth && (
              <div className="bg-slate-50 px-3 py-1.5 rounded-md text-sm">
                <span className="font-medium mr-1">Sample depth:</span>
                {sampleDepth} cm
              </div>
            )}
          </div>
        )}
        
        {/* pH Value */}
        {pH !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Soil pH</div>
              <div className="text-sm font-bold">{pH.toFixed(1)}</div>
            </div>
            
            {showPHScale && (
              <div className="relative h-5 bg-slate-100 rounded-full overflow-hidden mt-1">
                {/* pH Scale */}
                <div className="absolute inset-0 flex">
                  <div className="h-full bg-destructive" style={{ width: '20%' }}></div>
                  <div className="h-full bg-terrafusion-soil-500" style={{ width: '20%' }}></div>
                  <div className="h-full bg-terrafusion-green-500" style={{ width: '30%' }}></div>
                  <div className="h-full bg-terrafusion-soil-500" style={{ width: '15%' }}></div>
                  <div className="h-full bg-destructive" style={{ width: '15%' }}></div>
                </div>
                
                {/* pH Marker */}
                <div 
                  className={cn(
                    "absolute top-0 bottom-0 w-4 h-4 rounded-full border-2 border-white transform -translate-x-1/2",
                    getPHClass(pH)
                  )}
                  style={{ left: `${getPHPosition(pH)}%` }}
                ></div>
                
                {/* Scale Labels */}
                <div className="absolute inset-0 flex justify-between text-[10px] text-white font-medium px-2">
                  <span>Acidic</span>
                  <span>Neutral</span>
                  <span>Alkaline</span>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Organic Matter */}
        {organicMatter !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Organic Matter</div>
              <div className="text-sm font-bold">{organicMatter.toFixed(1)}%</div>
            </div>
            
            <Progress 
              value={Math.min(organicMatter * 10, 100)} 
              className="h-2"
              variant={
                organicMatter < 1.5 ? 'error' :
                organicMatter < 3.0 ? 'warning' :
                organicMatter <= 6.0 ? 'success' :
                'warning'
              }
            />
            
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Low</span>
              <span>Optimal</span>
              <span>High</span>
            </div>
          </div>
        )}
        
        {/* Key Nutrients */}
        <div>
          <div className="text-sm font-medium mb-2">Nutrient Levels</div>
          
          <div className="space-y-2">
            {keyNutrients.map((nutrient, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-2 bg-slate-50 rounded"
              >
                <div className="flex items-center gap-2">
                  {getNutrientIcon(nutrient.name)}
                  <span className="text-sm">{nutrient.name}</span>
                </div>
                
                <div className="flex items-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className={cn("text-sm font-medium flex items-center", getStatusColor(nutrient.status))}>
                          {nutrient.value} {nutrient.unit}
                          {getStatusIcon(nutrient.status)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          Status: <span className={getStatusColor(nutrient.status)}>{nutrient.status}</span>
                          {nutrient.optimalRange && (
                            <div>Optimal range: {nutrient.optimalRange[0]}-{nutrient.optimalRange[1]} {nutrient.unit}</div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            ))}
            
            {/* Secondary nutrients (expandable) */}
            {secondaryNutrients.length > 0 && (
              <>
                {expandedNutrients && (
                  <div className="space-y-2 mt-2">
                    {secondaryNutrients.map((nutrient, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-2 bg-slate-50 rounded"
                      >
                        <div className="flex items-center gap-2">
                          {getNutrientIcon(nutrient.name)}
                          <span className="text-sm">{nutrient.name}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={cn("text-sm font-medium flex items-center", getStatusColor(nutrient.status))}>
                                  {nutrient.value} {nutrient.unit}
                                  {getStatusIcon(nutrient.status)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs">
                                  Status: <span className={getStatusColor(nutrient.status)}>{nutrient.status}</span>
                                  {nutrient.optimalRange && (
                                    <div>Optimal range: {nutrient.optimalRange[0]}-{nutrient.optimalRange[1]} {nutrient.unit}</div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Toggle button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs mt-2"
                  onClick={() => setExpandedNutrients(!expandedNutrients)}
                >
                  {expandedNutrients ? 'Show Less' : `Show ${secondaryNutrients.length} More Nutrients`}
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Physical Properties */}
        {physicalProperties.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2">Soil Properties</div>
            
            <div className="space-y-2">
              {physicalProperties.map((property, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-2 bg-slate-50 rounded"
                >
                  <div className="flex items-center gap-2">
                    {getNutrientIcon(property.name)}
                    <span className="text-sm">{property.name}</span>
                  </div>
                  
                  <div>
                    {property.status ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={cn("text-sm font-medium flex items-center", property.status && getStatusColor(property.status))}>
                              {property.value} {property.unit}
                              {property.status && getStatusIcon(property.status)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {property.optimalRange && (
                              <div className="text-xs">Optimal: {property.optimalRange[0]}-{property.optimalRange[1]} {property.unit}</div>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-sm font-medium">
                        {property.value} {property.unit}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Recommendations */}
        {recommendations.length > 0 && showRecommendations && (
          <div>
            <div className="text-sm font-medium mb-2">Recommendations</div>
            
            <div className="space-y-2">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="p-2 bg-terrafusion-green-50 rounded border border-terrafusion-green-200 text-sm">
                  {recommendation}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      {analysisDate && (
        <CardFooter className="text-xs text-slate-500 pt-0 pb-2">
          <div className="flex items-center">
            <CalendarDays className="h-3 w-3 mr-1" />
            Analysis completed: {formatDate(analysisDate)}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};