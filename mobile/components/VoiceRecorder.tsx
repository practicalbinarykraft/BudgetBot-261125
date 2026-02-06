/**
 * Voice Recorder component – floating microphone button with recording UI.
 * Native microphone access solves the Safari Web Audio API limitation.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { COLORS, FONTS, SPACING } from '@/constants/config';

interface VoiceRecorderProps {
  onResult: (data: { text: string; parsed?: {
    amount?: string;
    description?: string;
    type?: 'income' | 'expense';
    category?: string;
  }}) => void;
}

export function VoiceRecorder({ onResult }: VoiceRecorderProps) {
  const {
    isRecording,
    isProcessing,
    duration,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceRecorder();

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStop = async () => {
    const result = await stopRecording();
    if (result) {
      onResult(result);
    }
  };

  return (
    <>
      {/* Mic Button */}
      <TouchableOpacity
        style={styles.micButton}
        onPress={isRecording ? handleStop : startRecording}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isRecording ? 'stop' : 'mic'}
          size={24}
          color="#fff"
        />
      </TouchableOpacity>

      {/* Recording Modal */}
      <Modal
        visible={isRecording || isProcessing}
        transparent
        animationType="fade"
      >
        <View style={styles.overlay}>
          <View style={styles.recordingCard}>
            {isProcessing ? (
              <>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.processingText}>
                  Processing your voice...
                </Text>
              </>
            ) : (
              <>
                {/* Animated recording indicator */}
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingLabel}>Recording</Text>
                </View>

                <Text style={styles.durationText}>
                  {formatDuration(duration)}
                </Text>

                <Text style={styles.hint}>
                  Say something like "Spent $15 on lunch today"
                </Text>

                <View style={styles.recordingActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={cancelRecording}
                  >
                    <Ionicons name="close" size={24} color={COLORS.expense} />
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.stopBtn}
                    onPress={handleStop}
                  >
                    <Ionicons name="checkmark" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  micButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },

  recordingCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: SPACING['2xl'],
    alignItems: 'center',
    gap: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.expense,
  },
  recordingLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.expense,
  },

  durationText: {
    fontSize: FONTS.sizes['4xl'],
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
  },

  hint: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },

  recordingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['2xl'],
    marginTop: SPACING.md,
  },

  cancelBtn: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  cancelText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.expense,
  },

  stopBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.income,
    justifyContent: 'center',
    alignItems: 'center',
  },

  processingText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },

  errorText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.expense,
    textAlign: 'center',
  },
});
