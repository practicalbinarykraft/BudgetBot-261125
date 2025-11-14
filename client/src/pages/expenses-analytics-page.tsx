import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CategoryTab } from '@/components/analytics/tabs/category-tab';
import { PersonTab } from '@/components/analytics/tabs/person-tab';
import { TypeTab } from '@/components/analytics/tabs/type-tab';
import { UnsortedTab } from '@/components/analytics/tabs/unsorted-tab';

export default function ExpensesAnalyticsPage() {
  const [period, setPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('category');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-page-title">
                Expense Analytics
              </h1>
              <p className="text-muted-foreground">
                Analyze your spending across categories, people, and types
              </p>
            </div>
          </div>

          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]" data-testid="select-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4" data-testid="tabs-list">
            <TabsTrigger value="category" data-testid="tab-category">
              By Category
            </TabsTrigger>
            <TabsTrigger value="person" data-testid="tab-person">
              By Person
            </TabsTrigger>
            <TabsTrigger value="type" data-testid="tab-type">
              By Type
            </TabsTrigger>
            <TabsTrigger value="unsorted" data-testid="tab-unsorted">
              Unsorted
            </TabsTrigger>
          </TabsList>

          <TabsContent value="category" className="space-y-4">
            <CategoryTab period={period} />
          </TabsContent>

          <TabsContent value="person" className="space-y-4">
            <PersonTab period={period} />
          </TabsContent>

          <TabsContent value="type" className="space-y-4">
            <TypeTab period={period} />
          </TabsContent>

          <TabsContent value="unsorted" className="space-y-4">
            <UnsortedTab period={period} />
          </TabsContent>
        </Tabs>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              AI Insights
              <span className="text-xs text-muted-foreground font-normal">
                (Coming Soon)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              AI-powered spending analysis and recommendations will appear here once implemented.
              The system will identify optimization opportunities and suggest ways to improve your financial habits.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
