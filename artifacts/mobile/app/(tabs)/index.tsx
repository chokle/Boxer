import React, { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useBoxing } from "@/context/BoxingContext";
import { StatCard } from "@/components/StatCard";
import { SessionCard } from "@/components/SessionCard";
import { PerformanceRing } from "@/components/PerformanceRing";

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sessions, getStats } = useBoxing();

  const stats = getStats();
  const recentSessions = sessions.slice(0, 3);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const styles = makeStyles(colors);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: topPad + 16,
          paddingBottom: bottomPad + 100,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400).delay(0)}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              Welcome back, Champ
            </Text>
            <Text style={[styles.title, { color: colors.foreground }]}>
              BoxCoach AI
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.logBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(tabs)/log")}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {stats.totalSessions > 0 ? (
        <>
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                  Overall Performance
                </Text>
                <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                  {stats.totalSessions} sessions
                </Text>
              </View>
              <View style={styles.ringRow}>
                <PerformanceRing
                  value={stats.avgScore}
                  label="Avg Score"
                  color={colors.primary}
                />
                <PerformanceRing
                  value={stats.avgStance}
                  label="Stance"
                  color={colors.success}
                />
                <PerformanceRing
                  value={stats.avgShots}
                  label="Shots"
                  color={colors.info}
                />
                <PerformanceRing
                  value={stats.avgFinish}
                  label="Finish"
                  color={colors.warning}
                />
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(200)}>
            <View style={styles.statsRow}>
              <StatCard
                icon="activity"
                label="Sessions"
                value={stats.totalSessions.toString()}
                color={colors.primary}
              />
              <StatCard
                icon="award"
                label="Best Score"
                value={stats.bestScore.toFixed(0)}
                color={colors.success}
              />
              <StatCard
                icon="trending-up"
                label="Streak"
                value={`${stats.streak}d`}
                color={colors.warning}
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(300)}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Recent Sessions
            </Text>
            {recentSessions.map((session, i) => (
              <Animated.View
                key={session.id}
                entering={FadeInRight.duration(350).delay(350 + i * 60)}
              >
                <SessionCard session={session} />
              </Animated.View>
            ))}
          </Animated.View>
        </>
      ) : (
        <Animated.View
          entering={FadeInDown.duration(500).delay(150)}
          style={[styles.emptyContainer, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <MaterialCommunityIcons
            name="boxing-glove"
            size={56}
            color={colors.primary}
          />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Start Your Journey
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Log your first boxing session to get AI-powered performance analysis
          </Text>
          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(tabs)/log")}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.startBtnText}>Log First Session</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    content: { paddingHorizontal: 20 },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 24,
    },
    greeting: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
    title: { fontSize: 28, fontFamily: "Inter_700Bold" },
    logBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    card: {
      borderRadius: 16,
      borderWidth: 1,
      padding: 16,
      marginBottom: 16,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    cardTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
    cardSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
    ringRow: {
      flexDirection: "row",
      justifyContent: "space-around",
    },
    statsRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: "Inter_600SemiBold",
      marginBottom: 12,
    },
    emptyContainer: {
      borderRadius: 20,
      borderWidth: 1,
      padding: 36,
      alignItems: "center",
      marginTop: 20,
    },
    emptyTitle: {
      fontSize: 22,
      fontFamily: "Inter_700Bold",
      marginTop: 16,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 24,
    },
    startBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 12,
    },
    startBtnText: {
      color: "#fff",
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
    },
  });
}
