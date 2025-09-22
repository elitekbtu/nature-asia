import { ApiClient } from './client';
import type { 
  AnalyticsResponse, 
  HistoricalAnalyticsResponse, 
  DashboardResponse, 
  TrendsResponse, 
  GeographicResponse, 
  PredictionsResponse 
} from '../types/analytics';

export class AnalyticsAPI {
  // Get disaster analytics
  static async getDisasterAnalytics(
    timeRange: '24h' | '7d' | '30d' | '90d' = '7d',
    forceRefresh: boolean = false
  ): Promise<AnalyticsResponse> {
    return ApiClient.get<AnalyticsResponse>('/analytics/disasters', {
      params: { timeRange, forceRefresh }
    });
  }

  // Get historical analytics
  static async getHistoricalAnalytics(limit: number = 10): Promise<HistoricalAnalyticsResponse> {
    return ApiClient.get<HistoricalAnalyticsResponse>('/analytics/historical', {
      params: { limit }
    });
  }

  // Get dashboard analytics summary
  static async getDashboardAnalytics(): Promise<DashboardResponse> {
    return ApiClient.get<DashboardResponse>('/analytics/dashboard');
  }

  // Get trend analysis
  static async getTrends(
    type: 'disasters' | 'earthquakes' | 'weather' | 'volcanic' = 'disasters',
    period: '7d' | '30d' | '90d' = '30d'
  ): Promise<TrendsResponse> {
    return ApiClient.get<TrendsResponse>('/analytics/trends', {
      params: { type, period }
    });
  }

  // Get geographic analysis
  static async getGeographicAnalysis(
    region?: string,
    level: 'country' | 'state' | 'city' = 'country'
  ): Promise<GeographicResponse> {
    return ApiClient.get<GeographicResponse>('/analytics/geographic', {
      params: { region, level }
    });
  }

  // Get disaster predictions
  static async getPredictions(horizon: '24h' | '7d' | '30d' = '7d'): Promise<PredictionsResponse> {
    return ApiClient.get<PredictionsResponse>('/analytics/predictions', {
      params: { horizon }
    });
  }
}
