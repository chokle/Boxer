import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { EmptyState } from '../../components/EmptyState';
import { getSession } from '../../lib/analyses';
import { colors, radius, spacing } from '../../lib/theme';
import type { TrainingSession } from '../../lib/types';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!id) return;
    getSession(id).then((s) => {
      setSession(s);
      setLoaded(true);
    });
  }, [id]);

  if (!loaded) {
    return (
      <Screen>
        <Text style={styles.muted}>Loading…</Text>
      </Screen>
    );
  }

  if (!session) {
    return (
      <Screen>
        <EmptyState icon="journal-outline" title="Session not found" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>{session.title}</Text>
      <Text style={styles.date}>{new Date(session.created_at).toLocaleString()}</Text>

      {session.context ? (
        <>
          <Text style={styles.label}>Context</Text>
          <Text style={styles.body}>{session.context}</Text>
        </>
      ) : null}

      {session.notes ? (
        <>
          <Text style={styles.label}>Notes</Text>
          <Text style={styles.body}>{session.notes}</Text>
        </>
      ) : null}

      {session.media_uris.length > 0 ? (
        <>
          <Text style={styles.label}>Media</Text>
          <View style={styles.mediaRow}>
            {session.media_uris.map((uri, i) =>
              uri.match(/\.(mp4|mov|m4v)(\?|$)/i) ? (
                <View key={i} style={styles.mediaThumb}>
                  <Ionicons name="play-circle" size={28} color={colors.accent} />
                </View>
              ) : (
                <Image key={i} source={{ uri }} style={styles.mediaThumb} />
              ),
            )}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.muted, fontSize: 14 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  date: { color: colors.faint, fontSize: 13, marginTop: 4 },
  label: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  body: { color: colors.text, fontSize: 15, lineHeight: 22 },
  mediaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  mediaThumb: {
    width: 96,
    height: 96,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
