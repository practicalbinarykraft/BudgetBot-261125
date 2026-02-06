/**
 * Voice Recorder component with real-time speech-to-text.
 *
 * Shows a modal with live transcript as the user speaks — like Google Translate.
 * Uses native on-device speech recognition (Apple Speech / Google SpeechRecognizer).
 * No audio is sent to any server.
 *
 * Requires a development build (expo-speech-recognition uses native modules).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { parseTransactionFromText, type ParsedVoiceTransaction } from '@/lib/parseTransaction';
import { COLORS, FONTS, SPACING } from '@/constants/config';

interface VoiceRecorderProps {
  /** Called when the user confirms the voice input */
  onResult: (parsed: ParsedVoiceTransaction & { rawText: string }) => void;
  /** BCP-47 locale for recognition (default: en-US) */
  locale?: string;
}

export function VoiceRecorder({ onResult, locale = 'en-US' }: VoiceRecorderProps) {
  const {
    isListening,
    liveText,
    error,
    isAvailable,
    startListening,
    stopListening,
    cancelListening,
  } = useVoiceRecorder(locale);

  const [showModal, setShowModal] = useState(false);

  const handleStartPress = () => {
    setShowModal(true);
    startListening();
  };

  const handleConfirm = () => {
    const finalText = stopListening();
    const textToUse = finalText || liveText;

    if (textToUse) {
      const parsed = parseTransactionFromText(textToUse);
      onResult({ ...parsed, rawText: textToUse });
    }

    setShowModal(false);
  };

  const handleCancel = () => {
    cancelListening();
    setShowModal(false);
  };

  // If speech recognition isn't available on this device, show disabled state
  if (!isAvailable) {
    return (
      <TouchableOpacity style={[styles.voiceBtn, styles.voiceBtnDisabled]} disabled>
        <Ionicons name="mic-off" size={22} color={COLORS.textMuted} />
        <Text style={[styles.voiceBtnText, { color: COLORS.textMuted }]}>
          Speech recognition unavailable
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <>
      {/* Trigger Button */}
      <TouchableOpacity
        style={styles.voiceBtn}
        onPress={handleStartPress}
        activeOpacity={0.8}
      >
        <Ionicons name="mic" size={22} color={COLORS.primary} />
        <Text style={styles.voiceBtnText}>Voice Input</Text>
      </TouchableOpacity>

      {/* Live Recognition Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={handleCancel}>
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
            {/* Status Indicator */}
            <View style={styles.statusRow}>
              {isListening ? (
                <>
                  <View style={styles.pulseDot} />
                  <Text style={styles.statusText}>Listening...</Text>
                </>
              ) : (
                <Text style={styles.statusText}>Processing...</Text>
              )}
            </View>

            {/* Live Transcript */}
            <View style={styles.transcriptContainer}>
              {liveText ? (
                <Text style={styles.transcriptText}>
                  {liveText}
                  {isListening && <Text style={styles.cursor}>|</Text>}
                </Text>
              ) : (
                <Text style={styles.placeholderText}>
                  {isListening
                    ? 'Start speaking...\n\n"Spent 15 dollars on lunch"\n"Получил 3000 зарплата"'
                    : 'Waiting for speech engine...'}
                </Text>
              )}
            </View>

            {/* Parsed Preview (shown once we have text) */}
            {liveText.length > 0 && (
              <ParsedPreview text={liveText} />
            )}

            {/* Error */}
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                <Ionicons name="close" size={22} color={COLORS.expense} />
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  !liveText && styles.confirmBtnDisabled,
                ]}
                onPress={handleConfirm}
                disabled={!liveText}
              >
                <Ionicons name="checkmark" size={26} color="#fff" />
              </TouchableOpacity>

              {/* Re-start button if stopped */}
              {!isListening && (
                <TouchableOpacity style={styles.retryBtn} onPress={startListening}>
                  <Ionicons name="mic" size={22} color={COLORS.primary} />
                  <Text style={styles.retryText}>Again</Text>
                </TouchableOpacity>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

/** Preview of parsed transaction data shown below the transcript */
function ParsedPreview({ text }: { text: string }) {
  const parsed = parseTransactionFromText(text);

  if (!parsed.amount && !parsed.description) {
    return null;
  }

  const isIncome = parsed.type === 'income';

  return (
    <View style={styles.previewCard}>
      <View style={styles.previewRow}>
        <Text style={styles.previewLabel}>Type</Text>
        <View
          style={[
            styles.previewBadge,
            { backgroundColor: isIncome ? COLORS.income + '20' : COLORS.expense + '20' },
          ]}
        >
          <Text
            style={[
              styles.previewBadgeText,
              { color: isIncome ? COLORS.income : COLORS.expense },
            ]}
          >
            {isIncome ? 'Income' : 'Expense'}
          </Text>
        </View>
      </View>

      {parsed.amount && (
        <View style={styles.previewRow}>
          <Text style={styles.previewLabel}>Amount</Text>
          <Text style={styles.previewValue}>${parsed.amount}</Text>
        </View>
      )}

      {parsed.description && (
        <View style={styles.previewRow}>
          <Text style={styles.previewLabel}>Description</Text>
          <Text style={styles.previewValue} numberOfLines={1}>
            {parsed.description}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Trigger Button
  voiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
    marginBottom: SPACING.xl,
  },
  voiceBtnDisabled: {
    borderColor: COLORS.border,
    opacity: 0.5,
  },
  voiceBtnText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '500',
    color: COLORS.primary,
  },

  // Modal overlay
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },

  // Bottom sheet card
  card: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING['4xl'],
    minHeight: 380,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },

  // Status row
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.expense,
  },
  statusText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Transcript area
  transcriptContainer: {
    minHeight: 100,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  transcriptText: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '500',
    color: COLORS.textPrimary,
    lineHeight: 30,
  },
  cursor: {
    color: COLORS.primary,
    fontWeight: '300',
  },
  placeholderText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textMuted,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },

  // Parsed preview
  previewCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewValue: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    maxWidth: '60%',
    textAlign: 'right',
  },
  previewBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  previewBadgeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
  },

  // Error
  errorText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.expense,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING['2xl'],
  },
  cancelBtn: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  cancelText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.expense,
    fontWeight: '500',
  },
  confirmBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.income,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.income,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmBtnDisabled: {
    backgroundColor: COLORS.surfaceLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  retryBtn: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  retryText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.primary,
    fontWeight: '500',
  },
});
