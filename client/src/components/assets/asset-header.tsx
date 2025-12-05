/**
 * Asset Header Component
 *
 * Displays asset name, type badge, image, and action buttons.
 * ~90 lines - focused on asset identification.
 */

import { TrendingUp, TrendingDown, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AssetWithCategory } from "@/lib/types/assets";

interface AssetHeaderProps {
  asset: AssetWithCategory;
  onEdit: () => void;
  onDelete: () => void;
}

export function AssetHeader({ asset, onEdit, onDelete }: AssetHeaderProps) {
  return (
    <>
      {/* Image */}
      {asset.imageUrl && (
        <div className="rounded-lg overflow-hidden">
          <img
            src={asset.imageUrl}
            alt={asset.name}
            className="w-full h-48 md:h-64 object-cover"
            data-testid="img-asset"
          />
        </div>
      )}

      {/* Title and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-1 rounded text-sm font-medium flex items-center gap-1 ${
                asset.type === "asset"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}
              role="status"
            >
              {asset.type === "asset" ? (
                <>
                  <TrendingUp className="w-3 h-3" aria-hidden="true" />
                  <span>Asset</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3 h-3" aria-hidden="true" />
                  <span>Liability</span>
                </>
              )}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1" data-testid="text-asset-name">
            {asset.name}
          </h1>
          {asset.location && (
            <p className="text-muted-foreground">{asset.location}</p>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onEdit}
            aria-label="Edit asset"
            data-testid="button-edit"
          >
            <Edit className="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onDelete}
            className="text-red-600 hover:text-red-700"
            aria-label="Delete asset"
            data-testid="button-delete"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </>
  );
}
