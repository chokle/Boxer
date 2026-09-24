import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../lib/theme';

/** Circular score indicator (no SVG dependency — pure views). */
export function ScoreRing({ score, label, size = 84 }: { score: number; label?: string; size?: number }) {
  const clamped = Math.max(0, Math.min(10, score));
  const pct = clamped / 10;
  const color = pct >= 0.7 ? colors.success : pct >= 0.4 ? colors.gold : colors.accent;
  return (
    <View style={[styles.wrap, { width: size }]}>
      <View
        style={[
          styles.ring,
          { width: size, height: size, borderRadius: size / 2, borderColor: color },
        ]}
      >
        <Text style={[styles.score, { fontSize: size * 0.3 }]}>{clamped.toFixed(1)}</Text>
      </View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  ring: {
    borderWidth: 5,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: { color: colors.text, fontWeight: '800' },
  label: { color: colors.muted, fontSize: 12, marginTop: spacing.xs, textAlign: 'center' },
});
