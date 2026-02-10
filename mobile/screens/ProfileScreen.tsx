import React from "react";
import { View, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { Button } from "../components/Button";
import { useTheme } from "../hooks/useTheme";
import { useProfileData } from "../hooks/useProfileData";
import TelegramIntegrationCard from "../components/settings/TelegramIntegrationCard";
import TwoFactorCard from "../components/settings/TwoFactorCard";
import GeneralSettingsSection from "../components/profile/GeneralSettingsSection";
import NavigationGroups from "../components/profile/NavigationGroups";
import AccountInfoCard from "../components/profile/AccountInfoCard";
import TimezoneModal from "../components/profile/TimezoneModal";
import { styles } from "../components/profile/profileStyles";
import type { User } from "../types";

interface ProfileScreenProps {
  user: User | null;
  onLogout: () => void;
}

export default function ProfileScreen({ user, onLogout }: ProfileScreenProps) {
  const { theme } = useTheme();
  const profileData = useProfileData();

  const isMyselfTier = user?.tier === "myself";

  return (
    <>
      <ScrollView
        style={[styles.flex, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <ThemedText type="h3" style={styles.headerTitle}>
              {"Settings"}
            </ThemedText>
            <ThemedText type="small" color={theme.textSecondary}>
              {"Manage your preferences"}
            </ThemedText>
          </View>
        </View>

        {/* General Settings Card */}
        <GeneralSettingsSection data={profileData} isMyselfTier={isMyselfTier} />

        {/* Telegram Integration Card */}
        <TelegramIntegrationCard />

        {/* Two-Factor Authentication Card */}
        <TwoFactorCard />

        {/* Navigation Groups */}
        <NavigationGroups />

        {/* Account Information Card */}
        <AccountInfoCard user={user} />

        {/* Log Out */}
        <Button
          title="Log Out"
          onPress={onLogout}
          variant="destructive"
          icon={<Feather name="log-out" size={16} color="#faf8f8" />}
          style={styles.logoutBtn}
        />
      </ScrollView>

      {/* Timezone Selection Modal */}
      <TimezoneModal
        visible={profileData.showTimezoneModal}
        timezone={profileData.timezone}
        onSelect={profileData.setTimezone}
        onClose={() => profileData.setShowTimezoneModal(false)}
      />
    </>
  );
}
