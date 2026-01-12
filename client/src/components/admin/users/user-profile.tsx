/**
 * User Profile Component
 *
 * Displays user profile information
 * Junior-Friendly: Simple cards, clear layout
 */

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Mail, MessageSquare, Gift, Ban, CreditCard, TrendingUp, Users, Tag, FileText, DollarSign, AlertTriangle, CheckCircle2, Clock, XCircle, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { MockUser } from "@/lib/admin/api/admin-api";
import { adminApi } from "@/lib/admin/api/admin-api";
import { adminQueryKeys } from "@/lib/admin/api/admin-query-keys";
import { useTranslation } from "@/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserProfileProps {
  user: MockUser;
  userId: string | number; // ID пользователя для инвалидации кэша
}

export function UserProfile({ user, userId }: UserProfileProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState(user.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  
  // Модальные окна
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [creditsAmount, setCreditsAmount] = useState(100);
  
  // Форма редактирования
  const [editForm, setEditForm] = useState({
    name: user.name || '',
    email: user.email || '',
    password: '',
    isBlocked: user.status === 'blocked',
  });

  // Синхронизируем форму при изменении пользователя
  useEffect(() => {
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      isBlocked: user.status === 'blocked',
    });
  }, [user]);
  
  // Мутации для действий
  const blockMutation = useMutation({
    mutationFn: () => adminApi.blockUser(user.id),
    onSuccess: () => {
      toast({
        title: t('admin.user_profile.user_blocked'),
        description: t('admin.user_profile.user_blocked_description'),
      });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.userDetail(userId) });
      setShowBlockDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: t('admin.user_profile.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const unblockMutation = useMutation({
    mutationFn: () => adminApi.unblockUser(user.id),
    onSuccess: () => {
      toast({
        title: t('admin.user_profile.user_unblocked'),
        description: t('admin.user_profile.user_unblocked_description'),
      });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.userDetail(userId) });
    },
    onError: (error: Error) => {
      toast({
        title: t('admin.user_profile.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const grantCreditsMutation = useMutation({
    mutationFn: (amount: number) => {
      const mutationData = { userId, user_id: user.id, amount };
      console.log('[DEBUG] grantCreditsMutation - Starting mutation:', mutationData);
      return adminApi.grantCredits(user.id, amount);
    },
    onSuccess: async (data) => {
      console.log('[DEBUG] grantCreditsMutation - Success:', data);
      toast({
        title: t('admin.user_profile.credits_granted'),
        description: t('admin.user_profile.credits_granted_description', { amount: creditsAmount }),
      });
      // Инвалидируем и принудительно перезапрашиваем данные
      console.log('[DEBUG] grantCreditsMutation - Invalidating queries with key:', adminQueryKeys.userDetail(userId));
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.userDetail(userId) });
      console.log('[DEBUG] grantCreditsMutation - Refetching queries');
      await queryClient.refetchQueries({ queryKey: adminQueryKeys.userDetail(userId) });
      console.log('[DEBUG] grantCreditsMutation - Queries refetched');
      setShowCreditsDialog(false);
      setCreditsAmount(100);
    },
    onError: (error: Error) => {
      toast({
        title: t('admin.user_profile.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (data: { name?: string; email?: string; password?: string; isBlocked?: boolean }) => 
      adminApi.updateUser(user.id, data),
    onSuccess: () => {
      toast({
        title: t('admin.user_profile.user_updated'),
        description: t('admin.user_profile.user_updated_description'),
      });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.userDetail(userId) });
      setShowEditDialog(false);
      // Сброс формы
      setEditForm({
        name: user.name || '',
        email: user.email || '',
        password: '',
        isBlocked: user.status === 'blocked',
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('admin.user_profile.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleBlock = () => {
    if (user.status === 'blocked') {
      unblockMutation.mutate();
    } else {
      setShowBlockDialog(true);
    }
  };

  const handleGrantCredits = () => {
    setShowCreditsDialog(true);
  };

  const handleSendEmail = () => {
    toast({
      title: t('admin.user_profile.coming_soon'),
      description: t('admin.user_profile.email_feature_coming_soon'),
    });
  };

  const handleSendTelegram = () => {
    toast({
      title: t('admin.user_profile.coming_soon'),
      description: t('admin.user_profile.telegram_feature_coming_soon'),
    });
  };

  const handleEdit = () => {
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      isBlocked: user.status === 'blocked',
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    const updateData: { name?: string; email?: string; password?: string; isBlocked?: boolean } = {};
    
    if (editForm.name !== user.name) {
      updateData.name = editForm.name;
    }
    if (editForm.email !== user.email) {
      updateData.email = editForm.email;
    }
    if (editForm.password && editForm.password.length >= 6) {
      updateData.password = editForm.password;
    }
    if (editForm.isBlocked !== (user.status === 'blocked')) {
      updateData.isBlocked = editForm.isBlocked;
    }
    
    if (Object.keys(updateData).length === 0) {
      toast({
        title: t('admin.user_profile.no_changes'),
        description: t('admin.user_profile.no_changes_description'),
      });
      return;
    }
    
    updateUserMutation.mutate(updateData);
  };

  const handleEditPlan = () => {
    toast({
      title: t('admin.user_profile.coming_soon'),
      description: t('admin.user_profile.edit_plan_coming_soon'),
    });
  };
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'blocked': return 'destructive';
      case 'churned': return 'outline';
      default: return 'secondary';
    }
  };

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'pro': return 'default';
      case 'starter': return 'secondary';
      case 'byok': return 'outline';
      case 'free': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('admin.user_profile.basic_info')}</CardTitle>
              <CardDescription>{t('admin.user_profile.basic_info_description')}</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              {t('admin.user_profile.edit')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Name</div>
              <div className="font-medium">{user.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Email</div>
              <div className="font-medium">{user.email}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Status</div>
              <Badge variant={getStatusBadgeVariant(user.status)}>
                {user.status}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-gray-600">Plan</div>
              <Badge variant={getPlanBadgeVariant(user.plan)}>
                {user.plan}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-gray-600">Telegram</div>
              {user.telegram ? (
                <div className="font-medium">
                  @{user.telegram.username} ({user.telegram.id})
                </div>
              ) : (
                <div className="text-gray-400">{t('admin.user_profile.telegram_not_linked')}</div>
              )}
            </div>
            <div>
              <div className="text-sm text-gray-600">Lifecycle Stage</div>
              <Badge variant="outline">{user.stage}</Badge>
            </div>
            <div>
              <div className="text-sm text-gray-600">Signup Date</div>
              <div className="font-medium">
                {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Days Since Signup</div>
              <div className="font-medium">{user.daysSinceSignup} days</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Engagement Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.user_profile.engagement')}</CardTitle>
          <CardDescription>{t('admin.user_profile.engagement_description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Total Transactions</div>
              <div className="text-2xl font-bold">{user.transactionsCount}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Last Active</div>
              <div className="font-medium">
                {new Date(user.lastActiveAt).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Days Since Last Active</div>
              <div className="font-medium">
                {Math.floor((Date.now() - new Date(user.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24))} days
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.user_profile.subscription')}</CardTitle>
          <CardDescription>{t('admin.user_profile.subscription_description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">MRR</div>
              <div className="text-2xl font-bold">
                {user.mrr > 0 ? `$${user.mrr.toFixed(2)}` : "-"}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">LTV</div>
              <div className="text-2xl font-bold">${(user.ltv ?? 0).toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Spent</div>
              <div className="text-2xl font-bold">${(user.totalSpent ?? 0).toFixed(2)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credits & Limits Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('admin.user_profile.credits')}</CardTitle>
              <CardDescription>{t('admin.user_profile.credits_description')}</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleGrantCredits}
            >
              <Gift className="h-4 w-4 mr-2" />
              {t('admin.user_profile.grant_credits')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">{t('admin.user_profile.credits_total')}</div>
              <div className="text-2xl font-bold">{user.credits?.total ?? 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('admin.user_profile.credits_used')}</div>
              <div className="text-2xl font-bold text-orange-600">{user.credits?.used ?? 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('admin.user_profile.credits_remaining')}</div>
              <div className="text-2xl font-bold text-green-600">{user.credits?.remaining ?? 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('admin.user_profile.credits_usage_percent')}</div>
              <div className="text-2xl font-bold">
                {(user.credits?.total ?? 0) > 0 ? Math.round(((user.credits?.used ?? 0) / (user.credits?.total ?? 1)) * 100) : 0}%
              </div>
            </div>
          </div>
          {(user.credits?.total ?? 0) > 0 && (
            <div className="mt-4">
              <Progress 
                value={((user.credits?.used ?? 0) / (user.credits?.total ?? 1)) * 100} 
                className="h-2"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acquisition Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.user_profile.acquisition')}</CardTitle>
          <CardDescription>{t('admin.user_profile.acquisition_description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">{t('admin.user_profile.acquisition_source')}</div>
              <Badge variant="outline" className="mt-1">
                {t(`admin.user_profile.acquisition_source.${user.acquisition?.source ?? 'organic'}`)}
              </Badge>
            </div>
            {user.acquisition?.campaign && (
              <div>
                <div className="text-sm text-gray-600">{t('admin.user_profile.acquisition_campaign')}</div>
                <div className="font-medium">{user.acquisition.campaign}</div>
              </div>
            )}
            {user.acquisition?.medium && (
              <div>
                <div className="text-sm text-gray-600">{t('admin.user_profile.acquisition_medium')}</div>
                <div className="font-medium">{user.acquisition.medium}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-gray-600">{t('admin.user_profile.acquisition_first_touch')}</div>
              <div className="font-medium">
                {user.acquisition?.firstTouchDate ? new Date(user.acquisition.firstTouchDate).toLocaleDateString() : '-'}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <div className="text-sm text-gray-600">{t('admin.user_profile.acquisition_cac')}</div>
              <div className="text-2xl font-bold">
                ${(user.acquisition?.cac ?? 0).toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {t('admin.user_profile.acquisition_cac_description')}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('admin.user_profile.roi')}</div>
              <div className="text-2xl font-bold">
                {(user.acquisition?.cac ?? 0) > 0 && (user.ltv ?? 0) > 0 ? ((user.ltv ?? 0) / (user.acquisition?.cac ?? 1)).toFixed(2) : '∞'}:1
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {t('admin.user_profile.roi_description')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Engagement Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.user_profile.engagement')}</CardTitle>
          <CardDescription>{t('admin.user_profile.engagement_description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">{t('admin.user_profile.engagement_score')}</div>
              <div className="text-2xl font-bold">{user.engagement?.score ?? 0}/100</div>
              <Progress value={user.engagement?.score ?? 0} className="h-2 mt-2" />
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('admin.user_profile.engagement_dau')}</div>
              <div className="text-2xl font-bold">{user.engagement?.dau ?? 0}</div>
              <div className="text-xs text-gray-500 mt-1">
                {t('admin.user_profile.engagement_dau_description')}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('admin.user_profile.engagement_mau')}</div>
              <div className="text-2xl font-bold">{user.engagement?.mau ?? 0}</div>
              <div className="text-xs text-gray-500 mt-1">
                {t('admin.user_profile.engagement_mau_description')}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('admin.user_profile.engagement_last_feature')}</div>
              <div className="font-medium">
                {user.engagement?.lastFeatureUsed ? (
                  <Badge variant="outline">{user.engagement.lastFeatureUsed}</Badge>
                ) : (
                  <span className="text-gray-400">{t('admin.common.na')}</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.user_profile.support')}</CardTitle>
          <CardDescription>{t('admin.user_profile.support_description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">{t('admin.user_profile.support_tickets')}</div>
              <div className="text-2xl font-bold">{user.support?.ticketsCount ?? 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('admin.user_profile.support_last_ticket')}</div>
              <div className="font-medium">
                {user.support?.lastTicketDate ? (
                  new Date(user.support.lastTicketDate).toLocaleDateString()
                ) : (
                  <span className="text-gray-400">{t('admin.user_profile.support_no_tickets')}</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tags Card */}
      {user.tags && user.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.user_profile.tags')}</CardTitle>
            <CardDescription>{t('admin.user_profile.tags_description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {user.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('admin.user_profile.notes')}</CardTitle>
              <CardDescription>{t('admin.user_profile.notes_description')}</CardDescription>
            </div>
            {!isEditingNotes && (
              <Button variant="outline" size="sm" onClick={() => setIsEditingNotes(true)}>
                <Edit className="h-4 w-4 mr-2" />
                {t('admin.user_profile.edit')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditingNotes ? (
            <div className="space-y-2">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('admin.user_profile.notes_placeholder')}
                rows={4}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => {
                  // TODO: Save notes to API
                  setIsEditingNotes(false);
                }}>
                  {t('admin.user_profile.notes_save')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  setNotes(user.notes || '');
                  setIsEditingNotes(false);
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-700 whitespace-pre-wrap">
              {notes || <span className="text-gray-400 italic">{t('admin.user_profile.notes_placeholder')}</span>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral Card */}
      {(user.referralCode || user.referredBy || user.referralsCount > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.user_profile.lifecycle')}</CardTitle>
            <CardDescription>{t('admin.user_profile.lifecycle_description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {user.referralCode && (
                <div>
                  <div className="text-sm text-gray-600">Referral Code</div>
                  <div className="font-medium">{user.referralCode}</div>
                </div>
              )}
              {user.referredBy && (
                <div>
                  <div className="text-sm text-gray-600">Referred By</div>
                  <div className="font-medium">{user.referredBy}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-600">Referrals Made</div>
                <div className="text-2xl font-bold">{user.referralsCount}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Score Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.user_profile.risk_score')}</CardTitle>
          <CardDescription>{t('admin.user_profile.risk_score_description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="text-sm text-gray-600 mb-2">{t('admin.user_profile.risk_score.value')}</div>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "text-4xl font-bold",
                  user.riskScore.score < 30 ? "text-green-600" :
                  user.riskScore.score < 60 ? "text-yellow-600" : "text-red-600"
                )}>
                  {user.riskScore.score}
                </div>
                <div className="flex-1">
                  <Progress 
                    value={user.riskScore.score} 
                    className={cn(
                      "h-3",
                      user.riskScore.score < 30 ? "[&>div]:bg-green-600" :
                      user.riskScore.score < 60 ? "[&>div]:bg-yellow-600" : "[&>div]:bg-red-600"
                    )}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {user.riskScore.score < 30 ? t('admin.user_profile.risk_score.low') :
                     user.riskScore.score < 60 ? t('admin.user_profile.risk_score.medium') :
                     t('admin.user_profile.risk_score.high')}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {user.riskScore.factors.length > 0 && (
            <div>
              <div className="text-sm text-gray-600 mb-2">{t('admin.user_profile.risk_score.factors')}</div>
              <div className="flex flex-wrap gap-2">
                {user.riskScore.factors.map((factor, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {factor}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Best Action Card */}
      {user.nextBestAction && (
        <Card className={cn(
          "border-2",
          user.nextBestAction.priority === 'high' ? "border-red-200 bg-red-50" :
          user.nextBestAction.priority === 'medium' ? "border-yellow-200 bg-yellow-50" :
          "border-blue-200 bg-blue-50"
        )}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className={cn(
                "h-5 w-5",
                user.nextBestAction.priority === 'high' ? "text-red-600" :
                user.nextBestAction.priority === 'medium' ? "text-yellow-600" :
                "text-blue-600"
              )} />
              <CardTitle>{t('admin.user_profile.next_best_action')}</CardTitle>
            </div>
            <CardDescription>{t('admin.user_profile.next_best_action_description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-gray-600">{t('admin.user_profile.next_best_action.action')}</div>
              <div className="font-semibold text-lg">{user.nextBestAction.action}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('admin.user_profile.next_best_action.reason')}</div>
              <div className="text-sm">{user.nextBestAction.reason}</div>
            </div>
            <div>
              <Badge variant={user.nextBestAction.priority === 'high' ? 'destructive' : user.nextBestAction.priority === 'medium' ? 'default' : 'secondary'}>
                {t(`admin.user_profile.next_best_action.priority.${user.nextBestAction.priority}`)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History Card */}
      {user.paymentHistory && user.paymentHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.user_profile.payment_history')}</CardTitle>
            <CardDescription>{t('admin.user_profile.payment_history_description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.user_profile.payment_date')}</TableHead>
                    <TableHead>{t('admin.user_profile.payment_amount')}</TableHead>
                    <TableHead>{t('admin.user_profile.payment_type')}</TableHead>
                    <TableHead>{t('admin.user_profile.payment_status')}</TableHead>
                    <TableHead>{t('admin.user_profile.payment_description')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.paymentHistory.slice(0, 10).map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">${(payment.amount ?? 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {t(`admin.user_profile.payment_type.${payment.type}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {payment.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                          {payment.status === 'pending' && <Clock className="h-4 w-4 text-yellow-600" />}
                          {payment.status === 'failed' && <XCircle className="h-4 w-4 text-red-600" />}
                          <Badge variant={
                            payment.status === 'completed' ? 'default' :
                            payment.status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {t(`admin.user_profile.payment_status.${payment.status}`)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{payment.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {user.paymentHistory.length > 10 && (
              <div className="text-sm text-gray-500 mt-4 text-center">
                Showing 10 of {user.paymentHistory.length} payments
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Feature Usage Card */}
      {user.featureUsage && user.featureUsage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.user_profile.feature_usage')}</CardTitle>
            <CardDescription>{t('admin.user_profile.feature_usage_description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {user.featureUsage.map((feature, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{feature.feature.replace(/_/g, ' ')}</div>
                    <div className="text-sm text-gray-500">
                      {feature.adoptionDate ? (
                        <>
                          {t('admin.user_profile.feature_usage.adopted')} • 
                          Last: {feature.lastUsed ? new Date(feature.lastUsed).toLocaleDateString() : t('admin.common.na')}
                        </>
                      ) : (
                        t('admin.user_profile.feature_usage.not_adopted')
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{feature.usageCount}</div>
                    <div className="text-xs text-gray-500">{t('admin.user_profile.feature_usage.usage_count')}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* A/B Tests Card */}
      {user.abTests && user.abTests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.user_profile.ab_tests')}</CardTitle>
            <CardDescription>{t('admin.user_profile.ab_tests_description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {user.abTests.map((test, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{test.testName.replace(/_/g, ' ')}</div>
                    <div className="text-sm text-gray-500">
                      {t('admin.user_profile.ab_tests.enrolled')}: {new Date(test.enrolledAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant="outline">{test.variant}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.user_profile.quick_actions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleEditPlan}
            >
              <Edit className="h-4 w-4 mr-2" />
              {t('admin.user_profile.edit_plan')}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSendEmail}
            >
              <Mail className="h-4 w-4 mr-2" />
              {t('admin.user_profile.send_email')}
            </Button>
            {user.telegram && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSendTelegram}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {t('admin.user_profile.send_telegram')}
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="text-red-600"
              onClick={handleBlock}
              disabled={blockMutation.isPending || unblockMutation.isPending}
            >
              <Ban className="h-4 w-4 mr-2" />
              {user.status === 'blocked' ? t('admin.user_profile.unblock') : t('admin.user_profile.block_user')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Block User Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.user_profile.confirm_block')}</DialogTitle>
            <DialogDescription>
              {t('admin.user_profile.confirm_block_description', { name: user.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
              {t('admin.common.cancel')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => blockMutation.mutate()}
              disabled={blockMutation.isPending}
            >
              {blockMutation.isPending ? t('admin.common.loading') : t('admin.user_profile.block_user')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grant Credits Dialog */}
      <Dialog open={showCreditsDialog} onOpenChange={setShowCreditsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.user_profile.grant_credits')}</DialogTitle>
            <DialogDescription>
              {t('admin.user_profile.grant_credits_description', { name: user.name })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="credits-amount">{t('admin.user_profile.credits_amount')}</Label>
              <Input
                id="credits-amount"
                type="number"
                min="1"
                max="10000"
                value={creditsAmount}
                onChange={(e) => setCreditsAmount(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreditsDialog(false)}>
              {t('admin.common.cancel')}
            </Button>
            <Button 
              onClick={() => grantCreditsMutation.mutate(creditsAmount)}
              disabled={grantCreditsMutation.isPending || creditsAmount <= 0}
            >
              {grantCreditsMutation.isPending ? t('admin.common.loading') : t('admin.user_profile.grant')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('admin.user_profile.edit_user')}</DialogTitle>
            <DialogDescription>
              {t('admin.user_profile.edit_user_description', { name: user.name })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t('admin.user_profile.name')}</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder={t('admin.user_profile.name_placeholder')}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="edit-email">{t('admin.user_profile.email')}</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder={t('admin.user_profile.email_placeholder')}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="edit-password">{t('admin.user_profile.new_password')}</Label>
              <Input
                id="edit-password"
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                placeholder={t('admin.user_profile.password_placeholder')}
              />
              <p className="text-xs text-muted-foreground">
                {t('admin.user_profile.password_hint')}
              </p>
            </div>

            {/* Block User */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-blocked"
                checked={editForm.isBlocked}
                onChange={(e) => setEditForm({ ...editForm, isBlocked: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="edit-blocked" className="cursor-pointer">
                {t('admin.user_profile.block_user')}
              </Label>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-3">{t('admin.user_profile.quick_actions')}</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCreditsAmount(100);
                    setShowEditDialog(false);
                    setShowCreditsDialog(true);
                  }}
                >
                  <Gift className="h-4 w-4 mr-2" />
                  {t('admin.user_profile.grant_credits')}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {t('admin.common.cancel')}
            </Button>
            <Button 
              onClick={handleSaveEdit}
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? t('admin.common.loading') : t('admin.user_profile.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

