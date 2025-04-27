import * as React from 'react';
import { cn } from '../../utils';
import { 
  Leaf, 
  ThermometerSun, 
  Droplets,
  AlertCircle,
  CheckCircle2,
  Info,
  Flower2,
  GanttChart,
  Sprout,
  Thermometer,
  Ruler
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '../tooltip';
import { Progress } from '../progress';

export type CropHealthStatus = 
  | 'excellent'
  | 'good'
  | 'fair'
  | 'poor'
  | 'critical'
  | 'unknown';

export type CropHealthMetric = {
  name: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  status: CropHealthStatus;
};

export interface CropHealthIndicatorProps {
  /**
   * Overall health status
   */
  status: CropHealthStatus;
  /**
   * Health score (0-100)
   */
  score?: number;
  /**
   * Date of assessment
   */
  assessmentDate?: Date;
  /**
   * Crop type
   */
  cropType?: string;
  /**
   * Growth stage
   */
  growthStage?: string;
  /**
   * Detailed metrics (optional)
   */
  metrics?: CropHealthMetric[];
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether to show detailed metrics
   */
  showDetails?: boolean;
  /**
   * Whether to show a tooltip with summary
   */
  showTooltip?: boolean;
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Indicator for displaying crop health status and metrics
 */
export const CropHealthIndicator = ({
  status,
  score = 0,
  assessmentDate,
  cropType,
  growthStage,
  metrics = [],
  className = '',
  showDetails = false,
  showTooltip = true,
  size = 'md'
}: CropHealthIndicatorProps) => {

  // Format the assessment date
  const formatDate = (date?: Date) => {
    if (!date) return 'Unknown';
    return date.toLocaleDateString();
  };

  // Get icon for a particular metric
  const getMetricIcon = (name: string) => {
    const iconClassName = cn(
      size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
    );

    // Map metric names to appropriate icons
    const lowerName = name.toLowerCase();
    if (lowerName.includes('moisture') || lowerName.includes('water')) {
      return <Droplets className={iconClassName} />;
    } else if (lowerName.includes('temperature') || lowerName.includes('heat')) {
      return <Thermometer className={iconClassName} />;
    } else if (lowerName.includes('growth') || lowerName.includes('height')) {
      return <Ruler className={iconClassName} />;
    } else if (lowerName.includes('nutrient') || lowerName.includes('fertilizer')) {
      return <Flower2 className={iconClassName} />;
    } else if (lowerName.includes('development') || lowerName.includes('stage')) {
      return <GanttChart className={iconClassName} />;
    } else if (lowerName.includes('germination') || lowerName.includes('sprout')) {
      return <Sprout className={iconClassName} />;
    } else if (lowerName.includes('sunlight') || lowerName.includes('light')) {
      return <ThermometerSun className={iconClassName} />;
    } else {
      return <Info className={iconClassName} />;
    }
  };

  // Get status details based on current status
  const getStatusDetails = () => {
    // Icon size based on component size
    const iconSize = cn(
      size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
    );

    switch (status) {
      case 'excellent':
        return {
          icon: <Leaf className={cn("text-terrafusion-green-500", iconSize)} />,
          label: 'Excellent',
          color: 'bg-terrafusion-green-500',
          textColor: 'text-terrafusion-green-700',
          bgColor: 'bg-terrafusion-green-50',
          description: 'Crop is thriving, no issues detected',
        };
      case 'good':
        return {
          icon: <CheckCircle2 className={cn("text-terrafusion-green-600", iconSize)} />,
          label: 'Good',
          color: 'bg-terrafusion-green-400',
          textColor: 'text-terrafusion-green-700',
          bgColor: 'bg-terrafusion-green-50',
          description: 'Crop is healthy with minor imperfections',
        };
      case 'fair':
        return {
          icon: <ThermometerSun className={cn("text-terrafusion-soil-500", iconSize)} />,
          label: 'Fair',
          color: 'bg-terrafusion-soil-400',
          textColor: 'text-terrafusion-soil-700',
          bgColor: 'bg-terrafusion-soil-50',
          description: 'Crop shows some stress but generally ok',
        };
      case 'poor':
        return {
          icon: <AlertCircle className={cn("text-terrafusion-soil-600", iconSize)} />,
          label: 'Poor',
          color: 'bg-terrafusion-soil-600',
          textColor: 'text-terrafusion-soil-700',
          bgColor: 'bg-terrafusion-soil-50',
          description: 'Crop is experiencing significant stress',
        };
      case 'critical':
        return {
          icon: <AlertCircle className={cn("text-destructive", iconSize)} />,
          label: 'Critical',
          color: 'bg-destructive',
          textColor: 'text-destructive',
          bgColor: 'bg-destructive/10',
          description: 'Immediate intervention required',
        };
      case 'unknown':
      default:
        return {
          icon: <Info className={cn("text-slate-400", iconSize)} />,
          label: 'Unknown',
          color: 'bg-slate-300',
          textColor: 'text-slate-700',
          bgColor: 'bg-slate-50',
          description: 'Assessment data not available',
        };
    }
  };

  const statusDetails = getStatusDetails();
  
  // Get variant for progress bar
  const getProgressVariant = () => {
    switch (status) {
      case 'excellent':
      case 'good':
        return 'success';
      case 'fair':
        return 'warning';
      case 'poor':
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  // Get status color class for metrics
  const getMetricStatusColor = (metricStatus: CropHealthStatus) => {
    switch (metricStatus) {
      case 'excellent':
        return 'text-terrafusion-green-500';
      case 'good':
        return 'text-terrafusion-green-600';
      case 'fair':
        return 'text-terrafusion-soil-500';
      case 'poor':
        return 'text-terrafusion-soil-600';
      case 'critical':
        return 'text-destructive';
      default:
        return 'text-slate-400';
    }
  };

  // Render the basic indicator UI
  const indicatorContent = (
    <div 
      className={cn(
        "rounded-md border p-2",
        statusDetails.bgColor,
        className
      )}
    >
      <div className="flex items-center gap-2">
        {statusDetails.icon}
        
        <div>
          <div className={cn("font-medium", statusDetails.textColor)}>
            {statusDetails.label}
          </div>
          
          {cropType && (
            <div className="text-xs text-slate-500">
              {cropType} {growthStage ? `(${growthStage})` : ''}
            </div>
          )}
        </div>

        {score > 0 && (
          <div className="ml-auto text-sm font-bold">
            {score}/100
          </div>
        )}
      </div>

      {score > 0 && (
        <div className="mt-2">
          <Progress 
            value={score} 
            variant={getProgressVariant()} 
            className="h-1.5"
          />
        </div>
      )}

      {showDetails && metrics.length > 0 && (
        <div className="mt-3 space-y-2 pt-2 border-t">
          <div className="text-xs font-medium text-slate-500">Detailed Metrics</div>
          
          {metrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                {getMetricIcon(metric.name)}
                <span>{metric.name}</span>
              </div>
              
              <div className={cn("font-medium", getMetricStatusColor(metric.status))}>
                {metric.value} {metric.unit}
              </div>
            </div>
          ))}
        </div>
      )}

      {assessmentDate && (
        <div className="mt-2 text-xs text-slate-500">
          Assessed on: {formatDate(assessmentDate)}
        </div>
      )}
    </div>
  );

  // Conditionally wrap with tooltip
  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {indicatorContent}
          </TooltipTrigger>
          <TooltipContent side="right">
            <div className="text-sm font-semibold">{statusDetails.label} Health</div>
            <div className="text-xs">{statusDetails.description}</div>
            {metrics.length > 0 && !showDetails && (
              <div className="mt-1 text-xs text-slate-300">{metrics.length} metrics available</div>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Return without tooltip
  return indicatorContent;
};