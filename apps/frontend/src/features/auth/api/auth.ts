import type { AuthResponse, LoginRequest, RegisterRequest } from "@medicine/shared";
import { API_BASE_URL } from "@/lib/api-config";

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify(data)
  });
  return response.json();
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify(data)
  });
  return response.json();
}
