/**
 * Analytics screen – category breakdown and spending insights.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCategoryAnalytics } from '@/hooks/useTransactions';
import { COLORS, FONTS, SPACING } from '@/constants/config';

function formatCurrency(amount: number | string, currency: string = 'USD'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `$${Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AnalyticsScreen() {
  const { data: analytics, isLoading, refetch } = useCategoryAnalytics('month');
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const totalSpent = analytics?.reduce((sum, c) => sum + parseFloat(c.total), 0) ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>Monthly spending breakdown</Text>
        </View>

        {/* Total */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Spending</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totalSpent)}</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : analytics && analytics.length > 0 ? (
          <View style={styles.categoriesCard}>
            {analytics.map((cat, i) => {
              const amount = parseFloat(cat.total);
              const percentage = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;

              return (
                <View key={cat.categoryId ?? i}>
                  <View style={styles.categoryRow}>
                    <View style={styles.categoryLeft}>
                      <View
                        style={[
                          styles.categoryDot,
                          { backgroundColor: cat.categoryColor || COLORS.primary },
                        ]}
                      />
                      <Text style={styles.categoryName}>{cat.categoryName}</Text>
                    </View>
                    <View style={styles.categoryRight}>
                      <Text style={styles.categoryAmount}>{formatCurrency(amount)}</Text>
                      <Text style={styles.categoryCount}>{cat.count} txns</Text>
                    </View>
                  </View>

                  {/* Progress bar */}
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: cat.categoryColor || COLORS.primary,
                        },
                      ]}
                    />
                  </View>

                  <Text style={styles.percentageText}>
                    {percentage.toFixed(1)}% of total
                  </Text>

                  {i < analytics.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No data to analyze</Text>
            <Text style={styles.emptySubtext}>
              Add some transactions to see analytics
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING['4xl'],
  },
  header: {
    paddingVertical: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes['2xl'],
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  totalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  totalAmount: {
    fontSize: FONTS.sizes['3xl'],
    fontWeight: '700',
    color: COLORS.expense,
  },

  categoriesCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  categoryCount: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
  },

  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.background,
    borderRadius: 3,
    marginBottom: SPACING.xs,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  percentageText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border + '40',
    marginVertical: SPACING.md,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: SPACING.sm,
  },
  emptyText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  emptySubtext: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
  },
});
