/**
 * Test: queryClient.removeQueries() is called on login/register
 * so stale cached data from a previous session is cleared.
 */
import { renderHook, act } from "@testing-library/react-native";
import { queryClient } from "../../lib/query-client";
import { authService } from "../../lib/auth-service";

jest.mock("../../lib/auth-service", () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    getCurrentUser: jest.fn().mockResolvedValue(null),
    logout: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("../../lib/query-client", () => ({
  queryClient: {
    removeQueries: jest.fn(),
    clear: jest.fn(),
  },
}));

jest.mock("../../lib/api-client", () => ({
  setOnUnauthorized: jest.fn(),
}));

import { useAuth } from "../../hooks/useAuth";

const mockUser = { id: 1, name: "Test", email: "test@example.com" };

describe("useAuth – cache clearing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls queryClient.removeQueries() on login before setting auth state", async () => {
    (authService.login as jest.Mock).mockResolvedValue({
      user: mockUser,
      token: "tok",
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login("test@example.com", "password");
    });

    expect(queryClient.removeQueries).toHaveBeenCalledTimes(1);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("calls queryClient.removeQueries() on register before setting auth state", async () => {
    (authService.register as jest.Mock).mockResolvedValue({
      user: mockUser,
      token: "tok",
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.register("Test", "test@example.com", "password");
    });

    expect(queryClient.removeQueries).toHaveBeenCalledTimes(1);
    expect(result.current.isAuthenticated).toBe(true);
  });
});
