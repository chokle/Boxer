import { useCallback, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { EmptyState } from '../../components/EmptyState';
import { Chip, PrimaryButton, SectionTitle } from '../../components/ui';
import { BODY_PARTS, BOXING_STYLES, EXPERIENCE_LEVELS, WEIGHT_CLASSES, copy } from '../../lib/copy';
import { isSupabaseConfigured, trySupabase } from '../../lib/supabase';
import { newId, profileStore } from '../../lib/store';
import { colors, radius, spacing } from '../../lib/theme';
import type { Injury, Profile } from '../../lib/types';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>({});
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [injuryPart, setInjuryPart] = useState<string>(BODY_PARTS[0]);
  const [injuryDesc, setInjuryDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedTick, setSavedTick] = useState(false);

  const load = useCallback(async () => {
    const supabase = trySupabase();
    if (supabase) {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (user) {
        const [{ data: p }, { data: inj }] = await Promise.all([
          supabase.from('profiles').select('*').eq('user_id', user.id).single(),
          supabase.from('injuries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        ]);
        if (p) {
          setProfile({
            name: p.name ?? undefined,
            boxing_style: p.boxing_style ?? undefined,
            weight_class: p.weight_class ?? undefined,
            experience: p.experience ?? undefined,
            photo_url: p.photo_url ?? undefined,
          });
        }
        if (inj) {
          setInjuries(
            (inj as any[]).map((r) => ({
              id: r.id,
              body_part: r.body_part,
              description: r.description ?? undefined,
              created_at: r.created_at,
            })),
          );
          return;
        }
      }
    }
    setProfile(await profileStore.load());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Photo library access is required to set a profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;

    // Upload when the backend is available; otherwise keep the local URI.
    let photoUrl: string | null = uri;
    const supabase = trySupabase();
    if (supabase) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;
        if (user) {
          const fileRes = await fetch(uri);
          const blob = await fileRes.blob();
          const path = `${user.id}/profile.jpg`;
          const { error } = await supabase.storage
            .from('profile-photos')
            .upload(path, blob, { contentType: 'image/jpeg', upsert: true });
          if (!error) {
            // Bucket is private; store a long-lived signed URL.
            const { data: signed } = await supabase.storage
              .from('profile-photos')
              .createSignedUrl(path, 60 * 60 * 24 * 365);
            photoUrl = signed?.signedUrl ?? uri;
          }
        }
      } catch {
        // Fall through to the local URI.
      }
    }
    setProfile((p) => ({ ...p, photo_url: photoUrl }));
  };

  const save = async () => {
    if (!profile.name?.trim()) {
      Alert.alert(copy.yourName, copy.pleaseEnterName);
      return;
    }
    setSaving(true);
    try {
      const supabase = trySupabase();
      if (supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;
        if (user) {
          const { error } = await supabase.from('profiles').upsert(
            {
              user_id: user.id,
              name: profile.name?.trim() ?? null,
              boxing_style: profile.boxing_style ?? null,
              weight_class: profile.weight_class ?? null,
              experience: profile.experience ?? null,
              photo_url: profile.photo_url ?? null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' },
          );
          if (error) throw error;
        } else {
          await profileStore.save(profile);
        }
      } else {
        await profileStore.save(profile);
      }
      setSavedTick(true);
      setTimeout(() => setSavedTick(false), 2000);
    } catch (e: any) {
      Alert.alert('Could not save', e?.message ?? 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  const logInjury = async () => {
    if (!injuryDesc.trim()) {
      Alert.alert(copy.logInjury, copy.pleaseDescribeInjury);
      return;
    }
    const supabase = trySupabase();
    if (supabase) {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (user) {
        const { data, error } = await supabase
          .from('injuries')
          .insert({ user_id: user.id, body_part: injuryPart, description: injuryDesc.trim() })
          .select('*')
          .single();
        if (!error && data) {
          setInjuries((list) => [
            {
              id: data.id,
              body_part: data.body_part,
              description: data.description ?? undefined,
              created_at: data.created_at,
            },
            ...list,
          ]);
          setInjuryDesc('');
          return;
        }
      }
    }
    setInjuries((list) => [
      { id: newId(), body_part: injuryPart, description: injuryDesc.trim(), created_at: new Date().toISOString() },
      ...list,
    ]);
    setInjuryDesc('');
  };

  const removeInjury = async (id: string) => {
    const supabase = trySupabase();
    if (supabase) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user) {
        await supabase.from('injuries').delete().eq('id', id);
      }
    }
    setInjuries((list) => list.filter((i) => i.id !== id));
  };

  const signOut = async () => {
    const supabase = trySupabase();
    if (supabase) await supabase.auth.signOut();
    router.replace('/auth');
  };

  return (
    <Screen>
      <Text style={styles.title}>{copy.boxerProfile}</Text>

      <View style={styles.photoRow}>
        <Pressable onPress={pickPhoto} style={styles.photoWrap}>
          {profile.photo_url ? (
            <Image source={{ uri: profile.photo_url }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="person" size={40} color={colors.faint} />
            </View>
          )}
          <View style={styles.photoBadge}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </Pressable>
        <Text style={styles.photoHint}>Tap to set your profile photo</Text>
      </View>

      <SectionTitle>{copy.personalInfo}</SectionTitle>
      <Text style={styles.label}>{copy.yourName}</Text>
      <TextInput
        style={styles.input}
        value={profile.name ?? ''}
        onChangeText={(t) => setProfile((p) => ({ ...p, name: t }))}
        placeholder={copy.pleaseEnterName}
        placeholderTextColor={colors.faint}
      />

      <Text style={styles.label}>Boxing Style</Text>
      <View style={styles.chipRow}>
        {BOXING_STYLES.map((s) => (
          <Chip
            key={s}
            label={s}
            selected={profile.boxing_style === s}
            onPress={() => setProfile((p) => ({ ...p, boxing_style: s }))}
          />
        ))}
      </View>

      <Text style={styles.label}>Weight Class</Text>
      <View style={styles.chipRow}>
        {WEIGHT_CLASSES.map((w) => (
          <Chip
            key={w}
            label={w}
            selected={profile.weight_class === w}
            onPress={() => setProfile((p) => ({ ...p, weight_class: w }))}
          />
        ))}
      </View>

      <Text style={styles.label}>Experience</Text>
      <View style={styles.chipRow}>
        {EXPERIENCE_LEVELS.map((e) => (
          <Chip
            key={e}
            label={e}
            selected={profile.experience === e}
            onPress={() => setProfile((p) => ({ ...p, experience: e }))}
          />
        ))}
      </View>

      <Text style={styles.accuracyNote}>{copy.statsImproveAccuracy}</Text>

      <PrimaryButton
        title={savedTick ? 'Saved ✓' : copy.saveProfile}
        onPress={save}
        loading={saving}
        style={styles.saveBtn}
      />

      <SectionTitle>{copy.logInjury}</SectionTitle>
      <View style={styles.chipRow}>
        {BODY_PARTS.map((b) => (
          <Chip key={b} label={b} selected={injuryPart === b} onPress={() => setInjuryPart(b)} />
        ))}
      </View>
      <TextInput
        style={styles.input}
        value={injuryDesc}
        onChangeText={setInjuryDesc}
        placeholder={copy.pleaseDescribeInjury}
        placeholderTextColor={colors.faint}
        multiline
      />
      <PrimaryButton title={copy.logInjury} variant="ghost" onPress={logInjury} />

      <SectionTitle>{copy.recentInjuries}</SectionTitle>
      {injuries.length === 0 ? (
        <EmptyState icon="medkit-outline" title="No injuries logged" hint="Stay healthy out there." />
      ) : (
        injuries.map((inj) => (
          <View key={inj.id} style={styles.injuryCard}>
            <View style={styles.injuryMeta}>
              <Text style={styles.injuryTitle}>{inj.body_part}</Text>
              {inj.description ? <Text style={styles.injuryDesc}>{inj.description}</Text> : null}
              <Text style={styles.injuryDate}>{new Date(inj.created_at).toLocaleDateString()}</Text>
            </View>
            <Pressable onPress={() => removeInjury(inj.id)} hitSlop={12}>
              <Text style={styles.remove}>{copy.removeInjury}</Text>
            </Pressable>
          </View>
        ))
      )}

      {isSupabaseConfigured() ? (
        <PrimaryButton title="Sign Out" variant="ghost" onPress={signOut} style={styles.signOut} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  photoRow: { alignItems: 'center', marginTop: spacing.md },
  photoWrap: { position: 'relative' },
  photo: { width: 110, height: 110, borderRadius: 55 },
  photoPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoHint: { color: colors.faint, fontSize: 12, marginTop: 8 },
  label: { color: colors.muted, fontSize: 14, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: 16,
    padding: spacing.md,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  accuracyNote: { color: colors.faint, fontSize: 12, marginTop: spacing.md, fontStyle: 'italic' },
  saveBtn: { marginTop: spacing.md },
  injuryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  injuryMeta: { flex: 1, marginRight: spacing.sm },
  injuryTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  injuryDesc: { color: colors.muted, fontSize: 14, marginTop: 2 },
  injuryDate: { color: colors.faint, fontSize: 12, marginTop: 4 },
  remove: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  signOut: { marginTop: spacing.xl, marginBottom: spacing.md },
});
