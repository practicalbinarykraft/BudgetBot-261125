import type { PersonalTag } from '@shared/schema';
import { User, Heart, Home, Users, Baby, UserPlus, Briefcase, Gift, Dog, Cat } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface TagBadgeProps {
  tag: Pick<PersonalTag, 'icon' | 'name' | 'color'>;
  className?: string;
}

const ICON_MAP: Record<string, LucideIcon> = {
  User,
  Heart,
  Home,
  Users,
  Baby,
  UserPlus,
  Briefcase,
  Gift,
  Dog,
  Cat,
};

export function TagBadge({ tag, className = '' }: TagBadgeProps) {
  const IconComponent = ICON_MAP[tag.icon || 'User'] || User;
  
  return (
    <span 
      className={`inline-flex items-center gap-1 max-w-full ${className}`}
      style={{ color: tag.color || '#3b82f6' }}
      data-testid={`tag-badge-${tag.name}`}
    >
      <IconComponent className="h-4 w-4 flex-shrink-0" data-testid={`tag-icon-${tag.name}`} />
      <span className="text-sm font-medium truncate" data-testid={`tag-name-${tag.name}`}>
        {tag.name}
      </span>
    </span>
  );
}
