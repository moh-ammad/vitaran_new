import "server-only";
import { apiClient } from "@/services/api-client";
import type { AdminLoginResult, AdminProfile } from "@/types/auth";

export function loginAdmin(credentials: { email: string; password: string }) {
  return apiClient<AdminLoginResult>("/auth/login", {
    method: "POST",
    body: credentials,
    cache: "no-store",
  });
}

export async function fetchCurrentAdmin(token: string): Promise<AdminProfile> {
  const { admin } = await apiClient<{ admin: AdminProfile }>("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return admin;
}
