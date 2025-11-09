import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";

export function WishlistEmptyState() {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Your wishlist is empty</p>
        <p className="text-sm text-muted-foreground mt-1">Add items you want to save up for</p>
      </CardContent>
    </Card>
  );
}
