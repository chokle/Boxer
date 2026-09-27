import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../lib/theme';
import type { FatalErrorInfo } from '../lib/crashReporter';

/**
 * Shown instead of a silent crash when a fatal JS error is caught at startup.
 * The user screenshots this and sends it to Dot — it names the failure.
 */
export function FatalErrorScreen({ error }: { error: FatalErrorInfo }) {
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>Something broke on startup</Text>
        <Text style={styles.hint}>
          Screenshot this screen and send it to Dot — it says exactly what failed.
        </Text>
        <Text style={styles.label}>Error</Text>
        <Text selectable style={styles.message}>
          {error.message}
        </Text>
        {error.stack ? (
          <>
            <Text style={styles.label}>Details</Text>
            <Text selectable style={styles.stack}>
              {error.stack}
            </Text>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  body: {
    padding: spacing.lg,
    paddingTop: spacing.xl * 2,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  hint: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.faint,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  message: {
    color: colors.danger,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  stack: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'monospace',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
});
