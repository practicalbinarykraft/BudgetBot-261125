/**
 * User Timeline Component
 *
 * Displays user activity timeline
 * Junior-Friendly: Simple list, clear events
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  UserPlus, 
  LogIn, 
  DollarSign, 
  Wallet, 
  Target, 
  Sparkles,
  Receipt,
  Gift,
  CreditCard,
} from "lucide-react";
import { useTranslation } from "@/i18n/context";

interface UserTimelineProps {
  userId: number;
}

interface TimelineEvent {
  timestamp: Date;
  type: string;
  description: string;
  icon: React.ReactNode;
}

// Generate mock timeline events
function generateMockTimeline(userId: number, t: (key: string, params?: Record<string, any>) => string): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const now = new Date();

  // Signup event
  const signupDate = new Date(now);
  signupDate.setDate(signupDate.getDate() - 45);
  events.push({
    timestamp: signupDate,
    type: 'signup',
    description: t('admin.user_timeline.event.signup'),
    icon: <UserPlus className="h-4 w-4" />,
  });

  // First transaction
  const firstTxDate = new Date(signupDate);
  firstTxDate.setDate(firstTxDate.getDate() + 1);
  events.push({
    timestamp: firstTxDate,
    type: 'transaction',
    description: t('admin.user_timeline.event.transaction', { description: 'Grocery shopping', amount: '$45.32' }),
    icon: <DollarSign className="h-4 w-4" />,
  });

  // Wallet creation
  const walletDate = new Date(firstTxDate);
  walletDate.setDate(walletDate.getDate() + 2);
  events.push({
    timestamp: walletDate,
    type: 'wallet',
    description: t('admin.user_timeline.event.wallet', { name: 'Main Card' }),
    icon: <Wallet className="h-4 w-4" />,
  });

  // OCR scan
  const ocrDate = new Date(walletDate);
  ocrDate.setDate(ocrDate.getDate() + 5);
  events.push({
    timestamp: ocrDate,
    type: 'ocr',
    description: t('admin.user_timeline.event.ocr'),
    icon: <Receipt className="h-4 w-4" />,
  });

  // AI chat
  const aiDate = new Date(ocrDate);
  aiDate.setDate(aiDate.getDate() + 1);
  events.push({
    timestamp: aiDate,
    type: 'ai_chat',
    description: t('admin.user_timeline.event.ai_chat', { count: 12 }),
    icon: <Sparkles className="h-4 w-4" />,
  });

  // Plan upgrade
  const upgradeDate = new Date(aiDate);
  upgradeDate.setDate(upgradeDate.getDate() + 10);
  events.push({
    timestamp: upgradeDate,
    type: 'upgrade',
    description: t('admin.user_timeline.event.upgrade', { fromPlan: 'Free', toPlan: 'Pro', price: '$9.99' }),
    icon: <CreditCard className="h-4 w-4" />,
  });

  // Referral
  const referralDate = new Date(upgradeDate);
  referralDate.setDate(referralDate.getDate() + 5);
  events.push({
    timestamp: referralDate,
    type: 'referral',
    description: t('admin.user_timeline.event.referral', { username: '@friend_user' }),
    icon: <Gift className="h-4 w-4" />,
  });

  // Recent login
  const loginDate = new Date(now);
  loginDate.setDate(loginDate.getDate() - 2);
  events.push({
    timestamp: loginDate,
    type: 'login',
    description: t('admin.user_timeline.event.login'),
    icon: <LogIn className="h-4 w-4" />,
  });

  // Sort by timestamp (newest first)
  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export function UserTimeline({ userId }: UserTimelineProps) {
  const { t } = useTranslation();
  // TODO: Replace with real API call
  const timeline = generateMockTimeline(userId, t);

  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      signup: 'text-blue-600 bg-blue-50',
      login: 'text-green-600 bg-green-50',
      transaction: 'text-purple-600 bg-purple-50',
      wallet: 'text-indigo-600 bg-indigo-50',
      ocr: 'text-orange-600 bg-orange-50',
      ai_chat: 'text-pink-600 bg-pink-50',
      upgrade: 'text-yellow-600 bg-yellow-50',
      referral: 'text-cyan-600 bg-cyan-50',
    };
    return colors[type] || 'text-gray-600 bg-gray-50';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.user_timeline.title')}</CardTitle>
        <CardDescription>{t('admin.user_timeline.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timeline.map((event, index) => (
            <div key={index} className="flex gap-4">
              {/* Icon */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getEventColor(event.type)}`}>
                {event.icon}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4 border-b border-gray-200 last:border-0">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{event.description}</div>
                  <div className="text-sm text-gray-500">
                    {event.timestamp.toLocaleDateString()} {event.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

