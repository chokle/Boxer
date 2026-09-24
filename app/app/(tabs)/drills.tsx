import { useCallback, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '../../components/Screen';
import { EmptyState } from '../../components/EmptyState';
import { DrillCard } from '../../components/DrillCard';
import { SectionTitle } from '../../components/ui';
import { copy } from '../../lib/copy';
import { getDrills, loadCompletions, setDrillCompleted } from '../../lib/drills';
import { colors } from '../../lib/theme';
import type { Drill } from '../../lib/types';

export default function DrillsScreen() {
  const [drills, setDrills] = useState<Drill[]>([]);
  const [completions, setCompletions] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const [d, c] = await Promise.all([getDrills(), loadCompletions()]);
        if (alive) {
          setDrills(d);
          setCompletions(c);
        }
      })();
      return () => {
        alive = false;
      };
    }, []),
  );

  const toggle = async (drillId: string) => {
    const next = await setDrillCompleted(drillId, !completions.includes(drillId));
    setCompletions(next);
  };

  const active = drills.filter((d) => !completions.includes(d.id));
  const done = drills.filter((d) => completions.includes(d.id));

  return (
    <Screen>
      <Text style={styles.title}>{copy.trainingDrills}</Text>

      {drills.length === 0 ? (
        <EmptyState icon="barbell-outline" title={copy.noDrillsYet} hint={copy.drillsEmptyHint} />
      ) : (
        <>
          <SectionTitle>{copy.recommendedDrills}</SectionTitle>
          {active.length === 0 ? (
            <EmptyState
              icon="checkmark-circle-outline"
              title="All drills complete"
              hint="Nice work. Analyze another round for fresh recommendations."
            />
          ) : (
            active.map((d) => (
              <DrillCard
                key={d.id}
                drill={d}
                completed={false}
                onToggle={() => toggle(d.id)}
              />
            ))
          )}

          {done.length > 0 ? (
            <>
              <SectionTitle>Completed</SectionTitle>
              {done.map((d) => (
                <DrillCard key={d.id} drill={d} completed onToggle={() => toggle(d.id)} />
              ))}
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
});
