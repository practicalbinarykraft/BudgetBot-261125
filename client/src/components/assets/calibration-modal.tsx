/**
 * Calibration Modal Component
 *
 * Modal for updating asset price manually.
 * ~85 lines - focused on price calibration form.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { AssetWithCategory } from "@/lib/types/assets";

interface CalibrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: AssetWithCategory;
  onSuccess: () => void;
}

export function CalibrationModal({ open, onOpenChange, asset, onSuccess }: CalibrationModalProps) {
  const [newValue, setNewValue] = useState(asset.currentValue);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const calibrateMutation = useMutation({
    mutationFn: async (data: { newValue: string; notes: string; source: string }) => {
      const res = await fetch(`/api/assets/${asset.id}/calibrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to calibrate");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Price calibrated",
        description: "Asset value has been updated successfully.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to calibrate price",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    calibrateMutation.mutate({
      newValue,
      notes,
      source: "manual",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Calibrate Price</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="new-value">New Price (USD)</Label>
            <Input
              id="new-value"
              type="number"
              step="0.01"
              required
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              data-testid="input-new-value"
            />
          </div>

          <div>
            <Label htmlFor="source">Source (optional)</Label>
            <Input
              id="source"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Real estate website, appraiser..."
              data-testid="input-source"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={calibrateMutation.isPending}
              className="flex-1"
              data-testid="button-submit"
            >
              {calibrateMutation.isPending ? "Saving..." : "Calibrate"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
