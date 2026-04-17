import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useBoxing } from "@/context/BoxingContext";
import { StatCard } from "@/components/StatCard";
import { SessionCard } from "@/components/SessionCard";
import { ScoreRing } from "@/components/ScoreRing";
import { PerformanceChart } from "@/components/PerformanceChart";

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sessions, getStats, profile } = useBoxing();
  const stats = getStats();
  const recent = sessions.slice(0, 3);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const s = makeStyles(colors);

  return (
    <ScrollView
      style={[s.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: Platform.OS === "web" ? 120 : 100, paddingHorizontal: 20 }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400)}>
        <View style={s.header}>
          <View>
            <Text style={[s.greeting, { color: colors.mutedForeground }]}>
              {profile ? `${profile.stance} · ${profile.experience_level}` : "Welcome back"}
            </Text>
            <Text style={[s.title, { color: colors.foreground }]}>Boxer AI</Text>
          </View>
          <TouchableOpacity
            style={[s.fab, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(tabs)/analyze")}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {stats.totalSessions > 0 ? (
        <>
          <Animated.View entering={FadeInDown.duration(400).delay(80)}>
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.ringRow}>
                <ScoreRing score={stats.avgScore} size={110} label="Overall" color={colors.primary} />
                <View style={s.miniStats}>
                  <View style={s.miniRow}>
                    <MiniBar label="Stance" value={stats.avgStance} color={colors.success} colors={colors} />
                    <MiniBar label="Offense" value={stats.avgOffense} color={colors.primary} colors={colors} />
                  </View>
                  <View style={s.miniRow}>
                    <MiniBar label="Defense" value={stats.avgDefense} color={colors.info} colors={colors} />
                    <MiniBar label="Footwork" value={stats.avgFootwork} color={colors.warning} colors={colors} />
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(160)}>
            <View style={s.statsRow}>
              <StatCard icon="layers" label="Sessions" value={`${stats.totalSessions}`} color={colors.primary} />
              <StatCard icon="award" label="Best" value={`${stats.bestScore}`} color={colors.success} />
              <StatCard icon="trending-up" label="Streak" value={`${stats.streak}d`} color={colors.warning} />
            </View>
          </Animated.View>

          {sessions.length >= 2 && (
            <Animated.View entering={FadeInDown.duration(400).delay(220)}>
              <PerformanceChart sessions={sessions} />
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.duration(400).delay(280)}>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>Recent Sessions</Text>
            {recent.map((session, i) => (
              <Animated.View key={session.id} entering={FadeInRight.duration(350).delay(300 + i * 60)}>
                <SessionCard session={session} onPress={() => router.push(`/session/${session.id}`)} />
              </Animated.View>
            ))}
          </Animated.View>
        </>
      ) : (
        <Animated.View entering={FadeInDown.duration(500).delay(120)} style={[s.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="boxing-glove" size={60} color={colors.primary} />
          <Text style={[s.emptyTitle, { color: colors.foreground }]}>Ready to Train?</Text>
          <Text style={[s.emptyText, { color: colors.mutedForeground }]}>
            Log your first match or session to get instant AI coaching analysis
          </Text>
          <TouchableOpacity style={[s.emptyBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/(tabs)/analyze")} activeOpacity={0.8}>
            <Feather name="zap" size={16} color="#fff" />
            <Text style={s.emptyBtnText}>Analyze First Match</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ScrollView>
  );
}

function MiniBar({ label, value, color, colors }: { label: string; value: number; color: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{label}</Text>
        <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.foreground }}>{value}</Text>
      </View>
      <View style={{ height: 4, backgroundColor: colors.muted, borderRadius: 2 }}>
        <View style={{ height: 4, width: `${value}%`, backgroundColor: color, borderRadius: 2 }} />
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
    greeting: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
    title: { fontSize: 30, fontFamily: "Inter_700Bold" },
    fab: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
    card: { borderRadius: 18, borderWidth: 1, padding: 18, marginBottom: 16 },
    ringRow: { flexDirection: "row", alignItems: "center", gap: 18 },
    miniStats: { flex: 1, gap: 10 },
    miniRow: { flexDirection: "row", gap: 12 },
    statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
    empty: { borderRadius: 20, borderWidth: 1, padding: 36, alignItems: "center", marginTop: 24 },
    emptyTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginTop: 20, marginBottom: 10 },
    emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22, marginBottom: 28 },
    emptyBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 26, paddingVertical: 14, borderRadius: 12 },
    emptyBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  });
}
