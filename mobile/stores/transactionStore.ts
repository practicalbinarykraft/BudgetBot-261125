/**
 * Zustand store for transaction-related UI state.
 */

import { create } from 'zustand';
import type { Transaction } from '@/types';

interface TransactionStoreState {
  /** Transaction being edited */
  editingTransaction: Transaction | null;
  /** Whether the add-transaction modal is open */
  isAddOpen: boolean;
  /** Whether the edit-transaction modal is open */
  isEditOpen: boolean;
  /** Pre-filled data for a new transaction (e.g. from voice or notification) */
  prefillData: Partial<Transaction> | null;
  /** Filter: income/expense/all */
  typeFilter: 'all' | 'income' | 'expense';

  openAdd: (prefill?: Partial<Transaction>) => void;
  closeAdd: () => void;
  openEdit: (transaction: Transaction) => void;
  closeEdit: () => void;
  setTypeFilter: (filter: 'all' | 'income' | 'expense') => void;
  reset: () => void;
}

export const useTransactionStore = create<TransactionStoreState>((set) => ({
  editingTransaction: null,
  isAddOpen: false,
  isEditOpen: false,
  prefillData: null,
  typeFilter: 'all',

  openAdd: (prefill) =>
    set({ isAddOpen: true, prefillData: prefill ?? null }),

  closeAdd: () =>
    set({ isAddOpen: false, prefillData: null }),

  openEdit: (transaction) =>
    set({ isEditOpen: true, editingTransaction: transaction }),

  closeEdit: () =>
    set({ isEditOpen: false, editingTransaction: null }),

  setTypeFilter: (filter) =>
    set({ typeFilter: filter }),

  reset: () =>
    set({
      editingTransaction: null,
      isAddOpen: false,
      isEditOpen: false,
      prefillData: null,
      typeFilter: 'all',
    }),
}));
