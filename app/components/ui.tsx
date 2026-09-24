import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../lib/theme';

export function PrimaryButton({
  title,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  style,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'ghost';
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' ? styles.primary : styles.ghost,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : colors.accent} />
      ) : (
        <Text style={[styles.text, variant === 'ghost' && styles.ghostText]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function SectionTitle({ children, style }: { children: ReactNode; style?: TextStyle }) {
  return <Text style={[styles.sectionTitle, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.accent },
  ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  text: { color: '#fff', fontSize: 16, fontWeight: '700' },
  ghostText: { color: colors.accent },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: colors.surface,
  },
  chipSelected: { borderColor: colors.accent, backgroundColor: '#2A1214' },
  chipText: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  chipTextSelected: { color: colors.text },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
});
