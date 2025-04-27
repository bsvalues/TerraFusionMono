import * as React from 'react';
import { cn } from '../../utils';
import { 
  Cloud,
  CloudRain,
  CloudSnow,
  Cloudy,
  Droplets,
  Thermometer,
  Wind,
  Sun,
  MoonStar,
  Sunrise,
  Sunset,
  CloudFog,
  CloudLightning,
  CircleAlert,
  Compass
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../card';
import { Progress } from '../progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../tooltip';

export type WeatherCondition = 
  | 'clear'
  | 'cloudy'
  | 'partly-cloudy'
  | 'rain'
  | 'thunderstorm'
  | 'snow'
  | 'fog'
  | 'unknown';

export type WeatherTimePeriod =
  | 'day'
  | 'night';

export type PrecipitationType =
  | 'rain'
  | 'snow'
  | 'sleet'
  | 'hail'
  | 'none';

export interface WeatherForecastDay {
  date: Date;
  condition: WeatherCondition;
  temperatureHigh: number;
  temperatureLow: number;
  precipitationChance: number;
  precipitationType?: PrecipitationType;
  windSpeed?: number;
  humidity?: number;
}

export interface WeatherWidgetProps {
  /**
   * Location name
   */
  location: string;
  /**
   * Current temperature in Celsius
   */
  temperature: number;
  /**
   * Feels like temperature in Celsius
   */
  feelsLike?: number;
  /**
   * Current weather condition
   */
  condition: WeatherCondition;
  /**
   * Time period (day or night)
   */
  timePeriod?: WeatherTimePeriod;
  /**
   * Humidity percentage (0-100)
   */
  humidity?: number;
  /**
   * Wind speed in km/h
   */
  windSpeed?: number;
  /**
   * Wind direction in degrees (0-360)
   */
  windDirection?: number;
  /**
   * Precipitation probability (0-100)
   */
  precipitationChance?: number;
  /**
   * Type of precipitation
   */
  precipitationType?: PrecipitationType;
  /**
   * Sunrise time (Date object)
   */
  sunrise?: Date;
  /**
   * Sunset time (Date object)
   */
  sunset?: Date;
  /**
   * UV index (0-11+)
   */
  uvIndex?: number;
  /**
   * Forecast for upcoming days
   */
  forecast?: WeatherForecastDay[];
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether the widget is loading
   */
  loading?: boolean;
  /**
   * Whether to use celsius (true) or fahrenheit (false)
   */
  useCelsius?: boolean;
  /**
   * Number of forecast days to show
   */
  forecastDays?: number;
  /**
   * Whether to show detailed metrics
   */
  showDetails?: boolean;
  /**
   * Last updated timestamp
   */
  lastUpdated?: Date;
  /**
   * Error message if weather data failed to load
   */
  error?: string;
}

/**
 * Weather widget for displaying current conditions and forecast
 */
export const WeatherWidget = ({
  location,
  temperature,
  feelsLike,
  condition,
  timePeriod = 'day',
  humidity,
  windSpeed,
  windDirection,
  precipitationChance = 0,
  precipitationType = 'none',
  sunrise,
  sunset,
  uvIndex,
  forecast = [],
  className = '',
  loading = false,
  useCelsius = true,
  forecastDays = 5,
  showDetails = true,
  lastUpdated,
  error
}: WeatherWidgetProps) => {

  // Format time (HH:MM)
  const formatTime = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format day name
  const getDayName = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'short' });
  };
  
  // Format temperature with unit
  const formatTemp = (temp: number) => {
    if (useCelsius) {
      return `${Math.round(temp)}°C`;
    } else {
      // Convert to Fahrenheit
      const tempF = (temp * 9/5) + 32;
      return `${Math.round(tempF)}°F`;
    }
  };
  
  // Get weather condition icon
  const getConditionIcon = (cond: WeatherCondition, time: WeatherTimePeriod = 'day') => {
    const iconProps = { className: "h-8 w-8" };
    
    switch (cond) {
      case 'clear':
        return time === 'day' ? <Sun {...iconProps} /> : <MoonStar {...iconProps} />;
      case 'partly-cloudy':
        return <Cloudy {...iconProps} />;
      case 'cloudy':
        return <Cloud {...iconProps} />;
      case 'rain':
        return <CloudRain {...iconProps} />;
      case 'thunderstorm':
        return <CloudLightning {...iconProps} />;
      case 'snow':
        return <CloudSnow {...iconProps} />;
      case 'fog':
        return <CloudFog {...iconProps} />;
      default:
        return <CircleAlert {...iconProps} />;
    }
  };
  
  // Get weather condition text
  const getConditionText = (cond: WeatherCondition) => {
    switch (cond) {
      case 'clear':
        return timePeriod === 'day' ? 'Clear sky' : 'Clear night';
      case 'partly-cloudy':
        return 'Partly cloudy';
      case 'cloudy':
        return 'Cloudy';
      case 'rain':
        return 'Rain';
      case 'thunderstorm':
        return 'Thunderstorm';
      case 'snow':
        return 'Snow';
      case 'fog':
        return 'Fog';
      default:
        return 'Unknown';
    }
  };
  
  // Get small forecast icons
  const getForecastIcon = (cond: WeatherCondition) => {
    const iconProps = { className: "h-5 w-5" };
    
    switch (cond) {
      case 'clear':
        return <Sun {...iconProps} />;
      case 'partly-cloudy':
      case 'cloudy':
        return <Cloudy {...iconProps} />;
      case 'rain':
        return <CloudRain {...iconProps} />;
      case 'thunderstorm':
        return <CloudLightning {...iconProps} />;
      case 'snow':
        return <CloudSnow {...iconProps} />;
      case 'fog':
        return <CloudFog {...iconProps} />;
      default:
        return <CircleAlert {...iconProps} />;
    }
  };
  
  // Get UV index level description
  const getUVIndexLevel = (index?: number) => {
    if (index === undefined) return 'Unknown';
    if (index <= 2) return 'Low';
    if (index <= 5) return 'Moderate';
    if (index <= 7) return 'High';
    if (index <= 10) return 'Very High';
    return 'Extreme';
  };
  
  // Get precipitation chance text
  const getPrecipitationText = () => {
    if (precipitationChance === 0 || precipitationType === 'none') {
      return 'No precipitation expected';
    }
    
    return `${precipitationChance}% chance of ${precipitationType}`;
  };
  
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
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 bg-slate-200 rounded-full animate-pulse"></div>
            <div className="h-8 bg-slate-200 rounded w-16 animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse"></div>
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
          <CardTitle className="text-lg">{location}</CardTitle>
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
  
  // Determine whether to show precipitation info
  const showPrecipitation = precipitationChance > 0 || precipitationType !== 'none';

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>{location}</span>
          {lastUpdated && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs font-normal text-slate-500">
                    Updated {formatTime(lastUpdated)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Last updated: {lastUpdated.toLocaleString()}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="flex justify-between items-center mb-4">
          {/* Current conditions */}
          <div className="flex items-center gap-3">
            {getConditionIcon(condition, timePeriod)}
            <div>
              <div className="text-2xl font-bold">{formatTemp(temperature)}</div>
              {feelsLike !== undefined && Math.abs(feelsLike - temperature) > 1 && (
                <div className="text-xs text-slate-500">
                  Feels like {formatTemp(feelsLike)}
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm">{getConditionText(condition)}</div>
            {showPrecipitation && (
              <div className="text-xs text-slate-500">{getPrecipitationText()}</div>
            )}
          </div>
        </div>
        
        {/* Detailed metrics */}
        {showDetails && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {humidity !== undefined && (
              <div className="flex flex-col items-center justify-center p-2 bg-slate-50 rounded-md">
                <Droplets className="h-4 w-4 mb-1 text-terrafusion-blue-500" />
                <div className="text-sm font-medium">{humidity}%</div>
                <div className="text-xs text-slate-500">Humidity</div>
              </div>
            )}
            
            {windSpeed !== undefined && (
              <div className="flex flex-col items-center justify-center p-2 bg-slate-50 rounded-md">
                <div className="flex items-center mb-1">
                  <Wind className="h-4 w-4 text-slate-500" />
                  {windDirection !== undefined && (
                    <Compass 
                      className="h-4 w-4 ml-1" 
                      style={{ transform: `rotate(${windDirection}deg)` }}
                    />
                  )}
                </div>
                <div className="text-sm font-medium">{windSpeed} km/h</div>
                <div className="text-xs text-slate-500">Wind</div>
              </div>
            )}
            
            {uvIndex !== undefined && (
              <div className="flex flex-col items-center justify-center p-2 bg-slate-50 rounded-md">
                <Sun className="h-4 w-4 mb-1 text-terrafusion-soil-500" />
                <div className="text-sm font-medium">{uvIndex}</div>
                <div className="text-xs text-slate-500">UV ({getUVIndexLevel(uvIndex)})</div>
              </div>
            )}
            
            {(sunrise || sunset) && (
              <div className="flex flex-col items-center justify-center p-2 bg-slate-50 rounded-md">
                {timePeriod === 'day' ? (
                  <>
                    <Sunset className="h-4 w-4 mb-1 text-terrafusion-soil-500" />
                    <div className="text-sm font-medium">{formatTime(sunset)}</div>
                    <div className="text-xs text-slate-500">Sunset</div>
                  </>
                ) : (
                  <>
                    <Sunrise className="h-4 w-4 mb-1 text-terrafusion-soil-400" />
                    <div className="text-sm font-medium">{formatTime(sunrise)}</div>
                    <div className="text-xs text-slate-500">Sunrise</div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Forecast */}
        {forecast.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2">Forecast</div>
            <div className="grid grid-cols-5 gap-1">
              {forecast.slice(0, forecastDays).map((day, index) => (
                <div 
                  key={index} 
                  className="flex flex-col items-center"
                >
                  <div className="text-xs">{getDayName(day.date)}</div>
                  <div className="my-1">{getForecastIcon(day.condition)}</div>
                  <div className="flex flex-col items-center">
                    <div className="text-xs font-medium">{formatTemp(day.temperatureHigh)}</div>
                    <div className="text-xs text-slate-400">{formatTemp(day.temperatureLow)}</div>
                  </div>
                  {day.precipitationChance > 10 && (
                    <div className="text-xs text-terrafusion-blue-500 mt-1">
                      {day.precipitationChance}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};