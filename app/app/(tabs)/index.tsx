import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/ui';
import { copy } from '../../lib/copy';
import { listAnalyses, listSessions } from '../../lib/analyses';
import { profileStore } from '../../lib/store';
import { colors, radius, spacing } from '../../lib/theme';
import type { Analysis, TrainingSession } from '../../lib/types';

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

/** Consecutive days (ending today or yesterday) with at least one analysis. */
function streakDays(dates: string[]): number {
  const days = new Set(dates.map(dayKey));
  let streak = 0;
  const d = new Date();
  if (!days.has(dayKey(d.toISOString()))) d.setDate(d.getDate() - 1);
  while (days.has(dayKey(d.toISOString()))) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export default function DashboardScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [streak, setStreak] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const [profile, s, a] = await Promise.all([
          profileStore.load(),
          listSessions(),
          listAnalyses(20),
        ]);
        if (!alive) return;
        setName(profile.name ?? '');
        setSessions(s.slice(0, 5));
        setAnalyses(a.slice(0, 3));
        setStreak(streakDays(a.map((x) => x.created_at)));
      })();
      return () => {
        alive = false;
      };
    }, []),
  );

  return (
    <Screen>
      <Text style={styles.hello}>
        {copy.welcomeBack}
        {name ? `, ${name}` : ''}
      </Text>

      <Pressable onPress={() => router.push('/(tabs)/analyze')}>
        <LinearGradient colors={[colors.accentDark, colors.accent]} style={styles.cta}>
          <View>
            <Text style={styles.ctaTitle}>{copy.stepIntoTheRing}</Text>
            <Text style={styles.ctaSub}>{copy.analyzeFirstMatch}</Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={40} color="#fff" />
        </LinearGradient>
      </Pressable>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{streak}</Text>
          <Text style={styles.statLabel}>Day streak</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{analyses.length}</Text>
          <Text style={styles.statLabel}>Analyses</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{sessions.length}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
      </View>

      <SectionTitle>{copy.recentSessions}</SectionTitle>
      {sessions.length === 0 ? (
        <EmptyState
          icon="journal-outline"
          title="No sessions yet"
          hint="Log your first training session to start your journal."
        />
      ) : (
        sessions.map((s) => (
          <Pressable key={s.id} style={styles.card} onPress={() => router.push(`/session/${s.id}`)}>
            <Text style={styles.cardTitle}>{s.title}</Text>
            <Text style={styles.cardSub}>{new Date(s.created_at).toLocaleDateString()}</Text>
          </Pressable>
        ))
      )}
      <Pressable style={styles.logRow} onPress={() => router.push('/session/new')}>
        <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
        <Text style={styles.logText}>Log a training session</Text>
      </Pressable>

      {analyses.length > 0 ? (
        <>
          <SectionTitle>Recent Analyses</SectionTitle>
          {analyses.map((a) => (
            <Pressable
              key={a.id}
              style={styles.card}
              onPress={() => router.push(`/analysis/${a.id}`)}
            >
              <Text style={styles.cardTitle}>
                {a.analysis_type === 'shadowboxing'
                  ? 'Shadowboxing'
                  : a.analysis_type === 'bag_work'
                    ? 'Bag Work'
                    : 'Sparring'}
              </Text>
              <Text style={styles.cardSub}>
                {a.status === 'done' ? copy.analysisComplete : a.status} ·{' '}
                {new Date(a.created_at).toLocaleDateString()}
              </Text>
            </Pressable>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hello: { color: colors.text, fontSize: 26, fontWeight: '800', marginBottom: spacing.md },
  cta: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  ctaTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  ctaSub: { color: '#fff', fontSize: 14, opacity: 0.85, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: { color: colors.text, fontSize: 24, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 12, marginTop: 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  cardSub: { color: colors.muted, fontSize: 13, marginTop: 2, textTransform: 'capitalize' },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.xs },
  logText: { color: colors.accent, fontSize: 15, fontWeight: '700' },
});
