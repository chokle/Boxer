import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../lib/theme';

export function EmptyState({
  icon = 'alert-circle-outline',
  title,
  hint,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  hint?: string;
}) {
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={40} color={colors.faint} />
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  hint: { color: colors.muted, fontSize: 14, marginTop: spacing.xs, textAlign: 'center' },
});
