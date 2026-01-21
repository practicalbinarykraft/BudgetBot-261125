/**
 * Category Select Dialog for Dashboard V2
 * 
 * Allows users to select which categories to display on the dashboard category panel.
 * Selected categories are saved to localStorage.
 */

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Category, Budget } from "@shared/schema";
import { useTranslateCategory } from "@/lib/category-translations";
import { useTranslation } from "@/i18n/context";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Check, Infinity, ChevronUp, ChevronDown } from "lucide-react";

interface CategorySelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  selectedCategoryIds: number[];
  onSelectionChange: (selectedIds: number[]) => void;
  // Category breakdown data for progress calculation
  categoryBreakdown?: Array<{
    id: number;
    amount: number;
    name: string;
    color?: string | null;
    icon?: string | null;
  }>;
  // Budgets and spent amounts
  budgets?: Budget[];
  budgetSpentMap?: Map<number, number>; // categoryId -> spent amount
  currencySymbol?: string;
  formatCurrency?: (amount: number) => string;
}

const STORAGE_KEY = 'dashboard-v2-selected-categories';
const ORDER_STORAGE_KEY = 'dashboard-v2-categories-order';

export function CategorySelectDialog({
  open,
  onOpenChange,
  categories,
  selectedCategoryIds,
  onSelectionChange,
  categoryBreakdown = [],
  budgets = [],
  budgetSpentMap = new Map(),
  currencySymbol = '$',
  formatCurrency = (amount: number) => `${Math.round(amount)}`,
}: CategorySelectDialogProps) {
  const { t } = useTranslation();
  const translateCategory = useTranslateCategory();
  const [localSelected, setLocalSelected] = useState<number[]>(selectedCategoryIds);
  const [localOrder, setLocalOrder] = useState<number[]>(() => {
    // Load order from localStorage or use selectedCategoryIds as default (only in browser)
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(ORDER_STORAGE_KEY);
        if (saved) {
          const savedOrder = JSON.parse(saved);
          // Filter to only include selected categories
          return savedOrder.filter((id: number) => selectedCategoryIds.includes(id));
        }
      } catch (error) {
        console.error('Failed to load category order:', error);
      }
    }
    return selectedCategoryIds;
  });

  // Sync local state when prop changes
  useEffect(() => {
    setLocalSelected(selectedCategoryIds);
    // Update order to include only selected categories (only in browser)
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(ORDER_STORAGE_KEY);
        if (saved) {
          const savedOrder = JSON.parse(saved);
          const filteredOrder = savedOrder.filter((id: number) => selectedCategoryIds.includes(id));
          // Add any new selected categories to the end
          const newCategories = selectedCategoryIds.filter(id => !filteredOrder.includes(id));
          setLocalOrder([...filteredOrder, ...newCategories]);
        } else {
          setLocalOrder(selectedCategoryIds);
        }
      } catch (error) {
        console.error('Failed to load category order:', error);
        setLocalOrder(selectedCategoryIds);
      }
    } else {
      setLocalOrder(selectedCategoryIds);
    }
  }, [selectedCategoryIds]);

  const handleToggleCategory = (categoryId: number) => {
    setLocalSelected((prev) => {
      if (prev.includes(categoryId)) {
        // Remove from order too
        setLocalOrder((order) => order.filter((id) => id !== categoryId));
        return prev.filter((id) => id !== categoryId);
      } else {
        // Add to end of order
        setLocalOrder((order) => [...order, categoryId]);
        return [...prev, categoryId];
      }
    });
  };

  const handleMoveUp = (categoryId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalOrder((order) => {
      const index = order.indexOf(categoryId);
      if (index > 0) {
        const newOrder = [...order];
        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
        return newOrder;
      }
      return order;
    });
  };

  const handleMoveDown = (categoryId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalOrder((order) => {
      const index = order.indexOf(categoryId);
      if (index < order.length - 1) {
        const newOrder = [...order];
        [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
        return newOrder;
      }
      return order;
    });
  };

  // Get category breakdown data for progress calculation
  const getCategoryData = (categoryId: number) => {
    return categoryBreakdown.find((item) => item.id === categoryId);
  };

  // Get budget for category
  const getBudgetForCategory = (categoryId: number): Budget | undefined => {
    return budgets.find(b => b.categoryId === categoryId);
  };

  // Calculate progress for a category
  const getCategoryProgress = (category: Category) => {
    const budget = getBudgetForCategory(category.id);
    const categoryData = getCategoryData(category.id);
    
    if (budget && categoryData) {
      const limitAmount = parseFloat(budget.limitAmount);
      const spent = budgetSpentMap.get(category.id) || categoryData.amount;
      if (limitAmount > 0) {
        return Math.min(spent / limitAmount, 1.0);
      }
    }
    
    // If no budget, calculate progress relative to max category amount
    if (!categoryData || categoryBreakdown.length === 0) {
      return 0;
    }
    const maxAmount = Math.max(...categoryBreakdown.map((c) => c.amount), 1);
    return categoryData.amount / maxAmount;
  };

  // Get spent and limit amounts for display
  const getCategoryAmounts = (category: Category) => {
    const budget = getBudgetForCategory(category.id);
    const categoryData = getCategoryData(category.id);
    
    if (budget && categoryData) {
      const spent = budgetSpentMap.get(category.id) || categoryData.amount;
      const limitAmount = parseFloat(budget.limitAmount);
      return {
        spent,
        limit: limitAmount,
        hasBudget: true,
      };
    }
    
    return {
      spent: categoryData?.amount || 0,
      limit: 0,
      hasBudget: false,
    };
  };

  const handleSave = () => {
    // Save selected categories and order to localStorage (only in browser)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(localSelected));
        localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(localOrder));
      } catch (error) {
        console.error('Failed to save category selection:', error);
      }
    }
    // Notify parent
    onSelectionChange(localSelected);
    onOpenChange(false);
  };

  const handleCancel = () => {
    // Reset to original selection
    setLocalSelected(selectedCategoryIds);
    // Reset order (only in browser)
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(ORDER_STORAGE_KEY);
        if (saved) {
          const savedOrder = JSON.parse(saved);
          const filteredOrder = savedOrder.filter((id: number) => selectedCategoryIds.includes(id));
          setLocalOrder(filteredOrder.length > 0 ? filteredOrder : selectedCategoryIds);
        } else {
          setLocalOrder(selectedCategoryIds);
        }
      } catch (error) {
        console.error('Failed to load category order:', error);
        setLocalOrder(selectedCategoryIds);
      }
    } else {
      setLocalOrder(selectedCategoryIds);
    }
    onOpenChange(false);
  };

  // Sort categories by order (selected first, then by order)
  const sortedCategories = [...categories].sort((a, b) => {
    const aSelected = localSelected.includes(a.id);
    const bSelected = localSelected.includes(b.id);
    
    // Selected categories first
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    
    // If both selected, sort by order
    if (aSelected && bSelected) {
      const aIndex = localOrder.indexOf(a.id);
      const bIndex = localOrder.indexOf(b.id);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    }
    
    return 0;
  });

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('dashboard.select_categories')}</DialogTitle>
          <DialogDescription>
            {t('dashboard.select_categories_description')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {categories.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {t('dashboard.no_categories_available')}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {sortedCategories.map((category) => {
                const isSelected = localSelected.includes(category.id);
                const orderIndex = localOrder.indexOf(category.id);
                const canMoveUp = isSelected && orderIndex > 0;
                const canMoveDown = isSelected && orderIndex < localOrder.length - 1 && orderIndex !== -1;
                const progress = getCategoryProgress(category);
                const categoryData = getCategoryData(category.id);
                const amounts = getCategoryAmounts(category);
                const budget = getBudgetForCategory(category.id);
                
                // Display icon: if it's an emoji (not a Lucide icon name), show it directly
                const iconDisplay = category.icon && !category.icon.match(/^[A-Z][a-zA-Z]*$/) 
                  ? category.icon 
                  : '🍔'; // Default emoji if icon is a Lucide name or missing
                
                // Determine color based on progress (same logic as main panel)
                const progressColor = budget && amounts.limit > 0
                  ? progress >= 1.0 
                    ? '#ef4444' // Red when over budget
                    : progress >= 0.8
                    ? '#f59e0b' // Orange when close to limit
                    : category.color || '#3b82f6' // Category color or blue
                  : category.color || '#3b82f6';
                
                return (
                  <div
                    key={category.id}
                    className="flex flex-col items-center cursor-pointer group relative"
                    onClick={() => handleToggleCategory(category.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleToggleCategory(category.id);
                      }
                    }}
                  >
                    {/* Order controls - only show for selected categories */}
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 flex flex-col gap-0.5 bg-background border rounded-md shadow-sm">
                        <button
                          type="button"
                          onClick={(e) => handleMoveUp(category.id, e)}
                          disabled={!canMoveUp}
                          className={`p-1 ${canMoveUp ? 'hover:bg-muted cursor-pointer' : 'opacity-30 cursor-not-allowed'}`}
                          aria-label="Move up"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleMoveDown(category.id, e)}
                          disabled={!canMoveDown}
                          className={`p-1 ${canMoveDown ? 'hover:bg-muted cursor-pointer' : 'opacity-30 cursor-not-allowed'}`}
                          aria-label="Move down"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <div className="relative mb-2">
                      <CircularProgress
                        progress={progress}
                        size={64}
                        strokeWidth={4}
                        color={progressColor}
                        backgroundColor="rgba(0, 0, 0, 0.1)"
                        className="dark:bg-background"
                      >
                        <div 
                          className="w-12 h-12 rounded-full flex flex-col items-center justify-center transition-all"
                          style={{ 
                            backgroundColor: `${progressColor}20`,
                            border: isSelected ? `3px solid ${progressColor}` : 'none',
                          }}
                        >
                          {/* Spent amount inside circle */}
                          <span className="text-[10px] font-semibold leading-tight text-foreground">
                            {formatCurrency(amounts.spent)}{currencySymbol}
                          </span>
                        </div>
                      </CircularProgress>
                      {isSelected && (
                        <div 
                          className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: progressColor }}
                        >
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="text-xs font-medium text-center px-1 mb-1">
                      {translateCategory(category.name)}
                    </div>
                    {/* Limit below circle */}
                    <div className="text-xs text-muted-foreground text-center px-1 flex items-center justify-center gap-1">
                      {amounts.hasBudget ? (
                        <span>{formatCurrency(amounts.limit)}{currencySymbol}</span>
                      ) : (
                        <Infinity className="h-3 w-3" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave}>
            {t('common.save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Load selected category IDs from localStorage
 */
export function loadSelectedCategories(): number[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load selected categories:', error);
  }
  return [];
}
