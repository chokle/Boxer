import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { EmptyState } from '../../components/EmptyState';
import { PrimaryButton, SectionTitle } from '../../components/ui';
import { ScoreBar } from '../../components/ScoreBar';
import { ScoreRing } from '../../components/ScoreRing';
import { PunchStat } from '../../components/PunchStat';
import { DrillCard } from '../../components/DrillCard';
import { copy } from '../../lib/copy';
import { STATUS_LABELS, fetchAnalysis, pollAnalysis } from '../../lib/analyses';
import { getDrill, loadCompletions, setDrillCompleted } from '../../lib/drills';
import { colors, radius, spacing } from '../../lib/theme';
import type { Analysis } from '../../lib/types';

const ACTIVE_STATUSES = ['queued', 'extracting', 'analyzing'];

function formatMetricValue(v: unknown): string {
  if (typeof v === 'number') return isFinite(v) ? v.toFixed(1) : '—';
  if (typeof v === 'string') return v;
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return '—';
}

function prettifyKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AnalysisDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [completions, setCompletions] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    const stop = pollAnalysis(id, (a) => {
      setAnalysis(a);
      if (a?.status === 'done') loadCompletions().then(setCompletions);
    });
    return stop;
  }, [id]);

  if (!analysis) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={styles.muted}>Loading analysis…</Text>
        </View>
      </Screen>
    );
  }

  const active = ACTIVE_STATUSES.includes(analysis.status);

  return (
    <Screen>
      <Text style={styles.title}>{copy.analyzingYourMatch}</Text>

      {/* Honest status — reflects the real job state from the backend, nothing staged. */}
      <View style={[styles.statusCard, analysis.status === 'failed' && styles.statusFailed]}>
        {active ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <Ionicons
            name={analysis.status === 'done' ? 'checkmark-circle' : 'alert-circle'}
            size={28}
            color={analysis.status === 'done' ? colors.success : colors.danger}
          />
        )}
        <View style={styles.statusText}>
          <Text style={styles.statusLabel}>{STATUS_LABELS[analysis.status]}</Text>
          {active ? (
            <Text style={styles.statusHint}>
              Analysis runs on our servers and usually takes 1–2 minutes. You can leave this
              screen — your result will be waiting on the dashboard.
            </Text>
          ) : null}
          {analysis.status === 'failed' && analysis.error ? (
            <Text style={styles.error}>{analysis.error}</Text>
          ) : null}
        </View>
      </View>

      {analysis.status === 'failed' ? (
        <PrimaryButton
          title={copy.tryAgain}
          onPress={() => router.replace('/(tabs)/analyze')}
          style={styles.cta}
        />
      ) : null}

      {analysis.status === 'done' ? (
        <>
          <Text style={styles.completeTitle}>{copy.analysisComplete}</Text>
          <Text style={styles.completeSub}>{copy.analysisReady}</Text>
          <ResultsBody
            analysis={analysis}
            completions={completions}
            onToggleDrill={async (drillId) => {
              const next = await setDrillCompleted(drillId, !completions.includes(drillId));
              setCompletions(next);
            }}
          />
          <PrimaryButton
            title={copy.analyzeAnother}
            variant="ghost"
            onPress={() => router.replace('/(tabs)/analyze')}
            style={styles.cta}
          />
        </>
      ) : null}
    </Screen>
  );
}

function ResultsBody({
  analysis,
  completions,
  onToggleDrill,
}: {
  analysis: Analysis;
  completions: string[];
  onToggleDrill: (drillId: string) => void;
}) {
  const result = analysis.result;
  const metrics = analysis.pose_metrics;

  const hasMetrics = metrics && typeof metrics === 'object' && Object.keys(metrics).length > 0;
  const categories =
    result?.categories && typeof result.categories === 'object' ? result.categories : null;
  const punches = Array.isArray(result?.punches) ? result!.punches! : [];
  const faults = Array.isArray(result?.faults) ? result!.faults! : [];
  const drillIds = Array.isArray(result?.drill_ids)
    ? (result!.drill_ids as unknown[]).filter((d): d is string => typeof d === 'string')
    : [];
  const drills = drillIds
    .map((id) => getDrill(id))
    .filter((d): d is NonNullable<typeof d> => Boolean(d));
  const tacticalSummary =
    typeof result?.tactical_summary === 'string' ? result.tactical_summary : null;
  const strengths = Array.isArray(result?.strengths)
    ? (result!.strengths as unknown[]).filter((s): s is string => typeof s === 'string')
    : [];

  const hasAnything =
    hasMetrics || categories || punches.length || faults.length || tacticalSummary || drills.length;

  if (!hasAnything) {
    return (
      <EmptyState
        icon="document-text-outline"
        title="No result data"
        hint="The analysis finished but returned no breakdown. Try again with a clearer clip."
      />
    );
  }

  const avgScore =
    categories && Object.keys(categories).length > 0
      ? Object.values(categories).reduce((a, b) => a + b, 0) / Object.keys(categories).length
      : null;

  return (
    <View>
      {avgScore !== null ? (
        <View style={styles.avgRow}>
          <ScoreRing score={avgScore} label={copy.avgScore} />
        </View>
      ) : null}

      {hasMetrics ? (
        <>
          <SectionTitle>Measured Technique</SectionTitle>
          <View style={styles.card}>
            {Object.entries(metrics as Record<string, unknown>).map(([k, v]) => (
              <View key={k} style={styles.metricRow}>
                <Text style={styles.metricKey}>{prettifyKey(k)}</Text>
                <Text style={styles.metricValue}>{formatMetricValue(v)}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {categories && Object.keys(categories).length > 0 ? (
        <>
          <SectionTitle>{copy.performanceBreakdown}</SectionTitle>
          <View style={styles.card}>
            {Object.entries(categories).map(([k, v]) =>
              typeof v === 'number' ? <ScoreBar key={k} label={prettifyKey(k)} score={v} /> : null,
            )}
          </View>
        </>
      ) : null}

      {punches.length > 0 ? (
        <>
          <SectionTitle>{copy.offenseAnalysis}</SectionTitle>
          {punches.map((p, i) => (
            <PunchStat key={i} punch={p} />
          ))}
        </>
      ) : null}

      {faults.length > 0 ? (
        <>
          <SectionTitle>{copy.defenseTechnique}</SectionTitle>
          {faults.map((f, i) => (
            <View key={i} style={styles.card}>
              <Text style={styles.faultTitle}>
                {typeof f.fault === 'string' ? f.fault : 'Technique note'}
              </Text>
              {typeof f.cue === 'string' && f.cue ? (
                <Text style={styles.faultCue}>{f.cue}</Text>
              ) : null}
              {typeof f.severity === 'string' && f.severity ? (
                <Text style={styles.faultSeverity}>Severity: {f.severity}</Text>
              ) : null}
            </View>
          ))}
        </>
      ) : null}

      {tacticalSummary ? (
        <>
          <SectionTitle>{copy.tacticalSummary}</SectionTitle>
          <View style={styles.card}>
            <Text style={styles.body}>{tacticalSummary}</Text>
          </View>
        </>
      ) : null}

      {strengths.length > 0 ? (
        <>
          <SectionTitle>Strengths</SectionTitle>
          <View style={styles.card}>
            {strengths.map((s, i) => (
              <Text key={i} style={styles.bullet}>
                • {s}
              </Text>
            ))}
          </View>
        </>
      ) : null}

      {drills.length > 0 ? (
        <>
          <SectionTitle>{copy.recommendedDrills}</SectionTitle>
          {drills.map((d) => (
            <DrillCard
              key={d.id}
              drill={d}
              completed={completions.includes(d.id)}
              onToggle={() => onToggleDrill(d.id)}
            />
          ))}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  muted: { color: colors.muted, fontSize: 14 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', marginBottom: spacing.md },
  statusCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  statusFailed: { borderColor: colors.danger },
  statusText: { flex: 1 },
  statusLabel: { color: colors.text, fontSize: 16, fontWeight: '700' },
  statusHint: { color: colors.muted, fontSize: 13, marginTop: 4, lineHeight: 18 },
  error: { color: colors.danger, fontSize: 13, marginTop: 6 },
  cta: { marginTop: spacing.md },
  completeTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: spacing.lg,
  },
  completeSub: { color: colors.muted, fontSize: 14, marginTop: 4, marginBottom: spacing.sm },
  avgRow: { alignItems: 'center', marginVertical: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  metricKey: { color: colors.muted, fontSize: 14 },
  metricValue: { color: colors.text, fontSize: 14, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  bullet: { color: colors.muted, fontSize: 14, marginTop: 4, lineHeight: 20 },
  faultTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  faultCue: { color: colors.muted, fontSize: 14, marginTop: 4, lineHeight: 20 },
  faultSeverity: { color: colors.faint, fontSize: 12, marginTop: 6, textTransform: 'capitalize' },
});
