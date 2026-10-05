import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView,
  TextInput, Platform, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import type { TimerSession } from "@/types";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface WorkoutTimerProps {
  visible: boolean;
  onClose: () => void;
  onSaveSession?: (session: TimerSession) => void;
}

const PRESETS = [
  { name: "Amateur (3x3)", rounds: 3, roundDuration: 180, restDuration: 60 },
  { name: "Pro (12x3)", rounds: 12, roundDuration: 180, restDuration: 60 },
  { name: "HIIT (8x1)", rounds: 8, roundDuration: 60, restDuration: 30 },
  { name: "Endurance (5x5)", rounds: 5, roundDuration: 300, restDuration: 90 },
];

export default function WorkoutTimer({ visible, onClose, onSaveSession }: WorkoutTimerProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const s = makeStyles(colors, insets);

  // Timer state
  const [phase, setPhase] = useState<"setup" | "running" | "paused" | "complete">("setup");
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(3);
  const [roundDuration, setRoundDuration] = useState(180);
  const [restDuration, setRestDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(180);
  const [isRest, setIsRest] = useState(false);
  const [totalSecondsElapsed, setTotalSecondsElapsed] = useState(0);

  // Animation
  const progress = useSharedValue(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Load bell sound
  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(
          require("../assets/sounds/bell.wav")
        );
        soundRef.current = sound;
      } catch (e) {
        console.log("Could not load bell sound (file may not exist yet):", e);
        // Audio is optional - timer will work with haptics only
      }
    })();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const playBell = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.replayAsync();
      } catch (e) {
        console.log("Could not play bell:", e);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getCurrentDuration = () => (isRest ? restDuration : roundDuration);

  const startTimer = () => {
    setPhase("running");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    playBell();
  };

  const pauseTimer = () => {
    setPhase("paused");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const resumeTimer = () => {
    setPhase("running");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPhase("setup");
    setCurrentRound(1);
    setTimeLeft(roundDuration);
    setIsRest(false);
    setTotalSecondsElapsed(0);
    progress.value = 1;
  };

  const completeSession = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const session: TimerSession = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      date: new Date().toISOString(),
      roundsCompleted: currentRound - 1,
      totalSeconds: totalSecondsElapsed,
      roundDuration,
      restDuration,
    };

    if (onSaveSession) {
      onSaveSession(session);
    }

    setPhase("complete");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Timer tick
  useEffect(() => {
    if (phase !== "running") return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        setTotalSecondsElapsed((s) => s + 1);

        // Update progress animation
        const duration = getCurrentDuration();
        progress.value = withTiming(newTime / duration, {
          duration: 1000,
          easing: Easing.linear,
        });

        // Play countdown at 10, 5, 3, 2, 1
        if ([10, 5, 3, 2, 1].includes(newTime)) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        // End of round or rest
        if (newTime <= 0) {
          if (isRest) {
            // Rest over, start next round
            if (currentRound < totalRounds) {
              setCurrentRound((r) => r + 1);
              setIsRest(false);
              setTimeLeft(roundDuration);
              playBell();
              return roundDuration;
            } else {
              // All rounds complete
              runOnJS(completeSession)();
              return 0;
            }
          } else {
            // Round over, start rest
            setIsRest(true);
            setTimeLeft(restDuration);
            playBell();
            return restDuration;
          }
        }

        return newTime;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [phase, isRest, roundDuration, restDuration, currentRound, totalRounds]);

  // Reset when config changes
  useEffect(() => {
    if (phase === "setup") {
      setTimeLeft(roundDuration);
      progress.value = 1;
    }
  }, [roundDuration, phase]);

  const animatedProps = useAnimatedProps(() => {
    const circumference = 2 * Math.PI * 140;
    const dash = circumference * progress.value;
    const gap = circumference - dash;
    return {
      strokeDasharray: `${dash} ${gap}`,
      strokeDashoffset: circumference * 0.25,
    };
  });

  if (phase === "setup") {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <View style={[s.modal, { backgroundColor: colors.background, paddingTop: insets.top }]}>
          <View style={[s.header, { borderColor: colors.border }]}>
            <Text style={[s.title, { color: colors.foreground }]}>Workout Timer</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
            <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>PRESETS</Text>
            <View style={s.presetGrid}>
              {PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.name}
                  style={[
                    s.presetCard,
                    {
                      backgroundColor: colors.card,
                      borderColor:
                        totalRounds === preset.rounds &&
                        roundDuration === preset.roundDuration &&
                        restDuration === preset.restDuration
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                  onPress={() => {
                    setTotalRounds(preset.rounds);
                    setRoundDuration(preset.roundDuration);
                    setRestDuration(preset.restDuration);
                    Haptics.selectionAsync();
                  }}
                >
                  <Text style={[s.presetName, { color: colors.foreground }]}>{preset.name}</Text>
                  <Text style={[s.presetDetails, { color: colors.mutedForeground }]}>
                    {preset.rounds} × {formatTime(preset.roundDuration)} / {formatTime(preset.restDuration)} rest
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[s.sectionLabel, { color: colors.mutedForeground, marginTop: 24 }]}>CUSTOM</Text>
            <View style={[s.customSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.inputRow}>
                <Text style={[s.inputLabel, { color: colors.foreground }]}>Rounds</Text>
                <TextInput
                  style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
                  value={totalRounds.toString()}
                  onChangeText={(t) => setTotalRounds(Math.max(1, parseInt(t) || 1))}
                  keyboardType="number-pad"
                />
              </View>
              <View style={s.inputRow}>
                <Text style={[s.inputLabel, { color: colors.foreground }]}>Round (sec)</Text>
                <TextInput
                  style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
                  value={roundDuration.toString()}
                  onChangeText={(t) => setRoundDuration(Math.max(10, parseInt(t) || 10))}
                  keyboardType="number-pad"
                />
              </View>
              <View style={s.inputRow}>
                <Text style={[s.inputLabel, { color: colors.foreground }]}>Rest (sec)</Text>
                <TextInput
                  style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
                  value={restDuration.toString()}
                  onChangeText={(t) => setRestDuration(Math.max(5, parseInt(t) || 5))}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[s.startBtn, { backgroundColor: colors.primary }]}
              onPress={startTimer}
              activeOpacity={0.8}
            >
              <Feather name="play" size={20} color="#fff" />
              <Text style={s.startBtnText}>Start Workout</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    );
  }

  if (phase === "complete") {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <View style={[s.modal, { backgroundColor: colors.background, paddingTop: insets.top }]}>
          <View style={[s.header, { borderColor: colors.border }]}>
            <Text style={[s.title, { color: colors.foreground }]}>Workout Complete</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <View style={[s.completeContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[s.successIcon, { backgroundColor: `${colors.success}20`, borderColor: `${colors.success}40` }]}>
              <Feather name="check-circle" size={48} color={colors.success} />
            </View>
            <Text style={[s.completeTitle, { color: colors.foreground }]}>Great Work!</Text>
            <Text style={[s.completeSub, { color: colors.mutedForeground }]}>
              You completed {currentRound - 1} rounds in {formatTime(totalSecondsElapsed)}
            </Text>

            <View style={s.statsRow}>
              <View style={s.statItem}>
                <Text style={[s.statValue, { color: colors.primary }]}>{currentRound - 1}</Text>
                <Text style={[s.statLabel, { color: colors.mutedForeground }]}>Rounds</Text>
              </View>
              <View style={[s.divider, { backgroundColor: colors.border }]} />
              <View style={s.statItem}>
                <Text style={[s.statValue, { color: colors.success }]}>{formatTime(totalSecondsElapsed)}</Text>
                <Text style={[s.statLabel, { color: colors.mutedForeground }]}>Total Time</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[s.doneBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                stopTimer();
                onClose();
              }}
              activeOpacity={0.8}
            >
              <Text style={s.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Running/paused state
  const circumference = 2 * Math.PI * 140;
  const center = 160;
  const radius = 140;
  const strokeWidth = 12;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => {
      if (phase === "running") {
        Alert.alert("Stop Timer?", "Are you sure you want to stop this workout?", [
          { text: "Cancel", style: "cancel" },
          { text: "Stop", style: "destructive", onPress: stopTimer },
        ]);
      } else {
        onClose();
      }
    }}>
      <View style={[s.modal, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[s.header, { borderColor: colors.border }]}>
          <TouchableOpacity onPress={() => {
            if (phase === "running") {
              Alert.alert("Stop Timer?", "Are you sure you want to stop this workout?", [
                { text: "Cancel", style: "cancel" },
                { text: "Stop", style: "destructive", onPress: stopTimer },
              ]);
            } else {
              stopTimer();
              onClose();
            }
          }}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
          <Text style={[s.title, { color: colors.foreground }]}>
            Round {currentRound}/{totalRounds}
          </Text>
          <View style={{ width: 22 }} />
        </View>

        <View style={s.timerContainer}>
          <Svg width={320} height={320}>
            <Circle
              cx={center} cy={center} r={radius}
              stroke={colors.muted} strokeWidth={strokeWidth}
              fill="none" strokeLinecap="round"
            />
            <AnimatedCircle
              cx={center} cy={center} r={radius}
              stroke={isRest ? colors.success : colors.primary}
              strokeWidth={strokeWidth}
              fill="none" strokeLinecap="round"
              animatedProps={animatedProps}
              rotation={-90}
              origin={`${center}, ${center}`}
            />
          </Svg>

          <View style={s.timerCenter}>
            <Text style={[s.phaseLabel, { color: isRest ? colors.success : colors.primary }]}>
              {isRest ? "REST" : "ROUND"}
            </Text>
            <Text style={[s.timeDisplay, { color: colors.foreground }]}>{formatTime(timeLeft)}</Text>
            <Text style={[s.durationLabel, { color: colors.mutedForeground }]}>
              {formatTime(getCurrentDuration())}
            </Text>
          </View>
        </View>

        <View style={s.controls}>
          {phase === "running" ? (
            <TouchableOpacity
              style={[s.controlBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
              onPress={pauseTimer}
              activeOpacity={0.8}
            >
              <Feather name="pause" size={24} color={colors.foreground} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.controlBtn, { backgroundColor: colors.primary }]}
              onPress={resumeTimer}
              activeOpacity={0.8}
            >
              <Feather name="play" size={24} color="#fff" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[s.controlBtn, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}40` }]}
            onPress={() => {
              Alert.alert("Stop Timer?", "Are you sure you want to stop this workout?", [
                { text: "Cancel", style: "cancel" },
                { text: "Stop", style: "destructive", onPress: stopTimer },
              ]);
            }}
            activeOpacity={0.8}
          >
            <Feather name="square" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, insets: ReturnType<typeof useSafeAreaInsets>) {
  return StyleSheet.create({
    modal: { flex: 1 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
    },
    title: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
    sectionLabel: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      letterSpacing: 0.8,
      marginBottom: 12,
    },
    presetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    presetCard: {
      flex: 1,
      minWidth: "45%",
      borderRadius: 12,
      borderWidth: 1,
      padding: 14,
    },
    presetName: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
    presetDetails: { fontSize: 12, fontFamily: "Inter_400Regular" },
    customSection: {
      borderRadius: 14,
      borderWidth: 1,
      padding: 16,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    inputLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
    input: {
      width: 80,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
    },
    startBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 16,
      borderRadius: 14,
      marginTop: 24,
    },
    startBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
    timerContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    timerCenter: {
      position: "absolute",
      alignItems: "center",
      justifyContent: "center",
    },
    phaseLabel: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      letterSpacing: 2,
      marginBottom: 8,
    },
    timeDisplay: {
      fontSize: 64,
      fontFamily: "Inter_700Bold",
      lineHeight: 72,
    },
    durationLabel: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      marginTop: 4,
    },
    controls: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 20,
      paddingBottom: Platform.OS === "web" ? 40 : insets.bottom + 20,
      paddingHorizontal: 20,
    },
    controlBtn: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },
    completeContainer: {
      margin: 20,
      borderRadius: 20,
      borderWidth: 1,
      padding: 32,
      alignItems: "center",
    },
    successIcon: {
      width: 96,
      height: 96,
      borderRadius: 48,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      marginBottom: 16,
    },
    completeTitle: {
      fontSize: 24,
      fontFamily: "Inter_700Bold",
      marginBottom: 8,
    },
    completeSub: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      marginBottom: 24,
    },
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 24,
      marginBottom: 32,
    },
    statItem: { alignItems: "center" },
    statValue: {
      fontSize: 32,
      fontFamily: "Inter_700Bold",
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
    },
    divider: { width: 1, height: 40 },
    doneBtn: {
      width: "100%",
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: "center",
    },
    doneBtnText: {
      color: "#fff",
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
    },
  });
}
