/**
 * TDD tests for useOnboarding status logic.
 * Status: "never" | "dismissed" | "completed"
 */
import { renderHook, act } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock("../../lib/api-client", () => ({
  api: { post: jest.fn().mockResolvedValue({ id: 1 }) },
}));

jest.mock("../../lib/query-client", () => ({
  queryClient: { invalidateQueries: jest.fn() },
}));

jest.mock("@tanstack/react-query", () => ({
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn().mockResolvedValue({}),
    isPending: false,
  })),
}));

import { useOnboarding } from "../../hooks/useOnboarding";

const STORAGE_KEY = "budgetbot_onboarding_status";

describe("useOnboarding", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("auto-shows when status is 'never' (storage empty)", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useOnboarding(1));

    // Wait for async storage read
    await act(async () => {});

    expect(AsyncStorage.getItem).toHaveBeenCalledWith(STORAGE_KEY);
    expect(result.current.visible).toBe(true);
    expect(result.current.step).toBe("welcome");
  });

  it("skip() sets 'dismissed', hides dialog", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useOnboarding(1));
    await act(async () => {});
    expect(result.current.visible).toBe(true);

    await act(async () => {
      await result.current.skip();
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, "dismissed");
    expect(result.current.visible).toBe(false);
  });

  it("complete() sets 'completed', hides dialog", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useOnboarding(1));
    await act(async () => {});

    await act(async () => {
      await result.current.complete();
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, "completed");
    expect(result.current.visible).toBe(false);
  });

  it("does not auto-show when status is 'dismissed'", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue("dismissed");

    const { result } = renderHook(() => useOnboarding(1));
    await act(async () => {});

    expect(result.current.visible).toBe(false);
  });

  it("does not auto-show when status is 'completed'", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue("completed");

    const { result } = renderHook(() => useOnboarding(1));
    await act(async () => {});

    expect(result.current.visible).toBe(false);
  });

  it("open() forces visible=true even when 'dismissed'", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue("dismissed");

    const { result } = renderHook(() => useOnboarding(1));
    await act(async () => {});
    expect(result.current.visible).toBe(false);

    act(() => {
      result.current.open();
    });

    expect(result.current.visible).toBe(true);
  });

  it("open() forces visible=true even when 'completed'", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue("completed");

    const { result } = renderHook(() => useOnboarding(1));
    await act(async () => {});

    act(() => {
      result.current.open();
    });

    expect(result.current.visible).toBe(true);
  });

  it("open() resets step to 'welcome'", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useOnboarding(1));
    await act(async () => {});

    // Advance to wallet step
    act(() => {
      result.current.setStep("wallet");
    });
    expect(result.current.step).toBe("wallet");

    // Skip, then reopen
    await act(async () => {
      await result.current.skip();
    });
    expect(result.current.visible).toBe(false);

    act(() => {
      result.current.open();
    });

    expect(result.current.visible).toBe(true);
    expect(result.current.step).toBe("welcome");
  });

  it("does not auto-show when userId is undefined", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useOnboarding(undefined));
    await act(async () => {});

    expect(result.current.visible).toBe(false);
    expect(AsyncStorage.getItem).not.toHaveBeenCalled();
  });
});
