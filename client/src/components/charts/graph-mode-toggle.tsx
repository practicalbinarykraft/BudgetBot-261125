import { Button } from '@/components/ui/button';
import { Settings, ArrowLeft } from 'lucide-react';
import type { GraphMode } from '@shared/types/graph-mode';
import { useTranslation } from '@/i18n';

interface GraphModeToggleProps {
  mode: GraphMode;
  onToggle: () => void;
}

export function GraphModeToggle({ mode, onToggle }: GraphModeToggleProps) {
  const { t } = useTranslation();
  
  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={onToggle}
      className="gap-1.5"
      data-testid="button-toggle-graph-mode"
    >
      {mode === 'lite' ? (
        <>
          <Settings className="w-4 h-4" />
          <span>{t('dashboard.graph_mode_pro')}</span>
        </>
      ) : (
        <>
          <ArrowLeft className="w-4 h-4" />
          <span>{t('dashboard.graph_mode_lite')}</span>
        </>
      )}
    </Button>
  );
}
