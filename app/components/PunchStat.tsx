import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../lib/theme';
import type { PunchEvent } from '../lib/types';

function fmtTime(t?: number): string {
  if (typeof t !== 'number' || !isFinite(t)) return '—';
  return `${t.toFixed(1)}s`;
}

export function PunchStat({ punch }: { punch: PunchEvent }) {
  const type = typeof punch.type === 'string' && punch.type ? punch.type : 'Punch';
  const score = typeof punch.score === 'number' && isFinite(punch.score) ? punch.score : null;
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.type}>{type}</Text>
        {score !== null ? <Text style={styles.score}>{score.toFixed(1)}</Text> : null}
      </View>
      <Text style={styles.time}>
        {fmtTime(punch.t0)} → {fmtTime(punch.t1)}
      </Text>
      {typeof punch.notes === 'string' && punch.notes ? (
        <Text style={styles.notes}>{punch.notes}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  type: { color: colors.text, fontSize: 15, fontWeight: '700', textTransform: 'capitalize' },
  score: { color: colors.gold, fontSize: 15, fontWeight: '800' },
  time: { color: colors.faint, fontSize: 12, marginTop: 2 },
  notes: { color: colors.muted, fontSize: 13, marginTop: spacing.xs },
});
