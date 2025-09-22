// Disaster types
export type DisasterType = 'earthquake' | 'weather' | 'tsunami' | 'volcanic';
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface DisasterLocation {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
}

export interface Disaster {
  id: string;
  type: DisasterType;
  severity: SeverityLevel;
  title: string;
  description: string;
  location: DisasterLocation;
  magnitude?: number; // For earthquakes
  intensity?: string; // For earthquakes
  windSpeed?: number; // For weather
  waveHeight?: number; // For tsunamis
  ashCloudHeight?: number; // For volcanic
  timestamp: string;
  source: string;
  url?: string;
  affectedArea?: {
    radius: number;
    population: number;
  };
  casualties?: {
    deaths: number;
    injured: number;
    missing: number;
  };
  damage?: {
    buildings: number;
    infrastructure: string[];
  };
}

export interface DisasterFilters {
  type?: DisasterType;
  severity?: SeverityLevel;
  limit?: number;
  days?: number;
  minMagnitude?: number;
}

export interface DisasterStats {
  total: number;
  byType: Record<DisasterType, number>;
  bySeverity: Record<SeverityLevel, number>;
  recent24h: number;
  recent7d: number;
  recent30d: number;
  geographicDistribution: Record<string, number>;
  trends: {
    daily: Record<string, number>;
    weekly: Record<string, number>;
    monthly: Record<string, number>;
  };
  lastUpdated: string;
}

// API Response types
export interface DisastersResponse {
  success: boolean;
  data: Disaster[];
  count: number;
  filters: DisasterFilters;
  lastUpdated: string;
}

export interface DisasterStatsResponse {
  success: boolean;
  data: DisasterStats;
  lastUpdated: string;
}

export interface EarthquakesResponse {
  success: boolean;
  data: Disaster[];
  count: number;
  filters: {
    minMagnitude: number;
    days: number;
  };
  lastUpdated: string;
}

export interface WeatherAlertsResponse {
  success: boolean;
  data: Disaster[];
  count: number;
  lastUpdated: string;
}

export interface TsunamiWarningsResponse {
  success: boolean;
  data: Disaster[];
  count: number;
  lastUpdated: string;
}

export interface VolcanicActivityResponse {
  success: boolean;
  data: Disaster[];
  count: number;
  lastUpdated: string;
}
