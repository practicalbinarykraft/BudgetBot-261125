import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTransactionSchema } from "@shared/schema";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Category, PersonalTag } from "@shared/schema";
import { Plus } from "lucide-react";
import { CategoryCreateDialog } from "@/components/categories/category-create-dialog";
import { TagSelector } from "@/components/tags/tag-selector";

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPersonalTagId?: number | null;
}

interface TransactionResponse {
  id: number;
  userId: number;
  date: string;
  type: string;
  amount: string;
  description: string;
  category: string | null;
  categoryId: number | null;
  currency: string | null;
  amountUsd: string;
  mlSuggested: boolean;
  mlConfidence: number;
}

const formSchema = insertTransactionSchema.extend({
  amount: z.string().min(1, "Amount is required"),
});

type FormData = z.infer<typeof formSchema>;

export function AddTransactionDialog({ open, onOpenChange, defaultPersonalTagId }: AddTransactionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateCategory, setShowCreateCategory] = useState(false);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: open,
  });

  const { data: tags = [] } = useQuery<PersonalTag[]>({
    queryKey: ["/api/tags"],
    enabled: open,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: user?.id || 0,
      date: new Date().toISOString().split("T")[0],
      type: "expense",
      amount: "",
      amountUsd: "0",
      description: "",
      category: "",
      currency: "USD",
      source: "manual",
      walletId: undefined,
      personalTagId: defaultPersonalTagId ?? null,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const amountNum = parseFloat(data.amount);
      const payload = {
        ...data,
        amount: data.amount,
        amountUsd: data.amount,
      };
      const res = await apiRequest("POST", "/api/transactions", payload);
      return res.json() as Promise<TransactionResponse>;
    },
    onSuccess: (transaction: TransactionResponse) => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tags"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/sorting/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/unsorted"], exact: false });
      
      if (transaction.mlSuggested && transaction.category) {
        toast({
          title: "Smart Suggestion Applied",
          description: `Category "${transaction.category}" auto-selected (${Math.round(transaction.mlConfidence * 100)}% confidence)`,
        });
      } else {
        toast({
          title: "Success",
          description: "Transaction added successfully",
        });
      }
      
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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
                        data-testid="input-amount"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger data-testid="select-currency">
                          <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="RUB">RUB (₽)</SelectItem>
                        <SelectItem value="IDR">IDR (Rp)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Coffee, groceries, etc." data-testid="input-description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowCreateCategory(true);
                        }}
                        className="w-full px-2 py-1.5 text-sm text-left hover-elevate active-elevate-2 rounded-sm flex items-center gap-2 text-primary"
                        data-testid="button-create-category"
                      >
                        <Plus className="h-4 w-4" />
                        Create new category
                      </button>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personalTagId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag (Optional)</FormLabel>
                  <FormControl>
                    <TagSelector
                      value={field.value ?? null}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" data-testid="input-date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
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
                disabled={createMutation.isPending}
                className="flex-1"
                data-testid="button-submit-transaction"
              >
                {createMutation.isPending ? "Adding..." : "Add Transaction"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>

      <CategoryCreateDialog
        open={showCreateCategory}
        onOpenChange={setShowCreateCategory}
        defaultType={form.watch("type") as "income" | "expense"}
        onSuccess={(categoryName) => {
          form.setValue("category", categoryName);
        }}
      />
    </Dialog>
  );
}
