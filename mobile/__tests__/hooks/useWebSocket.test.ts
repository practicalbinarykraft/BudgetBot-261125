/**
 * B1 Test #1: useWebSocket
 * Verifies: events trigger correct queryClient.invalidateQueries calls.
 * Auth: sends JWT token (not raw userId) via storage.getToken().
 */

// Mock socket.io-client
const mockOn = jest.fn();
const mockEmit = jest.fn();
const mockConnect = jest.fn();
const mockDisconnect = jest.fn();
const mockRemoveAllListeners = jest.fn();
const mockSocket = {
  on: mockOn,
  emit: mockEmit,
  connect: mockConnect,
  disconnect: mockDisconnect,
  removeAllListeners: mockRemoveAllListeners,
  connected: true,
};
jest.mock("socket.io-client", () => ({
  io: jest.fn(() => mockSocket),
}));

// Mock queryClient — use inline jest.fn() to avoid hoisting issues
jest.mock("../../lib/query-client", () => ({
  queryClient: { invalidateQueries: jest.fn() },
}));

// Mock storage — returns a JWT token
jest.mock("../../lib/storage", () => ({
  storage: { getToken: jest.fn().mockResolvedValue("test-jwt-token") },
}));

// Mock react-native (Alert + Platform used by uiAlert)
jest.mock("react-native", () => ({
  Alert: { alert: jest.fn() },
  Platform: { OS: "ios" },
}));

import { renderHook, act, waitFor } from "@testing-library/react-native";
import { useWebSocket } from "../../hooks/useWebSocket";
import { queryClient } from "../../lib/query-client";
import { io } from "socket.io-client";

const mockInvalidate = queryClient.invalidateQueries as jest.Mock;
const mockIo = io as jest.Mock;

// Helper: flush microtask queue (for storage.getToken() promise)
const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe("useWebSocket", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("registers event listeners on mount when userId provided", async () => {
    renderHook(() => useWebSocket(1));
    await act(async () => { await flushPromises(); });

    const registeredEvents = mockOn.mock.calls.map(
      (call: any[]) => call[0]
    );
    expect(registeredEvents).toContain("connect");
    expect(registeredEvents).toContain("disconnect");
    expect(registeredEvents).toContain("budget:warning");
    expect(registeredEvents).toContain("budget:exceeded");
    expect(registeredEvents).toContain("transaction:created");
    expect(registeredEvents).toContain("exchange_rate:updated");
    expect(registeredEvents).toContain("wallet:balance_low");
    expect(registeredEvents).toContain("system:maintenance");
  });

  it("sends JWT token in auth (not raw userId)", async () => {
    renderHook(() => useWebSocket(1));
    await act(async () => { await flushPromises(); });

    expect(mockIo).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ auth: { token: "test-jwt-token" } })
    );
  });

  it("calls socket.connect() on mount", async () => {
    renderHook(() => useWebSocket(1));
    await act(async () => { await flushPromises(); });
    expect(mockConnect).toHaveBeenCalled();
  });

  it("does not connect when userId is undefined", async () => {
    renderHook(() => useWebSocket(undefined));
    await act(async () => { await flushPromises(); });
    expect(mockConnect).not.toHaveBeenCalled();
  });

  it("invalidates queries on budget:exceeded event", async () => {
    renderHook(() => useWebSocket(1));
    await act(async () => { await flushPromises(); });

    const exceededHandler = mockOn.mock.calls.find(
      (call: any[]) => call[0] === "budget:exceeded"
    )?.[1];

    expect(exceededHandler).toBeDefined();
    act(() => {
      exceededHandler({ categoryName: "Food", percentage: 110 });
    });

    expect(mockInvalidate).toHaveBeenCalledWith({
      queryKey: ["budgets"],
    });
  });

  it("invalidates queries on transaction:created event", async () => {
    renderHook(() => useWebSocket(1));
    await act(async () => { await flushPromises(); });

    const handler = mockOn.mock.calls.find(
      (call: any[]) => call[0] === "transaction:created"
    )?.[1];

    expect(handler).toBeDefined();
    act(() => {
      handler();
    });

    expect(mockInvalidate).toHaveBeenCalledWith({
      queryKey: ["transactions"],
    });
    expect(mockInvalidate).toHaveBeenCalledWith({
      queryKey: ["stats"],
    });
    expect(mockInvalidate).toHaveBeenCalledWith({
      queryKey: ["wallets"],
    });
  });

  it("cleans up on unmount", async () => {
    const { unmount } = renderHook(() => useWebSocket(1));
    await act(async () => { await flushPromises(); });
    unmount();
    expect(mockRemoveAllListeners).toHaveBeenCalled();
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
