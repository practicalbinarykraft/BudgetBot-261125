import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReceiptScannerProps {
  onSuccess?: (result: any) => void;
}

export function ReceiptScanner({ onSuccess }: ReceiptScannerProps) {
  const [uploadResult, setUploadResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const base64 = await fileToBase64(file);
      const mimeType = file.type || 'image/jpeg';
      
      const response = await fetch('/api/ai/receipt-with-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          imageBase64: base64,
          mimeType: mimeType
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to parse receipt');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setUploadResult(data);
      const merchant = data.receipt?.merchant || 'receipt';
      toast({
        title: "Receipt scanned successfully!",
        description: `Found ${data.itemsCount || 0} items from ${merchant}`,
      });
      onSuccess?.(data);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to scan receipt",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
  };

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Receipt OCR Scanner
        </CardTitle>
        <CardDescription>
          Upload a receipt to automatically extract items and prices
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            type="file"
            accept="image/*"
            onChange={handleReceiptUpload}
            ref={fileInputRef}
            className="hidden"
            data-testid="input-receipt-file"
          />
          
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            data-testid="button-scan-receipt"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                Upload Receipt
              </>
            )}
          </Button>
          
          {uploadResult && (
            <div className="mt-4 space-y-3">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg" data-testid="receipt-result">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  ✓ Receipt scanned successfully!
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Found {uploadResult.itemsCount || 0} items from {uploadResult.receipt?.merchant || 'receipt'}
                </p>
              </div>

              {uploadResult.receipt?.items && uploadResult.receipt.items.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted px-4 py-2">
                    <p className="text-sm font-medium">Extracted Items</p>
                  </div>
                  <div className="divide-y" data-testid="receipt-items-list">
                    {uploadResult.receipt.items.map((item: any, index: number) => (
                      <div key={index} className="px-4 py-3 hover-elevate" data-testid={`receipt-item-${index}`}>
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {item.name || 'Unknown item'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Qty: {item.quantity || 1}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-medium">
                              {item.totalPrice || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              @ {item.pricePerUnit || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {uploadResult.receipt.total && (
                    <div className="bg-muted px-4 py-2 border-t">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Total</span>
                        <span>{uploadResult.receipt.total}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
