import { Sparkles, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTranslation } from '@/i18n';

interface AIAdviceBlockProps {
  onOpenChat?: () => void;
}

export function AIAdviceBlock({ onOpenChat }: AIAdviceBlockProps) {
  const { t } = useTranslation();
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
          {t('assets.ai_advisor_title')}
        </h3>
        
        <p className="text-sm text-foreground/80 mb-4" data-testid="text-ai-advice-description">
          {t('assets.ai_advisor_text')}
        </p>
        
        <Button
          variant="default"
          className="w-full bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800"
          onClick={handleClick}
          data-testid="button-open-ai-chat"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          {t('assets.get_advice')}
        </Button>
      </div>
    </Card>
  );
}
