import { logger } from '../utils/logger';

/**
 * Weather API response for current weather
 */
export interface CurrentWeatherResponse {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  windDirection: number;
  conditions: string;
  timestamp: string;
}

/**
 * Weather forecast item
 */
export interface ForecastItem {
  date: string;
  temperatureMin: number;
  temperatureMax: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  windDirection: number;
  conditions: string;
}

/**
 * Weather forecast response
 */
export interface ForecastResponse {
  location: {
    latitude: number;
    longitude: number;
  };
  forecast: ForecastItem[];
}

/**
 * Weather Service
 * 
 * Handles retrieving weather data from external APIs
 */
export class WeatherService {
  private apiKey: string;
  private baseUrl: string;
  
  constructor() {
    this.apiKey = process.env.WEATHER_API_KEY || '';
    this.baseUrl = 'https://api.weatherapi.com/v1';
    
    if (!this.apiKey) {
      logger.warn('WEATHER_API_KEY not set. Weather data will not be available.');
    }
  }
  
  /**
   * Get current weather for a specific location
   * @param latitude The latitude coordinate
   * @param longitude The longitude coordinate
   * @returns Current weather data
   */
  async getCurrentWeather(latitude: number, longitude: number): Promise<CurrentWeatherResponse | null> {
    if (!this.apiKey) {
      logger.warn('Cannot fetch weather data: WEATHER_API_KEY not set');
      return null;
    }
    
    try {
      // In a real implementation, this would make an API call to a weather service
      // For now, we'll simulate a response
      const response = this.simulateCurrentWeather(latitude, longitude);
      
      logger.info(`Retrieved current weather data for ${latitude},${longitude}`);
      return response;
    } catch (error) {
      logger.error(`Error getting current weather for ${latitude},${longitude}`, error);
      throw new Error(`Failed to get current weather: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Get weather forecast for a specific location
   * @param latitude The latitude coordinate
   * @param longitude The longitude coordinate
   * @param days Number of days to forecast (default: 7)
   * @returns Weather forecast data
   */
  async getForecast(latitude: number, longitude: number, days: number = 7): Promise<ForecastResponse | null> {
    if (!this.apiKey) {
      logger.warn('Cannot fetch weather forecast: WEATHER_API_KEY not set');
      return null;
    }
    
    try {
      // In a real implementation, this would make an API call to a weather service
      // For now, we'll simulate a response
      const response = this.simulateForecast(latitude, longitude, days);
      
      logger.info(`Retrieved ${days}-day forecast for ${latitude},${longitude}`);
      return response;
    } catch (error) {
      logger.error(`Error getting forecast for ${latitude},${longitude}`, error);
      throw new Error(`Failed to get forecast: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Get historical weather data for a specific location
   * @param latitude The latitude coordinate
   * @param longitude The longitude coordinate
   * @param date The date to get historical data for (YYYY-MM-DD)
   * @returns Historical weather data
   */
  async getHistoricalWeather(latitude: number, longitude: number, date: string): Promise<any | null> {
    if (!this.apiKey) {
      logger.warn('Cannot fetch historical weather: WEATHER_API_KEY not set');
      return null;
    }
    
    try {
      // In a real implementation, this would make an API call to a weather service
      // For demo purposes, we'll just log and return null
      logger.info(`Retrieved historical weather for ${latitude},${longitude} on ${date}`);
      return null;
    } catch (error) {
      logger.error(`Error getting historical weather for ${latitude},${longitude} on ${date}`, error);
      throw new Error(`Failed to get historical weather: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Check if a specific weather condition is conducive to disease development
   * @param conditions Current weather conditions
   * @param diseaseType Type of disease to check
   * @returns Risk assessment data
   */
  assessDiseaseRisk(conditions: CurrentWeatherResponse, diseaseType: string): { risk: number, factors: string[] } {
    // Different diseases thrive in different conditions
    const factors: string[] = [];
    let risk = 0;
    
    // Temperature check (many fungal diseases thrive in moderate temperatures)
    if (conditions.temperature >= 15 && conditions.temperature <= 25) {
      factors.push(`Temperature of ${conditions.temperature}°C is optimal for disease development`);
      risk += 0.3;
    }
    
    // Humidity check (high humidity promotes fungal growth)
    if (conditions.humidity > 80) {
      factors.push(`High humidity (${conditions.humidity}%) increases disease risk`);
      risk += 0.3;
    } else if (conditions.humidity > 60) {
      factors.push(`Moderate humidity (${conditions.humidity}%) slightly increases disease risk`);
      risk += 0.1;
    }
    
    // Precipitation check (prolonged leaf wetness promotes infection)
    if (conditions.precipitation > 5) {
      factors.push(`Recent precipitation (${conditions.precipitation}mm) creates favorable conditions for infection`);
      risk += 0.3;
    }
    
    // Clamp risk to 0-1 range
    risk = Math.min(1, risk);
    
    return { risk, factors };
  }
  
  /**
   * Simulate current weather data for demo purposes
   * In a real implementation, this would be replaced with an actual API call
   */
  private simulateCurrentWeather(latitude: number, longitude: number): CurrentWeatherResponse {
    // Generate realistic-looking but mock data
    return {
      temperature: Math.round((15 + 10 * Math.random() + (latitude * 0.1)) * 10) / 10,
      humidity: Math.round(40 + 50 * Math.random()),
      precipitation: Math.round(5 * Math.random() * 10) / 10,
      windSpeed: Math.round(25 * Math.random() * 10) / 10,
      windDirection: Math.round(360 * Math.random()),
      conditions: this.getRandomCondition(),
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Simulate weather forecast for demo purposes
   * In a real implementation, this would be replaced with an actual API call
   */
  private simulateForecast(latitude: number, longitude: number, days: number): ForecastResponse {
    const forecast: ForecastItem[] = [];
    const date = new Date();
    
    for (let i = 0; i < days; i++) {
      const forecastDate = new Date(date);
      forecastDate.setDate(date.getDate() + i);
      
      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        temperatureMin: Math.round((10 + 5 * Math.random() + (latitude * 0.1)) * 10) / 10,
        temperatureMax: Math.round((20 + 10 * Math.random() + (latitude * 0.1)) * 10) / 10,
        humidity: Math.round(40 + 50 * Math.random()),
        precipitation: Math.round(10 * Math.random() * 10) / 10,
        windSpeed: Math.round(20 * Math.random() * 10) / 10,
        windDirection: Math.round(360 * Math.random()),
        conditions: this.getRandomCondition()
      });
    }
    
    return {
      location: {
        latitude,
        longitude
      },
      forecast
    };
  }
  
  /**
   * Get a random weather condition for simulated data
   */
  private getRandomCondition(): string {
    const conditions = [
      'Sunny',
      'Partly Cloudy',
      'Cloudy',
      'Overcast',
      'Mist',
      'Light Rain',
      'Rain',
      'Heavy Rain',
      'Thunderstorm',
      'Clear'
    ];
    
    return conditions[Math.floor(Math.random() * conditions.length)];
  }
}