/**
 * Dashboard screen – main financial overview.
 * Shows balance, monthly income/expense, category breakdown, recent transactions.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';

import { useAuth } from '@/hooks/useAuth';
import { useTransactions, useStats, useCategoryAnalytics } from '@/hooks/useTransactions';
import { useTotalBalance } from '@/hooks/useWallets';
import { COLORS, FONTS, SPACING } from '@/constants/config';
import type { Transaction } from '@/types';

function formatCurrency(amount: number | string, currency: string = 'USD'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  const symbols: Record<string, string> = {
    USD: '$', EUR: '\u20AC', RUB: '\u20BD', KRW: '\u20A9', IDR: 'Rp', CNY: '\u00A5',
  };
  const symbol = symbols[currency] || currency + ' ';
  return `${symbol}${Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = format(startOfMonth(currentDate), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(currentDate), 'yyyy-MM-dd');
  const monthLabel = format(currentDate, 'MMMM yyyy');

  const { totalBalance, currency } = useTotalBalance();
  const { data: stats, isLoading: statsLoading } = useStats(monthStart, monthEnd);
  const { data: categoryAnalytics } = useCategoryAnalytics('month');
  const { data: recentTransactions, isLoading: txLoading, refetch } = useTransactions({
    from: monthStart,
    to: monthEnd,
    limit: 5,
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const income = parseFloat(stats?.income ?? '0');
  const expense = parseFloat(stats?.expense ?? '0');

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
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Hello, {user?.name?.split(' ')[0] ?? 'there'}
            </Text>
            <Text style={styles.headerSubtitle}>Your financial overview</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>
            {formatCurrency(totalBalance, currency)}
          </Text>
        </View>

        {/* Month Navigator */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => setCurrentDate(subMonths(currentDate, 1))}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <TouchableOpacity onPress={() => setCurrentDate(addMonths(currentDate, 1))}>
            <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Income / Expense Summary */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.incomeCard]}>
            <View style={styles.summaryIconWrap}>
              <Ionicons name="arrow-down-circle" size={24} color={COLORS.income} />
            </View>
            <View>
              <Text style={styles.summaryLabel}>Income</Text>
              <Text style={[styles.summaryAmount, { color: COLORS.income }]}>
                {statsLoading ? '...' : formatCurrency(income, currency)}
              </Text>
            </View>
          </View>
          <View style={[styles.summaryCard, styles.expenseCard]}>
            <View style={styles.summaryIconWrap}>
              <Ionicons name="arrow-up-circle" size={24} color={COLORS.expense} />
            </View>
            <View>
              <Text style={styles.summaryLabel}>Expenses</Text>
              <Text style={[styles.summaryAmount, { color: COLORS.expense }]}>
                {statsLoading ? '...' : formatCurrency(expense, currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Top Categories */}
        {categoryAnalytics && categoryAnalytics.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Categories</Text>
            <View style={styles.categoriesList}>
              {categoryAnalytics.slice(0, 5).map((cat, i) => (
                <View key={cat.categoryId ?? i} style={styles.categoryItem}>
                  <View style={styles.categoryLeft}>
                    <View
                      style={[
                        styles.categoryDot,
                        { backgroundColor: cat.categoryColor || COLORS.primary },
                      ]}
                    />
                    <Text style={styles.categoryName} numberOfLines={1}>
                      {cat.categoryName}
                    </Text>
                  </View>
                  <View style={styles.categoryRight}>
                    <Text style={styles.categoryAmount}>
                      {formatCurrency(cat.total, currency)}
                    </Text>
                    <Text style={styles.categoryPercent}>{cat.percentage}%</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {txLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 16 }} />
          ) : recentTransactions && recentTransactions.length > 0 ? (
            <View style={styles.transactionsList}>
              {recentTransactions.map((tx) => (
                <TransactionRow key={tx.id} transaction={tx} currency={currency} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No transactions this month</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TransactionRow({ transaction, currency }: { transaction: Transaction; currency: string }) {
  const isIncome = transaction.type === 'income';
  const amount = parseFloat(transaction.amount);

  return (
    <View style={styles.txRow}>
      <View
        style={[
          styles.txIcon,
          { backgroundColor: isIncome ? '#22c55e20' : '#ef444420' },
        ]}
      >
        <Ionicons
          name={isIncome ? 'arrow-down' : 'arrow-up'}
          size={18}
          color={isIncome ? COLORS.income : COLORS.expense}
        />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txDescription} numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text style={styles.txDate}>
          {format(new Date(transaction.date), 'MMM d')}
          {transaction.category ? ` \u00B7 ${transaction.category}` : ''}
        </Text>
      </View>
      <Text
        style={[
          styles.txAmount,
          { color: isIncome ? COLORS.income : COLORS.expense },
        ]}
      >
        {isIncome ? '+' : '-'}{formatCurrency(amount, transaction.currency || currency)}
      </Text>
    </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.sm,
  },
  greeting: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Balance Card
  balanceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingVertical: SPACING['2xl'],
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  balanceLabel: {
    fontSize: FONTS.sizes.sm,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: SPACING.xs,
  },
  balanceAmount: {
    fontSize: FONTS.sizes['4xl'],
    fontWeight: '700',
    color: '#fff',
  },

  // Month Nav
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  monthLabel: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },

  // Summary Row
  summaryRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  summaryCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  incomeCard: {},
  expenseCard: {},
  summaryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  summaryAmount: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
  },

  // Section
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },

  // Categories
  categoriesList: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryName: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
    flex: 1,
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  categoryPercent: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
  },

  // Transactions
  transactionsList: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txInfo: {
    flex: 1,
  },
  txDescription: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  txDate: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  txAmount: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING['3xl'],
    gap: SPACING.sm,
  },
  emptyText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
  },
});
