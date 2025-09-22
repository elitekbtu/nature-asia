// Chat message types
export interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  response: string;
  context?: {
    location?: string;
    disasterType?: string;
    severity?: string;
    userRole?: string;
    userLocation?: string;
    preferences?: Record<string, any>;
  };
  timestamp: string;
  type: 'chat' | 'disaster_analysis' | 'emergency_plan';
}

export interface DisasterAnalysis {
  severity: string;
  impact: string;
  recommendations: string[];
  affectedArea: {
    radius: number;
    population: number;
  };
}

export interface EmergencyPlan {
  immediateActions: string[];
  shortTermActions: string[];
  longTermActions: string[];
  resources: string[];
  timeline: {
    immediate: string;
    shortTerm: string;
    longTerm: string;
  };
}

export interface SafetyRecommendation {
  category: string;
  action: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

// API Request/Response types
export interface ChatMessageResponse {
  success: boolean;
  response: string;
  timestamp: string;
}

export interface DisasterAnalysisResponse {
  success: boolean;
  analysis: DisasterAnalysis;
  timestamp: string;
}

export interface EmergencyPlanResponse {
  success: boolean;
  plan: EmergencyPlan;
  disasterType: string;
  location: string;
  severity: string;
  timestamp: string;
}

export interface SafetyRecommendationsResponse {
  success: boolean;
  recommendations: SafetyRecommendation[];
  disasterType: string;
  userLocation: string;
  timestamp: string;
}

export interface ChatHistoryResponse {
  success: boolean;
  data: ChatMessage[];
  count: number;
}
