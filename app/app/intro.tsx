import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { copy } from '../lib/copy';
import { introStore } from '../lib/store';
import { colors, radius, spacing } from '../lib/theme';
import { PrimaryButton } from '../components/ui';

export default function IntroScreen() {
  const router = useRouter();

  const enter = async () => {
    await introStore.markDone();
    router.replace('/auth');
  };

  return (
    <LinearGradient colors={['#1A0B0D', colors.bg, colors.bg]} style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <Ionicons name="fitness" size={56} color={colors.accent} />
          </View>
          <Text style={styles.kicker}>BOXER AI</Text>
          <Text style={styles.title}>{copy.stepIntoTheRing}</Text>
          <Text style={styles.body}>
            Upload your training footage and get a real breakdown of your technique — punches,
            footwork, defense — plus drills built around what needs work.
          </Text>
          <View style={styles.points}>
            <Text style={styles.point}>• Upload or record rounds from your phone</Text>
            <Text style={styles.point}>• Measurable technique feedback, not vibes</Text>
            <Text style={styles.point}>• Drill recommendations that target your faults</Text>
          </View>
        </View>
        <View style={styles.footer}>
          <PrimaryButton title={copy.stepIntoTheRing} onPress={enter} />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  iconWrap: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  kicker: { color: colors.accent, fontSize: 13, fontWeight: '800', letterSpacing: 4, marginBottom: 8 },
  title: { color: colors.text, fontSize: 38, fontWeight: '900', marginBottom: spacing.md },
  body: { color: colors.muted, fontSize: 16, lineHeight: 24, marginBottom: spacing.lg },
  points: { gap: 8 },
  point: { color: colors.muted, fontSize: 15 },
  footer: { padding: spacing.lg },
});
