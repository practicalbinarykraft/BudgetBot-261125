/**
 * Product Header Component
 *
 * Displays product name, metadata, and action buttons.
 * ~90 lines - focused on product identification.
 */

import { Package, Tag, Weight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ProductEditDialog } from "./product-edit-dialog";
import { useTranslation } from "@/i18n/context";
import { ProductCatalog } from "@shared/schemas/product-catalog";

interface ProductHeaderProps {
  product: ProductCatalog;
  showDeleteDialog: boolean;
  onDeleteDialogChange: (open: boolean) => void;
  onDelete: () => void;
  isDeleting: boolean;
}

export function ProductHeader({
  product,
  showDeleteDialog,
  onDeleteDialogChange,
  onDelete,
  isDeleting,
}: ProductHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-2">
        <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-product-name">
          {product.name}
        </h1>
        <div className="flex gap-2">
          <ProductEditDialog product={product} />
          <AlertDialog open={showDeleteDialog} onOpenChange={onDeleteDialogChange}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Delete product" data-testid="button-delete">
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("productDetail.deleteConfirmTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("productDetail.deleteConfirmDesc")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-delete" disabled={isDeleting}>
                  {t("productEdit.cancel")}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  data-testid="button-confirm-delete"
                >
                  {isDeleting ? "..." : t("productDetail.confirmDelete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        {product.category && (
          <span className="flex items-center gap-1" data-testid="text-category">
            <Package className="w-4 h-4" aria-hidden="true" />
            {product.category}
          </span>
        )}
        {product.brand && (
          <span className="flex items-center gap-1" data-testid="text-brand">
            <Tag className="w-4 h-4" aria-hidden="true" />
            {product.brand}
          </span>
        )}
        {product.weight && (
          <span className="flex items-center gap-1" data-testid="text-weight">
            <Weight className="w-4 h-4" aria-hidden="true" />
            {product.weight}
          </span>
        )}
      </div>
    </div>
  );
}
