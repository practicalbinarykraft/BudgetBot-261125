import { Sparkles, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface AIAdviceBlockProps {
  onOpenChat?: () => void;
}

export function AIAdviceBlock({ onOpenChat }: AIAdviceBlockProps) {
  const handleClick = () => {
    if (onOpenChat) {
      onOpenChat();
    } else {
      alert('AI advisor will be available soon!');
    }
  };
  
  return (
    <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 dark:from-yellow-500/5 dark:to-orange-500/5 border-orange-200 dark:border-orange-800 overflow-hidden">
      <div className="p-6">
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2" data-testid="text-ai-advice-title">
          <Sparkles className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          AI Advisor
        </h3>
        
        <p className="text-sm text-foreground/80 mb-4" data-testid="text-ai-advice-description">
          Want to optimize your assets and liabilities? 
          Our AI advisor will analyze your situation and provide personalized recommendations.
        </p>
        
        <Button
          variant="default"
          className="w-full bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800"
          onClick={handleClick}
          data-testid="button-open-ai-chat"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Get Advice
        </Button>
      </div>
    </Card>
  );
}
