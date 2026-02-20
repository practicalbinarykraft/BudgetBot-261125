import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Copy, Check, Share2, Gift, Users, Coins } from "lucide-react";
import { useTranslation } from "@/i18n";
import { useToast } from "@/hooks/use-toast";

interface ReferralCode {
  code: string;
  link: string;
}

interface ReferralStats {
  invitedCount: number;
  creditsEarned: number;
}

interface InvitedUser {
  id: number;
  name: string;
  createdAt: string;
  signupCredits: number;
  onboardingCompleted: boolean;
  onboardingCredits: number;
}

export default function ReferralPage() {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: codeData } = useQuery<ReferralCode>({
    queryKey: ["/api/referral/my-code"],
  });

  const { data: stats } = useQuery<ReferralStats>({
    queryKey: ["/api/referral/stats"],
  });

  const { data: invited } = useQuery<InvitedUser[]>({
    queryKey: ["/api/referral/invited"],
  });

  const handleCopy = async () => {
    if (!codeData?.link) return;
    await navigator.clipboard.writeText(codeData.link);
    setCopied(true);
    toast({ description: t("referral.link_copied") });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!codeData?.link) return;
    if (navigator.share) {
      await navigator.share({
        title: "Budget Buddy",
        text: language === "ru"
          ? "Присоединяйся к Budget Buddy! Мы оба получим бонусные кредиты."
          : "Join Budget Buddy! We both get bonus credits.",
        url: codeData.link,
      });
    } else {
      handleCopy();
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserPlus className="w-6 h-6" />
          {t("referral.title")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("referral.subtitle")}</p>
      </div>

      {/* Referral Link Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("referral.your_link")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted px-3 py-2 rounded text-sm truncate">
              {codeData?.link ?? "..."}
            </code>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="ml-1 hidden sm:inline">
                {copied ? t("referral.link_copied") : t("referral.copy_link")}
              </span>
            </Button>
            <Button size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
              <span className="ml-1 hidden sm:inline">{t("referral.share")}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{stats?.invitedCount ?? 0}</p>
            <p className="text-sm text-muted-foreground">{t("referral.stats_invited")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Coins className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{stats?.creditsEarned ?? 0}</p>
            <p className="text-sm text-muted-foreground">{t("referral.stats_credits")}</p>
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("referral.how_it_works")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { icon: Share2, title: t("referral.step1_title"), desc: t("referral.step1_desc") },
            { icon: UserPlus, title: t("referral.step2_title"), desc: t("referral.step2_desc") },
            { icon: Gift, title: t("referral.step3_title"), desc: t("referral.step3_desc") },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <step.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Invited users list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("referral.invited_users")}</CardTitle>
        </CardHeader>
        <CardContent>
          {(!invited || invited.length === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("referral.no_invites_yet")}
            </p>
          ) : (
            <div className="space-y-3">
              {invited.map((user) => (
                <div key={user.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(user.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-green-600">+{user.signupCredits}</span>
                    <Badge variant={user.onboardingCompleted ? "default" : "secondary"}>
                      {user.onboardingCompleted ? t("referral.completed") : t("referral.pending")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
