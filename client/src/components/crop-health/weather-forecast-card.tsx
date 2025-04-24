import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CloudRainIcon,
  CloudSunIcon,
  ClockIcon,
  SunIcon,
  CloudIcon,
  CloudLightningIcon,
  AlertTriangleIcon,
  WindIcon,
  GaugeIcon,
  ThermometerIcon,
  DropletIcon
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CurrentWeather {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  windDirection: number;
  conditions: string;
  timestamp: string;
}

interface ForecastDay {
  date: string;
  conditions: string;
  temperatureMin: number;
  temperatureMax: number;
  temperatureAvg: number;
  precipitation: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
}

interface WeatherAlert {
  type: string;
  message: string;
  severity?: string;
  expiresAt?: string;
}

interface WeatherAdvisory {
  type: string;
  message: string;
}

interface WeatherForecastCardProps {
  parcelId: string;
  current: CurrentWeather;
  forecast: ForecastDay[];
  alerts: WeatherAlert[];
  advisories: WeatherAdvisory[];
}

/**
 * Card displaying current weather and forecast for crop parcel
 */
export function WeatherForecastCard({
  parcelId,
  current,
  forecast,
  alerts,
  advisories
}: WeatherForecastCardProps) {
  // Helper to get weather condition icon
  const getWeatherIcon = (condition: string, size: 'sm' | 'md' | 'lg' = 'md') => {
    const className = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6';
    
    const conditionLower = condition.toLowerCase();
    
    if (conditionLower.includes('rain') || conditionLower.includes('drizzle') || conditionLower.includes('shower')) {
      return <CloudRainIcon className={className} />;
    } else if (conditionLower.includes('thunderstorm') || conditionLower.includes('lightning')) {
      return <CloudLightningIcon className={className} />;
    } else if (conditionLower.includes('partly cloudy')) {
      return <CloudSunIcon className={className} />;
    } else if (conditionLower.includes('cloudy') || conditionLower.includes('overcast')) {
      return <CloudIcon className={className} />;
    } else if (conditionLower.includes('sunny') || conditionLower.includes('clear')) {
      return <SunIcon className={className} />;
    } else {
      return <CloudSunIcon className={className} />;
    }
  };
  
  // Helper to get wind direction as compass point
  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };
  
  // Helper to format the date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };
  
  // Helper to determine if precipitation is significant
  const isPrecipitationSignificant = (precip: number) => precip > 0.1;
  
  // Helper to format the time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };
  
  // Get advisory type icon
  const getAdvisoryIcon = (type: string) => {
    const className = 'h-4 w-4';
    
    switch (type.toLowerCase()) {
      case 'irrigation':
        return <DropletIcon className={className} />;
      case 'wind':
        return <WindIcon className={className} />;
      case 'frost':
        return <ThermometerIcon className={className} />;
      case 'heat':
        return <ThermometerIcon className={className} />;
      default:
        return <AlertTriangleIcon className={className} />;
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-1 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Weather Forecast</CardTitle>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {formatTime(current.timestamp)}
          </Badge>
        </div>
        <CardDescription>
          Current conditions and 7-day forecast
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current weather display */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {getWeatherIcon(current.conditions, 'lg')}
              <div>
                <h3 className="text-2xl font-bold">{current.temperature}°F</h3>
                <p className="text-sm text-blue-700">{current.conditions}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="flex items-center gap-1">
                <DropletIcon className="h-4 w-4 text-blue-500" />
                <span>Humidity: {current.humidity}%</span>
              </div>
              
              <div className="flex items-center gap-1">
                <CloudRainIcon className="h-4 w-4 text-blue-500" />
                <span>Precip: {current.precipitation}″</span>
              </div>
              
              <div className="flex items-center gap-1">
                <WindIcon className="h-4 w-4 text-blue-500" />
                <span>Wind: {current.windSpeed} mph</span>
              </div>
              
              <div className="flex items-center gap-1">
                <GaugeIcon className="h-4 w-4 text-blue-500" />
                <span>Direction: {getWindDirection(current.windDirection)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2">
                <AlertTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">{alert.type}</h4>
                  <p className="text-sm text-red-700">{alert.message}</p>
                  {alert.expiresAt && (
                    <p className="text-xs text-red-600 mt-1">Expires: {formatDate(alert.expiresAt)} {formatTime(alert.expiresAt)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* 7-day forecast */}
        <div>
          <h4 className="text-sm font-medium mb-2">7-Day Forecast</h4>
          <div className="grid grid-cols-7 gap-1 text-center">
            {forecast.map((day, index) => (
              <div key={index} className="text-xs">
                <div className="font-medium">{formatDate(day.date).split(' ')[0]}</div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex justify-center my-1">
                        {getWeatherIcon(day.conditions, 'sm')}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{day.conditions}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="font-medium">{day.temperatureMax}°</div>
                <div className="text-muted-foreground">{day.temperatureMin}°</div>
                {isPrecipitationSignificant(day.precipitation) && (
                  <div className="mt-1 text-blue-600 flex justify-center">
                    <DropletIcon className="h-3 w-3" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Advisories */}
        {advisories.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2">Advisories</h4>
              <div className="space-y-2">
                {advisories.map((advisory, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    {getAdvisoryIcon(advisory.type)}
                    <p>
                      <span className="font-medium">{advisory.type.charAt(0).toUpperCase() + advisory.type.slice(1)}:</span>{' '}
                      {advisory.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}