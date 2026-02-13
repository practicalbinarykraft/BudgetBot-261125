/**
 * Test: useReceiptScannerScreen exposes canRetry and goManual
 * from classifyReceiptError when a scan error occurs.
 */
import { renderHook, act } from "@testing-library/react-native";

const mockMutate = jest.fn();
let capturedOnError: ((error: Error) => void) | null = null;

jest.mock("@tanstack/react-query", () => ({
  useMutation: jest.fn((opts: any) => {
    capturedOnError = opts.onError;
    return {
      mutate: mockMutate,
      isPending: false,
      isError: false,
    };
  }),
}));

jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock("expo-image-manipulator", () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: "jpeg" },
}));

jest.mock("../../lib/api-client", () => ({
  api: { post: jest.fn() },
}));

jest.mock("../../lib/query-client", () => ({
  queryClient: { invalidateQueries: jest.fn() },
}));

jest.mock("../../i18n", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
}));

import { useReceiptScannerScreen } from "../../hooks/useReceiptScannerScreen";

describe("useReceiptScannerScreen – error classification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedOnError = null;
  });

  it("exposes canRetry=true for network errors", () => {
    const { result } = renderHook(() => useReceiptScannerScreen());

    act(() => {
      capturedOnError?.(new TypeError("Network request failed"));
    });

    expect(result.current.scanError).toBeTruthy();
    expect(result.current.canRetry).toBe(true);
  });

  it("exposes canRetry=false for auth errors", () => {
    const { result } = renderHook(() => useReceiptScannerScreen());

    act(() => {
      capturedOnError?.(new Error("Unauthorized"));
    });

    expect(result.current.scanError).toBeTruthy();
    expect(result.current.canRetry).toBe(false);
  });

  it("exposes goManual callback that navigates to AddTransaction", () => {
    const { result } = renderHook(() => useReceiptScannerScreen());
    expect(typeof result.current.goManual).toBe("function");

    act(() => {
      result.current.goManual();
    });

    expect(mockNavigate).toHaveBeenCalledWith("AddTransaction", {});
  });

  it("resets canRetry when scanError is cleared", () => {
    const { result } = renderHook(() => useReceiptScannerScreen());

    act(() => {
      capturedOnError?.(new TypeError("Network request failed"));
    });
    expect(result.current.canRetry).toBe(true);

    // clearImages resets scanError
    act(() => {
      result.current.clearImages();
    });
    expect(result.current.canRetry).toBe(false);
  });
});
