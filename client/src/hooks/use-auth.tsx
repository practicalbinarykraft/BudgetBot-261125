import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, RegisterData>;
};

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = InsertUser;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Проверяем, находимся ли мы в админ-панели
  // В админ-панели используется отдельная система аутентификации
  const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    // Не загружаем данные в админ-панели
    enabled: !isAdminRoute,
    retry: (failureCount, error) => {
      // Логируем ошибки при запросе /api/user
      if (error) {
        console.log('[Auth] /api/user query error:', error.message);
      }
      // Не повторяем запрос при 401 (пользователь не авторизован)
      if (error && error.message.includes('401')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      console.log('[Auth] Login successful, user:', user);
      // Небольшая задержка перед инвалидацией, чтобы дать время сессии установиться
      setTimeout(() => {
        console.log('[Auth] Invalidating /api/user query after login');
        // Инвалидируем запрос, чтобы сделать реальный запрос к /api/user
        // Это проверит, что сессия действительно установлена
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      }, 200);
    },
    onError: (error: Error) => {
      console.error('[Auth] Login failed:', error);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      console.log('[Auth] Registration successful, user:', user);
      // Небольшая задержка перед инвалидацией, чтобы дать время сессии установиться
      setTimeout(() => {
        console.log('[Auth] Invalidating /api/user query after registration');
        // Инвалидируем запрос, чтобы сделать реальный запрос к /api/user
        // Это проверит, что сессия действительно установлена
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      }, 200);
    },
    onError: (error: Error) => {
      console.error('[Auth] Registration failed:', error);
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
