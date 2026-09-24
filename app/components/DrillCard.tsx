import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../lib/theme';
import type { Drill } from '../lib/types';

export function DrillCard({
  drill,
  completed,
  onToggle,
}: {
  drill: Drill;
  completed: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={[styles.card, completed && styles.cardDone]}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, completed && styles.titleDone]}>{drill.title}</Text>
          <Text style={styles.meta}>
            {[drill.category, drill.difficulty, drill.sets_reps].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <Pressable
          onPress={onToggle}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: completed }}
          style={[styles.check, completed && styles.checkDone]}
        >
          {completed ? <Ionicons name="checkmark" size={18} color="#fff" /> : null}
        </Pressable>
      </View>
      {drill.instructions ? <Text style={styles.instructions}>{drill.instructions}</Text> : null}
      {drill.coaching_points && drill.coaching_points.length > 0 ? (
        <View style={styles.points}>
          {drill.coaching_points.map((p, i) => (
            <Text key={i} style={styles.point}>
              • {p}
            </Text>
          ))}
        </View>
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
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardDone: { opacity: 0.65 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleWrap: { flex: 1, marginRight: spacing.sm },
  title: { color: colors.text, fontSize: 16, fontWeight: '700' },
  titleDone: { textDecorationLine: 'line-through' },
  meta: { color: colors.faint, fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  check: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: colors.faint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: colors.success, borderColor: colors.success },
  instructions: { color: colors.muted, fontSize: 14, marginTop: spacing.sm, lineHeight: 20 },
  points: { marginTop: spacing.xs },
  point: { color: colors.muted, fontSize: 13, marginTop: 2, lineHeight: 18 },
});
