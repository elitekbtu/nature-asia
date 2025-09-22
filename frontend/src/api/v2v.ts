import { ApiClient } from './client';
import type { 
  VehicleRegistrationResponse, 
  VehicleLocationUpdateResponse, 
  V2VMessageResponse, 
  EmergencyBroadcastResponse, 
  NearbyVehiclesResponse, 
  V2VMessagesResponse, 
  VehicleStatusResponse, 
  AIResponseResponse, 
  V2VStatsResponse 
} from '../types/v2v';

export class V2VAPI {
  // Register a new vehicle
  static async registerVehicle(vehicleData: {
    vehicleType: 'car' | 'truck' | 'motorcycle' | 'bus' | 'emergency';
    make: string;
    model: string;
    year: number;
    location: {
      latitude: number;
      longitude: number;
      heading?: number;
      speed?: number;
    };
  }): Promise<VehicleRegistrationResponse> {
    return ApiClient.post<VehicleRegistrationResponse>('/v2v/register', vehicleData);
  }

  // Update vehicle location
  static async updateVehicleLocation(
    vehicleId: string,
    locationData: {
      latitude: number;
      longitude: number;
      heading?: number;
      speed?: number;
    }
  ): Promise<VehicleLocationUpdateResponse> {
    return ApiClient.put<VehicleLocationUpdateResponse>(`/v2v/${vehicleId}/location`, locationData);
  }

  // Send V2V message with AI enhancement
  static async sendMessage(
    vehicleId: string,
    messageData: {
      targetVehicleId: string;
      message: string;
      type?: 'info' | 'warning' | 'emergency';
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      useAI?: boolean;
    }
  ): Promise<V2VMessageResponse> {
    return ApiClient.post<V2VMessageResponse>(`/v2v/${vehicleId}/message`, messageData);
  }

  // Broadcast emergency message
  static async broadcastEmergency(
    vehicleId: string,
    emergencyData: {
      emergencyType: string;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      location?: {
        latitude: number;
        longitude: number;
      };
    }
  ): Promise<EmergencyBroadcastResponse> {
    return ApiClient.post<EmergencyBroadcastResponse>(`/v2v/${vehicleId}/emergency`, emergencyData);
  }

  // Get nearby vehicles
  static async getNearbyVehicles(
    vehicleId: string,
    radius: number = 10
  ): Promise<NearbyVehiclesResponse> {
    return ApiClient.get<NearbyVehiclesResponse>(`/v2v/${vehicleId}/nearby`, {
      params: { radius }
    });
  }

  // Get V2V messages for vehicle
  static async getV2VMessages(
    vehicleId: string,
    limit: number = 50
  ): Promise<V2VMessagesResponse> {
    return ApiClient.get<V2VMessagesResponse>(`/v2v/${vehicleId}/messages`, {
      params: { limit }
    });
  }

  // Get vehicle status
  static async getVehicleStatus(vehicleId: string): Promise<VehicleStatusResponse> {
    return ApiClient.get<VehicleStatusResponse>(`/v2v/${vehicleId}/status`);
  }

  // Generate AI response for V2V message
  static async generateAIResponse(
    vehicleId: string,
    messageData: {
      message: string;
      context?: {
        location?: string;
        weather?: string;
        traffic?: string;
      };
    }
  ): Promise<AIResponseResponse> {
    return ApiClient.post<AIResponseResponse>(`/v2v/${vehicleId}/ai-response`, messageData);
  }

  // Get V2V system statistics
  static async getV2VStats(): Promise<V2VStatsResponse> {
    return ApiClient.get<V2VStatsResponse>('/v2v/stats');
  }
}
