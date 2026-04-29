import type { ApiResponse } from "./api.js";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface AuthPayload {
  token?: string;
}

export type AuthResponse = ApiResponse<AuthPayload | null>;
