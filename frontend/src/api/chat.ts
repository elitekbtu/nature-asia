import { ApiClient } from './client';
import type { 
  ChatMessageResponse, 
  DisasterAnalysisResponse, 
  EmergencyPlanResponse, 
  SafetyRecommendationsResponse, 
  ChatHistoryResponse 
} from '../types/chat';

export class ChatAPI {
  // Send a message to AI chat
  static async sendMessage(
    message: string, 
    context?: {
      location?: string;
      disasterType?: string;
      severity?: string;
    }
  ): Promise<ChatMessageResponse> {
    return ApiClient.post<ChatMessageResponse>('/chat/message', { message, context });
  }

  // Analyze a specific disaster
  static async analyzeDisaster(disasterData: {
    type: string;
    magnitude?: number;
    location: {
      latitude: number;
      longitude: number;
    };
    timestamp: string;
  }): Promise<DisasterAnalysisResponse> {
    return ApiClient.post<DisasterAnalysisResponse>('/chat/analyze-disaster', { disasterData });
  }

  // Generate emergency response plan
  static async generateEmergencyPlan(
    disasterType: 'earthquake' | 'tsunami' | 'volcanic' | 'weather',
    location: string,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<EmergencyPlanResponse> {
    return ApiClient.post<EmergencyPlanResponse>('/chat/emergency-plan', {
      disasterType,
      location,
      severity
    });
  }

  // Get safety recommendations
  static async getSafetyRecommendations(
    disasterType: 'earthquake' | 'tsunami' | 'volcanic' | 'weather',
    userLocation: string
  ): Promise<SafetyRecommendationsResponse> {
    return ApiClient.post<SafetyRecommendationsResponse>('/chat/safety-recommendations', {
      disasterType,
      userLocation
    });
  }

  // Get user's chat history
  static async getChatHistory(
    limit: number = 20,
    type?: 'chat' | 'disaster_analysis' | 'emergency_plan'
  ): Promise<ChatHistoryResponse> {
    return ApiClient.get<ChatHistoryResponse>('/chat/history', {
      params: { limit, type }
    });
  }

  // Delete a specific chat history entry
  static async deleteChatHistory(id: string): Promise<{ success: boolean; message: string }> {
    return ApiClient.delete<{ success: boolean; message: string }>(`/chat/history/${id}`);
  }
}
