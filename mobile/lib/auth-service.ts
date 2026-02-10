import { storage } from "./storage";
import { api } from "./api-client";
import type { AuthResponse, User } from "../types";

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const data = await api.post<AuthResponse>("/api/mobile/auth/login", {
      email,
      password,
    });
    await storage.setToken(data.token);
    await storage.setUser(data.user);
    return data;
  },

  async register(
    name: string,
    email: string,
    password: string
  ): Promise<AuthResponse> {
    const data = await api.post<AuthResponse>("/api/mobile/auth/register", {
      name,
      email,
      password,
    });
    await storage.setToken(data.token);
    await storage.setUser(data.user);
    return data;
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = await storage.getToken();
      if (!token) return null;
      return await api.get<User>("/api/mobile/auth/me");
    } catch {
      return null;
    }
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await storage.getToken();
    if (!token) return false;
    const user = await this.getCurrentUser();
    return user !== null;
  },

  async logout(): Promise<void> {
    await storage.clear();
  },
};
