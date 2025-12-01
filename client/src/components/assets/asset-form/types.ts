/**
 * Asset Form Types
 *
 * Shared types and interfaces for asset form components
 * Junior-Friendly: Centralized type definitions
 */

import { z } from "zod";

export interface AssetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: any;
  type: 'asset' | 'liability';
}

export type FormData = {
  name: string;
  type: 'asset' | 'liability';
  categoryId: number | null;
  currentValueOriginal: string;
  currencyOriginal: string;
  purchasePriceOriginal?: string;
  purchaseDate?: string;
  monthlyIncome: string;
  monthlyExpense: string;
  depreciationRate?: string;
  appreciationRate?: string;
  location?: string;
  notes?: string;
  imageUrl?: string;
};
