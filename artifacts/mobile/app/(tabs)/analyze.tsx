import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Platform, ActivityIndicator, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useBoxing } from "@/context/BoxingContext";
import { analyzeMatch } from "@/lib/aiCoach";

const MATCH_CONTEXTS = ["training", "sparring", "amateur", "pro"] as const;
const OPPONENT_STYLES = ["balanced", "aggressive", "defensive", "counter", "brawler"] as const;

export default function AnalyzeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addSession, profile } = useBoxing();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [matchContext, setMatchContext] = useState<typeof MATCH_CONTEXTS[number]>("sparring");
  const [opponentStyle, setOpponentStyle] = useState<typeof OPPONENT_STYLES[number]>("balanced");
  const [matchDescription, setMatchDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [step, setStep] = useState<"form" | "analyzing" | "done">("form");
  const [newSessionId, setNewSessionId] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const s = makeStyles(colors);

  const handleAnalyze = async () => {
    if (!title.trim()) { Alert.alert("Required", "Please enter a session title"); return; }
    if (!matchDescription.trim()) { Alert.alert("Required", "Please describe what happened in the match"); return; }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAnalyzing(true);
    setStep("analyzing");

    try {
      const boxerProfile = profile ?? {
        name: "Boxer", weight_class: "Middleweight",
        experience_level: "Intermediate" as const, stance: "Orthodox" as const,
        age: null, reach_inches: null,
      };

      const analysis = await analyzeMatch({
        title: title.trim(),
        description: description.trim(),
        match_context: matchContext,
        opponent_style: opponentStyle,
        match_description: matchDescription.trim(),
        boxer_profile: boxerProfile,
      });

      const sessionId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      await addSession({
        id: sessionId,
        title: title.trim(),
        description: description.trim(),
        match_context: matchContext,
        opponent_style: opponentStyle,
        analysis,
        date: new Date().toISOString(),
      });

      setNewSessionId(sessionId);
      setStep("done");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Analysis failed";
      Alert.alert("Error", msg);
      setStep("form");
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setTitle(""); setDescription(""); setMatchContext("sparring");
    setOpponentStyle("balanced"); setMatchDescription(""); setStep("form"); setNewSessionId(null);
  };

  if (step === "analyzing") {
    return (
      <View style={[s.centeredScreen, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <View style={[s.analyzeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[s.analyzeTitle, { color: colors.foreground }]}>Analyzing Your Match</Text>
          <Text style={[s.analyzeSub, { color: colors.mutedForeground }]}>
            Your AI coach is reviewing the performance...
          </Text>
          {["Evaluating stance & footwork", "Scoring offensive combinations", "Assessing defensive technique", "Generating personalized drills"].map((t, i) => (
            <View key={i} style={s.analyzeStep}>
              <View style={[s.dot, { backgroundColor: colors.primary }]} />
              <Text style={[s.analyzeStepText, { color: colors.mutedForeground }]}>{t}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (step === "done" && newSessionId) {
    return (
      <View style={[s.centeredScreen, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <View style={[s.analyzeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[s.successIcon, { backgroundColor: `${colors.success}20`, borderColor: `${colors.success}40` }]}>
            <Feather name="check-circle" size={36} color={colors.success} />
          </View>
          <Text style={[s.analyzeTitle, { color: colors.foreground }]}>Analysis Complete</Text>
          <Text style={[s.analyzeSub, { color: colors.mutedForeground }]}>
            Your performance analysis and personalized drills are ready.
          </Text>
          <TouchableOpacity
            style={[s.bigBtn, { backgroundColor: colors.primary }]}
            onPress={() => { router.push(`/session/${newSessionId}`); reset(); }}
            activeOpacity={0.8}
          >
            <Text style={s.bigBtnText}>View Full Analysis</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.bigBtn, { backgroundColor: colors.muted, marginTop: 10 }]} onPress={reset} activeOpacity={0.8}>
            <Text style={[s.bigBtnText, { color: colors.mutedForeground }]}>Analyze Another</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[s.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: Platform.OS === "web" ? 120 : 100, paddingHorizontal: 20 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text style={[s.pageTitle, { color: colors.foreground }]}>Analyze Match</Text>
        <Text style={[s.pageSub, { color: colors.mutedForeground }]}>Describe your match for instant AI coaching feedback</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(80)}>
        <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Label text="SESSION TITLE" colors={colors} />
          <TextInput
            style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
            placeholder="e.g. Sparring with Coach Martinez"
            placeholderTextColor={colors.mutedForeground}
            value={title} onChangeText={setTitle}
          />

          <Label text="DESCRIPTION (OPTIONAL)" colors={colors} style={{ marginTop: 14 }} />
          <TextInput
            style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
            placeholder="Brief context about the session"
            placeholderTextColor={colors.mutedForeground}
            value={description} onChangeText={setDescription}
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(160)}>
        <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Label text="MATCH TYPE" colors={colors} />
          <View style={s.chipRow}>
            {MATCH_CONTEXTS.map(c => (
              <TouchableOpacity
                key={c}
                style={[s.chip, { backgroundColor: matchContext === c ? colors.primary : colors.muted, borderColor: matchContext === c ? colors.primary : colors.border }]}
                onPress={() => { setMatchContext(c); Haptics.selectionAsync(); }}
              >
                <Text style={[s.chipText, { color: matchContext === c ? "#fff" : colors.mutedForeground }]}>{c.charAt(0).toUpperCase() + c.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Label text="OPPONENT STYLE" colors={colors} style={{ marginTop: 16 }} />
          <View style={s.chipRow}>
            {OPPONENT_STYLES.map(o => (
              <TouchableOpacity
                key={o}
                style={[s.chip, { backgroundColor: opponentStyle === o ? colors.primary : colors.muted, borderColor: opponentStyle === o ? colors.primary : colors.border }]}
                onPress={() => { setOpponentStyle(o); Haptics.selectionAsync(); }}
              >
                <Text style={[s.chipText, { color: opponentStyle === o ? "#fff" : colors.mutedForeground }]}>{o.charAt(0).toUpperCase() + o.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(240)}>
        <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Label text="MATCH SUMMARY" colors={colors} />
          <Text style={[s.hint, { color: colors.mutedForeground }]}>Describe key moments, your stance, combinations, defense, footwork</Text>
          <TextInput
            style={[s.textarea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
            placeholder="What happened? What went well? What challenges did you face? Be specific about techniques used..."
            placeholderTextColor={colors.mutedForeground}
            value={matchDescription} onChangeText={setMatchDescription}
            multiline numberOfLines={6} textAlignVertical="top"
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(320)}>
        <TouchableOpacity
          style={[s.analyzeBtn, { backgroundColor: analyzing ? colors.muted : colors.primary }]}
          onPress={handleAnalyze} disabled={analyzing} activeOpacity={0.8}
        >
          <Feather name="zap" size={18} color={analyzing ? colors.mutedForeground : "#fff"} />
          <Text style={[s.analyzeBtnText, { color: analyzing ? colors.mutedForeground : "#fff" }]}>
            Analyze with AI
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

function Label({ text, colors, style }: { text: string; colors: ReturnType<typeof useColors>; style?: object }) {
  return <Text style={[{ fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, color: colors.mutedForeground, marginBottom: 8 }, style]}>{text}</Text>;
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    centeredScreen: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
    pageTitle: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 4 },
    pageSub: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 24 },
    section: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 14 },
    input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
    hint: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 10 },
    textarea: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 120 },
    analyzeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 14, marginBottom: 8 },
    analyzeBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
    analyzeCard: { borderRadius: 20, borderWidth: 1, padding: 28, alignItems: "center", width: "100%" },
    analyzeTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginTop: 20, marginBottom: 8, textAlign: "center" },
    analyzeSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 20 },
    analyzeStep: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 4 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    analyzeStepText: { fontSize: 13, fontFamily: "Inter_400Regular" },
    successIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", borderWidth: 1, marginBottom: 4 },
    bigBtn: { width: "100%", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
    bigBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  });
}
