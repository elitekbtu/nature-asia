// V2V types
export type VehicleType = 'car' | 'truck' | 'motorcycle' | 'bus' | 'emergency';
export type MessageType = 'info' | 'warning' | 'emergency';
export type MessagePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface VehicleLocation {
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  timestamp: string;
}

export interface Vehicle {
  id: string;
  vehicleType: VehicleType;
  make: string;
  model: string;
  year: number;
  location: VehicleLocation;
  userId: string;
  ownerEmail: string;
  status: 'active' | 'inactive' | 'maintenance';
  registeredAt: string;
  lastUpdated: string;
}

export interface V2VMessage {
  id: string;
  senderVehicleId: string;
  targetVehicleId: string;
  message: string;
  type: MessageType;
  priority: MessagePriority;
  aiEnhanced: boolean;
  timestamp: string;
  senderInfo: {
    vehicleId: string;
    userId: string;
  };
  location?: VehicleLocation;
}

export interface EmergencyMessage {
  id: string;
  emergencyType: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: VehicleLocation;
  senderInfo: {
    vehicleId: string;
    userId: string;
  };
  broadcastCount: number;
  timestamp: string;
}

export interface V2VStats {
  totalVehicles: number;
  activeVehicles: number;
  totalMessages: number;
  messagesLast24h: number;
  emergencyMessages: number;
  averageResponseTime: number;
  byVehicleType: Record<VehicleType, number>;
  geographicDistribution: Record<string, number>;
}

// API Request/Response types
export interface VehicleRegistrationResponse {
  success: boolean;
  vehicleId: string;
  data: Vehicle;
}

export interface VehicleLocationUpdateResponse {
  success: boolean;
  message: string;
}

export interface V2VMessageResponse {
  success: boolean;
  messageId: string;
  data: V2VMessage;
  aiEnhanced: boolean;
}

export interface EmergencyBroadcastResponse {
  success: boolean;
  messageId: string;
  broadcastCount: number;
}

export interface NearbyVehiclesResponse {
  success: boolean;
  data: Vehicle[];
  count: number;
  radius: number;
}

export interface V2VMessagesResponse {
  success: boolean;
  data: V2VMessage[];
  count: number;
}

export interface VehicleStatusResponse {
  success: boolean;
  data: Vehicle;
}

export interface AIResponseResponse {
  success: boolean;
  response: string;
  timestamp: string;
}

export interface V2VStatsResponse {
  success: boolean;
  data: V2VStats;
}
