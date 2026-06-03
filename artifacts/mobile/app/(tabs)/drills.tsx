import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useBoxing } from "@/context/BoxingContext";
import type { DrillRecommendation } from "@/types";
import { TabBgImage, TAB_BG_IMAGES } from "@/components/TabBgImage";

const CATEGORY_COLORS: Record<string, string> = {
  footwork: "#3b82f6",
  offense: "#E8192C",
  defense: "#22c55e",
  stamina: "#f59e0b",
  combination: "#8b5cf6",
  general: "#6b7280",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "#22c55e",
  Medium: "#f59e0b",
  Hard: "#E8192C",
};

export default function DrillsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sessions, updateDrillCompleted } = useBoxing();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const allDrills = useMemo(() => {
    const map = new Map<string, DrillRecommendation & { sessionId: string }>();
    sessions.forEach(s =>
      s.analysis.drills.forEach(d => map.set(d.id, { ...d, sessionId: s.id }))
    );
    return [...map.values()];
  }, [sessions]);

  const active = allDrills.filter(d => !d.completed);
  const done = allDrills.filter(d => d.completed);

  const s = makeStyles(colors);

  const toggle = (sessionId: string, drillId: string, completed: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateDrillCompleted(sessionId, drillId, completed);
  };

  return (
    <View style={{ flex: 1 }}>
      <TabBgImage uri={TAB_BG_IMAGES.drills} />
      <ScrollView
        style={s.container}
        contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: Platform.OS === "web" ? 120 : 100, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
      <View>
        <Text style={[s.pageTitle, { color: colors.foreground }]}>Training Drills</Text>
        <Text style={[s.pageSub, { color: colors.mutedForeground }]}>Personalized exercises from your match analyses</Text>
      </View>

      <View>
        <View style={s.statsRow}>
          <View style={[s.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.statNum, { color: colors.primary }]}>{active.length}</Text>
            <Text style={[s.statLabel, { color: colors.mutedForeground }]}>Active</Text>
          </View>
          <View style={[s.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.statNum, { color: colors.success }]}>{done.length}</Text>
            <Text style={[s.statLabel, { color: colors.mutedForeground }]}>Done</Text>
          </View>
          <View style={[s.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.statNum, { color: colors.foreground }]}>{allDrills.length}</Text>
            <Text style={[s.statLabel, { color: colors.mutedForeground }]}>Total</Text>
          </View>
        </View>
      </View>

      {allDrills.length === 0 ? (
        <View style={[s.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="boxing-glove" size={52} color={colors.mutedForeground} />
          <Text style={[s.emptyTitle, { color: colors.foreground }]}>No Drills Yet</Text>
          <Text style={[s.emptyText, { color: colors.mutedForeground }]}>Analyze a match to get personalized drill recommendations</Text>
        </View>
      ) : (
        <>
          {active.length > 0 && (
            <View>
              <View style={s.sectionHeader}>
                <Feather name="circle" size={16} color={colors.primary} />
                <Text style={[s.sectionTitle, { color: colors.foreground }]}>Active Drills</Text>
              </View>
              {active.map((drill, i) => (
                <View key={drill.id}>
                  <DrillCard drill={drill} onToggle={() => toggle(drill.sessionId, drill.id, true)} colors={colors} />
                </View>
              ))}
            </View>
          )}

          {done.length > 0 && (
            <View>
              <View style={s.sectionHeader}>
                <Feather name="check-circle" size={16} color={colors.success} />
                <Text style={[s.sectionTitle, { color: colors.foreground }]}>Completed</Text>
              </View>
              {done.map((drill, i) => (
                <View key={drill.id}>
                  <DrillCard drill={drill} onToggle={() => toggle(drill.sessionId, drill.id, false)} done colors={colors} />
                </View>
              ))}
            </View>
          )}
        </>
      )}
      </ScrollView>
    </View>
  );
}

function DrillCard({ drill, onToggle, done = false, colors }: { drill: DrillRecommendation & { sessionId: string }; onToggle: () => void; done?: boolean; colors: ReturnType<typeof useColors> }) {
  const catColor = CATEGORY_COLORS[drill.category] ?? "#6b7280";
  const diffColor = DIFFICULTY_COLORS[drill.difficulty] ?? colors.mutedForeground;
  return (
    <View style={[{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10, opacity: done ? 0.65 : 1 }]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={{ fontSize: 15, fontFamily: "Inter_600SemiBold", color: done ? colors.mutedForeground : colors.foreground, marginBottom: 4 }}>{drill.name}</Text>
          <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, lineHeight: 20, marginBottom: 10 }}>{drill.description}</Text>
          <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
            <Badge label={drill.category} color={catColor} />
            <Badge label={drill.difficulty} color={diffColor} />
            {drill.duration ? <Badge label={drill.duration} color={colors.mutedForeground} /> : null}
          </View>
          {drill.focus_area ? <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 6 }}>Focus: {drill.focus_area}</Text> : null}
          {drill.reps ? <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>Reps: {drill.reps}</Text> : null}
        </View>
        <TouchableOpacity
          onPress={onToggle}
          style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: done ? `${colors.success}20` : `${colors.primary}20`, alignItems: "center", justifyContent: "center" }}
          activeOpacity={0.7}
        >
          <Feather name={done ? "rotate-ccw" : "check"} size={16} color={done ? colors.success : colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: `${color}20`, borderWidth: 1, borderColor: `${color}40` }}>
      <Text style={{ fontSize: 11, fontFamily: "Inter_500Medium", color }}>{label}</Text>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    pageTitle: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 4 },
    pageSub: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 20 },
    statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
    statBox: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, alignItems: "center" },
    statNum: { fontSize: 26, fontFamily: "Inter_700Bold" },
    statLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
    sectionTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
    empty: { borderRadius: 20, borderWidth: 1, padding: 36, alignItems: "center", marginTop: 20 },
    emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginTop: 16, marginBottom: 8 },
    emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", color: "#888" },
  });
}
