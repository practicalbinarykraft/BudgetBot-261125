import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWishlistSchema } from "@shared/schema";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = insertWishlistSchema.extend({
  amount: z.string().min(1, "Amount is required"),
});

export type WishlistFormData = z.infer<typeof formSchema>;

interface WishlistFormProps {
  userId: number;
  onSubmit: (data: WishlistFormData) => void;
  onCancel: () => void;
  isPending: boolean;
}

export function WishlistForm({ userId, onSubmit, onCancel, isPending }: WishlistFormProps) {
  const form = useForm<WishlistFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId,
      name: "",
      amount: "",
      targetDate: "",
      priority: "medium",
      isPurchased: false,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. New Laptop" data-testid="input-wishlist-name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  data-testid="input-wishlist-amount"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priority</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-wishlist-priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="targetDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Date (Optional)</FormLabel>
              <FormControl>
                <Input type="date" data-testid="input-wishlist-date" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            data-testid="button-cancel-wishlist"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="flex-1"
            data-testid="button-submit-wishlist"
          >
            {isPending ? "Adding..." : "Add Item"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
