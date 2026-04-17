import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

interface ScoreRingProps {
  score: number;
  size?: number;
  label?: string;
  color?: string;
}

export function ScoreRing({ score, size = 100, label, color }: ScoreRingProps) {
  const colors = useColors();
  const ringColor = color ?? colors.primary;
  const strokeWidth = size * 0.1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100) / 100;
  const dash = circumference * progress;
  const gap = circumference - dash;
  const center = size / 2;

  const scoreColor =
    score >= 80 ? colors.success :
    score >= 60 ? colors.warning :
    colors.primary;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={center} cy={center} r={radius}
          stroke={colors.muted} strokeWidth={strokeWidth}
          fill="none" strokeLinecap="round"
        />
        <Circle
          cx={center} cy={center} r={radius}
          stroke={ringColor} strokeWidth={strokeWidth}
          fill="none" strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
          strokeDashoffset={circumference * 0.25}
          rotation={-90}
          origin={`${center}, ${center}`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.score, { color: scoreColor, fontSize: size * 0.22 }]}>
          {Math.round(score)}
        </Text>
        {label && (
          <Text style={[styles.label, { color: colors.mutedForeground, fontSize: size * 0.1 }]}>
            {label}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  center: { position: "absolute", alignItems: "center", justifyContent: "center" },
  score: { fontFamily: "Inter_700Bold" },
  label: { fontFamily: "Inter_400Regular", textAlign: "center" },
});
