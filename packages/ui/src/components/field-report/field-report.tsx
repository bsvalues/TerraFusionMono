import * as React from 'react';
import { cn } from '../../utils';
import { 
  FileText, 
  MapPin, 
  CalendarDays, 
  User, 
  Tag,
  ChevronDown,
  ChevronUp,
  Camera,
  Thermometer,
  Ruler,
  Droplets,
  Cloud,
  Wind,
  ScrollText,
  Download,
  Share2,
  Printer,
  Star,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../card';
import { Badge } from '../badge';
import { Button } from '../button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../tooltip';

export type FieldReportStatus = 
  | 'draft'
  | 'pending-review'
  | 'reviewed'
  | 'published'
  | 'archived';

export type FieldReportSeverity = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'
  | 'none';

export type FieldReportType = 
  | 'inspection'
  | 'assessment'
  | 'monitoring'
  | 'incident'
  | 'recommendation'
  | 'harvest'
  | 'planting'
  | 'treatment'
  | 'other';

export interface FieldReportWeather {
  temperature?: number; // in °C
  humidity?: number; // in %
  windSpeed?: number; // in km/h
  precipitation?: number; // in mm
  conditions?: string; // e.g. "Sunny", "Cloudy", "Rainy"
}

export interface FieldReportImage {
  url: string;
  caption?: string;
  type?: 'photo' | 'satellite' | 'drone' | 'thermal' | 'infrared';
  dateTaken?: Date;
  annotations?: {
    x: number;
    y: number;
    text: string;
  }[];
}

export interface FieldReportObservation {
  id: string;
  title: string;
  description: string;
  severity?: FieldReportSeverity;
  images?: FieldReportImage[];
  timestamp?: Date;
  area?: {
    size?: number;
    unit?: string;
    coordinates?: [number, number]; // [lat, lng]
  };
  measurements?: {
    name: string;
    value: number;
    unit: string;
  }[];
  aiAnalysis?: string;
  recommendations?: string[];
}

export interface FieldReportProps {
  /**
   * Report title
   */
  title: string;
  /**
   * Report ID
   */
  id: string;
  /**
   * Field or location name
   */
  location: string;
  /**
   * Date report was created
   */
  createdAt: Date;
  /**
   * Date report was updated
   */
  updatedAt?: Date;
  /**
   * Report author name
   */
  author: string;
  /**
   * Report status
   */
  status: FieldReportStatus;
  /**
   * Report type
   */
  type: FieldReportType;
  /**
   * Report images
   */
  images?: FieldReportImage[];
  /**
   * Report weather conditions
   */
  weather?: FieldReportWeather;
  /**
   * Report observations
   */
  observations: FieldReportObservation[];
  /**
   * Crop type
   */
  cropType?: string;
  /**
   * Field size in hectares
   */
  fieldSize?: number;
  /**
   * Geo coordinates [lat, lng]
   */
  coordinates?: [number, number];
  /**
   * Summary text
   */
  summary?: string;
  /**
   * Conclusions drawn
   */
  conclusions?: string[];
  /**
   * Report tags
   */
  tags?: string[];
  /**
   * AI-generated summary flag
   */
  hasAiSummary?: boolean;
  /**
   * Verification/Signature information
   */
  verification?: {
    verifiedBy?: string;
    verifiedAt?: Date;
    signature?: string;
  };
  /**
   * Overall report severity
   */
  severity?: FieldReportSeverity;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * PDF download URL
   */
  pdfUrl?: string;
  /**
   * Whether component is loading
   */
  loading?: boolean;
  /**
   * Error message
   */
  error?: string;
  /**
   * Click handler for when download button is clicked
   */
  onDownload?: () => void;
  /**
   * Click handler for when share button is clicked
   */
  onShare?: () => void;
  /**
   * Click handler for when print button is clicked
   */
  onPrint?: () => void;
}

/**
 * Field Report component for displaying comprehensive field analysis and observations
 */
export const FieldReport = ({
  title,
  id,
  location,
  createdAt,
  updatedAt,
  author,
  status,
  type,
  images = [],
  weather,
  observations = [],
  cropType,
  fieldSize,
  coordinates,
  summary,
  conclusions = [],
  tags = [],
  hasAiSummary = false,
  verification,
  severity = 'none',
  className = '',
  pdfUrl,
  loading = false,
  error,
  onDownload,
  onShare,
  onPrint
}: FieldReportProps) => {
  const [expandedImages, setExpandedImages] = React.useState(false);
  const [expandedObservation, setExpandedObservation] = React.useState<string | null>(null);

  // Format date
  const formatDate = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleDateString();
  };

  // Format time
  const formatTime = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get status badge variant
  const getStatusBadge = (status: FieldReportStatus) => {
    switch (status) {
      case 'draft':
        return { variant: 'outline' as const, label: 'Draft' };
      case 'pending-review':
        return { variant: 'soil-subtle' as const, label: 'Pending Review' };
      case 'reviewed':
        return { variant: 'blue-subtle' as const, label: 'Reviewed' };
      case 'published':
        return { variant: 'green-subtle' as const, label: 'Published' };
      case 'archived':
        return { variant: 'secondary' as const, label: 'Archived' };
    }
  };

  // Get type badge variant
  const getTypeBadge = (type: FieldReportType) => {
    switch (type) {
      case 'inspection':
        return { variant: 'blue-subtle' as const, label: 'Inspection' };
      case 'assessment':
        return { variant: 'green-subtle' as const, label: 'Assessment' };
      case 'monitoring':
        return { variant: 'secondary' as const, label: 'Monitoring' };
      case 'incident':
        return { variant: 'destructive' as const, label: 'Incident' };
      case 'recommendation':
        return { variant: 'soil-subtle' as const, label: 'Recommendation' };
      case 'harvest':
        return { variant: 'green-subtle' as const, label: 'Harvest' };
      case 'planting':
        return { variant: 'green-subtle' as const, label: 'Planting' };
      case 'treatment':
        return { variant: 'soil-subtle' as const, label: 'Treatment' };
      case 'other':
        return { variant: 'outline' as const, label: 'Other' };
    }
  };

  // Get severity badge
  const getSeverityBadge = (severity: FieldReportSeverity) => {
    switch (severity) {
      case 'low':
        return { variant: 'secondary' as const, label: 'Low Severity' };
      case 'medium':
        return { variant: 'soil-subtle' as const, label: 'Medium Severity' };
      case 'high':
        return { variant: 'soil-subtle' as const, label: 'High Severity' };
      case 'critical':
        return { variant: 'destructive' as const, label: 'Critical' };
      case 'none':
      default:
        return null;
    }
  };

  // Toggle observation expanded state
  const toggleObservation = (id: string) => {
    if (expandedObservation === id) {
      setExpandedObservation(null);
    } else {
      setExpandedObservation(id);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl animate-pulse">
            <div className="h-7 bg-slate-200 rounded w-3/4"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-20 bg-slate-200 rounded animate-pulse"></div>
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
          <CardTitle className="text-xl">Field Report Error</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-destructive py-4">
            <AlertCircle className="h-12 w-12 mx-auto mb-3" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusBadge = getStatusBadge(status);
  const typeBadge = getTypeBadge(type);
  const severityBadge = getSeverityBadge(severity);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-4 border-b">
        <div className="flex flex-wrap justify-between items-start gap-2">
          <div>
            <CardTitle className="text-xl mb-2 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {title}
            </CardTitle>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {statusBadge && <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>}
              {typeBadge && <Badge variant={typeBadge.variant}>{typeBadge.label}</Badge>}
              {severityBadge && <Badge variant={severityBadge.variant}>{severityBadge.label}</Badge>}
              {hasAiSummary && (
                <Badge variant="outline" className="bg-slate-50">
                  <Star className="h-3 w-3 mr-1 text-terrafusion-blue-500" />
                  AI Summary
                </Badge>
              )}
            </div>
            
            <div className="text-sm text-slate-500 flex flex-wrap gap-x-5 gap-y-1">
              {location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {location}
                </span>
              )}
              
              {createdAt && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDate(createdAt)}
                </span>
              )}
              
              {author && (
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {author}
                </span>
              )}
              
              {cropType && (
                <span className="flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" />
                  {cropType}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            {pdfUrl && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-9 px-3"
                      onClick={onDownload}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download report as PDF</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 px-3"
                    onClick={onShare}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share report</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 px-3"
                    onClick={onPrint}
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Print report</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-5 pb-1 space-y-5">
        {/* Field and Weather Info */}
        {(coordinates || fieldSize || weather) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Field Information */}
            {(coordinates || fieldSize) && (
              <div className="bg-slate-50 rounded-md p-3">
                <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Field Information
                </h3>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {fieldSize && (
                    <div>
                      <span className="text-slate-500 block">Field Size:</span>
                      <span className="font-medium">{fieldSize} ha</span>
                    </div>
                  )}
                  
                  {coordinates && (
                    <div>
                      <span className="text-slate-500 block">Coordinates:</span>
                      <span className="font-medium">
                        {coordinates[0].toFixed(5)}, {coordinates[1].toFixed(5)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Weather Information */}
            {weather && (
              <div className="bg-slate-50 rounded-md p-3">
                <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Cloud className="h-4 w-4" />
                  Weather Conditions
                </h3>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {weather.temperature !== undefined && (
                    <div>
                      <span className="text-slate-500 block flex items-center">
                        <Thermometer className="h-3.5 w-3.5 mr-1" />
                        Temperature:
                      </span>
                      <span className="font-medium">{weather.temperature}°C</span>
                    </div>
                  )}
                  
                  {weather.humidity !== undefined && (
                    <div>
                      <span className="text-slate-500 block flex items-center">
                        <Droplets className="h-3.5 w-3.5 mr-1" />
                        Humidity:
                      </span>
                      <span className="font-medium">{weather.humidity}%</span>
                    </div>
                  )}
                  
                  {weather.windSpeed !== undefined && (
                    <div>
                      <span className="text-slate-500 block flex items-center">
                        <Wind className="h-3.5 w-3.5 mr-1" />
                        Wind Speed:
                      </span>
                      <span className="font-medium">{weather.windSpeed} km/h</span>
                    </div>
                  )}
                  
                  {weather.precipitation !== undefined && (
                    <div>
                      <span className="text-slate-500 block flex items-center">
                        <Droplets className="h-3.5 w-3.5 mr-1" />
                        Precipitation:
                      </span>
                      <span className="font-medium">{weather.precipitation} mm</span>
                    </div>
                  )}
                  
                  {weather.conditions && (
                    <div>
                      <span className="text-slate-500 block">Conditions:</span>
                      <span className="font-medium">{weather.conditions}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Summary */}
        {summary && (
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
              <ScrollText className="h-4 w-4" />
              Summary
            </h3>
            
            <div className="text-sm bg-slate-50 rounded-md p-3">
              {summary}
            </div>
          </div>
        )}
        
        {/* Images */}
        {images.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium flex items-center gap-1">
                <Camera className="h-4 w-4" />
                Field Images
              </h3>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => setExpandedImages(!expandedImages)}
              >
                <span className="text-xs mr-1">{expandedImages ? 'Show Less' : `Show ${images.length > 3 ? 'All' : ''}`}</span>
                {expandedImages ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {(expandedImages ? images : images.slice(0, 3)).map((image, index) => (
                <div key={index} className="relative group">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-md">
                    <img 
                      src={image.url} 
                      alt={image.caption || `Field image ${index + 1}`}
                      className="object-cover w-full h-full"
                    />
                    
                    {image.type && (
                      <Badge 
                        variant="outline" 
                        className="absolute top-2 right-2 bg-black/70 text-white border-transparent text-[10px]"
                      >
                        {image.type}
                      </Badge>
                    )}
                  </div>
                  
                  {image.caption && (
                    <div className="text-xs text-slate-600 mt-1 truncate">
                      {image.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Observations */}
        {observations.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
              <ScrollText className="h-4 w-4" />
              Observations
            </h3>
            
            <div className="space-y-3">
              {observations.map((observation) => {
                const isExpanded = expandedObservation === observation.id;
                const severityBadge = observation.severity ? getSeverityBadge(observation.severity) : null;
                
                return (
                  <div 
                    key={observation.id} 
                    className="border rounded-md bg-white overflow-hidden"
                  >
                    <div 
                      className="p-3 cursor-pointer flex items-center justify-between gap-2"
                      onClick={() => toggleObservation(observation.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{observation.title}</h4>
                          {severityBadge && (
                            <Badge variant={severityBadge.variant} className="text-[10px] py-0 h-5">
                              {severityBadge.label}
                            </Badge>
                          )}
                        </div>
                        
                        {observation.timestamp && (
                          <div className="text-xs text-slate-500 mt-1">
                            {formatDate(observation.timestamp)} {formatTime(observation.timestamp)}
                          </div>
                        )}
                      </div>
                      
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 flex-shrink-0" />
                      )}
                    </div>
                    
                    {isExpanded && (
                      <div className="border-t px-3 py-3">
                        <div className="text-sm">{observation.description}</div>
                        
                        {/* Observation images */}
                        {observation.images && observation.images.length > 0 && (
                          <div className="mt-3">
                            <h5 className="text-xs font-medium mb-2">Observation Images</h5>
                            <div className="grid grid-cols-3 gap-2">
                              {observation.images.map((image, idx) => (
                                <div key={idx} className="aspect-[4/3] rounded-md overflow-hidden">
                                  <img 
                                    src={image.url} 
                                    alt={image.caption || `Observation image ${idx + 1}`}
                                    className="object-cover w-full h-full"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Measurements */}
                        {observation.measurements && observation.measurements.length > 0 && (
                          <div className="mt-3">
                            <h5 className="text-xs font-medium mb-2">Measurements</h5>
                            <div className="grid grid-cols-2 gap-2">
                              {observation.measurements.map((measurement, idx) => (
                                <div key={idx} className="bg-slate-50 p-2 rounded-md">
                                  <div className="text-xs text-slate-500">{measurement.name}</div>
                                  <div className="font-medium text-sm">
                                    {measurement.value} {measurement.unit}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* AI Analysis */}
                        {observation.aiAnalysis && (
                          <div className="mt-3">
                            <h5 className="text-xs font-medium flex items-center gap-1 mb-2">
                              <Star className="h-3 w-3 text-terrafusion-blue-500" />
                              AI Analysis
                            </h5>
                            <div className="text-sm bg-terrafusion-blue-50 p-2 rounded-md border border-terrafusion-blue-100">
                              {observation.aiAnalysis}
                            </div>
                          </div>
                        )}
                        
                        {/* Recommendations */}
                        {observation.recommendations && observation.recommendations.length > 0 && (
                          <div className="mt-3">
                            <h5 className="text-xs font-medium mb-2">Recommendations</h5>
                            <div className="space-y-2">
                              {observation.recommendations.map((recommendation, idx) => (
                                <div 
                                  key={idx} 
                                  className="text-sm bg-terrafusion-green-50 p-2 rounded-md border border-terrafusion-green-100"
                                >
                                  {recommendation}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Conclusions */}
        {conclusions.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
              <ScrollText className="h-4 w-4" />
              Conclusions
            </h3>
            
            <div className="space-y-2">
              {conclusions.map((conclusion, idx) => (
                <div 
                  key={idx} 
                  className="text-sm bg-slate-50 p-3 rounded-md"
                >
                  {conclusion}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Tags */}
        {tags.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
              <Tag className="h-4 w-4" />
              Tags
            </h3>
            
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, idx) => (
                <Badge key={idx} variant="outline" className="bg-slate-50">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-3 pb-3 border-t">
        <div className="flex flex-wrap justify-between w-full text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            Report ID: {id}
          </div>
          
          <div className="flex flex-wrap gap-4">
            {updatedAt && (
              <span>Updated: {formatDate(updatedAt)} {formatTime(updatedAt)}</span>
            )}
            
            {verification?.verifiedBy && (
              <span className="flex items-center gap-1">
                Verified by: {verification.verifiedBy}
                {verification.verifiedAt && ` on ${formatDate(verification.verifiedAt)}`}
              </span>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};