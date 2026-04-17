import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Polyline, Circle, Line, Text as SvgText } from "react-native-svg";
import { useColors } from "@/hooks/useColors";
import type { MatchSession } from "@/types";

const W = Dimensions.get("window").width - 40 - 32;
const H = 110;
const PAD = { top: 12, right: 12, bottom: 24, left: 28 };

function toPoints(values: number[]): string {
  const w = W - PAD.left - PAD.right;
  const h = H - PAD.top - PAD.bottom;
  return values
    .map((v, i) => {
      const x = PAD.left + (i / (values.length - 1)) * w;
      const y = PAD.top + (1 - v / 100) * h;
      return `${x},${y}`;
    })
    .join(" ");
}

interface PerformanceChartProps {
  sessions: MatchSession[];
}

export function PerformanceChart({ sessions }: PerformanceChartProps) {
  const colors = useColors();
  const ordered = [...sessions].reverse().slice(-8);
  const scores = ordered.map(s => s.analysis.overall_score);
  const points = toPoints(scores);

  const lines = [0, 25, 50, 75, 100];

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>Score Trend</Text>
      <Svg width={W} height={H}>
        {lines.map(l => {
          const y = PAD.top + (1 - l / 100) * (H - PAD.top - PAD.bottom);
          return (
            <React.Fragment key={l}>
              <Line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke={colors.border} strokeWidth={1} />
              <SvgText x={PAD.left - 4} y={y + 4} fontSize={9} fill={colors.mutedForeground} textAnchor="end">{l}</SvgText>
            </React.Fragment>
          );
        })}
        <Polyline points={points} fill="none" stroke={colors.primary} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {scores.map((score, i) => {
          const w = W - PAD.left - PAD.right;
          const h = H - PAD.top - PAD.bottom;
          const x = PAD.left + (i / (scores.length - 1)) * w;
          const y = PAD.top + (1 - score / 100) * h;
          return <Circle key={i} cx={x} cy={y} r={4} fill={colors.primary} stroke={colors.card} strokeWidth={2} />;
        })}
      </Svg>
      <View style={styles.labels}>
        {ordered.map((s, i) => (
          <Text key={i} style={[styles.label, { color: colors.mutedForeground }]} numberOfLines={1}>
            {new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  title: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 10 },
  labels: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: PAD.left - 4 },
  label: { fontSize: 9, fontFamily: "Inter_400Regular", flex: 1, textAlign: "center" },
});
