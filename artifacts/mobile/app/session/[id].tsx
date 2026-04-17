import React from "react";
import { View, Text, ScrollView, StyleSheet, Platform } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import { useBoxing } from "@/context/BoxingContext";
import { ScoreRing } from "@/components/ScoreRing";
import { ScoreBar } from "@/components/ScoreBar";

const CATEGORY_COLORS: Record<string, string> = {
  footwork: "#3b82f6", offense: "#E8192C", defense: "#22c55e",
  stamina: "#f59e0b", combination: "#8b5cf6", general: "#6b7280",
};
const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "#22c55e", Medium: "#f59e0b", Hard: "#E8192C",
};

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sessions } = useBoxing();
  const session = sessions.find(s => s.id === id);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  const s = makeStyles(colors);

  if (!session) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground, fontSize: 15, fontFamily: "Inter_400Regular" }}>Session not found</Text>
      </View>
    );
  }

  const a = session.analysis;
  const contextLabel: Record<string, string> = { training: "Training", sparring: "Sparring", amateur: "Amateur", pro: "Pro Fight" };
  const styleLabel: Record<string, string> = { balanced: "Balanced", aggressive: "Aggressive", defensive: "Defensive", counter: "Counter-Puncher", brawler: "Brawler" };

  return (
    <ScrollView
      style={[s.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: bottomPad + 20 }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400)}>
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.sessionTitle, { color: colors.foreground }]}>{session.title}</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
            <Chip label={contextLabel[session.match_context] ?? session.match_context} color={colors.info} />
            <Chip label={`vs ${styleLabel[session.opponent_style] ?? session.opponent_style}`} color={colors.mutedForeground} />
          </View>
          <Text style={[s.dateText, { color: colors.mutedForeground }]}>
            {new Date(session.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          </Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(80)}>
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 24 }}>
            <ScoreRing score={a.overall_score} size={110} label="Overall" color={colors.primary} />
            <View style={{ flex: 1, gap: 12 }}>
              <PunchStat label="Thrown" value={a.punches_thrown} colors={colors} />
              <PunchStat label="Landed" value={a.punches_landed} colors={colors} />
              <PunchStat label="Accuracy" value={`${Math.round(a.shot_accuracy)}%`} colors={colors} />
            </View>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(140)}>
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.cardTitle, { color: colors.foreground }]}>Performance Breakdown</Text>
          <ScoreBar label="Stance" score={a.stance_score} color={colors.success} />
          <ScoreBar label="Offense" score={a.offense_score} color={colors.primary} />
          <ScoreBar label="Defense" score={a.defense_score} color={colors.info} />
          <ScoreBar label="Footwork" score={a.footwork_score} color={colors.warning} />
          <ScoreBar label="Combinations" score={a.combination_score} color="#8b5cf6" />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(200)}>
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.cardTitle, { color: colors.foreground }]}>Tactical Summary</Text>
          <Text style={[s.bodyText, { color: colors.mutedForeground }]}>{a.tactical_summary}</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(260)}>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={[s.card, { flex: 1, backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.cardTitle, { color: colors.foreground }]}>Strengths</Text>
            {a.key_strengths?.map((str, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 8, marginBottom: 6 }}>
                <Text style={{ color: colors.success, marginTop: 1 }}>✓</Text>
                <Text style={[s.listText, { color: colors.mutedForeground, flex: 1 }]}>{str}</Text>
              </View>
            ))}
          </View>
          <View style={[s.card, { flex: 1, backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.cardTitle, { color: colors.foreground }]}>Improve</Text>
            {a.improvement_areas?.map((area, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 8, marginBottom: 6 }}>
                <Text style={{ color: colors.warning, marginTop: 1 }}>→</Text>
                <Text style={[s.listText, { color: colors.mutedForeground, flex: 1 }]}>{area}</Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>

      {[
        { title: "Stance Feedback", text: a.stance_feedback },
        { title: "Offense Analysis", text: a.offense_feedback },
        { title: "Defense Technique", text: a.defense_feedback },
        { title: "Footwork & Movement", text: a.footwork_feedback },
        { title: "Combinations", text: a.combination_feedback },
      ].map((item, i) => (
        <Animated.View key={item.title} entering={FadeInDown.duration(400).delay(320 + i * 50)}>
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
            <Text style={[s.bodyText, { color: colors.mutedForeground }]}>{item.text}</Text>
          </View>
        </Animated.View>
      ))}

      {a.drills?.length > 0 && (
        <Animated.View entering={FadeInDown.duration(400).delay(580)}>
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.cardTitle, { color: colors.foreground }]}>Recommended Drills</Text>
            {a.drills.map((drill) => {
              const catColor = CATEGORY_COLORS[drill.category] ?? "#6b7280";
              const diffColor = DIFFICULTY_COLORS[drill.difficulty] ?? colors.mutedForeground;
              return (
                <View key={drill.id} style={[s.drillItem, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                    <Text style={{ fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground, flex: 1 }}>{drill.name}</Text>
                    <View style={{ flexDirection: "row", gap: 4 }}>
                      <Chip label={drill.category} color={catColor} small />
                      <Chip label={drill.difficulty} color={diffColor} small />
                    </View>
                  </View>
                  <Text style={[s.listText, { color: colors.mutedForeground }]}>{drill.description}</Text>
                  {drill.duration ? <Text style={[s.drillMeta, { color: colors.mutedForeground }]}>Duration: {drill.duration}</Text> : null}
                  {drill.reps ? <Text style={[s.drillMeta, { color: colors.mutedForeground }]}>Reps: {drill.reps}</Text> : null}
                </View>
              );
            })}
          </View>
        </Animated.View>
      )}
    </ScrollView>
  );
}

function PunchStat({ label, value, colors }: { label: string; value: string | number; colors: ReturnType<typeof useColors> }) {
  return (
    <View>
      <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</Text>
      <Text style={{ fontSize: 20, fontFamily: "Inter_700Bold", color: colors.foreground }}>{value}</Text>
    </View>
  );
}

function Chip({ label, color, small = false }: { label: string; color: string; small?: boolean }) {
  return (
    <View style={{ paddingHorizontal: small ? 6 : 10, paddingVertical: small ? 2 : 4, borderRadius: 20, backgroundColor: `${color}20`, borderWidth: 1, borderColor: `${color}40` }}>
      <Text style={{ fontSize: small ? 10 : 12, fontFamily: "Inter_500Medium", color }}>{label}</Text>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
    sessionTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
    dateText: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 6 },
    cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
    bodyText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
    listText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
    drillItem: { borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 8 },
    drillMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4 },
  });
}
