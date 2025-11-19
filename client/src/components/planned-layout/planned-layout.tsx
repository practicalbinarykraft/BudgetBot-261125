import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LucideIcon } from "lucide-react";

interface TabConfig {
  value: string;
  label: string;
  count: number;
}

interface PlannedLayoutProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  addButtonText: string;
  onAdd: () => void;
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptySubtitle: string;
  isEmpty: boolean;
  children?: React.ReactNode;
  isLoading?: boolean;
  loadingElement?: React.ReactNode;
}

export function PlannedLayout({
  title,
  subtitle,
  icon: Icon,
  addButtonText,
  onAdd,
  tabs,
  activeTab,
  onTabChange,
  emptyIcon: EmptyIcon,
  emptyTitle,
  emptySubtitle,
  isEmpty,
  children,
  isLoading,
  loadingElement,
}: PlannedLayoutProps) {
  if (isLoading && loadingElement) {
    return <>{loadingElement}</>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Icon className="h-8 w-8" />
            {title}
          </h1>
          <p className="text-muted-foreground mt-1" data-testid="text-page-description">
            {subtitle}
          </p>
        </div>
        <Button onClick={onAdd} data-testid="button-add">
          {addButtonText}
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={onTabChange} className="h-full flex flex-col">
          <TabsList className="mx-6 mt-4 w-fit" data-testid="tabs-filter">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} data-testid={`tab-${tab.value}`}>
                {tab.label} ({tab.count})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="flex-1 px-6 pb-6 mt-4">
            {isEmpty ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <EmptyIcon className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2" data-testid="text-empty-title">
                  {emptyTitle}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md" data-testid="text-empty-description">
                  {emptySubtitle}
                </p>
                {activeTab === tabs[0].value && (
                  <Button onClick={onAdd} data-testid="button-add-first">
                    {addButtonText}
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4" data-testid="list-items">
                {children}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
