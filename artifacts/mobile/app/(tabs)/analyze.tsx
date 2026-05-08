import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Platform, ActivityIndicator, Alert, Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useBoxing } from "@/context/BoxingContext";
import { analyzeMatch } from "@/lib/aiCoach";
import { TabBgImage, TAB_BG_IMAGES } from "@/components/TabBgImage";

const MATCH_CONTEXTS = ["training", "sparring", "amateur", "pro"] as const;
const OPPONENT_STYLES = ["balanced", "aggressive", "defensive", "counter", "brawler"] as const;
const MAX_MEDIA = 5;

interface MediaItem {
  uri: string;
  type: "image" | "video";
  base64?: string;
}

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
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const s = makeStyles(colors);

  const requestPermissions = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library to attach media.",
        [{ text: "OK" }]
      );
      return false;
    }
    return true;
  };

  const pickMedia = async () => {
    if (selectedMedia.length >= MAX_MEDIA) {
      Alert.alert("Limit Reached", `You can attach up to ${MAX_MEDIA} photos or videos.`);
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const remaining = MAX_MEDIA - selectedMedia.length;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.6,
      base64: true,
      orderedSelection: true,
    });

    if (result.canceled) return;

    const newItems: MediaItem[] = result.assets.map((asset) => ({
      uri: asset.uri,
      type: asset.type === "video" ? "video" : "image",
      base64: asset.base64 ?? undefined,
    }));

    setSelectedMedia((prev) => [...prev, ...newItems].slice(0, MAX_MEDIA));
    Haptics.selectionAsync();
  };

  const removeMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
    Haptics.selectionAsync();
  };

  const handleAnalyze = async () => {
    if (!title.trim()) { Alert.alert("Required", "Please enter a session title"); return; }
    if (!matchDescription.trim() && selectedMedia.length === 0) {
      Alert.alert("Required", "Please add a match summary or upload at least one photo/video for AI analysis");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAnalyzing(true);
    setStep("analyzing");

    try {
      const boxerProfile = profile ?? {
        name: "Boxer", weight_class: "Middleweight",
        experience_level: "Intermediate" as const, stance: "Orthodox" as const,
        age: null, reach_inches: null, weight_kg: null, height_cm: null, injuries: [],
      };

      const images = selectedMedia
        .filter((m) => m.type === "image" && m.base64)
        .map((m) => m.base64!);

      const hasVideo = selectedMedia.some((m) => m.type === "video");

      const analysis = await analyzeMatch({
        title: title.trim(),
        description: description.trim(),
        match_context: matchContext,
        opponent_style: opponentStyle,
        match_description: matchDescription.trim(),
        boxer_profile: boxerProfile,
        images: images.length > 0 ? images : undefined,
        has_video: hasVideo || undefined,
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
    setOpponentStyle("balanced"); setMatchDescription("");
    setSelectedMedia([]); setStep("form"); setNewSessionId(null);
  };

  if (step === "analyzing") {
    const steps = [
      "Evaluating stance & footwork",
      "Scoring offensive combinations",
      "Assessing defensive technique",
      selectedMedia.length > 0 ? "Analyzing uploaded media" : "Reviewing session notes",
      "Generating personalized drills",
    ];
    return (
      <View style={[s.centeredScreen, { paddingTop: topPad }]}>
        <View style={[s.analyzeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[s.analyzeTitle, { color: colors.foreground }]}>Analyzing Your Match</Text>
          <Text style={[s.analyzeSub, { color: colors.mutedForeground }]}>
            Your AI coach is reviewing the performance...
          </Text>
          {steps.map((t, i) => (
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
      <View style={[s.centeredScreen, { paddingTop: topPad }]}>
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
    <View style={{ flex: 1 }}>
      <TabBgImage uri={TAB_BG_IMAGES.analyze} />
      <ScrollView
        style={s.container}
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Label text="MATCH SUMMARY" colors={colors} style={{ marginBottom: 0 }} />
            <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>(optional if media uploaded)</Text>
          </View>
          <Text style={[s.hint, { color: colors.mutedForeground }]}>Describe key moments, your stance, combinations, defense, footwork — or skip and let AI analyze your media</Text>
          <TextInput
            style={[s.textarea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
            placeholder="What happened? What went well? What challenges did you face? Be specific about techniques used..."
            placeholderTextColor={colors.mutedForeground}
            value={matchDescription} onChangeText={setMatchDescription}
            multiline numberOfLines={6} textAlignVertical="top"
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(300)}>
        <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.mediaHeader}>
            <Label text="PHOTOS & VIDEOS" colors={colors} style={{ marginBottom: 0 }} />
            {selectedMedia.length > 0 && (
              <Text style={[s.mediaCount, { color: colors.mutedForeground }]}>
                {selectedMedia.length}/{MAX_MEDIA}
              </Text>
            )}
          </View>
          <Text style={[s.hint, { color: colors.mutedForeground }]}>
            Attach photos or videos so your AI coach can analyze your visual technique
          </Text>

          {selectedMedia.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.mediaScroll} contentContainerStyle={s.mediaScrollContent}>
              {selectedMedia.map((item, index) => (
                <View key={index} style={s.mediaThumbnailWrap}>
                  {item.type === "image" ? (
                    <Image source={{ uri: item.uri }} style={s.mediaThumbnail} resizeMode="cover" />
                  ) : (
                    <View style={[s.mediaThumbnail, s.videoThumb, { backgroundColor: colors.muted }]}>
                      <Feather name="video" size={26} color={colors.primary} />
                      <Text style={[s.videoLabel, { color: colors.mutedForeground }]}>Video</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={[s.removeBtn, { backgroundColor: colors.background }]}
                    onPress={() => removeMedia(index)}
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  >
                    <Feather name="x" size={11} color={colors.foreground} />
                  </TouchableOpacity>
                  {item.type === "video" && (
                    <View style={[s.videoTag, { backgroundColor: colors.primary }]}>
                      <Feather name="play" size={8} color="#fff" />
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          )}

          {selectedMedia.length < MAX_MEDIA && (
            <TouchableOpacity
              style={[s.addMediaBtn, { borderColor: colors.border, backgroundColor: colors.muted }]}
              onPress={pickMedia}
              activeOpacity={0.7}
            >
              <Feather name="plus-circle" size={18} color={colors.primary} />
              <Text style={[s.addMediaText, { color: colors.primary }]}>
                {selectedMedia.length === 0 ? "Add Photos or Videos" : "Add More"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(380)}>
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
    </View>
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
    mediaHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
    mediaCount: { fontSize: 12, fontFamily: "Inter_400Regular" },
    mediaScroll: { marginBottom: 12 },
    mediaScrollContent: { gap: 10, paddingRight: 4 },
    mediaThumbnailWrap: { position: "relative", width: 90, height: 90 },
    mediaThumbnail: { width: 90, height: 90, borderRadius: 10 },
    videoThumb: { alignItems: "center", justifyContent: "center", gap: 4 },
    videoLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
    removeBtn: {
      position: "absolute", top: -6, right: -6,
      width: 20, height: 20, borderRadius: 10,
      alignItems: "center", justifyContent: "center",
      shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
      elevation: 3,
    },
    videoTag: {
      position: "absolute", bottom: 6, left: 6,
      width: 16, height: 16, borderRadius: 8,
      alignItems: "center", justifyContent: "center",
    },
    addMediaBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 8, paddingVertical: 13, borderRadius: 10, borderWidth: 1, borderStyle: "dashed",
    },
    addMediaText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  });
}
