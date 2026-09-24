import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { trySupabase } from '../lib/supabase';
import { introStore } from '../lib/store';
import { colors } from '../lib/theme';

function Loading() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [introDone, setIntroDone] = useState<boolean | null>(null);
  const [session, setSession] = useState<boolean | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const done = await introStore.isDone();
      const supabase = trySupabase();
      let hasSession = false;
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        hasSession = Boolean(data.session);
        supabase.auth.onAuthStateChange((_event, s) => {
          if (mounted) setSession(Boolean(s));
        });
      }
      if (mounted) {
        setIntroDone(done);
        setSession(hasSession);
        setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!ready || introDone === null || session === null) return;
    const inIntro = segments[0] === 'intro';
    const inAuth = segments[0] === 'auth';

    if (!introDone && !inIntro) {
      router.replace('/intro');
    } else if (introDone && !session && !inAuth && !inIntro) {
      // No auth anywhere in v1 of the original app; the rebuild needs
      // accounts for cloud analysis history, so gate here — honestly.
      router.replace('/auth');
    } else if (introDone && session && (inAuth || inIntro)) {
      router.replace('/(tabs)');
    }
  }, [ready, introDone, session, segments]);

  if (!ready) return <Loading />;

  return (
    <>
      <StatusBar style="light" />
      <Slot />
    </>
  );
}
