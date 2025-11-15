import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useQuery } from "@tanstack/react-query";
import { Calendar, DollarSign, Tag } from "lucide-react";
import type { Category } from "@shared/schema";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format"),
  targetDate: z.string().min(1, "Target date is required"),
  category: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddPlannedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: FormData) => void;
  isSubmitting?: boolean;
}

export function AddPlannedDialog({ open, onOpenChange, onAdd, isSubmitting }: AddPlannedDialogProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      amount: "",
      targetDate: "",
      category: "",
    },
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: open,
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const handleSubmit = (data: FormData) => {
    onAdd(data);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isSubmitting) {
      return;
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent data-testid="dialog-add-planned">
        <DialogHeader>
          <DialogTitle>Add Planned Purchase</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter item name"
                      data-testid="input-planned-name"
                    />
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
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type="text"
                        placeholder="0.00"
                        className="pl-10"
                        data-testid="input-planned-amount"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Date</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type="date"
                        className="pl-10"
                        data-testid="input-planned-date"
                      />
                    </div>
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <SelectTrigger 
                          className="pl-10"
                          data-testid="select-planned-category"
                        >
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </div>
                    </FormControl>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button"
                variant="outline" 
                onClick={() => handleOpenChange(false)}
                data-testid="button-cancel-add-planned"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                data-testid="button-confirm-add-planned"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adding..." : "Add Plan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
