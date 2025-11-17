import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, TrendingUp, AlertCircle, Camera, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PriceRecommendations } from "@/components/ai/price-recommendations";

interface FinancialHealthScore {
  score: number;
  status: string;
  metrics: {
    budgetAdherence: number;
    cashflowBalance: number;
    expenseStability: number;
  };
}

export default function AIAnalysisPage() {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch real financial health score
  const { data: healthScore, isLoading: isLoadingHealth } = useQuery<FinancialHealthScore>({
    queryKey: ["/api/financial-health"],
  });

  // Fetch price recommendations
  const { data: priceRecommendations, isLoading: isLoadingRecommendations } = useQuery({
    queryKey: ["/api/ai/price-recommendations"],
  });

  // Receipt upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // Convert to base64
      const base64 = await fileToBase64(file);
      
      // Extract MIME type
      const mimeType = file.type || 'image/jpeg';
      
      // Send to server
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

  // Helper function to convert File to base64
  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]); // Remove "data:image/jpeg;base64," prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Analysis failed");
      }
      
      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (error: any) {
      // Graceful fallback if API key is missing
      if (error.message.includes("API key not configured")) {
        setAnalysis("⚠️ AI Analysis is not available yet.\n\nTo enable AI-powered insights, please add your Anthropic API key in your Replit profile settings (BYOK - Bring Your Own Key).\n\n1. Visit https://console.anthropic.com/\n2. Create an API key\n3. Add it to your Replit profile settings\n4. Restart the application\n\nOnce configured, you'll get personalized spending insights and recommendations!");
      } else {
        setAnalysis(`Error: ${error.message}`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Analysis</h1>
        <p className="text-muted-foreground">Get AI-powered insights about your finances</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover-elevate">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Spending Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleAnalyze} disabled={isAnalyzing} data-testid="button-analyze">
              {isAnalyzing ? "Analyzing..." : "Analyze My Spending"}
            </Button>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Financial Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingHealth ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-32" data-testid="skeleton-health-score" />
                <Skeleton className="h-4 w-48" />
              </div>
            ) : healthScore ? (
              <>
                <div 
                  className={`text-4xl font-bold ${
                    healthScore.score >= 80 ? 'text-green-600' :
                    healthScore.score >= 60 ? 'text-blue-600' :
                    healthScore.score >= 40 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}
                  data-testid="text-health-score"
                >
                  {healthScore.score}/100
                </div>
                <p className="text-sm text-muted-foreground mt-2" data-testid="text-health-status">
                  {healthScore.status}
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                No data available yet. Add some transactions to see your score.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4" data-testid="ai-insights">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed">{analysis}</pre>
              <div className="flex gap-2">
                <Badge variant="secondary">Powered by Claude</Badge>
                <Badge variant="outline">Last updated: Just now</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

      <Accordion type="single" collapsible className="w-full" data-testid="accordion-price-recommendations">
        <AccordionItem value="price-recommendations">
          <AccordionTrigger data-testid="accordion-trigger-price-recommendations">
            Price Recommendations
          </AccordionTrigger>
          <AccordionContent>
            {isLoadingRecommendations ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" data-testid="skeleton-price-recommendations" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : priceRecommendations ? (
              <PriceRecommendations
                recommendations={priceRecommendations.recommendations || []}
                totalPotentialSavings={priceRecommendations.totalPotentialSavings || 0}
                averageSavingsPercent={priceRecommendations.averageSavingsPercent || 0}
                currency="IDR"
                aiInsights={priceRecommendations.aiInsights}
              />
            ) : (
              <p className="text-sm text-muted-foreground" data-testid="empty-price-recommendations">
                No price data available yet. Scan more receipts to discover savings!
              </p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
