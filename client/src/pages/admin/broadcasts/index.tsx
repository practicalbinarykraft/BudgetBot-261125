/**
 * Admin Broadcasts Page
 *
 * Send messages to users via Telegram bot
 * Junior-Friendly: Clear structure, simple forms
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Send, Clock, CheckCircle2, XCircle, FileText } from "lucide-react";
import { useTranslation } from "@/i18n/context";
import { adminApi } from "@/lib/admin/api/admin-api";
import { adminQueryKeys } from "@/lib/admin/api/admin-query-keys";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Schema will be created inside component to access t() function
const createBroadcastFormSchema = (t: (key: string) => string) => z.object({
  title: z.string().min(1, t('admin.broadcasts.validation.title_required')),
  message: z.string().min(1, t('admin.broadcasts.validation.message_required')),
  targetSegment: z.enum(['all', 'active', 'new_users', 'at_risk', 'churned', 'power_users']).optional(),
  targetUserIds: z.string().optional(), // Comma-separated IDs
  scheduledAt: z.string().optional(), // ISO date string
});

type BroadcastFormValues = z.infer<ReturnType<typeof createBroadcastFormSchema>>;

interface Broadcast {
  id: number;
  title: string;
  message: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'completed';
  targetSegment?: string;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  totalRecipients?: number;
  sentCount?: number;
  failedCount?: number;
}

export default function AdminBroadcastsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'compose' | 'templates' | 'history'>('compose');

  const broadcastFormSchema = createBroadcastFormSchema(t);

  const form = useForm<BroadcastFormValues>({
    resolver: zodResolver(broadcastFormSchema),
    defaultValues: {
      title: '',
      message: '',
      targetSegment: 'all',
    },
  });

  // Fetch broadcasts
  const { data: broadcastsData, isLoading: isLoadingBroadcasts } = useQuery({
    queryKey: adminQueryKeys.broadcasts(),
    queryFn: () => adminApi.getBroadcasts(),
  });

  const broadcasts = broadcastsData?.broadcasts || broadcastsData || [];

  // Fetch templates
  const { data: templatesData } = useQuery({
    queryKey: adminQueryKeys.broadcastTemplates,
    queryFn: () => adminApi.getBroadcastTemplates(),
  });

  const templates = templatesData || [];

  // Send broadcast mutation
  const sendBroadcastMutation = useMutation({
    mutationFn: (data: BroadcastFormValues) => {
      const targetUserIds = data.targetUserIds
        ? data.targetUserIds.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id))
        : undefined;
      const scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : undefined;

      return adminApi.sendBroadcast({
        title: data.title,
        message: data.message,
        targetSegment: data.targetSegment,
        targetUserIds,
        scheduledAt,
      });
    },
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.broadcasts() });
      toast({
        title: t('admin.broadcasts.broadcast_sent'),
        description: t('admin.broadcasts.broadcast_sent_description'),
      });
      setActiveTab('history');
    },
    onError: (error: any) => {
      toast({
        title: t('admin.broadcasts.error'),
        description: error?.message || t('admin.broadcasts.send_failed'),
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: BroadcastFormValues) => {
    sendBroadcastMutation.mutate(values);
  };

  const handleUseTemplate = (template: any) => {
    form.setValue('message', template.message);
    form.setValue('title', template.name);
  };

  const getStatusBadge = (status: Broadcast['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" /> {t('admin.broadcasts.status.completed')}</Badge>;
      case 'scheduled':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> {t('admin.broadcasts.status.scheduled')}</Badge>;
      case 'sending':
        return <Badge variant="default"><Send className="h-3 w-3 mr-1" /> {t('admin.broadcasts.status.sending')}</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> {t('admin.broadcasts.status.failed')}</Badge>;
      case 'draft':
      default:
        return <Badge variant="outline"><FileText className="h-3 w-3 mr-1" /> {t('admin.broadcasts.status.draft')}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('admin.broadcasts.title')}</h1>
            <p className="text-gray-600 mt-1">
              {t('admin.broadcasts.description')}
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="compose">{t('admin.broadcasts.tabs.compose')}</TabsTrigger>
            <TabsTrigger value="templates">{t('admin.broadcasts.tabs.templates')}</TabsTrigger>
            <TabsTrigger value="history">{t('admin.broadcasts.tabs.history')}</TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.broadcasts.compose.title')}</CardTitle>
                <CardDescription>{t('admin.broadcasts.compose.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('admin.broadcasts.compose.title_field')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('admin.broadcasts.compose.title_placeholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('admin.broadcasts.compose.message_field')}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t('admin.broadcasts.compose.message_placeholder')}
                              className="min-h-[200px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {t('admin.broadcasts.compose.message_description')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="targetSegment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('admin.broadcasts.compose.target_segment')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('admin.broadcasts.compose.select_segment')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="all">{t('admin.broadcasts.segments.all')}</SelectItem>
                              <SelectItem value="active">{t('admin.broadcasts.segments.active')}</SelectItem>
                              <SelectItem value="new_users">{t('admin.broadcasts.segments.new_users')}</SelectItem>
                              <SelectItem value="at_risk">{t('admin.broadcasts.segments.at_risk')}</SelectItem>
                              <SelectItem value="churned">{t('admin.broadcasts.segments.churned')}</SelectItem>
                              <SelectItem value="power_users">{t('admin.broadcasts.segments.power_users')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            {t('admin.broadcasts.compose.target_segment_description')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="targetUserIds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('admin.broadcasts.compose.target_users')} (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('admin.broadcasts.compose.target_users_placeholder')}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {t('admin.broadcasts.compose.target_users_description')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-4">
                      <Button
                        type="submit"
                        disabled={sendBroadcastMutation.isPending}
                        className="flex-1"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {sendBroadcastMutation.isPending
                          ? t('admin.broadcasts.compose.sending')
                          : t('admin.broadcasts.compose.send')}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <div className="space-y-4">
              {templates.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    {t('admin.broadcasts.templates.no_templates')}
                  </CardContent>
                </Card>
              ) : (
                templates.map((template: any) => (
                  <Card key={template.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          {template.description && (
                            <CardDescription>{template.description}</CardDescription>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            handleUseTemplate(template);
                            setActiveTab('compose');
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {t('admin.broadcasts.templates.use')}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="text-sm whitespace-pre-wrap font-sans">{template.message || template.content}</pre>
                      </div>
                      {template.variables && template.variables.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="text-xs text-gray-500">{t('admin.broadcasts.templates.variables')}:</span>
                          {template.variables.map((varName: string) => (
                            <Badge key={varName} variant="outline" className="text-xs">
                              {`{{${varName}}}`}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.broadcasts.history.title')}</CardTitle>
                <CardDescription>{t('admin.broadcasts.history.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.broadcasts.history.table.name')}</TableHead>
                      <TableHead>{t('admin.broadcasts.history.table.status')}</TableHead>
                      <TableHead>{t('admin.broadcasts.history.table.recipients')}</TableHead>
                      <TableHead>{t('admin.broadcasts.history.table.sent')}</TableHead>
                      <TableHead>{t('admin.broadcasts.history.table.failed')}</TableHead>
                      <TableHead>{t('admin.broadcasts.history.table.created')}</TableHead>
                      <TableHead>{t('admin.broadcasts.history.table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingBroadcasts ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          {t('admin.common.loading')}
                        </TableCell>
                      </TableRow>
                    ) : broadcasts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          {t('admin.broadcasts.history.no_broadcasts')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      broadcasts.map((broadcast: any) => (
                        <TableRow key={broadcast.id}>
                          <TableCell className="font-medium">{broadcast.title || broadcast.name}</TableCell>
                          <TableCell>{getStatusBadge(broadcast.status)}</TableCell>
                          <TableCell>{broadcast.totalRecipients || broadcast.recipients?.total || 0}</TableCell>
                          <TableCell className="text-green-600">{broadcast.sentCount || broadcast.recipients?.sent || 0}</TableCell>
                          <TableCell className="text-red-600">{broadcast.failedCount || broadcast.recipients?.failed || 0}</TableCell>
                          <TableCell>{new Date(broadcast.createdAt || broadcast.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              {t('admin.broadcasts.history.view')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

