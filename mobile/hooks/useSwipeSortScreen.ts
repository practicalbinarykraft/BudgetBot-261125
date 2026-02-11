import { useState, useCallback, useRef, useMemo } from "react";
import { Animated, PanResponder, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";
import type { Transaction, Category } from "../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = 120;

export interface SortingStats {
  unsortedCount: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  totalSorted: number;
}

interface UnsortedResponse {
  count: number;
  transactions: Transaction[];
}

export type SwipeDirection = "essential" | "discretionary" | "asset" | "liability";

export function useSwipeSortScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionPoints, setSessionPoints] = useState(0);
  const pan = useRef(new Animated.ValueXY()).current;

  const statsQuery = useQuery({
    queryKey: ["sorting-stats"],
    queryFn: () => api.get<SortingStats>("/api/sorting/stats"),
  });

  const unsortedQuery = useQuery({
    queryKey: ["unsorted"],
    queryFn: () => api.get<UnsortedResponse>("/api/analytics/unsorted"),
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<{ data: Category[] }>("/api/categories"),
  });

  const unsortedTransactions = unsortedQuery.data?.transactions ?? [];
  const stats = statsQuery.data;
  const categories = categoriesQuery.data?.data ?? [];

  const categoryMap = useMemo(() => {
    const map: Record<number, Category> = {};
    categories.forEach((c) => { map[c.id] = c; });
    return map;
  }, [categories]);

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; financialType: string }) =>
      api.patch(`/api/transactions/${data.id}`, {
        financialType: data.financialType,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unsorted"] });
      queryClient.invalidateQueries({ queryKey: ["sorting-stats"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const sessionMutation = useMutation({
    mutationFn: (transactionsSorted: number) =>
      api.post("/api/sorting/session", { transactionsSorted }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sorting-stats"] });
    },
  });

  const trainingMutation = useMutation({
    mutationFn: (data: { transactionDescription: string; transactionAmount?: string; userChosenType?: string }) =>
      api.post("/api/ai/training", data),
  });

  const handleSwipe = useCallback(
    async (direction: SwipeDirection) => {
      const tx = unsortedTransactions[currentIndex];
      if (!tx) return;

      await updateMutation.mutateAsync({
        id: tx.id,
        financialType: direction,
      });

      trainingMutation.mutate({
        transactionDescription: tx.description,
        transactionAmount: tx.amount,
        userChosenType: direction,
      });

      setSessionPoints((p) => p + 10);
      const nextCount = currentIndex + 1;
      setCurrentIndex(nextCount);

      if (nextCount % 5 === 0) {
        sessionMutation.mutate(nextCount);
      }
    },
    [
      currentIndex,
      unsortedTransactions,
      updateMutation,
      trainingMutation,
      sessionMutation,
    ]
  );

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 10 || Math.abs(g.dy) > 10,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, g) => {
        let direction: SwipeDirection | null = null;

        if (Math.abs(g.dx) > Math.abs(g.dy)) {
          if (g.dx < -SWIPE_THRESHOLD) direction = "essential";
          else if (g.dx > SWIPE_THRESHOLD) direction = "discretionary";
        } else {
          if (g.dy < -SWIPE_THRESHOLD) direction = "asset";
          else if (g.dy > SWIPE_THRESHOLD) direction = "liability";
        }

        if (direction) {
          const toX =
            direction === "essential"
              ? -SCREEN_WIDTH
              : direction === "discretionary"
                ? SCREEN_WIDTH
                : 0;
          const toY =
            direction === "asset"
              ? -400
              : direction === "liability"
                ? 400
                : 0;

          Animated.timing(pan, {
            toValue: { x: toX, y: toY },
            duration: 200,
            useNativeDriver: false,
          }).start(() => {
            pan.setValue({ x: 0, y: 0 });
            handleSwipe(direction!);
          });
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const handleFinish = async () => {
    if (currentIndex > 0) {
      await sessionMutation.mutateAsync(currentIndex);
    }
    navigation.goBack();
  };

  const currentTx = unsortedTransactions[currentIndex];
  const totalUnsorted = unsortedQuery.data?.count ?? 0;
  const remainingCount = unsortedTransactions.length - currentIndex;
  const progressPercent =
    totalUnsorted > 0
      ? Math.round(
          ((totalUnsorted - remainingCount) / totalUnsorted) * 100
        )
      : 0;

  const catLabel = currentTx?.categoryId ? categoryMap[currentTx.categoryId]?.name : null;

  return {
    pan, panResponder, stats, sessionPoints, currentTx, catLabel,
    remainingCount, progressPercent, isLoading: unsortedQuery.isLoading,
    handleFinish, navigation,
  };
}
