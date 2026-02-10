import { useState, useEffect, useCallback } from "react";
import { authService } from "../lib/auth-service";
import { setOnUnauthorized } from "../lib/api-client";
import { queryClient } from "../lib/query-client";
import type { User } from "../types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const logout = useCallback(async () => {
    await authService.logout();
    queryClient.clear();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => {
      setUser(null);
      setIsAuthenticated(false);
    });
  }, []);

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    setIsAuthenticated(true);
    return data;
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const data = await authService.register(name, email, password);
      setUser(data.user);
      setIsAuthenticated(true);
      return data;
    },
    []
  );

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
  };
}
