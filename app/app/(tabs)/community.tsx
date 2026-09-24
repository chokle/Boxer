import { useCallback, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { EmptyState } from '../../components/EmptyState';
import { copy } from '../../lib/copy';
import { trySupabase } from '../../lib/supabase';
import { colors, radius, spacing } from '../../lib/theme';
import type { Club, Tournament } from '../../lib/types';

type Tab = 'fighters' | 'gyms' | 'tournaments';

export default function CommunityScreen() {
  const [tab, setTab] = useState<Tab>('gyms');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const supabase = trySupabase();
        if (!supabase) return;
        const [c, t] = await Promise.all([
          supabase.from('clubs').select('*').order('name').limit(100),
          supabase
            .from('tournaments')
            .select('*')
            .gte('starts_at', new Date().toISOString())
            .order('starts_at')
            .limit(50),
        ]);
        if (!alive) return;
        if (!c.error && c.data) setClubs(c.data as Club[]);
        if (!t.error && t.data) setTournaments(t.data as Tournament[]);
      })();
      return () => {
        alive = false;
      };
    }, []),
  );

  return (
    <Screen>
      <Text style={styles.title}>Community</Text>
      <Text style={styles.hint}>{copy.tapToFindOpponents}</Text>

      <View style={styles.tabs}>
        {(
          [
            { id: 'fighters', label: copy.fighters },
            { id: 'gyms', label: copy.gyms },
            { id: 'tournaments', label: copy.tournaments },
          ] as { id: Tab; label: string }[]
        ).map((t) => (
          <Pressable
            key={t.id}
            style={[styles.tab, tab === t.id && styles.tabActive]}
            onPress={() => setTab(t.id)}
          >
            <Text style={[styles.tabLabel, tab === t.id && styles.tabLabelActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'fighters' ? (
        <EmptyState
          icon="people-outline"
          title={copy.noFightersFound}
          hint="Fighter profiles are coming soon."
        />
      ) : null}

      {tab === 'gyms' ? (
        clubs.length === 0 ? (
          <EmptyState
            icon="location-outline"
            title={copy.noGymsFound}
            hint="The gym directory hasn't been seeded yet — check back soon."
          />
        ) : (
          clubs.map((club) => (
            <View key={club.id} style={styles.card}>
              <Text style={styles.cardTitle}>{club.name}</Text>
              {club.address ? <Text style={styles.cardSub}>{club.address}</Text> : null}
              {club.city ? <Text style={styles.cardSub}>{club.city}</Text> : null}
              {club.website ? (
                <Pressable
                  style={styles.linkRow}
                  onPress={() => {
                    const url = club.website!.startsWith('http')
                      ? club.website!
                      : `https://${club.website}`;
                    Linking.openURL(url).catch(() => {});
                  }}
                >
                  <Ionicons name="globe-outline" size={16} color={colors.accent} />
                  <Text style={styles.link}>Visit website</Text>
                </Pressable>
              ) : null}
            </View>
          ))
        )
      ) : null}

      {tab === 'tournaments' ? (
        tournaments.length === 0 ? (
          <EmptyState
            icon="trophy-outline"
            title={copy.noUpcomingTournaments}
            hint="Tournament listings are coming soon."
          />
        ) : (
          tournaments.map((t) => (
            <View key={t.id} style={styles.card}>
              <Text style={styles.cardTitle}>{t.title}</Text>
              <Text style={styles.cardSub}>
                {[
                  t.organizer,
                  t.starts_at ? new Date(t.starts_at).toLocaleDateString() : null,
                  t.location,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
              {t.registration_url ? (
                <Pressable
                  style={styles.linkRow}
                  onPress={() => Linking.openURL(t.registration_url!).catch(() => {})}
                >
                  <Ionicons name="open-outline" size={16} color={colors.accent} />
                  <Text style={styles.link}>Registration</Text>
                </Pressable>
              ) : t.deadline_text ? (
                <Text style={styles.cardSub}>{t.deadline_text}</Text>
              ) : null}
            </View>
          ))
        )
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  hint: { color: colors.muted, fontSize: 14, marginTop: 4 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.card },
  tabLabel: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  tabLabelActive: { color: colors.text },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  cardSub: { color: colors.muted, fontSize: 13, marginTop: 2 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
  link: { color: colors.accent, fontSize: 14, fontWeight: '700' },
});
