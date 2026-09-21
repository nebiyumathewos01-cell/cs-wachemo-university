import apiClient from "./client";
import type { AuthResponse, LoginCredentials, RegisterData, User } from "@/types";

export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<AuthResponse>("/auth/login", credentials),

  register: (data: RegisterData) =>
    apiClient.post<AuthResponse>("/auth/register", data),

  logout: () =>
    apiClient.post("/auth/logout"),

  me: () =>
    apiClient.get<User>("/auth/me"),

  selectYear: (academic_year_id: number) =>
    apiClient.patch<User>("/auth/me/year", { academic_year_id }),
};
