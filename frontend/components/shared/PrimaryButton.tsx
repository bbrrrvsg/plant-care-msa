import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, BorderRadius, FontSize } from '../../theme';

interface PrimaryButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
}

export function PrimaryButton({ children, onPress, disabled = false, fullWidth = false, loading = false }: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[styles.button, fullWidth && styles.fullWidth, (disabled || loading) && styles.disabled]}
    >
      {loading
        ? <ActivityIndicator color={Colors.white} size="small" />
        : <Text style={styles.text}>{children}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  text: {
    color: Colors.white,
    fontSize: FontSize.base,
    fontWeight: '600',
  },
});
