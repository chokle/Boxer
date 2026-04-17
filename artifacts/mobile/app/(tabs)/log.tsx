import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useBoxing } from "@/context/BoxingContext";
import { ScoreSlider } from "@/components/ScoreSlider";
import { TagSelector } from "@/components/TagSelector";
import { analyzeSession } from "@/lib/aiCoach";

const STANCE_OPTIONS = ["Orthodox", "Southpaw", "Switch"];
const SHOT_TAGS = ["Jab", "Cross", "Hook", "Uppercut", "Body Shot", "Overhand", "Counter"];
const FINISH_TAGS = ["KO", "TKO", "Decision", "Points Win", "Submission Defense", "Strong Finish", "Weak Finish"];

export default function LogScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addSession } = useBoxing();

  const [opponent, setOpponent] = useState("");
  const [stance, setStance] = useState("Orthodox");
  const [rounds, setRounds] = useState("3");
  const [stanceScore, setStanceScore] = useState(70);
  const [shotsScore, setShotsScore] = useState(70);
  const [finishScore, setFinishScore] = useState(70);
  const [selectedShots, setSelectedShots] = useState<string[]>([]);
  const [selectedFinish, setSelectedFinish] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const overallScore = Math.round((stanceScore + shotsScore + finishScore) / 3);

  const styles = makeStyles(colors);

  const handleSubmit = async () => {
    if (!opponent.trim()) {
      Alert.alert("Required", "Please enter opponent or session name");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAnalyzing(true);
    try {
      const analysis = await analyzeSession({
        opponent: opponent.trim(),
        stance,
        rounds: parseInt(rounds) || 3,
        stanceScore,
        shotsScore,
        finishScore,
        shots: selectedShots,
        finishes: selectedFinish,
        notes,
      });

      addSession({
        opponent: opponent.trim(),
        stance,
        rounds: parseInt(rounds) || 3,
        stanceScore,
        shotsScore,
        finishScore,
        overallScore,
        shots: selectedShots,
        finishes: selectedFinish,
        notes,
        analysis,
        date: new Date().toISOString(),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setOpponent("");
      setStance("Orthodox");
      setRounds("3");
      setStanceScore(70);
      setShotsScore(70);
      setFinishScore(70);
      setSelectedShots([]);
      setSelectedFinish([]);
      setNotes("");
      Alert.alert("Session Logged!", "AI analysis complete. Check your dashboard.");
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to analyze session. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 16, paddingBottom: bottomPad + 100 },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Log Session</Text>
        <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>
          Enter your match details for AI analysis
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(80)}>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>OPPONENT / SESSION</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
            placeholder="e.g. John Smith, Sparring Day"
            placeholderTextColor={colors.mutedForeground}
            value={opponent}
            onChangeText={setOpponent}
          />

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 16 }]}>ROUNDS</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
            placeholder="3"
            placeholderTextColor={colors.mutedForeground}
            value={rounds}
            onChangeText={setRounds}
            keyboardType="number-pad"
            maxLength={2}
          />

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 16 }]}>STANCE</Text>
          <View style={styles.stanceRow}>
            {STANCE_OPTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.stanceBtn,
                  {
                    backgroundColor: stance === s ? colors.primary : colors.muted,
                    borderColor: stance === s ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  setStance(s);
                  Haptics.selectionAsync();
                }}
              >
                <Text
                  style={[
                    styles.stanceBtnText,
                    { color: stance === s ? "#fff" : colors.mutedForeground },
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(160)}>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.scoreHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Performance Scores</Text>
            <View style={[styles.overallBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.overallBadgeText}>{overallScore}</Text>
            </View>
          </View>
          <ScoreSlider
            label="Stance & Footwork"
            value={stanceScore}
            onChange={setStanceScore}
            color={colors.success}
          />
          <ScoreSlider
            label="Shot Selection"
            value={shotsScore}
            onChange={setShotsScore}
            color={colors.info}
          />
          <ScoreSlider
            label="Finishing"
            value={finishScore}
            onChange={setFinishScore}
            color={colors.warning}
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(240)}>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Shots Used</Text>
          <TagSelector
            tags={SHOT_TAGS}
            selected={selectedShots}
            onToggle={(tag) => {
              Haptics.selectionAsync();
              setSelectedShots((prev) =>
                prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
              );
            }}
            activeColor={colors.primary}
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(320)}>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Finish / Result</Text>
          <TagSelector
            tags={FINISH_TAGS}
            selected={selectedFinish}
            onToggle={(tag) => {
              Haptics.selectionAsync();
              setSelectedFinish((prev) =>
                prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
              );
            }}
            activeColor={colors.accent}
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(400)}>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Notes</Text>
          <TextInput
            style={[
              styles.notesInput,
              {
                color: colors.foreground,
                borderColor: colors.border,
                backgroundColor: colors.muted,
              },
            ]}
            placeholder="What happened in the match? Key moments, tactics..."
            placeholderTextColor={colors.mutedForeground}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(480)}>
        <TouchableOpacity
          style={[
            styles.submitBtn,
            { backgroundColor: analyzing ? colors.muted : colors.primary },
          ]}
          onPress={handleSubmit}
          disabled={analyzing}
          activeOpacity={0.8}
        >
          {analyzing ? (
            <>
              <ActivityIndicator color={colors.mutedForeground} size="small" />
              <Text style={[styles.submitBtnText, { color: colors.mutedForeground }]}>
                Analyzing with AI...
              </Text>
            </>
          ) : (
            <>
              <Feather name="zap" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>Analyze Session</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    content: { paddingHorizontal: 20 },
    pageTitle: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 4 },
    pageSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 24 },
    section: {
      borderRadius: 16,
      borderWidth: 1,
      padding: 16,
      marginBottom: 16,
    },
    sectionLabel: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      letterSpacing: 1,
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      marginBottom: 12,
    },
    scoreHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    overallBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 20,
    },
    overallBadgeText: {
      color: "#fff",
      fontSize: 14,
      fontFamily: "Inter_700Bold",
    },
    input: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
    },
    stanceRow: { flexDirection: "row", gap: 8 },
    stanceBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: "center",
    },
    stanceBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
    notesInput: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      minHeight: 100,
    },
    submitBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 16,
      borderRadius: 14,
      marginBottom: 8,
    },
    submitBtnText: {
      color: "#fff",
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
    },
  });
}
