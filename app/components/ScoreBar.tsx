import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../lib/theme';

/** Labeled horizontal score bar (0–10 scale). */
export function ScoreBar({ label, score }: { label: string; score: number }) {
  const clamped = Math.max(0, Math.min(10, score));
  const pct = (clamped / 10) * 100;
  const color = pct >= 70 ? colors.success : pct >= 40 ? colors.gold : colors.accent;
  return (
    <View style={styles.row}>
      <View style={styles.labels}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{clamped.toFixed(1)}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: spacing.sm },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { color: colors.text, fontSize: 14, fontWeight: '600' },
  value: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  track: { height: 8, backgroundColor: colors.border, borderRadius: radius.sm, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.sm },
});
