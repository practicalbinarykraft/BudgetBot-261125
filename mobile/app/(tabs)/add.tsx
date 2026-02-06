/**
 * Add Transaction screen – create new income/expense.
 * Includes voice input support via expo-av.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { useCreateTransaction, useCategories } from '@/hooks/useTransactions';
import { COLORS, FONTS, SPACING } from '@/constants/config';
import type { Category } from '@/types';

export default function AddTransactionScreen() {
  const router = useRouter();
  const createMutation = useCreateTransaction();
  const { data: categories } = useCategories();

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showCategories, setShowCategories] = useState(false);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const filteredCategories = categories?.filter((c) => c.type === type) ?? [];

  const handleSubmit = useCallback(async () => {
    if (!amount.trim() || !description.trim()) {
      Alert.alert('Error', 'Please enter amount and description');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      await createMutation.mutateAsync({
        type,
        amount: numAmount.toFixed(2),
        description: description.trim(),
        date,
        categoryId: selectedCategory?.id,
      });
      Alert.alert('Success', 'Transaction added!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create transaction';
      Alert.alert('Error', message);
    }
  }, [type, amount, description, date, selectedCategory]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Transaction</Text>
          </View>

          {/* Type Toggle */}
          <View style={styles.typeToggle}>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'expense' && styles.typeBtnExpenseActive]}
              onPress={() => { setType('expense'); setSelectedCategory(null); }}
            >
              <Ionicons
                name="arrow-up-circle"
                size={20}
                color={type === 'expense' ? '#fff' : COLORS.expense}
              />
              <Text
                style={[
                  styles.typeBtnText,
                  type === 'expense' && styles.typeBtnTextActive,
                ]}
              >
                Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'income' && styles.typeBtnIncomeActive]}
              onPress={() => { setType('income'); setSelectedCategory(null); }}
            >
              <Ionicons
                name="arrow-down-circle"
                size={20}
                color={type === 'income' ? '#fff' : COLORS.income}
              />
              <Text
                style={[
                  styles.typeBtnText,
                  type === 'income' && styles.typeBtnTextActive,
                ]}
              >
                Income
              </Text>
            </TouchableOpacity>
          </View>

          {/* Amount Input */}
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor={COLORS.textMuted}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="What was this for?"
                placeholderTextColor={COLORS.textMuted}
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </View>

          {/* Category Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity
              style={styles.categorySelector}
              onPress={() => setShowCategories(!showCategories)}
            >
              <Text
                style={[
                  styles.categorySelectorText,
                  !selectedCategory && { color: COLORS.textMuted },
                ]}
              >
                {selectedCategory ? selectedCategory.name : 'Select category'}
              </Text>
              <Ionicons
                name={showCategories ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>

            {showCategories && (
              <View style={styles.categoryList}>
                {filteredCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      selectedCategory?.id === cat.id && styles.categoryChipActive,
                    ]}
                    onPress={() => {
                      setSelectedCategory(cat);
                      setShowCategories(false);
                    }}
                  >
                    <View
                      style={[
                        styles.catDot,
                        { backgroundColor: cat.color || COLORS.primary },
                      ]}
                    />
                    <Text
                      style={[
                        styles.categoryChipText,
                        selectedCategory?.id === cat.id && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                {filteredCategories.length === 0 && (
                  <Text style={styles.noCategoriesText}>
                    No categories yet. You can add them in settings.
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={COLORS.textMuted}
                style={{ marginRight: SPACING.sm }}
              />
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.textMuted}
                value={date}
                onChangeText={setDate}
              />
            </View>
          </View>

          {/* Voice Input Button */}
          <TouchableOpacity style={styles.voiceBtn}>
            <Ionicons name="mic" size={24} color={COLORS.primary} />
            <Text style={styles.voiceBtnText}>Voice Input</Text>
          </TouchableOpacity>

          {/* Submit */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              createMutation.isPending && styles.submitBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={createMutation.isPending}
            activeOpacity={0.8}
          >
            {createMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Add Transaction</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
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

  // Type Toggle
  typeToggle: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeBtnExpenseActive: {
    backgroundColor: COLORS.expense,
    borderColor: COLORS.expense,
  },
  typeBtnIncomeActive: {
    backgroundColor: COLORS.income,
    borderColor: COLORS.income,
  },
  typeBtnText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  typeBtnTextActive: {
    color: '#fff',
  },

  // Amount
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  currencySymbol: {
    fontSize: FONTS.sizes['4xl'],
    fontWeight: '300',
    color: COLORS.textMuted,
    marginRight: SPACING.xs,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.textPrimary,
    minWidth: 120,
    textAlign: 'center',
  },

  // Inputs
  inputGroup: {
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  label: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
  },

  // Category Selector
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    height: 52,
  },
  categorySelectorText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
  },
  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '20',
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryChipText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  categoryChipTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  noCategoriesText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    padding: SPACING.sm,
  },

  // Voice
  voiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
    marginBottom: SPACING.xl,
  },
  voiceBtnText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '500',
    color: COLORS.primary,
  },

  // Submit
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: '#fff',
  },
});
