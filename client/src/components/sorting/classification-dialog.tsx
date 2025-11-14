import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { TagBadge } from "@/components/tags/tag-badge";
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from "lucide-react";
import type { Transaction, Category, PersonalTag } from "@shared/schema";

interface ClassificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction;
  financialType?: 'essential' | 'discretionary' | 'asset' | 'liability';
  categories: Category[];
  tags: PersonalTag[];
  onComplete: (personalTagId?: number, categoryId?: number) => void;
  onSkip: () => void;
  isLoading: boolean;
}

const FINANCIAL_TYPE_LABELS = {
  essential: { label: 'Essential', icon: ArrowLeft, color: 'text-blue-600', bg: 'bg-blue-100' },
  discretionary: { label: 'Discretionary', icon: ArrowRight, color: 'text-green-600', bg: 'bg-green-100' },
  asset: { label: 'Asset', icon: ArrowUp, color: 'text-purple-600', bg: 'bg-purple-100' },
  liability: { label: 'Liability', icon: ArrowDown, color: 'text-red-600', bg: 'bg-red-100' },
};

export function ClassificationDialog({
  open,
  onOpenChange,
  transaction,
  financialType,
  categories,
  tags,
  onComplete,
  onSkip,
  isLoading,
}: ClassificationDialogProps) {
  const [selectedTagId, setSelectedTagId] = useState<number | undefined>(undefined);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (transaction) {
      setSelectedTagId(transaction.personalTagId ?? undefined);
      setSelectedCategoryId(transaction.categoryId ?? undefined);
    }
  }, [transaction]);

  const handleComplete = () => {
    onComplete(selectedTagId, selectedCategoryId);
  };

  if (!transaction || !financialType) return null;

  const typeInfo = FINANCIAL_TYPE_LABELS[financialType];
  const Icon = typeInfo.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-classification">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${typeInfo.bg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${typeInfo.color}`} />
            </div>
            <span>Classified as {typeInfo.label}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="tag-select">Personal Tag (Optional)</Label>
            <Select
              value={selectedTagId?.toString()}
              onValueChange={(value) => setSelectedTagId(parseInt(value))}
            >
              <SelectTrigger id="tag-select" data-testid="select-tag">
                <SelectValue placeholder="Select tag..." />
              </SelectTrigger>
              <SelectContent>
                {tags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id.toString()}>
                    <div className="flex items-center gap-2">
                      <TagBadge tag={tag} />
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-select">Category (Optional)</Label>
            <Select
              value={selectedCategoryId?.toString()}
              onValueChange={(value) => setSelectedCategoryId(parseInt(value))}
            >
              <SelectTrigger id="category-select" data-testid="select-category">
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onSkip}
            disabled={isLoading}
            data-testid="button-skip"
          >
            Skip
          </Button>
          <Button
            onClick={handleComplete}
            disabled={isLoading}
            data-testid="button-save-classification"
          >
            {isLoading ? 'Saving...' : 'Save & Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
