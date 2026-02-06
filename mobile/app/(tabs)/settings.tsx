/**
 * Settings screen – user preferences, account info, logout.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';
import { useSettings, useWallets } from '@/hooks/useWallets';
import { COLORS, FONTS, SPACING } from '@/constants/config';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: settings } = useSettings();
  const { data: wallets } = useWallets();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name ?? 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email ?? 'No email'}</Text>
            <View style={styles.tierBadge}>
              <Text style={styles.tierText}>
                {(user?.tier ?? 'free').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <SettingsRow
              icon="wallet-outline"
              label="Wallets"
              value={`${wallets?.length ?? 0} wallets`}
            />
            <View style={styles.rowDivider} />
            <SettingsRow
              icon="globe-outline"
              label="Currency"
              value={settings?.currency ?? 'USD'}
            />
            <View style={styles.rowDivider} />
            <SettingsRow
              icon="language-outline"
              label="Language"
              value={settings?.language ?? 'en'}
            />
            <View style={styles.rowDivider} />
            <SettingsRow
              icon="time-outline"
              label="Timezone"
              value={settings?.timezone ?? 'UTC'}
            />
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.card}>
            <SettingsRow
              icon="shield-checkmark-outline"
              label="Two-Factor Auth"
              value={user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              valueColor={user?.twoFactorEnabled ? COLORS.income : COLORS.textMuted}
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <SettingsRow icon="information-circle-outline" label="Version" value="1.0.0" />
            <View style={styles.rowDivider} />
            <SettingsRow icon="code-outline" label="Build" value="Expo SDK 52" />
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.expense} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.settingsRow}>
      <View style={styles.settingsLeft}>
        <Ionicons
          name={icon as any}
          size={20}
          color={COLORS.textSecondary}
        />
        <Text style={styles.settingsLabel}>{label}</Text>
      </View>
      <Text style={[styles.settingsValue, valueColor ? { color: valueColor } : undefined]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING['4xl'],
  },
  header: {
    paddingVertical: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes['2xl'],
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  // Profile
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FONTS.sizes['2xl'],
    fontWeight: '700',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  profileEmail: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  tierBadge: {
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: COLORS.primary + '20',
  },
  tierText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Section
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    paddingLeft: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Settings Row
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  settingsLabel: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
  },
  settingsValue: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  rowDivider: {
    height: 1,
    backgroundColor: COLORS.border + '40',
    marginHorizontal: SPACING.sm,
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.expense + '40',
    marginTop: SPACING.md,
  },
  logoutText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.expense,
  },
});
