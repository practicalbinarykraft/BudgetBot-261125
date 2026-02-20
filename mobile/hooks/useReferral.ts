import { useQuery } from "@tanstack/react-query";
import { Share, Platform } from "react-native";
import { api } from "../lib/api-client";
import { useTranslation } from "../i18n";

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

export function useReferral() {
  const { language } = useTranslation();

  const { data: codeData, isLoading: isLoadingCode } = useQuery<ReferralCode>({
    queryKey: ["referral-code"],
    queryFn: () => api.get<ReferralCode>("/api/referral/mobile/my-code"),
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery<ReferralStats>({
    queryKey: ["referral-stats"],
    queryFn: () => api.get<ReferralStats>("/api/referral/mobile/stats"),
  });

  const { data: invited, isLoading: isLoadingInvited } = useQuery<InvitedUser[]>({
    queryKey: ["referral-invited"],
    queryFn: () => api.get<InvitedUser[]>("/api/referral/mobile/invited"),
  });

  const share = async () => {
    if (!codeData?.link) return;
    const message = language === "ru"
      ? `Присоединяйся к Budget Buddy! Мы оба получим бонусные кредиты: ${codeData.link}`
      : `Join Budget Buddy! We both get bonus credits: ${codeData.link}`;

    await Share.share({
      message,
      url: Platform.OS === "ios" ? codeData.link : undefined,
    });
  };

  return {
    code: codeData?.code ?? null,
    link: codeData?.link ?? null,
    stats: stats ?? { invitedCount: 0, creditsEarned: 0 },
    invited: invited ?? [],
    isLoading: isLoadingCode || isLoadingStats || isLoadingInvited,
    share,
  };
}
