import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { PrimaryButton } from '../components/ui';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { colors, radius, spacing } from '../lib/theme';

export default function AuthScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isSupabaseConfigured()) {
    return (
      <Screen>
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.faint} />
          <Text style={styles.title}>Backend not connected</Text>
          <Text style={styles.hint}>
            Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file,
            then restart the app.
          </Text>
        </View>
      </Screen>
    );
  }

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    try {
      const supabase = getSupabase();
      const { error } =
        mode === 'signin'
          ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
          : await supabase.auth.signUp({ email: email.trim(), password });
      if (error) throw error;
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong signing in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={styles.center}>
        <Ionicons name="fitness" size={48} color={colors.accent} />
        <Text style={styles.title}>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</Text>
        <Text style={styles.hint}>
          Your analyses, drills, and profile sync to your account.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.faint}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.faint}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType={mode === 'signin' ? 'password' : 'newPassword'}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton
          title={mode === 'signin' ? 'Sign In' : 'Create Account'}
          onPress={submit}
          loading={busy}
          style={styles.button}
        />
        <PrimaryButton
          variant="ghost"
          title={mode === 'signin' ? 'New here? Create an account' : 'Have an account? Sign in'}
          onPress={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setError(null);
          }}
          style={styles.button}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', paddingVertical: spacing.xl },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', marginTop: spacing.md, textAlign: 'center' },
  hint: { color: colors.muted, fontSize: 14, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.lg },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  error: { color: colors.danger, fontSize: 14, marginBottom: spacing.sm, textAlign: 'center' },
  button: { marginTop: spacing.sm },
});
