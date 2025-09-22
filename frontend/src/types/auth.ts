// User types
export interface User {
  uid: string;
  email: string;
  name?: string;
  picture?: string;
  emailVerified: boolean;
  createdAt?: string;
  lastLoginAt?: string;
  preferences?: UserPreferences;
  role?: string;
  location?: string;
}

export interface UserPreferences {
  notifications: boolean;
  language: string;
  region: string;
}

export interface UserProfile extends User {
  updatedAt?: string;
}

// API Request/Response types
export interface AuthResponse {
  success: boolean;
  user: User;
}

export interface UpdateProfileRequest {
  name?: string;
  preferences?: Partial<UserPreferences>;
}

// Error types
export interface AuthError {
  success: false;
  error: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}
