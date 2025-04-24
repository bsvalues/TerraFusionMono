import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Cloud, 
  CloudDrizzle, 
  CloudFog, 
  CloudLightning, 
  CloudRain, 
  CloudSnow, 
  Droplets, 
  InfoIcon, 
  Snowflake, 
  Sun, 
  ThermometerIcon, 
  Umbrella, 
  Wind 
} from "lucide-react";

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

interface CurrentWeather {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  windDirection: number;
  conditions: string;
  timestamp: string;
}

interface WeatherForecastProps {
  parcelId: string;
  parcelName: string;
  currentWeather: CurrentWeather;
  forecast: ForecastDay[];
  lastUpdated: string;
}

/**
 * A component showing weather forecast for a crop parcel
 */
export function WeatherForecast({
  parcelId,
  parcelName,
  currentWeather,
  forecast,
  lastUpdated
}: WeatherForecastProps) {
  // Get weather icon based on conditions
  const getWeatherIcon = (conditions: string, size: number = 6) => {
    const className = `h-${size} w-${size}`;
    const lowercaseConditions = conditions.toLowerCase();
    
    if (lowercaseConditions.includes('thunderstorm') || lowercaseConditions.includes('lightning')) {
      return <CloudLightning className={className} />;
    } else if (lowercaseConditions.includes('snow')) {
      return <CloudSnow className={className} />;
    } else if (lowercaseConditions.includes('fog') || lowercaseConditions.includes('mist')) {
      return <CloudFog className={className} />;
    } else if (lowercaseConditions.includes('rain') && lowercaseConditions.includes('light')) {
      return <CloudDrizzle className={className} />;
    } else if (lowercaseConditions.includes('rain') || lowercaseConditions.includes('shower')) {
      return <CloudRain className={className} />;
    } else if (lowercaseConditions.includes('cloud') || lowercaseConditions.includes('overcast')) {
      return <Cloud className={className} />;
    } else if (lowercaseConditions.includes('clear') || lowercaseConditions.includes('sunny')) {
      return <Sun className={className} />;
    } else {
      return <Cloud className={className} />;
    }
  };

  // Format date to display day name and date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // Check if it's today or tomorrow
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    
    // Otherwise show day name + date
    return new Intl.DateTimeFormat('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  // Get wind direction as cardinal point (N, NE, E, etc.)
  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  // Get temperature color based on value
  const getTemperatureColor = (temp: number) => {
    if (temp < 0) return "text-blue-600";
    if (temp < 10) return "text-blue-500";
    if (temp < 20) return "text-green-500";
    if (temp < 30) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Weather Forecast</CardTitle>
            <CardDescription>{parcelName}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="current">Current Conditions</TabsTrigger>
            <TabsTrigger value="forecast">7-Day Forecast</TabsTrigger>
          </TabsList>

          <TabsContent value="current">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex flex-col items-center md:items-start mb-4 md:mb-0">
                <div className="flex items-center">
                  {getWeatherIcon(currentWeather.conditions, 10)}
                  <span className="text-3xl font-semibold ml-2">
                    {currentWeather.temperature}°C
                  </span>
                </div>
                <div className="text-lg text-muted-foreground mt-1">
                  {currentWeather.conditions}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div className="flex items-center">
                  <Droplets className="h-5 w-5 text-blue-500 mr-2" />
                  <div>
                    <div className="text-sm text-muted-foreground">Humidity</div>
                    <div className="font-medium">{currentWeather.humidity}%</div>
                  </div>
                </div>

                <div className="flex items-center">
                  <Umbrella className="h-5 w-5 text-blue-500 mr-2" />
                  <div>
                    <div className="text-sm text-muted-foreground">Precipitation</div>
                    <div className="font-medium">{currentWeather.precipitation} mm</div>
                  </div>
                </div>

                <div className="flex items-center">
                  <Wind className="h-5 w-5 text-blue-500 mr-2" />
                  <div>
                    <div className="text-sm text-muted-foreground">Wind Speed</div>
                    <div className="font-medium">{currentWeather.windSpeed} km/h</div>
                  </div>
                </div>

                <div className="flex items-center">
                  <Badge variant="outline" className="mr-2">
                    {getWindDirection(currentWeather.windDirection)}
                  </Badge>
                  <div>
                    <div className="text-sm text-muted-foreground">Wind Direction</div>
                    <div className="font-medium">{currentWeather.windDirection}°</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="forecast">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {forecast.map((day, index) => (
                <div key={index} className="rounded-lg border p-3 text-center">
                  <div className="font-medium">{formatDate(day.date)}</div>
                  <div className="flex justify-center my-2">
                    {getWeatherIcon(day.conditions)}
                  </div>
                  <div className="text-sm">{day.conditions}</div>
                  <div className="flex justify-between mt-3">
                    <span className={getTemperatureColor(day.temperatureMin)}>
                      {day.temperatureMin}°
                    </span>
                    <span className={getTemperatureColor(day.temperatureMax)}>
                      {day.temperatureMax}°
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center justify-center">
                      <Umbrella className="h-3 w-3 mr-1" />
                      {day.precipitation} mm
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Weather Impact on Crop Health</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="border rounded-lg p-3">
                  <div className="flex items-center">
                    <ThermometerIcon className="h-5 w-5 text-orange-500 mr-2" />
                    <div className="font-medium">Temperature</div>
                  </div>
                  <div className="mt-1 text-sm">
                    {forecast[0].temperatureMax > 30 
                      ? "High temperatures may cause heat stress. Consider additional irrigation."
                      : forecast[0].temperatureMin < 5
                        ? "Low temperatures may slow growth. Monitor for frost damage."
                        : "Temperature range is optimal for growth."}
                  </div>
                </div>

                <div className="border rounded-lg p-3">
                  <div className="flex items-center">
                    <Droplets className="h-5 w-5 text-blue-500 mr-2" />
                    <div className="font-medium">Moisture</div>
                  </div>
                  <div className="mt-1 text-sm">
                    {forecast.slice(0, 3).reduce((sum, day) => sum + day.precipitation, 0) > 15
                      ? "High precipitation forecasted. Monitor for disease pressure."
                      : forecast.slice(0, 3).reduce((sum, day) => sum + day.precipitation, 0) < 2
                        ? "Low precipitation forecasted. Consider supplemental irrigation."
                        : "Moisture levels appear adequate for growth."}
                  </div>
                </div>

                <div className="border rounded-lg p-3">
                  <div className="flex items-center">
                    <Wind className="h-5 w-5 text-blue-500 mr-2" />
                    <div className="font-medium">Wind</div>
                  </div>
                  <div className="mt-1 text-sm">
                    {forecast.some(day => day.windSpeed > 25)
                      ? "High winds expected. Secure any loose structures and check crop supports."
                      : "Wind conditions are normal. Good for pollination and reducing humidity."}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="pt-0 text-xs text-muted-foreground">
        <div className="flex items-center">
          <InfoIcon className="h-3 w-3 mr-1" />
          Last updated: {lastUpdated}
        </div>
      </CardFooter>
    </Card>
  );
}