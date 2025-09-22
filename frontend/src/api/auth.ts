import { ApiClient } from './client';
import type { AuthResponse, User, UpdateProfileRequest } from '../types/auth';

export class AuthAPI {
  // Verify Firebase ID token and get user info
  static async verifyToken(idToken: string): Promise<AuthResponse> {
    return ApiClient.post<AuthResponse>('/auth/verify', { idToken });
  }

  // Get current user profile
  static async getProfile(): Promise<{ success: boolean; user: User }> {
    return ApiClient.get<{ success: boolean; user: User }>('/auth/profile');
  }

  // Update user profile
  static async updateProfile(data: UpdateProfileRequest): Promise<{ success: boolean; message: string }> {
    return ApiClient.put<{ success: boolean; message: string }>('/auth/profile', data);
  }

  // Delete user account
  static async deleteAccount(): Promise<{ success: boolean; message: string }> {
    return ApiClient.delete<{ success: boolean; message: string }>('/auth/account');
  }
}
