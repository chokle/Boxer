import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { PrimaryButton } from '../../components/ui';
import { copy } from '../../lib/copy';
import { saveSession } from '../../lib/analyses';
import { colors, radius, spacing } from '../../lib/theme';

export default function NewSessionScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [notes, setNotes] = useState('');
  const [mediaUris, setMediaUris] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const attach = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Photo library access is required to attach media.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: false,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setMediaUris((list) => [...list, result.assets[0].uri]);
    }
  };

  const save = async () => {
    if (!title.trim()) {
      Alert.alert(copy.pleaseEnterSessionTitle, copy.sessionTitlePlaceholder);
      return;
    }
    setSaving(true);
    try {
      const created = await saveSession({
        title: title.trim(),
        context: context.trim() || undefined,
        notes: notes.trim() || undefined,
        media_uris: mediaUris,
      });
      router.replace(`/session/${created.id}`);
    } catch (e: any) {
      Alert.alert('Could not save', e?.message ?? 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>Log Session</Text>

      <Text style={styles.label}>{copy.pleaseEnterSessionTitle}</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder={copy.sessionTitlePlaceholder}
        placeholderTextColor={colors.faint}
      />

      <Text style={styles.label}>{copy.briefContext}</Text>
      <TextInput
        style={styles.input}
        value={context}
        onChangeText={setContext}
        placeholder="Where, with whom, what focus…"
        placeholderTextColor={colors.faint}
      />

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, styles.notes]}
        value={notes}
        onChangeText={setNotes}
        placeholder={copy.notesPrompt}
        placeholderTextColor={colors.faint}
        multiline
      />

      <Text style={styles.label}>Media</Text>
      <View style={styles.mediaRow}>
        {mediaUris.map((uri, i) =>
          uri.match(/\.(mp4|mov|m4v)(\?|$)/i) ? (
            <View key={i} style={styles.mediaThumb}>
              <Ionicons name="play-circle" size={28} color={colors.accent} />
            </View>
          ) : (
            <Image key={i} source={{ uri }} style={styles.mediaThumb} />
          ),
        )}
        <Pressable style={styles.addMedia} onPress={attach}>
          <Ionicons name="add" size={28} color={colors.accent} />
        </Pressable>
      </View>

      <PrimaryButton title="Save Session" onPress={save} loading={saving} style={styles.save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  label: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: 16,
    padding: spacing.md,
  },
  notes: { minHeight: 120, textAlignVertical: 'top' },
  mediaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  mediaThumb: {
    width: 72,
    height: 72,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMedia: {
    width: 72,
    height: 72,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  save: { marginTop: spacing.lg },
});
