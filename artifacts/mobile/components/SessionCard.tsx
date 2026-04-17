import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import type { MatchSession } from "@/types";

interface SessionCardProps {
  session: MatchSession;
  onPress?: () => void;
}

export function SessionCard({ session, onPress }: SessionCardProps) {
  const colors = useColors();
  const score = session.analysis.overall_score;
  const scoreColor =
    score >= 80 ? colors.success :
    score >= 60 ? colors.warning :
    colors.primary;

  const date = new Date(session.date).toLocaleDateString("en-US", {
    month: "short", day: "numeric",
  });

  const contextLabel: Record<string, string> = {
    training: "Training", sparring: "Sparring", amateur: "Amateur", pro: "Pro",
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.left}>
        <View style={[styles.scoreBadge, { backgroundColor: `${scoreColor}18`, borderColor: `${scoreColor}40` }]}>
          <Text style={[styles.score, { color: scoreColor }]}>{Math.round(score)}</Text>
        </View>
      </View>
      <View style={styles.mid}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>{session.title}</Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          {contextLabel[session.match_context] ?? session.match_context} · {date}
        </Text>
        <View style={styles.bars}>
          {[
            { v: session.analysis.stance_score, c: colors.success },
            { v: session.analysis.offense_score, c: colors.primary },
            { v: session.analysis.defense_score, c: colors.info },
            { v: session.analysis.footwork_score, c: colors.warning },
          ].map((b, i) => (
            <View key={i} style={[styles.miniTrack, { backgroundColor: colors.muted }]}>
              <View style={[styles.miniFill, { width: `${b.v}%`, backgroundColor: b.c }]} />
            </View>
          ))}
        </View>
      </View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10, gap: 12 },
  left: {},
  scoreBadge: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  score: { fontSize: 18, fontFamily: "Inter_700Bold" },
  mid: { flex: 1 },
  title: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  meta: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 8 },
  bars: { gap: 3 },
  miniTrack: { height: 3, borderRadius: 2, overflow: "hidden" },
  miniFill: { height: 3, borderRadius: 2 },
});
