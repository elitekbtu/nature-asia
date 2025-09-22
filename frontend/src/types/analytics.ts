// Analytics data types
export interface AnalyticsSummary {
  total: number;
  recent24h: number;
  recent7d: number;
  recent30d: number;
  byType: {
    earthquake: number;
    weather: number;
    tsunami: number;
    volcanic: number;
  };
}

export interface SeverityData {
  overall: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  byType: {
    earthquake: { low: number; medium: number; high: number; critical: number };
    weather: { low: number; medium: number; high: number; critical: number };
    tsunami: { low: number; medium: number; high: number; critical: number };
    volcanic: { low: number; medium: number; high: number; critical: number };
  };
}

export interface GeographicData {
  regions: Record<string, number>;
  hotspots: Array<{
    location: string;
    count: number;
    severity: string;
  }>;
  distribution: Record<string, number>;
}

export interface TrendData {
  daily: Record<string, {
    total: number;
    byType: Record<string, number>;
  }>;
  weekly: Record<string, {
    total: number;
    byType: Record<string, number>;
  }>;
  monthly: Record<string, {
    total: number;
    byType: Record<string, number>;
  }>;
}

export interface PredictionData {
  next24h?: {
    probability: number;
    confidence: 'low' | 'medium' | 'high';
  };
  next7d?: {
    probability: number;
    confidence: 'low' | 'medium' | 'high';
  };
  next30d?: {
    probability: number;
    confidence: 'low' | 'medium' | 'high';
  };
  seasonal?: {
    probability: number;
    confidence: 'low' | 'medium' | 'high';
  };
}

export interface Analytics {
  summary: AnalyticsSummary;
  severity: SeverityData;
  geographic: GeographicData;
  trends: TrendData;
  predictions: PredictionData;
  lastUpdated: string;
}

export interface Alert {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
}

// API Response types
export interface AnalyticsResponse {
  success: boolean;
  data: Analytics;
  lastUpdated: string;
}

export interface HistoricalAnalyticsResponse {
  success: boolean;
  data: Analytics[];
  count: number;
}

export interface DashboardResponse {
  success: boolean;
  data: {
    current: Analytics;
    historical: Analytics[];
    alerts: Alert[];
    lastUpdated: string;
  };
}

export interface TrendsResponse {
  success: boolean;
  data: {
    type: string;
    period: string;
    trends: TrendData;
    summary: AnalyticsSummary;
    predictions: PredictionData;
  };
  lastUpdated: string;
}

export interface GeographicResponse {
  success: boolean;
  data: {
    level: string;
    region?: string;
    geographic: GeographicData;
    hotspots: Array<{
      location: string;
      count: number;
      severity: string;
    }>;
    distribution: Record<string, number>;
  };
  lastUpdated: string;
}

export interface PredictionsResponse {
  success: boolean;
  data: {
    horizon: string;
    predictions: PredictionData;
    confidence: 'low' | 'medium' | 'high';
    lastUpdated: string;
  };
}
