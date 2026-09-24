import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { EmptyState } from '../../components/EmptyState';
import { PrimaryButton, SectionTitle } from '../../components/ui';
import { ANALYSIS_TYPES, copy, type AnalysisType } from '../../lib/copy';
import { isSupabaseConfigured } from '../../lib/supabase';
import { startAnalysis } from '../../lib/analyses';
import { colors, radius, spacing } from '../../lib/theme';

type Phase = 'idle' | 'ready' | 'uploading' | 'queued' | 'error';

interface PickedMedia {
  uri: string;
  type: 'video' | 'image';
  durationMs?: number;
  sizeKb?: number;
}

export default function AnalyzeScreen() {
  const router = useRouter();
  const [media, setMedia] = useState<PickedMedia | null>(null);
  const [analysisType, setAnalysisType] = useState<AnalysisType>('shadowboxing');
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const connected = isSupabaseConfigured();

  async function ensureLibraryPermission(): Promise<boolean> {
    // Request up front so iOS doesn't surprise the user with a dialog after
    // picking a video (SDK 54 default: passthrough export).
    const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!res.granted) {
      Alert.alert('Permission needed', 'Photo library access is required to attach footage.');
      return false;
    }
    return true;
  }

  async function ensureCameraPermission(): Promise<boolean> {
    const res = await ImagePicker.requestCameraPermissionsAsync();
    if (!res.granted) {
      Alert.alert('Permission needed', 'Camera access is required to record footage.');
      return false;
    }
    return true;
  }

  function toPicked(asset: ImagePicker.ImagePickerAsset): PickedMedia {
    return {
      uri: asset.uri,
      type: asset.type === 'video' ? 'video' : 'image',
      durationMs: asset.duration ?? undefined,
      sizeKb: asset.fileSize ? Math.round(asset.fileSize / 1024) : undefined,
    };
  }

  const pickFromLibrary = async () => {
    if (!(await ensureLibraryPermission())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: false,
      quality: 0.8,
      videoMaxDuration: 90,
    });
    if (!result.canceled && result.assets[0]) {
      setMedia(toPicked(result.assets[0]));
      setPhase('ready');
      setError(null);
    }
  };

  const recordVideo = async () => {
    if (!(await ensureCameraPermission())) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      quality: 0.8,
      videoMaxDuration: 90,
    });
    if (!result.canceled && result.assets[0]) {
      setMedia(toPicked(result.assets[0]));
      setPhase('ready');
      setError(null);
    }
  };

  const takePhoto = async () => {
    if (!(await ensureCameraPermission())) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setMedia(toPicked(result.assets[0]));
      setPhase('ready');
      setError(null);
    }
  };

  const upload = async () => {
    if (!media) return;
    setError(null);
    setProgress(0);
    setPhase('uploading');
    try {
      const id = await startAnalysis({
        mediaUri: media.uri,
        analysisType,
        onProgress: setProgress,
      });
      setPhase('queued');
      router.push(`/analysis/${id}`);
      // Reset for the next run once the status screen takes over.
      setMedia(null);
      setPhase('idle');
    } catch (e: any) {
      setPhase('error');
      setError(e?.message ?? 'Something went wrong starting the analysis.');
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>{copy.analyzeWithAI}</Text>
      <Text style={styles.hint}>{copy.attachHint}</Text>

      {!connected ? (
        <View style={styles.warn}>
          <Ionicons name="cloud-offline-outline" size={22} color={colors.gold} />
          <Text style={styles.warnText}>
            Analysis service not connected. Add your Supabase credentials to run real analyses —
            nothing here is simulated.
          </Text>
        </View>
      ) : null}

      <SectionTitle>{copy.addPhotosOrVideos}</SectionTitle>
      <View style={styles.pickRow}>
        <Pressable style={styles.pickBtn} onPress={recordVideo}>
          <Ionicons name="videocam" size={26} color={colors.accent} />
          <Text style={styles.pickLabel}>Record</Text>
        </Pressable>
        <Pressable style={styles.pickBtn} onPress={pickFromLibrary}>
          <Ionicons name="folder-open" size={26} color={colors.accent} />
          <Text style={styles.pickLabel}>Library</Text>
        </Pressable>
        <Pressable style={styles.pickBtn} onPress={takePhoto}>
          <Ionicons name="camera" size={26} color={colors.accent} />
          <Text style={styles.pickLabel}>Photo</Text>
        </Pressable>
      </View>
      <Text style={styles.guidance}>
        Keep clips under 90 seconds. 720p is plenty — footage is compressed on upload.
      </Text>

      {media ? (
        <View style={styles.preview}>
          {media.type === 'image' ? (
            <Image source={{ uri: media.uri }} style={styles.thumb} />
          ) : (
            <View style={styles.videoBadge}>
              <Ionicons name="play-circle" size={40} color={colors.accent} />
            </View>
          )}
          <View style={styles.previewMeta}>
            <Text style={styles.previewTitle}>{media.type === 'video' ? 'Video' : 'Photo'} ready</Text>
            <Text style={styles.previewSub}>
              {[
                media.durationMs ? `${Math.round(media.durationMs / 1000)}s` : null,
                media.sizeKb ? `${(media.sizeKb / 1024).toFixed(1)} MB` : null,
              ]
                .filter(Boolean)
                .join(' · ') || 'Attached'}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              setMedia(null);
              setPhase('idle');
            }}
            hitSlop={12}
          >
            <Ionicons name="close-circle" size={26} color={colors.muted} />
          </Pressable>
        </View>
      ) : null}

      <SectionTitle>Analysis type</SectionTitle>
      <View style={styles.typeList}>
        {ANALYSIS_TYPES.map((t) => (
          <Pressable
            key={t.id}
            style={[styles.typeCard, analysisType === t.id && styles.typeCardActive]}
            onPress={() => setAnalysisType(t.id)}
          >
            <Text style={[styles.typeTitle, analysisType === t.id && styles.typeTitleActive]}>
              {t.title}
            </Text>
            <Text style={styles.typeHint}>{t.hint}</Text>
          </Pressable>
        ))}
      </View>

      {phase === 'uploading' ? (
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>Uploading… {Math.round(progress * 100)}%</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton
        title={phase === 'error' ? copy.tryAgain : copy.analyzeMatch}
        onPress={upload}
        disabled={!media || !connected || phase === 'uploading'}
        loading={phase === 'uploading'}
        style={styles.cta}
      />

      {!media && phase === 'idle' ? (
        <EmptyState
          icon="analytics-outline"
          title={copy.analyzeFirstMatch}
          hint="Record or attach footage, pick an analysis type, and your coach gets to work."
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  hint: { color: colors.muted, fontSize: 14, marginTop: 4, lineHeight: 20 },
  warn: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: '#2A2113',
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  warnText: { color: colors.gold, fontSize: 13, flex: 1, lineHeight: 18 },
  pickRow: { flexDirection: 'row', gap: spacing.sm },
  pickBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 6,
  },
  pickLabel: { color: colors.text, fontSize: 13, fontWeight: '600' },
  guidance: { color: colors.faint, fontSize: 12, marginTop: spacing.sm, lineHeight: 16 },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  thumb: { width: 56, height: 56, borderRadius: radius.sm },
  videoBadge: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewMeta: { flex: 1 },
  previewTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  previewSub: { color: colors.muted, fontSize: 13, marginTop: 2 },
  typeList: { gap: spacing.sm },
  typeCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  typeCardActive: { borderColor: colors.accent, backgroundColor: '#221114' },
  typeTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  typeTitleActive: { color: colors.accent },
  typeHint: { color: colors.muted, fontSize: 13, marginTop: 2 },
  progressWrap: { marginTop: spacing.md },
  progressTrack: {
    height: 10,
    backgroundColor: colors.border,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.accent },
  progressText: { color: colors.muted, fontSize: 13, marginTop: 6, textAlign: 'center' },
  error: { color: colors.danger, fontSize: 14, marginTop: spacing.sm, textAlign: 'center' },
  cta: { marginTop: spacing.md },
});
