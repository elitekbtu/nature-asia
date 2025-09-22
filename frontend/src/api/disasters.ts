import { ApiClient } from './client';
import type { 
  DisastersResponse, 
  DisasterStatsResponse, 
  EarthquakesResponse, 
  WeatherAlertsResponse, 
  TsunamiWarningsResponse, 
  VolcanicActivityResponse 
} from '../types/disasters';

export class DisastersAPI {
  // Get all disaster data with optional filtering
  static async getDisasters(params?: {
    type?: 'earthquake' | 'weather' | 'tsunami' | 'volcanic';
    severity?: 'low' | 'medium' | 'high' | 'critical';
    limit?: number;
    days?: number;
  }): Promise<DisastersResponse> {
    return ApiClient.get<DisastersResponse>('/disasters', { params });
  }

  // Get disaster statistics
  static async getDisasterStats(): Promise<DisasterStatsResponse> {
    return ApiClient.get<DisasterStatsResponse>('/disasters/stats');
  }

  // Get earthquake data specifically
  static async getEarthquakes(params?: {
    minMagnitude?: number;
    days?: number;
  }): Promise<EarthquakesResponse> {
    return ApiClient.get<EarthquakesResponse>('/disasters/earthquakes', { params });
  }

  // Get weather alerts
  static async getWeatherAlerts(): Promise<WeatherAlertsResponse> {
    return ApiClient.get<WeatherAlertsResponse>('/disasters/weather');
  }

  // Get tsunami warnings
  static async getTsunamiWarnings(): Promise<TsunamiWarningsResponse> {
    return ApiClient.get<TsunamiWarningsResponse>('/disasters/tsunami');
  }

  // Get volcanic activity
  static async getVolcanicActivity(): Promise<VolcanicActivityResponse> {
    return ApiClient.get<VolcanicActivityResponse>('/disasters/volcanic');
  }
}
